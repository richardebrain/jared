"""
Main API module for the MentorMe Enhanced Assessment system
This module defines the FastAPI endpoints for the assessment system
"""
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
import json
from datetime import datetime
from pydantic import BaseModel

from .database import get_db
from .models import Question, Assessment, Response
from .loader import (
    load_questions, 
    load_random_question,
    get_domains,
    get_question_by_id,
    get_question_counts_by_domain,
    get_next_difficulty_level
)

app = FastAPI(title="MentorMe Enhanced Assessment API")

# Configure CORS to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, set this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define request and response models
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

# API endpoints
@app.post("/api/assessment/start", status_code=201)
def start_assessment(request: AssessmentStartRequest, db: Session = Depends(get_db)):
    """Start a new assessment for a user"""
    # Create a new assessment record
    new_assessment = Assessment(
        user_id=request.user_id,
        started_at=datetime.now().isoformat(),
        domain_scores=json.dumps({}),
        questions_asked=0,
        questions_correct=0
    )
    
    db.add(new_assessment)
    db.commit()
    db.refresh(new_assessment)
    
    return {
        "assessment_id": new_assessment.id,
        "message": "Assessment started successfully"
    }

@app.post("/api/assessment/{assessment_id}/next-question")
def next_question(request: NextQuestionRequest, db: Session = Depends(get_db)):
    """Get the next question based on assessment history"""
    # Get the assessment
    assessment = db.query(Assessment).filter(Assessment.id == request.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # If no history, get a random question from any domain
    if not request.history:
        domains = get_domains(db)
        question = load_random_question(db, domain=domains[0])
        if not question:
            return None
        return format_question(question)
    
    # Build domain performance from history
    domain_perf = {}
    domain_counts = {}
    
    for item in request.history:
        if item.domain not in domain_perf:
            domain_perf[item.domain] = {"correct": 0, "total": 0, "current_difficulty": 1}
        
        domain_perf[item.domain]["total"] += 1
        if item.correct:
            domain_perf[item.domain]["correct"] += 1
        
        # Update current difficulty for the domain
        domain_perf[item.domain]["current_difficulty"] = item.difficulty
    
    # Determine next domain to focus on
    # Prioritize domains with fewer questions
    next_domain = min(domain_perf.items(), key=lambda x: x[1]["total"])[0]
    
    # Or focus on domains with lower performance
    domain_scores = {d: (perf["correct"] / perf["total"] * 100) if perf["total"] > 0 else 0 
                    for d, perf in domain_perf.items()}
    
    if domain_scores:
        # Prioritize low-performing domains unless they've had many questions
        weighted_scores = {
            d: score + (domain_perf[d]["total"] * 5)  # Add weight for number of questions
            for d, score in domain_scores.items()
        }
        next_domain = min(weighted_scores.items(), key=lambda x: x[1])[0]
    
    # For Core Values and Mindful Morning domains, limit to 5 questions
    if (next_domain in ["Core Values", "Mindful Morning"] and 
        domain_perf.get(next_domain, {}).get("total", 0) >= 5):
        
        # Try to find another domain
        other_domains = [d for d in domain_perf.keys() if d not in ["Core Values", "Mindful Morning"]]
        
        if other_domains:
            other_domain_scores = {d: domain_scores.get(d, 0) for d in other_domains}
            next_domain = min(other_domain_scores.items(), key=lambda x: x[1])[0]
    
    # Determine difficulty level for next question
    current_difficulty = domain_perf.get(next_domain, {}).get("current_difficulty", 1)
    last_correct = False
    
    # Check if last question in this domain was answered correctly
    for item in reversed(request.history):
        if item.domain == next_domain:
            last_correct = item.correct
            break
    
    # Get next difficulty level
    next_difficulty = get_next_difficulty_level(
        db, 
        domain=next_domain,
        current_difficulty=current_difficulty,
        correct=last_correct
    )
    
    # Load question with appropriate difficulty
    exclude_ids = [item.question_id for item in request.history]
    
    # Handle special domains that don't use difficulty progression
    if next_domain in ["Core Values", "Mindful Morning"]:
        question = load_random_question(
            db, 
            domain=next_domain,
            exclude_ids=exclude_ids
        )
    else:
        question = load_random_question(
            db, 
            domain=next_domain,
            difficulty=next_difficulty,
            exclude_ids=exclude_ids
        )
    
    # If no question found for specified criteria, try any question from the domain
    if not question and next_domain:
        question = load_random_question(
            db, 
            domain=next_domain,
            exclude_ids=exclude_ids
        )
    
    # If still no question, try any question from any domain
    if not question:
        question = load_random_question(
            db, 
            exclude_ids=exclude_ids
        )
    
    # If we've run out of questions, return None to indicate assessment completion
    if not question:
        return None
    
    return format_question(question)

@app.post("/api/assessment/{assessment_id}/submit-answer")
def submit_answer(assessment_id: int, submission: AnswerSubmission, db: Session = Depends(get_db)):
    """Submit an answer for a question"""
    # Get the assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Get the question
    question = get_question_by_id(db, submission.question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Check if the answer is correct
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
    
    # Update assessment statistics
    assessment.questions_asked += 1
    if is_correct:
        assessment.questions_correct += 1
    
    # Update domain scores
    domain_scores = json.loads(assessment.domain_scores)
    domain = question.domain
    
    if domain not in domain_scores:
        domain_scores[domain] = {"correct": 0, "total": 0}
    
    domain_scores[domain]["total"] += 1
    if is_correct:
        domain_scores[domain]["correct"] += 1
    
    assessment.domain_scores = json.dumps(domain_scores)
    
    db.commit()
    
    # Prepare extended content if available
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
    if question.why_behind_it:
        extended_content["why_behind_it"] = question.why_behind_it
    
    # Return results
    return {
        "is_correct": is_correct,
        "correct_answer": question.answer,
        "explanation": question.teaching_explanation or "This is the correct answer.",
        "extended_content": extended_content if extended_content else None
    }

@app.post("/api/assessment/{assessment_id}/finish")
def finish_assessment(assessment_id: int, db: Session = Depends(get_db)):
    """Finish an assessment and get personalized learning path"""
    # Get the assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Mark assessment as completed
    assessment.completed_at = datetime.now().isoformat()
    
    # Calculate final domain scores
    domain_scores = json.loads(assessment.domain_scores)
    final_scores = {}
    
    for domain, scores in domain_scores.items():
        if scores["total"] > 0:
            final_scores[domain] = (scores["correct"] / scores["total"]) * 100
        else:
            final_scores[domain] = 0
    
    # Determine strongest and weakest domains
    if final_scores:
        strongest_domain = max(final_scores.items(), key=lambda x: x[1])[0]
        weakest_domain = min(final_scores.items(), key=lambda x: x[1])[0]
    else:
        strongest_domain = "None"
        weakest_domain = "None"
    
    # Generate learning path based on performance
    learning_path = {}
    
    for domain, score in final_scores.items():
        # Customize resources based on performance
        learning_path[domain] = []
        
        if score < 60:
            # Poor performance - fundamentals needed
            learning_path[domain].append(f"Fundamentals of {domain} Workshop")
            learning_path[domain].append(f"{domain} Core Concepts Training")
            learning_path[domain].append(f"Introduction to {domain} in Early Childhood")
        
        elif score < 80:
            # Medium performance - some targeted help
            learning_path[domain].append(f"Targeted {domain} Skill Building")
            learning_path[domain].append(f"Practical Applications of {domain}")
        
        else:
            # Strong performance - advanced materials
            learning_path[domain].append(f"Advanced {domain} Techniques")
            learning_path[domain].append(f"Leading the Way in {domain}")
        
        # Add personalized resource based on domain
        if domain == "Child Development":
            learning_path[domain].append("Age-Appropriate Development Milestones Guide")
        elif domain == "Classroom Management":
            learning_path[domain].append("Positive Behavior Management Strategies")
        elif domain == "Core Values":
            learning_path[domain].append("Implementing Core Values in Daily Practice")
        elif domain == "Mindful Morning":
            learning_path[domain].append("Mindfulness Techniques for Classroom Calm")
        elif domain == "Building a Human":
            learning_path[domain].append("Whole Child Development Approach")
    
    # Save learning path to assessment record
    assessment.learning_path = json.dumps(learning_path)
    db.commit()
    
    # Return learning path and performance data
    return {
        "learning_path": learning_path,
        "domain_scores": final_scores,
        "questions_asked": assessment.questions_asked,
        "questions_correct": assessment.questions_correct,
        "strongest_domain": strongest_domain,
        "weakest_domain": weakest_domain
    }

@app.get("/")
def read_root():
    return {
        "message": "MentorMe Enhanced Assessment API",
        "version": "1.0.0",
        "docs": "/docs"
    }

# Helper functions
def format_question(question: Question) -> QuestionResponse:
    """Format a question for API response"""
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
        options=options,
        domain=question.domain,
        difficulty=question.difficulty
    )