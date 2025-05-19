"""
Data import module for the assessment system

This script helps import questions from CSV files into the database.
It can be run directly or imported and used in other scripts.
"""

import os
import csv
import json
import logging
import argparse
from typing import List, Dict, Any, Tuple
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("import_data")

def create_database_tables():
    """Create all database tables"""
    from .database import engine, Base
    from .models import Question, UserPerformance, UserDomainProgress, AssessmentSession
    
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
    try:
        # Check if file exists
        if not os.path.exists(csv_file_path):
            logger.error(f"File not found: {csv_file_path}")
            return []
        
        with open(csv_file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            questions = []
            
            for idx, row in enumerate(reader, start=1):
                try:
                    # Transform row
                    transformed = transform_row(row)
                    
                    if transformed:
                        questions.append(transformed)
                    else:
                        logger.warning(f"Row {idx} was skipped (invalid format)")
                except Exception as e:
                    logger.error(f"Error processing row {idx}: {str(e)}")
            
            logger.info(f"Processed {len(questions)} valid questions from {csv_file_path}")
            return questions
    
    except Exception as e:
        logger.error(f"Error reading CSV file: {str(e)}")
        return []

def transform_row(row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transform a CSV row into a format suitable for the Question model
    
    Args:
        row: Dictionary representing a CSV row
        
    Returns:
        Transformed row dictionary
    """
    # Required fields
    required_fields = ['question', 'correct_answer']
    for field in required_fields:
        if field not in row or not row[field]:
            logger.warning(f"Missing required field: {field}")
            return None
    
    # Create options dictionary
    options = {}
    options_fields = ['option_a', 'option_b', 'option_c', 'option_d']
    
    for field in options_fields:
        if field in row and row[field]:
            key = field[-1].upper()  # Extract A, B, C, D
            options[key] = row[field]
    
    # If no options provided but it's multiple choice, create them from the answer
    if not options and row.get('question_type', '').lower() == 'multiple_choice':
        correct = row['correct_answer']
        options = {
            'A': correct,
            'B': f"Not {correct}" if len(correct) < 20 else "Incorrect option B",
            'C': "Alternative incorrect option C",
            'D': "Alternative incorrect option D"
        }
    
    # Determine question type
    q_type = row.get('question_type', 'multiple_choice').lower()
    if q_type not in ['multiple_choice', 'true_false', 'short_answer', 'fill_in_blank']:
        q_type = 'multiple_choice'  # Default
    
    # Determine difficulty
    try:
        difficulty = int(row.get('difficulty', 1))
        # Ensure difficulty is between 1-5
        difficulty = max(1, min(5, difficulty))
    except (ValueError, TypeError):
        difficulty = 1  # Default difficulty
    
    # Determine domain/category
    domain = row.get('domain', row.get('category', 'General')).strip()
    if not domain:
        domain = 'General'
    
    # Format tags as a list
    tags = []
    if 'tags' in row and row['tags']:
        if isinstance(row['tags'], str):
            tags = [tag.strip() for tag in row['tags'].split(',')]
        elif isinstance(row['tags'], list):
            tags = row['tags']
    
    # Create enhanced content if available
    enhanced_content = {}
    enhanced_fields = ['image_url', 'video_url', 'audio_url', 'explanation']
    
    for field in enhanced_fields:
        if field in row and row[field]:
            enhanced_content[field] = row[field]
    
    if 'resource_links' in row and row['resource_links']:
        if isinstance(row['resource_links'], str):
            try:
                enhanced_content['resource_links'] = json.loads(row['resource_links'])
            except json.JSONDecodeError:
                # Try to parse as comma-separated list
                enhanced_content['resource_links'] = [
                    link.strip() for link in row['resource_links'].split(',')
                ]
        elif isinstance(row['resource_links'], list):
            enhanced_content['resource_links'] = row['resource_links']
    
    # Base question data
    question_data = {
        'question': row['question'],
        'correct_answer': row['correct_answer'],
        'options': options,
        'q_type': q_type,
        'difficulty': difficulty,
        'domain': domain,
        'tags': tags,
        'enhanced_content': enhanced_content if enhanced_content else None
    }
    
    # Additional metadata if available
    if 'sub_domain' in row and row['sub_domain']:
        question_data['sub_domain'] = row['sub_domain']
    
    if 'points' in row and row['points']:
        try:
            question_data['points'] = int(row['points'])
        except (ValueError, TypeError):
            pass  # Use default points
    
    if 'id' in row and row['id']:
        try:
            question_data['id'] = int(row['id'])
        except (ValueError, TypeError):
            pass  # Generate new ID
            
    if 'time_limit' in row and row['time_limit']:
        try:
            question_data['time_limit'] = int(row['time_limit'])
        except (ValueError, TypeError):
            pass  # Use default time limit
            
    return question_data

def import_questions(questions: List[Dict[str, Any]], db: Session) -> Tuple[int, List[str]]:
    """
    Import questions into the database
    
    Args:
        questions: List of question dictionaries
        db: Database session
        
    Returns:
        Tuple of (count of imported questions, list of errors)
    """
    from .models import Question
    
    count = 0
    errors = []
    
    for idx, q_data in enumerate(questions, start=1):
        try:
            # Check if question already exists by ID
            existing = None
            if 'id' in q_data:
                existing = db.query(Question).filter(Question.id == q_data['id']).first()
            
            if existing:
                # Update existing question
                for key, value in q_data.items():
                    if key != 'id':  # Don't modify ID
                        setattr(existing, key, value)
                logger.info(f"Updated question ID: {existing.id}")
            else:
                # Create new question
                question = Question(**q_data)
                db.add(question)
                logger.info(f"Added new question: {q_data['question'][:50]}...")
            
            # Commit periodically to avoid large transactions
            if idx % 50 == 0:
                db.commit()
                logger.info(f"Committed batch of 50 questions (current: {idx})")
            
            count += 1
        
        except Exception as e:
            errors.append(f"Error importing question {idx}: {str(e)}")
            logger.error(f"Error importing question {idx}: {str(e)}")
    
    # Final commit
    db.commit()
    logger.info(f"Import completed. Imported {count} questions with {len(errors)} errors")
    
    return count, errors

def main():
    """Main entry point for the script"""
    parser = argparse.ArgumentParser(description="Import questions from CSV files")
    parser.add_argument("csv_file", help="Path to the CSV file containing questions")
    parser.add_argument("--database-url", help="Optional database URL override")
    
    args = parser.parse_args()
    
    # Set database URL if provided
    if args.database_url:
        os.environ["DATABASE_URL"] = args.database_url
    
    # Create database tables
    create_database_tables()
    
    # Create a database session
    from .database import get_db
    db = next(get_db())
    
    try:
        # Process the CSV file
        questions = process_csv(args.csv_file)
        
        if questions:
            # Import questions
            count, errors = import_questions(questions, db)
            
            print(f"Successfully imported {count} questions")
            if errors:
                print(f"Encountered {len(errors)} errors during import")
        else:
            print("No valid questions found in the CSV file")
    
    finally:
        db.close()

if __name__ == "__main__":
    main()