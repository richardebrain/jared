"""
FastAPI server for the MentorMe Assessment API
"""
import json
import random
import datetime
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import sqlalchemy.exc

from .database import get_db, Base, engine
from .models import Question, Assessment, Response
from .loader import (
    load_random_question, 
    get_domains, 
    get_question_by_id, 
    get_question_counts_by_domain,
    get_next_difficulty_level
)
from .import_data import run_import

# Define API request/response models
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
app = FastAPI(title="MentorMe Assessment API")

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
    try:
        # Create tables if they don't exist
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Error initializing database: {str(e)}")


# API endpoints
@app.get("/")
def read_root():
    """Root endpoint to confirm API is running"""
    return {"message": "MentorMe Assessment API is running"}


@app.post("/api/assessments/start", response_model=AssessmentStartResponse)
def api_start_assessment(request: AssessmentStartRequest, db: Session = Depends(get_db)):
    """Start a new assessment for a user"""
    try:
        # Create a new assessment record
        assessment = Assessment(
            user_id=request.user_id,
            started_at=datetime.datetime.now().isoformat(),
            questions_asked=0,
            questions_correct=0,
            domain_scores={}
        )
        
        db.add(assessment)
        db.commit()
        db.refresh(assessment)
        
        return AssessmentStartResponse(
            assessment_id=assessment.id,
            message="Assessment started successfully"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error starting assessment: {str(e)}")


@app.post("/api/assessments/next-question", response_model=QuestionResponse)
def api_next_question(request: NextQuestionRequest, db: Session = Depends(get_db)):
    """Get the next question based on assessment history"""
    try:
        # Get assessment record
        assessment = db.query(Assessment).filter(Assessment.id == request.assessment_id).first()
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Determine which domains have been covered
        domain_history = {}
        for item in request.history:
            if item.domain not in domain_history:
                domain_history[item.domain] = {
                    "count": 0,
                    "correct": 0,
                    "current_difficulty": 1
                }
            
            domain_history[item.domain]["count"] += 1
            if item.correct:
                domain_history[item.domain]["correct"] += 1
            domain_history[item.domain]["current_difficulty"] = item.difficulty
        
        # Get all available domains
        all_domains = get_domains(db)
        
        # Determine which domain to ask a question from
        if not domain_history:
            # First question - start with Core Values
            if "Core Values" in all_domains:
                selected_domain = "Core Values"
                current_difficulty = 1
            else:
                # If no Core Values domain, pick a random domain
                selected_domain = random.choice(all_domains)
                current_difficulty = 1
        else:
            # Select domains that haven't reached 10 questions or special domains
            eligible_domains = []
            for domain in all_domains:
                # Special domains (Core Values, Mindful Morning) have max 5 questions
                if domain in ["Core Values", "Mindful Morning"]:
                    if domain not in domain_history or domain_history[domain]["count"] < 5:
                        eligible_domains.append(domain)
                # Other domains have max 10 questions
                elif domain not in domain_history or domain_history[domain]["count"] < 10:
                    eligible_domains.append(domain)
            
            if not eligible_domains:
                # All domains have reached their question limits
                raise HTTPException(status_code=200, detail="All sections completed")
            
            # Choose a domain that hasn't been asked recently
            # Simple strategy: pick randomly from eligible domains with lower priority for
            # domains that were just asked
            recent_domains = [item.domain for item in request.history[-3:] if item.domain in eligible_domains]
            prioritized_domains = [d for d in eligible_domains if d not in recent_domains]
            
            if prioritized_domains:
                selected_domain = random.choice(prioritized_domains)
            else:
                selected_domain = random.choice(eligible_domains)
            
            # Determine difficulty level for selected domain
            if selected_domain in domain_history:
                # Special domains (Core Values, Mindful Morning) always stay at difficulty 1
                if selected_domain in ["Core Values", "Mindful Morning"]:
                    current_difficulty = 1
                else:
                    # For other domains, get the last difficulty and update based on performance
                    last_history_for_domain = next(
                        (item for item in reversed(request.history) if item.domain == selected_domain), 
                        None
                    )
                    
                    if last_history_for_domain:
                        # Update difficulty based on the last answer for this domain
                        current_difficulty = get_next_difficulty_level(
                            db, 
                            selected_domain, 
                            last_history_for_domain.difficulty,
                            last_history_for_domain.correct
                        )
                    else:
                        current_difficulty = 1
            else:
                current_difficulty = 1
        
        # Get the question IDs that have already been asked
        asked_question_ids = [item.question_id for item in request.history]
        
        # Load a random question
        question = load_random_question(
            db, 
            domain=selected_domain, 
            difficulty=current_difficulty,
            exclude_ids=asked_question_ids
        )
        
        if not question:
            # Try a different difficulty level if no questions available at current level
            alternative_difficulties = [d for d in range(1, 5) if d != current_difficulty]
            for difficulty in alternative_difficulties:
                question = load_random_question(
                    db, 
                    domain=selected_domain, 
                    difficulty=difficulty,
                    exclude_ids=asked_question_ids
                )
                if question:
                    break
            
            # If still no question, try a different domain
            if not question:
                other_domains = [d for d in eligible_domains if d != selected_domain]
                if other_domains:
                    for domain in other_domains:
                        question = load_random_question(
                            db, 
                            domain=domain, 
                            exclude_ids=asked_question_ids
                        )
                        if question:
                            break
            
            # If we still don't have a question, that means we've exhausted all questions
            if not question:
                raise HTTPException(status_code=200, detail="All questions have been asked")
        
        # Format the question response
        options = {
            "A": question.option_a,
            "B": question.option_b,
            "C": question.option_c,
            "D": question.option_d
        }
        
        return QuestionResponse(
            id=question.id,
            question=question.question_text,
            q_type=question.q_type,
            options={k: v for k, v in options.items() if v},  # Remove empty options
            domain=question.domain,
            difficulty=question.difficulty
        )
        
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error getting next question: {str(e)}")


@app.post("/api/assessments/{assessment_id}/submit", response_model=AnswerResult)
def api_submit_answer(assessment_id: int, submission: AnswerSubmission, db: Session = Depends(get_db)):
    """Submit an answer for a question"""
    try:
        # Get assessment record
        assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Get question
        question = get_question_by_id(db, submission.question_id)
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        # Check if answer is correct
        is_correct = submission.user_answer.upper() == question.answer.upper()
        
        # Create response record
        response = Response(
            assessment_id=assessment_id,
            question_id=submission.question_id,
            user_answer=submission.user_answer,
            is_correct=is_correct,
            responded_at=datetime.datetime.now().isoformat(),
            time_taken_ms=submission.time_taken_ms
        )
        
        db.add(response)
        
        # Update assessment stats
        assessment.questions_asked += 1
        if is_correct:
            assessment.questions_correct += 1
        
        # Update domain scores
        domain_scores = assessment.domain_scores if assessment.domain_scores else {}
        
        if question.domain not in domain_scores:
            domain_scores[question.domain] = {
                "asked": 0,
                "correct": 0
            }
        
        domain_scores[question.domain]["asked"] = domain_scores[question.domain].get("asked", 0) + 1
        if is_correct:
            domain_scores[question.domain]["correct"] = domain_scores[question.domain].get("correct", 0) + 1
        
        assessment.domain_scores = domain_scores
        
        db.commit()
        
        # Prepare extended content if available
        extended_content = {}
        if question.story_why:
            extended_content["story_why"] = question.story_why
        if question.implementation_how:
            extended_content["implementation_how"] = question.implementation_how
        if question.science_behind_it:
            extended_content["science_behind_it"] = question.science_behind_it
        if question.practical_application_strategy:
            extended_content["practical_application"] = question.practical_application_strategy
        
        return AnswerResult(
            is_correct=is_correct,
            correct_answer=question.answer,
            explanation=question.teaching_explanation or "No explanation available.",
            extended_content=extended_content if extended_content else None
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error submitting answer: {str(e)}")


@app.post("/api/assessments/{assessment_id}/finish", response_model=LearningPathResponse)
def api_finish_assessment(assessment_id: int, db: Session = Depends(get_db)):
    """Finish an assessment and get personalized learning path"""
    try:
        # Get assessment record
        assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Mark assessment as completed
        assessment.completed_at = datetime.datetime.now().isoformat()
        
        # Calculate final domain scores
        domain_scores = assessment.domain_scores or {}
        normalized_scores = {}
        
        for domain, score_data in domain_scores.items():
            # Calculate percentage score for each domain
            if score_data["asked"] > 0:
                normalized_scores[domain] = score_data["correct"] / score_data["asked"] * 100
            else:
                normalized_scores[domain] = 0
        
        # Determine strongest and weakest domains (only if there are scores)
        strongest_domain = None
        weakest_domain = None
        
        if normalized_scores:
            strongest_domain = max(normalized_scores.items(), key=lambda x: x[1])[0]
            weakest_domain = min(normalized_scores.items(), key=lambda x: x[1])[0]
        
        # Generate learning path
        learning_path = {
            "recommended_modules": [],
            "focus_areas": []
        }
        
        # Add modules based on performance
        if weakest_domain:
            # Add modules related to the weakest domain
            learning_path["recommended_modules"].append(f"{weakest_domain} Fundamentals")
            learning_path["recommended_modules"].append(f"Advanced {weakest_domain}")
            
            # Add focus areas within the weakest domain
            weak_score = normalized_scores.get(weakest_domain, 0)
            
            if weak_score < 50:
                learning_path["focus_areas"].append(f"Review core concepts in {weakest_domain}")
                learning_path["focus_areas"].append(f"Practice basic {weakest_domain} techniques")
            elif weak_score < 75:
                learning_path["focus_areas"].append(f"Strengthen intermediate {weakest_domain} skills")
                learning_path["focus_areas"].append(f"Apply {weakest_domain} in diverse classroom contexts")
        
        # Always recommend Core Values if it's available
        if "Core Values" in normalized_scores:
            learning_path["recommended_modules"].append("Raising Arizona's CORE Values")
        
        # Add Mindful Morning module if available
        if "Mindful Morning" in normalized_scores:
            learning_path["recommended_modules"].append("Mindful Morning")
        
        # Save learning path to assessment
        assessment.learning_path = learning_path
        db.commit()
        
        # Return learning path response
        return LearningPathResponse(
            learning_path=learning_path,
            domain_scores=normalized_scores,
            questions_asked=assessment.questions_asked,
            questions_correct=assessment.questions_correct,
            strongest_domain=strongest_domain or "Not enough data",
            weakest_domain=weakest_domain or "Not enough data"
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error finishing assessment: {str(e)}")


# Additional endpoints can be added as needed