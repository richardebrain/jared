"""
Main API module for the MentorMe Enhanced Assessment system
This module defines the FastAPI endpoints for the assessment system
"""

import json
import random
from datetime import datetime
from typing import List, Dict, Optional, Any, Union
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from .models import Question, Assessment, Response
from .loader import (
    load_random_question, 
    get_next_difficulty_level,
    get_domains,
    get_question_by_id
)
from .database import get_db, engine, Base

# Data models for API requests and responses
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

# Initialize database on startup
async def startup_event():
    """Initialize database on startup"""
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")

# API Endpoints
def read_root():
    """Root endpoint"""
    return {"message": "MentorMe Enhanced Assessment API"}

def start_assessment(request: AssessmentStartRequest, db: Session):
    """Start a new assessment for a user"""
    # Create new assessment record
    assessment = Assessment(
        user_id=request.user_id,
        started_at=datetime.now().isoformat(),
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
    # Retrieve assessment
    assessment = db.query(Assessment).filter(Assessment.id == request.assessment_id).first()
    if not assessment:
        raise ValueError(f"Assessment {request.assessment_id} not found")
    
    # Get asked question IDs to exclude
    asked_ids = []
    domains_asked = set()
    domain_difficulty_map = {}
    
    for item in request.history:
        asked_ids.append(item.question_id)
        domains_asked.add(item.domain)
        domain_difficulty_map[item.domain] = item.difficulty
    
    # Calculate which domain to ask next
    all_domains = get_domains(db)
    remaining_domains = [d for d in all_domains if d not in domains_asked]
    
    # If there are domains we haven't asked yet, prioritize them
    if remaining_domains:
        next_domain = random.choice(remaining_domains)
        next_difficulty = 1  # Start with easiest questions for new domains
    else:
        # Choose a random domain we've already asked
        domain_scores = json.loads(assessment.domain_scores) if assessment.domain_scores else {}
        
        # Sort domains by score ascending (focus on weakest domains)
        sorted_domains = sorted(
            domains_asked, 
            key=lambda d: domain_scores.get(d, 0.5)
        )
        
        # Randomly select from the bottom half of domains (weaker areas)
        bottom_half = sorted_domains[:max(1, len(sorted_domains) // 2)]
        next_domain = random.choice(bottom_half)
        
        # Get the current difficulty for this domain
        next_difficulty = domain_difficulty_map.get(next_domain, 1)
    
    # Load a question of appropriate difficulty from the chosen domain
    question = load_random_question(
        db, domain=next_domain, difficulty=next_difficulty, exclude_ids=asked_ids
    )
    
    # If no question found with exact difficulty, try any difficulty for this domain
    if not question:
        question = load_random_question(
            db, domain=next_domain, exclude_ids=asked_ids
        )
    
    # If still no question, try a completely random question from any domain/difficulty
    if not question:
        question = load_random_question(
            db, exclude_ids=asked_ids
        )
    
    # If there are no more questions, return a completion signal
    if not question:
        return {"status": "complete", "message": "No more questions available"}
    
    # Format and return the question
    return format_question(question)

def submit_answer(assessment_id: int, submission: AnswerSubmission, db: Session):
    """Submit an answer for a question"""
    # Get assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise ValueError(f"Assessment {assessment_id} not found")
    
    # Get question
    question = db.query(Question).filter(Question.id == submission.question_id).first()
    if not question:
        raise ValueError(f"Question {submission.question_id} not found")
    
    # Check answer
    is_correct = submission.user_answer.upper() == question.answer.upper()
    
    # Update assessment stats
    assessment.questions_asked += 1
    if is_correct:
        assessment.questions_correct += 1
    
    # Update domain scores
    domain_scores = json.loads(assessment.domain_scores) if assessment.domain_scores else {}
    if question.domain not in domain_scores:
        domain_scores[question.domain] = 0
    
    # Update domain score with weighted average
    # New questions weight more than old ones for adaptive assessment
    old_score = domain_scores[question.domain]
    new_value = 1.0 if is_correct else 0.0
    
    # Determine weight based on question difficulty
    weight = min(0.3 * question.difficulty, 0.9)  # Higher weight for harder questions
    
    # Update score with weighted average
    domain_scores[question.domain] = (old_score * (1 - weight)) + (new_value * weight)
    
    # Store updated scores
    assessment.domain_scores = json.dumps(domain_scores)
    
    # Create response record
    response = Response(
        assessment_id=assessment_id,
        question_id=submission.question_id,
        user_answer=submission.user_answer.upper(),
        is_correct=is_correct,
        responded_at=datetime.now().isoformat(),
        time_taken_ms=submission.time_taken_ms
    )
    
    # Add and commit changes
    db.add(response)
    db.commit()
    
    # Calculate next difficulty level for the domain
    next_difficulty = get_next_difficulty_level(
        db, 
        question.domain, 
        question.difficulty, 
        is_correct
    )
    
    # Prepare feedback with learning resources
    feedback = {
        "is_correct": is_correct,
        "correct_answer": question.answer,
        "next_difficulty": next_difficulty,
    }
    
    if question.teaching_explanation:
        feedback["explanation"] = question.teaching_explanation
    
    if not is_correct and question.story_why:
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
        raise ValueError(f"Assessment {assessment_id} not found")
    
    # Mark assessment as completed
    assessment.completed_at = datetime.now().isoformat()
    
    # Get domain scores
    domain_scores = json.loads(assessment.domain_scores) if assessment.domain_scores else {}
    
    # Generate learning path
    learning_path = {}
    
    # Add weakest domains (scoring < 0.7) to learning path
    for domain, score in domain_scores.items():
        if score < 0.7:  # Below 70% mastery
            # Get resource recommendations for this domain
            learning_path[domain] = generate_domain_recommendations(db, domain)
    
    # Sort domains by score and get strongest/weakest
    sorted_scores = sorted(domain_scores.items(), key=lambda x: x[1])
    
    strongest_domain = sorted_scores[-1][0] if sorted_scores else "None"
    weakest_domain = sorted_scores[0][0] if sorted_scores else "None"
    
    # Store learning path
    assessment.learning_path = json.dumps(learning_path)
    
    # Commit changes
    db.commit()
    
    # Return learning path and score summary
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
    return QuestionResponse(
        id=question.id,
        question=question.question_text,
        q_type=question.q_type,
        options={
            "A": question.option_a,
            "B": question.option_b,
            "C": question.option_c,
            "D": question.option_d,
        },
        domain=question.domain,
        difficulty=question.difficulty
    )

def generate_domain_recommendations(db: Session, domain: str) -> List[str]:
    """Generate resource recommendations for a domain"""
    # This is a placeholder that would be connected to your learning content system
    # Recommendations could come from video libraries, articles, or training modules
    
    recommendations = [
        f"Complete the '{domain}' foundational training module",
        f"Watch the 5-minute expert video on '{domain}' best practices",
        f"Read the quick-reference guide for '{domain}' in the classroom"
    ]
    
    # You could get these from a database of resources
    return recommendations