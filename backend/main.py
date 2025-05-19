"""
Main entry point for the MentorMe Assessment API
"""

import logging
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.database import get_db, setup_database
from backend.models import Question, UserAnswer, UserDomainProgress
from backend.loader import (
    load_questions, get_distinct_domains, get_domain_stats,
    get_next_assessment_question, submit_answer_and_update,
    generate_learning_path
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("main")

# Create FastAPI app
app = FastAPI(
    title="MentorMe Assessment API",
    description="API for adaptive assessments in the MentorMe platform",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_db_client():
    """Initialize database on startup"""
    try:
        logger.info("Setting up database...")
        setup_database()
        logger.info("Database setup complete")
    except Exception as e:
        logger.error(f"Error setting up database: {e}")
        raise

# API endpoints

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "version": "1.0.0"}

@app.get("/api/questions")
async def get_questions(
    domain: Optional[str] = None,
    difficulty: Optional[int] = None,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get questions based on filters
    
    Args:
        domain: Domain to filter by (optional)
        difficulty: Difficulty level to filter by (optional)
        limit: Maximum number of questions to return
        db: Database session
        
    Returns:
        List of questions
    """
    questions = load_questions(db, domain, difficulty, limit)
    return [q.to_dict() for q in questions]

@app.get("/api/domains")
async def get_domains(db: Session = Depends(get_db)):
    """
    Get all available domains
    
    Args:
        db: Database session
        
    Returns:
        List of domain names
    """
    domains = get_distinct_domains(db)
    return domains

@app.get("/api/domains/{domain}/stats")
async def get_domain_statistics(domain: str, db: Session = Depends(get_db)):
    """
    Get statistics for a specific domain
    
    Args:
        domain: Domain name
        db: Database session
        
    Returns:
        Domain statistics
    """
    stats = get_domain_stats(db, domain)
    return stats

@app.post("/api/assessments/{domain}/next-question")
async def get_assessment_question(
    domain: str,
    user_id: int,
    prev_answers: List[Dict[str, Any]] = Body(default=[]),
    db: Session = Depends(get_db)
):
    """
    Get the next question for an adaptive assessment
    
    Args:
        domain: Assessment domain
        user_id: User ID
        prev_answers: List of previous answers in this assessment session
        db: Database session
        
    Returns:
        Next assessment question or None if assessment complete
    """
    question = get_next_assessment_question(db, user_id, domain, prev_answers)
    
    if not question:
        return {
            "completed": True,
            "message": "Assessment completed",
            "question": None
        }
    
    return {
        "completed": False,
        "question": question.to_dict()
    }

@app.post("/api/assessments/submit-answer")
async def submit_answer(
    user_id: int = Body(...),
    question_id: int = Body(...),
    answer: str = Body(...),
    time_taken: Optional[int] = Body(None),
    db: Session = Depends(get_db)
):
    """
    Submit an answer for a question
    
    Args:
        user_id: User ID
        question_id: Question ID
        answer: User's answer
        time_taken: Time taken to answer in seconds (optional)
        db: Database session
        
    Returns:
        Answer feedback
    """
    feedback = submit_answer_and_update(db, user_id, question_id, answer, time_taken)
    
    if not feedback:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return feedback.to_dict()

@app.get("/api/users/{user_id}/progress")
async def get_user_progress(user_id: int, db: Session = Depends(get_db)):
    """
    Get user progress across all domains
    
    Args:
        user_id: User ID
        db: Database session
        
    Returns:
        User progress data
    """
    progress = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == user_id
    ).all()
    
    return [p.to_dict() for p in progress]

@app.get("/api/users/{user_id}/learning-path")
async def get_user_learning_path(user_id: int, db: Session = Depends(get_db)):
    """
    Get personalized learning path for a user
    
    Args:
        user_id: User ID
        db: Database session
        
    Returns:
        Learning path recommendations
    """
    path = generate_learning_path(db, user_id)
    return path.to_dict()

@app.get("/api/users/{user_id}/assessments")
async def get_user_assessments(
    user_id: int,
    domain: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get user's assessment history
    
    Args:
        user_id: User ID
        domain: Filter by domain (optional)
        limit: Maximum number of records to return
        db: Database session
        
    Returns:
        List of assessment answers
    """
    query = db.query(UserAnswer).filter(UserAnswer.user_id == user_id)
    
    if domain:
        query = query.filter(UserAnswer.domain == domain)
    
    answers = query.order_by(UserAnswer.created_at.desc()).limit(limit).all()
    
    return [answer.to_dict() for answer in answers]