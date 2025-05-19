"""
FastAPI server module for the MentorMe Enhanced Assessment system
This module defines the FastAPI application and CORS configuration
"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Optional

from .database import get_db
from .models import Question, Assessment, Response
from . import loader
from . import main
from . import import_data

# Create FastAPI application
app = FastAPI(
    title="MentorMe Enhanced Assessment API",
    description="API for MentorMe teacher assessment and personalized learning paths",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event handler
@app.on_event("startup")
async def startup():
    """Initialize database on startup"""
    import_data.setup_database()

# API Routes
@app.get("/")
async def read_root():
    """API root endpoint with basic information"""
    return {
        "name": "MentorMe Enhanced Assessment API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok"}

# Assessment management endpoints
@app.post("/assessments/start")
async def api_start_assessment(request: main.AssessmentStartRequest, db: Session = Depends(get_db)):
    """Start a new assessment for a user"""
    try:
        assessment_id = main.start_assessment(request, db)
        return {"assessment_id": assessment_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/assessments/{assessment_id}/next-question")
async def api_next_question(assessment_id: int, request: main.NextQuestionRequest, db: Session = Depends(get_db)):
    """Get the next question in an assessment"""
    try:
        return main.next_question(request, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/assessments/{assessment_id}/submit-answer")
async def api_submit_answer(assessment_id: int, submission: main.AnswerSubmission, db: Session = Depends(get_db)):
    """Submit an answer for a question"""
    try:
        return main.submit_answer(assessment_id, submission, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/assessments/{assessment_id}/finish")
async def api_finish_assessment(assessment_id: int, db: Session = Depends(get_db)):
    """Finish an assessment and get results"""
    try:
        return main.finish_assessment(assessment_id, db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Information endpoints
@app.get("/domains")
async def get_domains(db: Session = Depends(get_db)):
    """Get a list of all assessment domains"""
    try:
        domains = loader.get_domains(db)
        return {"domains": domains}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/domains/question-counts")
async def get_domain_question_counts(db: Session = Depends(get_db)):
    """Get the count of questions for each domain"""
    try:
        counts = loader.get_question_counts_by_domain(db)
        return {"counts": counts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/questions/{question_id}")
async def get_question(question_id: int, db: Session = Depends(get_db)):
    """Get a specific question by ID"""
    try:
        question = loader.get_question_by_id(db, question_id)
        
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
            
        return main.format_question(question)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))