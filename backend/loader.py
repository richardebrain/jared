"""
Question loader module for the MentorMe assessment system
This module handles question selection, answer evaluation, and user performance tracking
"""

import csv
import logging
import random
import json
import os
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, not_

from backend.models import (
    Question, Domain, User, UserAnswer, UserDomainProgress,
    Achievement, UserAchievement, QuestionType
)
from backend.database import get_db_context

# Setup logging
logger = logging.getLogger("mentorme-assessment-api")

def load_questions_from_csv(db: Session, csv_path: str) -> int:
    """
    Load questions from a CSV file
    
    Returns the number of questions loaded
    """
    count = 0
    
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                # Skip if missing required fields
                if not all(k in row and row[k] for k in ["question", "domain", "difficulty", "type", "correct_answer"]):
                    logger.warning(f"Skipping question with missing required fields: {row.get('question', 'Unknown')}")
                    continue
                
                # Check for duplicate question
                existing = db.query(Question).filter(Question.question == row["question"].strip()).first()
                if existing:
                    logger.info(f"Skipping duplicate question: {row['question'][:50]}...")
                    continue
                
                # Create question
                question = Question()
                question.question = row["question"].strip()
                question.domain = row["domain"].strip()
                question.sub_domain = row.get("sub_domain", "").strip() or None
                
                # Process difficulty (1-5)
                try:
                    difficulty = int(row["difficulty"])
                    if difficulty < 1:
                        difficulty = 1
                    elif difficulty > 5:
                        difficulty = 5
                    question.difficulty = difficulty
                except (ValueError, TypeError):
                    question.difficulty = 1
                
                # Process question type
                q_type_str = row["type"].lower().strip()
                if q_type_str == "multiple_choice" or q_type_str == "multiple choice":
                    question.q_type = QuestionType.MULTIPLE_CHOICE.value
                elif q_type_str == "true_false" or q_type_str == "true false":
                    question.q_type = QuestionType.TRUE_FALSE.value
                elif q_type_str == "fill_blank" or q_type_str == "fill blank":
                    question.q_type = QuestionType.FILL_BLANK.value
                elif q_type_str == "short_answer" or q_type_str == "short answer":
                    question.q_type = QuestionType.SHORT_ANSWER.value
                elif q_type_str == "matching":
                    question.q_type = QuestionType.MATCHING.value
                else:
                    question.q_type = QuestionType.MULTIPLE_CHOICE.value  # Default
                
                # Process correct answer
                question.correct_answer = row["correct_answer"].strip()
                
                # Process options for multiple choice
                options = {}
                if question.q_type == QuestionType.MULTIPLE_CHOICE.value:
                    # Look for options in format option_a, option_b, etc.
                    for opt_key in ["option_a", "option_b", "option_c", "option_d", "option_e", "option_f"]:
                        if opt_key in row and row[opt_key]:
                            option_letter = opt_key[-1].upper()
                            options[option_letter] = row[opt_key]
                question.options = options
                
                # Process explanation
                question.explanation = row.get("explanation", "").strip() or None
                
                # Process hints
                hints = []
                if "hints" in row and row["hints"]:
                    hints = [row["hints"]]
                question.hints = hints
                
                # Process resources
                resources = []
                if "resources" in row and row["resources"]:
                    try:
                        resources = json.loads(row["resources"])
                    except json.JSONDecodeError:
                        # Treat as comma-separated list
                        resources = [r.strip() for r in row["resources"].split(",")]
                question.resources = resources
                
                # Process time limit
                if "time_limit" in row and row["time_limit"]:
                    try:
                        question.time_limit = int(row["time_limit"])
                    except (ValueError, TypeError):
                        question.time_limit = None
                
                # Set active state
                question.is_active = True
                
                # Add to database
                db.add(question)
                db.flush()
                count += 1
                
                # Add tags if present
                if "tags" in row and row["tags"]:
                    tags = [t.strip() for t in row["tags"].split(",")]
                    for tag_name in tags:
                        if not tag_name:
                            continue
                            
                        # Add tag to question through the relationship handled by SQLAlchemy
                        from backend.import_data import get_or_create_tag
                        tag = get_or_create_tag(db, tag_name)
                        question.tags.append(tag)
            
            # Commit changes
            db.commit()
            
    except Exception as e:
        logger.error(f"Error loading questions from CSV: {str(e)}")
        db.rollback()
        raise
    
    return count

