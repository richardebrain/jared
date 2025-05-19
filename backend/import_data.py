"""
Import enhanced ECE question database into our assessment system
This script reads the CSV file containing the enhanced questions data
and populates the database tables for the assessment system
"""
import csv
import json
import os
from sqlalchemy.orm import Session

from .database import engine, SessionLocal, Base
from .models import Question

def setup_database():
    """Create database tables if they don't exist"""
    Base.metadata.create_all(bind=engine)

def clean_text(text):
    """Clean text fields from the CSV"""
    if not text:
        return None
    
    # Remove extra whitespace
    text = text.strip()
    
    # Return None for empty strings after cleaning
    if not text or text.lower() in ('n/a', 'none', 'null', ''):
        return None
    
    return text

def import_questions_from_csv(file_path="attached_assets/ece_master_database_full_with_why.csv"):
    """Import questions from CSV file into database"""
    # Create a database session
    db = SessionLocal()
    
    # Track statistics
    stats = {
        "total": 0,
        "imported": 0,
        "skipped": 0,
        "errors": 0
    }
    
    # Import questions from CSV
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                stats["total"] += 1
                
                try:
                    # Skip rows without required fields
                    if not row.get('question') or not row.get('domain'):
                        stats["skipped"] += 1
                        continue
                    
                    # Clean and validate data
                    domain = clean_text(row.get('domain'))
                    sub_competency = clean_text(row.get('sub_competency'))
                    difficulty = int(row.get('difficulty', 1)) if row.get('difficulty') else 1
                    
                    # Ensure difficulty is between 1-4
                    difficulty = max(1, min(4, difficulty))
                    
                    # Create or update the question
                    question = Question(
                        question_text=clean_text(row.get('question')),
                        domain=domain,
                        sub_competency=sub_competency,
                        difficulty=difficulty,
                        q_type="mcq",  # Default to multiple choice
                        option_a=clean_text(row.get('option_a')),
                        option_b=clean_text(row.get('option_b')),
                        option_c=clean_text(row.get('option_c')),
                        option_d=clean_text(row.get('option_d')),
                        answer=clean_text(row.get('answer')),
                        teaching_explanation=clean_text(row.get('teaching_explanation')),
                        story_why=clean_text(row.get('story_why')),
                        implementation_how=clean_text(row.get('implementation_how')),
                        reflection_considerations=clean_text(row.get('reflection_considerations')),
                        child_impact_story=clean_text(row.get('child_impact_story')),
                        science_behind_it=clean_text(row.get('science_behind_it')),
                        practical_application_strategy=clean_text(row.get('practical_application_strategy')),
                        why_behind_it=clean_text(row.get('why_behind_it')),
                        resources=json.dumps(row.get('resources', '').split(',')) if row.get('resources') else None
                    )
                    
                    # Add the question to the database
                    db.add(question)
                    stats["imported"] += 1
                    
                except Exception as e:
                    print(f"Error importing question: {e}")
                    stats["errors"] += 1
            
            # Commit the changes
            db.commit()
            
    except Exception as e:
        print(f"Error opening or reading file: {e}")
        db.rollback()
        stats["errors"] += 1
    
    finally:
        db.close()
    
    return stats

def run_import():
    """Main function to run the import process"""
    print("Setting up database...")
    setup_database()
    
    print("Starting import process...")
    stats = import_questions_from_csv()
    
    print(f"Import complete!")
    print(f"Total questions processed: {stats['total']}")
    print(f"Questions imported: {stats['imported']}")
    print(f"Questions skipped: {stats['skipped']}")
    print(f"Errors encountered: {stats['errors']}")

# Entry point for direct execution
if __name__ == "__main__":
    run_import()