"""
Data import module for the MentorMe assessment system
This module provides functions to import questions from CSV files
"""

import os
import csv
import json
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Question

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("import_data")

def parse_options_from_csv(row: Dict[str, Any]) -> Dict[str, str]:
    """
    Parse options from CSV row
    
    Args:
        row: CSV row dictionary
        
    Returns:
        Dictionary of options
    """
    options = {}
    option_keys = ['option_a', 'option_b', 'option_c', 'option_d', 'option_e', 'option_f']
    
    for i, key in enumerate(option_keys):
        if key in row and row[key]:
            # Use A, B, C, etc. as the option keys
            options[chr(65 + i)] = row[key]
            
    return options

def parse_tags_from_csv(row: Dict[str, Any]) -> List[str]:
    """
    Parse tags from CSV row
    
    Args:
        row: CSV row dictionary
        
    Returns:
        List of tags
    """
    tags = []
    if 'tags' in row and row['tags']:
        # Split tags by comma and trim whitespace
        tags = [tag.strip() for tag in row['tags'].split(',')]
    return tags

def parse_enhanced_content_from_csv(row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse enhanced content from CSV row
    
    Args:
        row: CSV row dictionary
        
    Returns:
        Dictionary of enhanced content
    """
    enhanced_content = {}
    
    # Add explanation if available
    if 'explanation' in row and row['explanation']:
        enhanced_content['explanation'] = row['explanation']
    
    # Add hints if available
    if 'hints' in row and row['hints']:
        enhanced_content['hints'] = row['hints']
    
    # Add resources if available
    if 'resources' in row and row['resources']:
        resources = []
        # Check if resources are in format "title|url, title|url"
        resource_items = row['resources'].split(',')
        
        for item in resource_items:
            parts = item.strip().split('|')
            if len(parts) == 2:
                resources.append({
                    'title': parts[0].strip(),
                    'url': parts[1].strip()
                })
            else:
                # Just add as a simple string if not in title|url format
                resources.append({'title': item.strip(), 'url': None})
        
        enhanced_content['resources'] = resources
    
    return enhanced_content

def create_question_from_csv_row(row: Dict[str, Any]) -> Question:
    """
    Create a question from a CSV row
    
    Args:
        row: CSV row dictionary
        
    Returns:
        Question object
    """
    # Parse options
    options = parse_options_from_csv(row)
    
    # Parse tags
    tags = parse_tags_from_csv(row)
    
    # Parse enhanced content
    enhanced_content = parse_enhanced_content_from_csv(row)
    
    # Map CSV question type to internal type
    question_type = row.get('question_type', '').lower()
    if question_type not in ['multiple_choice', 'true_false', 'short_answer']:
        # Default to multiple choice if not specified or not a recognized type
        question_type = 'multiple_choice'
        
    # Determine difficulty level (1-5)
    try:
        difficulty = int(row.get('difficulty', 1))
        if difficulty < 1 or difficulty > 5:
            difficulty = 1
    except (ValueError, TypeError):
        difficulty = 1
    
    # Determine time limit
    try:
        time_limit = int(row.get('time_limit', 60))
    except (ValueError, TypeError):
        time_limit = 60
    
    # Determine points
    try:
        points = int(row.get('points', 10))
    except (ValueError, TypeError):
        points = 10
    
    # Create and return the question
    return Question(
        question=row['question'],
        correct_answer=row['correct_answer'],
        options=json.dumps(options),
        q_type=question_type,
        difficulty=difficulty,
        domain=row.get('domain', 'General'),
        sub_domain=row.get('sub_domain', None),
        tags=json.dumps(tags),
        enhanced_content=json.dumps(enhanced_content),
        time_limit=time_limit,
        points=points
    )

def import_questions_from_csv(
    file_path: str, 
    db: Optional[Session] = None
) -> int:
    """
    Import questions from a CSV file
    
    Args:
        file_path: Path to the CSV file
        db: SQLAlchemy session (optional)
        
    Returns:
        Number of questions imported
    """
    close_db = False
    imported_count = 0
    
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        return 0
    
    try:
        # Open database session if not provided
        if db is None:
            close_db = True
            db = next(get_db())
        
        with open(file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            # Track questions to detect duplicates
            existing_questions = {}
            for row in reader:
                # Skip rows without required fields
                if 'question' not in row or not row['question'] or 'correct_answer' not in row:
                    logger.warning(f"Skipping row with missing required fields: {row}")
                    continue
                
                # Check for duplicate questions
                question_text = row['question'].strip()
                if question_text in existing_questions:
                    logger.warning(f"Skipping duplicate question: {question_text}")
                    continue
                
                # Check if question already exists in the database
                existing_db_question = db.query(Question).filter(
                    Question.question == question_text
                ).first()
                
                if existing_db_question:
                    logger.warning(f"Question already exists in database: {question_text}")
                    continue
                
                # Create and add the question
                try:
                    question = create_question_from_csv_row(row)
                    db.add(question)
                    existing_questions[question_text] = True
                    imported_count += 1
                except Exception as e:
                    logger.error(f"Error creating question from row: {e}")
                    continue
            
            # Commit the transaction
            db.commit()
            logger.info(f"Successfully imported {imported_count} questions from {file_path}")
            
    except Exception as e:
        logger.error(f"Error importing questions from {file_path}: {e}")
        if db and close_db:
            db.rollback()
    finally:
        if db and close_db:
            db.close()
    
    return imported_count