def load_questions(db: Session, csv_path: Optional[str] = None) -> int:
    """Load questions from a file or directory"""
    total_count = 0
    
    # If no path specified, look for question files in standard locations
    if not csv_path:
        # Check for questions in data directory
        data_paths = [
            "data/questions.csv",
            "data/sample_questions.csv",
            "data/qbank.csv"
        ]
        
        for path in data_paths:
            if os.path.exists(path):
                try:
                    count = load_questions_from_csv(db, path)
                    logger.info(f"Loaded {count} questions from {path}")
                    total_count += count
                except Exception as e:
                    logger.error(f"Failed to load questions from {path}: {str(e)}")
        
        # If still no questions, check if data directory contains CSV files
        if total_count == 0 and os.path.exists("data"):
            for filename in os.listdir("data"):
                if filename.endswith(".csv"):
                    path = os.path.join("data", filename)
                    try:
                        count = load_questions_from_csv(db, path)
                        logger.info(f"Loaded {count} questions from {path}")
                        total_count += count
                    except Exception as e:
                        logger.error(f"Failed to load questions from {path}: {str(e)}")
    else:
        # Load from the specified path
        if os.path.isfile(csv_path):
            total_count = load_questions_from_csv(db, csv_path)
        elif os.path.isdir(csv_path):
            for filename in os.listdir(csv_path):
                if filename.endswith(".csv"):
                    path = os.path.join(csv_path, filename)
                    try:
                        count = load_questions_from_csv(db, path)
                        logger.info(f"Loaded {count} questions from {path}")
                        total_count += count
                    except Exception as e:
                        logger.error(f"Failed to load questions from {path}: {str(e)}")
    
    return total_count

def get_or_create_domain(db: Session, domain_name: str) -> Domain:
    """Get or create a domain"""
    domain = db.query(Domain).filter(Domain.name == domain_name).first()
    if not domain:
        domain = Domain(
            name=domain_name,
            is_active=True
        )
        db.add(domain)
        db.flush()
        logger.info(f"Created domain: {domain_name}")
    
    return domain

def get_distinct_domains(db: Session) -> List[str]:
    """Get a list of all distinct domains"""
    domains = db.query(Question.domain).distinct().all()
    return [d[0] for d in domains if d[0]]

def get_domain_stats(db: Session, domain: str) -> Optional[Dict[str, Any]]:
    """Get statistics for a domain"""
    # Check if domain exists
    domain_count = db.query(Question).filter(Question.domain == domain).count()
    if domain_count == 0:
        return None
    
    # Get statistics
    stats = {
        "total_questions": domain_count,
        "difficulty_distribution": {},
        "sub_domains": []
    }
    
    # Get difficulty distribution
    for difficulty in range(1, 6):
        count = db.query(Question).filter(
            Question.domain == domain,
            Question.difficulty == difficulty
        ).count()
        
        if count > 0:
            stats["difficulty_distribution"][difficulty] = count
    
    # Get sub-domains
    sub_domains = db.query(Question.sub_domain).filter(
        Question.domain == domain,
        Question.sub_domain.isnot(None)
    ).distinct().all()
    
    stats["sub_domains"] = [s[0] for s in sub_domains if s[0]]
    
    return stats

def get_random_question(
    db: Session,
    domain: Optional[str] = None,
    difficulty: Optional[int] = None,
    exclude_ids: Optional[List[int]] = None
) -> Optional[Question]:
    """Get a random question with optional filters"""
    # Base query
    query = db.query(Question).filter(Question.is_active == True)
    
    # Apply domain filter
    if domain:
        query = query.filter(Question.domain == domain)
    
    # Apply difficulty filter
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    
    # Exclude already answered questions
    if exclude_ids and len(exclude_ids) > 0:
        query = query.filter(~Question.id.in_(exclude_ids))
    
    # Get count of matching questions
    count = query.count()
    
    if count == 0:
        return None
    
    # Select random question
    offset = random.randint(0, count - 1)
    question = query.offset(offset).first()
    
    return question

