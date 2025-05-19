"""
Database module for the FastAPI backend
Provides SQLAlchemy integration and database setup
"""

import os
import logging
from typing import Tuple, Optional

from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("database")

# Get database URL from environment or use a default SQLite database for development
DATABASE_URL = os.environ.get(
    "DATABASE_URL", 
    "sqlite:///./mentorme_assessment.db"
)

# Create SQLAlchemy engine
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(DATABASE_URL)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for declarative models
Base = declarative_base()

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
        # Import models here to avoid circular imports
        from .models import Question, UserPerformance, AssessmentResult
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        # Check database connection
        with SessionLocal() as db:
            # Execute a simple query to verify connection
            result = db.execute(text("SELECT 1")).scalar()
            if result != 1:
                return False, "Database connection check failed"
            
            # Check if questions table has data
            question_count = db.query(Question).count()
            logger.info(f"Found {question_count} questions in the database")
        
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
        import csv
        from .models import Question
        
        count = 0
        with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            questions = []
            
            for row in reader:
                try:
                    # Extract fields from CSV (customize as needed based on your CSV structure)
                    question = Question(
                        question=row.get('question', ''),
                        answer=row.get('answer', ''),
                        q_type=row.get('type', 'multiple_choice'),
                        options=row.get('options', '{}'),
                        domain=row.get('domain', 'General'),
                        difficulty=int(row.get('difficulty', 1)),
                        sub_competency=row.get('sub_competency', None),
                        enhanced_content=row.get('enhanced_content', None)
                    )
                    questions.append(question)
                    count += 1
                except Exception as e:
                    logger.error(f"Error parsing row: {row}, error: {str(e)}")
            
            # Add all questions to database
            with SessionLocal() as db:
                db.add_all(questions)
                db.commit()
            
            return True, f"Imported {count} questions successfully", count
    except Exception as e:
        logger.error(f"Error importing questions: {str(e)}")
        return False, f"Failed to import questions: {str(e)}", 0

def get_question_stats() -> dict:
    """
    Get statistics about questions in the database
    
    Returns:
        Dictionary with statistics
    """
    try:
        from .models import Question
        
        with SessionLocal() as db:
            total_count = db.query(Question).count()
            
            # Get count by domain
            domain_query = db.query(Question.domain, db.func.count(Question.id)).group_by(Question.domain).all()
            domains = {domain: count for domain, count in domain_query}
            
            # Get count by difficulty
            difficulty_query = db.query(Question.difficulty, db.func.count(Question.id)).group_by(Question.difficulty).all()
            difficulties = {str(difficulty): count for difficulty, count in difficulty_query}
            
            return {
                "total_count": total_count,
                "domains": domains,
                "difficulties": difficulties
            }
    except Exception as e:
        logger.error(f"Error getting question stats: {str(e)}")
        return {"error": str(e)}