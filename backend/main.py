"""
Main API module for the MentorMe Enhanced Assessment system
This module defines the FastAPI endpoints for the assessment system
"""

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from sqlalchemy import desc, and_, or_
import random
import json
from typing import List, Dict, Optional, Any, Union
from datetime import datetime
from pydantic import BaseModel

from .database import get_db, setup_database
from .models import Assessment, Question, Answer, User, LearningResource
from . import loader

# ========== Request and Response Models ==========

class AssessmentStartRequest(BaseModel):
    user_id: int

class QuestionResponse(BaseModel):
    id: int
    question: str
    q_type: str
    options: Dict[str, str]
    domain: str
    difficulty: int
    enhanced_content: Optional[Dict[str, str]] = None

class AnswerSubmission(BaseModel):
    question_id: int
    user_answer: str
    time_taken_ms: Optional[int] = None

class AnswerFeedback(BaseModel):
    correct: bool
    correct_answer: str
    personal_message: str
    teaching_explanation: str

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
    user_name: Optional[str] = None
    total_points_earned: int = 10  # Default points for completing assessment

# ========== Domain-Specific Constants ==========

# Limit of questions per domain (except for special domains like Core Values)
MAX_QUESTIONS_PER_DOMAIN = 15

# Special domains with fixed number of questions
SPECIAL_DOMAINS = {
    "Core Values": 5,
    "Mindful Morning": 5,
    "Building a Human": 10
}

# Proficiency threshold (number of correct answers to be considered proficient)
PROFICIENCY_THRESHOLD = 10

# Compliments for correct answers
CORRECT_ANSWER_COMPLIMENTS = [
    "Excellent work, {name}! That's exactly right!",
    "Fantastic, {name}! You've got a solid understanding of this concept.",
    "Perfect answer, {name}! Your knowledge is impressive.",
    "That's correct, {name}! You're demonstrating great expertise.",
    "Well done, {name}! You really know your stuff.",
    "Spot on, {name}! Your understanding of this topic is excellent.",
    "You nailed it, {name}! Great job!",
    "Absolutely right, {name}! Your knowledge is growing stronger.",
    "That's the right answer, {name}! Keep up the great work!",
    "Awesome work, {name}! Your understanding is impressive."
]

# Encouraging messages for incorrect answers
INCORRECT_ANSWER_MESSAGES = [
    "That's not quite right, {name}, but it's a great learning opportunity!",
    "Not exactly, {name}, but don't worry - we learn most from our mistakes!",
    "That wasn't the correct answer, {name}, but you're making progress by learning this!",
    "Not quite, {name}, but remember that each mistake helps reinforce the right answer.",
    "That wasn't right, {name}, but now you have a chance to expand your knowledge!",
    "Almost, {name}! Let's review the correct answer together.",
    "Not correct, {name}, but let's use this as a learning moment.",
    "That's not the right answer, {name}, but it's all part of the learning journey!",
    "Not quite right, {name}, but every challenge helps us grow!",
    "That wasn't correct, {name}, but don't worry - learning is a process!"
]

# ========== API Functions ==========

async def startup_event():
    """Initialize database on startup"""
    setup_database()

def read_root():
    """Root endpoint"""
    return {"message": "MentorMe Enhanced Assessment API", "version": "1.0.0"}

