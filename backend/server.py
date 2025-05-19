"""
FastAPI server module for the MentorMe Assessment API
This module creates and configures the FastAPI application
"""

import os
import logging
from typing import Dict, List, Any, Optional

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import get_db, setup_database
from . import main as api

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("server")

# Create FastAPI app
app = FastAPI(
    title="MentorMe Enhanced Assessment API",
    description="API for the MentorMe Enhanced Assessment system",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register startup event
@app.on_event("startup")
async def startup_event():
    """Initialize the database on startup"""
    await api.startup_event()
    logger.info("API server started")

# Root endpoint
@app.get("/")
def read_root():
    """Root endpoint that returns API info"""
    return api.read_root()

# Assessment endpoints
@app.post("/api/assessment/start")
def start_assessment(request: api.AssessmentStartRequest, db: Session = Depends(get_db)):
    """Start a new assessment for a user"""
    return api.start_assessment(request, db)

@app.post("/api/assessment/{assessment_id}/next-question")
def next_question(assessment_id: int, request: api.NextQuestionRequest, db: Session = Depends(get_db)):
    """Get the next question for an assessment"""
    # Update the request object with the assessment ID from the path
    request.assessment_id = assessment_id
    return api.next_question(request, db)

@app.post("/api/assessment/{assessment_id}/submit-answer")
def submit_answer(assessment_id: int, submission: api.AnswerSubmission, db: Session = Depends(get_db)):
    """Submit an answer for a question"""
    return api.submit_answer(assessment_id, submission, db)

@app.post("/api/assessment/{assessment_id}/finish")
def finish_assessment(assessment_id: int, db: Session = Depends(get_db)):
    """Finish an assessment and get personalized learning path"""
    return api.finish_assessment(assessment_id, db)

# Question management endpoints (admin only)
@app.get("/api/admin/questions/domains")
def get_domains(db: Session = Depends(get_db)):
    """Get all available question domains"""
    domains = api.loader.get_domains(db)
    return {"domains": domains}

@app.get("/api/admin/questions/counts")
def get_question_counts(db: Session = Depends(get_db)):
    """Get counts of questions by domain"""
    counts = api.loader.get_question_counts_by_domain(db)
    return {"counts": counts}

@app.get("/api/admin/questions")
def get_questions(
    domain: Optional[str] = None,
    difficulty: Optional[int] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get questions for admin review"""
    questions = api.loader.load_questions(db, domain, difficulty, None, limit)
    return {"questions": [q.to_dict() for q in questions]}

# Data import endpoints (admin only)
@app.post("/api/admin/import")
def import_data(db: Session = Depends(get_db)):
    """Import data from CSV file"""
    from .import_data import run_import
    success, message = run_import()
    return {"success": success, "message": message}

# Health check endpoint
@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok", "version": "1.0.0"}