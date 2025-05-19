"""
FastAPI server for the MentorMe Assessment API
"""
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
import json
import random
from typing import Dict, List, Optional
from pydantic import BaseModel

from .database import get_db
from .models import Question, Assessment, Response

# Initialize FastAPI app
app = FastAPI(title="MentorMe Assessment API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, set to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define Pydantic models for request/response validation
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

# API Endpoints
@app.get("/")
def read_root():
    """Root endpoint to confirm API is running"""
    return {"message": "MentorMe Assessment API is running"}

@app.post("/assessment/start", response_model=AssessmentStartResponse)
def api_start_assessment(request: AssessmentStartRequest, db: Session = Depends(get_db)):
    """Start a new assessment for a user"""
    # Create a new assessment
    assessment = Assessment(
        user_id=request.user_id,
        started_at=datetime.now().isoformat(),
        domain_scores=json.dumps({})
    )
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
    # Check if assessment exists
    assessment = db.query(Assessment).filter(Assessment.id == request.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Logic to select next question based on history
    # For simplicity, we'll just get a random question from the appropriate domain/difficulty
    
    # Determine which domain to test next
    # If history is empty, start with a random domain
    if not request.history:
        domains = ["child_development", "classroom_management", "curriculum", 
                   "health_safety", "family_engagement", "core_values", "mindfulness"]
        domain = random.choice(domains)
        difficulty = 1
    else:
        # Analyze history to determine next domain and difficulty
        domains_asked = {}
        for item in request.history:
            if item.domain not in domains_asked:
                domains_asked[item.domain] = {"correct": 0, "total": 0, "max_difficulty": 0}
            
            domains_asked[item.domain]["total"] += 1
            if item.correct:
                domains_asked[item.domain]["correct"] += 1
            
            if item.difficulty > domains_asked[item.domain]["max_difficulty"]:
                domains_asked[item.domain]["max_difficulty"] = item.difficulty
        
        # For domains with less than 10 questions, continue in that domain
        incomplete_domains = {d: stats for d, stats in domains_asked.items() 
                             if stats["total"] < 10 and d not in ["core_values", "mindfulness"]}
        
        # For core_values and mindfulness, limit to 5 questions
        special_domains = {d: stats for d, stats in domains_asked.items() 
                          if d in ["core_values", "mindfulness"] and stats["total"] < 5}
        
        if special_domains:
            # Prioritize these special domains
            domain = random.choice(list(special_domains.keys()))
            difficulty = 1  # Keep difficulty consistent for these domains
        elif incomplete_domains:
            # Continue with an incomplete domain
            domain = random.choice(list(incomplete_domains.keys()))
            
            # If accuracy is high, increase difficulty
            stats = incomplete_domains[domain]
            current_difficulty = stats["max_difficulty"]
            accuracy = stats["correct"] / stats["total"] if stats["total"] > 0 else 0
            
            if accuracy >= 0.7 and current_difficulty < 4:
                difficulty = current_difficulty + 1
            else:
                difficulty = current_difficulty
        else:
            # All domains have at least 10 questions, pick a new domain
            all_domains = ["child_development", "classroom_management", "curriculum", 
                          "health_safety", "family_engagement"]
            missing_domains = [d for d in all_domains if d not in domains_asked]
            
            if missing_domains:
                domain = random.choice(missing_domains)
                difficulty = 1
            else:
                # Assessment should be complete, but for safety, pick a random domain
                domain = random.choice(all_domains)
                difficulty = 1
    
    # Query for a question in the selected domain/difficulty that hasn't been asked yet
    asked_question_ids = [item.question_id for item in request.history]
    
    question_query = db.query(Question).filter(
        Question.domain == domain,
        Question.difficulty == difficulty
    )
    
    if asked_question_ids:
        question_query = question_query.filter(Question.id.not_in(asked_question_ids))
    
    questions = question_query.all()
    
    if not questions:
        # If no questions at current difficulty, try a different difficulty
        backup_query = db.query(Question).filter(Question.domain == domain)
        if asked_question_ids:
            backup_query = backup_query.filter(Question.id.not_in(asked_question_ids))
        questions = backup_query.all()
    
    if not questions:
        # If still no questions, try any domain
        final_query = db.query(Question)
        if asked_question_ids:
            final_query = final_query.filter(Question.id.not_in(asked_question_ids))
        questions = final_query.all()
    
    if not questions:
        raise HTTPException(status_code=404, detail="No more questions available")
    
    # Select a random question from the results
    question = random.choice(questions)
    
    # Format the response
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
    # Check if assessment exists
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
    
    # Prepare extended content
    extended_content = None
    if question.implementation_how or question.story_why or question.reflection_considerations:
        extended_content = {
            "implementation_how": question.implementation_how,
            "story_why": question.story_why,
            "reflection_considerations": question.reflection_considerations,
            "child_impact_story": question.child_impact_story,
            "science_behind_it": question.science_behind_it,
            "practical_application_strategy": question.practical_application_strategy,
            "why_behind_it": question.why_behind_it
        }
    
    # Return result
    return {
        "is_correct": is_correct,
        "correct_answer": question.answer,
        "explanation": question.teaching_explanation,
        "extended_content": extended_content
    }

@app.post("/assessment/{assessment_id}/finish", response_model=LearningPathResponse)
def api_finish_assessment(assessment_id: int, db: Session = Depends(get_db)):
    """Finish an assessment and get personalized learning path"""
    # Check if assessment exists
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Mark as completed
    assessment.completed_at = datetime.now().isoformat()
    
    # Calculate domain scores
    domain_scores = json.loads(assessment.domain_scores) if assessment.domain_scores else {}
    
    # Calculate percentage scores
    percentage_scores = {}
    for domain, stats in domain_scores.items():
        if stats["total"] > 0:
            percentage_scores[domain] = (stats["correct"] / stats["total"]) * 100
        else:
            percentage_scores[domain] = 0
    
    # Determine strongest and weakest domains
    scored_domains = list(percentage_scores.keys())
    if not scored_domains:
        raise HTTPException(status_code=400, detail="Assessment has no completed questions")
    
    strongest_domain = max(scored_domains, key=lambda d: percentage_scores[d])
    weakest_domain = min(scored_domains, key=lambda d: percentage_scores[d])
    
    # Generate learning path
    learning_path = {
        "recommended_modules": [],
        "focus_areas": []
    }
    
    # Add weak domains to focus areas
    weak_domains = [domain for domain, score in percentage_scores.items() if score < 70]
    for domain in weak_domains:
        learning_path["focus_areas"].append(domain)
    
    # Generate module recommendations based on weak areas
    domain_to_module_map = {
        "child_development": ["child_development_foundations", "ages_and_stages"],
        "classroom_management": ["positive_guidance", "classroom_organization"],
        "curriculum": ["play_based_learning", "steam_activities"],
        "health_safety": ["health_procedures", "safety_protocols"],
        "family_engagement": ["family_communication", "parent_partnerships"],
        "core_values": ["raising_arizona_core"],
        "mindfulness": ["mindful_morning"]
    }
    
    for domain in learning_path["focus_areas"]:
        if domain in domain_to_module_map:
            learning_path["recommended_modules"].extend(domain_to_module_map[domain])
    
    # Save learning path
    assessment.learning_path = json.dumps(learning_path)
    db.commit()
    
    # Format the response
    return {
        "learning_path": learning_path,
        "domain_scores": percentage_scores,
        "questions_asked": assessment.questions_asked,
        "questions_correct": assessment.questions_correct,
        "strongest_domain": strongest_domain,
        "weakest_domain": weakest_domain
    }