"""
JSON Questions Import module for the MentorMe assessment system
This module imports question data from JSON files created from the master question set
"""

import json
import logging
import os
from typing import Dict, List, Any, Optional
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import func, exc

from backend.database import get_db_context
from backend.models import (
    Question, Domain, Tag, QuestionType
)
from backend.import_data import ensure_default_domains

# Setup logging
logger = logging.getLogger("mentorme-assessment-api")

def import_questions_from_json(file_path: str) -> int:
    """Import questions from a JSON file
    
    Args:
        file_path: Path to the JSON file
        
    Returns:
        Number of questions imported
    """
    count = 0
    try:
        with get_db_context() as db:
            # First ensure domains exist
            ensure_default_domains(db)
            
            # Read JSON file
            with open(file_path, "r", encoding="utf-8") as json_file:
                questions = json.load(json_file)
                
                for question_data in questions:
                    try:
                        # Process question
                        process_json_question(db, question_data)
                        count += 1
                    except Exception as e:
                        logger.error(f"Error processing question: {str(e)}")
                        continue
            
            logger.info(f"Imported {count} questions from {file_path}")
            return count
    except Exception as e:
        logger.error(f"Error importing questions from JSON: {str(e)}")
        return 0

def process_json_question(db: Session, data: Dict[str, Any]):
    """Process a question from JSON data and add to database
    
    Args:
        db: Database session
        data: Question data as dictionary
    """
    # Get domain
    domain_name = data.get("domain", "General Knowledge")
    domain = db.query(Domain).filter(func.lower(Domain.name) == func.lower(domain_name)).first()
    
    if not domain:
        # Create domain if it doesn't exist
        domain = Domain(
            name=domain_name,
            description=f"Questions related to {domain_name}",
            active=True
        )
        db.add(domain)
        db.flush()
    
    # Get question type
    q_type_name = data.get("q_type", "multiple_choice").upper()
    q_type = db.query(QuestionType).filter(QuestionType.name == q_type_name).first()
    
    if not q_type:
        # Default to multiple choice if type not found
        q_type = db.query(QuestionType).filter(QuestionType.name == "MULTIPLE_CHOICE").first()
    
    # Check if question already exists
    existing_question = db.query(Question).filter(Question.text == data.get("question", "")).first()
    
    if existing_question:
        logger.info(f"Question already exists: {data.get('question', '')[:50]}...")
        return
    
    # Create options dictionary
    options = data.get("options", {})
    if isinstance(options, list):
        # Convert list to dict if needed
        options_dict = {}
        for i, option in enumerate(options):
            options_dict[chr(65 + i)] = option  # A, B, C, D...
        options = options_dict
    
    # Create question
    question = Question(
        text=data.get("question", ""),
        domain_id=domain.id,
        sub_domain=data.get("sub_domain", ""),
        difficulty=int(data.get("difficulty", 1)),
        type=q_type.id,
        options=json.dumps(options),
        correct_answer=data.get("correct_answer", ""),
        explanation=data.get("explanation", ""),
        science_behind_it=data.get("science_behind_it", ""),
        practical_application=data.get("practical_application", ""),
        why_behind_it=data.get("why_behind_it", ""),
        story=data.get("story", ""),
        points_value=int(data.get("points_value", 5)),
        time_limit=int(data.get("time_limit", 60)),
        hints=json.dumps(data.get("hints", [])),
        created_at=datetime.now()
    )
    
    db.add(question)
    db.flush()
    
    # Log success
    logger.info(f"Added question: {data.get('question', '')[:50]}...")

def import_all_json_questions():
    """Import all JSON question files in the data directory"""
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
    
    if not os.path.exists(data_dir):
        logger.warning(f"Data directory not found: {data_dir}")
        return 0
    
    total_count = 0
    
    # Find all JSON files in data directory
    for filename in os.listdir(data_dir):
        if filename.endswith(".json"):
            file_path = os.path.join(data_dir, filename)
            count = import_questions_from_json(file_path)
            total_count += count
    
    return total_count