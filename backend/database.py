"""
Database module for the FastAPI backend
Provides SQLAlchemy integration and database setup
"""

import os
import csv
import logging
from typing import Tuple
from sqlalchemy import create_engine, text, func, select, distinct
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError

from .models import Base, Question

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("database")

# Get database URL from environment or use SQLite as fallback
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./mentorme_assessment.db")

# Create database engine
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # PostgreSQL or other database
    engine = create_engine(DATABASE_URL)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """
    Get a database session for dependency injection
    
    Returns:
        Database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def setup_database() -> Tuple[bool, str]:
    """
    Set up the database by creating all tables
    
    Returns:
        Tuple of (success, message)
    """
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        return True, "Database setup completed successfully"
    except SQLAlchemyError as e:
        error_msg = f"Database setup error: {str(e)}"
        logger.error(error_msg)
        return False, error_msg

def import_questions_from_csv(csv_file_path: str) -> Tuple[bool, str, int]:
    """
    Import questions from a CSV file into the database
    
    Args:
        csv_file_path: Path to the CSV file
        
    Returns:
        Tuple of (success, message, count)
    """
    if not os.path.exists(csv_file_path):
        return False, f"CSV file not found: {csv_file_path}", 0
        
    try:
        # Import the CSV processing functionality
        from .import_data import process_csv, transform_row
        
        # Process CSV file
        rows = process_csv(csv_file_path)
        
        # Transform rows to question format
        questions_data = [transform_row(row) for row in rows]
        
        # Import questions to database
        count = 0
        with SessionLocal() as db:
            for question_data in questions_data:
                question = Question(**question_data)
                db.add(question)
                count += 1
            
            # Commit changes
            db.commit()
        
        return True, f"Successfully imported {count} questions", count
    except Exception as e:
        error_msg = f"Error importing questions: {str(e)}"
        logger.error(error_msg)
        return False, error_msg, 0

def get_question_stats() -> dict:
    """
    Get statistics about questions in the database
    
    Returns:
        Dictionary with statistics
    """
    with SessionLocal() as db:
        try:
            # Get total question count
            total_count = db.query(func.count(Question.id)).scalar()
            
            # Get domain counts
            domain_query = db.query(
                Question.domain,
                func.count(Question.id).label('count')
            ).group_by(Question.domain)
            
            domain_counts = {
                domain: count for domain, count in domain_query
            }
            
            # Get difficulty distribution
            difficulty_query = db.query(
                Question.difficulty,
                func.count(Question.id).label('count')
            ).group_by(Question.difficulty)
            
            difficulty_counts = {
                difficulty: count for difficulty, count in difficulty_query
            }
            
            # Get question type distribution
            type_query = db.query(
                Question.q_type,
                func.count(Question.id).label('count')
            ).group_by(Question.q_type)
            
            type_counts = {
                q_type: count for q_type, count in type_query
            }
            
            return {
                "total_questions": total_count,
                "domains": domain_counts,
                "difficulties": difficulty_counts,
                "question_types": type_counts
            }
        except SQLAlchemyError as e:
            logger.error(f"Error getting question stats: {str(e)}")
            return {
                "error": str(e),
                "total_questions": 0,
                "domains": {},
                "difficulties": {},
                "question_types": {}
            }