def get_next_assessment_question(
    db: Session,
    user_id: int,
    domain: str,
    prev_answers: List[Dict[str, Any]]
) -> Optional[Question]:
    """
    Get the next question for an assessment
    
    This implements adaptive difficulty selection based on user performance
    """
    # Get user progress in this domain
    progress = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == user_id,
        UserDomainProgress.domain == domain
    ).first()
    
    # Determine starting difficulty
    current_difficulty = 1
    if progress:
        current_difficulty = max(1, min(5, progress.current_level))
    
    # Analyze previous answers to adjust difficulty
    if prev_answers:
        recent_answers = prev_answers[-3:]  # Look at last 3 answers
        correct_count = sum(1 for a in recent_answers if a.get("is_correct", False))
        
        if len(recent_answers) >= 3:
            if correct_count >= 2:
                # If user is doing well, increase difficulty
                current_difficulty = min(5, current_difficulty + 1)
            elif correct_count <= 0:
                # If user is struggling, decrease difficulty
                current_difficulty = max(1, current_difficulty - 1)
    
    # Get previous question IDs to exclude
    exclude_ids = [a.get("question_id") for a in prev_answers if "question_id" in a]
    
    # Try to get question at current difficulty
    question = get_random_question(db, domain, current_difficulty, exclude_ids)
    
    if not question:
        # If no questions at current difficulty, try adjacent difficulties
        adjacent_difficulties = []
        if current_difficulty > 1:
            adjacent_difficulties.append(current_difficulty - 1)
        if current_difficulty < 5:
            adjacent_difficulties.append(current_difficulty + 1)
        
        for diff in adjacent_difficulties:
            question = get_random_question(db, domain, diff, exclude_ids)
            if question:
                break
        
        if not question:
            # If still no question, try any difficulty
            question = get_random_question(db, domain, None, exclude_ids)
            
            if not question:
                # If still no question, allow repeats
                question = get_random_question(db, domain, None, None)
    
    return question

class AnswerFeedback:
    """Feedback for an answer submission"""
    def __init__(
        self,
        is_correct: bool,
        points_earned: int,
        domain: str,
        difficulty: int,
        correct_answer: str,
        explanation: Optional[str] = None,
        next_difficulty: int = 1,
        resources: Optional[List[Dict[str, str]]] = None,
        next_question: Optional[Question] = None,
        assessment_complete: bool = False
    ):
        self.is_correct = is_correct
        self.points_earned = points_earned
        self.domain = domain
        self.difficulty = difficulty
        self.correct_answer = correct_answer
        self.explanation = explanation
        self.next_difficulty = next_difficulty
        self.resources = resources or []
        self.next_question = next_question
        self.assessment_complete = assessment_complete
        self.message = get_success_message(difficulty) if is_correct else "That's not quite right. Try again!"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        result = {
            "is_correct": self.is_correct,
            "points_earned": self.points_earned,
            "domain": self.domain,
            "difficulty": self.difficulty,
            "correct_answer": self.correct_answer,
            "explanation": self.explanation,
            "message": self.message,
            "next_difficulty": self.next_difficulty,
            "resources": self.resources,
            "assessment_complete": self.assessment_complete
        }
        
        if self.next_question:
            result["next_question"] = self.next_question.to_dict()
        
        return result

def get_success_message(difficulty: int) -> str:
    """Get a success message appropriate for the difficulty level"""
    easy_messages = [
        "Good job!",
        "That's correct!",
        "Right on!",
        "Nicely done!"
    ]
    
    medium_messages = [
        "Well done! That was a good one.",
        "Excellent work!",
        "That's correct - you're doing great!",
        "Spot on! Keep up the good work."
    ]
    
    hard_messages = [
        "Impressive! That was a challenging question.",
        "Outstanding! That was a tough one.",
        "Excellent work on that difficult question!",
        "Superb! You're mastering these challenging concepts."
    ]
    
    if difficulty <= 2:
        return random.choice(easy_messages)
    elif difficulty <= 4:
        return random.choice(medium_messages)
    else:
        return random.choice(hard_messages)

