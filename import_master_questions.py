import pandas as pd
import json
import os
import sys
import sqlite3
from datetime import datetime

def process_master_question_set(excel_path='./attached_assets/master question set.xlsx', output_path='./data/master_questions.json'):
    """
    Process the master question set Excel file and convert to a format suitable for our assessment system
    """
    try:
        # Read the Excel file
        print(f"Reading Excel file: {excel_path}")
        df = pd.read_excel(excel_path)
        
        # Clean up the data
        df.fillna('', inplace=True)
        
        # Transform to assessment system format
        questions = []
        for _, row in df.iterrows():
            # Convert difficulty to numeric scale (1-3)
            difficulty = 1
            if row['Difficulty_Estimate'] == 'Medium':
                difficulty = 2
            elif row['Difficulty_Estimate'] == 'Hard':
                difficulty = 3
            
            # Create question object
            question = {
                'question': row['Question_Text'],
                'domain': row['Topic'],
                'sub_domain': '',  # Can be populated later if needed
                'difficulty': difficulty,
                'q_type': 'multiple_choice',
                'options': {
                    'A': row['Option_A'],
                    'B': row['Option_B'],
                    'C': row['Option_C'],
                    'D': row['Option_D']
                },
                'correct_answer': row['Correct_Answer_Letter'],
                'explanation': row['Teaching_Explanation'],
                'science_behind_it': row['Science_Behind_It'],
                'practical_application': row['Practical_Application_Strategy'],
                'why_behind_it': row['Why_Behind_It'],
                'story': row['Story_Why'],
                'points_value': difficulty * 5,  # Points based on difficulty
                'time_limit': 60,  # Default 60 seconds per question
                'created_at': datetime.now().isoformat()
            }
            questions.append(question)
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Save as JSON
        with open(output_path, 'w') as f:
            json.dump(questions, f, indent=2)
        
        print(f"Successfully processed {len(questions)} questions. Output saved to: {output_path}")
        return questions
    except Exception as e:
        print(f"Error processing Excel file: {str(e)}")
        return []

def process_ece_question_bank(csv_path='./attached_assets/ECE_Question_Bank__200_MCQs_.csv', output_path='./data/ece_question_bank.json'):
    """
    Process the ECE Question Bank CSV file
    """
    try:
        # Read the CSV file
        print(f"Reading CSV file: {csv_path}")
        df = pd.read_csv(csv_path)
        
        # Transform to assessment system format
        questions = []
        for _, row in df.iterrows():
            # Extract the correct answer option (A, B, C, or D)
            correct_letter = row['Correct Answer']
            
            # Create question object
            question = {
                'question': row['Question'],
                'domain': row['Category'],
                'sub_domain': '',  # Can be populated later if needed
                'difficulty': int(row['Difficulty']),
                'q_type': 'multiple_choice',
                'options': {
                    'A': row['Option A'],
                    'B': row['Option B'],
                    'C': row['Option C'],
                    'D': row['Option D']
                },
                'correct_answer': correct_letter,
                'explanation': f"This aligns with {row['Standard Reference']}",
                'points_value': int(row['Difficulty']) * 5,  # Points based on difficulty
                'time_limit': 60,  # Default 60 seconds per question
                'created_at': datetime.now().isoformat()
            }
            questions.append(question)
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Save as JSON
        with open(output_path, 'w') as f:
            json.dump(questions, f, indent=2)
        
        print(f"Successfully processed {len(questions)} questions. Output saved to: {output_path}")
        return questions
    except Exception as e:
        print(f"Error processing CSV file: {str(e)}")
        return []

