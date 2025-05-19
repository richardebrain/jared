"""
Main API module for the MentorMe Enhanced Assessment system
This module defines the FastAPI endpoints for the assessment system
"""

import json
import random
from datetime import datetime
from typing import Dict, List, Optional, Union
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from .models import Question, Assessment, Response
from .loader import (
    load_random_question, 
    get_domains,
    get_question_by_id,
    get_next_difficulty_level,
    get_domain_questions_count,
    get_question_difficulty_distribution
)

# Pydantic models for API requests and responses
class AssessmentStartRequest(BaseModel):
    user_id: int

class QuestionResponse(BaseModel):
    id: int
    question: str
    q_type: str
    options: Dict[str, str]
    domain: str
    difficulty: int

class AnswerSubmission(BaseModel):
    question_id: int
    user_answer: str
    time_taken_ms: Optional[int] = None

class AssessmentHistoryItem(BaseModel):
    question_id: int
    domain: str
    correct: bool
    difficulty: int

class NextQuestionRequest(BaseModel):
    assessment_id: int
    history: List[AssessmentHistoryItem]

class LearningPathResponse(BaseModel):
    learning_path: Dict[str, List[str]]
    domain_scores: Dict[str, float]
    questions_asked: int
    questions_correct: int
    strongest_domain: str
    weakest_domain: str

# Define response message templates for personalized feedback
CORRECT_ANSWER_MESSAGES = [
    "Great job! You got it right!",
    "Excellent! That's the correct answer!",
    "Fantastic work! You answered correctly!",
    "Perfect! You understand this concept well!",
    "Outstanding! That's exactly right!",
    "Spot on! Great understanding!",
    "You nailed it! Excellent knowledge!",
    "Correct! You're doing great!",
    "That's right! Excellent choice!",
    "Well done! You selected the right answer!"
]

INCORRECT_ANSWER_MESSAGES = [
    "Not quite right, but that's how we learn!",
    "That's not correct, let's review this concept.",
    "Not the right answer, but good try!",
    "Not quite, but don't worry - this is a learning process.",
    "That wasn't the right choice, but keep going!",
    "Not correct this time, but you're still making progress.",
    "That's not the answer we're looking for, but keep trying!",
    "Not quite right, but each attempt helps you learn!",
    "That's incorrect, but mistakes are part of learning.",
    "Not the right answer, but great effort!"
]

PERSONALIZED_COMPLIMENTS = [
    "{name}, your understanding of this topic is impressive!",
    "You're really grasping these concepts well, {name}!",
    "{name}, your dedication to learning is showing!",
    "Excellent critical thinking, {name}!",
    "Your knowledge is growing stronger with each question, {name}!",
    "{name}, you're showing great progress in understanding this material!",
    "You're developing a solid foundation in this area, {name}!",
    "{name}, your thoughtful approach to these questions is excellent!",
    "Your focus and determination are paying off, {name}!",
    "Impressive work navigating these challenges, {name}!"
]

# API implementation functions
async def startup_event():
    """Initialize database on startup"""
    from .database import Base, engine
    Base.metadata.create_all(bind=engine)

def read_root():
    """Root endpoint"""
    return {"message": "MentorMe Enhanced Assessment API"}

def start_assessment(request: AssessmentStartRequest, db: Session):
    """Start a new assessment for a user"""
    assessment = Assessment(
        user_id=request.user_id,
        started_at=datetime.utcnow().isoformat(),
        questions_asked=0,
        questions_correct=0,
        domain_scores=json.dumps({})
    )
    
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    return assessment.id