def submit_answer_and_update(
    db: Session,
    user_id: int,
    question_id: int,
    answer: str,
    time_taken: Optional[int] = None
) -> Optional[AnswerFeedback]:
    """
    Submit an answer and update user progress
    
    Returns feedback on the answer
    """
    # Get question
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        logger.error(f"Question {question_id} not found")
        return None
    
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.error(f"User {user_id} not found")
        return None
    
    # Check if correct
    is_correct = False
    if question.q_type == "multiple_choice":
        is_correct = answer.strip().upper() == question.correct_answer.strip().upper()
    elif question.q_type == "true_false":
        user_answer = answer.strip().lower()
        correct_answer = question.correct_answer.strip().lower()
        is_correct = (
            (user_answer in ["true", "t", "yes", "y", "1"] and 
             correct_answer in ["true", "t", "yes", "y", "1"]) or
            (user_answer in ["false", "f", "no", "n", "0"] and 
             correct_answer in ["false", "f", "no", "n", "0"])
        )
    else:
        is_correct = answer.strip().lower() == question.correct_answer.strip().lower()
    
    # Calculate points
    points_earned = 0
    if is_correct:
        # Base points (5 per difficulty level)
        points_earned = 5 * question.difficulty
        
        # Time bonus (up to 5 extra points for fast answers)
        if time_taken and question.time_limit:
            time_factor = max(0, min(1, 1 - (time_taken / question.time_limit)))
            points_earned += int(time_factor * 5)
    
    # Record answer
    user_answer = UserAnswer(
        user_id=user_id,
        question_id=question_id,
        answer=answer,
        is_correct=is_correct,
        points_earned=points_earned,
        time_taken=time_taken
    )
    db.add(user_answer)
    
    # Update user progress
    update_user_performance(db, user_id, question.domain, is_correct, question.difficulty, points_earned)
    
    # Get updated progress for assessment completion check
    progress = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == user_id,
        UserDomainProgress.domain == question.domain
    ).first()
    
    # Determine next difficulty
    next_difficulty = question.difficulty
    if progress:
        next_difficulty = progress.current_level
    
    # Check if assessment is complete
    assessment_complete = False
    if progress and (progress.questions_attempted >= 10 and progress.proficiency >= 4):
        assessment_complete = True
        progress.is_complete = True
        db.commit()
    
    # Get next question if assessment not complete
    next_question = None
    if not assessment_complete:
        # Get previously answered questions to exclude
        answered_ids = [
            ans.question_id for ans in db.query(UserAnswer).filter(
                UserAnswer.user_id == user_id,
                UserAnswer.is_correct == True
            ).all()
        ]
        
        next_question = get_random_question(
            db, 
            question.domain, 
            next_difficulty, 
            exclude_ids=answered_ids
        )
    
    # Create feedback
    feedback = AnswerFeedback(
        is_correct=is_correct,
        points_earned=points_earned,
        domain=question.domain,
        difficulty=question.difficulty,
        correct_answer=question.correct_answer,
        explanation=question.explanation,
        next_difficulty=next_difficulty,
        resources=question.resources,
        next_question=next_question,
        assessment_complete=assessment_complete
    )
    
    return feedback

def update_user_performance(
    db: Session,
    user_id: int,
    domain: str,
    is_correct: bool,
    difficulty: int,
    points_earned: int
) -> None:
    """Update user performance metrics"""
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.error(f"User {user_id} not found")
        return
    
    # Update user points
    user.total_points += points_earned
    user.level = user.check_level()
    
    # Get or create progress record for this domain
    progress = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == user_id,
        UserDomainProgress.domain == domain
    ).first()
    
    if not progress:
        # Create new progress record
        progress = UserDomainProgress(
            user_id=user_id,
            domain=domain,
            questions_attempted=1,
            questions_correct=1 if is_correct else 0,
            highest_difficulty=difficulty,
            current_level=difficulty,
            total_points=points_earned,
            last_activity=datetime.utcnow()
        )
        db.add(progress)
    else:
        # Update existing progress
        progress.questions_attempted += 1
        if is_correct:
            progress.questions_correct += 1
        progress.total_points += points_earned
        progress.last_activity = datetime.utcnow()
        
        # Update highest difficulty if this question is harder
        if difficulty > progress.highest_difficulty:
            progress.highest_difficulty = difficulty
    
    # Update user level in this domain
    update_user_level(progress)
    
    # Commit changes
    db.commit()

def update_user_level(progress: UserDomainProgress) -> None:
    """Update a user's level based on their performance"""
    if not progress:
        return
    
    # Calculate success rate at current level
    correct_at_level_count = 0
    total_at_level_count = 0
    
    with get_db_context() as db:
        # Get answers at current level
        answers_at_level = db.query(UserAnswer).join(Question).filter(
            UserAnswer.user_id == progress.user_id,
            Question.domain == progress.domain,
            Question.difficulty == progress.current_level
        ).all()
        
        # Calculate success rate
        total_at_level_count = len(answers_at_level)
        correct_at_level_count = sum(1 for a in answers_at_level if a.is_correct)
    
    # Calculate success rate
    success_rate = 0.0
    if total_at_level_count > 0:
        success_rate = correct_at_level_count / total_at_level_count
    
    # Update level
    if total_at_level_count >= 3:  # Need at least 3 questions to evaluate
        if success_rate >= 0.7 and progress.current_level < 5:
            # Level up if success rate is good and not at max level
            progress.current_level += 1
        elif success_rate <= 0.3 and progress.current_level > 1:
            # Level down if struggling
            progress.current_level -= 1

