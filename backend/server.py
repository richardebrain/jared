"""
FastAPI server for the MentorMe Enhanced Assessment system
"""

import logging
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import get_db, setup_database
from .main import (
    AssessmentStartRequest, 
    NextQuestionRequest, 
    AnswerSubmission,
    start_assessment,
    next_question,
    submit_answer,
    finish_assessment,
    read_root,
    startup_event
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("server")

# Create FastAPI app
app = FastAPI(
    title="MentorMe Enhanced Assessment API",
    description="API for the MentorMe enhanced assessment system",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add startup event to initialize database
@app.on_event("startup")
async def on_startup():
    """Initialize on startup"""
    await startup_event()

# Root endpoint
@app.get("/")
def root():
    """Root endpoint"""
    return read_root()

# Start a new assessment
@app.post("/api/assessment/start")
def api_start_assessment(request: AssessmentStartRequest, db: Session = Depends(get_db)):
    """Start a new assessment for a user"""
    return start_assessment(request, db)

# Get the next question in an assessment
@app.post("/api/assessment/{assessment_id}/next-question")
def api_next_question(assessment_id: int, request: NextQuestionRequest, db: Session = Depends(get_db)):
    """Get the next question based on assessment history"""
    # Ensure assessment ID matches request
    if assessment_id != request.assessment_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assessment ID in path must match assessment ID in request body"
        )
    
    return next_question(request, db)

# Submit an answer to a question
@app.post("/api/assessment/{assessment_id}/submit")
def api_submit_answer(assessment_id: int, submission: AnswerSubmission, db: Session = Depends(get_db)):
    """Submit an answer for a question"""
    return submit_answer(assessment_id, submission, db)

# Finish an assessment and get results
@app.post("/api/assessment/{assessment_id}/finish")
def api_finish_assessment(assessment_id: int, db: Session = Depends(get_db)):
    """Finish an assessment and get personalized learning path"""
    return finish_assessment(assessment_id, db)

# Health check endpoint
@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected"
    }