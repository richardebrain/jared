"""
Import enhanced ECE question database into our assessment system
This script reads the CSV file containing the enhanced questions data
and populates the database tables for the assessment system
"""

import csv
import json
import os
from datetime import datetime
from sqlalchemy.exc import SQLAlchemyError
from typing import Dict, List, Any

from .database import engine, Base, get_db
from .models import Question

def setup_database():
    """Create database tables if they don't exist"""
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")

def clean_text(text):
    """Clean text fields from the CSV"""
    if not text or text.lower() in ('null', 'none', 'n/a', ''):
        return None
    return text.strip()

def import_questions_from_csv(file_path="attached_assets/ece_master_database_full_with_why.csv"):
    """Import questions from CSV file into database"""
    if not os.path.exists(file_path):
        print(f"Error: File not found at {file_path}")
        return False
    
    db = next(get_db())
    
    # Get existing question count
    existing_count = db.query(Question).count()
    print(f"Found {existing_count} existing questions in database")
    
    # If there are already questions, ask for confirmation
    if existing_count > 0:
        print("Warning: Database already contains questions.")
        print("Do you want to continue and possibly add duplicate questions? (y/n)")
        choice = input().lower()
        if choice != 'y':
            print("Import cancelled by user")
            return False
    
    try:
        with open(file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            # Track counts for reporting
            total_rows = 0
            imported_count = 0
            error_count = 0
            
            for row in reader:
                total_rows += 1
                
                try:
                    # Extract and clean fields
                    domain = clean_text(row.get('Domain', ''))
                    if not domain:
                        print(f"Warning: Skipping row {total_rows} - missing Domain")
                        error_count += 1
                        continue
                    
                    question_text = clean_text(row.get('Question', ''))
                    if not question_text:
                        print(f"Warning: Skipping row {total_rows} - missing Question text")
                        error_count += 1
                        continue
                    
                    # Determine sub_competency from the CSV row
                    sub_competency = clean_text(row.get('Competency Area', '') or row.get('Sub-competency', ''))
                    
                    # Get options
                    option_a = clean_text(row.get('Option A', ''))
                    option_b = clean_text(row.get('Option B', ''))
                    option_c = clean_text(row.get('Option C', ''))
                    option_d = clean_text(row.get('Option D', ''))
                    
                    # Get correct answer
                    answer = clean_text(row.get('Correct Answer', ''))
                    if not answer or answer.upper() not in ['A', 'B', 'C', 'D']:
                        print(f"Warning: Skipping row {total_rows} - invalid Answer: {answer}")
                        error_count += 1
                        continue
                    
                    # Get difficulty (default to 1 if not present or invalid)
                    try:
                        difficulty = int(row.get('Difficulty', '1'))
                        if difficulty < 1 or difficulty > 4:
                            difficulty = 1
                    except (ValueError, TypeError):
                        difficulty = 1
                    
                    # Get additional learning fields
                    teaching_explanation = clean_text(row.get('Teaching Explanation', ''))
                    story_why = clean_text(row.get('Story Why', ''))
                    implementation_how = clean_text(row.get('Implementation How', ''))
                    reflection_considerations = clean_text(row.get('Reflection Considerations', ''))
                    child_impact_story = clean_text(row.get('Child Impact Story', ''))
                    science_behind_it = clean_text(row.get('Science Behind It', ''))
                    practical_application = clean_text(row.get('Practical Application', ''))
                    why_behind_it = clean_text(row.get('Why Behind It', ''))
                    
                    # Process resources if available
                    resources = None
                    if 'Resources' in row and row['Resources']:
                        try:
                            # If resources is already JSON, use it directly
                            if row['Resources'].startswith('[') or row['Resources'].startswith('{'):
                                resources = json.loads(row['Resources'])
                            else:
                                # Otherwise, split by comma and make an array
                                resources = [r.strip() for r in row['Resources'].split(',') if r.strip()]
                        except (json.JSONDecodeError, ValueError) as e:
                            print(f"Warning: Resources field for row {total_rows} has invalid JSON: {e}")
                            resources = None
                    
                    # Create and add question
                    question = Question(
                        question_text=question_text,
                        domain=domain,
                        sub_competency=sub_competency,
                        difficulty=difficulty,
                        q_type='mcq',  # Default to multiple choice
                        option_a=option_a,
                        option_b=option_b,
                        option_c=option_c,
                        option_d=option_d,
                        answer=answer.upper(),
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
                    
                    db.add(question)
                    imported_count += 1
                    
                    # Commit in batches to avoid memory issues
                    if imported_count % 100 == 0:
                        db.commit()
                        print(f"Imported {imported_count} questions so far...")
                
                except Exception as e:
                    error_count += 1
                    print(f"Error processing row {total_rows}: {str(e)}")
            
            # Final commit
            db.commit()
            
            # Print summary
            print("\nImport Summary:")
            print(f"Total rows processed: {total_rows}")
            print(f"Questions imported successfully: {imported_count}")
            print(f"Errors/skipped rows: {error_count}")
            
            return True
                
    except Exception as e:
        print(f"Failed to import questions: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()

def run_import():
    """Main function to run the import process"""
    print("Starting question import process...")
    setup_database()
    
    if import_questions_from_csv():
        print("Question import completed successfully")
    else:
        print("Question import failed or was cancelled")

if __name__ == "__main__":
    run_import()