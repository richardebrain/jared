"""
Server module for the MentorMe Enhanced Assessment API
This module sets up the FastAPI server with all routes
"""

import logging
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import get_db, setup_database
from .models import Question, Assessment, QuestionResponse as QuestionResponseModel
from .import_data import run_import
from . import main

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("server")

# Create FastAPI app
app = FastAPI(
    title="MentorMe Enhanced Assessment API",
    description="API for the MentorMe Assessment System",
    version="1.0.0"
)

# Add CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    logger.info("Starting up MentorMe Assessment API")
    
    # Setup database
    success, message = setup_database()
    if not success:
        logger.error(f"Database setup failed: {message}")
        # We'll continue anyway, as database might already exist
    
    # Optionally, run data import if database is empty
    # This is useful for first-time setup
    db = next(get_db())
    question_count = db.query(Question).count()
    
    if question_count == 0:
        logger.info("No questions found in database. Running import...")
        import_success, import_result = run_import()
        if import_success:
            logger.info(f"Import completed successfully: {import_result}")
        else:
            logger.warning(f"Import failed: {import_result}")

@app.get("/")
def read_root():
    """Root endpoint"""
    return main.read_root()

@app.post("/assessments/start")
def start_assessment(request: main.AssessmentStartRequest, db: Session = Depends(get_db)):
    """Start a new assessment for a user"""
    return main.start_assessment(request, db)

@app.post("/assessments/{assessment_id}/next-question")
def next_question(request: main.NextQuestionRequest, db: Session = Depends(get_db)):
    """Get the next question for an assessment"""
    return main.next_question(request, db)

@app.post("/assessments/{assessment_id}/submit-answer")
def submit_answer(
    assessment_id: int, 
    submission: main.AnswerSubmission, 
    db: Session = Depends(get_db)
):
    """Submit an answer for a question"""
    return main.submit_answer(assessment_id, submission, db)

@app.post("/assessments/{assessment_id}/finish")
def finish_assessment(assessment_id: int, db: Session = Depends(get_db)):
    """Finish an assessment and get personalized learning path"""
    return main.finish_assessment(assessment_id, db)

@app.get("/questions/{question_id}")
def get_question(question_id: int, db: Session = Depends(get_db)):
    """Get a specific question by ID"""
    question = db.query(Question).filter(Question.id == question_id).first()
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Question ID {question_id} not found"
        )
    
    return main.format_question(question)

@app.get("/domains")
def get_domains(db: Session = Depends(get_db)):
    """Get all available domains"""
    from .loader import get_domains
    domains = get_domains(db)
    return {"domains": domains}

@app.get("/status")
def get_status(db: Session = Depends(get_db)):
    """Get API status and database statistics"""
    question_count = db.query(Question).count()
    domains = db.query(Question.domain).distinct().count()
    assessments = db.query(Assessment).count()
    responses = db.query(QuestionResponseModel).count()
    
    return {
        "status": "healthy",
        "database": {
            "questions": question_count,
            "domains": domains,
            "assessments": assessments,
            "responses": responses
        },
        "version": "1.0.0"
    }

@app.post("/import")
def import_questions(db: Session = Depends(get_db)):
    """Import questions from CSV file"""
    import_success, import_result = run_import()
    
    if not import_success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Import failed: {import_result}"
        )
    
    return {
        "success": True,
        "result": import_result
    }