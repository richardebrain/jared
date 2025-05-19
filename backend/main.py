"""
MentorMe assessment system FastAPI application
"""

import logging
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from uuid import uuid4

from fastapi import Depends, FastAPI, HTTPException, status, Query, Path, Body, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend.database import get_db, setup_database
from backend.models import (
    User, School, Domain, Question, UserAnswer, 
    UserDomainProgress, AnswerFeedback
)
from backend.loader import (
    load_questions, get_random_question, get_domain_stats,
    get_distinct_domains, get_next_assessment_question,
    submit_answer_and_update, generate_learning_path
)
from backend.import_data import import_questions_from_csv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="MentorMe Assessment API",
    description="API for the MentorMe preschool teacher assessment and training system",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Set to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define dependency to check user authentication
async def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """Get the current user from the session"""
    # Extract authentication token from headers or query params
    # This is a simplified version - replace with your actual auth logic
    user_id = request.headers.get("X-User-ID")
    
    if not user_id:
        # For development, can use query param
        user_id = request.query_params.get("user_id")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

# Define dependency to check admin access
async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Check if the current user is an admin"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this resource",
        )
    
    return current_user

# Define dependency to check subscription
async def check_subscription(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    """Check if the user's school has an active subscription"""
    # Skip check for Raising Arizona (default school) or if user is admin
    if current_user.is_admin:
        return current_user
        
    # Check if user has a school
    if not current_user.school_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User not associated with a school",
        )
    
    # Get school
    school = db.query(School).filter(School.id == current_user.school_id).first()
    
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found",
        )
    
    # Skip subscription check for Raising Arizona
    if school.name == "Raising Arizona":
        return current_user
    
    # Check subscription
    if not school.subscription_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="School subscription not active",
        )
    
    # Check subscription expiration
    if school.subscription_expires and school.subscription_expires < datetime.utcnow():
        # Update subscription status
        school.subscription_active = False
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="School subscription expired",
        )
    
    return current_user

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat()}

