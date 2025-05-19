"""
FastAPI server for the MentorMe assessment API
"""

import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, validator

from .database import get_db
from .models import Question, UserPerformance, AssessmentResult
from .loader import (
    load_questions, 
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

# Create API router
app = APIRouter(tags=["assessment"])

# ---- Pydantic Models for API Request/Response ----

class QuestionRequest(BaseModel):
    domain: Optional[str] = None
    difficulty: Optional[int] = None
    exclude_ids: Optional[List[int]] = None
    limit: Optional[int] = 10

class AnswerRequest(BaseModel):
    question_id: int
    user_id: int
    answer: str
    domain: str
    current_difficulty: int = 1

class AssessmentStartRequest(BaseModel):
    user_id: int
    domains: Optional[List[str]] = None

class AssessmentSubmitRequest(BaseModel):
    assessment_id: int
    user_id: int
    questions: Dict[int, str]  # Question ID -> Answer

class UserPerformanceRequest(BaseModel):
    user_id: int

# ---- API Routes ----

@app.get("/questions", response_model=Dict[str, Any])
async def get_questions(
    domain: Optional[str] = None,
    difficulty: Optional[int] = None,
    limit: Optional[int] = 10,
    exclude_ids: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get questions based on domain and difficulty
    
    Args:
        domain: Domain to filter by
        difficulty: Difficulty level to filter by (1-5)
        limit: Maximum number of questions to return
        exclude_ids: Comma-separated list of question IDs to exclude
        db: Database session
    """
    try:
        # Parse exclude_ids if provided
        exclude_list = None
        if exclude_ids:
            try:
                exclude_list = [int(id.strip()) for id in exclude_ids.split(",")]
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid exclude_ids format")
        
        # Load questions from the database
        questions = load_questions(
            db=db,
            domain=domain,
            difficulty=difficulty,
            exclude_ids=exclude_list,
            limit=limit
        )
        
        # Convert to API response format
        result = {
            "questions": [q.to_dict() for q in questions],
            "count": len(questions),
            "domain": domain,
            "difficulty": difficulty
        }
        
        return result
    except Exception as e:
        logger.error(f"Error getting questions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get questions: {str(e)}")

@app.get("/question/{question_id}", response_model=Dict[str, Any])
async def get_question(
    question_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific question by ID
    
    Args:
        question_id: ID of the question to retrieve
        db: Database session
    """
    try:
        question = get_question_by_id(db, question_id)
        
        if not question:
            raise HTTPException(status_code=404, detail=f"Question {question_id} not found")
        
        return question.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting question {question_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get question: {str(e)}")

@app.get("/domains", response_model=List[str])
async def list_domains(db: Session = Depends(get_db)):
    """
    Get a list of all domains in the database
    
    Args:
        db: Database session
    """
    try:
        return get_domains(db)
    except Exception as e:
        logger.error(f"Error getting domains: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get domains: {str(e)}")

@app.post("/answer", response_model=Dict[str, Any])
async def submit_answer(
    answer_request: AnswerRequest,
    db: Session = Depends(get_db)
):
    """
    Submit an answer for a question and get feedback
    
    Args:
        answer_request: Answer request containing question_id, user_id, answer, domain, and current_difficulty
        db: Database session
    """
    try:
        # Get the question
        question = get_question_by_id(db, answer_request.question_id)
        
        if not question:
            raise HTTPException(status_code=404, detail=f"Question {answer_request.question_id} not found")
        
        # Generate feedback for the answer
        feedback = generate_answer_feedback(
            db=db,
            question=question,
            user_answer=answer_request.answer,
            user_id=answer_request.user_id,
            domain=answer_request.domain,
            current_difficulty=answer_request.current_difficulty
        )
        
        # Return the feedback
        return {
            "feedback": feedback.to_dict(),
            "question_id": answer_request.question_id,
            "points_earned": question.calculate_points(feedback.correct),
            "next_question": None  # Will be filled in by the client
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting answer: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to submit answer: {str(e)}")

@app.post("/assessment/start", response_model=Dict[str, Any])
async def start_assessment(
    request: AssessmentStartRequest,
    db: Session = Depends(get_db)
):
    """
    Start a new assessment for a user
    
    Args:
        request: Assessment start request containing user_id and optional domains
        db: Database session
    """
    try:
        # If no domains specified, use all domains
        if not request.domains:
            domains = get_domains(db)
        else:
            domains = request.domains
        
        # Create a new assessment result
        assessment = AssessmentResult(
            user_id=request.user_id,
            domains_assessed=json.dumps(domains),
            started_at=datetime.utcnow()
        )
        
        db.add(assessment)
        db.commit()
        db.refresh(assessment)
        
        # Get the first question for each domain
        first_questions = {}
        for domain in domains:
            # Get user's existing performance for this domain, or default to 0
            performance = db.query(UserPerformance).filter(
                UserPerformance.user_id == request.user_id,
                UserPerformance.domain == domain
            ).first()
            
            proficiency = performance.proficiency if performance else 0.0
            
            # Get an adaptive difficulty question
            question, finished = get_random_question_with_adaptive_difficulty(
                db=db,
                domain=domain,
                user_performance=proficiency,
                exclude_ids=[]
            )
            
            if question:
                first_questions[domain] = question.to_dict()
        
        return {
            "assessment_id": assessment.id,
            "domains": domains,
            "first_questions": first_questions
        }
    except Exception as e:
        logger.error(f"Error starting assessment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start assessment: {str(e)}")

@app.get("/assessment/next-question", response_model=Dict[str, Any])
async def get_next_question(
    user_id: int,
    domain: str,
    exclude_ids: str = "",
    db: Session = Depends(get_db)
):
    """
    Get the next question for a domain based on user performance
    
    Args:
        user_id: User ID
        domain: Domain to get question for
        exclude_ids: Comma-separated list of question IDs to exclude
        db: Database session
    """
    try:
        # Parse exclude_ids
        exclude_list = []
        if exclude_ids:
            try:
                exclude_list = [int(id.strip()) for id in exclude_ids.split(",")]
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid exclude_ids format")
        
        # Get user's existing performance for this domain, or default to 0
        performance = db.query(UserPerformance).filter(
            UserPerformance.user_id == user_id,
            UserPerformance.domain == domain
        ).first()
        
        proficiency = performance.proficiency if performance else 0.0
        
        # Get an adaptive difficulty question
        question, finished = get_random_question_with_adaptive_difficulty(
            db=db,
            domain=domain,
            user_performance=proficiency,
            exclude_ids=exclude_list
        )
        
        if finished and not question:
            return {
                "status": "domain_complete",
                "assessment_complete": False,
                "message": f"Domain {domain} assessment complete"
            }
        
        if question:
            return {
                "status": "question",
                **question.to_dict()
            }
        else:
            return {
                "status": "no_questions",
                "assessment_complete": False,
                "message": f"No more questions available for domain {domain}"
            }
    except Exception as e:
        logger.error(f"Error getting next question: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get next question: {str(e)}")

@app.post("/assessment/complete", response_model=Dict[str, Any])
async def complete_assessment(
    user_id: int,
    assessment_id: int = None,
    db: Session = Depends(get_db)
):
    """
    Complete an assessment and generate a learning path
    
    Args:
        user_id: User ID
        assessment_id: Assessment ID (optional)
        db: Database session
    """
    try:
        # If assessment_id is provided, mark it as complete
        if assessment_id:
            assessment = db.query(AssessmentResult).filter(
                AssessmentResult.id == assessment_id,
                AssessmentResult.user_id == user_id
            ).first()
            
            if assessment:
                assessment.complete_assessment()
                db.commit()
        
        # Get user's performance across all domains
        performances = db.query(UserPerformance).filter(
            UserPerformance.user_id == user_id
        ).all()
        
        if not performances:
            return {
                "status": "no_data",
                "message": "No assessment data available for user"
            }
        
        # Calculate domain scores
        domain_scores = {p.domain: p.proficiency for p in performances}
        
        # Find strongest and weakest domains
        strongest_domain = max(domain_scores.items(), key=lambda x: x[1])[0] if domain_scores else None
        weakest_domain = min(domain_scores.items(), key=lambda x: x[1])[0] if domain_scores else None
        
        # Calculate total questions and correct answers
        questions_asked = sum(p.questions_attempted for p in performances)
        questions_correct = sum(p.questions_correct for p in performances)
        total_points_earned = questions_correct * 10  # Simple points calculation
        
        # Generate learning path
        learning_path = {
            "to_strengthen": [{
                "domain": domain,
                "proficiency": score,
                "resources": [
                    f"Video: Master {domain} Concepts",
                    f"Activity: {domain} Practice Exercises",
                    f"Reflection: {domain} Self-Assessment"
                ]
            } for domain, score in sorted(domain_scores.items(), key=lambda x: x[1])[:3]]
        }
        
        # Create learning path object
        path = LearningPath(
            learning_path=learning_path,
            domain_scores=domain_scores,
            questions_asked=questions_asked,
            questions_correct=questions_correct,
            strongest_domain=strongest_domain,
            weakest_domain=weakest_domain,
            user_name=None,  # Will be filled by frontend
            total_points_earned=total_points_earned
        )
        
        return path.to_dict()
    except Exception as e:
        logger.error(f"Error completing assessment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to complete assessment: {str(e)}")

@app.get("/performance/{user_id}", response_model=Dict[str, Any])
async def get_user_performance(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a user's performance across all domains
    
    Args:
        user_id: User ID
        db: Database session
    """
    try:
        # Get user's performance across all domains
        performances = db.query(UserPerformance).filter(
            UserPerformance.user_id == user_id
        ).all()
        
        if not performances:
            return {
                "user_id": user_id,
                "domains": {},
                "average_proficiency": 0.0
            }
        
        # Convert to dictionary for API response
        domains = {p.domain: p.to_dict() for p in performances}
        
        # Calculate average proficiency
        average_proficiency = sum(p.proficiency for p in performances) / len(performances)
        
        return {
            "user_id": user_id,
            "domains": domains,
            "average_proficiency": average_proficiency
        }
    except Exception as e:
        logger.error(f"Error getting user performance: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get user performance: {str(e)}")

@app.get("/stats", response_model=Dict[str, Any])
async def get_assessment_stats(db: Session = Depends(get_db)):
    """
    Get statistics about the assessment system
    
    Args:
        db: Database session
    """
    try:
        # Count questions by domain
        domain_counts = db.query(Question.domain, func.count(Question.id)).group_by(Question.domain).all()
        domain_stats = {domain: count for domain, count in domain_counts}
        
        # Count questions by difficulty
        difficulty_counts = db.query(Question.difficulty, func.count(Question.id)).group_by(Question.difficulty).all()
        difficulty_stats = {difficulty: count for difficulty, count in difficulty_counts}
        
        # Count total questions
        total_questions = db.query(func.count(Question.id)).scalar()
        
        # Count total assessments
        total_assessments = db.query(func.count(AssessmentResult.id)).scalar()
        
        # Count completed assessments
        completed_assessments = db.query(func.count(AssessmentResult.id)).filter(AssessmentResult.completed == True).scalar()
        
        return {
            "total_questions": total_questions,
            "domain_stats": domain_stats,
            "difficulty_stats": difficulty_stats,
            "total_assessments": total_assessments,
            "completed_assessments": completed_assessments
        }
    except Exception as e:
        logger.error(f"Error getting assessment stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get assessment stats: {str(e)}")