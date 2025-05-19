"""
Data import module for the MentorMe assessment system
This module provides functions to import questions from CSV files
"""

import csv
import json
import logging
from typing import Dict, Any, List, Optional

from sqlalchemy.orm import Session

from .database import SessionLocal
from .models import Question

# Configure logging
logging.basicConfig(level=logging.INFO)
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
    
    # Check for option keys (option_a, option_b, etc.)
    for key in row.keys():
        if key.startswith("option_") and row[key]:
            # Extract the option letter (a, b, c, etc.)
            option_letter = key.split("_")[1].upper()
            options[option_letter] = row[key]
    
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
    
    # Check for tags column
    if "tags" in row and row["tags"]:
        # Split by comma
        tags = [tag.strip() for tag in row["tags"].split(",")]
    
    return tags

def parse_enhanced_content_from_csv(row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse enhanced content from CSV row
    
    Args:
        row: CSV row dictionary
        
    Returns:
        Dictionary of enhanced content
    """
    # If enhanced_content is directly provided as JSON
    if "enhanced_content" in row and row["enhanced_content"]:
        try:
            if isinstance(row["enhanced_content"], str):
                return json.loads(row["enhanced_content"])
            elif isinstance(row["enhanced_content"], dict):
                return row["enhanced_content"]
        except json.JSONDecodeError:
            logger.warning(f"Invalid JSON in enhanced_content for question '{row.get('question', 'Unknown')}'")
    
    # Otherwise, return empty dict
    return {}

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
    
    # Create and return the question
    return Question(
        question=row.get("question", ""),
        correct_answer=row.get("correct_answer", ""),
        options=json.dumps(options) if options else None,
        q_type=row.get("question_type", "multiple_choice"),
        difficulty=int(row.get("difficulty", 1)),
        domain=row.get("domain", "General"),
        sub_domain=row.get("sub_domain"),
        tags=json.dumps(tags) if tags else None,
        enhanced_content=json.dumps(enhanced_content) if enhanced_content else None,
        time_limit=int(row.get("time_limit", 60)),
        points=int(row.get("points", 10))
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
    # Create session if not provided
    close_db = False
    if db is None:
        db = SessionLocal()
        close_db = True
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            
            # Check required columns
            required_columns = ["question", "correct_answer"]
            for col in required_columns:
                if col not in reader.fieldnames:
                    raise ValueError(f"CSV file missing required column: {col}")
            
            # Process each row
            count = 0
            error_count = 0
            
            for row in reader:
                try:
                    # Skip empty rows
                    if not row.get("question"):
                        continue
                    
                    # Create question from row
                    question = create_question_from_csv_row(row)
                    
                    # Add to session
                    db.add(question)
                    
                    # Increment counter
                    count += 1
                    
                    # Log
                    logger.info(f"Added new question: {question.question[:50]}...")
                except Exception as e:
                    error_count += 1
                    logger.error(f"Error importing question: {e}")
            
            # Commit changes
            db.commit()
            
            # Log results
            logger.info(f"Import completed. Imported {count} questions with {error_count} errors")
            
            return count
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error importing CSV: {e}")
        raise
    
    finally:
        if close_db:
            db.close()