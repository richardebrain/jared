"""
FastAPI server for the MentorMe Assessment API
"""
import json
import logging
import random
import time
from datetime import datetime
from typing import Dict, List, Optional, Any, Union

from fastapi import FastAPI, Depends, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .database import get_db, engine, Base
from .models import Question, Assessment, Response as AssessmentResponse
from .loader import (
    load_random_question,
    get_domains,
    get_question_by_id,
    get_next_difficulty_level
)
from .import_data import run_import

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("mentorme-api")

# Define Pydantic models for API requests and responses
class AssessmentStartRequest(BaseModel):
    user_id: int

class AssessmentStartResponse(BaseModel):
    assessment_id: int
    message: str

class QuestionResponse(BaseModel):
    id: int
    question: str
    q_type: str
    options: Dict[str, str]
    domain: str
    difficulty: int

class AnswerSubmission(BaseModel):
    question_id: int
    user_answer: str
    time_taken_ms: Optional[int] = None

class AnswerResult(BaseModel):
    is_correct: bool
    correct_answer: str
    explanation: str
    extended_content: Optional[Dict] = None

class AssessmentHistoryItem(BaseModel):
    question_id: int
    domain: str
    correct: bool
    difficulty: int

class NextQuestionRequest(BaseModel):
    assessment_id: int
    history: List[AssessmentHistoryItem]

class LearningPathResponse(BaseModel):
    learning_path: Dict[str, List[str]]
    domain_scores: Dict[str, float]
    questions_asked: int
    questions_correct: int
    strongest_domain: str
    weakest_domain: str

