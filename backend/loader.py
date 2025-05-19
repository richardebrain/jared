"""
Question loader module for the assessment system
This module provides functions to load questions from the database
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
import random
from typing import List, Optional

from .models import Question

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
    
    # Limit and return
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
    query = db.query(Question)
    
    # Apply filters
    if domain:
        query = query.filter(Question.domain == domain)
    
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    
    if exclude_ids:
        query = query.filter(~Question.id.in_(exclude_ids))
    
    # Get count of matching questions
    count = query.count()
    
    if count == 0:
        return None
    
    # Pick a random question
    offset = random.randint(0, count - 1)
    question = query.offset(offset).first()
    
    return question

def get_domains(db: Session):
    """
    Get a list of all domains in the database
    
    Args:
        db: Database session
        
    Returns:
        List of domain strings
    """
    domains = db.query(Question.domain).distinct().all()
    return [d[0] for d in domains]

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
    results = db.query(Question.domain, func.count(Question.id)).group_by(Question.domain).all()
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
    # Core Values and Mindful Morning domains don't use difficulty progression
    if domain in ["Core Values", "Mindful Morning"]:
        return 1
    
    # If answer was correct, maybe increase difficulty
    if correct:
        # Only increase if not already at max
        if current_difficulty < 4:
            # Check if there are questions available at the next level
            next_level = current_difficulty + 1
            count = db.query(Question).filter(
                Question.domain == domain,
                Question.difficulty == next_level
            ).count()
            
            # If there are questions at the next level, increase difficulty
            if count > 0:
                return next_level
    
    # If answer was wrong, maybe decrease difficulty
    elif current_difficulty > 1:
        return current_difficulty - 1
    
    # Default: keep current difficulty
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
    return db.query(func.count(Question.id)).filter(Question.domain == domain).scalar()