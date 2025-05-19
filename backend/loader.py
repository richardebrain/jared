"""
Question loader module for the assessment system
This module provides functions to load questions from the database
"""

import random
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct, and_, or_
from typing import List, Dict, Optional

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
    
    # Apply filters if provided
    if domain:
        query = query.filter(Question.domain == domain)
    
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    
    if exclude_ids:
        query = query.filter(~Question.id.in_(exclude_ids))
    
    # Get questions ordered randomly with limit
    return query.order_by(func.random()).limit(limit).all()

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
    domains = db.query(distinct(Question.domain)).filter(Question.domain != None).all()
    return [domain[0] for domain in domains if domain[0]]

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
        Question.domain, func.count(Question.id).label('count')
    ).group_by(Question.domain).all()
    
    return {result.domain: result.count for result in results if result.domain}

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
    # Get the difficulty distribution for this domain
    difficulty_distribution = get_question_difficulty_distribution(db, domain)
    
    if correct:
        # If answer was correct, try to increase difficulty
        next_difficulty = current_difficulty + 1
        
        # Make sure we don't exceed max difficulty and that questions exist
        max_available_difficulty = max(difficulty_distribution.keys()) if difficulty_distribution else 4
        if next_difficulty > max_available_difficulty:
            next_difficulty = max_available_difficulty
            
        # Make sure questions exist at this level
        if next_difficulty in difficulty_distribution and difficulty_distribution[next_difficulty] > 0:
            return next_difficulty
        
        # If no questions at next level, stay at current level
        return current_difficulty
    else:
        # If answer was incorrect, try to decrease difficulty
        next_difficulty = max(1, current_difficulty - 1)
        
        # Make sure questions exist at this level
        if next_difficulty in difficulty_distribution and difficulty_distribution[next_difficulty] > 0:
            return next_difficulty
        
        # If no questions at lower level, stay at current level
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
        Question.difficulty, func.count(Question.id).label('count')
    ).filter(
        Question.domain == domain,
        Question.difficulty != None
    ).group_by(Question.difficulty).all()
    
    return {result.difficulty: result.count for result in results}