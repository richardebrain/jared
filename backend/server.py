"""
FastAPI server for the MentorMe Assessment API
"""
import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Question, Assessment, Response
from backend.loader import (
    load_questions, 
    load_random_question, 
    get_domains, 
    get_question_by_id,
    get_next_difficulty_level
)
from backend.import_data import run_import

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="MentorMe Assessment API")

# Add CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Pydantic models for request and response validation
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

# Startup event to ensure database is initialized
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    logger.info("Starting MentorMe Assessment API")
    logger.info("Initializing database...")
    
    # Import data if needed
    try:
        from backend.import_data import setup_database
        setup_database()
        logger.info("Database initialization complete")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        raise

# Root endpoint for health check
@app.get("/")
def read_root():
    """Root endpoint to confirm API is running"""
    return {"message": "MentorMe Assessment API is running"}

# Assessment API endpoints
@app.post("/api/assessments/start", response_model=AssessmentStartResponse)
def api_start_assessment(request: AssessmentStartRequest, db: Session = Depends(get_db)):
    """Start a new assessment for a user"""
    try:
        # Create a new assessment record
        assessment = Assessment(
            user_id=request.user_id,
            started_at=datetime.now().isoformat(),
            questions_asked=0,
            questions_correct=0,
            domain_scores=json.dumps({})
        )
        
        db.add(assessment)
        db.commit()
        db.refresh(assessment)
        
        logger.info(f"Started assessment {assessment.id} for user {request.user_id}")
        
        return {
            "assessment_id": assessment.id,
            "message": "Assessment started successfully"
        }
    
    except Exception as e:
        logger.error(f"Error starting assessment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/assessments/next-question", response_model=QuestionResponse)
