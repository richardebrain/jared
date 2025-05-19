"""
Data import module for the MentorMe assessment system
This module provides functions to import questions from CSV files
"""

import csv
import logging
import json
from typing import Dict, Any, List, Optional, Tuple

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_

from backend.models import Question, Domain, Tag
from backend.database import get_db_context

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def parse_options_from_csv(row: Dict[str, Any]) -> Dict[str, str]:
    """
    Parse options from CSV row
    
    Args:
        row: CSV row dictionary
        
    Returns:
        Dictionary of options
    """
    options = {}
    if 'option_a' in row and row['option_a']:
        options['A'] = row['option_a']
    if 'option_b' in row and row['option_b']:
        options['B'] = row['option_b']
    if 'option_c' in row and row['option_c']:
        options['C'] = row['option_c']
    if 'option_d' in row and row['option_d']:
        options['D'] = row['option_d']
    
    # Handle options in a single column format like "A:text|B:text|C:text|D:text"
    if 'options' in row and row['options'] and not options:
        try:
            options_str = row['options']
            for option_pair in options_str.split('|'):
                key, value = option_pair.split(':', 1)
                options[key.strip()] = value.strip()
        except Exception as e:
            logger.warning(f"Error parsing options column: {e}")
    
    return options

def parse_tags_from_csv(row: Dict[str, Any]) -> List[str]:
    """
    Parse tags from CSV row
    
    Args:
        row: CSV row dictionary
        
    Returns:
        List of tags
    """
    if 'tags' in row and row['tags']:
        # Handle comma-separated tags
        if isinstance(row['tags'], str):
            return [tag.strip() for tag in row['tags'].split(',') if tag.strip()]
    
    return []

