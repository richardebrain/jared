"""
Import enhanced ECE question database into our assessment system
This script reads the CSV file containing the enhanced questions data
and populates the database tables for the assessment system
"""
import csv
import json
import os
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from .database import engine, SessionLocal
from .models import Base, Question

def setup_database():
    """Create database tables if they don't exist"""
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully")
    except Exception as e:
        print(f"Error setting up database: {str(e)}")

def clean_text(text):
    """Clean text fields from the CSV"""
    if not text:
        return None
    return text.strip()

def import_questions_from_csv(file_path="attached_assets/ece_master_database_full_with_why.csv"):
    """Import questions from CSV file into database"""
    if not os.path.exists(file_path):
        print(f"Error: CSV file not found at {file_path}")
        return
    
    # Get database session
    db = SessionLocal()
    
    try:
        # Check if we already have questions in the database
        count = db.query(func.count(Question.id)).scalar()
        if count > 0:
            print(f"Database already contains {count} questions. Skipping import.")
            return
        
        # Read CSV and insert questions
        with open(file_path, 'r', encoding='utf-8') as csv_file:
            reader = csv.DictReader(csv_file)
            
            # Track progress
            total_rows = 0
            imported_rows = 0
            errors = 0
            
            for row in reader:
                total_rows += 1
                
                try:
                    # Create question object
                    question = Question(
                        domain=clean_text(row.get('Domain')),
                        sub_competency=clean_text(row.get('Sub_Competency')),
                        difficulty=int(row.get('Difficulty', 1)),
                        q_type="mcq",  # All questions in the CSV are multiple choice
                        question_text=clean_text(row.get('Question')),
                        option_a=clean_text(row.get('Option_A')),
                        option_b=clean_text(row.get('Option_B')),
                        option_c=clean_text(row.get('Option_C')),
                        option_d=clean_text(row.get('Option_D')),
                        answer=clean_text(row.get('Correct_Answer')),
                        teaching_explanation=clean_text(row.get('Explanation')),
                        story_why=clean_text(row.get('Story_Why')),
                        implementation_how=clean_text(row.get('Implementation_How')),
                        reflection_considerations=clean_text(row.get('Reflection_Considerations')),
                        child_impact_story=clean_text(row.get('Child_Impact_Story')),
                        science_behind_it=clean_text(row.get('Science_Behind_It')),
                        practical_application_strategy=clean_text(row.get('Practical_Application')),
                        why_behind_it=clean_text(row.get('Why_Behind_It')),
                        resources=clean_text(row.get('Resources'))
                    )
                    
                    # Add to database
                    db.add(question)
                    imported_rows += 1
                    
                    # Commit every 50 rows
                    if imported_rows % 50 == 0:
                        db.commit()
                        print(f"Imported {imported_rows} questions...")
                        
                except Exception as e:
                    errors += 1
                    print(f"Error importing row {total_rows}: {str(e)}")
            
            # Final commit
            db.commit()
            
            print(f"Import completed: {imported_rows} questions imported, {errors} errors")
            
    except Exception as e:
        print(f"Error during import process: {str(e)}")
    finally:
        db.close()

def run_import():
    """Main function to run the import process"""
    print("Setting up database...")
    setup_database()
    
    print("Importing questions from CSV...")
    import_questions_from_csv()
    
    print("Import process completed.")

if __name__ == "__main__":
    run_import()