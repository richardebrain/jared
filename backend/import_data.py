"""
Import enhanced ECE question database into our assessment system
This script reads the CSV file containing the enhanced questions data
and populates the database tables for the assessment system
"""

import csv
import json
import logging
import re
import sys
from typing import Dict, List, Any

from sqlalchemy.orm import Session

from .database import setup_database, get_db_context
from .models import Question

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("import_data")

def clean_text(text):
    """Clean text fields from the CSV"""
    if not text:
        return ""
    
    # Remove extra whitespace
    cleaned = re.sub(r'\s+', ' ', text).strip()
    
    # Remove special characters that might cause issues
    cleaned = cleaned.replace('\r', '').replace('\n', ' ')
    
    return cleaned

def map_domain(domain: str) -> str:
    """Map domain names to standardized format"""
    domain_map = {
        "classroom management": "Classroom Management",
        "child development": "Child Development",
        "curriculum": "Curriculum Planning",
        "curriculum planning": "Curriculum Planning",
        "family engagement": "Family Engagement",
        "health and safety": "Health & Safety",
        "health & safety": "Health & Safety",
        "observation": "Observation & Assessment",
        "observation and assessment": "Observation & Assessment",
        "observation & assessment": "Observation & Assessment",
        "professionalism": "Professionalism",
    }
    
    # Convert to lowercase for matching
    domain_lower = domain.lower()
    
    # Check for direct matches
    if domain_lower in domain_map:
        return domain_map[domain_lower]
    
    # Check for partial matches
    for key, value in domain_map.items():
        if key in domain_lower or domain_lower in key:
            return value
    
    # Return original if no match found
    return domain

def map_difficulty(difficulty_str: str) -> int:
    """Map difficulty strings to numeric values 1-5"""
    try:
        if difficulty_str.isdigit():
            # If already a number, convert and ensure in range 1-5
            return max(1, min(5, int(difficulty_str)))
        
        # Map text descriptions to numeric values
        difficulty_map = {
            "easy": 1,
            "beginner": 1,
            "basic": 1,
            "introductory": 1,
            "intermediate": 2,
            "medium": 3,
            "moderate": 3,
            "advanced": 4,
            "difficult": 5,
            "expert": 5,
            "hard": 5
        }
        
        difficulty_lower = difficulty_str.lower()
        
        for key, value in difficulty_map.items():
            if key in difficulty_lower:
                return value
        
        # Default to middle difficulty if can't determine
        return 3
    except (ValueError, AttributeError):
        return 3

def format_options(options_str: str) -> Dict[str, str]:
    """Format options string to a dictionary"""
    if not options_str:
        return {}
    
    options = {}
    
    # Check if it looks like a JSON string
    if options_str.strip().startswith('{') and options_str.strip().endswith('}'):
        try:
            return json.loads(options_str)
        except json.JSONDecodeError:
            pass
    
    # Handle comma or semicolon separated format: "A: Option A, B: Option B"
    if ':' in options_str:
        # Split by either comma or semicolon
        separator = ',' if ',' in options_str else ';'
        pairs = options_str.split(separator)
        
        for pair in pairs:
            if ':' in pair:
                key, value = pair.split(':', 1)
                options[key.strip()] = value.strip()
    else:
        # Just create options with letter keys
        items = re.split(r'[;,]', options_str)
        for i, item in enumerate(items):
            if item.strip():
                key = chr(65 + i)  # A, B, C, etc.
                options[key] = item.strip()
    
    return options

def create_enhanced_content(row: Dict[str, str]) -> Dict[str, Any]:
    """Create enhanced content from row data"""
    enhanced_content = {}
    
    # Add explanation if available
    if "explanation" in row and row["explanation"]:
        enhanced_content["explanation"] = clean_text(row["explanation"])
    
    # Add teaching tips if available
    if "teaching_tips" in row and row["teaching_tips"]:
        enhanced_content["teaching_tips"] = clean_text(row["teaching_tips"])
    
    # Add why this matters explanation
    if "why_it_matters" in row and row["why_it_matters"]:
        enhanced_content["why_it_matters"] = clean_text(row["why_it_matters"])
    
    # Add further reading resources
    if "resources" in row and row["resources"]:
        enhanced_content["resources"] = clean_text(row["resources"])
    
    # Add related standards/competencies
    if "related_standards" in row and row["related_standards"]:
        enhanced_content["related_standards"] = clean_text(row["related_standards"])
    
    return enhanced_content

def import_questions_from_csv(file_path="attached_assets/ece_master_database_full_with_why.csv"):
    """Import questions from CSV file into database"""
    logger.info(f"Starting import from {file_path}")
    
    # Set up database and get session
    with get_db_context() as db:
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                
                # Track import stats
                total_rows = 0
                imported_count = 0
                error_count = 0
                
                for row in reader:
                    total_rows += 1
                    
                    try:
                        # Process question data
                        question_text = clean_text(row.get("question", ""))
                        if not question_text:
                            logger.warning(f"Skipping row {total_rows}: Missing question text")
                            error_count += 1
                            continue
                        
                        answer = clean_text(row.get("answer", ""))
                        if not answer:
                            logger.warning(f"Skipping row {total_rows}: Missing answer")
                            error_count += 1
                            continue
                        
                        # Extract and normalize other fields
                        domain = map_domain(row.get("domain", "Child Development"))
                        difficulty = map_difficulty(row.get("difficulty", "3"))
                        q_type = row.get("type", "multiple_choice").lower().strip()
                        
                        # Handle options
                        options_str = row.get("options", "")
                        options = format_options(options_str)
                        options_json = json.dumps(options)
                        
                        # Handle sub-competency
                        sub_competency = clean_text(row.get("sub_competency", ""))
                        
                        # Create enhanced content
                        enhanced_content = create_enhanced_content(row)
                        enhanced_content_json = json.dumps(enhanced_content)
                        
                        # Create question object
                        question = Question(
                            question=question_text,
                            answer=answer,
                            q_type=q_type,
                            options=options_json,
                            domain=domain,
                            difficulty=difficulty,
                            sub_competency=sub_competency,
                            enhanced_content=enhanced_content_json
                        )
                        
                        # Add to database
                        db.add(question)
                        imported_count += 1
                        
                        # Log progress for large imports
                        if imported_count % 100 == 0:
                            logger.info(f"Imported {imported_count} questions so far...")
                            db.commit()
                        
                    except Exception as e:
                        logger.error(f"Error importing row {total_rows}: {str(e)}")
                        error_count += 1
                
                # Commit remaining questions
                db.commit()
                
                logger.info(f"Import complete: {imported_count} questions imported successfully")
                logger.info(f"Errors: {error_count} out of {total_rows} rows")
                
                return imported_count, error_count, total_rows
                
        except Exception as e:
            logger.error(f"Failed to import CSV file: {str(e)}")
            return 0, 0, 0

def run_import():
    """Main function to run the import process"""
    logger.info("Starting question import process")
    
    # Set up database tables if they don't exist
    success, message = setup_database()
    if not success:
        logger.error(f"Database setup failed: {message}")
        return False
    
    # Import from default file path
    imported, errors, total = import_questions_from_csv()
    
    if imported > 0:
        logger.info(f"Successfully imported {imported} questions out of {total} total rows")
        return True
    else:
        logger.error(f"No questions imported. {errors} errors encountered.")
        return False

if __name__ == "__main__":
    success = run_import()
    sys.exit(0 if success else 1)