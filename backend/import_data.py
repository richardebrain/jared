"""
Import enhanced ECE question database into our assessment system
This script reads the CSV file containing the enhanced questions data
and populates the database tables for the assessment system
"""

import csv
import json
import os
from sqlalchemy.orm import Session
from .database import SessionLocal, Base, engine
from .models import Question

def setup_database():
    """Create database tables if they don't exist"""
    Base.metadata.create_all(bind=engine)

def clean_text(text):
    """Clean text fields from the CSV"""
    if not text or text == 'NULL' or text.lower() == 'null' or text.strip() == '':
        return None
    return text.strip()

def import_questions_from_csv(file_path="attached_assets/ece_master_database_full_with_why.csv"):
    """Import questions from CSV file into database"""
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
        return 0
    
    db = SessionLocal()
    count = 0
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            csv_reader = csv.DictReader(f)
            
            for row in csv_reader:
                try:
                    # Skip rows with empty essential fields
                    if not row.get('question_text') or not row.get('domain'):
                        continue
                    
                    # Create question object
                    question = Question(
                        domain=clean_text(row.get('domain', '')),
                        sub_competency=clean_text(row.get('sub_competency', '')),
                        difficulty=int(row.get('difficulty', 1)) if row.get('difficulty') else 1,
                        q_type="mcq",  # Default to multiple choice
                        
                        question_text=clean_text(row.get('question_text', '')),
                        option_a=clean_text(row.get('option_a', '')),
                        option_b=clean_text(row.get('option_b', '')),
                        option_c=clean_text(row.get('option_c', '')),
                        option_d=clean_text(row.get('option_d', '')),
                        answer=clean_text(row.get('answer', '')),
                        
                        teaching_explanation=clean_text(row.get('teaching_explanation', '')),
                        story_why=clean_text(row.get('story_why', '')),
                        implementation_how=clean_text(row.get('implementation_how', '')),
                        reflection_considerations=clean_text(row.get('reflection_considerations', '')),
                        child_impact_story=clean_text(row.get('child_impact_story', '')),
                        science_behind_it=clean_text(row.get('science_behind_it', '')),
                        practical_application_strategy=clean_text(row.get('practical_application_strategy', '')),
                        why_behind_it=clean_text(row.get('why_behind_it', ''))
                    )
                    
                    # Handle resources field (JSON array)
                    if row.get('resources'):
                        try:
                            resources = json.loads(row.get('resources', '[]'))
                            question.resources = resources
                        except json.JSONDecodeError:
                            # If not valid JSON, try to parse as comma-separated list
                            resources = [r.strip() for r in row.get('resources', '').split(',') if r.strip()]
                            question.resources = resources
                    
                    # Add to database
                    db.add(question)
                    count += 1
                    
                    # Commit in batches to reduce memory usage
                    if count % 100 == 0:
                        db.commit()
                        print(f"Imported {count} questions...")
                
                except Exception as e:
                    print(f"Error processing row: {e}")
                    print(f"Row data: {row}")
                    continue
            
            # Final commit
            db.commit()
            print(f"Successfully imported {count} questions")
            
    except Exception as e:
        print(f"Error importing questions: {e}")
        db.rollback()
    finally:
        db.close()
    
    return count

def run_import():
    """Main function to run the import process"""
    # Set up database tables
    setup_database()
    
    # Import questions
    print("Starting import of enhanced questions...")
    count = import_questions_from_csv()
    print(f"Import completed. {count} questions imported.")
    
    # Check if any domains have too few questions
    db = SessionLocal()
    try:
        domains = db.query(Question.domain).distinct().all()
        for domain_tuple in domains:
            domain = domain_tuple[0]
            question_count = db.query(Question).filter(Question.domain == domain).count()
            print(f"Domain: {domain} - {question_count} questions")
            
            # Alert if fewer than 20 questions
            if question_count < 20:
                print(f"Warning: Domain '{domain}' has only {question_count} questions")
    finally:
        db.close()

if __name__ == "__main__":
    run_import()