"""
Question loader module for the assessment system
This module provides functions to load questions from the database
"""

import random
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct, desc
from typing import List, Optional, Dict, Tuple, Any

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
    
    # Get random questions up to the limit
    # Note: This is not the most efficient way to get random rows,
    # but it works for our purposes
    questions = query.order_by(func.random()).limit(limit).all()
    
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
    questions = load_questions(db, domain, difficulty, exclude_ids, limit=1)
    return questions[0] if questions else None

def get_domains(db: Session):
    """
    Get a list of all domains in the database
    
    Args:
        db: Database session
        
    Returns:
        List of domain strings
    """
    domains = db.query(distinct(Question.domain)).all()
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
        Question.domain, func.count(Question.id)
    ).group_by(Question.domain).all()
    
    return {domain: count for domain, count in results if domain}

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
    # If Core Values or Mindful Morning, don't increase difficulty (always level 1)
    if domain in ["Core Values", "Mindful Morning"]:
        return 1
    
    # Regular domains follow adaptive difficulty
    max_difficulty = db.query(func.max(Question.difficulty)).filter(
        Question.domain == domain
    ).scalar() or 4
    
    if correct:
        # Increase difficulty if correct (max 4)
        return min(current_difficulty + 1, max_difficulty)
    else:
        # Decrease difficulty if wrong (min 1)
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
        Question.difficulty, func.count(Question.id)
    ).filter(
        Question.domain == domain
    ).group_by(Question.difficulty).all()
    
    return {difficulty: count for difficulty, count in results}