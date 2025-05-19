"""
Question loader module for the MentorMe assessment system
This module handles question selection, answer evaluation, and user performance tracking
"""
import csv
import json
import logging
import random
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple, Union

from sqlalchemy import func, desc, and_, or_
from sqlalchemy.orm import Session

from .models import (
    Question, User, Answer, QuestionType, UserDomainProgress,
    Domain, Tag, LearningPathRecommendation, AnswerFeedback
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("mentorme.loader")

# Constants
DEFAULT_SESSION_QUESTIONS = 15
PROFICIENCY_THRESHOLD = 10  # Number of correct answers to be considered proficient
MAX_DIFFICULTY = 5
MIN_DIFFICULTY = 1

# Success messages for different difficulty levels
SUCCESS_MESSAGES = {
    1: ["Great job!", "You've got the basics down!", "Nice work on this easy question!"],
    2: ["Well done!", "You're making good progress!", "You're getting the hang of this!"],
    3: ["Excellent work!", "You really know your stuff!", "You're showing strong knowledge!"],
    4: ["Outstanding!", "Impressive knowledge!", "You've mastered this challenging concept!"],
    5: ["Phenomenal!", "Expert-level understanding!", "You're at the top of your game!"]
}


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
                try:
                    # Process question type
                    q_type_str = row.get('type', '').strip().lower()
                    if q_type_str == 'multiple_choice':
                        q_type = QuestionType.MULTIPLE_CHOICE
                    elif q_type_str == 'true_false':
                        q_type = QuestionType.TRUE_FALSE
                    elif q_type_str == 'fill_blank':
                        q_type = QuestionType.FILL_BLANK
                    elif q_type_str == 'short_answer':
                        q_type = QuestionType.SHORT_ANSWER
                    elif q_type_str == 'matching':
                        q_type = QuestionType.MATCHING
                    else:
                        logger.warning(f"Unknown question type: {q_type_str}, defaulting to multiple_choice")
                        q_type = QuestionType.MULTIPLE_CHOICE
                    
                    # Process options
                    options = {}
                    if q_type == QuestionType.MULTIPLE_CHOICE:
                        for letter in ['a', 'b', 'c', 'd']:
                            option_key = f'option_{letter}'
                            if option_key in row and row[option_key]:
                                options[letter.upper()] = row[option_key]
                    
                    # Process hints (comma-separated)
                    hints = []
                    if 'hints' in row and row['hints']:
                        hints = [hint.strip() for hint in row['hints'].split(',')]
                    
                    # Process difficulty
                    try:
                        difficulty = int(row.get('difficulty', 1))
                        if difficulty < 1:
                            difficulty = 1
                        elif difficulty > 5:
                            difficulty = 5
                    except ValueError:
                        difficulty = 1
                    
                    # Process time limit
                    time_limit = None
                    if 'time_limit' in row and row['time_limit']:
                        try:
                            time_limit = int(row['time_limit'])
                        except ValueError:
                            pass
                    
                    # Process resources (JSON string)
                    resources = []
                    if 'resources' in row and row['resources']:
                        try:
                            resources = json.loads(row['resources'])
                        except json.JSONDecodeError:
                            logger.warning(f"Invalid resources JSON: {row['resources']}")
                    
                    # Process tags
                    tags = []
                    if 'tags' in row and row['tags']:
                        tag_names = [tag.strip() for tag in row['tags'].split(',')]
                        for tag_name in tag_names:
                            tag = db.query(Tag).filter(Tag.name == tag_name).first()
                            if not tag:
                                tag = Tag(name=tag_name)
                                db.add(tag)
                                db.flush()
                            tags.append(tag)
                    
                    # Create domain if it doesn't exist
                    domain_name = row.get('domain', '').strip()
                    if not domain_name:
                        logger.warning("Question has no domain, skipping")
                        continue
                    
                    domain = get_or_create_domain(db, domain_name)
                    
                    # Check if question already exists (avoid duplicates)
                    existing_question = db.query(Question).filter(
                        Question.question == row['question']
                    ).first()
                    
                    if existing_question:
                        logger.info(f"Question already exists: {row['question'][:30]}...")
                        continue
                    
                    # Create new question
                    question = Question(
                        question=row['question'],
                        domain=domain_name,
                        sub_domain=row.get('sub_domain'),
                        difficulty=difficulty,
                        q_type=q_type,
                        correct_answer=row.get('correct_answer', ''),
                        explanation=row.get('explanation'),
                        hints=hints,
                        options=options,
                        resources=resources,
                        time_limit=time_limit
                    )
                    
                    # Add tags
                    for tag in tags:
                        question.tags.append(tag)
                    
                    db.add(question)
                    count += 1
                
                except Exception as e:
                    logger.error(f"Error processing question row: {e}")
                    continue
            
            db.commit()
            logger.info(f"Loaded {count} questions from {csv_path}")
            return count
    except Exception as e:
        logger.error(f"Error loading questions from CSV: {e}")
        db.rollback()
        return 0


def load_questions(db: Session, csv_path: Optional[str] = None) -> int:
    """Load questions from a file or directory"""
    if not csv_path:
        return 0
    
    return load_questions_from_csv(db, csv_path)


def get_or_create_domain(db: Session, domain_name: str) -> Domain:
    """Get or create a domain"""
    domain = db.query(Domain).filter(Domain.name == domain_name).first()
    if not domain:
        domain = Domain(name=domain_name)
        db.add(domain)
        db.flush()
    return domain


def get_distinct_domains(db: Session) -> List[str]:
    """Get a list of all distinct domains"""
    domains = db.query(Question.domain).distinct().all()
    return [d[0] for d in domains]


def get_domain_stats(db: Session, domain: str) -> Optional[Dict[str, Any]]:
    """Get statistics for a domain"""
    # Check if domain exists
    if not db.query(Question).filter(Question.domain == domain).first():
        return None
    
    # Count questions by difficulty
    difficulty_counts = db.query(
        Question.difficulty, func.count(Question.id)
    ).filter(
        Question.domain == domain
    ).group_by(
        Question.difficulty
    ).all()
    
    # Convert to dictionary
    difficulty_distribution = {d: c for d, c in difficulty_counts}
    
    # Get subdomains
    subdomains = db.query(Question.sub_domain).filter(
        Question.domain == domain,
        Question.sub_domain.isnot(None)
    ).distinct().all()
    
    return {
        "total_questions": sum(difficulty_distribution.values()),
        "difficulty_distribution": difficulty_distribution,
        "sub_domains": [s[0] for s in subdomains] if subdomains else None
    }


def get_random_question(
    db: Session,
    domain: Optional[str] = None,
    difficulty: Optional[int] = None,
    exclude_ids: Optional[List[int]] = None
) -> Optional[Question]:
    """Get a random question with optional filters"""
    query = db.query(Question)
    
    # Apply filters
    if domain:
        query = query.filter(Question.domain == domain)
    
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    
    if exclude_ids:
        query = query.filter(~Question.id.in_(exclude_ids))
    
    # Count matching questions
    count = query.count()
    if count == 0:
        return None
    
    # Get a random question
    offset = random.randint(0, count - 1)
    return query.offset(offset).first()


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
    # Get user's progress in this domain
    progress = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == user_id,
        UserDomainProgress.domain == domain
    ).first()
    
    # If no progress record exists, create one and start with difficulty 1
    if not progress:
        progress = UserDomainProgress(
            user_id=user_id,
            domain=domain,
            current_level=1,
            highest_difficulty=1
        )
        db.add(progress)
        db.commit()
        current_difficulty = 1
    else:
        current_difficulty = progress.highest_difficulty
    
    # If we have previous answers in this session, analyze them
    if prev_answers:
        # Get the most recent questions to avoid repetition
        recent_question_ids = [a["question_id"] for a in prev_answers]
        
        # Count recent correct and incorrect answers
        correct_count = sum(1 for a in prev_answers if a["is_correct"])
        total_count = len(prev_answers)
        
        # Check if user has mastered the current difficulty level
        if total_count >= PROFICIENCY_THRESHOLD and correct_count / total_count >= 0.8:
            # Move to next difficulty if not at max
            if current_difficulty < MAX_DIFFICULTY:
                current_difficulty += 1
                logger.info(f"User {user_id} advanced to difficulty {current_difficulty} in {domain}")
        elif total_count >= PROFICIENCY_THRESHOLD and correct_count / total_count < 0.4:
            # Move back a level if struggling
            if current_difficulty > MIN_DIFFICULTY:
                current_difficulty -= 1
                logger.info(f"User {user_id} moved back to difficulty {current_difficulty} in {domain}")
        
        # Check if assessment should end (reached max questions or demonstrated proficiency at max level)
        if (
            total_count >= DEFAULT_SESSION_QUESTIONS or
            (current_difficulty == MAX_DIFFICULTY and correct_count / total_count >= 0.8 and total_count >= PROFICIENCY_THRESHOLD)
        ):
            logger.info(f"Assessment complete for user {user_id} in {domain}")
            return None
    else:
        recent_question_ids = []
    
    # Find a question at the appropriate difficulty level
    question = get_random_question(
        db=db,
        domain=domain,
        difficulty=current_difficulty,
        exclude_ids=recent_question_ids
    )
    
    # If no question found at current difficulty, try adjacent difficulties
    if not question and current_difficulty > MIN_DIFFICULTY:
        question = get_random_question(
            db=db,
            domain=domain,
            difficulty=current_difficulty - 1,
            exclude_ids=recent_question_ids
        )
    
    if not question and current_difficulty < MAX_DIFFICULTY:
        question = get_random_question(
            db=db,
            domain=domain,
            difficulty=current_difficulty + 1,
            exclude_ids=recent_question_ids
        )
    
    # Last resort: any difficulty in this domain
    if not question:
        question = get_random_question(
            db=db,
            domain=domain,
            exclude_ids=recent_question_ids
        )
    
    return question


