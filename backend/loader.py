"""
Question loader module for the assessment system
This module provides functions to load questions from the database
"""

import random
import logging
from typing import Dict, List, Any, Optional, Tuple

from sqlalchemy import func, or_, and_
from sqlalchemy.orm import Session

from .models import Question, UserPerformance

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("loader")

# Order of domains in the assessment
DOMAIN_ORDER = [
    "Child Development",
    "Classroom Management",
    "Curriculum Planning",
    "Health & Safety",
    "Family Engagement",
    "Observation & Assessment",
    "Professionalism"
]

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
    
    # Get random questions
    questions = query.order_by(func.random()).limit(limit).all()
    
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
    questions = load_questions(
        db=db, 
        domain=domain, 
        difficulty=difficulty, 
        exclude_ids=exclude_ids, 
        limit=1
    )
    
    return questions[0] if questions else None

def get_domains(db: Session):
    """
    Get a list of all domains in the database
    
    Args:
        db: Database session
        
    Returns:
        List of domain strings
    """
    domains = db.query(Question.domain).distinct().all()
    return [domain[0] for domain in domains]

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
    counts = {}
    domains = get_domains(db)
    
    for domain in domains:
        count = db.query(func.count(Question.id)).filter(Question.domain == domain).scalar()
        counts[domain] = count
    
    return counts

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
    # If answered correctly, increase difficulty (max 5)
    if correct:
        return min(current_difficulty + 1, 5)
    
    # If answered incorrectly, decrease difficulty (min 1)
    return max(current_difficulty - 1, 1)

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
    distribution = {}
    
    for difficulty in range(1, 6):  # Difficulties 1-5
        count = (
            db.query(func.count(Question.id))
            .filter(Question.domain == domain, Question.difficulty == difficulty)
            .scalar()
        )
        distribution[difficulty] = count
    
    return distribution

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
    if not exclude_ids:
        exclude_ids = []
        
    # Count how many questions we've already asked in this domain
    domain_questions_asked = len([
        qid for qid in exclude_ids
        if db.query(Question).filter(Question.id == qid, Question.domain == domain).first()
    ])
    
    # Check if we've reached the maximum number of questions for this domain
    if domain_questions_asked >= max_questions_per_domain:
        return None, True
    
    # Check if we've achieved proficiency (consistently answering correctly at difficulty 4-5)
    if user_performance >= 0.8 and domain_questions_asked >= 8:
        # Consider domain complete if performance is high and we've asked enough questions
        return None, True
    
    # Target difficulty level based on user's performance
    if user_performance < 0.3:
        target_difficulty = 1
    elif user_performance < 0.5:
        target_difficulty = 2
    elif user_performance < 0.7:
        target_difficulty = 3
    elif user_performance < 0.85:
        target_difficulty = 4
    else:
        target_difficulty = 5
    
    # Try to get a question at the target difficulty
    question = load_random_question(
        db=db,
        domain=domain,
        difficulty=target_difficulty,
        exclude_ids=exclude_ids
    )
    
    # If no question at target difficulty, try adjacent difficulties
    if not question:
        # Try one level below, then one level above, then two levels below, etc.
        for diff_offset in [1, -1, 2, -2, 3, -3, 4, -4]:
            new_difficulty = target_difficulty + diff_offset
            if 1 <= new_difficulty <= 5:  # Ensure difficulty is in valid range
                question = load_random_question(
                    db=db,
                    domain=domain,
                    difficulty=new_difficulty,
                    exclude_ids=exclude_ids
                )
                if question:
                    break
    
    # If still no question, get any question in this domain
    if not question:
        question = load_random_question(
            db=db,
            domain=domain,
            exclude_ids=exclude_ids
        )
    
    # If absolutely no questions left for this domain, signal that we're done
    if not question:
        return None, True
    
    return question, False

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
    # Get or create user performance record
    performance = (
        db.query(UserPerformance)
        .filter(
            UserPerformance.user_id == user_id,
            UserPerformance.domain == domain
        )
        .first()
    )
    
    if not performance:
        performance = UserPerformance(
            user_id=user_id,
            domain=domain,
            questions_attempted=0,
            questions_correct=0,
            highest_difficulty=1
        )
        db.add(performance)
    
    # Update stats
    performance.questions_attempted += 1
    if is_correct:
        performance.questions_correct += 1
    
    # Update highest difficulty if applicable
    if is_correct and difficulty > performance.highest_difficulty:
        performance.highest_difficulty = difficulty
    
    db.commit()

