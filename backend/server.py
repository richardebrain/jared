"""
FastAPI server for the MentorMe assessment system
"""

import logging
import json
from typing import Dict, List, Any, Optional
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, Body, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pydantic import BaseModel

from .database import get_db, setup_database
from .models import Question, UserPerformance, UserDomainProgress, AssessmentSession
from .loader import (
    load_questions, 
    load_random_question, 
    get_domains, 
    get_question_by_id, 
    get_random_question_with_adaptive_difficulty,
    generate_answer_feedback,
    LearningPath
)
from .import_data import import_questions_from_csv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("server")

# Create FastAPI app
app = FastAPI(title="MentorMe Assessment API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API
class QuestionRequest(BaseModel):
    domain: Optional[str] = None
    difficulty: Optional[int] = None
    exclude_ids: Optional[List[int]] = []

class AnswerRequest(BaseModel):
    question_id: int
    user_answer: str
    user_id: int
    domain: str
    time_taken: Optional[int] = None
    current_difficulty: int = 1

class AssessmentRequest(BaseModel):
    user_id: int
    domain: Optional[str] = None

class AssessmentCompleteRequest(BaseModel):
    session_id: int
    user_id: int
    domain: Optional[str] = None
    questions_asked: int
    questions_correct: int
    total_points: int

class DomainProgressRequest(BaseModel):
    user_id: int
    domain: str

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    try:
        setup_database()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")

# Routes
@app.get("/")
async def root():
    """API root endpoint"""
    return {"message": "MentorMe Assessment API", "version": "1.0.0"}

@app.get("/questions")
async def get_questions(
    domain: Optional[str] = None,
    difficulty: Optional[int] = None,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get a list of questions"""
    try:
        questions = load_questions(
            db=db,
            domain=domain,
            difficulty=difficulty,
            limit=limit
        )
        return {"questions": [q.sanitize_for_api() for q in questions]}
    except Exception as e:
        logger.error(f"Error getting questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/questions/random")
async def get_random_question(
    request: QuestionRequest = Body(...),
    db: Session = Depends(get_db)
):
    """Get a random question"""
    try:
        question = load_random_question(
            db=db,
            domain=request.domain,
            difficulty=request.difficulty,
            exclude_ids=request.exclude_ids
        )
        
        if not question:
            raise HTTPException(status_code=404, detail="No matching questions found")
        
        return {"question": question.sanitize_for_api()}
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error getting random question: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/questions/{question_id}")
async def get_question(
    question_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific question by ID"""
    try:
        question = get_question_by_id(db=db, question_id=question_id)
        
        if not question:
            raise HTTPException(status_code=404, detail=f"Question {question_id} not found")
        
        return {"question": question.sanitize_for_api()}
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error getting question {question_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/questions/answer")
async def submit_answer(
    request: AnswerRequest = Body(...),
    db: Session = Depends(get_db)
):
    """Submit an answer to a question"""
    try:
        # Get the question
        question = get_question_by_id(db=db, question_id=request.question_id)
        
        if not question:
            raise HTTPException(status_code=404, detail=f"Question {request.question_id} not found")
        
        # Check if the answer is correct
        is_correct = question.is_correct_answer(request.user_answer)
        
        # Calculate points earned
        points_earned = question.calculate_points(is_correct, request.time_taken)
        
        # Record the performance
        performance = UserPerformance(
            user_id=request.user_id,
            domain=request.domain,
            question_id=request.question_id,
            is_correct=is_correct,
            difficulty=question.difficulty,
            points_earned=points_earned,
            time_taken=request.time_taken
        )
        
        db.add(performance)
        
        # Update assessment session if it exists
        session = db.query(AssessmentSession).filter(
            AssessmentSession.user_id == request.user_id,
            AssessmentSession.is_completed == False
        ).order_by(AssessmentSession.started_at.desc()).first()
        
        if session:
            session.questions_asked += 1
            if is_correct:
                session.questions_correct += 1
            session.total_points += points_earned
        
        # Generate personalized feedback
        feedback = generate_answer_feedback(
            db=db,
            question=question,
            user_answer=request.user_answer,
            user_id=request.user_id,
            domain=request.domain,
            current_difficulty=request.current_difficulty
        )
        
        # Commit changes
        db.commit()
        
        # Return response
        return {
            "is_correct": is_correct,
            "points_earned": points_earned,
            "feedback": feedback.to_dict()
        }
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error submitting answer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/domains")
async def get_all_domains(db: Session = Depends(get_db)):
    """Get a list of all available domains"""
    try:
        domains = get_domains(db=db)
        return {"domains": domains}
    except Exception as e:
        logger.error(f"Error getting domains: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/assessment/start")
async def start_assessment(
    request: AssessmentRequest = Body(...),
    db: Session = Depends(get_db)
):
    """Start a new assessment session"""
    try:
        # Create a new assessment session
        session = AssessmentSession(
            user_id=request.user_id,
            domain=request.domain,
            is_completed=False,
            questions_asked=0,
            questions_correct=0,
            total_points=0,
            started_at=datetime.utcnow()
        )
        
        db.add(session)
        db.commit()
        
        # Refresh to get the ID
        db.refresh(session)
        
        return {"session": session.to_dict()}
    except Exception as e:
        db.rollback()
        logger.error(f"Error starting assessment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/assessment/complete")
async def complete_assessment(
    request: AssessmentCompleteRequest = Body(...),
    db: Session = Depends(get_db)
):
    """Complete an assessment session and generate a learning path"""
    try:
        # Get the session
        session = db.query(AssessmentSession).filter(
            AssessmentSession.id == request.session_id,
            AssessmentSession.user_id == request.user_id
        ).first()
        
        if not session:
            raise HTTPException(status_code=404, detail=f"Assessment session {request.session_id} not found")
        
        # Update session
        session.is_completed = True
        session.questions_asked = request.questions_asked
        session.questions_correct = request.questions_correct
        session.total_points = request.total_points
        session.completed_at = datetime.utcnow()
        
        # Get domain performances
        if request.domain:
            # Single domain assessment
            domains = [request.domain]
        else:
            # Multi-domain assessment
            domains = get_domains(db=db)
        
        # Get progress for each domain
        domain_progress = {}
        for domain in domains:
            progress = db.query(UserDomainProgress).filter(
                UserDomainProgress.user_id == request.user_id,
                UserDomainProgress.domain == domain
            ).first()
            
            if progress:
                domain_progress[domain] = progress.to_dict()
        
        # Calculate domain scores
        domain_scores = {}
        for domain, progress in domain_progress.items():
            if progress["questions_answered"] > 0:
                score = progress["questions_correct"] / progress["questions_answered"]
            else:
                score = 0
            domain_scores[domain] = round(score * 100, 1)
        
        # Find strongest and weakest domains
        if domain_scores:
            strongest_domain = max(domain_scores.items(), key=lambda x: x[1])[0]
            weakest_domain = min(domain_scores.items(), key=lambda x: x[1])[0]
        else:
            strongest_domain = "General"
            weakest_domain = "General"
        
        # Generate learning path recommendations
        learning_path = {
            "recommended_modules": [
                f"Module on {weakest_domain}",
                f"Advanced concepts in {strongest_domain}"
            ],
            "practice_areas": [weakest_domain],
            "resources": [
                {
                    "title": f"Introduction to {weakest_domain}",
                    "type": "video",
                    "url": f"/videos/{weakest_domain.lower().replace(' ', '_')}_intro"
                },
                {
                    "title": f"Practice exercises for {weakest_domain}",
                    "type": "quiz",
                    "url": f"/exercises/{weakest_domain.lower().replace(' ', '_')}"
                }
            ]
        }
        
        # Create learning path object
        path = LearningPath(
            learning_path=learning_path,
            domain_scores=domain_scores,
            questions_asked=request.questions_asked,
            questions_correct=request.questions_correct,
            strongest_domain=strongest_domain,
            weakest_domain=weakest_domain,
            total_points_earned=request.total_points
        )
        
        # Commit changes
        db.commit()
        
        return {
            "session": session.to_dict(),
            "learning_path": path.to_dict()
        }
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error completing assessment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/assessment/adaptive-question")
async def get_adaptive_question(
    user_id: int = Body(...),
    domain: str = Body(...),
    exclude_ids: List[int] = Body([]),
    db: Session = Depends(get_db)
):
    """Get a question with adaptive difficulty based on user performance"""
    try:
        # Get user progress for this domain
        progress = db.query(UserDomainProgress).filter(
            UserDomainProgress.user_id == user_id,
            UserDomainProgress.domain == domain
        ).first()
        
        # Default performance if no progress exists
        user_performance = 0.5  # Start at middle difficulty
        if progress:
            user_performance = progress.performance_score
        
        # Get adaptive question
        question, is_finished = get_random_question_with_adaptive_difficulty(
            db=db,
            domain=domain,
            user_performance=user_performance,
            exclude_ids=exclude_ids,
            max_questions_per_domain=15  # Adjust as needed
        )
        
        if not question:
            return {
                "finished": True,
                "message": f"No more questions available for domain: {domain}"
            }
        
        return {
            "question": question.sanitize_for_api(),
            "finished": is_finished,
            "current_difficulty": question.difficulty,
            "performance": user_performance
        }
    except Exception as e:
        logger.error(f"Error getting adaptive question: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/progress/{user_id}")
async def get_user_progress(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get a user's progress across all domains"""
    try:
        # Get all progress records for this user
        progress_records = db.query(UserDomainProgress).filter(
            UserDomainProgress.user_id == user_id
        ).all()
        
        # Convert to dictionary
        progress = {record.domain: record.to_dict() for record in progress_records}
        
        # Get total points
        total_points = sum(record.total_points for record in progress_records)
        
        # Calculate level based on points
        level = 1
        if total_points >= 3500:
            level = 6  # Mentor Teacher
        elif total_points >= 2500:
            level = 5  # Master Lead Teacher
        elif total_points >= 1500:
            level = 4  # Lead Teacher
        elif total_points >= 800:
            level = 3  # Associate Teacher
        elif total_points >= 300:
            level = 2  # Assistant Teacher
        
        # Get level name
        level_names = {
            1: "Teacher in Training",
            2: "Assistant Teacher",
            3: "Associate Teacher",
            4: "Lead Teacher",
            5: "Master Lead Teacher",
            6: "Mentor Teacher"
        }
        
        level_name = level_names.get(level, "Unknown")
        
        # Calculate bear bucks
        bear_bucks = total_points // 50
        
        return {
            "user_id": user_id,
            "progress": progress,
            "total_points": total_points,
            "level": level,
            "level_name": level_name,
            "bear_bucks": bear_bucks,
            "domains_mastered": sum(1 for record in progress_records if record.mastered)
        }
    except Exception as e:
        logger.error(f"Error getting user progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/import/questions")
async def import_questions(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Import questions from a CSV file"""
    try:
        # Save the uploaded file
        temp_file = Path("temp_upload.csv")
        with open(temp_file, "wb") as f:
            f.write(await file.read())
        
        # Import questions
        count = import_questions_from_csv(
            file_path=str(temp_file),
            db=db
        )
        
        # Delete the temporary file
        temp_file.unlink()
        
        return {"message": f"Successfully imported {count} questions", "count": count}
    except Exception as e:
        logger.error(f"Error importing questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Return the FastAPI app
def get_app():
    """Get the FastAPI app"""
    return app