"""
Question loader module for the assessment system
This module provides functions to load questions from the database
"""

import json
import logging
import random
from typing import List, Dict, Any, Tuple, Optional, Union

from sqlalchemy import func, desc, or_, and_
from sqlalchemy.orm import Session

from .models import Question, UserPerformance, AssessmentResult

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("loader")

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
    
    # Apply domain filter if provided
    if domain:
        query = query.filter(Question.domain == domain)
    
    # Apply difficulty filter if provided
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    
    # Exclude questions if IDs provided
    if exclude_ids:
        query = query.filter(~Question.id.in_(exclude_ids))
    
    # Order by ID to ensure consistent results
    query = query.order_by(func.random()).limit(limit)
    
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
    results = db.query(Question.domain, func.count(Question.id)).group_by(Question.domain).all()
    return {domain: count for domain, count in results}

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
    # Get the distribution of questions by difficulty for this domain
    difficulties = get_question_difficulty_distribution(db, domain)
    
    # If answered correctly, increase difficulty or stay at max
    if correct:
        next_level = min(current_difficulty + 1, 5)
    else:
        # If answered incorrectly, decrease difficulty or stay at min
        next_level = max(current_difficulty - 1, 1)
    
    # Ensure there are questions at the next level
    while next_level not in difficulties or difficulties.get(next_level, 0) == 0:
        if correct:
            next_level -= 1
            if next_level < 1:
                next_level = 1
                break
        else:
            next_level += 1
            if next_level > 5:
                next_level = 5
                break
    
    return next_level

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
    
    # If we've already asked the maximum number of questions, consider domain finished
    if len(exclude_ids) >= max_questions_per_domain:
        return None, True
    
    # Calculate target difficulty based on user performance
    # More proficient users get harder questions
    if user_performance < 0.2:
        target_difficulty = 1
    elif user_performance < 0.4:
        target_difficulty = 2
    elif user_performance < 0.6:
        target_difficulty = 3
    elif user_performance < 0.8:
        target_difficulty = 4
    else:
        target_difficulty = 5
    
    # Get the distribution of questions by difficulty for this domain
    difficulties = get_question_difficulty_distribution(db, domain)
    
    # If there are no questions at the target difficulty, find the closest available difficulty
    if target_difficulty not in difficulties or difficulties.get(target_difficulty, 0) == 0:
        available_difficulties = sorted(difficulties.keys())
        if not available_difficulties:
            return None, True  # No questions available in this domain
        
        # Find closest available difficulty
        target_difficulty = min(available_difficulties, key=lambda x: abs(x - target_difficulty))
    
    # Get a random question at the target difficulty
    question = load_random_question(
        db=db,
        domain=domain,
        difficulty=target_difficulty,
        exclude_ids=exclude_ids
    )
    
    # If no question is available at this difficulty, try any difficulty
    if not question:
        question = load_random_question(
            db=db,
            domain=domain,
            exclude_ids=exclude_ids
        )
    
    # If still no question, we've exhausted this domain
    if not question:
        return None, True
    
    # Check if we should consider this domain "finished" based on user performance
    # If user is highly proficient (0.9+) and has answered at least 5 questions, we can move on
    finished = user_performance >= 0.9 and len(exclude_ids) >= 5
    
    return question, finished

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
    # Find or create performance record
    performance = db.query(UserPerformance).filter(
        UserPerformance.user_id == user_id,
        UserPerformance.domain == domain
    ).first()
    
    if not performance:
        performance = UserPerformance(
            user_id=user_id,
            domain=domain,
            proficiency=0.0,
            questions_attempted=0,
            questions_correct=0,
            highest_difficulty=0,
            last_difficulty=1
        )
        db.add(performance)
    
    # Update the performance record
    performance.update_performance(is_correct, difficulty)
    
    # Commit the changes
    db.commit()
    
    return performance.to_dict()

def get_user_name(user_id: int, db: Session) -> str:
    """
    Get a user's name for personalized feedback
    
    Args:
        user_id: The user ID
        db: Database session
        
    Returns:
        User's name or "Student" if not found
    """
    # In a real implementation, this would query the user table
    # For now, just return a generic name
    return "Student"

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
    # Check if answer is correct
    is_correct = question.is_correct(user_answer)
    
    # Get the correct answer
    correct_answer = question.answer
    
    # Determine next difficulty level
    next_difficulty = get_next_difficulty_level(db, domain, current_difficulty, is_correct)
    
    # Update user performance
    update_user_performance(db, user_id, domain, is_correct, current_difficulty)
    
    # Get user's name
    user_name = get_user_name(user_id, db)
    
    # Generate a personalized message based on correctness
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
    
    # Create and return the feedback object
    return AnswerFeedback(
        correct=is_correct,
        correct_answer=correct_answer,
        personal_message=personal_message,
        teaching_explanation=explanation,
        next_difficulty=next_difficulty
    )

