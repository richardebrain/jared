"""
Main API module for the MentorMe assessment system
This module defines the FastAPI routes for the assessment API
"""

import uuid
import logging
from typing import Dict, List, Any, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime

from backend.database import get_db, setup_database
from backend.models import Question, Domain, UserAnswer, UserDomainProgress
from backend.loader import (
    load_questions, 
    get_random_question, 
    get_next_assessment_question,
    submit_answer_and_update,
    get_distinct_domains,
    get_domain_stats,
    generate_learning_path
)
from backend.import_data import import_questions_from_csv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="MentorMe Assessment API",
    description="API for adaptive early childhood education assessments",
    version="1.0.0"
)

# Add CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now (customize for production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    logger.info("Setting up database...")
    setup_database()
    logger.info("Database setup complete")

# Health check endpoint
@app.get("/health")
def health_check():
    """
    Health check endpoint
    
    Returns:
        Health status
    """
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

# Domains endpoints
@app.get("/domains")
def get_domains(db: Session = Depends(get_db)):
    """
    Get all domains
    
    Args:
        db: Database session
        
    Returns:
        List of domain names
    """
    domains = get_distinct_domains(db)
    return {"domains": domains}

@app.get("/domains/{domain}")
def get_domain_statistics(domain: str, db: Session = Depends(get_db)):
    """
    Get domain statistics
    
    Args:
        domain: Domain name
        db: Database session
        
    Returns:
        Domain statistics
    """
    stats = get_domain_stats(db, domain)
    if "error" in stats:
        raise HTTPException(status_code=404, detail=stats["error"])
    return stats

# Questions endpoints
@app.get("/questions")
def get_questions(
    domain: Optional[str] = None,
    difficulty: Optional[int] = None,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get a list of questions
    
    Args:
        domain: Domain to filter by (optional)
        difficulty: Difficulty level to filter by (optional)
        limit: Maximum number of questions to return
        db: Database session
        
    Returns:
        List of questions
    """
    questions = load_questions(db, domain, difficulty, limit)
    return {"questions": [q.to_dict() for q in questions]}

@app.get("/questions/random")
def get_random_question_api(
    domain: Optional[str] = None,
    difficulty: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get a random question
    
    Args:
        domain: Domain to filter by (optional)
        difficulty: Difficulty level to filter by (optional)
        db: Database session
        
    Returns:
        Random question
    """
    question = get_random_question(db, domain, difficulty)
    if not question:
        raise HTTPException(
            status_code=404,
            detail=f"No questions found for domain '{domain}' and difficulty {difficulty}"
        )
    return question.to_dict()

# Assessment endpoints
@app.post("/assessment/start")
def start_assessment(
    user_id: int = Body(...),
    domain: str = Body(...),
    db: Session = Depends(get_db)
):
    """
    Start a new assessment session
    
    Args:
        user_id: User ID
        domain: Domain to assess
        db: Database session
        
    Returns:
        First question of the assessment
    """
    question = get_next_assessment_question(db, user_id, domain, [])
    if not question:
        raise HTTPException(
            status_code=404,
            detail=f"No questions available for domain '{domain}'"
        )
    
    # Create assessment session
    session_id = str(uuid.uuid4())
    
    return {
        "session_id": session_id,
        "question": question.to_dict()
    }

@app.post("/assessment/next")
def get_next_question(
    user_id: int = Body(...),
    domain: str = Body(...),
    session_id: str = Body(...),
    prev_answers: List[Dict[str, Any]] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Get the next question in an assessment
    
    Args:
        user_id: User ID
        domain: Domain being assessed
        session_id: Assessment session ID
        prev_answers: Previous answers in this session
        db: Database session
        
    Returns:
        Next question or completion status
    """
    # Make sure all answers have the session ID
    for answer in prev_answers:
        if "session_id" not in answer:
            answer["session_id"] = session_id
    
    # Get next question
    question = get_next_assessment_question(db, user_id, domain, prev_answers)
    
    # If no more questions, assessment is complete
    if not question:
        # Generate learning path
        learning_path = generate_learning_path(db, user_id)
        
        return {
            "session_id": session_id,
            "completed": True,
            "learning_path": learning_path.to_dict()
        }
    
    return {
        "session_id": session_id,
        "question": question.to_dict()
    }

@app.post("/assessment/submit")
def submit_answer(
    user_id: int = Body(...),
    question_id: int = Body(...),
    answer: str = Body(...),
    time_taken: Optional[int] = Body(None),
    db: Session = Depends(get_db)
):
    """
    Submit an answer and get feedback
    
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
        raise HTTPException(
            status_code=404,
            detail=f"Question {question_id} not found"
        )
    
    return feedback.to_dict()

# User progress endpoints
@app.get("/users/{user_id}/progress")
def get_user_progress(
    user_id: int,
    domain: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get a user's progress
    
    Args:
        user_id: User ID
        domain: Domain to filter by (optional)
        db: Database session
        
    Returns:
        User progress
    """
    query = db.query(UserDomainProgress).filter(UserDomainProgress.user_id == user_id)
    
    if domain:
        domain_obj = db.query(Domain).filter(Domain.name == domain).first()
        if domain_obj:
            query = query.filter(UserDomainProgress.domain_id == domain_obj.id)
    
    progress_records = query.all()
    progress = [p.to_dict() for p in progress_records]
    
    return {"user_id": user_id, "progress": progress}

@app.get("/users/{user_id}/learning-path")
def get_user_learning_path(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a user's personalized learning path
    
    Args:
        user_id: User ID
        db: Database session
        
    Returns:
        User's learning path
    """
    learning_path = generate_learning_path(db, user_id)
    return learning_path.to_dict()

# Admin endpoints
@app.post("/admin/import")
def import_questions(
    file_path: str = Body(...),
    db: Session = Depends(get_db)
):
    """
    Import questions from a CSV file
    
    Args:
        file_path: Path to the CSV file
        db: Database session
        
    Returns:
        Import results
    """
    try:
        count = import_questions_from_csv(file_path, db)
        return {"success": True, "imported": count}
    except Exception as e:
        logger.error(f"Error importing questions: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error importing questions: {str(e)}"
        )