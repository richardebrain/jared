"""
FastAPI server for assessment API endpoints
"""

import logging
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from .database import get_db
from .models import Question, UserPerformance, UserDomainProgress, AssessmentSession
from .loader import (
    load_questions, 
    load_random_question,
    get_domains,
    get_question_by_id,
    get_random_question_with_adaptive_difficulty,
    update_user_performance,
    generate_answer_feedback,
    LearningPath,
    QuestionResponse,
    AnswerFeedback
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("server")

# Create router
app = APIRouter(tags=["assessment"])

# Pydantic models for request and response validation
class AnswerSubmission(BaseModel):
    question_id: int
    user_answer: str
    user_id: int
    domain: str
    current_difficulty: int
    time_taken: Optional[int] = None

class AssessmentStartRequest(BaseModel):
    user_id: int
    domain: Optional[str] = None

class AssessmentProgress(BaseModel):
    questions_asked: int
    questions_correct: int
    domain: str
    current_difficulty: int
    excluded_question_ids: List[int] = Field(default_factory=list)

# Endpoints
@app.get("/questions")
async def get_questions(
    domain: Optional[str] = None,
    difficulty: Optional[int] = None,
    exclude_ids: Optional[str] = None,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get a list of questions based on filters
    """
    try:
        # Parse exclude_ids if provided
        excluded = []
        if exclude_ids:
            try:
                excluded = [int(id) for id in exclude_ids.split(",")]
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid exclude_ids format")
        
        questions = load_questions(
            db=db,
            domain=domain,
            difficulty=difficulty,
            exclude_ids=excluded,
            limit=limit
        )
        
        # Return sanitized questions without answers
        return {
            "questions": [q.sanitize_for_api() for q in questions],
            "count": len(questions)
        }
    except Exception as e:
        logger.error(f"Error getting questions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/questions/{question_id}")
async def get_question(
    question_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific question by ID
    """
    try:
        question = get_question_by_id(db, question_id)
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
            
        return question.sanitize_for_api()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting question {question_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/domains")
async def get_all_domains(
    db: Session = Depends(get_db)
):
    """
    Get a list of all available domains
    """
    try:
        domains = get_domains(db)
        return {"domains": domains}
    except Exception as e:
        logger.error(f"Error getting domains: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/submit-answer")
async def submit_answer(
    submission: AnswerSubmission,
    db: Session = Depends(get_db)
):
    """
    Submit an answer for a question and get feedback
    """
    try:
        # Get the question
        question = get_question_by_id(db, submission.question_id)
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        # Generate feedback
        feedback = generate_answer_feedback(
            db=db,
            question=question,
            user_answer=submission.user_answer,
            user_id=submission.user_id,
            domain=submission.domain,
            current_difficulty=submission.current_difficulty
        )
        
        # Record performance
        performance = UserPerformance(
            user_id=submission.user_id,
            domain=submission.domain,
            question_id=submission.question_id,
            is_correct=feedback.correct,
            difficulty=submission.current_difficulty,
            points_earned=question.calculate_points(
                feedback.correct, 
                submission.time_taken
            ),
            time_taken=submission.time_taken
        )
        
        db.add(performance)
        
        # Update user domain progress
        progress = update_user_performance(
            db=db,
            user_id=submission.user_id,
            domain=submission.domain,
            is_correct=feedback.correct,
            difficulty=submission.current_difficulty
        )
        
        # Commit changes
        db.commit()
        
        # Return feedback
        return feedback.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting answer: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/start-assessment")
async def start_assessment(
    request: AssessmentStartRequest,
    db: Session = Depends(get_db)
):
    """
    Start a new assessment session
    """
    try:
        # Create a new assessment session
        session = AssessmentSession(
            user_id=request.user_id,
            domain=request.domain,
            is_completed=False,
            questions_asked=0,
            questions_correct=0,
            total_points=0
        )
        
        db.add(session)
        db.commit()
        
        return {
            "session_id": session.id,
            "user_id": session.user_id,
            "domain": session.domain,
            "started_at": session.started_at.isoformat() if session.started_at else None
        }
    except Exception as e:
        logger.error(f"Error starting assessment: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/next-question")
async def get_next_question(
    user_id: int,
    domain: str,
    performance: float = 0.5,
    exclude_ids: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get the next question with adaptive difficulty
    """
    try:
        # Parse exclude_ids if provided
        excluded = []
        if exclude_ids:
            try:
                excluded = [int(id) for id in exclude_ids.split(",")]
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid exclude_ids format")
        
        # Get next question with adaptive difficulty
        question, finished = get_random_question_with_adaptive_difficulty(
            db=db,
            domain=domain,
            user_performance=performance,
            exclude_ids=excluded
        )
        
        if finished:
            return {
                "status": "complete",
                "assessment_complete": True,
                "message": "Assessment for this domain is complete"
            }
        
        if not question:
            return {
                "status": "error",
                "message": "No questions available for this domain"
            }
            
        # Return sanitized question
        return {
            "status": "success",
            **question.sanitize_for_api()
        }
    except Exception as e:
        logger.error(f"Error getting next question: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/complete-assessment")
async def complete_assessment(
    session_id: int,
    db: Session = Depends(get_db)
):
    """
    Complete an assessment session and generate a learning path
    """
    try:
        # Get the session
        session = db.query(AssessmentSession).filter(
            AssessmentSession.id == session_id
        ).first()
        
        if not session:
            raise HTTPException(status_code=404, detail="Assessment session not found")
        
        # Mark session as completed
        session.is_completed = True
        session.completed_at = datetime.utcnow()
        
        # Update session totals from performances
        performances = db.query(UserPerformance).filter(
            UserPerformance.user_id == session.user_id
        ).all()
        
        questions_asked = len(performances)
        questions_correct = sum(1 for p in performances if p.is_correct)
        total_points = sum(p.points_earned for p in performances)
        
        session.questions_asked = questions_asked
        session.questions_correct = questions_correct
        session.total_points = total_points
        
        # Find strongest and weakest domains
        domain_performances = db.query(UserDomainProgress).filter(
            UserDomainProgress.user_id == session.user_id
        ).all()
        
        # Default values
        strongest_domain = "General"
        weakest_domain = "General"
        domain_scores = {}
        
        if domain_performances:
            # Get scores for each domain
            domain_scores = {
                dp.domain: dp.performance_score for dp in domain_performances
            }
            
            # Find strongest and weakest domains
            if domain_scores:
                strongest_domain = max(domain_scores.items(), key=lambda x: x[1])[0]
                weakest_domain = min(domain_scores.items(), key=lambda x: x[1])[0]
        
        # Generate learning path recommendations
        learning_path = {
            "high_priority": [
                f"Review key concepts in {weakest_domain}",
                f"Complete practice exercises in {weakest_domain}"
            ],
            "medium_priority": [
                f"Strengthen understanding in related domains",
                f"Apply knowledge in practical scenarios"
            ],
            "future_growth": [
                f"Explore advanced topics in {strongest_domain}",
                f"Connect concepts across domains"
            ]
        }
        
        # Create learning path response
        path = LearningPath(
            learning_path=learning_path,
            domain_scores=domain_scores,
            questions_asked=questions_asked,
            questions_correct=questions_correct,
            strongest_domain=strongest_domain,
            weakest_domain=weakest_domain,
            user_name=None,  # Will be filled in by function
            total_points_earned=total_points
        )
        
        # Commit changes
        db.commit()
        
        return path.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error completing assessment: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/user-progress/{user_id}")
async def get_user_progress(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a user's progress across all domains
    """
    try:
        # Get all domain progress
        progress = db.query(UserDomainProgress).filter(
            UserDomainProgress.user_id == user_id
        ).all()
        
        results = {}
        for p in progress:
            results[p.domain] = p.to_dict()
            
        return results
    except Exception as e:
        logger.error(f"Error getting user progress: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))