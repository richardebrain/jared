"""
Import enhanced ECE question database into our assessment system
This script reads the CSV file containing the enhanced questions data
and populates the database tables for the assessment system
"""

import csv
import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple

from sqlalchemy.orm import Session

from .database import get_db, engine, Base
from .models import Question

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("mentorme-import")

def setup_database():
    """Create database tables if they don't exist"""
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")

def clean_text(text):
    """Clean text fields from the CSV"""
    if text is None:
        return None
    
    # Trim whitespace
    text = text.strip()
    
    # If empty string, return None
    if text == "":
        return None
    
    # Handle special cases
    if text.lower() in ["n/a", "na", "none", "null"]:
        return None
    
    return text

def import_questions_from_csv(file_path="attached_assets/ece_master_database_full_with_why.csv"):
    """Import questions from CSV file into database"""
    # Check if the file exists
    if not Path(file_path).exists():
        logger.error(f"CSV file not found: {file_path}")
        raise FileNotFoundError(f"CSV file not found: {file_path}")
        
    # Get database session
    db_generator = get_db()
    db = next(db_generator)
    
    # Keep track of import stats
    stats = {
        "total_rows": 0,
        "imported": 0,
        "skipped": 0,
        "errors": 0,
        "domains": set()
    }
    
    try:
        # Read the CSV file
        with open(file_path, "r", newline="", encoding="utf-8") as csvfile:
            reader = csv.DictReader(csvfile)
            
            # Process each row
            for row_num, row in enumerate(reader, start=2):  # start=2 to account for header
                stats["total_rows"] += 1
                
                try:
                    # Extract and clean fields
                    domain = clean_text(row.get("Domain"))
                    sub_competency = clean_text(row.get("Sub_Competency"))
                    difficulty_str = clean_text(row.get("Difficulty"))
                    question_text = clean_text(row.get("Question"))
                    option_a = clean_text(row.get("Option_A"))
                    option_b = clean_text(row.get("Option_B"))
                    option_c = clean_text(row.get("Option_C"))
                    option_d = clean_text(row.get("Option_D"))
                    answer = clean_text(row.get("Answer"))
                    teaching_explanation = clean_text(row.get("Teaching_Explanation"))
                    
                    # Enhanced content fields
                    story_why = clean_text(row.get("Story_Why"))
                    implementation_how = clean_text(row.get("Implementation_How"))
                    reflection_considerations = clean_text(row.get("Reflection_Considerations"))
                    child_impact_story = clean_text(row.get("Child_Impact_Story"))
                    science_behind_it = clean_text(row.get("Science_Behind_It"))
                    practical_application = clean_text(row.get("Practical_Application_Strategy"))
                    why_behind_it = clean_text(row.get("Why_Behind_It"))
                    
                    # Resources (parse as JSON or empty list)
                    resources_str = clean_text(row.get("Resources"))
                    resources = json.loads(resources_str) if resources_str else []
                    
                    # Skip rows with missing required fields
                    if None in [domain, question_text, option_a, option_b, option_c, option_d, answer]:
                        logger.warning(f"Skipping row {row_num}: Missing required fields")
                        stats["skipped"] += 1
                        continue
                    
                    # Validate and convert difficulty to int
                    try:
                        difficulty = int(difficulty_str) if difficulty_str else 1
                        if difficulty < 1:
                            difficulty = 1
                        elif difficulty > 4:
                            difficulty = 4
                    except (ValueError, TypeError):
                        difficulty = 1
                        logger.warning(f"Row {row_num}: Invalid difficulty '{difficulty_str}', defaulting to 1")
                    
                    # Validate and clean the answer value
                    if answer and answer.upper() in ["A", "B", "C", "D"]:
                        answer = answer.upper()
                    else:
                        logger.warning(f"Row {row_num}: Invalid answer '{answer}', defaulting to 'A'")
                        answer = "A"
                    
                    # Add to domains set for statistics
                    if domain:
                        stats["domains"].add(domain)
                    
                    # Check if this question already exists in the database
                    existing_question = db.query(Question).filter(
                        Question.question_text == question_text,
                        Question.domain == domain
                    ).first()
                    
                    if existing_question:
                        # Update existing question
                        existing_question.sub_competency = sub_competency
                        existing_question.difficulty = difficulty
                        existing_question.option_a = option_a
                        existing_question.option_b = option_b
                        existing_question.option_c = option_c 
                        existing_question.option_d = option_d
                        existing_question.answer = answer
                        existing_question.teaching_explanation = teaching_explanation
                        existing_question.story_why = story_why
                        existing_question.implementation_how = implementation_how
                        existing_question.reflection_considerations = reflection_considerations
                        existing_question.child_impact_story = child_impact_story
                        existing_question.science_behind_it = science_behind_it
                        existing_question.practical_application_strategy = practical_application
                        existing_question.why_behind_it = why_behind_it
                        existing_question.resources = resources
                        
                        logger.info(f"Updated existing question (row {row_num}): {domain} - {question_text[:30]}...")
                    else:
                        # Create new question
                        new_question = Question(
                            domain=domain,
                            sub_competency=sub_competency,
                            difficulty=difficulty,
                            q_type="mcq",  # Currently all questions are multiple choice
                            question_text=question_text,
                            option_a=option_a,
                            option_b=option_b,
                            option_c=option_c,
                            option_d=option_d,
                            answer=answer,
                            teaching_explanation=teaching_explanation,
                            story_why=story_why,
                            implementation_how=implementation_how,
                            reflection_considerations=reflection_considerations,
                            child_impact_story=child_impact_story,
                            science_behind_it=science_behind_it,
                            practical_application_strategy=practical_application,
                            why_behind_it=why_behind_it,
                            resources=resources
                        )
                        
                        db.add(new_question)
                        logger.info(f"Added new question (row {row_num}): {domain} - {question_text[:30]}...")
                    
                    # Commit changes for each question to avoid losing all on error
                    db.commit()
                    stats["imported"] += 1
                    
                except Exception as e:
                    db.rollback()
                    stats["errors"] += 1
                    logger.error(f"Error processing row {row_num}: {str(e)}")
                    
            # Log import statistics
            logger.info(f"Import completed: {stats['imported']} imported, {stats['skipped']} skipped, {stats['errors']} errors")
            logger.info(f"Domains imported: {', '.join(sorted(stats['domains']))}")
            
    except Exception as e:
        logger.error(f"Error importing data: {str(e)}")
        raise
    finally:
        db.close()
        
    return stats

def run_import():
    """Main function to run the import process"""
    logger.info("Starting ECE question database import")
    
    # Set up database tables
    setup_database()
    
    # Import questions from CSV
    try:
        stats = import_questions_from_csv()
        logger.info(f"Successfully imported {stats['imported']} questions across {len(stats['domains'])} domains")
        return True
    except Exception as e:
        logger.error(f"Failed to import questions: {str(e)}")
        return False

if __name__ == "__main__":
    run_import()