def api_next_question(request: NextQuestionRequest, db: Session = Depends(get_db)):
    """Get the next question based on assessment history"""
    try:
        # Get the assessment
        assessment = db.query(Assessment).filter(Assessment.id == request.assessment_id).first()
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Check if assessment is complete - this would typically check against a configured
        # threshold of questions per domain or total questions
        exclude_ids = [item.question_id for item in request.history]
        
        # Get all available domains
        domains = get_domains(db)
        
        # If no history, start with difficulty 1 from the first domain
        if not request.history:
            domain = domains[0] if domains else None
            difficulty = 1
        else:
            # Analyze history to determine next domain and difficulty
            # This is where adaptive assessment logic comes in
            
            # Group history by domain
            domain_history = {}
            for item in request.history:
                if item.domain not in domain_history:
                    domain_history[item.domain] = []
                domain_history[item.domain].append(item)
            
            # Check if we need to move to the next domain
            current_domain = request.history[-1].domain
            
            # Criteria for moving to next domain:
            # 1. User has answered a minimum number of questions in this domain (e.g., 10)
            # 2. User has reached a high enough difficulty level
            
            domain_question_limit = 10
            if current_domain in ["Core Values", "Mindful Morning"]:
                domain_question_limit = 5
            
            if len(domain_history.get(current_domain, [])) >= domain_question_limit:
                # Move to the next domain
                try:
                    current_index = domains.index(current_domain)
                    next_index = (current_index + 1) % len(domains)
                    domain = domains[next_index]
                    difficulty = 1  # Start new domain at difficulty 1
                except (ValueError, IndexError):
                    # If current domain not found or no domains, use first domain
                    domain = domains[0] if domains else None
                    difficulty = 1
            else:
                # Stay in the current domain but adjust difficulty based on the last answer
                domain = current_domain
                current_difficulty = request.history[-1].difficulty
                correct = request.history[-1].correct
                difficulty = get_next_difficulty_level(db, domain, current_difficulty, correct)
        
        # Load a question based on the determined domain and difficulty
        question = load_random_question(db, domain=domain, difficulty=difficulty, exclude_ids=exclude_ids)
        
        # If no question found, try a different domain or difficulty
        if not question:
            # Try different difficulty levels
            for diff in range(1, 5):
                if diff != difficulty:
                    question = load_random_question(db, domain=domain, difficulty=diff, exclude_ids=exclude_ids)
                    if question:
                        break
            
            # If still no question, try different domains
            if not question:
                for dom in domains:
                    if dom != domain:
                        question = load_random_question(db, domain=dom, difficulty=1, exclude_ids=exclude_ids)
                        if question:
                            break
        
        # If still no question, assessment is complete
        if not question:
            raise HTTPException(status_code=200, detail="All questions have been asked")
        
        # Convert question to response format
        options = {
            "A": question.option_a or "",
            "B": question.option_b or "",
            "C": question.option_c or "",
            "D": question.option_d or "",
        }
        
        return {
            "id": question.id,
            "question": question.question_text,
            "q_type": question.q_type,
            "options": options,
            "domain": question.domain,
            "difficulty": question.difficulty
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting next question: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/assessments/{assessment_id}/submit", response_model=AnswerResult)
def api_submit_answer(assessment_id: int, submission: AnswerSubmission, db: Session = Depends(get_db)):
    """Submit an answer for a question"""
    try:
        # Get the assessment
        assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Get the question
        question = get_question_by_id(db, submission.question_id)
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        # Check if the answer is correct
        is_correct = question.answer == submission.user_answer
        
        # Update assessment statistics
        assessment.questions_asked += 1
        if is_correct:
            assessment.questions_correct += 1
        
        # Update domain scores
        domain_scores = json.loads(assessment.domain_scores) if assessment.domain_scores else {}
        
        if question.domain not in domain_scores:
            domain_scores[question.domain] = {
                "asked": 0,
                "correct": 0
            }
        
        domain_scores[question.domain]["asked"] += 1
        if is_correct:
            domain_scores[question.domain]["correct"] += 1
        
        assessment.domain_scores = json.dumps(domain_scores)
        
        # Create a response record
        response = Response(
            assessment_id=assessment_id,
            question_id=question.id,
            user_answer=submission.user_answer,
            is_correct=is_correct,
            responded_at=datetime.now().isoformat(),
            time_taken_ms=submission.time_taken_ms
        )
        
        db.add(response)
        db.commit()
        
        # Prepare extended content
        extended_content = None
        if question.story_why or question.implementation_how or question.science_behind_it or question.practical_application_strategy:
            extended_content = {
                "story_why": question.story_why,
                "implementation_how": question.implementation_how,
                "reflection_considerations": question.reflection_considerations,
                "child_impact_story": question.child_impact_story,
                "science_behind_it": question.science_behind_it,
                "practical_application": question.practical_application_strategy,
                "why_behind_it": question.why_behind_it
            }
            # Filter out None values
            extended_content = {k: v for k, v in extended_content.items() if v}
        
        return {
            "is_correct": is_correct,
            "correct_answer": question.answer,
            "explanation": question.teaching_explanation or "No explanation available.",
            "extended_content": extended_content
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting answer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/assessments/{assessment_id}/finish", response_model=LearningPathResponse)
def api_finish_assessment(assessment_id: int, db: Session = Depends(get_db)):
    """Finish an assessment and get personalized learning path"""
    try:
        # Get the assessment
        assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")
        
        # Mark the assessment as completed
        assessment.completed_at = datetime.now().isoformat()
        
        # Calculate domain scores
        domain_scores = json.loads(assessment.domain_scores) if assessment.domain_scores else {}
        
        # Convert raw scores to percentages
        normalized_scores = {}
        for domain, scores in domain_scores.items():
            if scores["asked"] > 0:
                normalized_scores[domain] = scores["correct"] / scores["asked"]
            else:
                normalized_scores[domain] = 0.0
        
        # Generate learning path based on scores
        learning_path = {}
        
        # Find weakest and strongest domains
        sorted_domains = sorted(normalized_scores.items(), key=lambda x: x[1])
        weakest_domains = sorted_domains[:2] if len(sorted_domains) >= 2 else sorted_domains
        strongest_domains = sorted_domains[-2:] if len(sorted_domains) >= 2 else sorted_domains
        
        weakest_domain = weakest_domains[0][0] if weakest_domains else "None"
        strongest_domain = strongest_domains[-1][0] if strongest_domains else "None"
        
        # Generate recommended modules based on weakest domains
        recommended_modules = []
        for domain, score in weakest_domains:
            if domain == "Core Values":
                recommended_modules.append("Raising Arizona's CORE Values Training")
            elif domain == "Child Development":
                recommended_modules.append("Building a Human: Child Development Essentials")
            elif domain == "Mindful Morning":
                recommended_modules.append("Mindful Morning Practices")
            elif domain == "Language and Literacy":
                recommended_modules.append("Language Development Strategies")
            elif domain == "Social and Emotional":
                recommended_modules.append("Social-Emotional Learning Techniques")
            elif domain == "Reasoning and Math":
                recommended_modules.append("Mathematical Thinking for Early Learners")
            else:
                recommended_modules.append(f"{domain} Training Module")
        
        # Generate focus areas based on specific questions missed
        focus_areas = []
        responses = db.query(Response).filter(Response.assessment_id == assessment_id, Response.is_correct == False).all()
        
        for response in responses:
            question = get_question_by_id(db, response.question_id)
            if question and question.sub_competency and question.sub_competency not in focus_areas:
                focus_areas.append(question.sub_competency)
        
        # Limit focus areas to prevent overwhelming
        focus_areas = focus_areas[:5]
        
        # Create the learning path
        learning_path = {
            "recommended_modules": recommended_modules,
            "focus_areas": focus_areas
        }
        
        # Save the learning path to the assessment
        assessment.learning_path = json.dumps(learning_path)
        
        db.commit()
        
        return {
            "learning_path": learning_path,
            "domain_scores": normalized_scores,
            "questions_asked": assessment.questions_asked,
            "questions_correct": assessment.questions_correct,
            "strongest_domain": strongest_domain,
            "weakest_domain": weakest_domain
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error finishing assessment: {e}")
        raise HTTPException(status_code=500, detail=str(e))