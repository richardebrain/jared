"""
Import data module for the MentorMe assessment system
This module handles importing questions and other data
"""
import csv
import json
import logging
import os
from typing import List, Dict, Any, Optional, Tuple

from sqlalchemy.orm import Session

from .models import (
    Question, Domain, Tag, QuestionType, 
    School, User, Subscription
)
from .database import get_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("mentorme.import_data")


def import_questions_from_csv(
    db: Session,
    file_path: str,
    update_existing: bool = False
) -> Dict[str, Any]:
    """
    Import questions from a CSV file
    
    Returns a summary of the import operation
    """
    if not os.path.exists(file_path):
        logger.error(f"File not found: {file_path}")
        return {
            "success": False,
            "error": "File not found",
            "imported": 0,
            "updated": 0,
            "skipped": 0,
            "failed": 0
        }
    
    try:
        stats = {
            "imported": 0,
            "updated": 0,
            "skipped": 0,
            "failed": 0,
            "domains": set()
        }
        
        with open(file_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row_num, row in enumerate(reader, start=2):  # Start at 2 to account for header row
                try:
                    # Check for required fields
                    required_fields = ['question', 'domain', 'type', 'correct_answer']
                    missing_fields = [field for field in required_fields if not row.get(field)]
                    if missing_fields:
                        logger.warning(
                            f"Row {row_num} is missing required fields: {', '.join(missing_fields)}"
                        )
                        stats["failed"] += 1
                        continue
                    
                    # Check for existing question with same text
                    existing = db.query(Question).filter(
                        Question.question == row['question']
                    ).first()
                    
                    if existing and not update_existing:
                        logger.info(f"Question already exists (row {row_num}), skipping")
                        stats["skipped"] += 1
                        continue
                    
                    # Process domain
                    domain_name = row['domain'].strip()
                    stats["domains"].add(domain_name)
                    
                    # Get or create domain
                    domain = get_or_create_domain(db, domain_name)
                    
                    # Process question type
                    type_map = {
                        'multiple_choice': QuestionType.MULTIPLE_CHOICE,
                        'true_false': QuestionType.TRUE_FALSE,
                        'fill_blank': QuestionType.FILL_BLANK,
                        'short_answer': QuestionType.SHORT_ANSWER,
                        'matching': QuestionType.MATCHING
                    }
                    
                    q_type_str = row['type'].lower().strip()
                    if q_type_str not in type_map:
                        logger.warning(
                            f"Invalid question type in row {row_num}: {q_type_str}"
                        )
                        stats["failed"] += 1
                        continue
                    
                    q_type = type_map[q_type_str]
                    
                    # Process difficulty (default to 1 if invalid)
                    try:
                        difficulty = int(row.get('difficulty', 1))
                        if difficulty < 1:
                            difficulty = 1
                        elif difficulty > 5:
                            difficulty = 5
                    except (ValueError, TypeError):
                        difficulty = 1
                    
                    # Process options for multiple choice
                    options = {}
                    if q_type == QuestionType.MULTIPLE_CHOICE:
                        option_prefixes = ['option_a', 'option_b', 'option_c', 'option_d']
                        for letter, prefix in zip(['A', 'B', 'C', 'D'], option_prefixes):
                            if prefix in row and row[prefix].strip():
                                options[letter] = row[prefix].strip()
                        
                        # Check for sufficient options
                        if len(options) < 2:
                            logger.warning(
                                f"Multiple choice question in row {row_num} has fewer than 2 options"
                            )
                            stats["failed"] += 1
                            continue
                    
                    # Process hints (comma-separated)
                    hints = []
                    if 'hints' in row and row['hints']:
                        hints = [hint.strip() for hint in row['hints'].split(',')]
                    
                    # Process time limit
                    time_limit = None
                    if 'time_limit' in row and row['time_limit']:
                        try:
                            time_limit = int(row['time_limit'])
                        except (ValueError, TypeError):
                            time_limit = None
                    
                    # Process resources (JSON string)
                    resources = []
                    if 'resources' in row and row['resources']:
                        try:
                            resources = json.loads(row['resources'])
                        except json.JSONDecodeError:
                            logger.warning(
                                f"Invalid resources JSON in row {row_num}: {row['resources']}"
                            )
                            resources = []
                    
                    # Process tags
                    tag_objects = []
                    if 'tags' in row and row['tags']:
                        tag_names = [tag.strip() for tag in row['tags'].split(',')]
                        tag_objects = get_or_create_tags(db, tag_names)
                    
                    if existing and update_existing:
                        # Update existing question
                        existing.domain = domain_name
                        existing.sub_domain = row.get('sub_domain')
                        existing.difficulty = difficulty
                        existing.q_type = q_type
                        existing.correct_answer = row['correct_answer']
                        existing.explanation = row.get('explanation')
                        existing.hints = hints
                        existing.options = options
                        existing.resources = resources
                        existing.time_limit = time_limit
                        
                        # Update tags
                        existing.tags.clear()
                        for tag in tag_objects:
                            existing.tags.append(tag)
                        
                        stats["updated"] += 1
                    else:
                        # Create new question
                        question = Question(
                            question=row['question'],
                            domain=domain_name,
                            sub_domain=row.get('sub_domain'),
                            difficulty=difficulty,
                            q_type=q_type,
                            correct_answer=row['correct_answer'],
                            explanation=row.get('explanation'),
                            hints=hints,
                            options=options,
                            resources=resources,
                            time_limit=time_limit
                        )
                        
                        # Add tags
                        for tag in tag_objects:
                            question.tags.append(tag)
                        
                        db.add(question)
                        stats["imported"] += 1
                
                except Exception as e:
                    logger.error(f"Error processing row {row_num}: {e}")
                    stats["failed"] += 1
                    continue
            
            # Commit changes
            db.commit()
            
            # Convert domain set to list for return value
            stats["domains"] = list(stats["domains"])
            stats["success"] = True
            
            return stats
    
    except Exception as e:
        logger.error(f"Error importing questions: {e}")
        db.rollback()
        
        return {
            "success": False,
            "error": str(e),
            "imported": 0,
            "updated": 0,
            "skipped": 0,
            "failed": 0
        }


def get_or_create_domain(db: Session, domain_name: str) -> Domain:
    """Get or create a domain"""
    domain = db.query(Domain).filter(Domain.name == domain_name).first()
    if not domain:
        domain = Domain(name=domain_name)
        db.add(domain)
        db.flush()  # Flush to generate ID but don't commit yet
    return domain


def get_or_create_tags(db: Session, tag_names: List[str]) -> List[Tag]:
    """Get or create multiple tags"""
    result = []
    for name in tag_names:
        tag = db.query(Tag).filter(Tag.name == name).first()
        if not tag:
            tag = Tag(name=name)
            db.add(tag)
            db.flush()  # Flush to generate ID but don't commit yet
        result.append(tag)
    return result


def create_default_school(db: Session) -> School:
    """Create the default Raising Arizona school if it doesn't exist"""
    default_school = db.query(School).filter(School.is_default == True).first()
    if not default_school:
        default_school = School(
            name="Raising Arizona Preschool",
            contact_email="info@raisingarizonapreschool.com",
            address="123 Main St, Phoenix, AZ 85001",
            is_active=True,
            is_default=True
        )
        db.add(default_school)
        db.commit()
        logger.info("Created default school: Raising Arizona Preschool")
    
    return default_school


def create_owner_account(db: Session, school_id: int, username: str, email: str) -> User:
    """Create an owner account for the specified school"""
    # Check if account already exists
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        logger.info(f"Owner account {username} already exists")
        existing_user.role = "owner"  # Ensure they have owner privileges
        db.commit()
        return existing_user
    
    # Create new owner account
    owner = User(
        username=username,
        email=email,
        first_name="App",
        last_name="Owner",
        school_id=school_id,
        role="owner",
        is_active=True
    )
    db.add(owner)
    db.commit()
    logger.info(f"Created owner account: {username}")
    
    return owner


def create_unlimited_subscription(db: Session, school_id: int) -> Subscription:
    """Create an unlimited subscription for the specified school"""
    existing_sub = db.query(Subscription).filter(
        Subscription.school_id == school_id,
        Subscription.is_active == True
    ).first()
    
    if existing_sub:
        logger.info(f"School {school_id} already has an active subscription")
        return existing_sub
    
    subscription = Subscription(
        school_id=school_id,
        plan_name="Unlimited",
        is_active=True,
        max_users=9999,  # Unlimited users
        features={"all_modules": True, "priority_support": True}
    )
    db.add(subscription)
    db.commit()
    logger.info(f"Created unlimited subscription for school {school_id}")
    
    return subscription


def setup_initial_data(db: Session) -> Dict[str, Any]:
    """Set up initial data for a new installation"""
    try:
        # Create default school
        school = create_default_school(db)
        
        # Create owner account
        owner = create_owner_account(
            db=db,
            school_id=school.id,
            username="jlcookie20",
            email="admin@raisingarizonapreschool.com"
        )
        
        # Create unlimited subscription for default school
        subscription = create_unlimited_subscription(db, school.id)
        
        return {
            "success": True,
            "school": {
                "id": school.id,
                "name": school.name
            },
            "owner": {
                "id": owner.id,
                "username": owner.username
            },
            "subscription": {
                "id": subscription.id,
                "plan": subscription.plan_name
            }
        }
    
    except Exception as e:
        logger.error(f"Error setting up initial data: {e}")
        db.rollback()
        
        return {
            "success": False,
            "error": str(e)
        }