def import_questions_to_database(questions, db_path='./backend/assessment.db'):
    """
    Import questions into the SQLite database for the assessment system
    """
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if questions table exists
        cursor.execute("""
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='questions'
        """)
        
        if not cursor.fetchone():
            # Create questions table if it doesn't exist
            cursor.execute("""
            CREATE TABLE questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                question TEXT NOT NULL,
                domain TEXT NOT NULL,
                sub_domain TEXT,
                difficulty INTEGER NOT NULL,
                q_type TEXT NOT NULL,
                options TEXT NOT NULL,
                correct_answer TEXT NOT NULL,
                explanation TEXT,
                science_behind_it TEXT,
                practical_application TEXT,
                why_behind_it TEXT,
                story TEXT,
                points_value INTEGER NOT NULL,
                time_limit INTEGER,
                created_at TEXT NOT NULL
            )
            """)
            
            print("Created questions table")
        
        # Import questions
        for q in questions:
            # Convert options dict to JSON string
            options_json = json.dumps(q['options'])
            
            # Check if question already exists (by text)
            cursor.execute("SELECT id FROM questions WHERE question = ?", (q['question'],))
            existing = cursor.fetchone()
            
            if existing:
                # Update existing question
                cursor.execute("""
                UPDATE questions
                SET domain = ?, sub_domain = ?, difficulty = ?, q_type = ?,
                    options = ?, correct_answer = ?, explanation = ?,
                    science_behind_it = ?, practical_application = ?,
                    why_behind_it = ?, story = ?, points_value = ?,
                    time_limit = ?
                WHERE id = ?
                """, (
                    q.get('domain', ''),
                    q.get('sub_domain', ''),
                    q.get('difficulty', 1),
                    q.get('q_type', 'multiple_choice'),
                    options_json,
                    q.get('correct_answer', ''),
                    q.get('explanation', ''),
                    q.get('science_behind_it', ''),
                    q.get('practical_application', ''),
                    q.get('why_behind_it', ''),
                    q.get('story', ''),
                    q.get('points_value', 5),
                    q.get('time_limit', 60),
                    existing[0]
                ))
            else:
                # Insert new question
                cursor.execute("""
                INSERT INTO questions (
                    question, domain, sub_domain, difficulty, q_type,
                    options, correct_answer, explanation, science_behind_it,
                    practical_application, why_behind_it, story,
                    points_value, time_limit, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    q.get('question', ''),
                    q.get('domain', ''),
                    q.get('sub_domain', ''),
                    q.get('difficulty', 1),
                    q.get('q_type', 'multiple_choice'),
                    options_json,
                    q.get('correct_answer', ''),
                    q.get('explanation', ''),
                    q.get('science_behind_it', ''),
                    q.get('practical_application', ''),
                    q.get('why_behind_it', ''),
                    q.get('story', ''),
                    q.get('points_value', 5),
                    q.get('time_limit', 60),
                    q.get('created_at', datetime.now().isoformat())
                ))
        
        # Commit changes and close connection
        conn.commit()
        conn.close()
        
        print(f"Successfully imported questions to database: {db_path}")
        return True
    except Exception as e:
        print(f"Error importing questions to database: {str(e)}")
        return False

def main():
    # Create data directory if it doesn't exist
    os.makedirs('./data', exist_ok=True)
    
    # Process the master question set
    master_questions = process_master_question_set()
    
    # Process the ECE Question Bank
    ece_questions = process_ece_question_bank()
    
    # Combine questions
    all_questions = master_questions + ece_questions
    
    # Print combined stats
    print(f"Total processed questions: {len(all_questions)}")
    
    # Import to database (if it exists)
    if os.path.exists('./backend/assessment.db'):
        import_questions_to_database(all_questions)
    else:
        print("Assessment database not found at ./backend/assessment.db")
        print("Checking for alternate locations...")
        
        possible_db_paths = [
            './backend/data/assessment.db',
            './data/assessment.db',
            './assessment.db'
        ]
        
        for path in possible_db_paths:
            if os.path.exists(path):
                print(f"Found database at {path}")
                import_questions_to_database(all_questions, path)
                break
        else:
            print("No database found. Saving questions as JSON files only.")

if __name__ == "__main__":
    main()