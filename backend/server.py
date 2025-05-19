"""
FastAPI server module for the MentorMe Enhanced Assessment system
This module defines the FastAPI application and CORS configuration
"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Optional

from .database import get_db, setup_database
from . import main, loader
from .models import Question

# Initialize FastAPI app
app = FastAPI(
    title="MentorMe Enhanced Assessment API",
    description="API for the MentorMe assessment system that provides adaptive learning assessments for ECE educators",
    version="1.0.0",
)

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    """Initialize database on startup"""
    setup_database()
    
@app.get("/")
async def read_root():
    """API root endpoint with basic information"""
    return {
        "message": "MentorMe Enhanced Assessment API",
        "version": "1.0.0",
        "docs": "/docs",
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.post("/api/assessments/start")
async def api_start_assessment(request: main.AssessmentStartRequest, db: Session = Depends(get_db)):
    """Start a new assessment for a user"""
    return main.start_assessment(request, db)

@app.post("/api/assessments/{assessment_id}/next-question")
async def api_next_question(assessment_id: int, request: main.NextQuestionRequest, db: Session = Depends(get_db)):
    """Get the next question in an assessment"""
    # Make sure assessment ID in path matches request body
    if assessment_id != request.assessment_id:
        raise HTTPException(status_code=400, detail="Assessment ID mismatch")
    
    return main.next_question(request, db)

@app.post("/api/assessments/{assessment_id}/submit-answer")
async def api_submit_answer(assessment_id: int, submission: main.AnswerSubmission, db: Session = Depends(get_db)):
    """Submit an answer for a question"""
    return main.submit_answer(assessment_id, submission, db)

@app.post("/api/assessments/{assessment_id}/finish")
async def api_finish_assessment(assessment_id: int, db: Session = Depends(get_db)):
    """Finish an assessment and get results"""
    return main.finish_assessment(assessment_id, db)

@app.get("/api/domains")
async def get_domains(db: Session = Depends(get_db)):
    """Get a list of all assessment domains"""
    domains = loader.get_domains(db)
    return {"domains": domains}

@app.get("/api/domain-question-counts")
async def get_domain_question_counts(db: Session = Depends(get_db)):
    """Get the count of questions for each domain"""
    counts = loader.get_question_counts_by_domain(db)
    return {"domain_counts": counts}

@app.get("/api/questions/{question_id}")
async def get_question(question_id: int, db: Session = Depends(get_db)):
    """Get a specific question by ID"""
    question = loader.get_question_by_id(db, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    return main.format_question(question)