"""
Data import module for the MentorMe assessment system
This module handles importing questions and other data from CSV files
"""

import csv
import logging
import json
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import func, exc

from backend.database import get_db_context
from backend.models import (
    Question, Domain, Tag, School, Subscription, User,
    QuestionType
)

# Setup logging
logger = logging.getLogger("mentorme-assessment-api")

def import_questions_from_csv(file_path: str) -> int:
    """Import questions from a CSV file
    
    Args:
        file_path: Path to the CSV file
        
    Returns:
        Number of questions imported
    """
    count = 0
    try:
        with get_db_context() as db:
            # First ensure domains exist
            ensure_default_domains(db)
            
            # Read CSV file
            with open(file_path, "r", encoding="utf-8") as csv_file:
                reader = csv.DictReader(csv_file)
                for row in reader:
                    try:
                        # Skip if missing required fields
                        if not all(k in row and row[k] for k in ["question", "domain", "difficulty", "type", "correct_answer"]):
                            logger.warning(f"Skipping row with missing required fields: {row.get('question', 'Unknown')}")
                            continue
                        
                        # Process question
                        process_question(db, row)
                        count += 1
                    except Exception as e:
                        logger.error(f"Error processing question: {str(e)}")
                        continue
    except Exception as e:
        logger.error(f"Error importing questions: {str(e)}")
        
    return count

def ensure_default_domains(db: Session):
    """Ensure default domains exist in the database"""
    default_domains = [
        {
            "name": "Child Development",
            "description": "Topics related to how children develop across physical, cognitive, social-emotional, and language domains",
            "sub_domains": [
                "Cognitive Development", 
                "Social-Emotional Development", 
                "Physical Development", 
                "Language Development",
                "Brain Development",
                "General"
            ]
        },
        {
            "name": "Curriculum",
            "description": "Content and approaches for teaching young children",
            "sub_domains": [
                "Literacy Development",
                "Mathematics",
                "Educational Approaches",
                "Creative Arts",
                "Fine Motor Development"
            ]
        },
        {
            "name": "Assessment",
            "description": "Methods for evaluating children's learning and program quality",
            "sub_domains": [
                "Classroom Quality",
                "Authentic Assessment"
            ]
        },
        {
            "name": "Teaching Practices",
            "description": "Effective strategies and approaches for teaching young children",
            "sub_domains": [
                "Developmentally Appropriate Practice",
                "Motivation",
                "Quality Indicators",
                "Social Development"
            ]
        },
        {
            "name": "Play",
            "description": "Understanding and supporting play as a learning medium",
            "sub_domains": [
                "Play-Based Learning",
                "Types of Play",
                "Sensory Development"
            ]
        },
        {
            "name": "Social-Emotional Development",
            "description": "Supporting children's social skills and emotional well-being",
            "sub_domains": [
                "Emotional Development",
                "Social Development",
                "Moral Development"
            ]
        },
        {
            "name": "Diversity and Inclusion",
            "description": "Creating inclusive environments that respect and respond to diversity",
            "sub_domains": [
                "Culturally Responsive Practice",
                "Dual Language Learners",
                "Cultural Competence"
            ]
        },
        {
            "name": "Family Engagement",
            "description": "Working effectively with families as partners in children's education",
            "sub_domains": [
                "Partnership Approaches"
            ]
        },
        {
            "name": "Learning Environment",
            "description": "Creating effective physical and social environments for learning",
            "sub_domains": [
                "Physical Space",
                "Outdoor Space"
            ]
        },
        {
            "name": "Guidance",
            "description": "Approaches to supporting positive behavior and addressing challenges",
            "sub_domains": [
                "Challenging Behavior",
                "Positive Guidance"
            ]
        },
        {
            "name": "Professionalism",
            "description": "Professional and ethical responsibilities of early childhood educators",
            "sub_domains": [
                "Ethics"
            ]
        },
        {
            "name": "Special Education",
            "description": "Supporting children with disabilities and developmental delays",
            "sub_domains": [
                "Inclusion",
                "Legal Requirements"
            ]
        },
        {
            "name": "Program Structure",
            "description": "How early childhood programs are organized",
            "sub_domains": [
                "Classroom Composition"
            ]
        }
    ]
    
    # Create parent domains first
    for domain_data in default_domains:
        domain_name = domain_data["name"]
        domain_desc = domain_data["description"]
        
        # Check if domain exists
        domain = db.query(Domain).filter(Domain.name == domain_name).first()
        if not domain:
            domain = Domain(
                name=domain_name,
                description=domain_desc,
                is_active=True
            )
            db.add(domain)
            db.flush()
            logger.info(f"Created parent domain: {domain_name}")
        
        # Create sub-domains
        for sub_name in domain_data["sub_domains"]:
            sub_domain = db.query(Domain).filter(Domain.name == sub_name).first()
            if not sub_domain:
                sub_domain = Domain(
                    name=sub_name,
                    parent_id=domain.id,
                    is_active=True
                )
                db.add(sub_domain)
                logger.info(f"Created sub-domain: {sub_name} under {domain_name}")
    
    db.commit()

