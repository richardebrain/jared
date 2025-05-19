"""
Import enhanced ECE question database into our assessment system
This script reads the CSV file containing the enhanced questions data
and populates the database tables for the assessment system
"""

import csv
import json
import logging
import os
import re
from typing import Dict, List, Any, Optional

from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker, Session

from .models import Base, Question
from .database import get_db_context

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("import_data")

def setup_database():
    """Create database tables if they don't exist"""
    try:
        # Using the database URL from environment variable
        db_url = os.environ.get("DATABASE_URL")
        if not db_url:
            logger.warning("DATABASE_URL not found in environment. Using SQLite database.")
            db_url = "sqlite:///./mentorme.db"
        
        engine = create_engine(db_url)
        Base.metadata.create_all(engine)
        logger.info("Database tables created successfully")
        return True, "Database setup successful"
    except SQLAlchemyError as e:
        logger.error(f"Database setup error: {e}")
        return False, str(e)

def clean_text(text):
    """Clean text fields from the CSV"""
    if not text:
        return ""
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text.strip())
    
    # Remove special characters that might cause issues
    text = text.replace('\n', ' ').replace('\r', '')
    
    return text

def import_questions_from_csv(file_path="attached_assets/ece_master_database_full_with_why.csv"):
    """Import questions from CSV file into database"""
    logger.info(f"Starting import from {file_path}")
    
    # Initialize counters
    total_count = 0
    success_count = 0
    error_count = 0
    
    # Column mapping from CSV to database fields
    column_mapping = {
        "Question": "question",
        "Answer": "answer",
        "Options": "options",
        "Domain": "domain",
        "Difficulty": "difficulty",
        "Sub-Competency": "sub_competency",
        "Why This Answer is Correct": "why_correct",
        "Additional Resources": "additional_resources",
        "Real-World Example": "real_world_example",
        "How to Use This Knowledge": "practical_application"
    }
    
    try:
        # Get database session
        with get_db_context() as db:
            # Open and read CSV file
            with open(file_path, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                
                for row in reader:
                    total_count += 1
                    
                    try:
                        # Extract and clean data
                        question_text = clean_text(row.get("Question", ""))
                        if not question_text:
                            logger.warning(f"Skipping row {total_count}: Missing question text")
                            error_count += 1
                            continue
                        
                        answer = clean_text(row.get("Answer", ""))
                        if not answer:
                            logger.warning(f"Skipping row {total_count}: Missing answer")
                            error_count += 1
                            continue
                        
                        # Process options (convert to JSON)
                        options_text = row.get("Options", "")
                        options_dict = {}
                        
                        # Handle different option formats
                        if options_text:
                            # Try to parse options in format "A: Option text, B: Option text"
                            options_parts = re.findall(r'([A-D])\s*:\s*([^,]+)(?:,|$)', options_text)
                            if options_parts:
                                for key, value in options_parts:
                                    options_dict[key.strip()] = clean_text(value)
                            else:
                                # Try to parse JSON format
                                try:
                                    options_dict = json.loads(options_text)
                                except json.JSONDecodeError:
                                    # If both approaches fail, split by commas
                                    options_list = [opt.strip() for opt in options_text.split(',')]
                                    for i, opt in enumerate(options_list):
                                        options_dict[chr(65 + i)] = opt  # A, B, C, D...
                        
                        # Determine question type based on options
                        q_type = "multiple_choice" if options_dict else "true_false"
                        
                        # Extract domain with fallback
                        domain = clean_text(row.get("Domain", ""))
                        if not domain:
                            domain = "General Knowledge"
                        
                        # Extract difficulty level (default to 1 if not specified or invalid)
                        try:
                            difficulty = int(row.get("Difficulty", 1))
                            if difficulty < 1 or difficulty > 5:
                                difficulty = 1
                        except (ValueError, TypeError):
                            difficulty = 1
                        
                        # Build enhanced content dictionary
                        enhanced_content = {
                            "why_correct": clean_text(row.get("Why This Answer is Correct", "")),
                            "additional_resources": clean_text(row.get("Additional Resources", "")),
                            "real_world_example": clean_text(row.get("Real-World Example", "")),
                            "practical_application": clean_text(row.get("How to Use This Knowledge", ""))
                        }
                        
                        # Create new question object
                        new_question = Question(
                            question=question_text,
                            answer=answer,
                            options=json.dumps(options_dict),
                            domain=domain,
                            difficulty=difficulty,
                            q_type=q_type,
                            sub_competency=clean_text(row.get("Sub-Competency", "")),
                            enhanced_content=json.dumps(enhanced_content)
                        )
                        
                        # Check if question already exists (based on text)
                        existing_question = db.query(Question).filter(
                            Question.question == question_text
                        ).first()
                        
                        if existing_question:
                            logger.info(f"Question already exists (ID: {existing_question.id}), updating")
                            # Update existing question
                            existing_question.answer = new_question.answer
                            existing_question.options = new_question.options
                            existing_question.domain = new_question.domain
                            existing_question.difficulty = new_question.difficulty
                            existing_question.q_type = new_question.q_type
                            existing_question.sub_competency = new_question.sub_competency
                            existing_question.enhanced_content = new_question.enhanced_content
                        else:
                            # Add new question to database
                            db.add(new_question)
                        
                        success_count += 1
                        
                        # Commit every 50 questions to avoid large transactions
                        if success_count % 50 == 0:
                            db.commit()
                            logger.info(f"Imported {success_count} questions so far")
                    
                    except Exception as e:
                        error_count += 1
                        logger.error(f"Error processing row {total_count}: {e}")
                
                # Final commit for any remaining questions
                db.commit()
    
    except FileNotFoundError:
        logger.error(f"CSV file not found: {file_path}")
        return False, f"CSV file not found: {file_path}"
    
    except Exception as e:
        logger.error(f"Import failed: {e}")
        return False, f"Import failed: {e}"
    
    # Log summary
    logger.info(f"Import complete: {success_count} questions imported successfully")
    logger.info(f"Errors: {error_count} questions skipped due to errors")
    
    return True, {
        "total": total_count,
        "success": success_count,
        "errors": error_count
    }

def run_import():
    """Main function to run the import process"""
    logger.info("Starting ECE question database import")
    
    # Setup database
    db_result, db_message = setup_database()
    if not db_result:
        logger.error(f"Database setup failed: {db_message}")
        return False, f"Database setup failed: {db_message}"
    
    # Import questions
    import_result, import_data = import_questions_from_csv()
    
    if not import_result:
        logger.error(f"Import failed: {import_data}")
        return False, f"Import failed: {import_data}"
    
    logger.info(f"Import completed successfully: {import_data}")
    return True, import_data

if __name__ == "__main__":
    # When run as script
    success, result = run_import()
    if success:
        print(f"Import completed successfully: {result}")
    else:
        print(f"Import failed: {result}")