def start_assessment(request: AssessmentStartRequest, db: Session):
    """Start a new assessment for a user"""
    # Check if user exists
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {request.user_id} not found"
        )
    
    # Create new assessment
    assessment = Assessment(
        user_id=request.user_id,
        start_time=datetime.utcnow(),
        active=True
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    return {"assessment_id": assessment.id}

def next_question(request: NextQuestionRequest, db: Session):
    """Get the next question based on assessment history"""
    # Get the assessment
    assessment = db.query(Assessment).filter(Assessment.id == request.assessment_id).first()
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assessment with ID {request.assessment_id} not found"
        )
    
    # Update questions asked count
    assessment.questions_asked = len(request.history)
    
    # Count correct answers
    correct_count = sum(1 for item in request.history if item.correct)
    assessment.questions_correct = correct_count
    
    db.commit()
    
    # Group history by domain
    domains_asked = {}
    for item in request.history:
        if item.domain not in domains_asked:
            domains_asked[item.domain] = {
                "count": 1,
                "correct": 1 if item.correct else 0,
                "current_difficulty": item.difficulty,
                "last_correct": item.correct,
                "questions": [item.question_id]
            }
        else:
            domains_asked[item.domain]["count"] += 1
            if item.correct:
                domains_asked[item.domain]["correct"] += 1
            domains_asked[item.domain]["current_difficulty"] = item.difficulty
            domains_asked[item.domain]["last_correct"] = item.correct
            domains_asked[item.domain]["questions"].append(item.question_id)
    
    # Get all available domains if we're just starting
    if not domains_asked:
        available_domains = loader.get_domains(db)
        
        # Start with Core Values domain as the first question
        if "Core Values" in available_domains:
            domain = "Core Values"
            difficulty = 1
            next_question = loader.load_random_question(db, domain, difficulty)
            
            if next_question:
                return format_question(next_question)
            
        # If Core Values not available or no questions found, pick any domain
        domain = random.choice(available_domains)
        difficulty = 1
    else:
        # Determine next domain based on the assessment strategy
        
        # Check if special domains have reached their question limit
        for domain, config in SPECIAL_DOMAINS.items():
            if domain in domains_asked and domains_asked[domain]["count"] < config:
                # Continue with this special domain
                difficulty = 1  # Always difficulty 1 for special domains
                exclude_ids = domains_asked[domain].get("questions", [])
                next_question = loader.load_random_question(db, domain, difficulty, exclude_ids)
                
                if next_question:
                    return format_question(next_question)
        
        # Check if any domain has reached proficiency
        domains_proficient = {}
        for domain, stats in domains_asked.items():
            if domain in SPECIAL_DOMAINS:
                # Skip special domains for proficiency check
                continue
            
            if stats["correct"] >= PROFICIENCY_THRESHOLD:
                domains_proficient[domain] = True
        
        # Check if all domains have reached proficiency or their question limit
        all_domains = loader.get_domains(db)
        regular_domains = [d for d in all_domains if d not in SPECIAL_DOMAINS]
        
        domains_completed = True
        for domain in regular_domains:
            if domain in domains_asked:
                # Check if domain has reached question limit or proficiency
                if (domains_asked[domain]["count"] < MAX_QUESTIONS_PER_DOMAIN and 
                    domain not in domains_proficient):
                    domains_completed = False
                    break
            else:
                # Domain not asked yet
                domains_completed = False
                break
        
        if domains_completed:
            # All domains have been completed, finish assessment
            return {"assessment_complete": True}
        
        # Get a domain that hasn't reached its question limit or proficiency
        available_domains = []
        for domain in regular_domains:
            if domain not in domains_asked:
                # New domain
                available_domains.append(domain)
            elif (domains_asked[domain]["count"] < MAX_QUESTIONS_PER_DOMAIN and 
                  domain not in domains_proficient):
                # Domain hasn't reached limit or proficiency
                available_domains.append(domain)
        
        if not available_domains:
            # No domains available, finish assessment
            return {"assessment_complete": True}
        
        # Select next domain randomly from available domains
        domain = random.choice(available_domains)
        
        # Determine difficulty level
        if domain in domains_asked:
            current_difficulty = domains_asked[domain]["current_difficulty"]
            last_correct = domains_asked[domain]["last_correct"]
            
            # Get next difficulty level based on performance
            difficulty = loader.get_next_difficulty_level(
                db, domain, current_difficulty, last_correct
            )
        else:
            # New domain, start with difficulty 1
            difficulty = 1
    
    # Get IDs of questions already asked
    exclude_ids = []
    for item in request.history:
        exclude_ids.append(item.question_id)
    
    # Get next question
    next_question = loader.load_random_question(db, domain, difficulty, exclude_ids)
    
    # If no question found with current difficulty, try any difficulty for the domain
    if not next_question:
        next_question = loader.load_random_question(db, domain, None, exclude_ids)
    
    # If still no question, try any other domain
    if not next_question:
        available_domains = loader.get_domains(db)
        for alt_domain in available_domains:
            if alt_domain != domain:
                next_question = loader.load_random_question(db, alt_domain, None, exclude_ids)
                if next_question:
                    break
    
    # If no questions available, assessment is complete
    if not next_question:
        return {"assessment_complete": True}
    
    return format_question(next_question)

