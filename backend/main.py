"""
Main API module for the MentorMe Enhanced Assessment system
This module defines the FastAPI endpoints for the assessment system
"""

import json
import logging
import random
from typing import Dict, List, Optional, Any, Union
from datetime import datetime

from fastapi import Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .database import get_db, setup_database
from .models import Question, Assessment, QuestionResponse, UserPerformance
from .loader import (
    load_random_question_with_adaptive_difficulty,
    get_domains,
    get_question_by_id,
    get_next_difficulty_level,
    update_user_performance,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("main")

# Define Pydantic models for API
class AssessmentStartRequest(BaseModel):
    user_id: int

class QuestionResponse(BaseModel):
    id: int
    question: str
    q_type: str
    options: Dict[str, str]
    domain: str
    difficulty: int
    enhanced_content: Optional[Dict[str, Any]] = None

class AnswerSubmission(BaseModel):
    question_id: int
    user_answer: str
    time_taken_ms: Optional[int] = None

class AnswerFeedback(BaseModel):
    correct: bool
    correct_answer: str
    personal_message: str
    teaching_explanation: str

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

# Domain sequence for a well-structured assessment
DOMAIN_SEQUENCE = [
    "Classroom Management",
    "Child Development",
    "Curriculum Planning",
    "Health and Safety",
    "Family Engagement",
    "Observation and Assessment",
    "Professionalism",
    "Inclusion and Diversity",
    "Language and Literacy",
    "Social-Emotional Development",
    "Core Values",
    "Mindful Morning",
    "Building a Human",
]

# Personalized messages for correct answers
CORRECT_ANSWER_MESSAGES = [
    "Excellent! You're really showing your expertise.",
    "Great job! Your knowledge is impressive.",
    "Correct! You clearly understand this concept well.",
    "Perfect! That's exactly right.",
    "You got it! Your understanding is spot on.",
    "That's right! Wonderful teaching knowledge.",
    "Absolutely correct! Well done.",
    "You nailed it! Excellent understanding.",
    "Correct! You know your stuff.",
    "That's it! You've got a solid grasp on this topic."
]

# Teaching explanations to supplement answers
TEACHING_EXPLANATIONS = {
    "Classroom Management": [
        "Effective classroom management creates a positive environment where children can learn and grow.",
        "Setting clear expectations helps children understand boundaries and feel secure.",
        "Consistent routines help children predict what comes next, reducing anxiety and behavior issues.",
        "Building relationships with each child is the foundation of effective classroom management.",
        "Positive guidance strategies focus on teaching rather than punishing."
    ],
    "Child Development": [
        "Understanding developmental milestones helps us create appropriate expectations and activities.",
        "Children develop at different rates, but generally follow predictable patterns.",
        "Brain development in early childhood is rapid and influenced by experiences and relationships.",
        "Play is essential for healthy development across all domains.",
        "Development occurs across physical, cognitive, social, emotional, and language domains simultaneously."
    ],
    "Core Values": [
        "Being consistent helps children feel secure and understand expectations.",
        "Being prepared shows respect for children's learning time and reduces behavior issues.",
        "Being committed means following through and being reliable for children and families.",
        "Being caring creates the emotional foundation that supports all learning.",
        "Being positive models optimism and resilience for children."
    ],
    "Mindful Morning": [
        "Starting the day mindfully sets a positive tone for learning and interactions.",
        "Morning routines that include mindfulness help children transition into the school day.",
        "Mindful breathing techniques help children learn to self-regulate.",
        "Greeting each child individually builds relationships and helps children feel valued.",
        "Mindfulness practices support children's emotional development and focus."
    ],
    "Building a Human": [
        "Early experiences shape brain architecture in lasting ways.",
        "Responsive interactions with caring adults build healthy brain connections.",
        "Toxic stress can disrupt healthy development when not buffered by supportive relationships.",
        "Serving and return interactions are essential for building neural connections.",
        "Executive function skills begin developing in early childhood through relationships and experiences."
    ]
}

async def startup_event():
    """Initialize database on startup"""
    setup_database()
    logger.info("Database initialized")

def read_root():
    """Root endpoint"""
    return {
        "message": "Welcome to the MentorMe Enhanced Assessment API",
        "version": "1.0.0",
        "status": "healthy"
    }

def start_assessment(request: AssessmentStartRequest, db: Session):
    """Start a new assessment for a user"""
    # Create a new assessment record
    assessment = Assessment(
        user_id=request.user_id,
        start_time=datetime.now(),
        completed=False,
        questions_asked=0,
        questions_correct=0,
        points_earned=0
    )
    
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    
    logger.info(f"Started assessment ID {assessment.id} for user {request.user_id}")
    
    return {"assessment_id": assessment.id}

def next_question(request: NextQuestionRequest, db: Session):
    """Get the next question based on assessment history"""
    assessment_id = request.assessment_id
    history = request.history
    
    # Get the assessment record
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assessment ID {assessment_id} not found"
        )
    
    if assessment.completed:
        return {"assessment_complete": True}
    
    # Calculate current domain and performance
    domain_performance = {}
    domain_questions = {}
    
    # Get all domains asked so far and calculate domain-specific performance
    for item in history:
        domain = item.domain
        if domain not in domain_performance:
            domain_performance[domain] = {"correct": 0, "total": 0}
            domain_questions[domain] = []
            
        domain_performance[domain]["total"] += 1
        if item.correct:
            domain_performance[domain]["correct"] += 1
            
        domain_questions[domain].append(item.question_id)
    
    # Calculate performance scores for each domain
    for domain in domain_performance:
        total = domain_performance[domain]["total"]
        correct = domain_performance[domain]["correct"]
        domain_performance[domain]["score"] = correct / total if total > 0 else 0
    
    # Determine the next domain to ask about
    if not history:
        # Start with the first domain if no history
        next_domain = DOMAIN_SEQUENCE[0]
    else:
        # Get the most recent domain
        last_domain = history[-1].domain
        
        # If we've asked enough questions in this domain or reached proficiency, move to the next domain
        domain_finished = False
        
        if last_domain in domain_questions:
            # Check if we've asked maximum questions for this domain
            question_count = len(domain_questions[last_domain])
            domain_score = domain_performance[last_domain]["score"] if last_domain in domain_performance else 0
            
            # Special case for Core Values and Mindful Morning - only ask 5 questions
            if last_domain in ["Core Values", "Mindful Morning"] and question_count >= 5:
                domain_finished = True
            # For other domains, ask up to 10 questions or until proficiency (90% correct)
            elif question_count >= 10 or (question_count >= 5 and domain_score >= 0.9):
                domain_finished = True
        
        if domain_finished:
            # Move to the next domain
            next_domain = get_next_domain(last_domain)
            
            # If we've gone through all domains, assessment is complete
            if not next_domain:
                # Update assessment as completed
                assessment.completed = True
                assessment.end_time = datetime.now()
                db.commit()
                
                logger.info(f"Assessment ID {assessment_id} is complete")
                return {"assessment_complete": True}
        else:
            # Continue with the same domain
            next_domain = last_domain
    
    # Get the user's performance in this domain
    user_performance = 0.5  # Default starting performance
    if next_domain in domain_performance:
        user_performance = domain_performance[next_domain]["score"]
    
    # Get question IDs already asked in this domain
    exclude_ids = domain_questions.get(next_domain, [])
    
    # Get a random question with adaptive difficulty
    question, domain_finished = load_random_question_with_adaptive_difficulty(
        db=db,
        domain=next_domain,
        user_performance=user_performance,
        exclude_ids=exclude_ids
    )
    
    # If no questions available in this domain or domain is finished, try the next domain
    if domain_finished or not question:
        next_domain = get_next_domain(next_domain)
        if not next_domain:
            # Update assessment as completed
            assessment.completed = True
            assessment.end_time = datetime.now()
            db.commit()
            
            logger.info(f"Assessment ID {assessment_id} is complete (no more questions)")
            return {"assessment_complete": True}
        
        # Try getting a question from the next domain
        exclude_ids = domain_questions.get(next_domain, [])
        question, _ = load_random_question_with_adaptive_difficulty(
            db=db,
            domain=next_domain,
            user_performance=0.5,  # Start with default performance for new domain
            exclude_ids=exclude_ids
        )
    
    # If still no question, assessment is complete
    if not question:
        assessment.completed = True
        assessment.end_time = datetime.now()
        db.commit()
        
        logger.info(f"Assessment ID {assessment_id} is complete (no questions found)")
        return {"assessment_complete": True}
    
    # Update assessment record
    assessment.questions_asked += 1
    db.commit()
    
    # Format the question for API response
    return format_question(question)

