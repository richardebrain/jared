"""
Data import module for the MentorMe assessment system
This module provides functions to import questions from CSV files
"""
import csv
import logging
import json
from typing import Dict, List, Any, Tuple, Optional, Generator, TextIO

from sqlalchemy.orm import Session
from contextlib import contextmanager

from .database import get_db_context
from .models import Question, Domain, Tag, QuestionType

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("mentorme.import")


def parse_options_from_csv(row: Dict[str, Any]) -> Dict[str, str]:
    """
    Parse options from CSV row
    
    Args:
        row: CSV row dictionary
        
    Returns:
        Dictionary of options
    """
    options = {}
    
    # Look for option columns in format "option_a", "option_b", etc.
    option_prefix = "option_"
    for key, value in row.items():
        if key.startswith(option_prefix) and value.strip():
            option_letter = key[len(option_prefix):].upper()
            options[option_letter] = value.strip()
    
    return options


def parse_tags_from_csv(row: Dict[str, Any]) -> List[str]:
    """
    Parse tags from CSV row
    
    Args:
        row: CSV row dictionary
        
    Returns:
        List of tags
    """
    tags_str = row.get("tags", "")
    if not tags_str:
        return []
    
    # Split by commas and strip whitespace
    return [tag.strip() for tag in tags_str.split(",") if tag.strip()]


def parse_resources_from_csv(row: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Parse resources from CSV row
    
    Args:
        row: CSV row dictionary
        
    Returns:
        List of resource dictionaries
    """
    resources_str = row.get("resources", "")
    if not resources_str:
        return []
    
    try:
        # Try to parse as JSON
        return json.loads(resources_str)
    except json.JSONDecodeError:
        # Fallback: assume it's a comma-separated list of URLs
        return [{"url": url.strip(), "type": "reference"} 
                for url in resources_str.split(",") if url.strip()]


def parse_enhanced_content_from_csv(row: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse enhanced content from CSV row
    
    Args:
        row: CSV row dictionary
        
    Returns:
        Dictionary of enhanced content
    """
    enhanced_content = {}
    
    # Parse hints
    hints_str = row.get("hints", "")
    if hints_str:
        try:
            enhanced_content["hints"] = json.loads(hints_str)
        except json.JSONDecodeError:
            enhanced_content["hints"] = [hint.strip() for hint in hints_str.split(";") if hint.strip()]
    
    # Parse time limit
    time_limit_str = row.get("time_limit", "")
    if time_limit_str:
        try:
            enhanced_content["time_limit"] = int(time_limit_str)
        except ValueError:
            logger.warning(f"Invalid time limit: {time_limit_str}")
    
    return enhanced_content


def create_question_from_csv_row(row: Dict[str, Any]) -> Tuple[Question, List[str]]:
    """
    Create a question from a CSV row
    
    Args:
        row: CSV row dictionary
        
    Returns:
        Question object and list of tags
    """
    # Basic validation
    required_fields = ["question", "domain", "type", "correct_answer"]
    for field in required_fields:
        if not row.get(field):
            raise ValueError(f"Missing required field: {field}")
    
    # Parse question type
    q_type_str = row["type"].strip().lower().replace(" ", "_")
    try:
        q_type = QuestionType(q_type_str)
    except ValueError:
        logger.warning(f"Invalid question type: {q_type_str}, using multiple_choice as default")
        q_type = QuestionType.MULTIPLE_CHOICE
    
    # Parse difficulty
    try:
        difficulty = int(row.get("difficulty", "1"))
        if difficulty < 1 or difficulty > 5:
            logger.warning(f"Difficulty out of range (1-5): {difficulty}, clamping")
            difficulty = max(1, min(5, difficulty))
    except ValueError:
        logger.warning(f"Invalid difficulty: {row.get('difficulty')}, using 1 as default")
        difficulty = 1
    
    # Parse options
    options = parse_options_from_csv(row)
    
    # Parse tags
    tags = parse_tags_from_csv(row)
    
    # Parse resources
    resources = parse_resources_from_csv(row)
    
    # Parse enhanced content
    enhanced_content = parse_enhanced_content_from_csv(row)
    
    # Create question object
    question = Question(
        question=row["question"].strip(),
        domain=row["domain"].strip(),
        sub_domain=row.get("sub_domain", "").strip() or None,
        difficulty=difficulty,
        q_type=q_type,
        correct_answer=row["correct_answer"].strip(),
        explanation=row.get("explanation", "").strip() or None,
        options=options,
        hints=enhanced_content.get("hints", []),
        time_limit=enhanced_content.get("time_limit"),
        resources=resources
    )
    
    return question, tags


def get_or_create_domain(db: Session, domain_name: str) -> Domain:
    """
    Get or create a domain
    
    Args:
        db: Database session
        domain_name: Domain name
        
    Returns:
        Domain object
    """
    domain = db.query(Domain).filter(Domain.name == domain_name).first()
    
    if not domain:
        domain = Domain(
            name=domain_name,
            description=f"Domain for {domain_name} questions"
        )
        db.add(domain)
        db.flush()
    
    return domain


def get_or_create_tag(db: Session, tag_name: str) -> Tag:
    """
    Get or create a tag
    
    Args:
        db: Database session
        tag_name: Tag name
        
    Returns:
        Tag object
    """
    tag = db.query(Tag).filter(Tag.name == tag_name).first()
    
    if not tag:
        tag = Tag(name=tag_name)
        db.add(tag)
        db.flush()
    
    return tag


def import_questions_from_csv(
    file_path: str, 
    db: Optional[Session] = None
) -> int:
    """
    Import questions from a CSV file
    
    Args:
        file_path: Path to the CSV file
        db: SQLAlchemy session (optional)
        
    Returns:
        Number of questions imported
    """
    logger.info(f"Importing questions from {file_path}")
    
    # Context manager for database session if not provided
    @contextmanager
    def get_session() -> Generator[Session, None, None]:
        if db is not None:
            yield db
        else:
            with get_db_context() as session:
                yield session
    
    imported_count = 0
    error_count = 0
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            with get_session() as session:
                # Process each row
                for i, row in enumerate(reader, start=1):
                    try:
                        # Create question object and get tags
                        question, tag_names = create_question_from_csv_row(row)
                        
                        # Check for duplicates
                        existing = session.query(Question).filter(
                            Question.question == question.question,
                            Question.domain == question.domain
                        ).first()
                        
                        if existing:
                            logger.info(f"Skipping duplicate question at row {i}")
                            continue
                        
                        # Get or create domain and tags
                        get_or_create_domain(session, question.domain)
                        
                        for tag_name in tag_names:
                            tag = get_or_create_tag(session, tag_name)
                            question.tags.append(tag)
                        
                        # Add question to session
                        session.add(question)
                        session.flush()
                        
                        imported_count += 1
                        
                        # Log progress for every 100 questions
                        if imported_count % 100 == 0:
                            logger.info(f"Imported {imported_count} questions so far")
                            session.commit()
                        
                    except Exception as e:
                        error_count += 1
                        logger.error(f"Error importing row {i}: {e}")
                
                # Commit all changes
                session.commit()
                
    except Exception as e:
        logger.error(f"Error opening or reading CSV file: {e}")
        if db is None:
            # Only rollback if we created the session internally
            try:
                session.rollback()
            except:
                pass
    
    logger.info(f"Import complete. Successfully imported {imported_count} questions with {error_count} errors.")
    return imported_count