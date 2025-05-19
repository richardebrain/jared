from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import random
from pydantic import BaseModel

from .database import get_db
from .models import Question, Assessment, Response

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
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

# Endpoints
@app.post("/api/assessment/start")
def start_assessment(request: AssessmentStartRequest, db: Session = Depends(get_db)):
    """Start a new assessment for a user"""
    
    # Create a new assessment record
    new_assessment = Assessment(
        user_id=request.user_id,
        started_at=datetime.now().isoformat(),
        questions_asked=0,
        questions_correct=0,
        domain_scores=json.dumps({})
    )
    
    db.add(new_assessment)
    db.commit()
    db.refresh(new_assessment)
    
    return {"assessment_id": new_assessment.id}

@app.post("/api/assessment/next", response_model=QuestionResponse)
def next_question(request: NextQuestionRequest, db: Session = Depends(get_db)):
    """Get the next question based on assessment history"""
    
    # Get the assessment
    assessment = db.query(Assessment).filter(Assessment.id == request.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Calculate domain scores from history
    domain_scores = {}
    answered_question_ids = set()
    
    for item in request.history:
        answered_question_ids.add(item.question_id)
        
        # Initialize domain if not present
        if item.domain not in domain_scores:
            domain_scores[item.domain] = {"correct": 0, "total": 0, "avg_difficulty": 0}
        
        # Update domain stats
        domain_scores[item.domain]["total"] += 1
        if item.correct:
            domain_scores[item.domain]["correct"] += 1
            
        # Update difficulty tracking
        current_difficulty = domain_scores[item.domain].get("avg_difficulty", 0)
        new_total = domain_scores[item.domain]["total"]
        domain_scores[item.domain]["avg_difficulty"] = (
            (current_difficulty * (new_total - 1) + item.difficulty) / new_total
        )
    
    # Determine which domain to focus on (lowest score or random for first question)
    target_domain = None
    target_difficulty = 2  # Default to intermediate
    
    if not request.history:
        # First question - pick a random domain
        domains = db.query(Question.domain).distinct().all()
        domain_list = [d[0] for d in domains]
        target_domain = random.choice(domain_list)
    else:
        # Find weakest domain
        domain_performance = {}
        for domain, stats in domain_scores.items():
            # Calculate performance score (percentage correct)
            correct = stats["correct"]
            total = stats["total"]
            score = (correct / total) if total > 0 else 0
            domain_performance[domain] = score
            
            # If we've asked at least 5 questions and they're doing well, increase difficulty
            if total >= 5 and score >= 0.8:
                current_diff = stats["avg_difficulty"]
                if current_diff < 4:  # Don't exceed max difficulty
                    domain_scores[domain]["target_difficulty"] = min(current_diff + 1, 4)
            elif total >= 3 and score <= 0.4:
                # If they're struggling, decrease difficulty
                current_diff = stats["avg_difficulty"]
                if current_diff > 1:  # Don't go below min difficulty
                    domain_scores[domain]["target_difficulty"] = max(current_diff - 1, 1)
        
        # Select lowest performing domain
        if domain_performance:
            target_domain = min(domain_performance, key=domain_performance.get)
            # Get target difficulty for this domain
            target_difficulty = int(domain_scores[target_domain].get("target_difficulty", 2))
    
    # Query for a question
    # 1. Match target domain
    # 2. Match difficulty level
    # 3. Exclude already answered questions
    
    # First try exact difficulty match
    q = db.query(Question).filter(
        Question.domain == target_domain,
        Question.difficulty == target_difficulty,
        ~Question.id.in_(answered_question_ids) if answered_question_ids else True
    ).order_by(db.func.random()).first()
    
    # If no exact match, try any difficulty in the domain
    if not q:
        q = db.query(Question).filter(
            Question.domain == target_domain,
            ~Question.id.in_(answered_question_ids) if answered_question_ids else True
        ).order_by(db.func.random()).first()
    
    # If still no match, get any unanswered question
    if not q:
        q = db.query(Question).filter(
            ~Question.id.in_(answered_question_ids) if answered_question_ids else True
        ).order_by(db.func.random()).first()
    
    # If we're out of questions, just get any random question
    if not q:
        q = db.query(Question).order_by(db.func.random()).first()
    
    # Return formatted question
    return {
        "id": q.id,
        "question": q.question_text,
        "q_type": q.q_type,
        "options": {
            "A": q.option_a,
            "B": q.option_b,
            "C": q.option_c,
            "D": q.option_d
        },
        "domain": q.domain,
        "difficulty": q.difficulty
    }

@app.post("/api/assessment/answer")
def submit_answer(assessment_id: int, submission: AnswerSubmission, db: Session = Depends(get_db)):
    """Submit an answer for a question"""
    
    # Get the assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Get the question
    question = db.query(Question).filter(Question.id == submission.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Check if answer is correct
    is_correct = submission.user_answer.upper() == question.answer.upper()
    
    # Record the response
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
    domain_scores = json.loads(assessment.domain_scores) if assessment.domain_scores else {}
    
    if question.domain not in domain_scores:
        domain_scores[question.domain] = {"correct": 0, "total": 0}
    
    domain_scores[question.domain]["total"] += 1
    if is_correct:
        domain_scores[question.domain]["correct"] += 1
    
    assessment.domain_scores = json.dumps(domain_scores)
    
    db.commit()
    
    # Return the result
    return {
        "correct": is_correct,
        "explanation": question.teaching_explanation,
        "correct_answer": question.answer,
        "story": question.story_why,
        "implementation": question.implementation_how,
        "considerations": question.reflection_considerations,
        "child_impact": question.child_impact_story
    }

@app.post("/api/assessment/finish", response_model=LearningPathResponse)
def finish_assessment(assessment_id: int, db: Session = Depends(get_db)):
    """Finish an assessment and get personalized learning path"""
    
    # Get the assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Mark as completed
    assessment.completed_at = datetime.now().isoformat()
    
    # Calculate final domain scores
    domain_scores_raw = json.loads(assessment.domain_scores) if assessment.domain_scores else {}
    
    # Convert raw scores to percentages
    domain_scores = {}
    for domain, stats in domain_scores_raw.items():
        correct = stats["correct"]
        total = stats["total"]
        domain_scores[domain] = round((correct / total) * 100, 1) if total > 0 else 0
    
    # Determine strongest and weakest domains
    strongest_domain = max(domain_scores.items(), key=lambda x: x[1])[0] if domain_scores else "None"
    weakest_domain = min(domain_scores.items(), key=lambda x: x[1])[0] if domain_scores else "None"
    
    # Generate learning path based on performance
    learning_path = {}
    
    # Query resources for each domain, prioritizing weaker areas
    for domain, score in sorted(domain_scores.items(), key=lambda x: x[1]):
        # Get questions from this domain that have resources
        questions_with_resources = db.query(Question).filter(
            Question.domain == domain,
            Question.resources.isnot(None)
        ).all()
        
        # Extract resource IDs
        domain_resources = []
        for q in questions_with_resources:
            try:
                resources = json.loads(q.resources) if q.resources else []
                domain_resources.extend(resources)
            except:
                continue
        
        # Remove duplicates
        domain_resources = list(set(domain_resources))
        
        # Add to learning path if resources exist
        if domain_resources:
            learning_path[domain] = domain_resources
    
    # Save learning path to assessment
    assessment.learning_path = json.dumps(learning_path)
    db.commit()
    
    # Return the learning path and stats
    return {
        "learning_path": learning_path,
        "domain_scores": domain_scores,
        "questions_asked": assessment.questions_asked,
        "questions_correct": assessment.questions_correct,
        "strongest_domain": strongest_domain,
        "weakest_domain": weakest_domain
    }

# Optional: Add a root endpoint for API documentation
@app.get("/")
def read_root():
    return {"message": "Welcome to the Adaptive Assessment API. Visit /docs for documentation."}