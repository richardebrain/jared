"""
FastAPI server for the MentorMe Assessment API
"""
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from pydantic import BaseModel
import datetime
import json
import random

from .database import get_db
from .models import Question, Assessment, Response
from .loader import load_questions, load_random_question, get_domains, get_question_by_id
from .import_data import setup_database, run_import

# Define request and response models
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
    description="API for MentorMe's enhanced ECE question assessment system",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    try:
        setup_database()
        print("Database tables created successfully")
    except Exception as e:
        print(f"Error setting up database: {str(e)}")

@app.get("/")
def read_root():
    """Root endpoint to confirm API is running"""
    return {"message": "MentorMe Assessment API is running", "version": "1.0.0"}

@app.post("/assessment/start", response_model=AssessmentStartResponse)
def api_start_assessment(request: AssessmentStartRequest, db: Session = Depends(get_db)):
    """Start a new assessment for a user"""
    # Create a new assessment
    assessment = Assessment(
        user_id=request.user_id,
        started_at=datetime.datetime.now().isoformat(),
        domain_scores={},
        questions_asked=0,
        questions_correct=0
    )
    
    # Add to database
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    return {
        "assessment_id": assessment.id,
        "message": "Assessment started successfully"
    }

@app.post("/assessment/{assessment_id}/next", response_model=QuestionResponse)
def api_next_question(request: NextQuestionRequest, db: Session = Depends(get_db)):
    """Get the next question based on assessment history"""
    # Get assessment
    assessment_id = request.assessment_id
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail=f"Assessment with ID {assessment_id} not found")
    
    # Analyze history to determine domain and difficulty
    history = request.history
    
    # Default domains to choose from
    available_domains = [
        "Classroom Management", 
        "Child Development", 
        "Curriculum Planning",
        "Health and Safety",
        "Family Engagement",
        "Professional Development",
        "Core Values",
        "Mindful Morning",
        "Building a Human"
    ]
    
    # Initialize domain scores if they don't exist
    if not assessment.domain_scores:
        assessment.domain_scores = {domain: 0.0 for domain in available_domains}
    
    # Check if this is a special case for Core Values or Mindful Morning
    # These sections have a fixed number of questions (5) and don't escalate in difficulty
    domain_counts = {}
    for item in history:
        domain_counts[item.domain] = domain_counts.get(item.domain, 0) + 1
    
    # Check for special domains with fixed questions
    special_domains = ["Core Values", "Mindful Morning"]
    for domain in special_domains:
        if domain in domain_counts and domain_counts[domain] >= 5:
            # Remove this domain from available domains if we've reached the limit
            if domain in available_domains:
                available_domains.remove(domain)
    
    # Select domain with the lowest score or weighted random selection
    if history:
        # Update domain scores based on history
        domain_scores = assessment.domain_scores
        
        for item in history:
            current_score = domain_scores.get(item.domain, 0)
            # Adjust score based on correct/incorrect answers
            if item.correct:
                # Increase score more for higher difficulty questions
                domain_scores[item.domain] = current_score + (0.1 * item.difficulty)
            else:
                # Decrease score less for higher difficulty questions (avoid punishing too much)
                domain_scores[item.domain] = max(0, current_score - (0.05 * item.difficulty))
        
        # Save updated scores
        assessment.domain_scores = domain_scores
        db.commit()
        
        # Weighted random selection favoring domains with lower scores
        if available_domains:
            weights = []
            for domain in available_domains:
                # Lower score = higher weight
                weight = 1.0 - (domain_scores.get(domain, 0) / 4.0)  # Normalize by max difficulty
                weights.append(max(0.1, weight))  # Ensure minimal weight
            
            selected_domain = random.choices(available_domains, weights=weights, k=1)[0]
        else:
            # If no domains available, assessment is complete
            raise HTTPException(status_code=200, detail="All sections completed")
    else:
        # For first question, random domain
        selected_domain = random.choice(available_domains)
    
    # Determine appropriate difficulty level based on history for this domain
    domain_history = [item for item in history if item.domain == selected_domain]
    
    # Special case for Core Values and Mindful Morning: always difficulty 1
    if selected_domain in special_domains:
        difficulty = 1
    else:
        # For other domains, calculate appropriate difficulty
        if domain_history:
            # Count correct answers at each difficulty level
            correct_by_difficulty = {}
            for item in domain_history:
                if item.correct:
                    correct_by_difficulty[item.difficulty] = correct_by_difficulty.get(item.difficulty, 0) + 1
            
            # Advance difficulty if 2+ correct at current level
            current_max_difficulty = max([item.difficulty for item in domain_history])
            
            if current_max_difficulty < 4 and correct_by_difficulty.get(current_max_difficulty, 0) >= 2:
                # Advance to next difficulty level
                difficulty = current_max_difficulty + 1
            else:
                # Stay at current max difficulty
                difficulty = current_max_difficulty
        else:
            # Start with difficulty 1
            difficulty = 1
    
    # Get question IDs already asked to exclude them
    asked_question_ids = [item.question_id for item in history]
    
    # Get next question based on domain and difficulty
    question = load_random_question(db, domain=selected_domain, difficulty=difficulty, exclude_ids=asked_question_ids)
    
    # If no question found at current difficulty, try a lower difficulty
    if not question and difficulty > 1:
        question = load_random_question(db, domain=selected_domain, difficulty=difficulty-1, exclude_ids=asked_question_ids)
    
    # If still no question, try any difficulty
    if not question:
        question = load_random_question(db, domain=selected_domain, exclude_ids=asked_question_ids)
    
    # If no questions left in this domain, try any domain
    if not question:
        question = load_random_question(db, exclude_ids=asked_question_ids)
    
    # If still no question, we've run out of questions
    if not question:
        raise HTTPException(status_code=404, detail="No more questions available")
    
    # Format response
    return {
        "id": question.id,
        "question": question.question_text,
        "q_type": question.q_type,
        "options": {
            "A": question.option_a,
            "B": question.option_b,
            "C": question.option_c,
            "D": question.option_d
        },
        "domain": question.domain,
        "difficulty": question.difficulty
    }

