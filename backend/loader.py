"""
Question loader module for the assessment system
This module provides functions to load questions from the database
"""

import random
import logging
import math
from typing import List, Dict, Any, Optional, Tuple, Union

from sqlalchemy import func, desc, or_
from sqlalchemy.orm import Session

from .models import Question, UserPerformance, UserDomainProgress, User

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("loader")

def load_questions(db: Session, domain=None, difficulty=None, exclude_ids=None, limit=10):
    """
    Load questions from the database based on domain and difficulty
    
    Args:
        db: Database session
        domain: Domain to filter by
        difficulty: Difficulty level to filter by
        exclude_ids: List of question IDs to exclude
        limit: Maximum number of questions to return
        
    Returns:
        List of Question objects
    """
    query = db.query(Question)
    
    # Apply filters
    if domain:
        query = query.filter(Question.domain == domain)
    
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    
    if exclude_ids:
        query = query.filter(~Question.id.in_(exclude_ids))
    
    # Order randomly
    query = query.order_by(func.random())
    
    # Limit results
    questions = query.limit(limit).all()
    
    return questions

def load_random_question(db: Session, domain=None, difficulty=None, exclude_ids=None):
    """
    Load a single random question from the database
    
    Args:
        db: Database session
        domain: Domain to filter by
        difficulty: Difficulty level to filter by
        exclude_ids: List of question IDs to exclude
        
    Returns:
        Single Question object or None if no matching questions
    """
    questions = load_questions(
        db, domain=domain, difficulty=difficulty, 
        exclude_ids=exclude_ids, limit=1
    )
    
    return questions[0] if questions else None

def get_domains(db: Session):
    """
    Get a list of all domains in the database
    
    Args:
        db: Database session
        
    Returns:
        List of domain strings
    """
    domains = db.query(Question.domain).distinct().all()
    return [domain[0] for domain in domains]

def get_question_by_id(db: Session, question_id):
    """
    Get a specific question by ID
    
    Args:
        db: Database session
        question_id: ID of the question to retrieve
        
    Returns:
        Question object or None
    """
    return db.query(Question).filter(Question.id == question_id).first()

def get_question_counts_by_domain(db: Session):
    """
    Get the count of questions for each domain
    
    Args:
        db: Database session
        
    Returns:
        Dictionary with domain names as keys and counts as values
    """
    results = db.query(
        Question.domain, 
        func.count(Question.id).label('count')
    ).group_by(Question.domain).all()
    
    return {domain: count for domain, count in results}

def get_next_difficulty_level(db: Session, domain: str, current_difficulty: int, correct: bool):
    """
    Determine the next difficulty level based on performance
    
    Args:
        db: Database session
        domain: The domain of questions
        current_difficulty: Current difficulty level
        correct: Whether the last answer was correct
        
    Returns:
        Next difficulty level (int)
    """
    if correct:
        # If answered correctly, potentially increase difficulty
        if current_difficulty < 5:  # 5 is max difficulty
            # Check if there are questions at the next difficulty level
            next_level = current_difficulty + 1
            count = db.query(func.count(Question.id)).filter(
                Question.domain == domain,
                Question.difficulty == next_level
            ).scalar()
            
            if count > 0:
                return next_level
    else:
        # If answered incorrectly, potentially decrease difficulty
        if current_difficulty > 1:  # 1 is min difficulty
            return current_difficulty - 1
    
    # Default: stay at the same level
    return current_difficulty

def get_domain_questions_count(db: Session, domain: str):
    """
    Get the total count of questions for a specific domain
    
    Args:
        db: Database session
        domain: The domain to count questions for
        
    Returns:
        Integer count of questions
    """
    return db.query(func.count(Question.id)).filter(
        Question.domain == domain
    ).scalar()

def get_question_difficulty_distribution(db: Session, domain: str):
    """
    Get the distribution of questions by difficulty level for a domain
    
    Args:
        db: Database session
        domain: The domain to analyze
        
    Returns:
        Dictionary with difficulty levels as keys and counts as values
    """
    results = db.query(
        Question.difficulty, 
        func.count(Question.id).label('count')
    ).filter(
        Question.domain == domain
    ).group_by(Question.difficulty).all()
    
    return {difficulty: count for difficulty, count in results}

