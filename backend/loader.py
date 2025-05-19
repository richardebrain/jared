"""
Question loader module for the assessment system
This module provides functions to load questions from the database
"""

import logging
import random
import math
from typing import List, Dict, Any, Optional, Tuple, Union

from sqlalchemy import func, desc, and_, or_
from sqlalchemy.orm import Session

from .models import Question, UserPerformance, UserDomainProgress, AnswerFeedback, User, QuestionResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("loader")

class LearningPath:
    """Class to generate personalized learning path recommendations"""
    def __init__(
        self,
        learning_path: Dict[str, List[str]],
        domain_scores: Dict[str, float],
        questions_asked: int,
        questions_correct: int,
        strongest_domain: str,
        weakest_domain: str,
        user_name: str = None,
        total_points_earned: int = 10
    ):
        self.learning_path = learning_path
        self.domain_scores = domain_scores
        self.questions_asked = questions_asked
        self.questions_correct = questions_correct
        self.strongest_domain = strongest_domain
        self.weakest_domain = weakest_domain
        self.user_name = user_name or "Student"
        self.total_points_earned = total_points_earned
        
        # Calculate accuracy percentage
        if questions_asked > 0:
            self.accuracy = (questions_correct / questions_asked) * 100
        else:
            self.accuracy = 0
    
    def to_dict(self):
        """Convert to dictionary for API response"""
        return {
            'learning_path': self.learning_path,
            'domain_scores': self.domain_scores,
            'assessment_results': {
                'questions_asked': self.questions_asked,
                'questions_correct': self.questions_correct,
                'accuracy': round(self.accuracy, 1),
                'strongest_domain': self.strongest_domain,
                'weakest_domain': self.weakest_domain,
                'points_earned': self.total_points_earned
            },
            'celebration_message': self._generate_celebration_message()
        }
    
    def _generate_celebration_message(self) -> str:
        """Generate a personalized celebration message"""
        
        # Base message format with user's name
        if self.accuracy >= 90:
            return f"Outstanding work, {self.user_name}! You've earned {self.total_points_earned} points and demonstrated exceptional understanding across all domains. Your expertise in {self.strongest_domain} is particularly impressive!"
        elif self.accuracy >= 75:
            return f"Great job, {self.user_name}! You've earned {self.total_points_earned} points and shown strong knowledge in {self.strongest_domain}. Keep practicing {self.weakest_domain} to become even more skilled!"
        elif self.accuracy >= 60:
            return f"Good effort, {self.user_name}! You've earned {self.total_points_earned} points and are making solid progress. Focus on strengthening your knowledge in {self.weakest_domain} for even better results next time!"
        else:
            return f"Thank you for completing this assessment, {self.user_name}! You've earned {self.total_points_earned} points. We recommend focusing on {self.weakest_domain} to build your confidence and knowledge!"

def load_questions(db: Session, domain=None, difficulty=None, exclude_ids=None, limit=10):
    """
    Load questions from the database based on domain and difficulty
    
    Args:
        db: Database session
        domain: Domain to filter by
        difficulty: Difficulty level to filter by
        exclude_ids: List of question IDs to exclude
        limit: Maximum number of questions to return
        
    Returns:
        List of Question objects
    """
    query = db.query(Question)
    
    # Apply filters if provided
    if domain:
        query = query.filter(Question.domain == domain)
    
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    
    if exclude_ids:
        query = query.filter(~Question.id.in_(exclude_ids))
    
    # Order by ID for consistency
    query = query.order_by(Question.id)
    
    # Limit results
    if limit:
        query = query.limit(limit)
    
    return query.all()

def load_random_question(db: Session, domain=None, difficulty=None, exclude_ids=None):
    """
    Load a single random question from the database
    
    Args:
        db: Database session
        domain: Domain to filter by
        difficulty: Difficulty level to filter by
        exclude_ids: List of question IDs to exclude
        
    Returns:
        Single Question object or None if no matching questions
    """
    questions = load_questions(
        db=db,
        domain=domain,
        difficulty=difficulty,
        exclude_ids=exclude_ids,
        limit=None  # No limit as we're selecting randomly
    )
    
    if not questions:
        return None
    
    return random.choice(questions)

def get_domains(db: Session):
    """
    Get a list of all domains in the database
    
    Args:
        db: Database session
        
    Returns:
        List of domain strings
    """
    domains = db.query(Question.domain).distinct().all()
    return [domain[0] for domain in domains if domain[0]]

def get_question_by_id(db: Session, question_id):
    """
    Get a specific question by ID
    
    Args:
        db: Database session
        question_id: ID of the question to retrieve
        
    Returns:
        Question object or None
    """
    return db.query(Question).filter(Question.id == question_id).first()

def get_question_counts_by_domain(db: Session):
    """
    Get the count of questions for each domain
    
    Args:
        db: Database session
        
    Returns:
        Dictionary with domain names as keys and counts as values
    """
    results = db.query(Question.domain, func.count(Question.id)).group_by(Question.domain).all()
    return {domain: count for domain, count in results if domain}

