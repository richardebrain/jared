"""
Question loader module for the assessment system
This module provides functions to load questions from the database
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
import random
from typing import List, Optional, Dict
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
        
    # Get random selection of questions
    # First count total matching questions
    count = query.count()
    
    # If count is less than limit, return all
    if count <= limit:
        return query.all()
    
    # Otherwise, select random subset
    # Get all IDs that match criteria
    question_ids = [q.id for q in query.with_entities(Question.id).all()]
    
    # Randomly select limit IDs
    selected_ids = random.sample(question_ids, limit)
    
    # Return questions with selected IDs
    return db.query(Question).filter(Question.id.in_(selected_ids)).all()

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
    if questions:
        return questions[0]
    return None

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
    # If answer was correct, increase difficulty if possible
    if correct:
        if current_difficulty < 4:  # Assuming max difficulty is 4
            # Check if questions exist at next difficulty level
            next_level = current_difficulty + 1
            count = db.query(Question).filter(
                Question.domain == domain,
                Question.difficulty == next_level
            ).count()
            
            if count > 0:
                return next_level
                
    # If answer was incorrect or no higher difficulty questions exist
    # Decrease difficulty if possible
    elif current_difficulty > 1:  # Assuming min difficulty is 1
        return current_difficulty - 1
        
    # Otherwise stay at current difficulty
    return current_difficulty