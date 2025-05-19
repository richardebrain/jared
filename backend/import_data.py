"""
Import enhanced ECE question database into our assessment system
This script reads the CSV file containing the enhanced questions data
and populates the database tables for the assessment system
"""

import pandas as pd
import os
import json
from sqlalchemy.orm import Session
from datetime import datetime

from .database import get_db, engine
from .models import Question, Base

def setup_database():
    """Create database tables if they don't exist"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)

def import_questions_from_csv(file_path="attached_assets/ece_master_database_full_with_why.csv"):
    """Import questions from CSV file into database"""
    print(f"Importing questions from {file_path}...")
    
    # Check if file exists
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"CSV file not found: {file_path}")
    
    # Read CSV file
    df = pd.read_csv(file_path)
    print(f"Found {len(df)} questions in CSV file")
    
    # Preprocess data - define mappings for domain and difficulty
    domain_map = {
        "Child Development": "child_development",
        "Classroom Management": "classroom_management",
        "Curriculum Planning": "curriculum",
        "Family Engagement": "family_engagement",
        "Health and Safety": "health_safety",
        "Professional Development": "professional_development",
        "Special Needs": "special_needs",
        "Core Values": "core_values",
        "Mindful Morning": "mindfulness"
    }
    
    difficulty_map = {
        "1": 1,  # Beginner
        "2": 2,  # Intermediate
        "3": 3,  # Advanced
        "4": 4   # Expert
    }
    
    # Get database session
    db = next(get_db())
    
    # Process rows
    questions_added = 0
    for _, row in df.iterrows():
        try:
            # Convert resources from string to JSON if present
            resources = None
            if 'resources' in row and row['resources'] is not None:
                try:
                    resources_str = str(row['resources'])
                    if resources_str.strip():
                        resources = resources_str.replace("'", '"')  # Replace single quotes with double quotes for valid JSON
                except Exception as e:
                    print(f"Warning: Could not parse resources: {e}")
            
            # Map domain and difficulty
            domain_value = row.get('domain', '')
            if isinstance(domain_value, str):
                domain = domain_map.get(domain_value, 'general')
            else:
                domain = 'general'
                
            difficulty_value = row.get('difficulty', '1')
            if difficulty_value is not None:
                difficulty = int(difficulty_map.get(str(difficulty_value), 1))
            else:
                difficulty = 1
            
            # Create question object
            question = Question(
                question_text=row.get('Question', ''),
                option_a=row.get('Option A', ''),
                option_b=row.get('Option B', ''),
                option_c=row.get('Option C', ''),
                option_d=row.get('Option D', ''),
                answer=row.get('Answer', ''),
                teaching_explanation=row.get('Teaching Explanation', ''),
                story_why=row.get('Story (Why)', ''),
                implementation_how=row.get('Implementation (How)', ''),
                reflection_considerations=row.get('Reflection / Considerations', ''),
                child_impact_story=row.get('Child Impact Story', ''),
                science_behind_it=row.get('Science Behind It', ''),
                practical_application_strategy=row.get('Practical Application Strategy', ''),
                why_behind_it=row.get('Why Behind It', ''),
                resources=resources,
                domain=domain,
                sub_competency=row.get('sub_competency', ''),
                difficulty=difficulty,
                q_type='mcq'  # Multiple choice by default
            )
            
            # Add to database
            db.add(question)
            questions_added += 1
            
            # Commit in batches to avoid memory issues
            if questions_added % 50 == 0:
                db.commit()
                print(f"Added {questions_added} questions so far")
        
        except Exception as e:
            print(f"Error processing row: {e}")
            db.rollback()
    
    # Final commit
    db.commit()
    print(f"Successfully imported {questions_added} questions into the database")

def run_import():
    """Main function to run the import process"""
    try:
        # Setup database
        setup_database()
        
        # Import questions
        import_questions_from_csv()
        
        print("Data import completed successfully")
    except Exception as e:
        print(f"Error during data import: {e}")

if __name__ == "__main__":
    run_import()