def get_next_difficulty_level(db: Session, domain: str, current_difficulty: int, correct: bool):
    """
    Determine the next difficulty level based on performance
    
    Args:
        db: Database session
        domain: The domain of questions
        current_difficulty: Current difficulty level
        correct: Whether the last answer was correct
        
    Returns:
        Next difficulty level (int)
    """
    # Get the number of questions available at each difficulty level
    difficulty_counts = db.query(Question.difficulty, func.count(Question.id))\
        .filter(Question.domain == domain)\
        .group_by(Question.difficulty)\
        .all()
    
    difficulty_counts = {diff: count for diff, count in difficulty_counts}
    
    # If correct, try to increase difficulty
    if correct:
        # Check if there are questions at next difficulty level
        next_difficulty = min(current_difficulty + 1, 5)  # Max difficulty is 5
        if next_difficulty in difficulty_counts and difficulty_counts[next_difficulty] > 0:
            return next_difficulty
        
        # If no questions at next level, try even higher levels
        for diff in range(next_difficulty + 1, 6):
            if diff in difficulty_counts and difficulty_counts[diff] > 0:
                return diff
    else:
        # If incorrect, decrease difficulty
        next_difficulty = max(current_difficulty - 1, 1)  # Min difficulty is 1
        if next_difficulty in difficulty_counts and difficulty_counts[next_difficulty] > 0:
            return next_difficulty
        
        # If no questions at lower level, try even lower levels
        for diff in range(next_difficulty - 1, 0, -1):
            if diff in difficulty_counts and difficulty_counts[diff] > 0:
                return diff
    
    # If no appropriate difficulty level found, stay at current level
    return current_difficulty

def get_domain_questions_count(db: Session, domain: str):
    """
    Get the total count of questions for a specific domain
    
    Args:
        db: Database session
        domain: The domain to count questions for
        
    Returns:
        Integer count of questions
    """
    return db.query(func.count(Question.id)).filter(Question.domain == domain).scalar()

def get_question_difficulty_distribution(db: Session, domain: str):
    """
    Get the distribution of questions by difficulty level for a domain
    
    Args:
        db: Database session
        domain: The domain to analyze
        
    Returns:
        Dictionary with difficulty levels as keys and counts as values
    """
    results = db.query(Question.difficulty, func.count(Question.id))\
        .filter(Question.domain == domain)\
        .group_by(Question.difficulty)\
        .all()
    
    return {difficulty: count for difficulty, count in results}

def get_random_question_with_adaptive_difficulty(
    db: Session, 
    domain: str, 
    user_performance: float, 
    exclude_ids: List[int] = None,
    max_questions_per_domain: int = 10
):
    """
    Get a question with adaptive difficulty based on user performance
    
    Args:
        db: Session
        domain: The domain to get a question for
        user_performance: A float between 0 and 1 representing user's performance
        exclude_ids: List of question IDs to exclude
        max_questions_per_domain: Maximum number of questions to ask in this domain
        
    Returns:
        (Question, finished) where Question is the next question or None if domain is finished,
        and finished is a boolean indicating if we've reached the max questions or proficiency
    """
    if exclude_ids is None:
        exclude_ids = []
    
    # Check if we've already asked max questions for this domain
    if len(exclude_ids) >= max_questions_per_domain:
        return None, True
    
    # Map performance to difficulty level (1-5)
    # Performance 0.0-0.2 -> Difficulty 1
    # Performance 0.2-0.4 -> Difficulty 2
    # Performance 0.4-0.6 -> Difficulty 3
    # Performance 0.6-0.8 -> Difficulty 4
    # Performance 0.8-1.0 -> Difficulty 5
    target_difficulty = min(5, max(1, math.ceil(user_performance * 5)))
    
    # Get questions of target difficulty
    questions = load_questions(
        db=db,
        domain=domain,
        difficulty=target_difficulty,
        exclude_ids=exclude_ids,
        limit=None  # No limit as we're selecting randomly
    )
    
    # If no questions at target difficulty, try adjacent difficulties
    if not questions:
        # Try easier questions
        easier_diff = max(1, target_difficulty - 1)
        questions = load_questions(
            db=db,
            domain=domain,
            difficulty=easier_diff,
            exclude_ids=exclude_ids,
            limit=None
        )
        
        # If still no questions, try harder questions
        if not questions:
            harder_diff = min(5, target_difficulty + 1)
            questions = load_questions(
                db=db,
                domain=domain,
                difficulty=harder_diff,
                exclude_ids=exclude_ids,
                limit=None
            )
    
    # If still no questions, try any difficulty
    if not questions:
        questions = load_questions(
            db=db,
            domain=domain,
            exclude_ids=exclude_ids,
            limit=None
        )
    
    # If no questions available, this domain is finished
    if not questions:
        return None, True
    
    # Select a random question
    question = random.choice(questions)
    
    # Check if this is the last question
    is_last = len(exclude_ids) + 1 >= max_questions_per_domain
    
    return question, is_last

