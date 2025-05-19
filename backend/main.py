"""
Main FastAPI application for MentorMe Assessment API
This module sets up and configures the FastAPI application for the assessment system
"""
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from . import __version__
from .database import get_db
from .models import (
    Question, User, Answer, Domain, UserDomainProgress, 
    School, Subscription, AnswerFeedback
)
from .loader import (
    load_questions, get_distinct_domains, get_domain_stats,
    get_random_question, get_next_assessment_question,
    submit_answer_and_update, generate_learning_path
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("mentorme.api")

# Create FastAPI app
app = FastAPI(
    title="MentorMe Assessment API",
    description="API for the MentorMe adaptive assessment system",
    version=__version__
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for requests and responses
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

# API routes
@app.get("/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
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
        raise HTTPException(status_code=404, detail="Domain not found")
    return stats

@app.post("/assessments/start", response_model=QuestionResponse)
async def start_assessment(
    request: AssessmentStart,
    db: Session = Depends(get_db)
):
    """Start a new assessment in the specified domain"""
    # Validate domain
    domains = get_distinct_domains(db)
    if request.domain not in domains:
        raise HTTPException(status_code=404, detail="Domain not found")
    
    # Get first question
    question = get_next_assessment_question(
        db=db,
        user_id=request.user_id,
        domain=request.domain,
        prev_answers=[]
    )
    
    if not question:
        raise HTTPException(status_code=404, detail="No questions available for this domain")
    
    # Convert to response format
    return {
        "id": question.id,
        "question": question.question,
        "domain": question.domain,
        "sub_domain": question.sub_domain,
        "difficulty": question.difficulty,
        "q_type": question.q_type.value,
        "options": question.options,
        "hints": question.hints,
        "time_limit": question.time_limit
    }

@app.post("/assessments/answer", response_model=AnswerResponse)
async def submit_assessment_answer(
    request: AnswerSubmission,
    db: Session = Depends(get_db)
):
    """Submit an answer to an assessment question"""
    # Record answer
    feedback = submit_answer_and_update(
        db=db,
        user_id=request.user_id,
        question_id=request.question_id,
        answer=request.answer,
        time_taken=request.time_taken
    )
    
    if not feedback:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Get user's recent answers in this domain
    recent_answers = (
        db.query(Answer)
        .join(Question)
        .filter(
            Answer.user_id == request.user_id,
            Question.domain == feedback.domain
        )
        .order_by(Answer.created_at.desc())
        .limit(15)  # We only need the last 15 answers
        .all()
    )
    
    # Convert to expected format for get_next_assessment_question
    prev_answers = [
        {
            "question_id": answer.question_id,
            "is_correct": answer.is_correct
        } 
        for answer in recent_answers
    ]
    
    # Get next question if assessment isn't complete
    next_question = get_next_assessment_question(
        db=db,
        user_id=request.user_id,
        domain=feedback.domain,
        prev_answers=prev_answers
    )
    
    next_question_response = None
    assessment_complete = next_question is None
    
    if next_question:
        next_question_response = {
            "id": next_question.id,
            "question": next_question.question,
            "domain": next_question.domain,
            "sub_domain": next_question.sub_domain,
            "difficulty": next_question.difficulty,
            "q_type": next_question.q_type.value,
            "options": next_question.options,
            "hints": next_question.hints,
            "time_limit": next_question.time_limit
        }
    
    # Prepare response
    response = {
        "is_correct": feedback.is_correct,
        "correct_answer": feedback.correct_answer,
        "explanation": feedback.explanation,
        "points_earned": feedback.points_earned,
        "message": feedback.message,
        "next_difficulty": feedback.next_difficulty,
        "next_question": next_question_response,
        "assessment_complete": assessment_complete
    }
    
    return response

@app.get("/users/{user_id}/progress", response_model=UserProgress)
async def get_user_progress(user_id: int, db: Session = Depends(get_db)):
    """Get progress for a user across all domains"""
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get progress records
    progress_records = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == user_id
    ).all()
    
    # Get answer statistics
    total_answers = db.query(Answer).filter(Answer.user_id == user_id).count()
    correct_answers = db.query(Answer).filter(
        Answer.user_id == user_id,
        Answer.is_correct.is_(True)
    ).count()
    
    # Calculate accuracy
    accuracy = 0.0
    if total_answers > 0:
        accuracy = (correct_answers / total_answers) * 100
    
    # Get latest activity timestamp
    latest_activity = None
    latest_answer = db.query(Answer).filter(
        Answer.user_id == user_id
    ).order_by(Answer.created_at.desc()).first()
    
    if latest_answer:
        latest_activity = latest_answer.created_at
    else:
        latest_activity = datetime.utcnow()
    
    # Build domain data
    domains_data = {}
    for progress in progress_records:
        domains_data[progress.domain] = {
            "current_level": progress.current_level,
            "highest_difficulty": progress.highest_difficulty,
            "questions_attempted": progress.questions_attempted,
            "questions_correct": progress.questions_correct,
            "accuracy": progress.accuracy,
            "total_points": progress.total_points,
            "last_activity": progress.last_activity.isoformat()
        }
    
    return {
        "user_id": user_id,
        "domains": domains_data,
        "total_points": user.total_points,
        "total_questions_answered": total_answers,
        "total_correct": correct_answers,
        "accuracy": accuracy,
        "last_active": latest_activity
    }

@app.get("/users/{user_id}/learning-path", response_model=LearningPathResponse)
async def get_learning_path(user_id: int, db: Session = Depends(get_db)):
    """Get a personalized learning path for a user"""
    # Generate learning path
    learning_path = generate_learning_path(db, user_id)
    
    return learning_path.to_dict()

@app.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    school_id: Optional[int] = None,
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get leaderboard data"""
    query = db.query(
        User.id,
        User.username,
        User.total_points,
        User.school_id,
        School.name.label("school_name")
    ).join(
        School, User.school_id == School.id, isouter=True
    )
    
    if school_id:
        query = query.filter(User.school_id == school_id)
    
    # Order by points and limit
    users = query.order_by(User.total_points.desc()).limit(limit).all()
    
    # Calculate ranks and levels
    result = []
    for i, user in enumerate(users):
        # Simple level calculation (adjust as needed)
        level = 1
        if user.total_points >= 2500:
            level = 6  # Master Lead Teacher
        elif user.total_points >= 1500:
            level = 5  # Lead Teacher
        elif user.total_points >= 800:
            level = 4  # Associate Teacher
        elif user.total_points >= 300:
            level = 3  # Assistant Teacher
        elif user.total_points >= 100:
            level = 2  # Teacher in Training
        
        result.append({
            "user_id": user.id,
            "username": user.username,
            "points": user.total_points,
            "level": level,
            "rank": i + 1,
            "school_id": user.school_id,
            "school_name": user.school_name
        })
    
    return result