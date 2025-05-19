"""
Import enhanced ECE question database into our assessment system
This script reads the CSV file containing the enhanced questions data
and populates the database tables for the assessment system
"""
import os
import csv
import json
import logging
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models import Base, Question
from backend.database import engine

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

def setup_database():
    """Create database tables if they don't exist"""
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")

def clean_text(text):
    """Clean text fields from the CSV"""
    if not text:
        return None
    
    # Remove any BOM characters, extra whitespace, quotes, etc.
    text = text.strip()
    if text.startswith('"') and text.endswith('"'):
        text = text[1:-1]
    
    # Replace special quotes with standard ones
    text = text.replace('"', '"').replace('"', '"').replace("'", "'").replace("'", "'")
    
    # Return None for empty strings
    return text if text else None

def import_questions_from_csv(file_path="attached_assets/ece_master_database_full_with_why.csv"):
    """Import questions from CSV file into database"""
    logger.info(f"Starting import from CSV file: {file_path}")
    
    # Check if file exists
    if not os.path.exists(file_path):
        logger.error(f"CSV file not found: {file_path}")
        return False
    
    # Create session
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        question_count = 0
        with open(file_path, 'r', encoding='utf-8') as csvfile:
            # Create a CSV reader
            reader = csv.DictReader(csvfile)
            
            # Process each row in the CSV
            for row in reader:
                # Extract and clean data
                try:
                    # Basic question information
                    domain = clean_text(row.get('Domain', ''))
                    sub_competency = clean_text(row.get('Sub_Competency', ''))
                    difficulty_str = clean_text(row.get('Difficulty', '1'))
                    
                    # Convert difficulty to integer
                    try:
                        difficulty = int(difficulty_str) if difficulty_str else 1
                        # Ensure difficulty is between 1 and 4
                        difficulty = max(1, min(4, difficulty))
                    except (ValueError, TypeError):
                        difficulty = 1
                    
                    # Question content
                    question_text = clean_text(row.get('Question', ''))
                    option_a = clean_text(row.get('OptionA', ''))
                    option_b = clean_text(row.get('OptionB', ''))
                    option_c = clean_text(row.get('OptionC', ''))
                    option_d = clean_text(row.get('OptionD', ''))
                    answer = clean_text(row.get('Answer', ''))
                    
                    # Make sure answer is a valid option (A, B, C, or D)
                    if answer not in ['A', 'B', 'C', 'D']:
                        if answer:
                            logger.warning(f"Invalid answer '{answer}' for question: {question_text}. Defaulting to 'A'.")
                        answer = 'A'
                    
                    # Extended content
                    teaching_explanation = clean_text(row.get('Explanation', ''))
                    story_why = clean_text(row.get('Story_Why', ''))
                    implementation_how = clean_text(row.get('Implementation_How', ''))
                    reflection_considerations = clean_text(row.get('Reflection_Considerations', ''))
                    child_impact_story = clean_text(row.get('Child_Impact_Story', ''))
                    science_behind_it = clean_text(row.get('Science_Behind_It', ''))
                    practical_application = clean_text(row.get('Practical_Application_Strategy', ''))
                    why_behind_it = clean_text(row.get('Why_Behind_It', ''))
                    
                    # Resources (if any)
                    resources_str = clean_text(row.get('Resources', ''))
                    resources = None
                    if resources_str:
                        try:
                            # Try to parse as JSON if it's formatted that way
                            resources = json.loads(resources_str)
                        except json.JSONDecodeError:
                            # Otherwise, convert to a list of strings
                            resources = [r.strip() for r in resources_str.split(',') if r.strip()]
                    
                    # Skip questions without valid data
                    if not question_text or not option_a or not option_b:
                        logger.warning(f"Skipping question with incomplete data: {question_text}")
                        continue
                    
                    # Create question object
                    question = Question(
                        domain=domain,
                        sub_competency=sub_competency,
                        difficulty=difficulty,
                        q_type="mcq",  # Default to multiple choice
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
                    
                    # Add to session
                    session.add(question)
                    question_count += 1
                    
                    # Commit in batches to avoid memory issues
                    if question_count % 100 == 0:
                        session.commit()
                        logger.info(f"Processed {question_count} questions...")
                
                except Exception as e:
                    logger.error(f"Error processing question: {e}")
                    continue
            
            # Final commit
            session.commit()
            logger.info(f"Import completed successfully. Imported {question_count} questions.")
            return True
    
    except Exception as e:
        session.rollback()
        logger.error(f"Error importing data: {e}")
        return False
    
    finally:
        session.close()

def run_import():
    """Main function to run the import process"""
    # Set up database tables
    setup_database()
    
    # Import questions from CSV
    success = import_questions_from_csv()
    
    if success:
        logger.info("Data import completed successfully")
    else:
        logger.error("Data import failed")

if __name__ == "__main__":
    run_import()