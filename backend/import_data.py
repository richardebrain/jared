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

def import_questions_from_csv(file_path="attached_assets/ece_master_database_full_with_why.csv"):
    """Import questions from CSV file into database"""
    # Check if file exists
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
        return

    # Create a database session
    db = SessionLocal()
    
    try:
        # Read CSV file
        with open(file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            count = 0
            
            # Clear existing questions
            db.query(Question).delete()
            
            # Process each row in the CSV
            for row in reader:
                # Create a new Question object
                question = Question(
                    domain=row.get('Domain', ''),
                    sub_competency=row.get('Sub_Competency', ''),
                    difficulty=int(row.get('Difficulty', 1)),
                    q_type='mcq',  # All questions are multiple choice for now
                    question_text=row.get('Question_Text', ''),
                    
                    option_a=row.get('Option_A', ''),
                    option_b=row.get('Option_B', ''),
                    option_c=row.get('Option_C', ''),
                    option_d=row.get('Option_D', ''),
                    answer=row.get('Correct_Answer', ''),
                    
                    teaching_explanation=row.get('Teaching_Explanation', ''),
                    story_why=row.get('Story_Why', ''),
                    implementation_how=row.get('Implementation_How', ''),
                    reflection_considerations=row.get('Reflection_Considerations', ''),
                    child_impact_story=row.get('Child_Impact_Story', ''),
                    science_behind_it=row.get('Science_Behind_It', ''),
                    practical_application_strategy=row.get('Practical_Application_Strategy', ''),
                    why_behind_it=row.get('Why_Behind_It', ''),
                    resources=json.loads(row.get('Resources', '[]')) if row.get('Resources') else []
                )
                
                # Add to database
                db.add(question)
                count += 1
                
                # Commit in batches for better performance
                if count % 50 == 0:
                    db.commit()
                    print(f"Processed {count} questions...")
            
            # Final commit
            db.commit()
            print(f"Successfully imported {count} questions")
            
            # Print domain counts
            domains = db.query(Question.domain, db.func.count(Question.id)) \
                        .group_by(Question.domain) \
                        .all()
            
            print("\nQuestion counts by domain:")
            for domain, count in domains:
                print(f"- {domain}: {count} questions")
    
    except Exception as e:
        print(f"Error importing questions: {str(e)}")
        db.rollback()
    
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