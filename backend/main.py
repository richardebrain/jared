"""
Main API module for the MentorMe Enhanced Assessment system
This module defines the FastAPI endpoints for the assessment system
"""

import json
import random
from datetime import datetime
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from pydantic import BaseModel
from fastapi import Depends, HTTPException

from .database import get_db
from .models import Question, Assessment, Response
from .loader import (
    load_questions, load_random_question, get_domains,
    get_question_by_id, get_next_difficulty_level, get_domain_questions_count,
    get_question_counts_by_domain
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
    enhanced_content: Optional[Dict[str, str]] = None
    
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
    user_name: Optional[str] = None
    total_points_earned: int = 10  # Default points for completing assessment

async def startup_event():
    """Initialize database on startup"""
    from .database import setup_database
    setup_database()

def read_root():
    """Root endpoint"""
    return {"message": "MentorMe Enhanced Assessment API", "version": "1.0.0"}

def start_assessment(request: AssessmentStartRequest, db: Session):
    """Start a new assessment for a user"""
    # Create a new assessment
    assessment = Assessment(
        user_id=request.user_id,
        started_at=datetime.utcnow().isoformat(),
        questions_asked=0,
        questions_correct=0,
        domain_scores=json.dumps({})
    )
    
    # Add to database
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    return {"assessment_id": assessment.id}

def next_question(request: NextQuestionRequest, db: Session):
    """Get the next question based on assessment history"""
    # Get the assessment
    assessment = db.query(Assessment).filter(Assessment.id == request.assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    # Check if this is the first question
    if not request.history:
        # First time, so get questions across domains to determine initial areas
        domains = get_domains(db)
        selected_domains = random.sample(domains, min(len(domains), 3))
        
        # Start with Core Values domain if available
        if "Core Values" in domains:
            selected_domains[0] = "Core Values"
            
        # Get a question from a random domain
        domain = random.choice(selected_domains)
        question = load_random_question(db, domain=domain, difficulty=1)
        
        if not question:
            # Try any domain as fallback
            question = load_random_question(db, difficulty=1)
            
        if not question:
            raise HTTPException(status_code=404, detail="No questions available")
            
        return format_question(question)
    
    # Process assessment history to determine next question
    domain_performance = {}
    domain_counts = {}
    asked_question_ids = []
    
    # Calculate performance by domain
    for item in request.history:
        asked_question_ids.append(item.question_id)
        
        if item.domain not in domain_performance:
            domain_performance[item.domain] = {"correct": 0, "total": 0, "difficulty": item.difficulty}
            
        domain_performance[item.domain]["total"] += 1
        if item.correct:
            domain_performance[item.domain]["correct"] += 1
    
    # Calculate which domains need more questions
    for domain, stats in domain_performance.items():
        ratio = stats["correct"] / stats["total"] if stats["total"] > 0 else 0
        domain_counts[domain] = stats["total"]
        
        # Adjust difficulty based on performance
        current_difficulty = stats["difficulty"]
        last_correct = next((item.correct for item in reversed(request.history) 
                           if item.domain == domain), False)
                           
        # Update the domain's current difficulty level
        domain_performance[domain]["difficulty"] = get_next_difficulty_level(
            db, domain, current_difficulty, last_correct
        )
    
    # Decide which domain to ask a question from next
    # Special logic for Core Values and Mindful Morning sections (limited to 5 questions)
    special_domains = ["Core Values", "Mindful Morning"]
    remaining_domains = [
        domain for domain, count in domain_counts.items() 
        if (domain not in special_domains and count < 15) or 
           (domain in special_domains and count < 5)
    ]
    
    # If we've exhausted all domains or reached question limits, end the assessment
    if not remaining_domains:
        return {"assessment_complete": True}
    
    # Choose domain with lowest number of questions so far
    selected_domain = min(remaining_domains, key=lambda d: domain_counts.get(d, 0))
    
    # Get difficulty level for the selected domain
    difficulty = domain_performance.get(selected_domain, {}).get("difficulty", 1)
    
    # Load a question
    question = load_random_question(
        db, 
        domain=selected_domain, 
        difficulty=difficulty, 
        exclude_ids=asked_question_ids
    )
    
    if not question:
        # Try with any difficulty if no question at current difficulty
        question = load_random_question(
            db, 
            domain=selected_domain, 
            exclude_ids=asked_question_ids
        )
        
    if not question:
        # Try any domain if still no questions
        question = load_random_question(
            db, 
            exclude_ids=asked_question_ids
        )
        
    if not question:
        raise HTTPException(status_code=404, detail="No more questions available")
        
    return format_question(question)

def submit_answer(assessment_id: int, submission: AnswerSubmission, db: Session):
    """Submit an answer for a question"""
    # Get the assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    # Get the question
    question = db.query(Question).filter(Question.id == submission.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    # Check if the answer is correct
    is_correct = question.answer.upper() == submission.user_answer.upper()
    
    # Record the response
    response = Response(
        assessment_id=assessment_id,
        question_id=submission.question_id,
        user_answer=submission.user_answer,
        is_correct=is_correct,
        responded_at=datetime.utcnow().isoformat(),
        time_taken_ms=submission.time_taken_ms
    )
    
    db.add(response)
    
    # Update assessment stats
    assessment.questions_asked += 1
    if is_correct:
        assessment.questions_correct += 1
    
    # Update domain scores
    domain_scores = {}
    if assessment.domain_scores:
        try:
            domain_scores = json.loads(assessment.domain_scores)
        except json.JSONDecodeError:
            domain_scores = {}
    
    # Initialize domain if not present
    if question.domain not in domain_scores:
        domain_scores[question.domain] = {"correct": 0, "total": 0}
    
    # Update domain stats
    domain_scores[question.domain]["total"] += 1
    if is_correct:
        domain_scores[question.domain]["correct"] += 1
    
    # Save updated scores
    assessment.domain_scores = json.dumps(domain_scores)
    
    db.commit()
    
    # Generate personal response with teaching explanation
    user_name = get_user_name(assessment.user_id, db)
    personal_message = ""
    
    if is_correct:
        if user_name:
            personal_message = f"Great job, {user_name}! "
        else:
            personal_message = "Great job! "
            
        personal_message += "That's correct."
    else:
        if user_name:
            personal_message = f"Not quite, {user_name}. "
        else:
            personal_message = "Not quite. "
            
        personal_message += f"The correct answer is {question.answer}."
    
    # Return result with feedback
    return {
        "correct": is_correct,
        "correct_answer": question.answer,
        "personal_message": personal_message,
        "teaching_explanation": question.teaching_explanation
    }

def finish_assessment(assessment_id: int, db: Session):
    """Finish an assessment and get personalized learning path"""
    # Get the assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
        
    # Mark as completed
    assessment.completed_at = datetime.utcnow().isoformat()
    
    # Calculate final domain scores and generate learning path
    domain_scores = {}
    if assessment.domain_scores:
        try:
            domain_data = json.loads(assessment.domain_scores)
            # Convert to percentage scores
            for domain, stats in domain_data.items():
                if stats["total"] > 0:
                    domain_scores[domain] = (stats["correct"] / stats["total"]) * 100
                else:
                    domain_scores[domain] = 0
        except json.JSONDecodeError:
            domain_scores = {}
    
    # Find strongest and weakest domains
    strongest_domain = max(domain_scores.items(), key=lambda x: x[1])[0] if domain_scores else "None"
    weakest_domain = min(domain_scores.items(), key=lambda x: x[1])[0] if domain_scores else "None"
    
    # Generate learning path recommendations
    learning_path = {}
    for domain, score in domain_scores.items():
        if score < 80:  # Focus on domains with scores below 80%
            learning_path[domain] = generate_domain_recommendations(db, domain)
    
    # Include the strongest domain as an area of leadership
    if strongest_domain not in learning_path and strongest_domain != "None":
        learning_path[f"{strongest_domain} (Leadership)"] = [
            "You showed strength in this area! Consider mentoring others.",
            "Share your knowledge with the teaching team.",
            "Lead a professional development session on this topic."
        ]
    
    # Save the learning path
    assessment.learning_path = json.dumps(learning_path)
    db.commit()
    
    # Get user's name for personalized message
    user_name = get_user_name(assessment.user_id, db)
    
    # Return the learning path and scores
    return LearningPathResponse(
        learning_path=learning_path,
        domain_scores=domain_scores,
        questions_asked=assessment.questions_asked,
        questions_correct=assessment.questions_correct,
        strongest_domain=strongest_domain,
        weakest_domain=weakest_domain,
        user_name=user_name,
        total_points_earned=10  # Default points for assessment completion
    )

def format_question(question: Question) -> QuestionResponse:
    """Format a question for API response"""
    # Convert options from DB format to API format
    options = {}
    if question.option_a:
        options["A"] = question.option_a
    if question.option_b:
        options["B"] = question.option_b
    if question.option_c:
        options["C"] = question.option_c
    if question.option_d:
        options["D"] = question.option_d
    
    # Create enhanced content dictionary if any enhanced fields exist
    enhanced_content = {}
    if question.story_why:
        enhanced_content["story_why"] = question.story_why
    if question.implementation_how:
        enhanced_content["implementation_how"] = question.implementation_how
    if question.child_impact_story:
        enhanced_content["child_impact_story"] = question.child_impact_story
    
    return QuestionResponse(
        id=question.id,
        question=question.question_text,
        q_type=question.q_type or "mcq",
        options=options,
        domain=question.domain or "General",
        difficulty=question.difficulty or 1,
        enhanced_content=enhanced_content if enhanced_content else None
    )

def generate_domain_recommendations(db: Session, domain: str) -> List[str]:
    """Generate resource recommendations for a domain"""
    # Basic recommendations by domain
    recommendations = {
        "Core Values": [
            "Review the Core Values training module",
            "Focus on consistency in your classroom routines",
            "Practice positive communication techniques"
        ],
        "Child Development": [
            "Review child development milestones by age group",
            "Study cognitive development theories",
            "Practice observation and documentation techniques"
        ],
        "Mindful Morning": [
            "Practice daily mindfulness exercises",
            "Incorporate mindfulness moments throughout your day",
            "Read about trauma-informed practices"
        ],
        "Classroom Management": [
            "Review effective transition strategies",
            "Study positive discipline techniques",
            "Practice setting up engaging learning centers"
        ],
        "Building a Human": [
            "Review attachment theory principles",
            "Study emotional regulation development",
            "Practice responsive caregiving techniques"
        ],
        "Technology in ECE": [
            "Learn about appropriate technology integration",
            "Study digital literacy development",
            "Practice screen-time management strategies"
        ]
    }
    
    # Return domain-specific recommendations or general ones if domain not found
    return recommendations.get(domain, [
        "Continue exploring professional development resources",
        "Attend workshops and training events",
        "Read current research and best practices"
    ])

def get_user_name(user_id: int, db: Session) -> Optional[str]:
    """Get the user's first name for personalized messages"""
    # In a real implementation, this would query the user database
    # For now, return None - the frontend will handle this
    return None