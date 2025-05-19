"""
MentorMe Assessment API - Main FastAPI application
This module provides the API endpoints for the assessment system
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
import random
import json

from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import (
    User, School, Question, Domain, Tag, UserDomainProgress, 
    AnswerFeedback, AssessmentSession
)
from backend.loader import (
    load_questions, get_distinct_domains, get_domain_stats,
    get_random_question, get_next_assessment_question,
    submit_answer_and_update, generate_learning_path,
    LearningPath
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="MentorMe Assessment API",
    description="API for the MentorMe assessment system",
    version="1.0.0"
)

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response validation

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    
class UserCreate(UserBase):
    password: str
    school_id: int
    
class UserUpdate(BaseModel):
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    
class UserRead(UserBase):
    id: int
    school_id: int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    points: int = 0
    level: int = 1
    streak: int = 0
    last_active: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class QuestionBase(BaseModel):
    question: str
    domain: str
    sub_domain: Optional[str] = None
    difficulty: int = 1
    q_type: str = "multiple_choice"
    options: Dict[str, str] = None
    explanation: Optional[str] = None
    hints: Optional[List[str]] = None
    resources: Optional[List[Dict[str, str]]] = None
    
class QuestionRead(QuestionBase):
    id: int
    correct_answer: Optional[str] = None
    time_limit: Optional[int] = None
    points: int = 10
    
    class Config:
        orm_mode = True
        
class AssessmentQuestion(BaseModel):
    id: int
    question: str
    domain: str
    sub_domain: Optional[str] = None
    difficulty: int
    q_type: str
    options: Dict[str, str]
    hints: Optional[List[str]] = None
    time_limit: Optional[int] = None
    
class AnswerSubmission(BaseModel):
    question_id: int
    answer: str
    time_taken: Optional[int] = None
    
class AnswerResponse(BaseModel):
    is_correct: bool
    correct_answer: str
    explanation: Optional[str] = None
    points_earned: int = 0
    next_difficulty: int = 1
    message: str
    next_question: Optional[AssessmentQuestion] = None
    assessment_complete: bool = False
    
class DomainStats(BaseModel):
    domain: str
    question_count: int
    difficulty_distribution: Dict[int, int]
    sub_domains: List[str]
    
class DomainProgressUpdate(BaseModel):
    domain: str
    difficulty: int = 1
    is_correct: bool
    
class AssessmentStart(BaseModel):
    domain: str
    user_id: int
    
class LearningPathResponse(BaseModel):
    user_id: int
    user_name: str
    questions_asked: int = 0
    questions_correct: int = 0
    strongest_domain: str = ""
    weakest_domain: str = ""
    recommendations: List[Dict[str, Any]] = []
    total_points_earned: int = 0
    
# API Routes

@app.get("/")
def read_root():
    """
    Root endpoint, returns a welcome message
    """
    return {
        "message": "Welcome to the MentorMe Assessment API",
        "version": "1.0.0",
        "documentation": "/docs"
    }

@app.get("/health")
def health_check():
    """
    Health check endpoint, returns the API status
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/questions", response_model=List[QuestionRead])
def get_questions(
    db: Session = Depends(get_db),
    domain: Optional[str] = None,
    difficulty: Optional[int] = None,
    limit: int = Query(10, ge=1, le=100)
):
    """
    Get a list of questions, optionally filtered by domain and difficulty
    """
    questions = load_questions(db, domain, difficulty, limit)
    return questions

@app.get("/api/domains", response_model=List[str])
def get_domains(db: Session = Depends(get_db)):
    """
    Get a list of all available domains
    """
    domains = get_distinct_domains(db)
    return domains

@app.get("/api/domains/{domain}/stats", response_model=DomainStats)
def get_domain_statistics(domain: str, db: Session = Depends(get_db)):
    """
    Get statistics for a specific domain
    """
    stats = get_domain_stats(db, domain)
    if not stats:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Domain '{domain}' not found"
        )
    return stats

@app.post("/api/assessment/start", response_model=AssessmentQuestion)
def start_assessment(
    assessment: AssessmentStart,
    db: Session = Depends(get_db)
):
    """
    Start a new assessment for a domain
    """
    # Check if domain exists
    domains = get_distinct_domains(db)
    if assessment.domain not in domains:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Domain '{assessment.domain}' not found"
        )
    
    # Create a new assessment session
    session = AssessmentSession(
        user_id=assessment.user_id,
        domain=assessment.domain,
        started_at=datetime.now()
    )
    db.add(session)
    db.commit()
    
    # Get the first question (difficulty based on user's progress)
    progress = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == assessment.user_id,
        UserDomainProgress.domain == assessment.domain
    ).first()
    
    difficulty = 1
    if progress:
        difficulty = progress.current_difficulty
    
    question = get_random_question(db, assessment.domain, difficulty)
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No questions available for domain '{assessment.domain}' at difficulty {difficulty}"
        )
    
    # Return the question without the correct answer
    question_dict = question.to_dict()
    del question_dict["correct_answer"]
    return question_dict

