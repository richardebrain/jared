"""
Question loader module for the MentorMe assessment system
This module handles question selection, answer evaluation, and user performance tracking
"""
import csv
import logging
import os
import random
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

from sqlalchemy import func, and_, or_
from sqlalchemy.orm import Session

from .models import (
    Question, Domain, Tag, QuestionType, User, UserAnswer, UserDomainProgress
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("mentorme.loader")


def load_questions_from_csv(db: Session, csv_path: str) -> int:
    """
    Load questions from a CSV file
    
    Returns the number of questions loaded
    """
    if not os.path.exists(csv_path):
        logger.warning(f"CSV file not found: {csv_path}")
        return 0
    
    count = 0
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                # Check if question already exists
                existing = db.query(Question).filter(
                    Question.question == row['question']
                ).first()
                
                if existing:
                    logger.info(f"Question '{row['question'][:30]}...' already exists")
                    continue
                
                # Get or create domain
                domain_name = row['domain'].strip()
                domain = get_or_create_domain(db, domain_name)
                
                # Create question
                question = Question(
                    question=row['question'],
                    domain=domain_name,
                    difficulty=int(row.get('difficulty', 1)),
                    q_type=row.get('type', 'multiple_choice'),
                    correct_answer=row['correct_answer'],
                    explanation=row.get('explanation')
                )
                
                # Handle options
                if row.get('options'):
                    options = {}
                    option_parts = row['options'].split('|')
                    for i, part in enumerate(option_parts):
                        key = chr(65 + i)  # A, B, C, D...
                        options[key] = part.strip()
                    question.options = options
                
                db.add(question)
                count += 1
            except Exception as e:
                logger.error(f"Error loading question: {e}")
                continue
    
    db.commit()
    logger.info(f"Loaded {count} questions from {csv_path}")
    return count


def load_questions(db: Session, csv_path: Optional[str] = None) -> int:
    """Load questions from a file or directory"""
    if csv_path and os.path.isfile(csv_path):
        return load_questions_from_csv(db, csv_path)
    elif csv_path and os.path.isdir(csv_path):
        # Load all CSV files in directory
        count = 0
        for filename in os.listdir(csv_path):
            if filename.endswith('.csv'):
                file_path = os.path.join(csv_path, filename)
                count += load_questions_from_csv(db, file_path)
        return count
    else:
        # Try default locations
        default_paths = ['data/questions.csv', 'data/sample_questions.csv']
        for path in default_paths:
            if os.path.exists(path):
                return load_questions_from_csv(db, path)
        
        logger.warning("No question files found")
        return 0


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
    if not domain:
        return None
    
    # Count questions by domain
    question_count = db.query(func.count(Question.id)).filter(
        Question.domain == domain
    ).scalar()
    
    if not question_count:
        return None
    
    # Get difficulty distribution
    difficulty_counts = db.query(
        Question.difficulty, func.count(Question.id)
    ).filter(
        Question.domain == domain
    ).group_by(Question.difficulty).all()
    
    difficulty_dist = {level: count for level, count in difficulty_counts}
    
    # Get sub-domains if any
    sub_domains = db.query(Question.sub_domain).filter(
        Question.domain == domain,
        Question.sub_domain.isnot(None)
    ).distinct().all()
    
    sub_domain_list = [sd[0] for sd in sub_domains if sd[0]]
    
    return {
        "total_questions": question_count,
        "difficulty_distribution": difficulty_dist,
        "sub_domains": sub_domain_list if sub_domain_list else None
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
        query = query.filter(Question.id.notin_(exclude_ids))
    
    # Get count
    count = query.count()
    if count == 0:
        return None
    
    # Get random question
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
    # Get user progress for this domain
    progress = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == user_id,
        UserDomainProgress.domain == domain
    ).first()
    
    # Initialize progress if not exists
    if not progress:
        progress = UserDomainProgress(
            user_id=user_id,
            domain=domain,
            questions_attempted=0,
            questions_correct=0,
            highest_difficulty=1,
            current_level=1,
            total_points=0
        )
        db.add(progress)
        db.commit()
    
    # Get recently answered question IDs to avoid repetition
    recent_question_ids = []
    if prev_answers:
        recent_question_ids = [a.get('question_id') for a in prev_answers if 'question_id' in a]
    
    # Get user's accuracy in this domain
    accuracy = 0
    correct_count = 0
    if prev_answers:
        for answer in prev_answers:
            if answer.get('is_correct'):
                correct_count += 1
        accuracy = (correct_count / len(prev_answers)) * 100
    
    # Determine difficulty level based on performance
    if not prev_answers:
        # First question - start at level 1
        difficulty = 1
    elif len(prev_answers) < 3:
        # First few questions - stay at level 1
        difficulty = 1
    elif accuracy >= 80 and progress.highest_difficulty < 5:
        # Doing very well - increase difficulty
        difficulty = min(5, progress.highest_difficulty + 1)
    elif accuracy >= 60:
        # Doing well - maintain current difficulty
        difficulty = progress.highest_difficulty
    else:
        # Struggling - decrease difficulty
        difficulty = max(1, progress.highest_difficulty - 1)
    
    # Try to get a question at the selected difficulty
    question = get_random_question(
        db, domain=domain, difficulty=difficulty, exclude_ids=recent_question_ids
    )
    
    # If no question found at this difficulty, try another difficulty level
    if not question:
        # Try higher difficulties
        for diff in range(difficulty + 1, 6):
            question = get_random_question(
                db, domain=domain, difficulty=diff, exclude_ids=recent_question_ids
            )
            if question:
                break
        
        # If still no question, try lower difficulties
        if not question:
            for diff in range(difficulty - 1, 0, -1):
                question = get_random_question(
                    db, domain=domain, difficulty=diff, exclude_ids=recent_question_ids
                )
                if question:
                    break
    
    # If still no question, try without difficulty filter
    if not question:
        question = get_random_question(
            db, domain=domain, exclude_ids=recent_question_ids
        )
    
    # If still no question, try without any filters (last resort)
    if not question:
        question = get_random_question(db)
    
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
        self.resources = resources
        self.next_question = next_question
        self.assessment_complete = assessment_complete
        self.message = get_success_message(difficulty) if is_correct else "Not quite right. Let's try again!"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        result = {
            "is_correct": self.is_correct,
            "correct_answer": self.correct_answer,
            "explanation": self.explanation,
            "points_earned": self.points_earned,
            "message": self.message,
            "next_difficulty": self.next_difficulty,
            "assessment_complete": self.assessment_complete
        }
        
        if self.next_question:
            result["next_question"] = self.next_question.to_dict()
        
        return result


def get_success_message(difficulty: int) -> str:
    """Get a success message appropriate for the difficulty level"""
    level1_messages = [
        "Great job! You got it right!",
        "Well done! That's correct!",
        "Perfect! You're doing great!",
        "That's right! Keep it up!"
    ]
    
    level2_messages = [
        "Excellent work! That was a good one!",
        "You're on a roll! That's correct!",
        "Very good! You're showing real knowledge!"
    ]
    
    level3_messages = [
        "Outstanding! That was challenging!",
        "Impressive work! You're mastering this!",
        "Excellent thinking! You're really understanding this material!"
    ]
    
    level4_messages = [
        "Exceptional! That was quite difficult!",
        "Remarkable work! You're showing expertise!",
        "Brilliant! You're demonstrating advanced knowledge!"
    ]
    
    level5_messages = [
        "Amazing! That was expert-level!",
        "Incredible work! You're showing mastery!",
        "Phenomenal! You've conquered a very challenging question!"
    ]
    
    if difficulty == 1:
        return random.choice(level1_messages)
    elif difficulty == 2:
        return random.choice(level2_messages)
    elif difficulty == 3:
        return random.choice(level3_messages)
    elif difficulty == 4:
        return random.choice(level4_messages)
    else:
        return random.choice(level5_messages)


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
    
    # Determine if answer is correct
    is_correct = False
    correct_answer = question.correct_answer
    
    # Check answer format based on question type
    if question.q_type == QuestionType.MULTIPLE_CHOICE.value:
        # For multiple choice, just check if answer matches correct answer
        is_correct = answer.strip().upper() == correct_answer.strip().upper()
    elif question.q_type == QuestionType.TRUE_FALSE.value:
        # For true/false, check case-insensitive
        is_correct = answer.strip().lower() == correct_answer.strip().lower()
    elif question.q_type == QuestionType.FILL_BLANK.value or question.q_type == QuestionType.SHORT_ANSWER.value:
        # For fill-in-the-blank or short answer, check if answer contains correct keywords
        keywords = correct_answer.strip().lower().split('|')
        answer_lower = answer.strip().lower()
        is_correct = any(keyword.strip() in answer_lower for keyword in keywords)
    
    # Calculate points earned
    points_earned = question.points_value if is_correct else 0
    
    # Record the answer
    user_answer = UserAnswer(
        user_id=user_id,
        question_id=question_id,
        answer=answer,
        is_correct=is_correct,
        points_earned=points_earned,
        time_taken=time_taken
    )
    db.add(user_answer)
    
    # Update user performance
    update_user_performance(
        db, user_id, question.domain, is_correct, question.difficulty, points_earned
    )
    
    # Get next difficulty level
    progress = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == user_id,
        UserDomainProgress.domain == question.domain
    ).first()
    
    next_difficulty = progress.highest_difficulty if progress else 1
    
    # Check if assessment is complete (reached level 5 or answered 10 correct)
    assessment_complete = False
    if progress and (progress.highest_difficulty >= 5 or progress.questions_correct >= 10):
        assessment_complete = True
    
    # Create feedback
    feedback = AnswerFeedback(
        is_correct=is_correct,
        points_earned=points_earned,
        domain=question.domain,
        difficulty=question.difficulty,
        correct_answer=correct_answer,
        explanation=question.explanation,
        next_difficulty=next_difficulty,
        resources=question.resources,
        assessment_complete=assessment_complete
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
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.error(f"User {user_id} not found")
        return
    
    # Update total points
    user.total_points += points_earned
    
    # Get or create domain progress
    progress = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == user_id,
        UserDomainProgress.domain == domain
    ).first()
    
    if not progress:
        progress = UserDomainProgress(
            user_id=user_id,
            domain=domain,
            questions_attempted=1,
            questions_correct=1 if is_correct else 0,
            highest_difficulty=difficulty,
            current_level=1,
            total_points=points_earned,
            last_activity=datetime.utcnow()
        )
        db.add(progress)
    else:
        progress.questions_attempted += 1
        if is_correct:
            progress.questions_correct += 1
        progress.total_points += points_earned
        progress.last_activity = datetime.utcnow()
        
        # Update highest difficulty if this was correct and higher
        if is_correct and difficulty > progress.highest_difficulty:
            progress.highest_difficulty = difficulty
        
        # Update level based on performance
        update_user_level(progress)
    
    # Commit changes
    db.commit()