def next_question(request: NextQuestionRequest, db: Session):
    """Get the next question based on assessment history"""
    # Get assessment by ID
    assessment = db.query(Assessment).filter(Assessment.id == request.assessment_id).first()
    
    if not assessment:
        return {"status": "error", "message": "Assessment not found"}
    
    if assessment.completed_at:
        return {"status": "completed", "message": "Assessment already completed"}
    
    # Get the list of all domains
    all_domains = get_domains(db)
    
    # Get question IDs that have already been asked
    asked_question_ids = [item.question_id for item in request.history]
    
    # Special case for first question
    if not request.history:
        # First question should be from Core Values 
        domain = "Core Values" if "Core Values" in all_domains else all_domains[0]
        difficulty = 1
        
        question = load_random_question(db, domain, difficulty)
        if question:
            return format_question(question)
        else:
            # If no questions in Core Values, try any domain
            question = load_random_question(db, None, 1, asked_question_ids)
            if question:
                return format_question(question)
            else:
                return {"status": "error", "message": "No questions available"}
    
    # Analyze history to determine next domain and difficulty
    domain_progress = {}
    domain_correct = {}
    domain_difficulty = {}
    
    for item in request.history:
        domain = item.domain
        if domain not in domain_progress:
            domain_progress[domain] = 0
            domain_correct[domain] = 0
            domain_difficulty[domain] = item.difficulty
        
        domain_progress[domain] += 1
        if item.correct:
            domain_correct[domain] += 1
        
        # Update current difficulty for this domain
        domain_difficulty[domain] = item.difficulty
    
    # Determine if we should continue with the current domain or switch
    current_domain = request.history[-1].domain
    current_difficulty = domain_difficulty[current_domain]
    
    # Special cases for Core Values and Mindful Morning
    if current_domain in ["Core Values", "Mindful Morning"]:
        if domain_progress.get(current_domain, 0) >= 5:
            # After 5 questions in these domains, move to next domain
            domains_to_try = [d for d in all_domains if d not in ["Core Values", "Mindful Morning"]]
            if domains_to_try:
                # Move to Child Development or another domain
                next_domain = domains_to_try[0]
                next_difficulty = 1
            else:
                # If no other domains, finish assessment
                return {"status": "completed", "message": "Assessment completed"}
        else:
            # Continue with current domain for Core Values and Mindful Morning
            next_domain = current_domain
            next_difficulty = current_difficulty
    else:
        # For other domains, check if we've asked enough questions
        questions_in_domain = domain_progress.get(current_domain, 0)
        questions_correct = domain_correct.get(current_domain, 0)
        
        if questions_correct >= 10:
            # User is proficient in this domain, move to next
            domains_completed = [d for d in domain_progress.keys() 
                                if d not in ["Core Values", "Mindful Morning"] 
                                and domain_correct.get(d, 0) >= 10]
            
            domains_to_try = [d for d in all_domains 
                             if d not in domains_completed 
                             and d not in ["Core Values", "Mindful Morning"]]
            
            if domains_to_try:
                next_domain = domains_to_try[0]
                next_difficulty = 1
            elif "Mindful Morning" in all_domains and "Mindful Morning" not in domain_progress:
                next_domain = "Mindful Morning"
                next_difficulty = 1
            else:
                # All domains completed, finish assessment
                return {"status": "completed", "message": "Assessment completed"}
        elif questions_in_domain >= 15:
            # Too many questions in this domain, move to next
            domains_started = list(domain_progress.keys())
            domains_to_try = [d for d in all_domains 
                             if d not in domains_started 
                             and d not in ["Core Values", "Mindful Morning"]]
            
            if domains_to_try:
                next_domain = domains_to_try[0]
                next_difficulty = 1
            elif "Mindful Morning" in all_domains and "Mindful Morning" not in domain_progress:
                next_domain = "Mindful Morning"
                next_difficulty = 1
            else:
                # All domains started, finish assessment
                return {"status": "completed", "message": "Assessment completed"}
        else:
            # Continue with current domain and adjust difficulty
            next_domain = current_domain
            was_last_correct = request.history[-1].correct
            next_difficulty = get_next_difficulty_level(db, next_domain, current_difficulty, was_last_correct)
    
    # Load a random question from the selected domain and difficulty
    question = load_random_question(db, next_domain, next_difficulty, asked_question_ids)
    
    # If no questions at this difficulty, try any difficulty in this domain
    if not question:
        question = load_random_question(db, next_domain, None, asked_question_ids)
    
    # If still no questions, try any domain
    if not question:
        question = load_random_question(db, None, None, asked_question_ids)
    
    # If no questions available, complete the assessment
    if not question:
        return {"status": "completed", "message": "No more questions available"}
    
    # Format the question for the response
    return format_question(question)