def process_question(db: Session, row: Dict[str, Any]):
    """Process a question from a CSV row and add to database
    
    Args:
        db: Database session
        row: CSV row as dictionary
    """
    # Check if question already exists (to avoid duplicates)
    question_text = row["question"].strip()
    existing = db.query(Question).filter(Question.question == question_text).first()
    if existing:
        logger.info(f"Question already exists: {question_text[:50]}...")
        return
    
    # Parse question type
    q_type_str = row["type"].lower().strip()
    if q_type_str == "multiple_choice" or q_type_str == "multiple choice":
        q_type = QuestionType.MULTIPLE_CHOICE
    elif q_type_str == "true_false" or q_type_str == "true false":
        q_type = QuestionType.TRUE_FALSE
    elif q_type_str == "fill_blank" or q_type_str == "fill blank":
        q_type = QuestionType.FILL_BLANK
    elif q_type_str == "short_answer" or q_type_str == "short answer":
        q_type = QuestionType.SHORT_ANSWER
    elif q_type_str == "matching":
        q_type = QuestionType.MATCHING
    else:
        q_type = QuestionType.MULTIPLE_CHOICE  # Default
    
    # Process options for multiple choice
    options = {}
    if q_type == QuestionType.MULTIPLE_CHOICE:
        # Look for options in format option_a, option_b, etc.
        for opt_key in ["option_a", "option_b", "option_c", "option_d", "option_e", "option_f"]:
            if opt_key in row and row[opt_key]:
                option_letter = opt_key[-1].upper()
                options[option_letter] = row[opt_key]
    
    # Process hints
    hints = []
    if "hints" in row and row["hints"]:
        hints = [row["hints"]]
    
    # Process difficulty
    try:
        difficulty = int(row["difficulty"])
        if difficulty < 1:
            difficulty = 1
        elif difficulty > 5:
            difficulty = 5
    except (ValueError, TypeError):
        difficulty = 1
    
    # Process time limit
    time_limit = None
    if "time_limit" in row and row["time_limit"]:
        try:
            time_limit = int(row["time_limit"])
        except (ValueError, TypeError):
            pass
    
    # Create question object
    new_question = Question()
    new_question.question = question_text
    new_question.domain = row["domain"].strip()
    new_question.sub_domain = row.get("sub_domain", "").strip() or None
    new_question.difficulty = difficulty
    new_question.q_type = q_type.value
    new_question.correct_answer = row["correct_answer"].strip()
    new_question.explanation = row.get("explanation", "").strip() or None
    new_question.hints = hints
    new_question.options = options
    new_question.resources = row.get("resources", [])
    new_question.time_limit = time_limit
    new_question.is_active = True
    
    db.add(new_question)
    db.flush()
    
    # Add tags if present
    if "tags" in row and row["tags"]:
        tags = [t.strip() for t in row["tags"].split(",")]
        for tag_name in tags:
            if not tag_name:
                continue
                
            # Find or create tag
            tag = db.query(Tag).filter(Tag.name == tag_name).first()
            if not tag:
                tag = Tag(name=tag_name)
                db.add(tag)
                db.flush()
            
            # Add tag to question
            new_question.tags.append(tag)
    
    logger.info(f"Added question: {question_text[:50]}...")

def ensure_raising_arizona_school(db: Session) -> School:
    """Ensure Raising Arizona school exists in the database
    
    Returns:
        School: The Raising Arizona school object
    """
    # Check if school exists
    ra_school = db.query(School).filter(School.name == "Raising Arizona Preschool").first()
    if not ra_school:
        # Create school
        ra_school = School(
            name="Raising Arizona Preschool",
            contact_email="admin@raisingarizonapreschool.com",
            logo_url="/assets/raising-arizona-logo.jpg",
            is_active=True,
            is_default=True,
            max_users=100
        )
        db.add(ra_school)
        db.flush()
        logger.info("Created Raising Arizona school")
        
        # Create unlimited subscription
        create_unlimited_subscription(db, ra_school.id)
    
    return ra_school

def create_owner_account(db: Session, school_id: int) -> User:
    """Create an owner account for a school
    
    Args:
        db: Database session
        school_id: School ID
        
    Returns:
        User: The owner user object
    """
    # Check if owner exists
    owner = db.query(User).filter(
        User.username == "jlcookie20",
        User.school_id == school_id
    ).first()
    
    if not owner:
        # Create owner
        owner = User(
            username="jlcookie20",
            email="jlcookie20@gmail.com",
            first_name="Jenny",
            last_name="Livermore",
            role="owner",
            school_id=school_id,
            is_active=True,
            total_points=5000,  # Start as Mentor Teacher
            level=6,
            streak_days=30
        )
        db.add(owner)
        db.flush()
        logger.info("Created owner account jlcookie20")
    
    return owner

def create_unlimited_subscription(db: Session, school_id: int) -> Subscription:
    """Create an unlimited subscription for a school
    
    Args:
        db: Database session
        school_id: School ID
        
    Returns:
        Subscription: The subscription object
    """
    # Check if subscription exists
    sub = db.query(Subscription).filter(Subscription.school_id == school_id).first()
    if not sub:
        # Create subscription with no end date (unlimited)
        sub = Subscription(
            school_id=school_id,
            plan_name="Unlimited",
            is_active=True,
            max_users=1000,
            features={"all_features": True},
            payment_status="active"
        )
        db.add(sub)
        db.flush()
        logger.info(f"Created unlimited subscription for school ID {school_id}")
    
    return sub

def setup_initial_data():
    """Set up initial data for the application"""
    try:
        with get_db_context() as db:
            # Ensure Raising Arizona school exists
            ra_school = ensure_raising_arizona_school(db)
            
            # Ensure owner account exists
            create_owner_account(db, ra_school.id)
            
            # Ensure domains exist
            ensure_default_domains(db)
            
        logger.info("Initial data setup complete")
        return True
    except Exception as e:
        logger.error(f"Error setting up initial data: {str(e)}")
        return False