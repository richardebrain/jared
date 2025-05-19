"""
Question loader module for the assessment system
This module provides functions to load questions from the database
"""

import logging
import random
from typing import List, Optional, Tuple, Dict

from sqlalchemy import func
from sqlalchemy.orm import Session

from .models import Question, UserPerformance

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
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
    
    if domain:
        query = query.filter(Question.domain == domain)
    
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    
    if exclude_ids:
        query = query.filter(~Question.id.in_(exclude_ids))
    
    # Order randomly to get different questions each time
    query = query.order_by(func.random()).limit(limit)
    
    questions = query.all()
    
    logger.info(f"Loaded {len(questions)} questions: domain={domain}, difficulty={difficulty}")
    
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
        db=db, 
        domain=domain, 
        difficulty=difficulty, 
        exclude_ids=exclude_ids, 
        limit=1
    )
    
    if not questions:
        return None
    
    return questions[0]

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
    result = db.query(
        Question.domain, 
        func.count(Question.id).label('count')
    ).group_by(Question.domain).all()
    
    return {domain: count for domain, count in result}

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
    # Get max difficulty level in this domain
    max_difficulty = db.query(func.max(Question.difficulty)).filter(
        Question.domain == domain
    ).scalar() or 5  # Default max difficulty is 5
    
    # Special domains don't escalate in difficulty
    if domain in ["Core Values", "Mindful Morning"]:
        return current_difficulty
    
    # If correct, increase difficulty (if not at max)
    if correct and current_difficulty < max_difficulty:
        return current_difficulty + 1
    
    # If incorrect, decrease difficulty (if not at min)
    if not correct and current_difficulty > 1:
        return current_difficulty - 1
    
    # Otherwise keep the same difficulty
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
    result = db.query(
        Question.difficulty, 
        func.count(Question.id).label('count')
    ).filter(
        Question.domain == domain
    ).group_by(Question.difficulty).all()
    
    return {difficulty: count for difficulty, count in result}

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
        db: Database session
        domain: The domain to get a question for
        user_performance: A float between 0 and 1 representing user's performance
        exclude_ids: List of question IDs to exclude
        max_questions_per_domain: Maximum number of questions to ask in this domain
        
    Returns:
        (Question, finished) where Question is the next question or None if domain is finished,
        and finished is a boolean indicating if we've reached the max questions or proficiency
    """
    # Check if we've already asked maximum questions for this domain
    if exclude_ids and len(exclude_ids) >= max_questions_per_domain:
        return None, True
    
    # For Core Values and Mindful Morning domains, limit to 5 questions
    if domain in ["Core Values", "Mindful Morning"] and exclude_ids and len(exclude_ids) >= 5:
        return None, True
    
    # Special case for Core Values and Mindful Morning - always use difficulty level 1
    if domain in ["Core Values", "Mindful Morning"]:
        question = load_random_question(db, domain=domain, difficulty=1, exclude_ids=exclude_ids)
        if question:
            return question, False
        else:
            return None, True
    
    # Get difficulty distribution
    difficulty_counts = get_question_difficulty_distribution(db, domain)
    
    if not difficulty_counts:
        logger.warning(f"No questions found for domain: {domain}")
        return None, True
    
    # Calculate target difficulty level based on user performance
    # Higher performance = higher difficulty
    min_difficulty = min(difficulty_counts.keys())
    max_difficulty = max(difficulty_counts.keys())
    
    # Scale performance to difficulty range
    target_difficulty = min_difficulty + round(user_performance * (max_difficulty - min_difficulty))
    
    # Ensure target difficulty is within valid range
    target_difficulty = max(min_difficulty, min(max_difficulty, target_difficulty))
    
    # Try to find a question with target difficulty
    question = load_random_question(
        db, 
        domain=domain, 
        difficulty=target_difficulty, 
        exclude_ids=exclude_ids
    )
    
    # If no question at target difficulty, try adjacent difficulties
    if not question:
        # Try difficulties above and below target, alternating
        for i in range(1, max(max_difficulty - target_difficulty, target_difficulty - min_difficulty) + 1):
            # Try higher difficulty
            if target_difficulty + i <= max_difficulty:
                question = load_random_question(
                    db, 
                    domain=domain, 
                    difficulty=target_difficulty + i, 
                    exclude_ids=exclude_ids
                )
                if question:
                    break
            
            # Try lower difficulty
            if target_difficulty - i >= min_difficulty:
                question = load_random_question(
                    db, 
                    domain=domain, 
                    difficulty=target_difficulty - i, 
                    exclude_ids=exclude_ids
                )
                if question:
                    break
    
    # If still no question, try any difficulty
    if not question:
        question = load_random_question(db, domain=domain, exclude_ids=exclude_ids)
    
    # Check if user is proficient in this domain (10 consecutive correct answers)
    # We consider the user proficient if their performance is above 0.9 and they've 
    # answered at least 10 questions
    is_proficient = user_performance > 0.9 and exclude_ids and len(exclude_ids) >= 10
    
    if not question or is_proficient:
        return None, True
    
    return question, False

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
    # Get or create user performance record
    user_perf = db.query(UserPerformance).filter(
        UserPerformance.user_id == user_id,
        UserPerformance.domain == domain
    ).first()
    
    if not user_perf:
        user_perf = UserPerformance(
            user_id=user_id,
            domain=domain,
            questions_attempted=0,
            questions_correct=0,
            highest_difficulty=1,
            is_proficient=False
        )
        db.add(user_perf)
    
    # Update statistics
    user_perf.questions_attempted += 1
    if is_correct:
        user_perf.questions_correct += 1
    
    # Update highest difficulty if this is higher
    if difficulty > user_perf.highest_difficulty:
        user_perf.highest_difficulty = difficulty
    
    # Check if user is proficient (80% correct and at least 10 questions)
    if (user_perf.questions_attempted >= 10 and 
        user_perf.questions_correct / user_perf.questions_attempted >= 0.8):
        user_perf.is_proficient = True
    
    db.commit()
    
    return user_perf