"""
FastAPI server for the MentorMe assessment system
"""

import logging
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from .database import get_db, setup_database
from .models import Question, UserAnswer, UserDomainProgress, AnswerFeedback
from .loader import (
    load_questions,
    get_random_question,
    get_next_assessment_question,
    submit_answer_and_update,
    get_distinct_domains,
    get_domain_stats,
    generate_learning_path
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("server")

def get_app() -> FastAPI:
    """
    Create and configure the FastAPI application
    
    Returns:
        FastAPI application
    """
    # Create FastAPI app
    app = FastAPI(
        title="MentorMe Assessment API",
        description="API for MentorMe assessment system",
        version="1.0.0",
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Allow all origins for development
        allow_credentials=True,
        allow_methods=["*"],  # Allow all methods
        allow_headers=["*"],  # Allow all headers
    )
    
    # Root endpoint
    @app.get("/")
    async def root():
        """Root endpoint"""
        return {
            "name": "MentorMe Assessment API",
            "version": "1.0.0",
            "status": "running"
        }
    
    # Health check endpoint
    @app.get("/health")
    async def health_check():
        """Health check endpoint"""
        return {"status": "healthy"}
    
    # Readiness check endpoint
    @app.get("/ready")
    async def ready_check(db: Session = Depends(get_db)):
        """Readiness check endpoint"""
        try:
            # Test database connection
            db.execute(text("SELECT 1"))
            return {"status": "ready", "database": "connected"}
        except Exception as e:
            logger.error(f"Database not ready: {e}")
            return {"status": "not ready", "database": "disconnected", "error": str(e)}
    
    # Get questions endpoint
    @app.get("/api/questions")
    async def get_questions(
        domain: Optional[str] = None,
        difficulty: Optional[int] = None,
        limit: int = 10,
        db: Session = Depends(get_db)
    ):
        """
        Get questions based on domain and difficulty
        
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
    
    # Get random question endpoint
    @app.get("/api/questions/random")
    async def get_random_question_endpoint(
        domain: Optional[str] = None,
        difficulty: Optional[int] = None,
        exclude_ids: Optional[List[int]] = Query(None),
        db: Session = Depends(get_db)
    ):
        """
        Get a random question based on domain and difficulty
        
        Args:
            domain: Domain to filter by (optional)
            difficulty: Difficulty level to filter by (optional)
            exclude_ids: List of question IDs to exclude (optional)
            db: Database session
            
        Returns:
            A random question
        """
        question = get_random_question(db, domain, difficulty, exclude_ids)
        if not question:
            raise HTTPException(
                status_code=404,
                detail=f"No questions found for domain={domain}, difficulty={difficulty}"
            )
        return {"question": question.to_dict()}
    
    # Get specific question endpoint
    @app.get("/api/questions/{question_id}")
    async def get_question(
        question_id: int,
        db: Session = Depends(get_db)
    ):
        """
        Get a specific question by ID
        
        Args:
            question_id: ID of the question to retrieve
            db: Database session
            
        Returns:
            The requested question
        """
        question = db.query(Question).filter(Question.id == question_id).first()
        if not question:
            raise HTTPException(
                status_code=404,
                detail=f"Question with ID {question_id} not found"
            )
        return {"question": question.to_dict()}
    
    # Get domains endpoint
    @app.get("/api/domains")
    async def get_domains_endpoint(db: Session = Depends(get_db)):
        """
        Get a list of all domains
        
        Args:
            db: Database session
            
        Returns:
            List of domains
        """
        domains = get_distinct_domains(db)
        return {"domains": domains}
    
    # Get domain question count endpoint
    @app.get("/api/domains/{domain}/stats")
    async def get_domain_question_count(
        domain: str,
        db: Session = Depends(get_db)
    ):
        """
        Get the count of questions in a domain
        
        Args:
            domain: The domain to count questions for
            db: Database session
            
        Returns:
            Count of questions in the domain
        """
        stats = get_domain_stats(db, domain)
        return {"domain": domain, "stats": stats}
    
    # Next assessment question endpoint
    @app.post("/api/assessment/next")
    async def next_assessment_question(
        request: Request,
        db: Session = Depends(get_db)
    ):
        """
        Get the next question for an adaptive assessment
        
        Args:
            request: Request with user ID, domain, and previous answers
            db: Database session
            
        Returns:
            Next question for the assessment
        """
        data = await request.json()
        
        # Get required parameters
        user_id = data.get("user_id")
        domain = data.get("domain")
        prev_answers = data.get("prev_answers", [])
        
        if not user_id or not domain:
            raise HTTPException(
                status_code=400,
                detail="Missing required parameters: user_id and domain"
            )
        
        # Get next question based on adaptive logic
        question = get_next_assessment_question(
            db, 
            user_id, 
            domain, 
            prev_answers
        )
        
        if not question:
            return {
                "assessment_complete": True,
                "message": "Assessment complete for this domain"
            }
        
        return {"question": question.to_dict(), "assessment_complete": False}
    
    # Submit answer endpoint
    @app.post("/api/assessment/submit")
    async def submit_answer(
        request: Request,
        db: Session = Depends(get_db)
    ):
        """
        Submit an answer to a question
        
        Args:
            request: Request with user ID, question ID, and answer
            db: Database session
            
        Returns:
            Feedback on the answer
        """
        data = await request.json()
        
        # Get required parameters
        user_id = data.get("user_id")
        question_id = data.get("question_id")
        answer = data.get("answer")
        time_taken = data.get("time_taken")
        
        if not all([user_id, question_id, answer]):
            raise HTTPException(
                status_code=400,
                detail="Missing required parameters: user_id, question_id, answer"
            )
        
        # Process answer
        feedback = submit_answer_and_update(
            db, 
            user_id, 
            question_id, 
            answer, 
            time_taken
        )
        
        if not feedback:
            raise HTTPException(
                status_code=404,
                detail=f"Question with ID {question_id} not found"
            )
        
        # Return feedback with success status
        return {"feedback": feedback.to_dict()}
    
    # Get learning path endpoint
    @app.get("/api/users/{user_id}/learning-path")
    async def get_learning_path(
        user_id: int,
        db: Session = Depends(get_db)
    ):
        """
        Get a personalized learning path for a user
        
        Args:
            user_id: User ID to get learning path for
            db: Database session
            
        Returns:
            Personalized learning path recommendations
        """
        learning_path = generate_learning_path(db, user_id)
        return {"learning_path": learning_path.to_dict()}
    
    return app