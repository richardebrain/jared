"""
Question loader module for the assessment system
This module provides functions to load questions from the database
"""

import random
from sqlalchemy import func, or_
from sqlalchemy.orm import Session
from .models import Question, Assessment, Response


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
    
    # Get random questions up to the limit
    questions_count = query.count()
    
    if questions_count <= limit:
        # If we have fewer questions than the limit, return all of them
        return query.all()
    else:
        # Otherwise, return a random selection
        random_ids = random.sample(range(1, questions_count + 1), limit)
        return query.filter(Question.id.in_(random_ids)).all()


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
    query = db.query(Question)
    
    # Apply filters
    if domain:
        query = query.filter(Question.domain == domain)
    
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    
    if exclude_ids:
        query = query.filter(~Question.id.in_(exclude_ids))
    
    # Count total matching questions
    count = query.count()
    
    if count == 0:
        return None
    
    # Get a random question
    random_offset = random.randint(0, count - 1)
    return query.offset(random_offset).first()


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
    # Special case for Core Values and Mindful Morning
    if domain in ["Core Values", "Mindful Morning"]:
        return current_difficulty  # Don't increase difficulty for these domains
    
    # Get the max difficulty level for this domain
    max_difficulty = db.query(func.max(Question.difficulty)).filter(Question.domain == domain).scalar() or 4
    
    # If answer was correct, increase difficulty (unless at max)
    if correct:
        return min(current_difficulty + 1, max_difficulty)
    else:
        # If answer was wrong, stay at current level or decrease
        return max(current_difficulty - 1, 1)


def get_domain_questions_count(db: Session, domain: str):
    """
    Get the total count of questions for a specific domain
    
    Args:
        db: Database session
        domain: The domain to count questions for
        
    Returns:
        Integer count of questions
    """
    return db.query(Question).filter(Question.domain == domain).count()