def submit_answer(assessment_id: int, submission: AnswerSubmission, db: Session):
    """Submit an answer for a question"""
    # Get assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise ValueError(f"Assessment with ID {assessment_id} not found")
    
    # Get question
    question = get_question_by_id(db, submission.question_id)
    if not question:
        raise ValueError(f"Question with ID {submission.question_id} not found")
    
    # Check if answer is correct
    is_correct = submission.user_answer.upper() == question.answer.upper()
    
    # Create response object
    response = Response(
        assessment_id=assessment_id,
        question_id=submission.question_id,
        user_answer=submission.user_answer.upper(),
        is_correct=is_correct,
        responded_at=datetime.utcnow().isoformat(),
        time_taken_ms=submission.time_taken_ms
    )
    
    # Update assessment stats
    assessment.questions_asked += 1
    if is_correct:
        assessment.questions_correct += 1
    
    # Update domain scores
    domain_scores = {}
    if assessment.domain_scores:
        try:
            domain_scores = json.loads(assessment.domain_scores)
        except:
            domain_scores = {}
    
    # Calculate proficiency score for this domain
    domain = question.domain
    responses = db.query(Response).join(Question).filter(
        Response.assessment_id == assessment_id,
        Question.domain == domain
    ).all()
    
    # Calculate domain score based on correct answers and difficulty levels
    if responses:
        total_questions = len(responses) + 1  # Including current response
        correct_count = sum(1 for r in responses if r.is_correct) + (1 if is_correct else 0)
        
        # Calculate weighted score based on difficulty levels
        weighted_sum = 0
        total_weight = 0
        
        for r in responses:
            q = get_question_by_id(db, r.question_id)
            if q:
                difficulty_weight = min(4, q.difficulty) or 1
                total_weight += difficulty_weight
                if r.is_correct:
                    weighted_sum += difficulty_weight
        
        # Add current response
        difficulty_weight = min(4, question.difficulty) or 1
        total_weight += difficulty_weight
        if is_correct:
            weighted_sum += difficulty_weight
        
        # Calculate weighted score and accuracy
        weighted_score = (weighted_sum / total_weight) if total_weight > 0 else 0
        accuracy = correct_count / total_questions
        
        # Combined score with higher weight on weighted score
        domain_scores[domain] = round((weighted_score * 0.7 + accuracy * 0.3) * 100, 1)
    else:
        # First answer in this domain
        domain_scores[domain] = 100.0 if is_correct else 0.0
    
    # Save domain scores
    assessment.domain_scores = json.dumps(domain_scores)
    
    # Add response and update assessment
    db.add(response)
    db.commit()
    
    # Get the next difficulty level
    current_difficulty = question.difficulty
    next_difficulty = get_next_difficulty_level(db, domain, current_difficulty, is_correct)
    
    # Generate response
    # Format feedback message
    feedback = {}
    if is_correct:
        message = random.choice(CORRECT_ANSWER_MESSAGES)
        # Add personalized compliment occasionally (1 in 3 chance)
        if random.randint(1, 3) == 1:
            user_name = get_user_name(assessment.user_id, db)
            if user_name:
                compliment = random.choice(PERSONALIZED_COMPLIMENTS).format(name=user_name)
                message = f"{message} {compliment}"
    else:
        message = random.choice(INCORRECT_ANSWER_MESSAGES)
    
    # Build feedback response
    feedback = {
        "is_correct": is_correct,
        "message": message,
        "correct_answer": question.answer,
        "next_difficulty": next_difficulty,
    }
    
    # Add explanations if available
    if question.teaching_explanation:
        feedback["explanation"] = question.teaching_explanation
    if question.story_why:
        feedback["story_why"] = question.story_why
    if question.implementation_how:
        feedback["implementation_how"] = question.implementation_how
    if question.reflection_considerations:
        feedback["reflection"] = question.reflection_considerations
    if question.child_impact_story:
        feedback["child_impact"] = question.child_impact_story
    if question.science_behind_it:
        feedback["science"] = question.science_behind_it
    if question.practical_application_strategy:
        feedback["practical_application"] = question.practical_application_strategy
    if question.why_behind_it:
        feedback["why"] = question.why_behind_it
    if question.resources:
        feedback["resources"] = question.resources
    
    return feedback

