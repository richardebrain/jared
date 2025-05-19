"""
Question loader module for the assessment system
This module provides functions to load questions from the database
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_, or_
import random
from typing import List, Dict, Optional, Any

from .models import Question, Assessment, Answer

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
        query = query.filter(Question.id.notin_(exclude_ids))
        
    # Order by ID for consistent results
    query = query.order_by(Question.id)
    
    # Limit results
    if limit:
        query = query.limit(limit)
        
    return query.all()

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
    # Use count first to avoid loading unnecessary data
    query = db.query(func.count(Question.id))
    
    # Apply filters
    if domain:
        query = query.filter(Question.domain == domain)
    
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    
    if exclude_ids:
        query = query.filter(Question.id.notin_(exclude_ids))
        
    count = query.scalar()
    if count == 0:
        return None
        
    # Get a random offset
    offset = random.randint(0, count - 1)
    
    # Query again with offset
    query = db.query(Question)
    
    # Apply the same filters
    if domain:
        query = query.filter(Question.domain == domain)
    
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    
    if exclude_ids:
        query = query.filter(Question.id.notin_(exclude_ids))
        
    # Apply offset and limit to 1
    query = query.offset(offset).limit(1)
    
    # Get the result or None
    result = query.first()
    return result

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
    counts = db.query(Question.domain, func.count(Question.id)).group_by(Question.domain).all()
    return {domain: count for domain, count in counts}

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
    # Special case: Core Values and Mindful Morning domains don't escalate
    if domain in ["Core Values", "Mindful Morning"]:
        return 1
    
    # Get available difficulty levels for this domain
    difficulty_levels = db.query(Question.difficulty).filter(
        Question.domain == domain
    ).distinct().order_by(Question.difficulty).all()
    difficulty_levels = [level[0] for level in difficulty_levels]
    
    if not difficulty_levels:
        return 1
    
    max_difficulty = max(difficulty_levels)
    min_difficulty = min(difficulty_levels)
    
    # If answer was correct, increase difficulty (or keep at max)
    if correct:
        if current_difficulty >= max_difficulty:
            return max_difficulty
        else:
            return current_difficulty + 1
    else:
        # If answer was wrong, decrease difficulty (or keep at min)
        if current_difficulty <= min_difficulty:
            return min_difficulty
        else:
            return current_difficulty - 1

def get_domain_questions_count(db: Session, domain: str):
    """
    Get the total count of questions for a specific domain
    
    Args:
        db: Database session
        domain: The domain to count questions for
        
    Returns:
        Integer count of questions
    """
    return db.query(func.count(Question.id)).filter(Question.domain == domain).scalar()

def get_question_difficulty_distribution(db: Session, domain: str):
    """
    Get the distribution of questions by difficulty level for a domain
    
    Args:
        db: Database session
        domain: The domain to analyze
        
    Returns:
        Dictionary with difficulty levels as keys and counts as values
    """
    result = db.query(Question.difficulty, func.count(Question.id)).filter(
        Question.domain == domain
    ).group_by(Question.difficulty).all()
    
    return {difficulty: count for difficulty, count in result}