def get_random_question_with_adaptive_difficulty(
    db: Session, 
    domain: str, 
    user_performance: float, 
    exclude_ids: List[int] = None,
    max_questions_per_domain: int = 10
):
    """
    Get a question with adaptive difficulty based on user performance
    
    Args:
        db: Session
        domain: The domain to get a question for
        user_performance: A float between 0 and 1 representing user's performance
        exclude_ids: List of question IDs to exclude
        max_questions_per_domain: Maximum number of questions to ask in this domain
        
    Returns:
        (Question, finished) where Question is the next question or None if domain is finished,
        and finished is a boolean indicating if we've reached the max questions or proficiency
    """
    # Check if we've reached the maximum number of questions for this domain
    if exclude_ids and len(exclude_ids) >= max_questions_per_domain:
        return None, True
    
    # Calculate target difficulty based on performance
    # Scale performance to 1-5 range for difficulty levels
    target_difficulty = min(5, max(1, math.ceil(user_performance * 5)))
    
    # First try to get a question at the exact target difficulty
    question = load_random_question(
        db, domain=domain, difficulty=target_difficulty, exclude_ids=exclude_ids
    )
    
    # If no question found, try adjacent difficulty levels
    if not question:
        # Try one level below then one level above, alternating outward
        for diff_offset in [1, -1, 2, -2, 3, -3, 4, -4]:
            new_diff = target_difficulty + diff_offset
            
            # Ensure difficulty is in valid range (1-5)
            if 1 <= new_diff <= 5:
                question = load_random_question(
                    db, domain=domain, difficulty=new_diff, exclude_ids=exclude_ids
                )
                if question:
                    break
    
    # If still no question, just get any question from this domain
    if not question:
        question = load_random_question(
            db, domain=domain, exclude_ids=exclude_ids
        )
    
    # If we found a question, return it along with not finished status
    if question:
        return question, False
    
    # If no question found at all, the domain is finished or empty
    return None, True

def update_user_performance(
    db: Session, 
    user_id: int, 
    domain: str, 
    is_correct: bool, 
    difficulty: int
):
    """
    Update the user performance record for a domain
    
    Args:
        db: Database session
        user_id: The user ID
        domain: The domain
        is_correct: Whether the question was answered correctly
        difficulty: The difficulty of the question
    """
    # Find existing progress record for this user and domain
    progress = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == user_id,
        UserDomainProgress.domain == domain
    ).first()
    
    # Calculate points earned
    points_earned = 0
    if is_correct:
        # Base points for correct answer based on difficulty
        points_earned = difficulty * 2
    
    if not progress:
        # Create new progress record if it doesn't exist
        progress = UserDomainProgress(
            user_id=user_id,
            domain=domain,
            performance_score=1.0 if is_correct else 0.0,
            highest_difficulty=difficulty,
            questions_answered=1,
            questions_correct=1 if is_correct else 0,
            points_earned=points_earned
        )
        db.add(progress)
    else:
        # Update existing progress
        progress.update_progress(is_correct, difficulty, points_earned)
    
    # Commit changes
    db.commit()
    
    return progress

def get_user_name(user_id: int, db: Session) -> str:
    """
    Get a user's name for personalized feedback
    
    Args:
        user_id: The user ID
        db: Database session
        
    Returns:
        User's name or "Student" if not found
    """
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        return user.get_full_name()
    return "Student"

class AnswerFeedback:
    """Class to provide personalized feedback for question answers"""
    
    def __init__(
        self, 
        correct: bool, 
        correct_answer: str, 
        personal_message: str, 
        teaching_explanation: str,
        next_difficulty: int = None
    ):
        self.correct = correct
        self.correct_answer = correct_answer
        self.personal_message = personal_message
        self.teaching_explanation = teaching_explanation
        self.next_difficulty = next_difficulty
    
    def to_dict(self):
        """Convert to dictionary for API response"""
        return {
            "correct": self.correct,
            "correct_answer": self.correct_answer,
            "personal_message": self.personal_message,
            "teaching_explanation": self.teaching_explanation,
            "next_difficulty": self.next_difficulty
        }

def generate_answer_feedback(
    db: Session,
    question: Question,
    user_answer: str,
    user_id: int,
    domain: str,
    current_difficulty: int
) -> AnswerFeedback:
    """
    Generate personalized feedback for a question answer
    
    Args:
        db: Database session
        question: The question answered
        user_answer: The user's answer
        user_id: The user's ID
        domain: The question domain
        current_difficulty: Current difficulty level
        
    Returns:
        AnswerFeedback object
    """
    is_correct = question.is_correct_answer(user_answer)
    user_name = get_user_name(user_id, db)
    
    # Get next difficulty level
    next_difficulty = get_next_difficulty_level(
        db, domain, current_difficulty, is_correct
    )
    
    if is_correct:
        personal_message = get_positive_feedback_message(current_difficulty).replace(
            "{name}", user_name
        )
        explanation = get_positive_explanation(current_difficulty, domain)
    else:
        personal_message = get_supportive_feedback_message(current_difficulty).replace(
            "{name}", user_name
        )
        explanation = get_correction_explanation(current_difficulty, domain)
    
    # Add enhanced content explanation if available
    enhanced_content = question.get_enhanced_content()
    if "explanation" in enhanced_content:
        explanation += "\n\n" + enhanced_content["explanation"]
    
    return AnswerFeedback(
        correct=is_correct,
        correct_answer=question.answer,
        personal_message=personal_message,
        teaching_explanation=explanation,
        next_difficulty=next_difficulty
    )

