"""
Main API module for the MentorMe Enhanced Assessment system
This module defines the FastAPI endpoints for the assessment system
"""
from datetime import datetime
import json
from typing import Dict, List, Optional, Any
import random

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .database import get_db
from .models import Question, Assessment, Response
from .loader import (
    load_random_question,
    get_domains,
    get_question_by_id,
    get_next_difficulty_level,
)
from .import_data import setup_database

# Initialize FastAPI app
app = FastAPI(title="MentorMe Enhanced Assessment API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    setup_database()

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

class AnswerSubmission(BaseModel):
    question_id: int
    user_answer: str
    time_taken_ms: Optional[int] = None

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

# API Routes
@app.get("/")
def read_root():
    """Root endpoint"""
    return {"message": "MentorMe Enhanced Assessment API is running"}

@app.post("/assessments/start")
def start_assessment(request: AssessmentStartRequest, db: Session = Depends(get_db)):
    """Start a new assessment for a user"""
    # Create a new assessment
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
    
    return {
        "assessment_id": assessment.id,
        "message": "Assessment started successfully"
    }

@app.post("/assessments/{assessment_id}/next-question")
def next_question(request: NextQuestionRequest, db: Session = Depends(get_db)):
    """Get the next question based on assessment history"""
    # Verify the assessment exists
    assessment = db.query(Assessment).filter(Assessment.id == request.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Get all domains if this is the first question
    if not request.history:
        domains = get_domains(db)
        # Start with Core Values
        if "Core Values" in domains:
            domain = "Core Values"
            difficulty = 1
        else:
            domain = random.choice(domains)
            difficulty = 1
        
        # Load a random question from the selected domain
        question = load_random_question(db, domain=domain, difficulty=difficulty)
        
        if not question:
            raise HTTPException(status_code=404, detail=f"No questions available for domain: {domain}")
        
        return format_question(question)
    
    # Process history to select the next domain and difficulty
    asked_domains = set()
    domain_correct_count = {}
    domain_difficulty = {}
    exclude_ids = []
    
    for item in request.history:
        asked_domains.add(item.domain)
        exclude_ids.append(item.question_id)
        
        if item.domain not in domain_correct_count:
            domain_correct_count[item.domain] = 0
            domain_difficulty[item.domain] = item.difficulty
        
        if item.correct:
            domain_correct_count[item.domain] += 1
        
        # Update current difficulty level for this domain
        domain_difficulty[item.domain] = get_next_difficulty_level(
            db, item.domain, item.difficulty, item.correct
        )
    
    # Determine domain selection strategy
    all_domains = get_domains(db)
    
    # Handle domain progression
    last_item = request.history[-1]
    last_domain = last_item.domain
    
    # Special handling for Core Values and Mindful Morning
    if last_domain == "Core Values":
        # After 5 Core Values questions, switch to Mindful Morning if available
        if domain_correct_count.get("Core Values", 0) >= 5 or len([h for h in request.history if h.domain == "Core Values"]) >= 5:
            if "Mindful Morning" in all_domains:
                next_domain = "Mindful Morning"
                next_difficulty = 1
            else:
                # If Mindful Morning not available, pick another domain
                remaining_domains = [d for d in all_domains if d not in asked_domains or d == "Core Values"]
                if not remaining_domains:
                    remaining_domains = all_domains
                next_domain = random.choice([d for d in remaining_domains if d != "Core Values"])
                next_difficulty = 1
        else:
            # Continue with Core Values
            next_domain = "Core Values"
            next_difficulty = 1
            
    elif last_domain == "Mindful Morning":
        # After 5 Mindful Morning questions, move to a new domain
        if domain_correct_count.get("Mindful Morning", 0) >= 5 or len([h for h in request.history if h.domain == "Mindful Morning"]) >= 5:
            remaining_domains = [d for d in all_domains if d not in asked_domains or d == "Mindful Morning"]
            if not remaining_domains or (len(remaining_domains) == 1 and remaining_domains[0] == "Mindful Morning"):
                remaining_domains = [d for d in all_domains if d not in ["Core Values", "Mindful Morning"]]
                if not remaining_domains:
                    remaining_domains = all_domains
            next_domain = random.choice([d for d in remaining_domains if d not in ["Core Values", "Mindful Morning"]])
            next_difficulty = 1
        else:
            # Continue with Mindful Morning
            next_domain = "Mindful Morning"
            next_difficulty = 1
    
    # For other domains
    else:
        # If reached 10 correct answers in current domain or 15 total questions, switch to a new domain
        if domain_correct_count.get(last_domain, 0) >= 10 or len([h for h in request.history if h.domain == last_domain]) >= 15:
            # Pick a domain that hasn't been completed yet
            completed_domains = [d for d in domain_correct_count.keys() 
                                if domain_correct_count[d] >= 10 or 
                                len([h for h in request.history if h.domain == d]) >= 15]
            
            available_domains = [d for d in all_domains if d not in completed_domains]
            
            # If all domains have been completed, we're done with the assessment
            if not available_domains:
                return {
                    "message": "Assessment complete",
                    "complete": True
                }
            
            next_domain = random.choice(available_domains)
            next_difficulty = 1
        else:
            # Continue with current domain at appropriate difficulty
            next_domain = last_domain
            next_difficulty = domain_difficulty.get(last_domain, 1)
    
    # Load the next question
    question = load_random_question(
        db, domain=next_domain, difficulty=next_difficulty, exclude_ids=exclude_ids
    )
    
    # If no question available at this difficulty, try other difficulties
    if not question and next_difficulty > 1:
        for diff in range(next_difficulty - 1, 0, -1):
            question = load_random_question(
                db, domain=next_domain, difficulty=diff, exclude_ids=exclude_ids
            )
            if question:
                break
    
    # If still no question, try a different domain
    if not question:
        other_domains = [d for d in all_domains if d != next_domain]
        for domain in other_domains:
            question = load_random_question(db, domain=domain, exclude_ids=exclude_ids)
            if question:
                break
    
    # If no questions available at all, end the assessment
    if not question:
        return {
            "message": "No more questions available",
            "complete": True
        }
    
    return format_question(question)

@app.post("/assessments/{assessment_id}/submit-answer")
def submit_answer(assessment_id: int, submission: AnswerSubmission, db: Session = Depends(get_db)):
    """Submit an answer for a question"""
    # Verify the assessment exists
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Get the question
    question = get_question_by_id(db, submission.question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Check if answer is correct
    is_correct = question.answer.upper() == submission.user_answer.upper()
    
    # Create response record
    response = Response(
        assessment_id=assessment_id,
        question_id=submission.question_id,
        user_answer=submission.user_answer,
        is_correct=is_correct,
        responded_at=datetime.now().isoformat(),
        time_taken_ms=submission.time_taken_ms
    )
    
    db.add(response)
    
    # Update assessment stats
    assessment.questions_asked += 1
    if is_correct:
        assessment.questions_correct += 1
    
    # Update domain scores
    domain_scores = json.loads(assessment.domain_scores)
    domain = question.domain
    
    if domain not in domain_scores:
        domain_scores[domain] = {
            "asked": 0,
            "correct": 0
        }
    
    domain_scores[domain]["asked"] = domain_scores[domain].get("asked", 0) + 1
    if is_correct:
        domain_scores[domain]["correct"] = domain_scores[domain].get("correct", 0) + 1
    
    assessment.domain_scores = json.dumps(domain_scores)
    
    db.commit()
    
    # Prepare response including extended content if available
    extended_content = {}
    
    if question.teaching_explanation:
        extended_content["teaching_explanation"] = question.teaching_explanation
    
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
        
    if question.resources:
        try:
            extended_content["resources"] = json.loads(question.resources)
        except:
            extended_content["resources"] = []
    
    return {
        "is_correct": is_correct,
        "correct_answer": question.answer,
        "explanation": question.teaching_explanation,
        "extended_content": extended_content
    }

@app.post("/assessments/{assessment_id}/finish")
def finish_assessment(assessment_id: int, db: Session = Depends(get_db)):
    """Finish an assessment and get personalized learning path"""
    # Verify the assessment exists
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Mark as completed
    assessment.completed_at = datetime.now().isoformat()
    
    # Calculate final domain scores and identify strengths/weaknesses
    domain_scores_raw = json.loads(assessment.domain_scores)
    domain_scores = {}
    
    for domain, scores in domain_scores_raw.items():
        if scores["asked"] > 0:
            domain_scores[domain] = scores["correct"] / scores["asked"] * 100
        else:
            domain_scores[domain] = 0
    
    # Generate learning path
    strongest_domain = max(domain_scores.items(), key=lambda x: x[1])[0] if domain_scores else "None"
    weakest_domain = min(domain_scores.items(), key=lambda x: x[1])[0] if domain_scores else "None"
    
    learning_path = {}
    
    # Add recommendations for each domain
    for domain, score in domain_scores.items():
        if domain == strongest_domain:
            learning_path[domain] = [
                "Mentor other teachers in this area",
                "Create materials to share your expertise",
                "Lead professional development sessions"
            ]
        elif domain == weakest_domain:
            learning_path[domain] = [
                "Focus on practical application exercises",
                "Complete our specialized training modules",
                "Schedule observation sessions with master teachers"
            ]
        elif score < 60:
            learning_path[domain] = [
                "Review core concepts in this area",
                "Practice with guided exercises",
                "Schedule time with a mentor teacher"
            ]
        elif score < 80:
            learning_path[domain] = [
                "Strengthen your skills with advanced modules",
                "Apply concepts in classroom activities",
                "Join our community discussion on this topic"
            ]
        else:
            learning_path[domain] = [
                "Explore specialized techniques",
                "Develop your leadership in this area",
                "Share your successful strategies"
            ]
    
    # Store the learning path in the assessment
    assessment.learning_path = json.dumps(learning_path)
    db.commit()
    
    # Return learning path and scores
    return {
        "learning_path": learning_path,
        "domain_scores": domain_scores,
        "questions_asked": assessment.questions_asked,
        "questions_correct": assessment.questions_correct,
        "strongest_domain": strongest_domain,
        "weakest_domain": weakest_domain
    }

def format_question(question: Question) -> QuestionResponse:
    """Format a question for API response"""
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