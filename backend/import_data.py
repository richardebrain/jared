"""
Data import module for the MentorMe assessment system
This module provides functions to import questions from CSV files
"""

import csv
import json
import logging
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from backend.models import Question, Domain, Tag
from backend.database import get_db_context

# Configure logging
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
        return [tag.strip() for tag in row['tags'].split(',')]
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
    if 'resources' in row and row['resources']:
        for resource in row['resources'].split('|'):
            if resource and '|' in resource:
                parts = resource.split('|')
                if len(parts) >= 2:
                    resources.append({
                        'title': parts[0].strip(),
                        'url': parts[1].strip()
                    })
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
    
    # Add any enhanced content fields here
    if 'video_url' in row and row['video_url']:
        enhanced_content['video_url'] = row['video_url']
    
    if 'image_url' in row and row['image_url']:
        enhanced_content['image_url'] = row['image_url']
    
    return enhanced_content

def create_question_from_csv_row(row: Dict[str, Any]) -> Question:
    """
    Create a question from a CSV row
    
    Args:
        row: CSV row dictionary
        
    Returns:
        Question object
    """
    # Parse options, tags, and resources
    options = parse_options_from_csv(row)
    tags = parse_tags_from_csv(row)
    resources = parse_resources_from_csv(row)
    enhanced_content = parse_enhanced_content_from_csv(row)
    
    # Convert to Question object
    question = Question(
        question_text=row['question'],
        correct_answer=row.get('correct_answer', ''),
        q_type=row.get('q_type', 'multiple_choice'),
        difficulty=int(row.get('difficulty', 1)),
        sub_domain=row.get('sub_domain', ''),
        options=json.dumps(options) if options else None,
        explanation=row.get('explanation', ''),
        hints=row.get('hints', ''),
        resources=json.dumps(resources) if resources else None,
        time_limit=int(row.get('time_limit', 60)) if row.get('time_limit') else None,
        points=int(row.get('points', 10)) if row.get('points') else None,
        enhanced_content=json.dumps(enhanced_content) if enhanced_content else None
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
        domain = Domain(name=domain_name)
        db.add(domain)
        db.commit()
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
    should_close_db = False
    if db is None:
        db = next(get_db_context())
        should_close_db = True
    
    import_count = 0
    error_count = 0
    duplicate_count = 0
    
    try:
        with open(file_path, 'r', encoding='utf-8') as csv_file:
            csv_reader = csv.DictReader(csv_file)
            
            for row in csv_reader:
                try:
                    # Skip empty rows
                    if not row.get('question'):
                        continue
                    
                    # Create question and get tags
                    question, tags = create_question_from_csv_row(row)
                    
                    # Get or create domain
                    domain_name = row.get('domain', 'General')
                    domain = get_or_create_domain(db, domain_name)
                    question.domain_id = domain.id
                    
                    # Add the question
                    db.add(question)
                    try:
                        db.flush()
                    except IntegrityError:
                        db.rollback()
                        duplicate_count += 1
                        logger.warning(f"Duplicate question: {row.get('question')[:50]}...")
                        continue
                    
                    # Add tags
                    for tag_name in tags:
                        tag = get_or_create_tag(db, tag_name)
                        question.tags.append(tag)
                    
                    db.commit()
                    import_count += 1
                    
                except Exception as e:
                    db.rollback()
                    error_count += 1
                    logger.error(f"Error importing question: {e}")
        
        logger.info(f"Import complete. Imported {import_count} questions, skipped {duplicate_count} duplicates, encountered {error_count} errors.")
        return import_count
    
    except Exception as e:
        logger.error(f"Error opening or reading CSV file: {e}")
        return 0
    
    finally:
        if should_close_db:
            db.close()