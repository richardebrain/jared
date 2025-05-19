"""
FastAPI server for the MentorMe Assessment API
"""

import json
import math
import random
import datetime
from typing import Dict, List, Optional

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .database import get_db
from .models import Question, Assessment, Response
from .loader import (
    load_random_question, get_domains, get_question_by_id,
    get_question_counts_by_domain, get_next_difficulty_level
)
from .import_data import setup_database, run_import

# Define API request and response models
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
app = FastAPI(title="MentorMe Enhanced Assessment API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to initialize database
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    setup_database()
    # Uncomment to import data on startup if needed
    # run_import()

# Root endpoint
@app.get("/")
def read_root():
    """Root endpoint to confirm API is running"""
    return {"message": "MentorMe Enhanced Assessment API is running"}

# API endpoints
@app.post("/api/assessment/start", response_model=AssessmentStartResponse)
def api_start_assessment(request: AssessmentStartRequest, db: Session = Depends(get_db)):
    """Start a new assessment for a user"""
    # Create new assessment
    now = datetime.datetime.now().isoformat()
    
    assessment = Assessment(
        user_id=request.user_id,
        started_at=now,
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

@app.post("/api/assessment/{assessment_id}/next-question", response_model=Optional[QuestionResponse])
def api_next_question(request: NextQuestionRequest, db: Session = Depends(get_db)):
    """Get the next question based on assessment history"""
    # Retrieve assessment
    assessment = db.query(Assessment).filter(Assessment.id == request.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # If first question, pick from a random domain
    if not request.history:
        domains = get_domains(db)
        random_domain = random.choice(domains)
        question = load_random_question(db, domain=random_domain, difficulty=1)
    else:
        # Analyze history to determine next domain and difficulty
        asked_question_ids = [h.question_id for h in request.history]
        domain_questions = {}
        domain_correct = {}
        
        for item in request.history:
            domain = item.domain
            if domain not in domain_questions:
                domain_questions[domain] = 0
                domain_correct[domain] = 0
            
            domain_questions[domain] += 1
            if item.correct:
                domain_correct[domain] += 1
        
        # Determine completion status for each domain
        domains_to_complete = [d for d in get_domains(db) if d not in domain_questions or domain_questions[d] < 10]
        
        # If all domains have at least 10 questions, assessment is complete
        if not domains_to_complete:
            return None
        
        # Either continue with current domain or pick a new one
        last_item = request.history[-1]
        current_domain = last_item.domain
        
        # If we've asked fewer than 10 questions in this domain, continue
        if current_domain in domain_questions and domain_questions[current_domain] < 10:
            chosen_domain = current_domain
            # Determine next difficulty level based on previous answer
            difficulty = get_next_difficulty_level(
                db, 
                current_domain, 
                last_item.difficulty,
                last_item.correct
            )
        else:
            # Pick a new domain that needs more questions
            chosen_domain = random.choice(domains_to_complete)
            # Start with difficulty 1 for new domain
            difficulty = 1
        
        # Load question from chosen domain and difficulty
        question = load_random_question(
            db, 
            domain=chosen_domain,
            difficulty=difficulty,
            exclude_ids=asked_question_ids
        )
        
        # If no question found at this difficulty, try a different one
        if not question:
            # Try a lower difficulty
            for d in range(difficulty-1, 0, -1):
                question = load_random_question(
                    db, 
                    domain=chosen_domain,
                    difficulty=d,
                    exclude_ids=asked_question_ids
                )
                if question:
                    break
            
            # If still no question, try a different domain
            if not question:
                other_domains = [d for d in domains_to_complete if d != chosen_domain]
                if other_domains:
                    chosen_domain = random.choice(other_domains)
                    question = load_random_question(
                        db, 
                        domain=chosen_domain,
                        difficulty=1,
                        exclude_ids=asked_question_ids
                    )
    
    # If no suitable question found, return None to indicate assessment completion
    if not question:
        return None
    
    # Convert to API response format
    return question.to_dict()

@app.post("/api/assessment/{assessment_id}/submit-answer", response_model=AnswerResult)
def api_submit_answer(assessment_id: int, submission: AnswerSubmission, db: Session = Depends(get_db)):
    """Submit an answer for a question"""
    # Retrieve assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Retrieve question
    question = get_question_by_id(db, submission.question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Check answer
    is_correct = submission.user_answer.upper() == question.answer.upper()
    
    # Create response record
    now = datetime.datetime.now().isoformat()
    response = Response(
        assessment_id=assessment_id,
        question_id=submission.question_id,
        user_answer=submission.user_answer.upper(),
        is_correct=is_correct,
        responded_at=now,
        time_taken_ms=submission.time_taken_ms
    )
    
    db.add(response)
    
    # Update assessment metrics
    assessment.questions_asked += 1
    if is_correct:
        assessment.questions_correct += 1
    
    # Update domain scores
    domain_scores = json.loads(assessment.domain_scores or "{}")
    domain = question.domain
    
    if domain not in domain_scores:
        domain_scores[domain] = {
            "correct": 0,
            "total": 0
        }
    
    domain_scores[domain]["total"] += 1
    if is_correct:
        domain_scores[domain]["correct"] += 1
    
    assessment.domain_scores = json.dumps(domain_scores)
    
    db.commit()
    
    # Prepare enhanced content
    extended_content = None
    if question.teaching_explanation or question.story_why or question.science_behind_it:
        extended_content = {
            "teaching_explanation": question.teaching_explanation,
            "story_why": question.story_why,
            "science_behind_it": question.science_behind_it,
            "implementation_how": question.implementation_how,
            "reflection_considerations": question.reflection_considerations,
            "child_impact_story": question.child_impact_story,
            "practical_application_strategy": question.practical_application_strategy,
            "why_behind_it": question.why_behind_it
        }
    
    # Return result
    return {
        "is_correct": is_correct,
        "correct_answer": question.answer,
        "explanation": question.teaching_explanation or "No explanation available",
        "extended_content": extended_content
    }

@app.post("/api/assessment/{assessment_id}/finish", response_model=LearningPathResponse)
def api_finish_assessment(assessment_id: int, db: Session = Depends(get_db)):
    """Finish an assessment and get personalized learning path"""
    # Retrieve assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Mark assessment as completed
    now = datetime.datetime.now().isoformat()
    assessment.completed_at = now
    
    # Calculate domain scores
    domain_scores_raw = json.loads(assessment.domain_scores or "{}")
    domain_scores = {}
    
    for domain, scores in domain_scores_raw.items():
        if scores["total"] > 0:
            domain_scores[domain] = (scores["correct"] / scores["total"]) * 100
        else:
            domain_scores[domain] = 0
    
    # Determine strongest and weakest domains
    if domain_scores:
        strongest_domain = max(domain_scores.items(), key=lambda x: x[1])[0]
        weakest_domain = min(domain_scores.items(), key=lambda x: x[1])[0]
    else:
        strongest_domain = "None"
        weakest_domain = "None"
    
    # Generate learning path
    learning_path = generate_learning_path(domain_scores, strongest_domain, weakest_domain)
    
    # Update assessment with learning path
    assessment.learning_path = json.dumps(learning_path)
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

def generate_learning_path(domain_scores, strongest_domain, weakest_domain):
    """Generate a personalized learning path based on assessment results"""
    learning_path = {}
    
    # Add resources for each domain
    for domain, score in domain_scores.items():
        # If score is less than 70%, add more resources
        if score < 70:
            learning_path[domain] = [
                f"Essential training module on {domain}",
                f"Practical application: {domain} in the classroom",
                f"Workshop: Mastering {domain}"
            ]
        # If score is between 70% and 90%, add moderate resources
        elif score < 90:
            learning_path[domain] = [
                f"Advanced concepts in {domain}",
                f"Peer learning circle: {domain}"
            ]
        # If score is 90% or above, minimal resources
        else:
            learning_path[domain] = [
                f"Mastery maintenance: {domain}"
            ]
    
    # Special recommendations for weakest domain
    if weakest_domain in learning_path:
        learning_path[weakest_domain].append(f"One-on-one coaching session on {weakest_domain}")
        learning_path[weakest_domain].append(f"Daily practice exercises: {weakest_domain}")
    
    # If strongest domain is strong enough, suggest mentoring
    if strongest_domain in domain_scores and domain_scores[strongest_domain] >= 85:
        if strongest_domain in learning_path:
            learning_path[strongest_domain].append(f"Become a peer mentor for {strongest_domain}")
    
    return learning_path