def finish_assessment(assessment_id: int, db: Session):
    """Finish an assessment and get personalized learning path"""
    # Get assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise ValueError(f"Assessment with ID {assessment_id} not found")
    
    # Mark as completed
    assessment.completed_at = datetime.utcnow().isoformat()
    
    # Generate personalized learning path
    domain_scores = {}
    if assessment.domain_scores:
        try:
            domain_scores = json.loads(assessment.domain_scores)
        except:
            domain_scores = {}
    
    # Generate learning path based on domain scores
    learning_path = {}
    
    # Get strongest and weakest domains
    if domain_scores:
        strongest_domain = max(domain_scores.items(), key=lambda x: x[1])[0]
        weakest_domain = min(domain_scores.items(), key=lambda x: x[1])[0]
    else:
        strongest_domain = ""
        weakest_domain = ""
    
    # Generate personalized recommendations for each domain
    for domain, score in domain_scores.items():
        recommendations = generate_domain_recommendations(db, domain)
        learning_path[domain] = recommendations
    
    # Store learning path in assessment
    assessment.learning_path = json.dumps(learning_path)
    db.commit()
    
    # Return learning path and assessment results
    return LearningPathResponse(
        learning_path=learning_path,
        domain_scores=domain_scores,
        questions_asked=assessment.questions_asked,
        questions_correct=assessment.questions_correct,
        strongest_domain=strongest_domain,
        weakest_domain=weakest_domain
    )

def format_question(question: Question) -> QuestionResponse:
    """Format a question for API response"""
    options = {}
    if question.option_a:
        options["A"] = question.option_a
    if question.option_b:
        options["B"] = question.option_b
    if question.option_c:
        options["C"] = question.option_c
    if question.option_d:
        options["D"] = question.option_d
    
    return QuestionResponse(
        id=question.id,
        question=question.question_text,
        q_type=question.q_type or "mcq",
        options=options,
        domain=question.domain,
        difficulty=question.difficulty or 1
    )

def generate_domain_recommendations(db: Session, domain: str) -> List[str]:
    """Generate resource recommendations for a domain"""
    # Placeholder recommendations based on domain
    if domain == "Core Values":
        return [
            "Read the 'Core Values Handbook' in the Resource Library",
            "Watch the video 'Living Our Values Every Day'",
            "Practice implementing one core value each day this week",
            "Discuss a core value implementation with a peer teacher"
        ]
    elif domain == "Child Development":
        return [
            "Review the developmental milestones chart for your age group",
            "Watch 'Understanding Children's Brain Development' in the video library",
            "Practice age-appropriate activities for different developmental domains",
            "Track development progress for children in your classroom"
        ]
    elif domain == "Building a Human":
        return [
            "Read 'The Developing Mind' article in the Resource Library",
            "Watch the 'Emotional Intelligence Development' video series",
            "Practice emotional coaching techniques with children",
            "Implement mindfulness activities in your daily routine"
        ]
    elif domain == "Mindful Morning":
        return [
            "Follow the 'Mindful Morning' structured routine guide",
            "Practice 5-minute meditation before class starts",
            "Implement calm-down corner with appropriate resources",
            "Use mindful transition strategies between activities"
        ]
    else:
        # Generic recommendations for other domains
        return [
            f"Complete the {domain} training module",
            f"Watch a video from the {domain} collection",
            f"Practice implementing {domain} concepts daily",
            f"Discuss {domain} strategies with your mentor"
        ]

def get_user_name(user_id: int, db: Session) -> Optional[str]:
    """Get the user's first name for personalized messages"""
    # This would connect to your user database
    # For now, returning a generic name
    return "Teacher"