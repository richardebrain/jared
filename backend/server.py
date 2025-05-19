"""
FastAPI server module for the assessment system
"""

import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from .database import get_db
from .loader import (
    get_domains, 
    load_random_question,
    get_question_by_id,
    get_random_question_with_adaptive_difficulty,
    generate_answer_feedback,
    AnswerFeedback,
    LearningPath,
    QuestionResponse
)
from .models import Assessment, UserPerformance

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("server")

# Create FastAPI app
app = FastAPI(
    title="MentorMe Enhanced Assessment API",
    description="API for adaptive assessment system for early childhood educators",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API requests/responses
class AssessmentStart(BaseModel):
    """Start assessment request"""
    user_id: int
    domain: Optional[str] = None

class AnswerSubmission(BaseModel):
    """Answer submission request"""
    assessment_id: int
    question_id: int
    answer: str
    time_taken_ms: Optional[int] = None

class QuestionRequest(BaseModel):
    """Request for a question in the assessment"""
    assessment_id: int
    exclude_ids: List[int] = []

class AssessmentResult(BaseModel):
    """Assessment results response"""
    assessment_id: int
    user_id: int
    score: float
    questions_asked: int
    questions_correct: int
    domain_scores: Dict[str, float]
    strongest_domain: Optional[str] = None
    weakest_domain: Optional[str] = None
    duration_seconds: Optional[int] = None
    points_earned: int = 0

class AnswerResponse(BaseModel):
    """Response for an answer submission"""
    feedback: Dict[str, Any]
    is_complete: bool = False
    next_question: Optional[Dict[str, Any]] = None
    points_earned: int = 0

# API routes
@app.get("/")
def read_root():
    """Root endpoint"""
    return {"message": "MentorMe Enhanced Assessment API"}

@app.get("/api/domains")
def get_all_domains(db: Session = Depends(get_db)):
    """Get all available domains"""
    domains = get_domains(db)
    return {"domains": domains}

@app.post("/api/assessment/start")
def start_assessment(
    request: AssessmentStart,
    db: Session = Depends(get_db)
):
    """Start a new assessment"""
    # Create new assessment in database
    assessment = Assessment(
        user_id=request.user_id,
        start_time=datetime.now(),
        questions_asked=0,
        questions_correct=0
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    # If domain specified, return first question in that domain
    if request.domain:
        question = load_random_question(db, domain=request.domain, difficulty=1)
        if not question:
            raise HTTPException(
                status_code=404,
                detail=f"No questions found for domain: {request.domain}"
            )
        
        return {
            "assessment_id": assessment.id,
            "question": QuestionResponse(
                id=question.id,
                question=question.question,
                q_type=question.q_type,
                options=question.get_options(),
                domain=question.domain,
                difficulty=question.difficulty,
                enhanced_content=question.get_enhanced_content()
            ).to_dict()
        }
    
    # If no domain specified, return first domain's first question
    domains = get_domains(db)
    if not domains:
        raise HTTPException(
            status_code=404,
            detail="No domains or questions found in the database"
        )
    
    question = load_random_question(db, domain=domains[0], difficulty=1)
    if not question:
        raise HTTPException(
            status_code=404,
            detail=f"No questions found for domain: {domains[0]}"
        )
    
    return {
        "assessment_id": assessment.id,
        "question": QuestionResponse(
            id=question.id,
            question=question.question,
            q_type=question.q_type,
            options=question.get_options(),
            domain=question.domain,
            difficulty=question.difficulty,
            enhanced_content=question.get_enhanced_content()
        ).to_dict()
    }

@app.post("/api/assessment/answer")
def submit_answer(
    answer: AnswerSubmission,
    db: Session = Depends(get_db)
):
    """Submit an answer to a question"""
    # Get assessment
    assessment = db.query(Assessment).filter(Assessment.id == answer.assessment_id).first()
    if not assessment:
        raise HTTPException(
            status_code=404,
            detail=f"Assessment not found with ID: {answer.assessment_id}"
        )
    
    # Get question
    question = get_question_by_id(db, answer.question_id)
    if not question:
        raise HTTPException(
            status_code=404,
            detail=f"Question not found with ID: {answer.question_id}"
        )
    
    # Get user performance for this domain
    user_performance = (
        db.query(UserPerformance)
        .filter(
            UserPerformance.user_id == assessment.user_id,
            UserPerformance.domain == question.domain
        )
        .first()
    )
    
    current_difficulty = question.difficulty
    if user_performance:
        # Use highest previously achieved difficulty if available
        current_difficulty = max(current_difficulty, user_performance.highest_difficulty)
    
    # Generate feedback for the answer
    feedback = generate_answer_feedback(
        db=db,
        question=question,
        user_answer=answer.answer,
        user_id=assessment.user_id,
        domain=question.domain,
        current_difficulty=current_difficulty
    )
    
    # Record the response in the database
    response = QuestionResponse(
        assessment_id=assessment.id,
        question_id=question.id,
        user_answer=answer.answer,
        is_correct=feedback.correct,
        time_taken_ms=answer.time_taken_ms,
        difficulty=question.difficulty,
        domain=question.domain
    )
    db.add(response)
    
    # Update assessment stats
    assessment.questions_asked += 1
    if feedback.correct:
        assessment.questions_correct += 1
    
    # Calculate points (more points for higher difficulty)
    points_earned = 0
    if feedback.correct:
        points_earned = question.difficulty * 2  # 2 points per difficulty level when correct
    assessment.points_earned += points_earned
    
    db.commit()
    
    # Get previously answered question IDs
    answered_question_ids = [
        r.question_id for r in db.query(QuestionResponse.question_id)
        .filter(QuestionResponse.assessment_id == assessment.id)
        .all()
    ]
    
    # Get user's current performance score for this domain
    performance_score = 0.0
    if user_performance:
        performance_score = user_performance.get_performance_score()
    
    # Get next question based on adaptive difficulty
    next_question, domain_finished = get_random_question_with_adaptive_difficulty(
        db=db,
        domain=question.domain,
        user_performance=performance_score,
        exclude_ids=answered_question_ids
    )
    
    # Check if we should move to next domain
    if domain_finished:
        # Try to find next domain
        domains = get_domains(db)
        current_domain_index = domains.index(question.domain) if question.domain in domains else -1
        
        # If there are more domains, move to the next one
        if current_domain_index < len(domains) - 1:
            next_domain = domains[current_domain_index + 1]
            next_question, _ = get_random_question_with_adaptive_difficulty(
                db=db,
                domain=next_domain,
                user_performance=0.5,  # Start at middle difficulty for new domain
                exclude_ids=answered_question_ids
            )
        else:
            # All domains completed, end assessment
            assessment.completed = True
            assessment.end_time = datetime.now()
            db.commit()
            
            # Calculate results
            domain_scores = assessment.get_domain_scores(db)
            strongest_domain = assessment.get_strongest_domain(db)
            weakest_domain = assessment.get_weakest_domain(db)
            
            # Generate learning path
            learning_path = generate_learning_path(
                db=db,
                assessment=assessment,
                domain_scores=domain_scores,
                strongest_domain=strongest_domain,
                weakest_domain=weakest_domain
            )
            
            return {
                "feedback": feedback.to_dict(),
                "is_complete": True,
                "learning_path": learning_path.to_dict(),
                "points_earned": points_earned
            }
    
    # Return feedback and next question
    if next_question:
        return {
            "feedback": feedback.to_dict(),
            "is_complete": False,
            "next_question": QuestionResponse(
                id=next_question.id,
                question=next_question.question,
                q_type=next_question.q_type,
                options=next_question.get_options(),
                domain=next_question.domain,
                difficulty=next_question.difficulty,
                enhanced_content=next_question.get_enhanced_content()
            ).to_dict(),
            "points_earned": points_earned
        }
    else:
        # No more questions, end assessment
        assessment.completed = True
        assessment.end_time = datetime.now()
        db.commit()
        
        # Calculate results
        domain_scores = assessment.get_domain_scores(db)
        strongest_domain = assessment.get_strongest_domain(db)
        weakest_domain = assessment.get_weakest_domain(db)
        
        # Generate learning path
        learning_path = generate_learning_path(
            db=db,
            assessment=assessment,
            domain_scores=domain_scores,
            strongest_domain=strongest_domain,
            weakest_domain=weakest_domain
        )
        
        return {
            "feedback": feedback.to_dict(),
            "is_complete": True,
            "learning_path": learning_path.to_dict(),
            "points_earned": points_earned
        }

@app.get("/api/assessment/{assessment_id}/result")
def get_assessment_result(
    assessment_id: int,
    db: Session = Depends(get_db)
):
    """Get the results of a completed assessment"""
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(
            status_code=404,
            detail=f"Assessment not found with ID: {assessment_id}"
        )
    
    if not assessment.completed:
        raise HTTPException(
            status_code=400,
            detail="Assessment is not yet completed"
        )
    
    # Calculate domain scores
    domain_scores = assessment.get_domain_scores(db)
    strongest_domain = assessment.get_strongest_domain(db)
    weakest_domain = assessment.get_weakest_domain(db)
    
    return {
        "assessment_id": assessment.id,
        "user_id": assessment.user_id,
        "score": assessment.get_score(),
        "questions_asked": assessment.questions_asked,
        "questions_correct": assessment.questions_correct,
        "domain_scores": domain_scores,
        "strongest_domain": strongest_domain,
        "weakest_domain": weakest_domain,
        "duration_seconds": assessment.get_duration_seconds(),
        "points_earned": assessment.points_earned
    }

@app.get("/api/assessment/user/{user_id}")
def get_user_assessments(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get all assessments for a user"""
    assessments = db.query(Assessment).filter(Assessment.user_id == user_id).all()
    
    results = []
    for assessment in assessments:
        # Skip assessments that aren't completed
        if not assessment.completed:
            continue
            
        # Calculate domain scores
        domain_scores = assessment.get_domain_scores(db)
        strongest_domain = assessment.get_strongest_domain(db)
        weakest_domain = assessment.get_weakest_domain(db)
        
        results.append({
            "assessment_id": assessment.id,
            "user_id": assessment.user_id,
            "score": assessment.get_score(),
            "questions_asked": assessment.questions_asked,
            "questions_correct": assessment.questions_correct,
            "domain_scores": domain_scores,
            "strongest_domain": strongest_domain,
            "weakest_domain": weakest_domain,
            "duration_seconds": assessment.get_duration_seconds(),
            "points_earned": assessment.points_earned,
            "completed_at": assessment.end_time
        })
    
    return results

def generate_learning_path(
    db: Session,
    assessment: Assessment,
    domain_scores: Dict[str, float],
    strongest_domain: Optional[str],
    weakest_domain: Optional[str]
) -> LearningPath:
    """Generate a learning path based on assessment results"""
    # Simple learning path generation based on domain scores
    learning_path = {}
    
    # For each domain, recommend different resources based on score
    for domain, score in domain_scores.items():
        if score < 40:
            # Basic level resources
            learning_path[domain] = [
                f"Foundations of {domain} mini-course",
                f"{domain} essentials video series",
                f"Introduction to {domain} practice guide"
            ]
        elif score < 70:
            # Intermediate resources
            learning_path[domain] = [
                f"Advancing your {domain} skills workshop",
                f"Case studies in {domain}",
                f"Practical applications of {domain} theory"
            ]
        else:
            # Advanced resources
            learning_path[domain] = [
                f"Master class in {domain}",
                f"Advanced research in {domain}",
                f"Mentoring others in {domain}"
            ]
    
    # Get user's name if available
    user_name = get_user_name(db, assessment.user_id)
    
    return LearningPath(
        learning_path=learning_path,
        domain_scores=domain_scores,
        questions_asked=assessment.questions_asked,
        questions_correct=assessment.questions_correct,
        strongest_domain=strongest_domain or "",
        weakest_domain=weakest_domain or "",
        user_name=user_name,
        total_points_earned=assessment.points_earned
    )

def get_user_name(db: Session, user_id: int) -> Optional[str]:
    """Get user's name from the database if available"""
    # This would normally query the users table, but for this API we'll return None
    # The frontend can display the user's name if available
    return None