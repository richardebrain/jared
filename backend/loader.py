"""
Question loader module for the assessment system
This module provides functions to load questions from the database
"""

import random
import logging
from typing import List, Tuple, Dict, Any, Optional

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
    
    # Apply filters
    if domain:
        query = query.filter(Question.domain == domain)
    
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    
    if exclude_ids:
        query = query.filter(~Question.id.in_(exclude_ids))
    
    # Apply limit and get results
    questions = query.limit(limit).all()
    
    return questions

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
    random_offset = random.randint(0, count - 1)
    question = query.offset(random_offset).first()
    
    return question

def get_domains(db: Session):
    """
    Get a list of all domains in the database
    
    Args:
        db: Database session
        
    Returns:
        List of domain strings
    """
    domains = db.query(Question.domain).distinct().all()
    return [d[0] for d in domains if d[0]]

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
    counts = db.query(Question.domain, func.count(Question.id)) \
        .group_by(Question.domain) \
        .all()
    
    return {domain: count for domain, count in counts if domain}

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
    # Get difficulty range for this domain
    max_difficulty = db.query(func.max(Question.difficulty)) \
        .filter(Question.domain == domain) \
        .scalar() or 5
    
    # Calculate next difficulty
    if correct:
        # If correct, increase difficulty (max 5)
        next_difficulty = min(current_difficulty + 1, max_difficulty)
    else:
        # If incorrect, decrease difficulty (min 1)
        next_difficulty = max(current_difficulty - 1, 1)
    
    return next_difficulty

def get_domain_questions_count(db: Session, domain: str):
    """
    Get the total count of questions for a specific domain
    
    Args:
        db: Database session
        domain: The domain to count questions for
        
    Returns:
        Integer count of questions
    """
    return db.query(Question) \
        .filter(Question.domain == domain) \
        .count()

def get_question_difficulty_distribution(db: Session, domain: str):
    """
    Get the distribution of questions by difficulty level for a domain
    
    Args:
        db: Database session
        domain: The domain to analyze
        
    Returns:
        Dictionary with difficulty levels as keys and counts as values
    """
    counts = db.query(Question.difficulty, func.count(Question.id)) \
        .filter(Question.domain == domain) \
        .group_by(Question.difficulty) \
        .all()
    
    return {difficulty: count for difficulty, count in counts}

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
    # Get difficulty distribution
    difficulty_counts = get_question_difficulty_distribution(db, domain)
    
    # Check if we've asked enough questions
    if exclude_ids and len(exclude_ids) >= max_questions_per_domain:
        return None, True
    
    # Check if we have questions of each difficulty
    difficulty_levels = list(range(1, 6))
    available_difficulties = [d for d in difficulty_levels if d in difficulty_counts and difficulty_counts[d] > 0]
    
    if not available_difficulties:
        return None, True
    
    # Determine target difficulty based on performance
    # Map 0.0-1.0 performance to 1-5 difficulty
    target_difficulty = int(user_performance * 4) + 1
    
    # Try to get a question with target difficulty
    question = load_random_question(db, domain, target_difficulty, exclude_ids)
    
    # If no question at target difficulty, try adjacent difficulties
    if not question:
        # Try difficulties in order of proximity to target
        for diff_offset in range(1, 5):
            # Try higher difficulty
            higher_diff = target_difficulty + diff_offset
            if higher_diff in available_difficulties:
                question = load_random_question(db, domain, higher_diff, exclude_ids)
                if question:
                    break
            
            # Try lower difficulty
            lower_diff = target_difficulty - diff_offset
            if lower_diff in available_difficulties:
                question = load_random_question(db, domain, lower_diff, exclude_ids)
                if question:
                    break
    
    # If still no question, try any difficulty
    if not question:
        question = load_random_question(db, domain, None, exclude_ids)
    
    # If we have a question, we're not finished
    if question:
        return question, False
    
    # If we get here, there are no more questions in this domain
    return None, True

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
    # Find or create user domain progress
    progress = db.query(UserDomainProgress) \
        .filter(
            UserDomainProgress.user_id == user_id,
            UserDomainProgress.domain == domain
        ) \
        .first()
    
    if not progress:
        progress = UserDomainProgress(
            user_id=user_id,
            domain=domain,
            current_difficulty=difficulty,
            questions_answered=0,
            questions_correct=0,
            performance_score=0.5,
            total_points=0
        )
        db.add(progress)
    
    # Update progress
    progress.questions_answered += 1
    if is_correct:
        progress.questions_correct += 1
    
    # Calculate new performance score
    progress.performance_score = progress.questions_correct / progress.questions_answered
    
    # Determine next difficulty level
    progress.current_difficulty = get_next_difficulty_level(
        db, domain, difficulty, is_correct
    )
    
    # Check if domain is mastered (10 correct answers)
    if progress.questions_correct >= 10:
        progress.mastered = True
    
    # Update proficiency level based on performance
    if progress.performance_score >= 0.9:
        progress.proficiency_level = 5  # Expert
    elif progress.performance_score >= 0.8:
        progress.proficiency_level = 4  # Advanced
    elif progress.performance_score >= 0.7:
        progress.proficiency_level = 3  # Intermediate
    elif progress.performance_score >= 0.6:
        progress.proficiency_level = 2  # Basic
    else:
        progress.proficiency_level = 1  # Beginner
    
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
    # This would typically query your user table
    # For now, we'll just return a placeholder
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
    # Check if answer is correct
    is_correct = question.is_correct_answer(user_answer)
    
    # Get user's name
    user_name = get_user_name(user_id, db)
    
    # Generate personalized message
    if is_correct:
        personal_message = get_positive_feedback_message(current_difficulty)
        explanation = get_positive_explanation(current_difficulty, domain)
    else:
        personal_message = get_supportive_feedback_message(current_difficulty)
        explanation = get_correction_explanation(current_difficulty, domain)
    
    # Format with user's name
    personal_message = personal_message.format(name=user_name)
    
    # Determine next difficulty level
    next_difficulty = get_next_difficulty_level(
        db, domain, current_difficulty, is_correct
    )
    
    # Create feedback object
    feedback = AnswerFeedback(
        correct=is_correct,
        correct_answer=question.correct_answer,
        personal_message=personal_message,
        teaching_explanation=explanation,
        next_difficulty=next_difficulty
    )
    
    return feedback