def get_positive_feedback_message(difficulty):
    """Get a positive feedback message based on difficulty"""
    messages = [
        "Great job, {name}! That's correct!",
        "Well done, {name}! You got it right!",
        "Excellent work, {name}! That's exactly right!",
        "Outstanding, {name}! You're mastering this!",
        "Impressive, {name}! That was a challenging question!"
    ]
    
    # Use harder messages for higher difficulty
    index = min(difficulty - 1, len(messages) - 1)
    return messages[index]

def get_supportive_feedback_message(difficulty):
    """Get a supportive feedback message based on difficulty"""
    messages = [
        "Not quite, {name}. Let's review this concept.",
        "That's not correct, {name}, but it's a good learning opportunity.",
        "This was tricky, {name}. Let's look at why.",
        "This was challenging, {name}. Don't worry - practice helps!",
        "This was very advanced, {name}. Let's break it down together."
    ]
    
    # Use more supportive messages for higher difficulty
    index = min(difficulty - 1, len(messages) - 1)
    return messages[index]

def get_positive_explanation(difficulty, domain):
    """Generate a positive explanation based on difficulty and domain"""
    explanations = [
        f"You've demonstrated a good understanding of {domain} fundamentals.",
        f"Your understanding of {domain} concepts is developing well.",
        f"You're showing strong knowledge in {domain}.",
        f"You've demonstrated advanced understanding of {domain} principles.",
        f"You're showing expert-level knowledge in {domain}."
    ]
    
    index = min(difficulty - 1, len(explanations) - 1)
    return explanations[index]

def get_correction_explanation(difficulty, domain):
    """Generate a correction explanation based on difficulty and domain"""
    explanations = [
        f"Let's review this {domain} concept together.",
        f"This {domain} concept can be challenging. Let's break it down.",
        f"This is an important {domain} principle to understand.",
        f"This is an advanced {domain} concept that takes practice.",
        f"This {domain} concept is complex. Let's work through it step by step."
    ]
    
    index = min(difficulty - 1, len(explanations) - 1)
    return explanations[index]

class LearningPath:
    """Class to generate personalized learning path recommendations"""
    
    def __init__(
        self,
        learning_path: Dict[str, List[str]],
        domain_scores: Dict[str, float],
        questions_asked: int,
        questions_correct: int,
        strongest_domain: str,
        weakest_domain: str,
        user_name: str = None,
        total_points_earned: int = 10
    ):
        self.learning_path = learning_path
        self.domain_scores = domain_scores
        self.questions_asked = questions_asked
        self.questions_correct = questions_correct
        self.strongest_domain = strongest_domain
        self.weakest_domain = weakest_domain
        self.user_name = user_name or "Student"
        self.total_points_earned = total_points_earned
    
    def to_dict(self):
        """Convert to dictionary for API response"""
        return {
            "learning_path": self.learning_path,
            "domain_scores": self.domain_scores,
            "questions_asked": self.questions_asked,
            "questions_correct": self.questions_correct,
            "strongest_domain": self.strongest_domain,
            "weakest_domain": self.weakest_domain,
            "user_name": self.user_name,
            "total_points_earned": self.total_points_earned
        }

class QuestionResponse:
    """Class to represent a formatted question for API response"""
    
    def __init__(
        self,
        id: int,
        question: str,
        q_type: str,
        options: Dict[str, str],
        domain: str,
        difficulty: int,
        enhanced_content: Dict[str, Any] = None
    ):
        self.id = id
        self.question = question
        self.q_type = q_type
        self.options = options
        self.domain = domain
        self.difficulty = difficulty
        self.enhanced_content = enhanced_content
    
    def to_dict(self):
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "question": self.question,
            "q_type": self.q_type,
            "options": self.options,
            "domain": self.domain,
            "difficulty": self.difficulty,
            "enhanced_content": self.enhanced_content
        }