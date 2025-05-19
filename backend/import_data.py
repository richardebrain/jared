"""
Import enhanced ECE question database into our assessment system
This script reads the CSV file containing the enhanced questions data
and populates the database tables for the assessment system
"""

import csv
import json
import os
import re
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime

from .database import engine, Base, SessionLocal
from .models import Question

def setup_database():
    """Create database tables if they don't exist"""
    Base.metadata.create_all(bind=engine)

def clean_text(text):
    """Clean text fields from the CSV"""
    if not text or text.lower() in ['null', 'none', 'nan', '']:
        return None
    
    # Remove extra whitespace and normalize line breaks
    text = re.sub(r'\s+', ' ', text.strip())
    
    return text

def import_questions_from_csv(file_path="attached_assets/ece_master_database_full_with_why.csv"):
    """Import questions from CSV file into database"""
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return False
    
    db = SessionLocal()
    
    try:
        # Count existing questions to avoid duplicates
        existing_count = db.query(Question).count()
        if existing_count > 0:
            print(f"Database already contains {existing_count} questions.")
            user_input = input("Do you want to proceed and potentially add duplicates? (y/n): ")
            if user_input.lower() != 'y':
                print("Import cancelled by user.")
                return False
        
        # Read and import questions
        questions_added = 0
        questions_updated = 0
        questions_skipped = 0
        
        with open(file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            for row in reader:
                # Check if this is a valid question row
                if not row.get('question_text') or not row.get('answer'):
                    questions_skipped += 1
                    continue
                
                # Check if question already exists
                question_text = clean_text(row.get('question_text'))
                existing_question = db.query(Question).filter(
                    Question.question_text == question_text
                ).first()
                
                if existing_question:
                    # Update existing question
                    existing_question.domain = clean_text(row.get('domain'))
                    existing_question.sub_competency = clean_text(row.get('sub_competency'))
                    existing_question.difficulty = int(row.get('difficulty', 1)) if row.get('difficulty') else 1
                    existing_question.q_type = clean_text(row.get('q_type')) or 'mcq'
                    
                    # Options
                    existing_question.option_a = clean_text(row.get('option_a'))
                    existing_question.option_b = clean_text(row.get('option_b'))
                    existing_question.option_c = clean_text(row.get('option_c'))
                    existing_question.option_d = clean_text(row.get('option_d'))
                    existing_question.answer = clean_text(row.get('answer'))
                    
                    # Enhanced content
                    existing_question.teaching_explanation = clean_text(row.get('teaching_explanation'))
                    existing_question.story_why = clean_text(row.get('story_why'))
                    existing_question.implementation_how = clean_text(row.get('implementation_how'))
                    existing_question.reflection_considerations = clean_text(row.get('reflection_considerations'))
                    existing_question.child_impact_story = clean_text(row.get('child_impact_story'))
                    existing_question.science_behind_it = clean_text(row.get('science_behind_it'))
                    existing_question.practical_application_strategy = clean_text(row.get('practical_application_strategy'))
                    existing_question.why_behind_it = clean_text(row.get('why_behind_it'))
                    
                    # Resources (if in JSON format)
                    resources = row.get('resources')
                    if resources:
                        try:
                            existing_question.resources = json.loads(resources)
                        except json.JSONDecodeError:
                            # If not JSON, try to parse as comma-separated list
                            existing_question.resources = [r.strip() for r in resources.split(',') if r.strip()]
                    
                    existing_question.updated_at = datetime.utcnow().isoformat()
                    questions_updated += 1
                else:
                    # Create a new question
                    new_question = Question(
                        question_text=question_text,
                        domain=clean_text(row.get('domain')),
                        sub_competency=clean_text(row.get('sub_competency')),
                        difficulty=int(row.get('difficulty', 1)) if row.get('difficulty') else 1,
                        q_type=clean_text(row.get('q_type')) or 'mcq',
                        
                        # Options
                        option_a=clean_text(row.get('option_a')),
                        option_b=clean_text(row.get('option_b')),
                        option_c=clean_text(row.get('option_c')),
                        option_d=clean_text(row.get('option_d')),
                        answer=clean_text(row.get('answer')),
                        
                        # Enhanced content
                        teaching_explanation=clean_text(row.get('teaching_explanation')),
                        story_why=clean_text(row.get('story_why')),
                        implementation_how=clean_text(row.get('implementation_how')),
                        reflection_considerations=clean_text(row.get('reflection_considerations')),
                        child_impact_story=clean_text(row.get('child_impact_story')),
                        science_behind_it=clean_text(row.get('science_behind_it')),
                        practical_application_strategy=clean_text(row.get('practical_application_strategy')),
                        why_behind_it=clean_text(row.get('why_behind_it')),
                        
                        # Metadata
                        created_at=datetime.utcnow().isoformat(),
                        updated_at=datetime.utcnow().isoformat(),
                    )
                    
                    # Resources (if in JSON format)
                    resources = row.get('resources')
                    if resources:
                        try:
                            new_question.resources = json.loads(resources)
                        except json.JSONDecodeError:
                            # If not JSON, try to parse as comma-separated list
                            new_question.resources = [r.strip() for r in resources.split(',') if r.strip()]
                    
                    db.add(new_question)
                    questions_added += 1
                
                # Commit in batches to avoid memory issues
                if (questions_added + questions_updated) % 100 == 0:
                    db.commit()
                    print(f"Progress: {questions_added} added, {questions_updated} updated, {questions_skipped} skipped")
            
            # Final commit
            db.commit()
            
        print(f"Import complete: {questions_added} questions added, {questions_updated} updated, {questions_skipped} skipped")
        return True
    
    except SQLAlchemyError as e:
        db.rollback()
        print(f"Database error: {str(e)}")
        return False
    except Exception as e:
        db.rollback()
        print(f"Error importing questions: {str(e)}")
        return False
    finally:
        db.close()

def run_import():
    """Main function to run the import process"""
    print("Setting up database...")
    setup_database()
    
    # Default file path
    default_file = "attached_assets/ece_master_database_full_with_why.csv"
    
    # Check if file exists
    if os.path.exists(default_file):
        file_path = default_file
    else:
        file_path = input("Enter the path to the CSV file containing questions: ")
    
    # Import questions
    print(f"Importing questions from {file_path}...")
    success = import_questions_from_csv(file_path)
    
    if success:
        print("Questions imported successfully")
    else:
        print("Question import failed")

if __name__ == "__main__":
    run_import()