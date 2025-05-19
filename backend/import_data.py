"""
Data import module for the assessment system

This script helps import questions from CSV files into the database.
It can be run directly or imported and used in other scripts.
"""

import os
import csv
import argparse
import logging
import json
from typing import List, Dict, Any, Tuple

from sqlalchemy.orm import Session

from .database import SessionLocal, engine
from .models import Base, Question

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("import_data")

def create_database_tables():
    """Create all database tables"""
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created")

def process_csv(csv_file_path: str) -> List[Dict[str, Any]]:
    """
    Process a CSV file and return a list of dictionaries
    
    Args:
        csv_file_path: Path to the CSV file
        
    Returns:
        List of dictionaries representing CSV rows
    """
    logger.info(f"Processing CSV file: {csv_file_path}")
    
    rows = []
    with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            rows.append(row)
    
    logger.info(f"Processed {len(rows)} rows from {csv_file_path}")
    return rows

def transform_row(row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform a CSV row into a format suitable for the Question model
    
    Args:
        row: Dictionary representing a CSV row
        
    Returns:
        Transformed row dictionary
    """
    # Extract base fields
    question_text = row.get('question', '')
    answer = row.get('answer', '')
    
    # Determine question type
    q_type = row.get('type', '').lower()
    if not q_type or q_type not in ['multiple_choice', 'true_false', 'short_answer']:
        # Try to infer type from the data
        if answer.lower() in ['true', 'false']:
            q_type = 'true_false'
        elif 'option_a' in row or 'options' in row:
            q_type = 'multiple_choice'
        else:
            q_type = 'short_answer'
    
    # Process options for multiple choice
    options = {}
    if q_type == 'multiple_choice':
        # Check if options are in a single field or multiple fields
        if 'options' in row and row['options']:
            try:
                # Try to parse options as JSON
                options = json.loads(row['options'])
            except json.JSONDecodeError:
                # If not valid JSON, try to split by semicolons
                options_list = row['options'].split(';')
                for i, opt in enumerate(options_list):
                    key = chr(97 + i)  # 'a', 'b', 'c', etc.
                    options[key] = opt.strip()
        else:
            # Check for individual option fields (option_a, option_b, etc.)
            for key in row:
                if key.startswith('option_') and row[key]:
                    option_key = key.replace('option_', '')
                    options[option_key] = row[key]
    
    # Get domain and difficulty
    domain = row.get('domain', 'General')
    
    try:
        difficulty = int(row.get('difficulty', 1))
        if difficulty < 1 or difficulty > 5:
            difficulty = 1
    except (ValueError, TypeError):
        difficulty = 1
    
    # Get or create enhanced content
    enhanced_content = {}
    if 'explanation' in row and row['explanation']:
        enhanced_content['explanation'] = row['explanation']
    if 'image_url' in row and row['image_url']:
        enhanced_content['image_url'] = row['image_url']
    if 'video_url' in row and row['video_url']:
        enhanced_content['video_url'] = row['video_url']
    if 'hint' in row and row['hint']:
        enhanced_content['hint'] = row['hint']
    
    # Create transformed row
    transformed = {
        'question': question_text,
        'answer': answer,
        'q_type': q_type,
        'options': json.dumps(options),
        'domain': domain,
        'difficulty': difficulty,
        'sub_competency': row.get('sub_competency', None),
        'enhanced_content': json.dumps(enhanced_content) if enhanced_content else None
    }
    
    return transformed

def import_questions(questions: List[Dict[str, Any]], db: Session) -> Tuple[int, List[str]]:
    """
    Import questions into the database
    
    Args:
        questions: List of question dictionaries
        db: Database session
        
    Returns:
        Tuple of (count of imported questions, list of errors)
    """
    count = 0
    errors = []
    
    for question_data in questions:
        try:
            # Create Question object
            question = Question(**question_data)
            
            # Add to database
            db.add(question)
            count += 1
        except Exception as e:
            error_msg = f"Error importing question: {str(e)}, data: {question_data}"
            errors.append(error_msg)
            logger.error(error_msg)
    
    # Commit changes
    db.commit()
    
    return count, errors

def main():
    """Main entry point for the script"""
    parser = argparse.ArgumentParser(description='Import questions from CSV files')
    parser.add_argument('csv_file', help='Path to the CSV file with questions')
    parser.add_argument('--create-tables', action='store_true', help='Create database tables if they do not exist')
    
    args = parser.parse_args()
    
    # Create tables if requested
    if args.create_tables:
        create_database_tables()
    
    # Process CSV file
    questions_data = process_csv(args.csv_file)
    
    # Transform rows
    transformed_questions = [transform_row(row) for row in questions_data]
    
    # Import questions to database
    with SessionLocal() as db:
        count, errors = import_questions(transformed_questions, db)
    
    logger.info(f"Imported {count} questions successfully")
    if errors:
        logger.warning(f"{len(errors)} errors occurred during import")
        for error in errors:
            logger.warning(error)

if __name__ == "__main__":
    main()