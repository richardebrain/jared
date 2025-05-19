"""
Question loader module for the assessment system
This module provides functions to load questions from the database
"""

import random
import logging
from typing import List, Dict, Tuple, Optional, Any
from sqlalchemy import func, and_, or_
from sqlalchemy.orm import Session

from .models import Question, UserPerformance

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("question_loader")

# Constants for adaptive assessment
MAX_DIFFICULTY = 5  # Maximum difficulty level
MIN_PROFICIENCY_QUESTIONS = 10  # Minimum number of questions to determine proficiency
PROFICIENCY_THRESHOLD = 0.8  # Percentage correct to be considered proficient
DOMAIN_ORDER = [
    "Child Development",
    "Classroom Management", 
    "Curriculum Planning",
    "Family Engagement",
    "Health & Safety",
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
    
    # Order randomly and limit
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
        count = db.query(Question).filter(Question.domain == domain).count()
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
    if correct:
        # If answered correctly, potentially increase difficulty
        if current_difficulty < MAX_DIFFICULTY:
            # Check if there are questions available at higher difficulty
            next_difficulty = current_difficulty + 1
            count = db.query(Question).filter(
                Question.domain == domain,
                Question.difficulty == next_difficulty
            ).count()
            
            # If no questions at next difficulty, stay at current
            if count == 0:
                return current_difficulty
            return next_difficulty
        return current_difficulty
    else:
        # If answered incorrectly, decrease difficulty or stay at level 1
        return max(1, current_difficulty - 1)

def get_domain_questions_count(db: Session, domain: str):
    """
    Get the total count of questions for a specific domain
    
    Args:
        db: Database session
        domain: The domain to count questions for
        
    Returns:
        Integer count of questions
    """
    return db.query(Question).filter(Question.domain == domain).count()

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
    
    for difficulty in range(1, MAX_DIFFICULTY + 1):
        count = db.query(Question).filter(
            Question.domain == domain,
            Question.difficulty == difficulty
        ).count()
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
    if exclude_ids is None:
        exclude_ids = []
    
    # Check if we've reached the maximum questions for this domain
    if len(exclude_ids) >= max_questions_per_domain:
        logger.info(f"Reached max questions ({max_questions_per_domain}) for domain {domain}")
        return None, True
    
    # Determine target difficulty based on user performance
    if user_performance < 0.3:
        target_difficulty = 1
    elif user_performance < 0.5:
        target_difficulty = 2
    elif user_performance < 0.7:
        target_difficulty = 3
    elif user_performance < 0.9:
        target_difficulty = 4
    else:
        target_difficulty = 5
    
    # Try to get a question at the target difficulty first
    question = load_random_question(
        db=db,
        domain=domain,
        difficulty=target_difficulty,
        exclude_ids=exclude_ids
    )
    
    # If no question at target difficulty, try adjacent difficulties
    if not question:
        # Try difficulties in this order: target-1, target+1, target-2, target+2, ...
        for diff_offset in range(1, MAX_DIFFICULTY):
            for sign in [-1, 1]:
                diff = target_difficulty + (sign * diff_offset)
                if 1 <= diff <= MAX_DIFFICULTY:
                    question = load_random_question(
                        db=db,
                        domain=domain,
                        difficulty=diff,
                        exclude_ids=exclude_ids
                    )
                    if question:
                        break
            if question:
                break
    
    # If we still don't have a question, get any question in this domain
    if not question:
        question = load_random_question(
            db=db,
            domain=domain,
            exclude_ids=exclude_ids
        )
    
    # Check if user has reached proficiency threshold with enough questions
    proficient = False
    if user_performance >= PROFICIENCY_THRESHOLD and len(exclude_ids) >= MIN_PROFICIENCY_QUESTIONS:
        proficient = True
        logger.info(f"User reached proficiency in domain {domain} with performance {user_performance}")
    
    finished = proficient or question is None
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
    # Get or create user performance record
    performance = db.query(UserPerformance).filter(
        UserPerformance.user_id == user_id,
        UserPerformance.domain == domain
    ).first()
    
    if not performance:
        performance = UserPerformance(
            user_id=user_id,
            domain=domain,
            questions_attempted=0,
            questions_correct=0,
            highest_difficulty=1,
            is_proficient=False
        )
        db.add(performance)
    
    # Update stats
    performance.questions_attempted += 1
    if is_correct:
        performance.questions_correct += 1
    
    # Update highest difficulty reached if needed
    if difficulty > performance.highest_difficulty:
        performance.highest_difficulty = difficulty
    
    # Check for proficiency
    performance_ratio = performance.calculate_performance()
    if (
        performance_ratio >= PROFICIENCY_THRESHOLD and 
        performance.questions_attempted >= MIN_PROFICIENCY_QUESTIONS
    ):
        performance.is_proficient = True
    
    db.commit()
    return performance

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
    is_correct = user_answer.strip().lower() == question.answer.strip().lower()
    
    # Update user performance
    update_user_performance(
        db=db,
        user_id=user_id,
        domain=domain,
        is_correct=is_correct,
        difficulty=current_difficulty
    )
    
    # Calculate next difficulty
    next_difficulty = get_next_difficulty_level(
        db=db,
        domain=domain,
        current_difficulty=current_difficulty,
        correct=is_correct
    )
    
    # Generate personalized message
    if is_correct:
        personal_message = get_positive_feedback_message(current_difficulty)
        explanation = get_positive_explanation(current_difficulty, question.domain)
    else:
        personal_message = get_supportive_feedback_message(current_difficulty)
        explanation = get_correction_explanation(current_difficulty, question.domain)
    
    # Get enhanced content for additional explanation if available
    enhanced_content = question.get_enhanced_content()
    if enhanced_content and "explanation" in enhanced_content:
        explanation = enhanced_content["explanation"]
    
    return AnswerFeedback(
        correct=is_correct,
        correct_answer=question.answer,
        personal_message=personal_message,
        teaching_explanation=explanation,
        next_difficulty=next_difficulty
    )

def get_positive_feedback_message(difficulty):
    """Get a positive feedback message based on difficulty"""
    difficulty_tier = min(3, (difficulty + 1) // 2)  # 1-2 -> tier 1, 3-4 -> tier 2, 5 -> tier 3
    
    tier_1 = [
        "Great job!",
        "That's correct!",
        "Perfect answer!",
        "You got it!",
        "Excellent work!"
    ]
    
    tier_2 = [
        "Impressive knowledge!",
        "You're showing great understanding!",
        "Excellent mastery of this concept!",
        "Outstanding work on this challenging question!",
        "Your expertise is showing!"
    ]
    
    tier_3 = [
        "Expert-level understanding!",
        "Remarkable knowledge of advanced concepts!",
        "You've mastered this challenging material!",
        "Phenomenal work on this difficult question!",
        "Your expertise in early childhood education is impressive!"
    ]
    
    if difficulty_tier == 1:
        return random.choice(tier_1)
    elif difficulty_tier == 2:
        return random.choice(tier_2)
    else:
        return random.choice(tier_3)

def get_supportive_feedback_message(difficulty):
    """Get a supportive feedback message based on difficulty"""
    difficulty_tier = min(3, (difficulty + 1) // 2)
    
    tier_1 = [
        "That's not quite right, but it's a great learning opportunity!",
        "Let's review this concept together.",
        "Not exactly, but you're on the right track to understanding.",
        "That's not correct, but don't worry - this is how we learn!",
        "Let's look at this from another angle."
    ]
    
    tier_2 = [
        "This is a tricky concept, but you're making progress!",
        "That's not the right answer, but this is challenging material.",
        "You're tackling difficult content - let's review this concept.",
        "This is advanced material - let's clarify this topic.",
        "That's not correct, but these concepts take time to master."
    ]
    
    tier_3 = [
        "This is expert-level material, and it takes practice to master.",
        "You're tackling very advanced concepts - let's break it down.",
        "This is challenging even for experienced educators.",
        "That's not right, but you're engaging with complex concepts.",
        "These advanced topics often require multiple exposures to master."
    ]
    
    if difficulty_tier == 1:
        return random.choice(tier_1)
    elif difficulty_tier == 2:
        return random.choice(tier_2)
    else:
        return random.choice(tier_3)

def get_positive_explanation(difficulty, domain):
    """Generate a positive explanation based on difficulty and domain"""
    base_explanations = {
        "Child Development": "Your understanding of child development principles is fundamental to effective teaching.",
        "Classroom Management": "Strong classroom management knowledge helps create a positive learning environment.",
        "Curriculum Planning": "Understanding curriculum design principles ensures engaging, developmentally appropriate activities.",
        "Family Engagement": "Effective family partnership strategies strengthen the home-school connection.",
        "Health & Safety": "Health and safety knowledge is essential for maintaining a secure environment.",
        "Observation & Assessment": "Strong assessment skills help you understand each child's unique needs.",
        "Professionalism": "Professional development knowledge contributes to your continuous growth as an educator."
    }
    
    domain_explanation = base_explanations.get(
        domain, 
        "Your early childhood education knowledge helps provide quality care and education."
    )
    
    if difficulty >= 4:
        return f"Excellent! {domain_explanation} Your mastery of advanced concepts in this area will enhance your teaching practice."
    elif difficulty >= 2:
        return f"Well done! {domain_explanation} You're building strong knowledge in this area."
    else:
        return f"Great job! {domain_explanation} You're building a solid foundation of knowledge."

def get_correction_explanation(difficulty, domain):
    """Generate a correction explanation based on difficulty and domain"""
    base_explanations = {
        "Child Development": "Understanding child development principles is key to meeting children's individual needs.",
        "Classroom Management": "Effective classroom management strategies create a supportive learning environment.",
        "Curriculum Planning": "Thoughtful curriculum design ensures meaningful learning experiences.",
        "Family Engagement": "Strong family partnerships support children's holistic development.",
        "Health & Safety": "Knowledge of health and safety practices protects children in your care.",
        "Observation & Assessment": "Effective assessment informs individualized teaching strategies.",
        "Professionalism": "Professional growth contributes to program quality and personal development."
    }
    
    domain_explanation = base_explanations.get(
        domain, 
        "Early childhood education knowledge helps you provide quality care and education."
    )
    
    if difficulty >= 4:
        return f"This advanced concept can be challenging. {domain_explanation} Let's review this material to strengthen your expertise."
    elif difficulty >= 2:
        return f"This is an important concept to understand. {domain_explanation} Reviewing this topic will enhance your teaching practice."
    else:
        return f"This is a key concept to master. {domain_explanation} Let's clarify this topic."

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
        return {
            "learning_path": self.learning_path,
            "domain_scores": self.domain_scores,
            "questions_asked": self.questions_asked,
            "questions_correct": self.questions_correct,
            "strongest_domain": self.strongest_domain,
            "weakest_domain": self.weakest_domain,
            "user_name": self.user_name,
            "total_points_earned": self.total_points_earned
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
            "q_type": self.q_type,
            "options": self.options,
            "domain": self.domain,
            "difficulty": self.difficulty,
            "enhanced_content": self.enhanced_content
        }