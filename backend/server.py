"""
FastAPI server module for the MentorMe Enhanced Assessment system
This module defines the FastAPI application and CORS configuration
"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import json
from datetime import datetime
from typing import List, Dict, Optional, Any, Union

from .database import get_db
from .main import (
    AssessmentStartRequest,
    QuestionResponse,
    AnswerSubmission,
    NextQuestionRequest,
    start_assessment,
    next_question,
    submit_answer,
    finish_assessment,
    startup_event
)

# Create FastAPI app
app = FastAPI(
    title="MentorMe Enhanced Assessment API",
    description="API for adaptive assessment and personalized learning paths",
    version="1.0.0",
    on_startup=[startup_event]
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Root endpoint
@app.get("/")
async def read_root():
    """API root endpoint with basic information"""
    return {
        "message": "MentorMe Enhanced Assessment API is running",
        "docs": "/docs",
        "version": "1.0.0"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Start assessment endpoint
@app.post("/assessments/start")
async def api_start_assessment(request: AssessmentStartRequest, db: Session = Depends(get_db)):
    """Start a new assessment for a user"""
    try:
        assessment_id = start_assessment(request, db)
        return {"assessment_id": assessment_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start assessment: {str(e)}")

# Next question endpoint
@app.post("/assessments/{assessment_id}/next-question")
async def api_next_question(assessment_id: int, request: NextQuestionRequest, db: Session = Depends(get_db)):
    """Get the next question in an assessment"""
    try:
        if request.assessment_id != assessment_id:
            raise HTTPException(status_code=400, detail="Assessment ID mismatch")
        
        question = next_question(request, db)
        return question
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get next question: {str(e)}")

# Submit answer endpoint
@app.post("/assessments/{assessment_id}/submit-answer")
async def api_submit_answer(assessment_id: int, submission: AnswerSubmission, db: Session = Depends(get_db)):
    """Submit an answer for a question"""
    try:
        result = submit_answer(assessment_id, submission, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit answer: {str(e)}")

# Finish assessment endpoint
@app.post("/assessments/{assessment_id}/finish")
async def api_finish_assessment(assessment_id: int, db: Session = Depends(get_db)):
    """Finish an assessment and get results"""
    try:
        learning_path = finish_assessment(assessment_id, db)
        return learning_path
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to finish assessment: {str(e)}")

# Get domains endpoint
@app.get("/domains")
async def get_domains(db: Session = Depends(get_db)):
    """Get a list of all assessment domains"""
    from .loader import get_domains
    try:
        domains = get_domains(db)
        return {"domains": domains}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get domains: {str(e)}")

# Get domain question counts
@app.get("/domains/question-counts")
async def get_domain_question_counts(db: Session = Depends(get_db)):
    """Get the count of questions for each domain"""
    from .loader import get_question_counts_by_domain
    try:
        counts = get_question_counts_by_domain(db)
        return {"counts": counts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get question counts: {str(e)}")

# Get a specific question by ID
@app.get("/questions/{question_id}")
async def get_question(question_id: int, db: Session = Depends(get_db)):
    """Get a specific question by ID"""
    from .loader import get_question_by_id
    try:
        question = get_question_by_id(db, question_id)
        if not question:
            raise HTTPException(status_code=404, detail=f"Question {question_id} not found")
        
        # Format the question for API response
        from .main import format_question
        return format_question(question)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get question: {str(e)}")