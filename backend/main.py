"""
Main FastAPI application for MentorMe Assessment API
This module sets up and configures the FastAPI application for the assessment system
"""
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
import random
import logging

from fastapi import FastAPI, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from .database import get_db
from .models import Question, AnswerFeedback, LearningPathRecommendation
from .loader import (
    load_questions, 
    get_distinct_domains, 
    get_domain_stats, 
    get_random_question,
    get_next_assessment_question,
    submit_answer_and_update,
    LearningPath,
    generate_learning_path
)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("mentorme.api")

# Create FastAPI app
app = FastAPI(
    title="MentorMe Assessment API",
    description="API for adaptive assessments in early childhood education",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----- Pydantic models -----

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

# ----- Routes -----

@app.get("/api/v1/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint"""
    logger.info("Health check requested")
    return {
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": datetime.now()
    }

@app.get("/api/v1/domains", response_model=List[str])
async def get_domains(db: Session = Depends(get_db)):
    """Get all available domains"""
    logger.info("Domains list requested")
    domains = get_distinct_domains(db)
    return domains

@app.get("/api/v1/domains/{domain}/stats", response_model=DomainStats)
async def domain_statistics(domain: str, db: Session = Depends(get_db)):
    """Get statistics for a domain"""
    logger.info(f"Domain statistics requested for {domain}")
    stats = get_domain_stats(db, domain)
    if not stats:
        raise HTTPException(
            status_code=404,
            detail=f"Domain '{domain}' not found"
        )
    return stats

@app.post("/api/v1/assessments/start", response_model=QuestionResponse)
async def start_assessment(
    request: AssessmentStart,
    db: Session = Depends(get_db)
):
    """Start a new assessment in the specified domain"""
    logger.info(f"Assessment started for user {request.user_id} in domain {request.domain}")
    
    # Get initial question at level 1 difficulty
    question = get_random_question(
        db=db,
        domain=request.domain,
        difficulty=1
    )
    
    if not question:
        raise HTTPException(
            status_code=404,
            detail=f"No questions available in domain '{request.domain}'"
        )
    
    return question

@app.post("/api/v1/assessments/submit", response_model=AnswerResponse)
async def submit_assessment_answer(
    request: AnswerSubmission,
    db: Session = Depends(get_db)
):
    """Submit an answer to an assessment question"""
    logger.info(
        f"Answer submitted by user {request.user_id} for question {request.question_id}: {request.answer}"
    )
    
    result = submit_answer_and_update(
        db=db,
        user_id=request.user_id,
        question_id=request.question_id,
        answer=request.answer,
        time_taken=request.time_taken
    )
    
    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"Question with ID {request.question_id} not found"
        )
    
    # Get the current question to determine its domain
    question = db.query(Question).filter(Question.id == request.question_id).first()
    if not question:
        raise HTTPException(
            status_code=404,
            detail=f"Question with ID {request.question_id} not found"
        )
    
    # Determine if the assessment should continue or complete
    completed_questions = db.query(AnswerFeedback).filter(
        AnswerFeedback.user_id == request.user_id,
        AnswerFeedback.domain == question.domain
    ).count()
    
    # Check if we've reached 10 correct answers or 15 total questions
    correct_answers = db.query(AnswerFeedback).filter(
        AnswerFeedback.user_id == request.user_id,
        AnswerFeedback.domain == question.domain,
        AnswerFeedback.is_correct.is_(True)
    ).count()
    
    assessment_complete = completed_questions >= 15 or correct_answers >= 10
    
    response = {
        "is_correct": result.is_correct,
        "correct_answer": result.correct_answer,
        "explanation": result.explanation,
        "points_earned": result.points_earned,
        "message": result.message,
        "next_difficulty": result.next_difficulty,
        "assessment_complete": assessment_complete
    }
    
    # If assessment not complete, get next question
    if not assessment_complete:
        next_question = get_random_question(
            db=db,
            domain=question.domain,
            difficulty=result.next_difficulty,
            exclude_ids=[request.question_id]
        )
        response["next_question"] = next_question
    
    return response

@app.get("/api/v1/users/{user_id}/progress", response_model=UserProgress)
async def get_user_progress(user_id: int, db: Session = Depends(get_db)):
    """Get progress for a user across all domains"""
    logger.info(f"Progress requested for user {user_id}")
    
    # Collect progress data from the database
    domains_progress = {}
    total_points = 0
    total_answered = 0
    total_correct = 0
    
    # Get all domains where user has answered questions
    user_domains = db.query(AnswerFeedback.domain).filter(
        AnswerFeedback.user_id == user_id
    ).distinct().all()
    
    for domain_record in user_domains:
        domain = domain_record[0]
        domain_answers = db.query(AnswerFeedback).filter(
            AnswerFeedback.user_id == user_id,
            AnswerFeedback.domain == domain
        ).all()
        
        domain_total = len(domain_answers)
        domain_correct = sum(1 for a in domain_answers if a.is_correct)
        domain_points = sum(a.points_earned for a in domain_answers)
        domain_accuracy = domain_correct / domain_total if domain_total > 0 else 0
        
        # Get highest difficulty reached
        max_difficulty = max((a.difficulty for a in domain_answers), default=1)
        
        # Get last activity time
        last_activity = max((a.timestamp for a in domain_answers), default=datetime.now())
        
        domains_progress[domain] = {
            "total_questions": domain_total,
            "correct_answers": domain_correct,
            "points_earned": domain_points,
            "accuracy": domain_accuracy,
            "highest_difficulty": max_difficulty,
            "last_activity": last_activity
        }
        
        total_points += domain_points
        total_answered += domain_total
        total_correct += domain_correct
    
    # Calculate overall accuracy
    overall_accuracy = total_correct / total_answered if total_answered > 0 else 0
    
    # Get the last activity time across all domains
    last_active = datetime.now()
    if user_domains:
        all_timestamps = db.query(AnswerFeedback.timestamp).filter(
            AnswerFeedback.user_id == user_id
        ).order_by(AnswerFeedback.timestamp.desc()).first()
        
        if all_timestamps:
            last_active = all_timestamps[0]
    
    return {
        "user_id": user_id,
        "domains": domains_progress,
        "total_points": total_points,
        "total_questions_answered": total_answered,
        "total_correct": total_correct,
        "accuracy": overall_accuracy,
        "last_active": last_active
    }

@app.get("/api/v1/users/{user_id}/learning-path", response_model=LearningPathResponse)
async def get_learning_path(user_id: int, db: Session = Depends(get_db)):
    """Get a personalized learning path for a user"""
    logger.info(f"Learning path requested for user {user_id}")
    
    learning_path = generate_learning_path(db, user_id)
    return learning_path.to_dict()

@app.get("/api/v1/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    school_id: Optional[int] = None,
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get leaderboard data"""
    logger.info(f"Leaderboard requested, limit: {limit}, school_id: {school_id}")
    
    # This is a simplified version that returns random data
    # In a real implementation, this would query the database
    
    # Placeholder for demonstration
    entries = []
    for i in range(1, limit + 1):
        entries.append({
            "user_id": i,
            "username": f"user_{i}",
            "points": random.randint(100, 5000),
            "level": random.randint(1, 5),
            "rank": i,
            "school_id": school_id if school_id else random.randint(1, 5),
            "school_name": f"School {random.randint(1, 5)}"
        })
    
    # Sort by points descending
    entries.sort(key=lambda e: e["points"], reverse=True)
    
    # Update ranks
    for i, entry in enumerate(entries):
        entry["rank"] = i + 1
    
    return entries