class LearningPath:
    """Learning path for a user"""
    def __init__(
        self,
        user_id: int,
        questions_asked: int,
        questions_correct: int,
        strongest_domain: str,
        weakest_domain: str,
        user_name: str,
        total_points_earned: int,
        recommendations: Optional[List[Dict[str, Any]]] = None
    ):
        self.user_id = user_id
        self.questions_asked = questions_asked
        self.questions_correct = questions_correct
        self.strongest_domain = strongest_domain
        self.weakest_domain = weakest_domain
        self.user_name = user_name
        self.total_points_earned = total_points_earned
        self.recommendations = recommendations or []
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "user_id": self.user_id,
            "questions_asked": self.questions_asked,
            "questions_correct": self.questions_correct,
            "strongest_domain": self.strongest_domain,
            "weakest_domain": self.weakest_domain,
            "user_name": self.user_name,
            "total_points_earned": self.total_points_earned,
            "recommendations": self.recommendations
        }

def generate_learning_path(db: Session, user_id: int) -> LearningPath:
    """Generate a personalized learning path for a user"""
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.error(f"User {user_id} not found")
        raise ValueError(f"User {user_id} not found")
    
    # Get progress across all domains
    progress_records = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == user_id
    ).all()
    
    # Calculate total questions and correct answers
    questions_asked = sum(p.questions_attempted for p in progress_records)
    questions_correct = sum(p.questions_correct for p in progress_records)
    
    # Find strongest and weakest domains
    strongest_domain = "None yet"
    weakest_domain = "None yet"
    
    if progress_records:
        # Find strongest domain (highest proficiency)
        strongest = max(progress_records, key=lambda p: p.proficiency)
        strongest_domain = strongest.domain
        
        # Find weakest domain (lowest proficiency with at least 3 questions)
        weak_records = [p for p in progress_records if p.questions_attempted >= 3]
        if weak_records:
            weakest = min(weak_records, key=lambda p: p.proficiency)
            weakest_domain = weakest.domain
    
    # Generate recommendations
    recommendations = []
    
    # Recommend domains not yet attempted
    all_domains = get_distinct_domains(db)
    attempted_domains = {p.domain for p in progress_records}
    
    for domain in all_domains:
        if domain not in attempted_domains:
            # Get domain information
            domain_obj = db.query(Domain).filter(Domain.name == domain).first()
            description = domain_obj.description if domain_obj else "Expand your knowledge"
            
            recommendations.append({
                "type": "new_domain",
                "domain": domain,
                "description": description,
                "message": f"Try questions in the {domain} domain to broaden your skills",
                "difficulty": 1
            })
    
    # Recommend harder questions in strong domains
    for progress in progress_records:
        if progress.proficiency >= 3 and progress.highest_difficulty < 5:
            next_difficulty = progress.highest_difficulty + 1
            recommendations.append({
                "type": "harder_questions",
                "domain": progress.domain,
                "current_difficulty": progress.highest_difficulty,
                "target_difficulty": next_difficulty,
                "message": f"You're doing well in {progress.domain}. Try more challenging questions!"
            })
    
    # Recommend review for weak areas
    for progress in progress_records:
        if progress.questions_attempted >= 3 and progress.proficiency < 3:
            recommendations.append({
                "type": "review",
                "domain": progress.domain,
                "accuracy": progress.accuracy,
                "proficiency": progress.proficiency,
                "message": f"Review concepts in {progress.domain} to improve your understanding"
            })
    
    # Create learning path
    path = LearningPath(
        user_id=user_id,
        questions_asked=questions_asked,
        questions_correct=questions_correct,
        strongest_domain=strongest_domain,
        weakest_domain=weakest_domain,
        user_name=user.full_name,
        total_points_earned=user.total_points,
        recommendations=recommendations
    )
    
    return path