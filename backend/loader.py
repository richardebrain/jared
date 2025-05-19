import pandas as pd
import json
from .database import SessionLocal, engine, Base
from .models import Question

def load_questions():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    print("Loading CSV data...")
    df = pd.read_csv("../data/ece_master_database_ready.csv")
    
    # Map difficulty to numeric values
    difficulty_map = {
        '1': 1,  # beginner
        '2': 2,  # intermediate
        '3': 3,  # advanced
        '4': 4   # expert
    }
    
    # Open database session
    db = SessionLocal()
    
    # Track progress
    total_rows = len(df)
    inserted_count = 0
    error_count = 0
    
    try:
        print(f"Processing {total_rows} questions...")
        
        # Process rows
        for idx, row in df.iterrows():
            try:
                # Convert resources from string to JSON if present
                resources = None
                if 'resources' in row and row['resources'] is not None:
                    try:
                        # Convert to string first if it's not already
                        resources_str = str(row['resources'])
                        if resources_str.strip():
                            # Handle resources which should be a JSON string in the CSV
                            resources = resources_str.replace("'", '"')  # Replace single quotes with double quotes for valid JSON
                    except Exception as e:
                        print(f"Warning: Could not parse resources for row {idx}: {e}")
                
                # Map raw difficulty to numeric
                diff_value = int(row['difficulty']) if row['difficulty'] in difficulty_map else 1
                
                # Create Question object
                question = Question(
                    domain=row['domain'],
                    sub_competency=row['sub_competency'],
                    difficulty=diff_value,
                    q_type=row['q_type'],
                    question_text=row['Question'],
                    option_a=row['Option A'],
                    option_b=row['Option B'],
                    option_c=row['Option C'],
                    option_d=row['Option D'],
                    answer=row['Answer'],
                    teaching_explanation=row['Teaching Explanation'],
                    story_why=row.get('Story (Why)', None),
                    implementation_how=row.get('Implementation (How)', None),
                    reflection_considerations=row.get('Reflection / Considerations', None),
                    child_impact_story=row.get('Child Impact Story', None),
                    science_behind_it=row.get('Science Behind It', None),
                    practical_application_strategy=row.get('Practical Application Strategy', None),
                    why_behind_it=row.get('Why Behind It', None),
                    resources=resources
                )
                
                # Add to session
                db.add(question)
                inserted_count += 1
                
                # Commit in batches to avoid memory issues
                if inserted_count % 100 == 0:
                    db.commit()
                    print(f"Processed {inserted_count}/{total_rows} questions...")
                
            except Exception as e:
                error_count += 1
                print(f"Error processing row {idx}: {e}")
        
        # Final commit
        db.commit()
        print(f"Database seeding complete. Successfully inserted {inserted_count} questions. Errors: {error_count}")
    
    except Exception as e:
        print(f"Database loading failed: {e}")
    
    finally:
        db.close()

if __name__ == "__main__":
    load_questions()