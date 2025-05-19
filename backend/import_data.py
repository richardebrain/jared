"""
Data import script for MentorMe Assessment API
This script imports assessment questions from CSV files
"""

import os
import csv
import json
import argparse
import logging
from typing import List, Dict, Any

from sqlalchemy.orm import Session

from backend.database import get_db_context
from backend.models import Question

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("import_data")

def read_csv_file(file_path: str) -> List[Dict[str, Any]]:
    """
    Read data from a CSV file
    
    Args:
        file_path: Path to the CSV file
        
    Returns:
        List of dictionaries, one per row
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"CSV file not found: {file_path}")
    
    data = []
    
    with open(file_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            data.append(row)
    
    logger.info(f"Read {len(data)} rows from {file_path}")
    return data

def import_questions(data: List[Dict[str, Any]], db: Session, overwrite: bool = False) -> int:
    """
    Import questions from parsed CSV data
    
    Args:
        data: List of question dictionaries
        db: Database session
        overwrite: Whether to overwrite existing questions
        
    Returns:
        Number of questions imported
    """
    imported_count = 0
    skipped_count = 0
    
    for row in data:
        # Extract basic fields
        question_text = row.get('Question', '').strip()
        answer = row.get('Answer', '').strip()
        domain = row.get('Domain', '').strip()
        
        # Skip rows with missing required fields
        if not (question_text and answer and domain):
            logger.warning(f"Skipping row with missing required fields: {row}")
            skipped_count += 1
            continue
        
        # Check for difficulty (default to 1 if not present or invalid)
        try:
            difficulty = int(row.get('Difficulty', 1))
            if difficulty < 1 or difficulty > 5:
                difficulty = 1
        except (ValueError, TypeError):
            difficulty = 1
        
        # Determine question type
        q_type = row.get('Type', 'multiple_choice').lower().strip()
        if q_type not in ['multiple_choice', 'true_false', 'short_answer']:
            q_type = 'multiple_choice'
        
        # Process options for multiple choice questions
        options = {}
        if q_type == 'multiple_choice':
            # Look for Option A, Option B, etc.
            for key in row:
                if key.startswith('Option ') and len(key) > 7 and key[7:].isalpha():
                    option_key = key[7:]  # Extract the letter
                    option_value = row[key].strip()
                    if option_value:  # Only add non-empty options
                        options[option_key] = option_value
            
            # Make sure we have options for multiple choice
            if not options:
                logger.warning(f"Multiple choice question has no options, defaulting to true/false: {question_text}")
                q_type = 'true_false'
                options = {'A': 'True', 'B': 'False'}
        
        # For true/false questions, set standard options
        if q_type == 'true_false':
            options = {'A': 'True', 'B': 'False'}
        
        # Extract sub-competency if available
        sub_competency = row.get('Sub_Competency', '').strip()
        
        # Extract or generate enhanced content
        enhanced_content = {}
        explanation = row.get('Explanation', '').strip()
        teaching_tip = row.get('Teaching_Tip', '').strip()
        
        if explanation or teaching_tip:
            enhanced_content['explanation'] = explanation
            enhanced_content['teaching_tip'] = teaching_tip
        
        # Check if question with same text already exists
        existing_question = db.query(Question).filter(
            Question.question == question_text
        ).first()
        
        if existing_question and not overwrite:
            logger.info(f"Question already exists, skipping: {question_text[:50]}...")
            skipped_count += 1
            continue
        elif existing_question and overwrite:
            # Update existing question
            existing_question.answer = answer
            existing_question.q_type = q_type
            existing_question.options = json.dumps(options) if options else None
            existing_question.domain = domain
            existing_question.difficulty = difficulty
            existing_question.sub_competency = sub_competency
            existing_question.enhanced_content = json.dumps(enhanced_content) if enhanced_content else None
            
            logger.info(f"Updated existing question: {question_text[:50]}...")
        else:
            # Create new question
            new_question = Question(
                question=question_text,
                answer=answer,
                q_type=q_type,
                options=json.dumps(options) if options else None,
                domain=domain,
                difficulty=difficulty,
                sub_competency=sub_competency,
                enhanced_content=json.dumps(enhanced_content) if enhanced_content else None
            )
            db.add(new_question)
            logger.info(f"Added new question: {question_text[:50]}...")
        
        imported_count += 1
    
    db.commit()
    logger.info(f"Imported {imported_count} questions, skipped {skipped_count}")
    
    return imported_count

def main():
    """Main entry point for the script"""
    parser = argparse.ArgumentParser(description='Import assessment questions from CSV files')
    parser.add_argument('csv_file', help='Path to the CSV file containing questions')
    parser.add_argument('--overwrite', action='store_true', help='Overwrite existing questions')
    
    args = parser.parse_args()
    
    logger.info(f"Starting import from {args.csv_file}")
    
    try:
        # Read CSV data
        data = read_csv_file(args.csv_file)
        
        # Import data into database
        with get_db_context() as db:
            imported_count = import_questions(data, db, args.overwrite)
        
        logger.info(f"Import completed successfully. Imported {imported_count} questions.")
    except Exception as e:
        logger.error(f"Import failed: {str(e)}")
        return 1
    
    return 0

if __name__ == "__main__":
    main()