def submit_answer(assessment_id: int, submission: AnswerSubmission, db: Session):
    """Submit an answer for a question"""
    # Get the assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assessment with ID {assessment_id} not found"
        )
    
    # Get the question
    question = db.query(Question).filter(Question.id == submission.question_id).first()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Question with ID {submission.question_id} not found"
        )
    
    # Check if the answer is correct
    is_correct = submission.user_answer.lower() == question.correct_answer.lower()
    
    # Create answer record
    answer = Answer(
        assessment_id=assessment_id,
        question_id=submission.question_id,
        user_answer=submission.user_answer,
        is_correct=is_correct,
        time_taken_ms=submission.time_taken_ms,
        answer_time=datetime.utcnow()
    )
    db.add(answer)
    
    # Update assessment stats
    if is_correct:
        assessment.questions_correct = Assessment.questions_correct + 1
    
    db.commit()
    
    # Get user name for personalized message
    user_name = get_user_name(assessment.user_id, db)
    
    # Generate feedback response
    if is_correct:
        personal_message = random.choice(CORRECT_ANSWER_COMPLIMENTS).format(name=user_name or "")
    else:
        personal_message = random.choice(INCORRECT_ANSWER_MESSAGES).format(name=user_name or "")
    
    # Get explanation from question if available
    teaching_explanation = question.why_behind_it or "This is important for effective teaching and child development."
    
    return AnswerFeedback(
        correct=is_correct,
        correct_answer=question.correct_answer,
        personal_message=personal_message,
        teaching_explanation=teaching_explanation
    )

def finish_assessment(assessment_id: int, db: Session):
    """Finish an assessment and get personalized learning path"""
    # Get the assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assessment with ID {assessment_id} not found"
        )
    
    # Mark assessment as complete
    assessment.active = False
    assessment.end_time = datetime.utcnow()
    
    # Award points (10 points for completing assessment)
    assessment.points_earned = 10
    
    db.commit()
    
    # Get all answers for this assessment
    answers = db.query(Answer).filter(Answer.assessment_id == assessment_id).all()
    
    # Group answers by domain
    domain_stats = {}
    for answer in answers:
        question = db.query(Question).filter(Question.id == answer.question_id).first()
        if not question:
            continue
        
        domain = question.domain
        if domain not in domain_stats:
            domain_stats[domain] = {
                "asked": 1,
                "correct": 1 if answer.is_correct else 0
            }
        else:
            domain_stats[domain]["asked"] += 1
            if answer.is_correct:
                domain_stats[domain]["correct"] += 1
    
    # Calculate scores per domain
    domain_scores = {}
    for domain, stats in domain_stats.items():
        score = (stats["correct"] / stats["asked"]) * 100 if stats["asked"] > 0 else 0
        domain_scores[domain] = round(score, 1)
    
    # Identify strongest and weakest domains
    strongest_domain = None
    weakest_domain = None
    
    if domain_scores:
        strongest_domain = max(domain_scores.items(), key=lambda x: x[1])[0]
        weakest_domain = min(domain_scores.items(), key=lambda x: x[1])[0]
    
    # Generate learning path recommendations
    learning_path = {}
    for domain, score in domain_scores.items():
        # Focus more on weaker domains
        if score < 70:
            learning_path[domain] = generate_domain_recommendations(db, domain)
    
    # If no weak domains or empty learning path, include some recommendations for all domains
    if not learning_path:
        for domain in domain_stats.keys():
            learning_path[domain] = generate_domain_recommendations(db, domain)
    
    # Get user's name for personalized message
    user_name = get_user_name(assessment.user_id, db)
    
    # Count questions and correct answers
    questions_asked = sum(stats["asked"] for stats in domain_stats.values())
    questions_correct = sum(stats["correct"] for stats in domain_stats.values())
    
    return LearningPathResponse(
        learning_path=learning_path,
        domain_scores=domain_scores,
        questions_asked=questions_asked,
        questions_correct=questions_correct,
        strongest_domain=strongest_domain or "None",
        weakest_domain=weakest_domain or "None",
        user_name=user_name,
        total_points_earned=assessment.points_earned
    )

