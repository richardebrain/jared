"""
Question loader module for the assessment system
This module provides functions to load questions from the database
"""
import logging
import random
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from backend.models import Question

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

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
    try:
        # Start query
        query = db.query(Question)
        
        # Apply filters
        if domain:
            query = query.filter(Question.domain == domain)
        
        if difficulty:
            query = query.filter(Question.difficulty == difficulty)
        
        if exclude_ids:
            query = query.filter(Question.id.notin_(exclude_ids))
        
        # Randomize the order
        query = query.order_by(func.random())
        
        # Limit the results
        query = query.limit(limit)
        
        # Execute query
        questions = query.all()
        
        return questions
    
    except Exception as e:
        logger.error(f"Error loading questions: {e}")
        return []

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
    
    return questions[0] if questions else None

def get_domains(db: Session):
    """
    Get a list of all domains in the database
    
    Args:
        db: Database session
        
    Returns:
        List of domain strings
    """
    try:
        domains = db.query(Question.domain).distinct().all()
        # Convert from list of tuples to list of strings
        return [domain[0] for domain in domains if domain[0]]
    except Exception as e:
        logger.error(f"Error getting domains: {e}")
        return []

def get_question_by_id(db: Session, question_id):
    """
    Get a specific question by ID
    
    Args:
        db: Database session
        question_id: ID of the question to retrieve
        
    Returns:
        Question object or None
    """
    try:
        return db.query(Question).filter(Question.id == question_id).first()
    except Exception as e:
        logger.error(f"Error getting question by ID: {e}")
        return None

def get_question_counts_by_domain(db: Session):
    """
    Get the count of questions for each domain
    
    Args:
        db: Database session
        
    Returns:
        Dictionary with domain names as keys and counts as values
    """
    try:
        domains = get_domains(db)
        result = {}
        
        for domain in domains:
            count = db.query(Question).filter(Question.domain == domain).count()
            result[domain] = count
        
        return result
    except Exception as e:
        logger.error(f"Error getting question counts by domain: {e}")
        return {}

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
    # If we're in special domains like Core Values or Mindful Morning, don't increase difficulty
    if domain in ["Core Values", "Mindful Morning"]:
        return current_difficulty
    
    try:
        # Check if there are questions available at higher difficulty
        max_difficulty = 4  # Maximum difficulty level
        
        if correct:
            # If the answer was correct, try to increase difficulty
            next_difficulty = min(current_difficulty + 1, max_difficulty)
            
            # Check if questions exist at the next difficulty level
            questions_at_next = db.query(Question).filter(
                Question.domain == domain,
                Question.difficulty == next_difficulty
            ).count()
            
            if questions_at_next > 0:
                return next_difficulty
            else:
                # If no questions at next difficulty, stay at current level
                return current_difficulty
        else:
            # If the answer was incorrect, stay at the same level or decrease
            # Decrease only if we're above level 1
            if current_difficulty > 1:
                return current_difficulty - 1
            else:
                return 1
    
    except Exception as e:
        logger.error(f"Error determining next difficulty level: {e}")
        return current_difficulty  # Default to staying at the same level