@app.post("/assessment/{assessment_id}/answer", response_model=AnswerResult)
def api_submit_answer(assessment_id: int, submission: AnswerSubmission, db: Session = Depends(get_db)):
    """Submit an answer for a question"""
    # Get assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail=f"Assessment with ID {assessment_id} not found")
    
    # Get question
    question = get_question_by_id(db, submission.question_id)
    
    if not question:
        raise HTTPException(status_code=404, detail=f"Question with ID {submission.question_id} not found")
    
    # Check if answer is correct
    is_correct = submission.user_answer.upper() == question.answer.upper()
    
    # Create response record
    response = Response(
        assessment_id=assessment_id,
        question_id=submission.question_id,
        user_answer=submission.user_answer.upper(),
        is_correct=is_correct,
        responded_at=datetime.datetime.now().isoformat(),
        time_taken_ms=submission.time_taken_ms
    )
    
    # Add to database
    db.add(response)
    
    # Update assessment metrics
    assessment.questions_asked += 1
    if is_correct:
        assessment.questions_correct += 1
    
    db.commit()
    
    # Prepare extended content
    extended_content = {}
    if question.story_why:
        extended_content["story_why"] = question.story_why
    if question.implementation_how:
        extended_content["implementation_how"] = question.implementation_how
    if question.reflection_considerations:
        extended_content["reflection_considerations"] = question.reflection_considerations
    if question.child_impact_story:
        extended_content["child_impact_story"] = question.child_impact_story
    if question.science_behind_it:
        extended_content["science_behind_it"] = question.science_behind_it
    if question.practical_application_strategy:
        extended_content["practical_application_strategy"] = question.practical_application_strategy
    if question.why_behind_it:
        extended_content["why_behind_it"] = question.why_behind_it
    
    # Return result with correct answer and explanation
    return {
        "is_correct": is_correct,
        "correct_answer": question.answer,
        "explanation": question.teaching_explanation,
        "extended_content": extended_content if extended_content else None
    }

@app.post("/assessment/{assessment_id}/finish", response_model=LearningPathResponse)
def api_finish_assessment(assessment_id: int, db: Session = Depends(get_db)):
    """Finish an assessment and get personalized learning path"""
    # Get assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail=f"Assessment with ID {assessment_id} not found")
    
    # Mark assessment as completed
    if not assessment.completed_at:
        assessment.completed_at = datetime.datetime.now().isoformat()
    
    # Get domain scores
    domain_scores = assessment.domain_scores
    
    # Identify strongest and weakest domains
    if domain_scores:
        strongest_domain = max(domain_scores.items(), key=lambda x: x[1])[0]
        weakest_domain = min(domain_scores.items(), key=lambda x: x[1])[0]
    else:
        strongest_domain = "None"
        weakest_domain = "None"
    
    # Generate learning path recommendations
    learning_path = {
        "recommended_modules": [],
        "focus_areas": []
    }
    
    # Add recommended modules based on weakest areas
    for domain, score in sorted(domain_scores.items(), key=lambda x: x[1]):
        if score < 2.0:  # Focus on domains with lower scores
            if domain == "Child Development":
                learning_path["recommended_modules"].append("Building a Human")
                learning_path["focus_areas"].append(f"Child Development Fundamentals")
            elif domain == "Classroom Management":
                learning_path["recommended_modules"].append("Effective Classroom Management")
                learning_path["focus_areas"].append(f"Classroom Organization and Routines")
            elif domain == "Curriculum Planning":
                learning_path["recommended_modules"].append("Creative Curriculum Strategies")
                learning_path["focus_areas"].append(f"Developing Age-Appropriate Activities")
            elif domain == "Health and Safety":
                learning_path["recommended_modules"].append("Health and Safety Essentials")
                learning_path["focus_areas"].append(f"Creating a Safe Learning Environment")
            elif domain == "Family Engagement":
                learning_path["recommended_modules"].append("Family Partnership Strategies")
                learning_path["focus_areas"].append(f"Building Strong Relationships with Parents")
            elif domain == "Professional Development":
                learning_path["recommended_modules"].append("Professional Growth Pathways")
                learning_path["focus_areas"].append(f"Continuous Learning Strategies")
            elif domain == "Core Values":
                learning_path["recommended_modules"].append("Raising Arizona's CORE")
                learning_path["focus_areas"].append(f"Understanding and Applying Core Values")
            elif domain == "Mindful Morning":
                learning_path["recommended_modules"].append("Mindful Morning")
                learning_path["focus_areas"].append(f"Teacher Wellness and Self-Care")
            elif domain == "Building a Human":
                learning_path["recommended_modules"].append("Building a Human")
                learning_path["focus_areas"].append(f"Childhood Development and Trauma")
    
    # Save learning path in the assessment
    assessment.learning_path = learning_path
    db.commit()
    
    # Return learning path response
    return {
        "learning_path": learning_path,
        "domain_scores": domain_scores,
        "questions_asked": assessment.questions_asked,
        "questions_correct": assessment.questions_correct,
        "strongest_domain": strongest_domain,
        "weakest_domain": weakest_domain
    }