def format_question(question: Question) -> QuestionResponse:
    """Format a question for API response"""
    enhanced_content = None
    if (question.practical_application_strategy or 
        question.why_behind_it or 
        question.classroom_examples or 
        question.citations or 
        question.resources):
        
        resources = question.resources if isinstance(question.resources, list) else []
        
        enhanced_content = {
            "practical_application": question.practical_application_strategy,
            "why_behind_it": question.why_behind_it,
            "classroom_examples": question.classroom_examples,
            "citations": question.citations,
            "resources": resources
        }
    
    return QuestionResponse(
        id=question.id,
        question=question.question,
        q_type=question.q_type,
        options=question.options,
        domain=question.domain,
        difficulty=question.difficulty,
        enhanced_content=enhanced_content
    )

def generate_domain_recommendations(db: Session, domain: str) -> List[str]:
    """Generate resource recommendations for a domain"""
    # Get learning resources for the domain from the database
    resources = db.query(LearningResource).filter(
        LearningResource.domain == domain
    ).limit(3).all()
    
    recommendations = []
    
    # Add resources from the database
    for resource in resources:
        if resource.url:
            recommendations.append(f"{resource.title} - {resource.url}")
        else:
            recommendations.append(resource.title)
    
    # If not enough resources, add some generic recommendations
    generic_recommendations = {
        "Core Values": [
            "Review the Raising Arizona core values documentation",
            "Participate in the next core values workshop",
            "Discuss core values implementation with your mentor"
        ],
        "Mindful Morning": [
            "Explore mindfulness techniques for classroom settings",
            "Try incorporating short mindfulness activities daily",
            "Review the Mindful Morning module in your training materials"
        ],
        "Building a Human": [
            "Explore child development milestones and their application",
            "Review attachment theory resources in your training materials",
            "Schedule time to observe master teachers' interactions with children"
        ],
        "Classroom Management": [
            "Review classroom setup techniques for optimal learning environments",
            "Explore strategies for managing transitions between activities",
            "Practice preventative behavior management techniques"
        ],
        "Child Development": [
            "Study age-appropriate developmental milestones and activities",
            "Explore how to support children through developmental challenges",
            "Review brain development research and its classroom applications"
        ]
    }
    
    # Add generic recommendations if needed
    if domain in generic_recommendations and len(recommendations) < 3:
        for rec in generic_recommendations[domain]:
            if rec not in recommendations:
                recommendations.append(rec)
                if len(recommendations) >= 3:
                    break
    
    # If still not enough recommendations, add general ones
    general_recommendations = [
        "Schedule a meeting with your mentor to discuss this area",
        "Observe how experienced teachers handle this area",
        "Check the resource library for books on this topic",
        "Review the training videos available on this topic"
    ]
    
    while len(recommendations) < 3:
        rec = random.choice(general_recommendations)
        if rec not in recommendations:
            recommendations.append(rec)
    
    return recommendations

def get_user_name(user_id: int, db: Session) -> Optional[str]:
    """Get the user's first name for personalized messages"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    
    return user.first_name