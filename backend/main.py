"""
Main API module for the MentorMe Enhanced Assessment system
This module defines the FastAPI endpoints for the assessment system
"""

import logging
import random
from typing import Dict, List, Any, Optional
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .database import get_db, setup_database
from .models import Question, Assessment, QuestionResponse as QuestionResponseModel
from .loader import (
    load_random_question, 
    get_domains, 
    get_question_by_id,
    generate_answer_feedback,
    get_random_question_with_adaptive_difficulty,
    DOMAIN_ORDER,
    LearningPath,
    QuestionResponse as QuestionResponseClass
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api")

# Create FastAPI app
app = FastAPI(
    title="MentorMe Enhanced Assessment API",
    description="API for the MentorMe assessment system",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, limit this to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response validation
class AssessmentStartRequest(BaseModel):
    user_id: int

class QuestionResponse(BaseModel):
    id: int
    question: str
    q_type: str
    options: Dict[str, str]
    domain: str
    difficulty: int
    enhanced_content: Optional[Dict[str, Any]] = None

class AnswerSubmission(BaseModel):
    question_id: int
    user_answer: str
    time_taken_ms: Optional[int] = None

class AnswerFeedback(BaseModel):
    correct: bool
    correct_answer: str
    personal_message: str
    teaching_explanation: str
    next_difficulty: Optional[int] = None

class AssessmentHistoryItem(BaseModel):
    question_id: int
    domain: str
    correct: bool
    difficulty: int

class NextQuestionRequest(BaseModel):
    assessment_id: int
    history: List[AssessmentHistoryItem]

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    success, message = setup_database()
    if not success:
        logger.error(f"Database setup failed: {message}")
        # We continue anyway - tables might already exist

@app.get("/")
def read_root():
    """Root endpoint"""
    return {"message": "MentorMe Enhanced Assessment API", "version": "1.0.0"}

@app.post("/assessment/start", response_model=Dict[str, Any])
def start_assessment(request: AssessmentStartRequest, db: Session = Depends(get_db)):
    """Start a new assessment for a user"""
    # Create a new assessment
    assessment = Assessment(
        user_id=request.user_id,
        start_time=datetime.now(),
        completed=False
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    # Get first question (always start with the first domain)
    first_domain = DOMAIN_ORDER[0] if DOMAIN_ORDER else get_domains(db)[0]
    question = load_random_question(db, domain=first_domain, difficulty=1)
    
    if not question:
        raise HTTPException(status_code=404, detail="No questions found in the database")
    
    return {
        "assessment_id": assessment.id,
        "question": format_question(question),
        "domain_order": DOMAIN_ORDER,
        "current_domain": first_domain
    }

@app.post("/assessment/{assessment_id}/next", response_model=Dict[str, Any])
def next_question(request: NextQuestionRequest, db: Session = Depends(get_db)):
    """Get the next question based on assessment history"""
    assessment_id = request.assessment_id
    history = request.history
    
    # Get assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Check if assessment is already completed
    if assessment.completed:
        return {"assessment_complete": True, "status": "completed"}
    
    # Determine current domain and user performance
    current_domain = None
    domain_questions = {}
    domain_correct = {}
    
    for item in history:
        domain = item.domain
        if domain not in domain_questions:
            domain_questions[domain] = 0
            domain_correct[domain] = 0
        
        domain_questions[domain] += 1
        if item.correct:
            domain_correct[domain] += 1
        
        current_domain = domain  # Will end up being the last domain in history
    
    # If no history, start with first domain
    if not current_domain:
        current_domain = DOMAIN_ORDER[0] if DOMAIN_ORDER else get_domains(db)[0]
    
    # Calculate user performance for the current domain
    user_performance = 0.0
    questions_in_current_domain = domain_questions.get(current_domain, 0)
    correct_in_current_domain = domain_correct.get(current_domain, 0)
    
    if questions_in_current_domain > 0:
        user_performance = correct_in_current_domain / questions_in_current_domain
    
    # Get a list of question IDs already seen
    exclude_ids = [item.question_id for item in history]
    
    # Get next question with adaptive difficulty
    question, domain_finished = get_random_question_with_adaptive_difficulty(
        db=db,
        domain=current_domain,
        user_performance=user_performance,
        exclude_ids=exclude_ids,
        max_questions_per_domain=15  # Maximum 15 questions per domain
    )
    
    # If domain is finished, move to the next domain
    if domain_finished:
        next_domain = get_next_domain(current_domain)
        if next_domain:
            question = load_random_question(db, domain=next_domain, difficulty=1)
            current_domain = next_domain
        else:
            # All domains completed, finish assessment
            assessment.completed = True
            assessment.end_time = datetime.now()
            db.commit()
            return {"assessment_complete": True, "status": "completed"}
    
    if not question:
        # Fallback if no question found
        next_domain = get_next_domain(current_domain)
        if next_domain:
            question = load_random_question(db, domain=next_domain, difficulty=1)
            current_domain = next_domain
        else:
            # All domains completed, finish assessment
            assessment.completed = True
            assessment.end_time = datetime.now()
            db.commit()
            return {"assessment_complete": True, "status": "completed"}
    
    if not question:
        raise HTTPException(status_code=404, detail="No more questions available")
    
    return {
        "question": format_question(question),
        "domain": current_domain,
        "progress": {
            "current_domain": current_domain,
            "questions_asked": len(history),
            "domains_seen": list(domain_questions.keys()),
            "domain_performance": {
                domain: (correct / domain_questions[domain]) * 100 
                for domain, correct in domain_correct.items()
            }
        }
    }

@app.post("/assessment/{assessment_id}/answer", response_model=AnswerFeedback)
def submit_answer(assessment_id: int, submission: AnswerSubmission, db: Session = Depends(get_db)):
    """Submit an answer for a question"""
    # Get assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Get question
    question = get_question_by_id(db, submission.question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Create response record
    is_correct = submission.user_answer.strip().lower() == question.answer.strip().lower()
    response = QuestionResponseModel(
        assessment_id=assessment_id,
        question_id=submission.question_id,
        user_answer=submission.user_answer,
        is_correct=is_correct,
        time_taken_ms=submission.time_taken_ms,
        difficulty=question.difficulty,
        answered_at=datetime.now()
    )
    db.add(response)
    
    # Update assessment stats
    assessment.questions_asked += 1
    if is_correct:
        assessment.questions_correct += 1
    
    db.commit()
    
    # Generate feedback
    feedback = generate_answer_feedback(
        db=db,
        question=question,
        user_answer=submission.user_answer,
        user_id=assessment.user_id,
        domain=question.domain,
        current_difficulty=question.difficulty
    )
    
    return AnswerFeedback(
        correct=feedback.correct,
        correct_answer=feedback.correct_answer,
        personal_message=feedback.personal_message,
        teaching_explanation=feedback.teaching_explanation,
        next_difficulty=feedback.next_difficulty
    )

@app.post("/assessment/{assessment_id}/finish", response_model=Dict[str, Any])
def finish_assessment(assessment_id: int, db: Session = Depends(get_db)):
    """Finish an assessment and get personalized learning path"""
    # Get assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Mark as completed
    assessment.completed = True
    assessment.end_time = datetime.now()
    
    # Award points (10 points for completing an assessment)
    assessment.points_earned = 10
    
    db.commit()
    
    # Get domain scores
    domain_scores = assessment.get_domain_scores(db)
    
    # Generate learning path
    learning_path = {}
    for domain, score in domain_scores.items():
        recommendations = generate_domain_recommendations(db, domain)
        learning_path[domain] = recommendations
    
    # Get user name if available
    user_name = get_user_name(assessment.user_id, db)
    
    # Create response
    result = LearningPath(
        learning_path=learning_path,
        domain_scores=domain_scores,
        questions_asked=assessment.questions_asked,
        questions_correct=assessment.questions_correct,
        strongest_domain=assessment.get_strongest_domain(db),
        weakest_domain=assessment.get_weakest_domain(db),
        user_name=user_name,
        total_points_earned=assessment.points_earned
    )
    
    return result.to_dict()

def format_question(question: Question) -> QuestionResponse:
    """Format a question for API response"""
    formatted = QuestionResponseClass(
        id=question.id,
        question=question.question,
        q_type=question.q_type,
        options=question.get_options(),
        domain=question.domain,
        difficulty=question.difficulty,
        enhanced_content=question.get_enhanced_content()
    )
    return formatted.to_dict()

def get_next_domain(current_domain: str) -> Optional[str]:
    """Get the next domain in the assessment sequence"""
    if not DOMAIN_ORDER:
        return None
        
    try:
        current_index = DOMAIN_ORDER.index(current_domain)
        if current_index < len(DOMAIN_ORDER) - 1:
            return DOMAIN_ORDER[current_index + 1]
        return None  # No more domains
    except ValueError:
        # Domain not in order, return first domain
        return DOMAIN_ORDER[0]

def generate_domain_recommendations(db: Session, domain: str) -> List[str]:
    """Generate resource recommendations for a domain"""
    # These would typically come from a database of learning resources
    # For now, we'll return some placeholder recommendations
    recommendations = {
        "Child Development": [
            "Video: Understanding Child Development Milestones",
            "Article: Brain Development in Early Childhood",
            "Workshop: Developmentally Appropriate Practice"
        ],
        "Classroom Management": [
            "Video: Positive Discipline Techniques",
            "Article: Creating an Effective Learning Environment",
            "Workshop: Managing Challenging Behaviors"
        ],
        "Curriculum Planning": [
            "Video: Designing Engaging Activities",
            "Article: Emergent Curriculum Approaches",
            "Workshop: Integrating STEAM in Early Childhood"
        ],
        "Family Engagement": [
            "Video: Building Strong Family Partnerships",
            "Article: Effective Family Communication Strategies",
            "Workshop: Cultural Competence in Family Partnerships"
        ],
        "Health & Safety": [
            "Video: Creating Safe Learning Environments",
            "Article: Promoting Physical Health in Young Children",
            "Workshop: Responding to Health Emergencies"
        ],
        "Observation & Assessment": [
            "Video: Documentation Methods in Early Childhood",
            "Article: Understanding Authentic Assessment",
            "Workshop: Using Observations to Inform Teaching"
        ],
        "Professionalism": [
            "Video: Ethical Practices in Early Childhood Education",
            "Article: Continuous Professional Development",
            "Workshop: Advocacy in Early Childhood Education"
        ]
    }
    
    return recommendations.get(domain, [
        "Video: Early Childhood Education Fundamentals",
        "Article: Best Practices in Teaching Young Children",
        "Workshop: Child-Centered Learning Approaches"
    ])

def get_user_name(user_id: int, db: Session) -> Optional[str]:
    """Get the user's first name for personalized messages"""
    # In a real implementation, this would query the user database
    # For now, we'll return a placeholder name
    return "Teacher"