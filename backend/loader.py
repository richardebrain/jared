"""
Question loader module for the assessment system
This module provides functions to load questions from the database
"""

import logging
import random
from typing import List, Optional, Dict, Any
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from .models import Question

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("mentorme-loader")

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
    
    # Apply domain filter if provided
    if domain:
        query = query.filter(Question.domain == domain)
    
    # Apply difficulty filter if provided
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    
    # Exclude specific IDs if provided
    if exclude_ids:
        query = query.filter(~Question.id.in_(exclude_ids))
    
    # Order randomly and limit
    query = query.order_by(func.random()).limit(limit)
    
    # Execute query
    questions = query.all()
    
    logger.info(f"Loaded {len(questions)} questions (domain={domain}, difficulty={difficulty})")
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
        db, domain=domain, difficulty=difficulty, exclude_ids=exclude_ids, limit=1
    )
    
    if questions:
        return questions[0]
    else:
        # If no questions found with exact difficulty, try finding any question in the domain
        if difficulty and domain:
            logger.info(f"No questions found with difficulty {difficulty} in domain {domain}, trying any difficulty")
            return load_random_question(db, domain=domain, exclude_ids=exclude_ids)
        
        # If that also fails, return None
        logger.warning(f"No matching questions found (domain={domain}, difficulty={difficulty})")
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
    result = {}
    domains = get_domains(db)
    
    for domain in domains:
        count = db.query(func.count(Question.id)).filter(Question.domain == domain).scalar()
        result[domain] = count
    
    return result

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
    # If answer was correct, increase difficulty (if not already at max)
    if correct:
        next_difficulty = min(current_difficulty + 1, 4)
    else:
        # If answer was incorrect, decrease difficulty (if not already at min)
        next_difficulty = max(current_difficulty - 1, 1)
    
    # Verify that questions exist at this difficulty level
    count = db.query(func.count(Question.id)).filter(
        Question.domain == domain,
        Question.difficulty == next_difficulty
    ).scalar()
    
    # If no questions at next difficulty, find the nearest available difficulty
    if count == 0:
        logger.info(f"No questions found at difficulty {next_difficulty} for domain {domain}, looking for nearest")
        
        # Check higher difficulties
        for diff in range(next_difficulty + 1, 5):
            count = db.query(func.count(Question.id)).filter(
                Question.domain == domain,
                Question.difficulty == diff
            ).scalar()
            if count > 0:
                logger.info(f"Found {count} questions at difficulty {diff}")
                return diff
        
        # Check lower difficulties
        for diff in range(next_difficulty - 1, 0, -1):
            count = db.query(func.count(Question.id)).filter(
                Question.domain == domain,
                Question.difficulty == diff
            ).scalar()
            if count > 0:
                logger.info(f"Found {count} questions at difficulty {diff}")
                return diff
    
    return next_difficulty