def get_positive_feedback_message(difficulty):
    """Get a positive feedback message based on difficulty"""
    messages = [
        # Easy difficulty (1-2)
        [
            "Great job, {name}! That's correct!",
            "Excellent work, {name}! You're on the right track!",
            "Perfect, {name}! You've got it!",
            "That's right, {name}! Well done!"
        ],
        # Medium difficulty (3)
        [
            "Fantastic work, {name}! That was a challenging question!",
            "Well done, {name}! You're showing great understanding!",
            "Excellent, {name}! That's exactly right!"
        ],
        # Hard difficulty (4-5)
        [
            "Outstanding, {name}! That was a tough question!",
            "Remarkable job, {name}! Your expertise is showing!",
            "Impressive understanding, {name}! That's absolutely correct!"
        ]
    ]
    
    # Select difficulty group
    if difficulty <= 2:
        group = 0  # Easy
    elif difficulty == 3:
        group = 1  # Medium
    else:
        group = 2  # Hard
    
    # Select random message from group
    return random.choice(messages[group])

def get_supportive_feedback_message(difficulty):
    """Get a supportive feedback message based on difficulty"""
    messages = [
        # Easy difficulty (1-2)
        [
            "Not quite, {name}. Let's review this concept.",
            "That's not correct, {name}, but it's a good learning opportunity!",
            "Let's try again, {name}. Here's what you need to know:"
        ],
        # Medium difficulty (3)
        [
            "That's a challenging concept, {name}. Let me explain:",
            "Not quite right, {name}, but you're on the right track!",
            "Let's look at this differently, {name}:"
        ],
        # Hard difficulty (4-5)
        [
            "That's a very challenging question, {name}. Here's the explanation:",
            "Don't worry, {name}, this is advanced material. Let's break it down:",
            "That's not correct, but these complex concepts take time to master, {name}."
        ]
    ]
    
    # Select difficulty group
    if difficulty <= 2:
        group = 0  # Easy
    elif difficulty == 3:
        group = 1  # Medium
    else:
        group = 2  # Hard
    
    # Select random message from group
    return random.choice(messages[group])

def get_positive_explanation(difficulty, domain):
    """Generate a positive explanation based on difficulty and domain"""
    explanations = [
        # Easy difficulty (1-2)
        f"You've demonstrated a solid understanding of basic {domain} concepts.",
        
        # Medium difficulty (3)
        f"Your knowledge of intermediate {domain} principles is excellent.",
        
        # Hard difficulty (4-5)
        f"You've mastered advanced concepts in {domain}. Well done!"
    ]
    
    # Select difficulty group
    if difficulty <= 2:
        return explanations[0]
    elif difficulty == 3:
        return explanations[1]
    else:
        return explanations[2]

def get_correction_explanation(difficulty, domain):
    """Generate a correction explanation based on difficulty and domain"""
    explanations = [
        # Easy difficulty (1-2)
        f"Take another look at the fundamental concepts in {domain}. Remember that mastering the basics is essential.",
        
        # Medium difficulty (3)
        f"This question tests your understanding of intermediate {domain} concepts. Take your time to review this area.",
        
        # Hard difficulty (4-5)
        f"Don't be discouraged! This question covers advanced material in {domain}. These complex concepts take time to master."
    ]
    
    # Select difficulty group
    if difficulty <= 2:
        return explanations[0]
    elif difficulty == 3:
        return explanations[1]
    else:
        return explanations[2]