def submit_answer(assessment_id: int, submission: AnswerSubmission, db: Session):
    """Submit an answer for a question"""
    # Get the assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assessment ID {assessment_id} not found"
        )
    
    # Get the question
    question = get_question_by_id(db, submission.question_id)
    
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Question ID {submission.question_id} not found"
        )
    
    # Check if the answer is correct
    is_correct = question.answer.lower() == submission.user_answer.lower()
    
    # Create a response record
    response = QuestionResponse(
        assessment_id=assessment_id,
        question_id=question.id,
        user_answer=submission.user_answer,
        is_correct=is_correct,
        time_taken_ms=submission.time_taken_ms,
        difficulty=question.difficulty
    )
    
    db.add(response)
    
    # Update assessment metrics
    if is_correct:
        assessment.questions_correct += 1
    
    db.commit()
    db.refresh(response)
    
    # Update user performance
    update_user_performance(
        db=db,
        user_id=assessment.user_id,
        domain=question.domain,
        is_correct=is_correct,
        difficulty=question.difficulty
    )
    
    # Get personalized message
    if is_correct:
        personal_message = random.choice(CORRECT_ANSWER_MESSAGES)
        # Try to get a name to make it more personal
        user_name = get_user_name(assessment.user_id, db)
        if user_name:
            personal_message = f"{user_name}, {personal_message.lower()}"
    else:
        personal_message = "That's not quite right. Let's learn more about this concept."
    
    # Get teaching explanation
    teaching_explanation = ""
    domain_explanations = TEACHING_EXPLANATIONS.get(question.domain, [])
    if domain_explanations:
        teaching_explanation = random.choice(domain_explanations)
    else:
        teaching_explanation = "Understanding this concept will help you better support children's learning and development."
    
    # Try to get enhanced explanation from the question
    enhanced_content = question.get_enhanced_content()
    if enhanced_content and "why_correct" in enhanced_content:
        teaching_explanation = enhanced_content["why_correct"]
    
    # Get options for multiple choice questions
    options = question.get_options()
    correct_answer_text = question.answer
    
    # If it's a multiple choice question, show the text of the answer, not just the key
    if options and question.answer in options:
        correct_answer_text = options[question.answer]
    
    # Return feedback
    return AnswerFeedback(
        correct=is_correct,
        correct_answer=correct_answer_text,
        personal_message=personal_message,
        teaching_explanation=teaching_explanation
    )

