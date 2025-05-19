"""
Import enhanced ECE question database into our assessment system
This script reads the CSV file containing the enhanced questions data
and populates the database tables for the assessment system
"""

import os
import csv
import json
import logging
from typing import Dict, List, Tuple, Optional
from datetime import datetime

import pandas as pd
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from .database import get_db_context, setup_database
from .models import Question

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("import_data")

def setup_database():
    """Create database tables if they don't exist"""
    try:
        from .database import setup_database as db_setup
        db_setup()
        logger.info("Database tables created or verified")
    except SQLAlchemyError as e:
        logger.error(f"Database setup error: {e}")
        return False, str(e)
    return True, "Database setup successful"

def clean_text(text):
    """Clean text fields from the CSV"""
    if not text or pd.isna(text):
        return None
    # Strip whitespace and normalize line breaks
    return text.strip().replace('\\n', '\n')

def import_questions_from_csv(file_path="attached_assets/ece_master_database_full_with_why.csv"):
    """Import questions from CSV file into database"""
    if not os.path.exists(file_path):
        return False, f"CSV file not found: {file_path}"
    
    try:
        # Read the CSV file using pandas for better handling of messy data
        df = pd.read_csv(file_path, encoding='utf-8')
        
        # Rename columns to match our schema and handle inconsistent naming
        column_mapping = {
            'Question': 'question_text',
            'Type': 'type',
            'Options': 'options',
            'Correct Answer': 'correct_answer',
            'Domain': 'domain',
            'Difficulty': 'difficulty',
            'Sub-Competency': 'sub_competency',
            'Why Correct': 'why_correct',
            'Practical Application': 'practical_application',
            'Classroom Examples': 'classroom_examples',
            'Citations': 'citations',
            'Resources': 'resources'
        }
        
        # Try different possible column names
        for old_name, new_name in column_mapping.items():
            possible_names = [
                old_name, 
                old_name.lower(), 
                old_name.replace(' ', '_'),
                old_name.replace(' ', '_').lower(),
                old_name.replace('-', ''),
                old_name.replace('-', '_'),
                new_name
            ]
            for name in possible_names:
                if name in df.columns:
                    df = df.rename(columns={name: new_name})
                    break
        
        # Ensure required columns exist
        required_cols = ['question_text', 'correct_answer', 'domain']
        for col in required_cols:
            if col not in df.columns:
                return False, f"Required column {col} not found in CSV"
        
        # Process the data
        with get_db_context() as db:
            questions_added = 0
            questions_updated = 0
            questions_failed = 0
            
            # Get existing question texts to avoid duplicates
            existing_questions = db.query(Question.question_text).all()
            existing_question_texts = {q.question_text for q in existing_questions}
            
            # Process each row in the dataframe
            for _, row in df.iterrows():
                try:
                    # Clean and prepare the data
                    question_text = clean_text(row.get('question_text'))
                    if not question_text:
                        questions_failed += 1
                        continue
                    
                    # Check if question already exists
                    if question_text in existing_question_texts:
                        # Update existing question
                        existing_q = db.query(Question).filter(Question.question_text == question_text).first()
                        if existing_q:
                            # Update non-null fields
                            for field in column_mapping.values():
                                if field in row and not pd.isna(row.get(field)) and field != 'question_text':
                                    value = clean_text(row.get(field))
                                    # Convert options to JSON if it's a string
                                    if field == 'options' and value and not value.startswith('{'):
                                        options_dict = {}
                                        try:
                                            # Parse option format like "A: Option text, B: Option text"
                                            parts = value.split(',')
                                            for part in parts:
                                                if ':' in part:
                                                    key, val = part.split(':', 1)
                                                    options_dict[key.strip()] = val.strip()
                                            value = json.dumps(options_dict)
                                        except Exception as e:
                                            logger.warning(f"Failed to parse options for question: {question_text}, error: {e}")
                                    
                                    # Convert resources to JSON if it's a string
                                    if field == 'resources' and value and not value.startswith('['):
                                        try:
                                            resources_list = [r.strip() for r in value.split(',')]
                                            value = json.dumps(resources_list)
                                        except Exception as e:
                                            logger.warning(f"Failed to parse resources for question: {question_text}, error: {e}")
                                    
                                    # Convert difficulty to integer if it's a string
                                    if field == 'difficulty' and value:
                                        try:
                                            value = int(value)
                                        except (ValueError, TypeError):
                                            # Default to difficulty 1 if conversion fails
                                            value = 1
                                    
                                    # Set the attribute
                                    setattr(existing_q, field, value)
                            
                            questions_updated += 1
                        else:
                            # This shouldn't happen, but log it if it does
                            logger.warning(f"Question text found in existing set but query returned None: {question_text}")
                            questions_failed += 1
                            continue
                    else:
                        # Create new question
                        question_data = {}
                        for field in column_mapping.values():
                            if field in row:
                                value = clean_text(row.get(field))
                                
                                # Handle special fields
                                if field == 'options' and value and not value.startswith('{'):
                                    options_dict = {}
                                    try:
                                        # Parse option format like "A: Option text, B: Option text"
                                        parts = value.split(',')
                                        for part in parts:
                                            if ':' in part:
                                                key, val = part.split(':', 1)
                                                options_dict[key.strip()] = val.strip()
                                        value = json.dumps(options_dict)
                                    except Exception as e:
                                        logger.warning(f"Failed to parse options for new question: {question_text}, error: {e}")
                                
                                # Convert resources to JSON if it's a string
                                if field == 'resources' and value and not value.startswith('['):
                                    try:
                                        resources_list = [r.strip() for r in value.split(',')]
                                        value = json.dumps(resources_list)
                                    except Exception as e:
                                        logger.warning(f"Failed to parse resources for new question: {question_text}, error: {e}")
                                
                                # Convert difficulty to integer if it's a string
                                if field == 'difficulty' and value:
                                    try:
                                        value = int(value)
                                    except (ValueError, TypeError):
                                        # Default to difficulty 1 if conversion fails
                                        value = 1
                                
                                question_data[field] = value
                        
                        # Ensure required fields are present
                        if not question_data.get('question_text') or not question_data.get('correct_answer') or not question_data.get('domain'):
                            logger.warning(f"Skipping row due to missing required field: {row}")
                            questions_failed += 1
                            continue
                        
                        # Default fields if not present
                        if 'type' not in question_data or not question_data['type']:
                            question_data['type'] = 'multiple_choice'
                        
                        if 'difficulty' not in question_data or not question_data['difficulty']:
                            question_data['difficulty'] = 1
                        
                        # Create and add new question
                        new_question = Question(**question_data)
                        db.add(new_question)
                        questions_added += 1
                        
                        # Add to existing questions set to prevent duplicates
                        existing_question_texts.add(question_text)
                
                except Exception as e:
                    logger.error(f"Error processing row: {e}")
                    questions_failed += 1
            
            # Commit changes
            db.commit()
            
            return True, f"Import completed: {questions_added} questions added, {questions_updated} updated, {questions_failed} failed"
    
    except Exception as e:
        logger.error(f"Import error: {e}")
        return False, f"Import failed: {str(e)}"

def run_import():
    """Main function to run the import process"""
    logger.info("Starting import process")
    
    # Set up the database first
    success, message = setup_database()
    if not success:
        return success, message
    
    # Import questions from CSV
    file_path = "attached_assets/ece_master_database_full_with_why.csv"
    if not os.path.exists(file_path):
        # Try alternate file
        file_path = "attached_assets/ece_master_database_ready.csv"
        if not os.path.exists(file_path):
            return False, "Question database CSV files not found"
    
    logger.info(f"Importing questions from {file_path}")
    success, message = import_questions_from_csv(file_path)
    
    logger.info(f"Import process complete: {message}")
    return success, message

if __name__ == "__main__":
    success, message = run_import()
    print(f"Import result: {message}")
    if not success:
        exit(1)