# Create FastAPI app
app = FastAPI(
    title="MentorMe Assessment API",
    description="API for adaptive assessment and personalized learning paths",
    version="1.0.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to initialize database
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    Base.metadata.create_all(bind=engine)
    logger.info("Database initialized")

# Root endpoint
@app.get("/")
def read_root():
    """Root endpoint to confirm API is running"""
    return {"message": "MentorMe Assessment API is running"}

# Start assessment endpoint
@app.post("/api/assessments/start", response_model=AssessmentStartResponse)
def api_start_assessment(request: AssessmentStartRequest, db: Session = Depends(get_db)):
    """Start a new assessment for a user"""
    # Create a new assessment record
    now_str = datetime.now().isoformat()
    assessment = Assessment(
        user_id=request.user_id,
        started_at=now_str,
        questions_asked=0,
        questions_correct=0,
        domain_scores=json.dumps({})
    )
    
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    logger.info(f"Started assessment ID {assessment.id} for user {request.user_id}")
    
    return AssessmentStartResponse(
        assessment_id=assessment.id,
        message="Assessment started successfully"
    )

# Get next question endpoint
@app.post("/api/assessments/next-question", response_model=QuestionResponse)
def api_next_question(request: NextQuestionRequest, db: Session = Depends(get_db)):
    """Get the next question based on assessment history"""
    # Verify the assessment exists
    assessment = db.query(Assessment).filter(Assessment.id == request.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Check if assessment is already completed
    if assessment.completed_at:
        return Response(content=json.dumps({"detail": "All questions have been asked"}), 
                         media_type="application/json")
    
    # Get list of question IDs that have already been asked
    exclude_ids = [item.question_id for item in request.history]
    
    # Determine next domain and difficulty based on history
    # Special domains (not adaptive difficulty): Core Values, Mindful Morning
    special_domains = ["Core Values", "Mindful Morning"]
    
    # Domain selection logic
    available_domains = get_domains(db)
    if not available_domains:
        raise HTTPException(status_code=500, detail="No questions available in the database")
    
    # Count questions by domain in history
    domain_counts = {}
    for item in request.history:
        domain_counts[item.domain] = domain_counts.get(item.domain, 0) + 1
    
    # For special domains, limit to 5 questions each
    for domain in special_domains:
        if domain in domain_counts and domain_counts[domain] >= 5:
            # Remove from available domains
            if domain in available_domains:
                available_domains.remove(domain)
    
    # If all domains have been covered, pick domain with fewest questions or is none/empty
    if not available_domains or len(request.history) == 0:
        # First question or all domains covered - pick randomly
        all_domains = get_domains(db)
        selected_domain = random.choice(all_domains) if all_domains else None
        difficulty = 1  # Start with difficulty 1
    else:
        # Select domain with fewest questions
        domain_candidates = available_domains.copy()
        
        # If there are special domains that haven't reached their limit, prioritize them
        special_candidates = [d for d in special_domains if d in domain_candidates and domain_counts.get(d, 0) < 5]
        if special_candidates:
            selected_domain = random.choice(special_candidates)
            difficulty = 1  # Special domains always use difficulty 1
        else:
            # For regular domains - adaptive difficulty
            # Find domains with fewest questions
            min_count = min(domain_counts.get(d, 0) for d in domain_candidates) if domain_candidates else 0
            least_asked_domains = [d for d in domain_candidates if domain_counts.get(d, 0) <= min_count]
            
            # Pick randomly from least asked domains
            selected_domain = random.choice(least_asked_domains)
            
            # Determine difficulty based on last answer in this domain
            last_domain_item = next((item for item in reversed(request.history) 
                                     if item.domain == selected_domain), None)
            
            if last_domain_item:
                # Adaptive difficulty based on last answer in this domain
                difficulty = get_next_difficulty_level(
                    db, selected_domain, last_domain_item.difficulty, last_domain_item.correct
                )
            else:
                # First question in this domain
                difficulty = 1
    
    # Load a random question with the selected domain and difficulty
    question = load_random_question(
        db, domain=selected_domain, difficulty=difficulty, exclude_ids=exclude_ids
    )
    
    # If no question was found, try any domain or difficulty
    if not question:
        logger.warning(f"No question found for domain={selected_domain}, difficulty={difficulty}")
        question = load_random_question(db, exclude_ids=exclude_ids)
        
        if not question:
            # No more questions available
            logger.info(f"No more questions available for assessment {assessment.id}")
            return Response(content=json.dumps({"detail": "All questions have been asked"}), 
                             media_type="application/json")
    
    # Return the question
    return QuestionResponse(
        id=question.id,
        question=question.question_text,
        q_type=question.q_type,
        options={
            "A": question.option_a,
            "B": question.option_b,
            "C": question.option_c,
            "D": question.option_d,
        },
        domain=question.domain,
        difficulty=question.difficulty,
    )

# Submit answer endpoint
@app.post("/api/assessments/{assessment_id}/submit", response_model=AnswerResult)
def api_submit_answer(assessment_id: int, submission: AnswerSubmission, db: Session = Depends(get_db)):
    """Submit an answer for a question"""
    # Verify assessment exists
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Verify question exists
    question = get_question_by_id(db, submission.question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Check if answer is correct
    is_correct = submission.user_answer.upper() == question.answer.upper()
    
    # Create response record
    now_str = datetime.now().isoformat()
    response = AssessmentResponse(
        assessment_id=assessment_id,
        question_id=submission.question_id,
        user_answer=submission.user_answer.upper(),
        is_correct=is_correct,
        responded_at=now_str,
        time_taken_ms=submission.time_taken_ms,
    )
    
    db.add(response)
    
    # Update assessment stats
    assessment.questions_asked += 1
    if is_correct:
        assessment.questions_correct += 1
    
    # Update domain scores in assessment
    domain_scores = json.loads(assessment.domain_scores) if assessment.domain_scores else {}
    domain = question.domain
    
    # Calculate new score for this domain
    domain_responses = db.query(AssessmentResponse).join(
        Question, AssessmentResponse.question_id == Question.id
    ).filter(
        AssessmentResponse.assessment_id == assessment_id,
        Question.domain == domain
    ).all()
    
    domain_correct = sum(1 for r in domain_responses if r.is_correct)
    domain_total = len(domain_responses)
    domain_score = domain_correct / domain_total if domain_total > 0 else 0
    
    # Update domain score
    domain_scores[domain] = domain_score
    assessment.domain_scores = json.dumps(domain_scores)
    
    db.commit()
    
    # Prepare extended content if available
    extended_content = None
    if any([
        question.science_behind_it,
        question.practical_application_strategy,
        question.story_why,
        question.implementation_how,
        question.reflection_considerations,
        question.child_impact_story,
        question.why_behind_it
    ]):
        extended_content = {
            "science_behind_it": question.science_behind_it,
            "practical_application": question.practical_application_strategy,
            "story_why": question.story_why,
            "implementation_how": question.implementation_how,
            "reflection_considerations": question.reflection_considerations,
            "child_impact_story": question.child_impact_story,
            "why_behind_it": question.why_behind_it
        }
    
    # Return result
    return AnswerResult(
        is_correct=is_correct,
        correct_answer=question.answer,
        explanation=question.teaching_explanation or "No explanation available.",
        extended_content=extended_content
    )

# Finish assessment and get learning path endpoint
@app.post("/api/assessments/{assessment_id}/finish", response_model=LearningPathResponse)
def api_finish_assessment(assessment_id: int, db: Session = Depends(get_db)):
    """Finish an assessment and get personalized learning path"""
    # Verify assessment exists
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Mark assessment as completed
    now_str = datetime.now().isoformat()
    assessment.completed_at = now_str
    
    # Get domain scores and ensure they're up to date
    domain_scores = json.loads(assessment.domain_scores) if assessment.domain_scores else {}
    
    # Get all domains in the database
    all_domains = get_domains(db)
    
    # For any missing domains, calculate their scores
    for domain in all_domains:
        if domain not in domain_scores:
            # Get responses for this domain
            domain_responses = db.query(AssessmentResponse).join(
                Question, AssessmentResponse.question_id == Question.id
            ).filter(
                AssessmentResponse.assessment_id == assessment_id,
                Question.domain == domain
            ).all()
            
            domain_correct = sum(1 for r in domain_responses if r.is_correct)
            domain_total = len(domain_responses)
            domain_score = domain_correct / domain_total if domain_total > 0 else 0
            
            domain_scores[domain] = domain_score
    
    # Update assessment with final domain scores
    assessment.domain_scores = json.dumps(domain_scores)
    
    # Identify strongest and weakest domains
    if domain_scores:
        strongest_domain = max(domain_scores, key=domain_scores.get)
        weakest_domain = min(domain_scores, key=domain_scores.get)
    else:
        strongest_domain = "None"
        weakest_domain = "None"
    
    # Generate learning path recommendations
    learning_path = generate_learning_path(domain_scores, strongest_domain, weakest_domain)
    
    # Save learning path to assessment
    assessment.learning_path = json.dumps(learning_path)
    db.commit()
    
    # Return learning path response
    return LearningPathResponse(
        learning_path=learning_path,
        domain_scores=domain_scores,
        questions_asked=assessment.questions_asked,
        questions_correct=assessment.questions_correct,
        strongest_domain=strongest_domain,
        weakest_domain=weakest_domain
    )

def generate_learning_path(domain_scores, strongest_domain, weakest_domain):
    """Generate a personalized learning path based on assessment results"""
    learning_path = {}
    
    # Create recommendations for each domain
    for domain, score in domain_scores.items():
        # Generate domain-specific recommendations based on score
        domain_recommendations = []
        
        if score < 0.4:
            # Poor performance - foundational learning
            domain_recommendations.append(f"Complete the {domain} Fundamentals module")
            domain_recommendations.append(f"Review the {domain} Key Concepts guide")
            domain_recommendations.append(f"Watch the Introduction to {domain} video series")
        elif score < 0.7:
            # Moderate performance - skill building
            domain_recommendations.append(f"Take the Intermediate {domain} module")
            domain_recommendations.append(f"Practice with {domain} interactive exercises")
            domain_recommendations.append(f"Join a discussion group on {domain} topics")
        else:
            # Strong performance - mastery and mentoring
            domain_recommendations.append(f"Complete the Advanced {domain} module")
            domain_recommendations.append(f"Take the {domain} certification assessment")
            domain_recommendations.append(f"Mentor others in {domain} skills")
        
        learning_path[domain] = domain_recommendations
    
    # Add general recommendations
    recommended_modules = []
    
    # Prioritize weakest domain modules
    if weakest_domain in domain_scores:
        score = domain_scores[weakest_domain]
        if score < 0.4:
            recommended_modules.append(f"{weakest_domain} Foundations")
        elif score < 0.7:
            recommended_modules.append(f"{weakest_domain} Intermediate Skills")
        else:
            recommended_modules.append(f"{weakest_domain} Advanced Topics")
    
    # Add strong domain mentoring opportunities
    if strongest_domain in domain_scores and domain_scores[strongest_domain] > 0.8:
        recommended_modules.append(f"{strongest_domain} Mentorship Program")
    
    # Add general skill development modules
    recommended_modules.append("Effective Teaching Strategies")
    recommended_modules.append("Classroom Management Essentials")
    
    # Add to learning path
    learning_path["recommended_modules"] = recommended_modules
    
    return learning_path