def finish_assessment(assessment_id: int, db: Session):
    """Finish an assessment and get personalized learning path"""
    # Get the assessment
    assessment = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assessment ID {assessment_id} not found"
        )
    
    # Mark assessment as completed if not already
    if not assessment.completed:
        assessment.completed = True
        assessment.end_time = datetime.now()
        
        # Award points for completing the assessment (10 points)
        assessment.points_earned = 10
        
        db.commit()
    
    # Get domain scores
    domain_scores = assessment.get_domain_scores(db)
    
    # Generate learning path recommendations
    learning_path = {}
    for domain in domain_scores:
        # Generate recommendations for domains with score below 80%
        if domain_scores[domain] < 80:
            learning_path[domain] = generate_domain_recommendations(db, domain)
    
    # If learning path is empty, add recommendations for the weakest domain
    if not learning_path:
        weakest_domain = assessment.get_weakest_domain(db)
        if weakest_domain != "None":
            learning_path[weakest_domain] = generate_domain_recommendations(db, weakest_domain)
    
    # Get the user's name for personalization
    user_name = get_user_name(assessment.user_id, db)
    
    return LearningPathResponse(
        learning_path=learning_path,
        domain_scores=domain_scores,
        questions_asked=assessment.questions_asked,
        questions_correct=assessment.questions_correct,
        strongest_domain=assessment.get_strongest_domain(db),
        weakest_domain=assessment.get_weakest_domain(db),
        user_name=user_name,
        total_points_earned=assessment.points_earned
    )