def get_positive_feedback_message(difficulty):
    """Get a positive feedback message based on difficulty"""
    if difficulty <= 2:
        messages = [
            "Good job! That's correct!",
            "Well done! You got it right!",
            "Correct! You're doing great!",
            "That's right! Keep up the good work!"
        ]
    elif difficulty <= 4:
        messages = [
            "Excellent work! That was a tricky one!",
            "Great job! That question was challenging!",
            "Impressive! You handled that difficult question well!",
            "Outstanding! You're mastering these concepts!"
        ]
    else:
        messages = [
            "Remarkable! That was an expert-level question!",
            "Phenomenal! You're showing true mastery!",
            "Exceptional! That's the kind of understanding we aim for!",
            "Superb! You're demonstrating professional-level knowledge!"
        ]
    
    return random.choice(messages)

def get_supportive_feedback_message(difficulty):
    """Get a supportive feedback message based on difficulty"""
    if difficulty <= 2:
        messages = [
            "That's not quite right, but you're learning!",
            "Not correct, but that's how we learn!",
            "That's not the answer we're looking for, but keep trying!",
            "Not quite, but don't worry - learning takes practice!"
        ]
    elif difficulty <= 4:
        messages = [
            "That's a challenging question! Let's review the correct answer.",
            "Not quite right, but this was a tough one!",
            "That's not correct, but these advanced concepts take time to master.",
            "Not the right answer, but you're tackling difficult material!"
        ]
    else:
        messages = [
            "That's not correct, but even experts struggle with these concepts!",
            "Not right, but this is expert-level material you're engaging with!",
            "That's not the answer, but few get these advanced questions right on first try!",
            "Not correct, but you're working at a very advanced level!"
        ]
    
    return random.choice(messages)

def get_positive_explanation(difficulty, domain):
    """Generate a positive explanation based on difficulty and domain"""
    base_explanations = {
        "Child Development": "Your understanding of child development principles is strong. ",
        "Classroom Management": "You demonstrate good knowledge of classroom management strategies. ",
        "Curriculum Planning": "Your curriculum planning knowledge is on point. ",
        "Family Engagement": "You show solid understanding of family engagement practices. ",
        "Health and Safety": "Your grasp of health and safety protocols is excellent. ",
        "Inclusive Practices": "You demonstrate strong knowledge of inclusive practices. ",
        "Professional Development": "Your professional development knowledge is well-rounded. "
    }
    
    base = base_explanations.get(domain, "Your understanding of this topic is solid. ")
    
    if difficulty <= 2:
        return base + "Continue building on these foundational concepts."
    elif difficulty <= 4:
        return base + "You're successfully applying more advanced concepts in this area."
    else:
        return base + "You're demonstrating mastery of complex concepts in this field."

def get_correction_explanation(difficulty, domain):
    """Generate a correction explanation based on difficulty and domain"""
    base_explanations = {
        "Child Development": "When thinking about child development, remember that ",
        "Classroom Management": "For effective classroom management, consider that ",
        "Curriculum Planning": "In curriculum planning, it's important to know that ",
        "Family Engagement": "When working with families, remember that ",
        "Health and Safety": "For proper health and safety practices, understand that ",
        "Inclusive Practices": "In creating inclusive environments, consider that ",
        "Professional Development": "For professional growth, keep in mind that "
    }
    
    base = base_explanations.get(domain, "Remember that ")
    
    if difficulty <= 2:
        return base + "mastering these foundational concepts will help you build a strong knowledge base."
    elif difficulty <= 4:
        return base + "these intermediate concepts connect to the fundamentals and help you develop deeper understanding."
    else:
        return base + "these advanced concepts reflect the complexity of real-world educational settings and expertise."

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
    
    def to_dict(self):
        """Convert to dictionary for API response"""
        return {
            "learning_path": self.learning_path,
            "domain_scores": self.domain_scores,
            "questions_asked": self.questions_asked,
            "questions_correct": self.questions_correct,
            "strongest_domain": self.strongest_domain,
            "weakest_domain": self.weakest_domain,
            "user_name": self.user_name,
            "total_points_earned": self.total_points_earned,
            "overall_score": (self.questions_correct / self.questions_asked * 100) if self.questions_asked > 0 else 0
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
        self.enhanced_content = enhanced_content or {}
    
    def to_dict(self):
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "question": self.question,
            "type": self.q_type,
            "options": self.options,
            "domain": self.domain,
            "difficulty": self.difficulty,
            "enhanced_content": self.enhanced_content
        }