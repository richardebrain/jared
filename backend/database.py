"""
Database module for the FastAPI backend
Provides SQLAlchemy integration and database setup
"""

import os
import csv
import logging
from typing import Generator, Tuple
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("database")

# Get database URL from environment variable or use SQLite as fallback
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./mentorme.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLAlchemy setup
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
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
        # Import models to ensure they are registered with SQLAlchemy
        from .models import Question, UserPerformance, UserDomainProgress, AssessmentSession
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        
        return True, "Database setup completed successfully"
    except Exception as e:
        logger.error(f"Database setup error: {str(e)}")
        return False, f"Database setup failed: {str(e)}"

def import_questions_from_csv(csv_file_path: str) -> Tuple[bool, str, int]:
    """
    Import questions from a CSV file into the database
    
    Args:
        csv_file_path: Path to the CSV file
        
    Returns:
        Tuple of (success, message, count)
    """
    try:
        # Check if file exists
        if not os.path.exists(csv_file_path):
            return False, f"File not found: {csv_file_path}", 0
        
        # Import processing function
        from .import_data import process_csv, import_questions
        
        # Process the CSV file
        questions = process_csv(csv_file_path)
        
        if not questions:
            return False, "No valid questions found in the CSV file", 0
        
        # Get a database session
        db = next(get_db())
        
        try:
            # Import questions
            count, errors = import_questions(questions, db)
            
            if errors:
                error_count = len(errors)
                logger.warning(f"Imported {count} questions with {error_count} errors")
                for error in errors[:5]:  # Log the first 5 errors at most
                    logger.warning(f"Import error: {error}")
                
                if error_count > 5:
                    logger.warning(f"... and {error_count - 5} more errors")
                
                return True, f"Imported {count} questions with {error_count} errors", count
            
            return True, f"Successfully imported {count} questions", count
        finally:
            db.close()
    
    except Exception as e:
        logger.error(f"Question import error: {str(e)}")
        return False, f"Question import failed: {str(e)}", 0

def get_question_stats() -> dict:
    """
    Get statistics about questions in the database
    
    Returns:
        Dictionary with statistics
    """
    db = next(get_db())
    try:
        # Import Question model
        from .models import Question
        
        # Get total question count
        total_count = db.query(Question).count()
        
        # Get domain counts
        domain_counts = {}
        domain_results = db.execute(text(
            "SELECT domain, COUNT(*) FROM questions GROUP BY domain"
        )).fetchall()
        
        for domain, count in domain_results:
            domain_counts[domain] = count
        
        # Get difficulty distribution
        difficulty_counts = {}
        difficulty_results = db.execute(text(
            "SELECT difficulty, COUNT(*) FROM questions GROUP BY difficulty"
        )).fetchall()
        
        for difficulty, count in difficulty_results:
            difficulty_counts[str(difficulty)] = count
            
        return {
            "total_questions": total_count,
            "domains": domain_counts,
            "difficulty_distribution": difficulty_counts
        }
    except Exception as e:
        logger.error(f"Error getting question stats: {str(e)}")
        return {"error": str(e)}
    finally:
        db.close()