@app.post("/api/assessment/answer", response_model=AnswerResponse)
def submit_assessment_answer(
    answer: AnswerSubmission,
    db: Session = Depends(get_db),
    user_id: int = Query(...)
):
    """
    Submit an answer for a question and get the next question
    """
    feedback = submit_answer_and_update(
        db, user_id, answer.question_id, answer.answer, answer.time_taken
    )
    
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Question with ID {answer.question_id} not found"
        )
    
    # Get user's current assessment session
    session = db.query(AssessmentSession).filter(
        AssessmentSession.user_id == user_id,
        AssessmentSession.completed_at == None
    ).order_by(AssessmentSession.started_at.desc()).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active assessment session found"
        )
    
    # Check if assessment should continue
    assessment_complete = False
    next_question = None
    
    # Count correct answers in this session for this domain
    correct_answers = db.query(AnswerFeedback).filter(
        AnswerFeedback.user_id == user_id,
        AnswerFeedback.session_id == session.id,
        AnswerFeedback.is_correct == True
    ).count()
    
    # Count total answers in this session
    total_answers = db.query(AnswerFeedback).filter(
        AnswerFeedback.user_id == user_id,
        AnswerFeedback.session_id == session.id
    ).count()
    
    # End assessment if user has reached 10 correct answers or answered 15 questions
    if correct_answers >= 10 or total_answers >= 15:
        assessment_complete = True
        session.completed_at = datetime.now()
        session.is_passed = correct_answers >= 7  # Pass if at least 7 correct
        db.commit()
    else:
        # Get next question
        prev_answers = db.query(AnswerFeedback).filter(
            AnswerFeedback.session_id == session.id
        ).all()
        
        prev_answers_dict = [a.to_dict() for a in prev_answers]
        
        next_q = get_next_assessment_question(
            db, user_id, session.domain, prev_answers_dict
        )
        
        if next_q:
            next_q_dict = next_q.to_dict()
            del next_q_dict["correct_answer"]
            next_question = next_q_dict
        else:
            # No more questions available
            assessment_complete = True
            session.completed_at = datetime.now()
            session.is_passed = correct_answers >= 7
            db.commit()
    
    # Construct response
    response = {
        "is_correct": feedback.is_correct,
        "correct_answer": feedback.correct_answer,
        "explanation": feedback.explanation,
        "points_earned": feedback.points_earned,
        "next_difficulty": feedback.next_difficulty,
        "message": feedback.message,
        "next_question": next_question,
        "assessment_complete": assessment_complete
    }
    
    return response

@app.get("/api/learning-path/{user_id}", response_model=LearningPathResponse)
def get_user_learning_path(user_id: int, db: Session = Depends(get_db)):
    """
    Generate a personalized learning path for a user
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )
    
    learning_path = generate_learning_path(db, user_id)
    return learning_path.to_dict()

@app.get("/api/user/{user_id}/progress", response_model=Dict[str, Any])
def get_user_progress(user_id: int, db: Session = Depends(get_db)):
    """
    Get a user's progress across all domains
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )
    
    progress = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == user_id
    ).all()
    
    domains = get_distinct_domains(db)
    
    result = {
        "user_id": user_id,
        "username": user.username,
        "total_points": user.points,
        "level": user.level,
        "streak": user.streak,
        "progress": {
            domain: {
                "current_difficulty": next(
                    (p.current_difficulty for p in progress if p.domain == domain), 
                    1
                ),
                "correct_count": next(
                    (p.correct_count for p in progress if p.domain == domain), 
                    0
                ),
                "total_count": next(
                    (p.total_count for p in progress if p.domain == domain), 
                    0
                ),
                "points_earned": next(
                    (p.points_earned for p in progress if p.domain == domain), 
                    0
                ),
                "mastery_level": next(
                    (p.get_mastery_level() for p in progress if p.domain == domain), 
                    "Beginner"
                )
            } for domain in domains
        }
    }
    
    return result

@app.get("/api/leaderboard", response_model=List[Dict[str, Any]])
def get_leaderboard(
    db: Session = Depends(get_db),
    school_id: Optional[int] = None,
    limit: int = Query(10, ge=1, le=100)
):
    """
    Get the leaderboard of users with the highest points
    """
    query = db.query(User)
    
    if school_id:
        query = query.filter(User.school_id == school_id)
    
    users = query.order_by(User.points.desc()).limit(limit).all()
    
    result = [
        {
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "points": user.points,
            "level": user.level,
            "school_id": user.school_id,
            "school_name": user.school.name if user.school else None
        }
        for user in users
    ]
    
    return result

# Add more API endpoints as needed