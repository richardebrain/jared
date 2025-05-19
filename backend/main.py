"""
Main FastAPI application for MentorMe Assessment API
This module sets up and configures the FastAPI application for the assessment system
"""
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from . import __version__
from .database import get_db
from .loader import (
    get_distinct_domains, get_domain_stats, get_next_assessment_question,
    submit_answer_and_update, generate_learning_path
)
from .models import UserAnswer, UserDomainProgress, User, School

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("mentorme.api")

# Create FastAPI app
app = FastAPI(
    title="MentorMe Assessment API",
    description="API for the MentorMe assessment system for preschool teachers",
    version=__version__
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API requests and responses
class HealthCheck(BaseModel):
    """Health check response"""
    status: str
    version: str
    timestamp: datetime


class DomainStats(BaseModel):
    """Domain statistics"""
    total_questions: int
    difficulty_distribution: Dict[int, int]
    sub_domains: Optional[List[str]] = None


class AssessmentStart(BaseModel):
    """Assessment start request"""
    domain: str
    user_id: int


class AnswerSubmission(BaseModel):
    """Answer submission request"""
    question_id: int
    answer: str
    user_id: int
    time_taken: Optional[int] = None


class QuestionResponse(BaseModel):
    """Question response model"""
    id: int
    question: str
    domain: str
    sub_domain: Optional[str] = None
    difficulty: int
    q_type: str
    options: Dict[str, str]
    hints: Optional[List[str]] = None
    time_limit: Optional[int] = None


class AnswerResponse(BaseModel):
    """Answer response model"""
    is_correct: bool
    correct_answer: str
    explanation: Optional[str] = None
    points_earned: int
    message: str
    next_difficulty: int
    next_question: Optional[QuestionResponse] = None
    assessment_complete: bool = False


class UserProgress(BaseModel):
    """User progress model"""
    user_id: int
    domains: Dict[str, Dict[str, Any]]
    total_points: int
    total_questions_answered: int
    total_correct: int
    accuracy: float
    last_active: datetime


class LearningPathResponse(BaseModel):
    """Learning path response model"""
    user_id: int
    questions_asked: int
    questions_correct: int
    strongest_domain: str
    weakest_domain: str
    user_name: str
    total_points_earned: int
    recommendations: List[Dict[str, Any]]


class LeaderboardEntry(BaseModel):
    """Leaderboard entry model"""
    user_id: int
    username: str
    points: int
    level: int
    rank: int
    school_id: Optional[int] = None
    school_name: Optional[str] = None


# API endpoints
@app.get("/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": __version__,
        "timestamp": datetime.utcnow()
    }


@app.get("/domains", response_model=List[str])
async def get_domains(db: Session = Depends(get_db)):
    """Get all available domains"""
    return get_distinct_domains(db)


@app.get("/domains/{domain}/stats", response_model=DomainStats)
async def domain_statistics(domain: str, db: Session = Depends(get_db)):
    """Get statistics for a domain"""
    stats = get_domain_stats(db, domain)
    if not stats:
        raise HTTPException(status_code=404, detail=f"Domain '{domain}' not found")
    return stats


@app.post("/assessments/start", response_model=QuestionResponse)
async def start_assessment(
    request: AssessmentStart,
    db: Session = Depends(get_db)
):
    """Start a new assessment in the specified domain"""
    # Verify user exists
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User not found: {request.user_id}")
    
    # Check if the user's school has an active subscription
    if not user.school_id:
        raise HTTPException(status_code=403, detail="User is not associated with a school")

    school = db.query(School).filter(School.id == user.school_id).first()
    if not school:
        raise HTTPException(status_code=404, detail=f"School not found: {user.school_id}")
    
    # Allow default school (Raising Arizona) to bypass subscription check
    if not school.is_default:
        # Check if school has active subscription
        has_active_subscription = db.query(School).join(
            School.subscriptions
        ).filter(
            School.id == user.school_id,
            School.subscriptions.any(is_active=True)
        ).first()
        
        if not has_active_subscription:
            raise HTTPException(
                status_code=403, 
                detail="Your school does not have an active subscription"
            )
    
    # Get the first question
    question = get_next_assessment_question(db, request.user_id, request.domain, [])
    if not question:
        raise HTTPException(
            status_code=404, 
            detail=f"No questions available for domain: {request.domain}"
        )
    
    return question.to_dict()


@app.post("/assessments/submit", response_model=AnswerResponse)
async def submit_assessment_answer(
    request: AnswerSubmission,
    db: Session = Depends(get_db)
):
    """Submit an answer to an assessment question"""
    # Verify user exists
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User not found: {request.user_id}")
    
    # Submit the answer and get feedback
    feedback = submit_answer_and_update(
        db, request.user_id, request.question_id, request.answer, request.time_taken
    )
    
    if not feedback:
        raise HTTPException(status_code=404, detail=f"Question not found: {request.question_id}")
    
    # If assessment not complete, get the next question
    if not feedback.assessment_complete:
        # Get user's previous answers for this domain
        previous_answers = db.query(UserAnswer).join(
            UserAnswer.question
        ).filter(
            UserAnswer.user_id == request.user_id,
            UserAnswer.question.has(domain=feedback.domain)
        ).all()
        
        # Convert to list of dicts
        prev_answer_dicts = [
            {
                "question_id": ans.question_id, 
                "is_correct": ans.is_correct
            } 
            for ans in previous_answers
        ]
        
        # Get next question
        next_question = get_next_assessment_question(
            db, request.user_id, feedback.domain, prev_answer_dicts
        )
        
        if next_question:
            feedback.next_question = next_question
    
    return feedback.to_dict()


@app.get("/users/{user_id}/progress", response_model=UserProgress)
async def get_user_progress(user_id: int, db: Session = Depends(get_db)):
    """Get progress for a user across all domains"""
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User not found: {user_id}")
    
    # Get all progress records for this user
    progress_records = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == user_id
    ).all()
    
    # Get total answers and correct answers
    total_answers = db.query(UserAnswer).filter(
        UserAnswer.user_id == user_id
    ).count()
    
    total_correct = db.query(UserAnswer).filter(
        UserAnswer.user_id == user_id,
        UserAnswer.is_correct == True
    ).count()
    
    # Build domains dictionary
    domains = {}
    for progress in progress_records:
        domains[progress.domain] = {
            "questions_attempted": progress.questions_attempted,
            "questions_correct": progress.questions_correct,
            "accuracy": progress.accuracy,
            "proficiency": progress.proficiency,
            "level": progress.current_level,
            "highest_difficulty": progress.highest_difficulty,
            "total_points": progress.total_points,
            "last_activity": progress.last_activity.isoformat() if progress.last_activity else None
        }
    
    # Calculate overall accuracy
    accuracy = 0
    if total_answers > 0:
        accuracy = (total_correct / total_answers) * 100
    
    # Get last activity timestamp
    last_active = user.updated_at
    if progress_records:
        latest_progress = max(progress_records, key=lambda p: p.last_activity or datetime.min)
        if latest_progress.last_activity:
            last_active = latest_progress.last_activity
    
    return {
        "user_id": user_id,
        "domains": domains,
        "total_points": user.total_points,
        "total_questions_answered": total_answers,
        "total_correct": total_correct,
        "accuracy": accuracy,
        "last_active": last_active
    }


@app.get("/users/{user_id}/learning-path", response_model=LearningPathResponse)
async def get_learning_path(user_id: int, db: Session = Depends(get_db)):
    """Get a personalized learning path for a user"""
    # Verify user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"User not found: {user_id}")
    
    # Generate learning path
    try:
        learning_path = generate_learning_path(db, user_id)
        return learning_path.to_dict()
    except Exception as e:
        logger.error(f"Error generating learning path: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    school_id: Optional[int] = None,
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get leaderboard data"""
    query = db.query(
        User.id, User.username, User.total_points, User.level, User.school_id,
        School.name.label("school_name")
    ).join(School, User.school_id == School.id, isouter=True)
    
    # Filter by school if specified
    if school_id is not None:
        query = query.filter(User.school_id == school_id)
    
    # Order by points (highest first)
    users = query.order_by(User.total_points.desc()).limit(limit).all()
    
    # Build response with ranks
    result = []
    for i, user in enumerate(users):
        result.append({
            "user_id": user.id,
            "username": user.username,
            "points": user.total_points,
            "level": user.level,
            "rank": i + 1,
            "school_id": user.school_id,
            "school_name": user.school_name if hasattr(user, "school_name") else None
        })
    
    return result