def update_user_level(progress: UserDomainProgress) -> None:
    """Update a user's level based on their performance"""
    # Basic level calculation
    # Level 1: 0-9 correct
    # Level 2: 10-24 correct with 60%+ accuracy
    # Level 3: 25-49 correct with 70%+ accuracy
    # Level 4: 50-74 correct with 75%+ accuracy
    # Level 5: 75+ correct with 80%+ accuracy
    
    # Calculate accuracy
    accuracy = 0
    if progress.questions_attempted > 0:
        accuracy = (progress.questions_correct / progress.questions_attempted) * 100
    
    # Determine level
    if progress.questions_correct >= 75 and accuracy >= 80:
        level = 5
    elif progress.questions_correct >= 50 and accuracy >= 75:
        level = 4
    elif progress.questions_correct >= 25 and accuracy >= 70:
        level = 3
    elif progress.questions_correct >= 10 and accuracy >= 60:
        level = 2
    else:
        level = 1
    
    # Set new level if higher
    if level > progress.current_level:
        progress.current_level = level


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
        raise ValueError(f"User {user_id} not found")
    
    # Get user domain progress
    progress_items = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == user_id
    ).all()
    
    if not progress_items:
        # No progress yet, recommend starting with basics
        return LearningPath(
            user_id=user_id,
            questions_asked=0,
            questions_correct=0,
            strongest_domain="None yet",
            weakest_domain="None yet",
            user_name=user.full_name,
            total_points_earned=0,
            recommendations=[
                {
                    "type": "assessment",
                    "domain": "Child Development",
                    "reason": "Start with fundamental knowledge",
                    "priority": "high"
                },
                {
                    "type": "learning_module",
                    "title": "Introduction to Early Childhood Education",
                    "reason": "Build a strong foundation",
                    "priority": "high"
                }
            ]
        )
    
    # Calculate total questions and correct answers
    total_questions = sum(p.questions_attempted for p in progress_items)
    total_correct = sum(p.questions_correct for p in progress_items)
    
    # Find strongest and weakest domains
    # Sort by proficiency level, then by accuracy
    sorted_progress = sorted(
        progress_items,
        key=lambda p: (p.proficiency if p.questions_attempted > 0 else 0,
                       p.accuracy if p.questions_attempted > 0 else 0),
        reverse=True
    )
    
    strongest_domain = sorted_progress[0].domain if sorted_progress else "None yet"
    weakest_domain = sorted_progress[-1].domain if len(sorted_progress) > 1 else "None yet"
    
    # Generate recommendations
    recommendations = []
    
    # Recommend assessments for weakest domains
    weak_domains = sorted_progress[-2:] if len(sorted_progress) >= 2 else sorted_progress
    for domain_progress in weak_domains:
        recommendations.append({
            "type": "assessment",
            "domain": domain_progress.domain,
            "reason": f"Improve your knowledge in {domain_progress.domain}",
            "priority": "high" if domain_progress == weak_domains[0] else "medium"
        })
    
    # Recommend learning modules based on performance
    for domain_progress in weak_domains:
        # Find related learning modules
        domain_modules = []  # This would come from a learning module database
        if domain_modules:
            for module in domain_modules[:2]:  # Limit to 2 modules per domain
                recommendations.append({
                    "type": "learning_module",
                    "title": module.get("title", f"{domain_progress.domain} Training"),
                    "reason": f"Strengthen your {domain_progress.domain} skills",
                    "priority": "medium"
                })
    
    # Create learning path
    return LearningPath(
        user_id=user_id,
        questions_asked=total_questions,
        questions_correct=total_correct,
        strongest_domain=strongest_domain,
        weakest_domain=weakest_domain,
        user_name=user.full_name,
        total_points_earned=user.total_points,
        recommendations=recommendations[:5]  # Limit to top 5 recommendations
    )