def get_success_message(difficulty: int) -> str:
    """Get a success message appropriate for the difficulty level"""
    if difficulty in SUCCESS_MESSAGES:
        return random.choice(SUCCESS_MESSAGES[difficulty])
    return random.choice(SUCCESS_MESSAGES[1])  # Default to lowest difficulty messages


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
    # Get the question
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        logger.error(f"Question {question_id} not found")
        return None
    
    # Get the user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.error(f"User {user_id} not found")
        return None
    
    # Check if the answer is correct
    is_correct = question.is_correct(answer)
    
    # Calculate points earned
    points_earned = question.points_value if is_correct else 0
    
    # Generate session ID if not provided (used to group answers in a session)
    session_id = str(uuid.uuid4())
    
    # Record the answer
    answer_record = Answer(
        user_id=user_id,
        question_id=question_id,
        session_id=session_id,
        answer_text=answer,
        is_correct=is_correct,
        time_taken=time_taken,
        points_earned=points_earned
    )
    db.add(answer_record)
    
    # Update user progress
    update_user_performance(
        db=db,
        user_id=user_id,
        domain=question.domain,
        is_correct=is_correct,
        difficulty=question.difficulty,
        points_earned=points_earned
    )
    
    # Determine next difficulty level
    current_progress = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == user_id,
        UserDomainProgress.domain == question.domain
    ).first()
    
    next_difficulty = current_progress.highest_difficulty if current_progress else question.difficulty
    
    # Prepare feedback
    message = ""
    if is_correct:
        message = get_success_message(question.difficulty)
    else:
        message = "That's not quite right. Review the explanation to learn more."
    
    feedback = AnswerFeedback(
        question_id=question_id,
        user_id=user_id,
        session_id=session_id,
        is_correct=is_correct,
        difficulty=question.difficulty,
        points_earned=points_earned,
        domain=question.domain,
        correct_answer=question.correct_answer,
        explanation=question.explanation,
        message=message,
        next_difficulty=next_difficulty,
        resources=question.resources
    )
    
    # Commit changes
    db.commit()
    
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
    # Update user's progress in this domain
    progress = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == user_id,
        UserDomainProgress.domain == domain
    ).first()
    
    if not progress:
        # Create new progress record
        progress = UserDomainProgress(
            user_id=user_id,
            domain=domain,
            current_level=1,
            highest_difficulty=1,
            questions_attempted=1,
            questions_correct=1 if is_correct else 0,
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
        
        # Update highest difficulty if this question was harder
        if is_correct and difficulty > progress.highest_difficulty:
            progress.highest_difficulty = difficulty
        
        # Update level based on performance (implemented below)
        update_user_level(progress)
        
        # Update last activity timestamp
        progress.last_activity = datetime.utcnow()
    
    # Update total points for user
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.total_points += points_earned
    
    db.commit()


def update_user_level(progress: UserDomainProgress) -> None:
    """Update a user's level based on their performance"""
    # Level 1: Beginner (default)
    # Level 2: Completed at least 5 questions with 60% accuracy at difficulty 1
    # Level 3: Completed at least 10 questions with 70% accuracy at difficulty 2
    # Level 4: Completed at least 15 questions with 75% accuracy at difficulty 3
    # Level 5: Completed at least 20 questions with 80% accuracy at difficulty 4
    # Level 6: Completed at least 25 questions with 85% accuracy at difficulty 5
    
    attempted = progress.questions_attempted
    correct = progress.questions_correct
    accuracy = correct / attempted if attempted > 0 else 0
    highest_difficulty = progress.highest_difficulty
    
    if (
        attempted >= 25 and
        accuracy >= 0.85 and
        highest_difficulty >= 5
    ):
        progress.current_level = 6
    elif (
        attempted >= 20 and
        accuracy >= 0.80 and
        highest_difficulty >= 4
    ):
        progress.current_level = 5
    elif (
        attempted >= 15 and
        accuracy >= 0.75 and
        highest_difficulty >= 3
    ):
        progress.current_level = 4
    elif (
        attempted >= 10 and
        accuracy >= 0.70 and
        highest_difficulty >= 2
    ):
        progress.current_level = 3
    elif (
        attempted >= 5 and
        accuracy >= 0.60 and
        highest_difficulty >= 1
    ):
        progress.current_level = 2
    else:
        progress.current_level = 1


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
        accuracy = 0
        if self.questions_asked > 0:
            accuracy = round(100 * self.questions_correct / self.questions_asked, 1)
        
        return {
            "user_id": self.user_id,
            "user_name": self.user_name,
            "questions_asked": self.questions_asked,
            "questions_correct": self.questions_correct,
            "accuracy": accuracy,
            "strongest_domain": self.strongest_domain,
            "weakest_domain": self.weakest_domain,
            "total_points_earned": self.total_points_earned,
            "recommendations": self.recommendations
        }


def generate_learning_path(db: Session, user_id: int) -> LearningPath:
    """Generate a personalized learning path for a user"""
    # Get the user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ValueError(f"User {user_id} not found")
    
    # Get user's domain progress records
    progress_records = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == user_id
    ).all()
    
    # If no progress records, return empty learning path
    if not progress_records:
        return LearningPath(
            user_id=user_id,
            questions_asked=0,
            questions_correct=0,
            strongest_domain="",
            weakest_domain="",
            user_name=user.username,
            total_points_earned=user.total_points,
            recommendations=[]
        )
    
    # Calculate total questions asked and correct
    questions_asked = sum(p.questions_attempted for p in progress_records)
    questions_correct = sum(p.questions_correct for p in progress_records)
    
    # Determine strongest and weakest domains based on accuracy
    sorted_by_accuracy = sorted(
        progress_records,
        key=lambda p: p.questions_correct / p.questions_attempted if p.questions_attempted > 0 else 0,
        reverse=True
    )
    
    # Only consider domains with at least 5 questions attempted
    valid_domains = [p for p in sorted_by_accuracy if p.questions_attempted >= 5]
    
    if valid_domains:
        strongest_domain = valid_domains[0].domain
        weakest_domain = valid_domains[-1].domain if len(valid_domains) > 1 else strongest_domain
    else:
        # Not enough questions attempted in any domain for meaningful analysis
        strongest_domain = ""
        weakest_domain = ""
    
    # Generate recommendations
    recommendations = []
    
    # Recommendation 1: Improve in weakest domain
    if weakest_domain:
        weak_progress = next((p for p in progress_records if p.domain == weakest_domain), None)
        if weak_progress:
            recommendations.append({
                "type": "improvement",
                "domain": weakest_domain,
                "description": f"Practice more questions in {weakest_domain} to improve your understanding.",
                "difficulty": weak_progress.highest_difficulty
            })
    
    # Recommendation 2: Challenge in strongest domain
    if strongest_domain:
        strong_progress = next((p for p in progress_records if p.domain == strongest_domain), None)
        if strong_progress and strong_progress.highest_difficulty < MAX_DIFFICULTY:
            recommendations.append({
                "type": "challenge",
                "domain": strongest_domain,
                "description": f"Challenge yourself with harder questions in {strongest_domain}.",
                "difficulty": strong_progress.highest_difficulty + 1
            })
    
    # Recommendation 3: Explore new domains
    all_domains = get_distinct_domains(db)
    explored_domains = [p.domain for p in progress_records]
    unexplored_domains = [d for d in all_domains if d not in explored_domains]
    
    if unexplored_domains:
        random_domain = random.choice(unexplored_domains)
        recommendations.append({
            "type": "exploration",
            "domain": random_domain,
            "description": f"Explore a new domain: {random_domain}.",
            "difficulty": 1
        })
    
    # Create and return the learning path
    return LearningPath(
        user_id=user_id,
        questions_asked=questions_asked,
        questions_correct=questions_correct,
        strongest_domain=strongest_domain,
        weakest_domain=weakest_domain,
        user_name=user.username,
        total_points_earned=user.total_points,
        recommendations=recommendations
    )