class AnswerFeedback:
    """Class to provide personalized feedback for question answers"""
    
    def __init__(
        self, 
        correct: bool, 
        correct_answer: str, 
        personal_message: str, 
        teaching_explanation: str,
        next_difficulty: int = None
    ):
        self.correct = correct
        self.correct_answer = correct_answer
        self.personal_message = personal_message
        self.teaching_explanation = teaching_explanation
        self.next_difficulty = next_difficulty
    
    def to_dict(self):
        """Convert to dictionary for API response"""
        return {
            "correct": self.correct,
            "correct_answer": self.correct_answer,
            "personal_message": self.personal_message,
            "teaching_explanation": self.teaching_explanation,
            "next_difficulty": self.next_difficulty
        }

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
    correct_answer = question.answer
    is_correct = user_answer.strip().lower() == correct_answer.strip().lower()
    
    # Get next difficulty level
    next_difficulty = get_next_difficulty_level(
        db=db,
        domain=domain,
        current_difficulty=current_difficulty,
        correct=is_correct
    )
    
    # Update user performance data
    update_user_performance(
        db=db,
        user_id=user_id,
        domain=domain,
        is_correct=is_correct,
        difficulty=current_difficulty
    )
    
    # Generate personalized feedback message
    if is_correct:
        personal_message = get_positive_feedback_message(current_difficulty)
        explanation = get_positive_explanation(current_difficulty, domain)
    else:
        personal_message = get_supportive_feedback_message(current_difficulty)
        explanation = get_correction_explanation(current_difficulty, domain)
    
    # Add enhanced content if available
    enhanced_content = question.get_enhanced_content()
    if enhanced_content and "explanation" in enhanced_content:
        explanation += "\n\n" + enhanced_content["explanation"]
    
    return AnswerFeedback(
        correct=is_correct,
        correct_answer=correct_answer,
        personal_message=personal_message,
        teaching_explanation=explanation,
        next_difficulty=next_difficulty
    )

def get_positive_feedback_message(difficulty):
    """Get a positive feedback message based on difficulty"""
    easy_messages = [
        "Great job! You've got the fundamentals down.",
        "Correct! That's a solid understanding of the basics.",
        "Excellent! You're showing a good grasp of the foundations."
    ]
    
    medium_messages = [
        "Well done! You're demonstrating good professional knowledge.",
        "Excellent work! Your understanding is becoming more advanced.",
        "That's correct! You're building expertise in this area."
    ]
    
    hard_messages = [
        "Outstanding! That was a challenging question, and you nailed it.",
        "Impressive! You're showing master-level understanding.",
        "Excellent! Your expertise in this area is really shining through."
    ]
    
    if difficulty <= 2:
        return random.choice(easy_messages)
    elif difficulty <= 4:
        return random.choice(medium_messages)
    else:
        return random.choice(hard_messages)

def get_supportive_feedback_message(difficulty):
    """Get a supportive feedback message based on difficulty"""
    easy_messages = [
        "Not quite right, but that's okay! Let's learn together.",
        "Good try! Let's review this fundamental concept.",
        "Almost there! Let's revisit this basic concept."
    ]
    
    medium_messages = [
        "That's a tricky one! Let's review the correct approach.",
        "Good effort on this challenging question! Let's clarify the concept.",
        "This is a more nuanced topic. Let's explore the correct answer."
    ]
    
    hard_messages = [
        "This is an advanced concept that many find challenging. Let's review it together.",
        "That was a tough question! Let's break down the expert-level answer.",
        "Even experienced educators find this challenging. Let's clarify the advanced concept."
    ]
    
    if difficulty <= 2:
        return random.choice(easy_messages)
    elif difficulty <= 4:
        return random.choice(medium_messages)
    else:
        return random.choice(hard_messages)

def get_positive_explanation(difficulty, domain):
    """Generate a positive explanation based on difficulty and domain"""
    if difficulty <= 2:
        return f"You're demonstrating a good foundation in {domain}. These fundamental concepts are essential for effective teaching practices."
    elif difficulty <= 4:
        return f"Your knowledge of {domain} is becoming more refined. This level of understanding helps you make more informed decisions in your classroom."
    else:
        return f"You're showing master-level knowledge in {domain}. This deep understanding allows you to handle complex situations and mentor others effectively."

def get_correction_explanation(difficulty, domain):
    """Generate a correction explanation based on difficulty and domain"""
    if difficulty <= 2:
        return f"Let's strengthen your foundation in {domain}. Understanding these basics will help you build confidence in your teaching practice."
    elif difficulty <= 4:
        return f"This aspect of {domain} can be nuanced. Strengthening your knowledge in this area will enhance your effectiveness as an educator."
    else:
        return f"This represents an advanced concept in {domain}. Mastering these complex ideas will elevate your teaching to a mentor level."

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
        self.user_name = user_name
        self.total_points_earned = total_points_earned
    
    def to_dict(self):
        """Convert to dictionary for API response"""
        # Calculate overall score
        overall_score = 0
        if self.questions_asked > 0:
            overall_score = (self.questions_correct / self.questions_asked) * 100
        
        # Generate personalized message
        if self.user_name:
            greeting = f"Great job, {self.user_name}!"
        else:
            greeting = "Great job!"
            
        return {
            "greeting": greeting,
            "summary": {
                "questions_asked": self.questions_asked,
                "questions_correct": self.questions_correct,
                "overall_score": round(overall_score, 1),
                "points_earned": self.total_points_earned
            },
            "domain_scores": {domain: round(score, 1) for domain, score in self.domain_scores.items()},
            "strongest_domain": self.strongest_domain,
            "weakest_domain": self.weakest_domain,
            "learning_path": self.learning_path
        }

class QuestionResponse:
    """Class to represent a formatted question for API response"""
    
    def __init__(
        self,
        id: int,
        question: str,
        q_type: str,
        options: Dict[str, str],
        domain: str,
        difficulty: int,
        enhanced_content: Dict[str, Any] = None
    ):
        self.id = id
        self.question = question
        self.q_type = q_type
        self.options = options
        self.domain = domain
        self.difficulty = difficulty
        self.enhanced_content = enhanced_content if enhanced_content else {}
    
    def to_dict(self):
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "question": self.question,
            "q_type": self.q_type,
            "options": self.options,
            "domain": self.domain,
            "difficulty": self.difficulty,
            "enhanced_content": self.enhanced_content
        }