def parse_resources_from_csv(row: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Parse resources from CSV row
    
    Args:
        row: CSV row dictionary
        
    Returns:
        List of resource dictionaries
    """
    resources = []
    
    # Handle resources in a single column format like "Title|URL, Title|URL"
    if 'resources' in row and row['resources']:
        try:
            resources_str = row['resources']
            # Split by either comma or pipe
            if '|' in resources_str:
                # Format: "Title|URL"
                title, url = resources_str.split('|', 1)
                resources.append({
                    "title": title.strip(),
                    "url": url.strip()
                })
            elif ',' in resources_str:
                # Multiple resources in format: "Title|URL, Title|URL"
                for resource_pair in resources_str.split(','):
                    if '|' in resource_pair:
                        title, url = resource_pair.split('|', 1)
                        resources.append({
                            "title": title.strip(),
                            "url": url.strip()
                        })
        except Exception as e:
            logger.warning(f"Error parsing resources column: {e}")
    
    return resources

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
    if 'hints' in row and row['hints']:
        if isinstance(row['hints'], str):
            if '|' in row['hints']:
                # Multiple hints separated by pipe
                enhanced_content['hints'] = [hint.strip() for hint in row['hints'].split('|')]
            else:
                # Single hint
                enhanced_content['hints'] = [row['hints'].strip()]
    
    # Parse time limit
    if 'time_limit' in row and row['time_limit']:
        try:
            enhanced_content['time_limit'] = int(row['time_limit'])
        except (ValueError, TypeError):
            pass  # Use default time limit
    
    # Parse points
    if 'points' in row and row['points']:
        try:
            enhanced_content['points'] = int(row['points'])
        except (ValueError, TypeError):
            pass  # Use default points
    
    return enhanced_content

def create_question_from_csv_row(row: Dict[str, Any]) -> Tuple[Question, List[str]]:
    """
    Create a question from a CSV row
    
    Args:
        row: CSV row dictionary
        
    Returns:
        Question object and list of tags
    """
    # Create question object
    question = Question(
        question_text=row.get('question', ''),
        q_type=row.get('q_type', 'multiple_choice'),
        correct_answer=row.get('correct_answer', ''),
        difficulty=int(row.get('difficulty', 1)),
        sub_domain=row.get('sub_domain', '')
    )
    
    # Parse options
    question.options = parse_options_from_csv(row)
    
    # Parse explanation
    if 'explanation' in row and row['explanation']:
        question.explanation = row['explanation']
    
    # Parse media URLs
    if 'video_url' in row and row['video_url']:
        question.video_url = row['video_url']
    
    if 'image_url' in row and row['image_url']:
        question.image_url = row['image_url']
    
    # Parse tags
    tags = parse_tags_from_csv(row)
    
    # Parse resources
    question.resources = parse_resources_from_csv(row)
    
    # Parse enhanced content
    enhanced_content = parse_enhanced_content_from_csv(row)
    
    # Apply enhanced content
    if 'hints' in enhanced_content:
        question.hints = enhanced_content['hints']
    
    if 'time_limit' in enhanced_content:
        question.time_limit = enhanced_content['time_limit']
    
    if 'points' in enhanced_content:
        question.points = enhanced_content['points']
    
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
    if not db:
        logger.error("No database session provided")
        return None
    
    try:
        domain = db.query(Domain).filter(Domain.name == domain_name).first()
        if not domain:
            domain = Domain(name=domain_name)
            db.add(domain)
            db.flush()
        return domain
    except Exception as e:
        db.rollback()
        logger.error(f"Error getting or creating domain {domain_name}: {e}")
        return db.query(Domain).filter(Domain.name == domain_name).first()

def get_or_create_tag(db: Session, tag_name: str) -> Tag:
    """
    Get or create a tag
    
    Args:
        db: Database session
        tag_name: Tag name
        
    Returns:
        Tag object
    """
    if not db:
        logger.error("No database session provided")
        return None
    
    try:
        tag = db.query(Tag).filter(Tag.name == tag_name).first()
        if not tag:
            tag = Tag(name=tag_name)
            db.add(tag)
            db.commit()
        return tag
    except IntegrityError as e:
        db.rollback()
        logger.warning(f"Tag {tag_name} already exists, fetching existing one: {e}")
        return db.query(Tag).filter(Tag.name == tag_name).first()
    except Exception as e:
        db.rollback()
        logger.error(f"Error getting or creating tag {tag_name}: {e}")
        return None

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
    close_db = False
    if not db:
        db = next(get_db_context())
        close_db = True
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            imported_count = 0
            skipped_count = 0
            errors_count = 0
            
            for row in reader:
                try:
                    # Skip empty rows or rows without required fields
                    if not row.get('question') or not row.get('correct_answer'):
                        logger.warning(f"Skipping row, missing required fields: {row}")
                        skipped_count += 1
                        continue
                    
                    # Check if question already exists
                    existing_question = db.query(Question).filter(
                        Question.question_text == row.get('question')
                    ).first()
                    
                    if existing_question:
                        logger.info(f"Question already exists: {row.get('question')[:30]}...")
                        skipped_count += 1
                        continue
                    
                    # Get or create domain
                    domain_name = row.get('domain', 'General')
                    domain = get_or_create_domain(db, domain_name)
                    
                    # Create question
                    question, tags = create_question_from_csv_row(row)
                    question.domain_id = domain.id
                    
                    # Add question to database
                    db.add(question)
                    db.flush()
                    
                    # Add tags
                    for tag_name in tags:
                        tag = get_or_create_tag(db, tag_name)
                        if tag:
                            question.tags.append(tag)
                    
                    db.commit()
                    imported_count += 1
                    logger.debug(f"Imported question: {row.get('question')[:30]}...")
                    
                except Exception as e:
                    db.rollback()
                    errors_count += 1
                    logger.error(f"Error importing question: {e}, Row: {row}")
            
            logger.info(f"Import complete: {imported_count} imported, {skipped_count} skipped, {errors_count} errors")
            return imported_count
    except Exception as e:
        logger.error(f"Error importing questions from {file_path}: {e}")
        return 0
    finally:
        if close_db:
            db.close()