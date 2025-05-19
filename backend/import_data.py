"""
Import enhanced ECE question database into our assessment system
This script reads the CSV file containing the enhanced questions data
and populates the database tables for the assessment system
"""

import csv
import json
import os
import re
from datetime import datetime
from sqlalchemy.orm import Session
from .database import SessionLocal, Base, engine
from .models import Question

def setup_database():
    """Create database tables if they don't exist"""
    Base.metadata.create_all(bind=engine)

def clean_text(text):
    """Clean text fields from the CSV"""
    if not text or text.strip() == "":
        return None
        
    # Remove excess whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Replace HTML entities
    text = text.replace("&quot;", "\"").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
    
    return text

def import_questions_from_csv(file_path="attached_assets/ece_master_database_full_with_why.csv"):
    """Import questions from CSV file into database"""
    try:
        # Check if file exists
        if not os.path.exists(file_path):
            print(f"Error: File not found at {file_path}")
            return False
            
        # Create database session
        db = SessionLocal()
        
        try:
            # Read CSV file
            with open(file_path, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                
                # Track stats
                total_questions = 0
                added_questions = 0
                errors = 0
                
                # Insert each question
                for row in reader:
                    try:
                        total_questions += 1
                        
                        # Clean and prepare data
                        question_text = clean_text(row.get('Question'))
                        if not question_text:
                            print(f"Skipping row {total_questions}: Missing question text")
                            errors += 1
                            continue
                            
                        domain = clean_text(row.get('Domain'))
                        sub_competency = clean_text(row.get('Sub_Competency'))
                        difficulty = int(row.get('Difficulty', 1)) if row.get('Difficulty') else 1
                        
                        # Check for required answer options
                        option_a = clean_text(row.get('Option_A'))
                        option_b = clean_text(row.get('Option_B'))
                        option_c = clean_text(row.get('Option_C'))
                        option_d = clean_text(row.get('Option_D'))
                        
                        if not option_a or not option_b:
                            print(f"Skipping row {total_questions}: Missing required answer options")
                            errors += 1
                            continue
                            
                        # Get the correct answer
                        answer = clean_text(row.get('Answer'))
                        if not answer or answer not in ["A", "B", "C", "D"]:
                            print(f"Skipping row {total_questions}: Invalid answer '{answer}'")
                            errors += 1
                            continue
                        
                        # Check if this question already exists in the database
                        existing_question = db.query(Question).filter(
                            Question.question_text == question_text,
                            Question.domain == domain
                        ).first()
                        
                        if existing_question:
                            # Update existing question
                            existing_question.domain = domain
                            existing_question.sub_competency = sub_competency
                            existing_question.difficulty = difficulty
                            existing_question.option_a = option_a
                            existing_question.option_b = option_b
                            existing_question.option_c = option_c
                            existing_question.option_d = option_d
                            existing_question.answer = answer
                            existing_question.teaching_explanation = clean_text(row.get('Teaching_Explanation'))
                            existing_question.story_why = clean_text(row.get('Story_Why'))
                            existing_question.implementation_how = clean_text(row.get('Implementation_How'))
                            existing_question.reflection_considerations = clean_text(row.get('Reflection_Considerations'))
                            existing_question.child_impact_story = clean_text(row.get('Child_Impact_Story'))
                            existing_question.science_behind_it = clean_text(row.get('Science_Behind_It'))
                            existing_question.practical_application_strategy = clean_text(row.get('Practical_Application_Strategy'))
                            existing_question.why_behind_it = clean_text(row.get('Why_Behind_It'))
                            
                            # Parse resources if they exist
                            resources_text = clean_text(row.get('Resources'))
                            if resources_text:
                                try:
                                    existing_question.resources = json.loads(resources_text)
                                except json.JSONDecodeError:
                                    # If not valid JSON, store as a string in an array
                                    existing_question.resources = [resources_text]
                            
                            existing_question.updated_at = datetime.utcnow().isoformat()
                            db.commit()
                            print(f"Updated question {existing_question.id}")
                        else:
                            # Create new question object
                            question = Question(
                                question_text=question_text,
                                domain=domain,
                                sub_competency=sub_competency,
                                difficulty=difficulty,
                                q_type="mcq",  # Default to multiple choice
                                option_a=option_a,
                                option_b=option_b,
                                option_c=option_c,
                                option_d=option_d,
                                answer=answer,
                                teaching_explanation=clean_text(row.get('Teaching_Explanation')),
                                story_why=clean_text(row.get('Story_Why')),
                                implementation_how=clean_text(row.get('Implementation_How')),
                                reflection_considerations=clean_text(row.get('Reflection_Considerations')),
                                child_impact_story=clean_text(row.get('Child_Impact_Story')),
                                science_behind_it=clean_text(row.get('Science_Behind_It')),
                                practical_application_strategy=clean_text(row.get('Practical_Application_Strategy')),
                                why_behind_it=clean_text(row.get('Why_Behind_It')),
                                created_at=datetime.utcnow().isoformat(),
                                updated_at=datetime.utcnow().isoformat()
                            )
                            
                            # Parse resources if they exist
                            resources_text = clean_text(row.get('Resources'))
                            if resources_text:
                                try:
                                    question.resources = json.loads(resources_text)
                                except json.JSONDecodeError:
                                    # If not valid JSON, store as a string in an array
                                    question.resources = [resources_text]
                            
                            # Add to database
                            db.add(question)
                            db.commit()
                            db.refresh(question)
                            added_questions += 1
                            
                            if added_questions % 50 == 0:
                                print(f"Added {added_questions} questions so far...")
                        
                    except Exception as e:
                        print(f"Error processing row {total_questions}: {str(e)}")
                        errors += 1
                        db.rollback()
                
                # Print summary
                print(f"\nImport Summary:")
                print(f"Total questions processed: {total_questions}")
                print(f"Questions added to database: {added_questions}")
                print(f"Errors encountered: {errors}")
                
                return True
                
        except Exception as e:
            print(f"Error importing CSV: {str(e)}")
            return False
        finally:
            db.close()
    
    except Exception as e:
        print(f"Critical error during import: {str(e)}")
        return False

def run_import():
    """Main function to run the import process"""
    print("Setting up database...")
    setup_database()
    
    print("Importing questions from CSV...")
    success = import_questions_from_csv()
    
    if success:
        print("Import completed successfully!")
    else:
        print("Import failed.")
    
    return success

if __name__ == "__main__":
    run_import()