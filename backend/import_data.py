"""
Import enhanced ECE question database into our assessment system
This script reads the CSV file containing the enhanced questions data
and populates the database tables for the assessment system
"""

import csv
import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
import logging
from contextlib import contextmanager

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from .database import setup_database, get_db_context
from .models import Question

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("import_data")

def setup_database():
    """Create database tables if they don't exist"""
    from .database import setup_database as db_setup
    db_setup()
    logger.info("Database tables created or verified")

def clean_text(text):
    """Clean text fields from the CSV"""
    if not text:
        return None
    
    # Remove extra whitespace and quotes
    text = text.strip()
    if text.startswith('"') and text.endswith('"'):
        text = text[1:-1]
    
    # Return None for empty strings or placeholder values
    if text in ["", "N/A", "None", "null"]:
        return None
    
    return text

def import_questions_from_csv(file_path="attached_assets/ece_master_database_full_with_why.csv"):
    """Import questions from CSV file into database"""
    if not os.path.exists(file_path):
        logger.error(f"CSV file not found: {file_path}")
        return False, f"CSV file not found: {file_path}"
    
    success_count = 0
    error_count = 0
    
    with get_db_context() as db:
        try:
            with open(file_path, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                
                for row_idx, row in enumerate(reader, start=1):
                    try:
                        # Create options dictionary
                        options = {}
                        for opt in ['A', 'B', 'C', 'D']:
                            option_key = f'option_{opt.lower()}'
                            if option_key in row and row[option_key]:
                                options[opt] = clean_text(row[option_key])
                        
                        # Process resources as a list
                        resources = []
                        if 'resources' in row and row['resources']:
                            resources_text = clean_text(row['resources'])
                            if resources_text:
                                # Try to parse as JSON if it looks like a list
                                if resources_text.startswith('[') and resources_text.endswith(']'):
                                    try:
                                        resources = json.loads(resources_text)
                                    except json.JSONDecodeError:
                                        # Split by commas if JSON parsing fails
                                        resources = [r.strip() for r in resources_text.split(',')]
                                else:
                                    # Split by commas
                                    resources = [r.strip() for r in resources_text.split(',')]
                        
                        # Create question object
                        question = Question()
                        question.question = clean_text(row.get('question', ''))
                        question.domain = clean_text(row.get('domain', 'General'))
                        question.difficulty = int(clean_text(row.get('difficulty', '1')) or 1)
                        question.q_type = clean_text(row.get('q_type', 'multiple_choice')) or 'multiple_choice'
                        question.options = options
                        question.correct_answer = clean_text(row.get('correct_answer', ''))
                        question.sub_competency = clean_text(row.get('sub_competency'))
                        question.competency = clean_text(row.get('competency'))
                        question.class_dimension = clean_text(row.get('class_dimension'))
                        question.practical_application_strategy = clean_text(row.get('practical_application_strategy'))
                        question.why_behind_it = clean_text(row.get('why_behind_it'))
                        question.classroom_examples = clean_text(row.get('classroom_examples'))
                        question.citations = clean_text(row.get('citations'))
                        question.resources = resources
                        question.created_at = datetime.utcnow()
                        question.updated_at = datetime.utcnow().isoformat()
                        
                        # Validate required fields
                        if not question.question:
                            raise ValueError("Question text is required")
                        
                        if not question.correct_answer:
                            raise ValueError("Correct answer is required")
                        
                        # Save to database
                        db.add(question)
                        success_count += 1
                        
                        # Log progress every 100 records
                        if success_count % 100 == 0:
                            logger.info(f"Imported {success_count} questions so far...")
                        
                    except Exception as e:
                        error_count += 1
                        logger.error(f"Error importing row {row_idx}: {str(e)}")
                        continue
                
                # Commit at the end
                db.commit()
            
            logger.info(f"Import completed. Successful: {success_count}, Failed: {error_count}")
            return True, f"Import completed. Successful: {success_count}, Failed: {error_count}"
            
        except Exception as e:
            db.rollback()
            error_msg = f"Error during import: {str(e)}"
            logger.error(error_msg)
            return False, error_msg

def run_import():
    """Main function to run the import process"""
    logger.info("Starting import process...")
    
    # Setup the database
    setup_database()
    
    # Import questions
    success, message = import_questions_from_csv()
    
    if success:
        logger.info("Import completed successfully")
    else:
        logger.error(f"Import failed: {message}")
    
    return success, message

if __name__ == "__main__":
    run_import()