# Domain endpoints
@app.get("/domains")
async def get_domains(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    """Get all domains"""
    domains = db.query(Domain).all()
    return [domain.to_dict() for domain in domains]

@app.get("/domains/{name}")
async def get_domain(
    name: str = Path(..., description="Domain name"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get a specific domain by name"""
    return get_domain_stats(db, name)

# User endpoints
@app.get("/users/me", response_model=Dict[str, Any])
async def get_my_profile(current_user: User = Depends(get_current_user)) -> Dict[str, Any]:
    """Get the current user's profile"""
    return current_user.to_dict()

@app.get("/users/{user_id}/progress")
async def get_user_progress(
    user_id: int = Path(..., description="User ID"),
    domain: Optional[str] = Query(None, description="Domain name (optional)"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get a user's progress (admin only)"""
    # Only admins can access other users' progress
    if current_user.id != user_id and not current_user.is_admin:
        # Additional school admin check - can only see users from same school
        if not current_user.is_admin and current_user.school_id:
            target_user = db.query(User).filter(User.id == user_id).first()
            if not target_user or target_user.school_id != current_user.school_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to access this user's progress",
                )
    
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    
    # Get progress
    query = db.query(UserDomainProgress).filter(UserDomainProgress.user_id == user_id)
    
    if domain:
        domain_obj = db.query(Domain).filter(Domain.name == domain).first()
        if domain_obj:
            query = query.filter(UserDomainProgress.domain_id == domain_obj.id)
    
    progress_records = query.all()
    
    return {
        "user_id": user_id,
        "user": user.to_dict(),
        "progress": [p.to_dict() for p in progress_records]
    }

# Question endpoints
@app.get("/questions")
async def get_questions(
    domain: Optional[str] = Query(None, description="Domain name (optional)"),
    difficulty: Optional[int] = Query(None, description="Difficulty level (optional)"),
    limit: int = Query(10, description="Maximum number of questions to return"),
    include_answers: bool = Query(False, description="Whether to include correct answers"),
    current_user: User = Depends(check_subscription),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get questions, optionally filtered by domain and difficulty"""
    questions = load_questions(db, domain, difficulty, limit)
    return [q.to_dict(include_answer=include_answers) for q in questions]

@app.get("/questions/random")
async def get_random_question_endpoint(
    domain: Optional[str] = Query(None, description="Domain name (optional)"),
    difficulty: Optional[int] = Query(None, description="Difficulty level (optional)"),
    current_user: User = Depends(check_subscription),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get a random question, optionally filtered by domain and difficulty"""
    question = get_random_question(db, domain, difficulty)
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No questions found with the given criteria",
        )
    
    return question.to_dict()

# Assessment endpoints
@app.post("/assessment/start", response_model=Dict[str, Any])
async def start_assessment(
    domain: str = Body(..., description="Domain name"),
    current_user: User = Depends(check_subscription),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Start a new assessment session"""
    # Get or create user domain progress
    domain_obj = db.query(Domain).filter(Domain.name == domain).first()
    if not domain_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Domain '{domain}' not found",
        )
    
    # Create a new session ID
    session_id = str(uuid4())
    
    # Get the first question
    question = get_next_assessment_question(db, current_user.id, domain, [])
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No questions available for domain '{domain}'",
        )
    
    return {
        "session_id": session_id,
        "domain": domain,
        "user_id": current_user.id,
        "question": question.to_dict(),
        "progress": {
            "current_question": 1,
            "total_questions": 15,  # Maximum questions per assessment
        }
    }

@app.post("/assessment/submit", response_model=Dict[str, Any])
async def submit_answer(
    question_id: int = Body(..., description="Question ID"),
    answer: str = Body(..., description="User's answer"),
    time_taken: Optional[int] = Body(None, description="Time taken to answer in seconds"),
    session_id: Optional[str] = Body(None, description="Assessment session ID"),
    current_user: User = Depends(check_subscription),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Submit an answer to a question"""
    # Submit the answer and get feedback
    feedback = submit_answer_and_update(
        db, current_user.id, question_id, answer, time_taken
    )
    
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Question with ID {question_id} not found",
        )
    
    # Get the question to determine the domain
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question or not question.domain:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Question domain not found",
        )
    
    domain = question.domain.name
    
    # Get previous answers in this session
    prev_answers = []
    if session_id:
        answers = db.query(UserAnswer).filter(
            UserAnswer.user_id == current_user.id,
            UserAnswer.session_id == session_id
        ).all()
        
        prev_answers = [a.to_dict() for a in answers]
    
    # Get the next question
    next_question = get_next_assessment_question(
        db, current_user.id, domain, prev_answers
    )
    
    # Prepare assessment completed flag
    assessment_completed = next_question is None
    
    # Prepare response
    response = {
        "feedback": feedback.to_dict(),
        "next_question": next_question.to_dict() if next_question else None,
        "assessment_completed": assessment_completed,
        "progress": {
            "current_question": len(prev_answers) + 1,
            "total_questions": 15,  # Maximum questions per assessment
        }
    }
    
    # Add learning path if assessment is completed
    if assessment_completed:
        learning_path = generate_learning_path(db, current_user.id)
        response["learning_path"] = learning_path.to_dict()
    
    return response

@app.get("/learning-path")
async def get_learning_path(
    current_user: User = Depends(check_subscription),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Get a personalized learning path"""
    learning_path = generate_learning_path(db, current_user.id)
    return learning_path.to_dict()

# Admin endpoints
@app.post("/admin/import-questions")
async def import_questions(
    file_path: str = Body(..., description="Path to the CSV file"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Import questions from a CSV file (admin only)"""
    try:
        imported_count = import_questions_from_csv(file_path, db)
        return {
            "success": True,
            "imported_count": imported_count,
            "message": f"Successfully imported {imported_count} questions"
        }
    except Exception as e:
        logger.error(f"Error importing questions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error importing questions: {str(e)}",
        )

@app.get("/admin/schools")
async def get_schools(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get all schools (admin only)"""
    schools = db.query(School).all()
    return [school.to_dict() for school in schools]

@app.post("/admin/schools")
async def create_school(
    name: str = Body(..., description="School name"),
    logo_url: Optional[str] = Body(None, description="School logo URL"),
    subscription_active: bool = Body(True, description="Whether the subscription is active"),
    subscription_expires: Optional[datetime] = Body(None, description="Subscription expiration date"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Create a new school (admin only)"""
    # Check if school already exists
    existing_school = db.query(School).filter(School.name == name).first()
    if existing_school:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"School with name '{name}' already exists",
        )
    
    # Create new school
    school = School(
        name=name,
        logo_url=logo_url,
        subscription_active=subscription_active,
        subscription_expires=subscription_expires
    )
    
    db.add(school)
    db.commit()
    db.refresh(school)
    
    return school.to_dict()

@app.put("/admin/schools/{school_id}")
async def update_school(
    school_id: int = Path(..., description="School ID"),
    name: Optional[str] = Body(None, description="School name"),
    logo_url: Optional[str] = Body(None, description="School logo URL"),
    subscription_active: Optional[bool] = Body(None, description="Whether the subscription is active"),
    subscription_expires: Optional[datetime] = Body(None, description="Subscription expiration date"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Update a school (admin only)"""
    # Get school
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"School with ID {school_id} not found",
        )
    
    # Update fields
    if name is not None:
        school.name = name
    
    if logo_url is not None:
        school.logo_url = logo_url
    
    if subscription_active is not None:
        school.subscription_active = subscription_active
    
    if subscription_expires is not None:
        school.subscription_expires = subscription_expires
    
    # Update timestamp
    school.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(school)
    
    return school.to_dict()

@app.delete("/admin/schools/{school_id}")
async def delete_school(
    school_id: int = Path(..., description="School ID"),
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Delete a school (admin only)"""
    # Get school
    school = db.query(School).filter(School.id == school_id).first()
    if not school:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"School with ID {school_id} not found",
        )
    
    # Cannot delete Raising Arizona
    if school.name == "Raising Arizona":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete the default school",
        )
    
    # Delete school
    db.delete(school)
    db.commit()
    
    return {"success": True, "message": f"School '{school.name}' deleted successfully"}

# Setup database on startup
@app.on_event("startup")
async def startup_event():
    """Setup database on startup"""
    try:
        setup_database()
    except Exception as e:
        logger.error(f"Error setting up database: {e}")
        # Continue anyway, the API might still work with existing database