def update_user_performance(
    db: Session, 
    user_id: int, 
    domain: str, 
    is_correct: bool, 
    difficulty: int
):
    """
    Update the user performance record for a domain
    
    Args:
        db: Database session
        user_id: The user ID
        domain: The domain
        is_correct: Whether the question was answered correctly
        difficulty: The difficulty of the question
    """
    # Get or create user domain progress
    progress = db.query(UserDomainProgress)\
        .filter(
            UserDomainProgress.user_id == user_id,
            UserDomainProgress.domain == domain
        )\
        .first()
    
    if not progress:
        progress = UserDomainProgress(
            user_id=user_id,
            domain=domain,
            current_difficulty=difficulty,
            questions_answered=0,
            questions_correct=0,
            performance_score=0.5,  # Start at neutral performance
            total_points=0,
            mastered=False,
            proficiency_level=1
        )
        db.add(progress)
    
    # Update progress
    progress.questions_answered += 1
    if is_correct:
        progress.questions_correct += 1
    
    # Update performance score - weighted moving average
    # 80% of previous score, 20% of new result
    progress.performance_score = (progress.performance_score * 0.8) + (1.0 if is_correct else 0.0) * 0.2
    
    # Update difficulty level based on performance
    progress.current_difficulty = get_next_difficulty_level(
        db=db,
        domain=domain,
        current_difficulty=difficulty,
        correct=is_correct
    )
    
    # Check if mastered based on performance score and questions answered
    if progress.performance_score >= 0.9 and progress.questions_answered >= 10:
        progress.mastered = True
    
    # Update proficiency level based on performance score
    if progress.performance_score >= 0.9:
        progress.proficiency_level = 5
    elif progress.performance_score >= 0.8:
        progress.proficiency_level = 4
    elif progress.performance_score >= 0.7:
        progress.proficiency_level = 3
    elif progress.performance_score >= 0.6:
        progress.proficiency_level = 2
    else:
        progress.proficiency_level = 1
    
    db.commit()
    
    return progress

def get_user_name(user_id: int, db: Session) -> str:
    """
    Get a user's name for personalized feedback
    
    Args:
        user_id: The user ID
        db: Database session
        
    Returns:
        User's name or "Student" if not found
    """
    # This would query the user table
    # For now, return a placeholder
    return "Student"

def generate_answer_feedback(
    db: Session,
    question: Question,
    user_answer: str,
    user_id: int,
    domain: str,
    current_difficulty: int
) -> AnswerFeedback:
    """
    Generate personalized feedback for a question answer
    
    Args:
        db: Database session
        question: The question answered
        user_answer: The user's answer
        user_id: The user's ID
        domain: The question domain
        current_difficulty: Current difficulty level
        
    Returns:
        AnswerFeedback object
    """
    is_correct = question.is_correct_answer(user_answer)
    
    # Update user performance
    progress = update_user_performance(
        db=db,
        user_id=user_id,
        domain=domain,
        is_correct=is_correct,
        difficulty=question.difficulty
    )
    
    # Get personalized message
    if is_correct:
        personal_message = get_positive_feedback_message(question.difficulty)
        explanation = get_positive_explanation(question.difficulty, domain)
    else:
        personal_message = get_supportive_feedback_message(question.difficulty)
        explanation = get_correction_explanation(question.difficulty, domain)
    
    # Return feedback
    return AnswerFeedback(
        correct=is_correct,
        correct_answer=question.correct_answer,
        personal_message=personal_message,
        teaching_explanation=explanation,
        next_difficulty=progress.current_difficulty
    )

def get_positive_feedback_message(difficulty):
    """Get a positive feedback message based on difficulty"""
    if difficulty <= 2:
        return "Good job! That's correct."
    elif difficulty <= 4:
        return "Excellent work! That's the right answer."
    else:
        return "Outstanding! That's a challenging question and you nailed it."

def get_supportive_feedback_message(difficulty):
    """Get a supportive feedback message based on difficulty"""
    if difficulty <= 2:
        return "That's not quite right, but it's a good effort."
    elif difficulty <= 4:
        return "That's not correct, but this was a challenging question."
    else:
        return "That's not the right answer, but this was a very difficult question that many people struggle with."

def get_positive_explanation(difficulty, domain):
    """Generate a positive explanation based on difficulty and domain"""
    if domain == "Child Development":
        return "Understanding child development is crucial for creating appropriate learning environments."
    elif domain == "Classroom Management":
        return "Effective classroom management creates a positive learning environment for all children."
    elif domain == "Assessment":
        return "Quality assessment helps educators track progress and adjust their teaching strategies."
    elif domain == "Building Chapters":
        return "Understanding the Building Chapters framework helps create a cohesive learning environment."
    else:
        return "Your understanding of this area will help you become a more effective educator."

def get_correction_explanation(difficulty, domain):
    """Generate a correction explanation based on difficulty and domain"""
    if domain == "Child Development":
        return "When considering child development, remember that each child develops at their own pace."
    elif domain == "Classroom Management":
        return "Effective classroom management requires consistency and positive reinforcement."
    elif domain == "Assessment":
        return "Quality assessment should be ongoing, objective, and used to inform teaching practices."
    elif domain == "Building Chapters":
        return "The Building Chapters framework provides structure for understanding child development and teaching practices."
    else:
        return "Don't worry about getting this wrong - learning is a process, and each question helps build your knowledge."