def format_question(question: Question) -> QuestionResponse:
    """Format a question for API response"""
    return QuestionResponse(
        id=question.id,
        question=question.question,
        q_type=question.q_type,
        options=question.get_options(),
        domain=question.domain,
        difficulty=question.difficulty,
        enhanced_content=question.get_enhanced_content()
    )

def get_next_domain(current_domain: str) -> Optional[str]:
    """Get the next domain in the assessment sequence"""
    try:
        current_index = DOMAIN_SEQUENCE.index(current_domain)
        if current_index < len(DOMAIN_SEQUENCE) - 1:
            return DOMAIN_SEQUENCE[current_index + 1]
    except ValueError:
        # If domain not in sequence, start from the beginning
        return DOMAIN_SEQUENCE[0]
    
    # If we've reached the end of the sequence
    return None

def generate_domain_recommendations(db: Session, domain: str) -> List[str]:
    """Generate resource recommendations for a domain"""
    domain_recommendations = {
        "Classroom Management": [
            "Video: Creating a Positive Learning Environment",
            "Article: Effective Transitions for Young Children",
            "Workshop: Setting Up Learning Centers",
            "Resource: Visual Schedule Templates",
            "Training: Positive Guidance Strategies"
        ],
        "Child Development": [
            "Video: Brain Development in Early Childhood",
            "Article: Understanding Developmental Milestones",
            "Workshop: Supporting Physical Development",
            "Resource: Cognitive Development Activities",
            "Training: Social-Emotional Development"
        ],
        "Core Values": [
            "Video: The Importance of Consistency in Early Childhood",
            "Article: Being Prepared for Success",
            "Workshop: Commitment to Quality Care",
            "Resource: Creating a Caring Classroom Community",
            "Training: Positive Mindset in Teaching"
        ],
        "Mindful Morning": [
            "Video: Starting the Day with Mindfulness",
            "Article: Morning Routines that Support Self-Regulation",
            "Workshop: Mindful Breathing for Young Children",
            "Resource: Morning Meeting Ideas",
            "Training: Mindfulness Practices for Educators"
        ],
        "Building a Human": [
            "Video: How Early Experiences Shape Brain Architecture",
            "Article: Serve and Return Interactions",
            "Workshop: Supporting Executive Function Development",
            "Resource: Understanding Toxic Stress",
            "Training: Building Resilience in Young Children"
        ]
    }
    
    # Return domain-specific recommendations or generic ones
    if domain in domain_recommendations:
        return domain_recommendations[domain]
    
    # Generic recommendations
    return [
        f"Video: Best Practices in {domain}",
        f"Article: Recent Research in {domain}",
        f"Workshop: Practical Approaches to {domain}",
        f"Resource: {domain} Activity Guide",
        f"Training: Advanced Skills in {domain}"
    ]

def get_user_name(user_id: int, db: Session) -> Optional[str]:
    """Get the user's first name for personalized messages"""
    # This is a placeholder - in a real implementation, you would query the user table
    # For now, we'll return None since we don't have access to the user table
    return None