"""
MentorMe adaptive question loading and assessment module
This module handles the logic for selecting questions based on user ability
"""

import logging
import random
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

from sqlalchemy import func, desc, asc, and_, or_
from sqlalchemy.orm import Session

from backend.models import Question, UserAnswer, UserDomainProgress, Domain, AnswerFeedback

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def load_questions(
    db: Session,
    domain: Optional[str] = None,
    difficulty: Optional[int] = None,
    limit: int = 10
) -> List[Question]:
    """
    Load questions based on domain and difficulty
    
    Args:
        db: Database session
        domain: Domain to filter by (optional)
        difficulty: Difficulty level to filter by (optional)
        limit: Maximum number of questions to return
        
    Returns:
        List of questions
    """
    query = db.query(Question)
    
    # Apply domain filter if provided
    if domain:
        domain_obj = db.query(Domain).filter(Domain.name == domain).first()
        if domain_obj:
            query = query.filter(Question.domain_id == domain_obj.id)
    
    # Apply difficulty filter if provided
    if difficulty is not None:
        query = query.filter(Question.difficulty == difficulty)
    
    # Order by random and limit
    questions = query.order_by(func.random()).limit(limit).all()
    
    return questions

def get_distinct_domains(db: Session) -> List[str]:
    """
    Get a list of all distinct domains in the database
    
    Args:
        db: Database session
        
    Returns:
        List of domain names
    """
    domains = db.query(Domain.name).all()
    return [domain[0] for domain in domains]

def get_domain_stats(db: Session, domain: str) -> Dict[str, Any]:
    """
    Get statistics about a specific domain
    
    Args:
        db: Database session
        domain: Domain to get statistics for
        
    Returns:
        Dictionary with domain statistics
    """
    domain_obj = db.query(Domain).filter(Domain.name == domain).first()
    if not domain_obj:
        return {"error": f"Domain '{domain}' not found"}
    
    # Get question counts by difficulty
    difficulty_counts = db.query(
        Question.difficulty,
        func.count(Question.id).label('count')
    ).filter(
        Question.domain_id == domain_obj.id
    ).group_by(
        Question.difficulty
    ).all()
    
    # Get total questions count
    total_questions = db.query(func.count(Question.id)).filter(
        Question.domain_id == domain_obj.id
    ).scalar()
    
    # Format difficulty counts
    difficulty_stats = {}
    for difficulty, count in difficulty_counts:
        difficulty_stats[str(difficulty)] = count
    
    # Prepare result
    result = {
        "domain": domain_obj.name,
        "description": domain_obj.description,
        "total_questions": total_questions,
        "difficulty_distribution": difficulty_stats
    }
    
    return result

def get_random_question(
    db: Session,
    domain: Optional[str] = None,
    difficulty: Optional[int] = None,
    exclude_ids: Optional[List[int]] = None
) -> Optional[Question]:
    """
    Get a random question based on domain and difficulty
    
    Args:
        db: Database session
        domain: Domain to filter by (optional)
        difficulty: Difficulty level to filter by (optional)
        exclude_ids: List of question IDs to exclude (optional)
        
    Returns:
        Random question or None if no questions available
    """
    query = db.query(Question)
    
    # Apply domain filter if provided
    if domain:
        domain_obj = db.query(Domain).filter(Domain.name == domain).first()
        if domain_obj:
            query = query.filter(Question.domain_id == domain_obj.id)
    
    # Apply difficulty filter if provided
    if difficulty is not None:
        query = query.filter(Question.difficulty == difficulty)
    
    # Exclude specified question IDs
    if exclude_ids:
        query = query.filter(~Question.id.in_(exclude_ids))
    
    # Get count of matching questions
    count = query.count()
    
    if count == 0:
        # If no questions match the criteria, try with a different difficulty level
        if difficulty is not None:
            # First try one level lower
            if difficulty > 1:
                return get_random_question(db, domain, difficulty - 1, exclude_ids)
            # If that fails, try one level higher
            else:
                return get_random_question(db, domain, difficulty + 1, exclude_ids)
        # If no questions in domain at all
        return None
    
    # Get a random question
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
    Get the next question for an adaptive assessment
    
    Args:
        db: Database session
        user_id: User ID
        domain: Assessment domain
        prev_answers: List of previous answers in this assessment session
        
    Returns:
        Next assessment question or None if assessment complete
    """
    # Get user domain progress or create if it doesn't exist
    progress = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == user_id,
        UserDomainProgress.domain.has(name=domain)
    ).first()
    
    if not progress:
        # Create new progress record
        domain_obj = db.query(Domain).filter(Domain.name == domain).first()
        if not domain_obj:
            logger.error(f"Domain '{domain}' not found")
            return None
        
        progress = UserDomainProgress(
            user_id=user_id,
            domain_id=domain_obj.id,
            current_level=1,
            questions_attempted=0,
            questions_correct=0,
            streak=0,
            highest_streak=0,
            total_points=0
        )
        db.add(progress)
        db.commit()
    
    # Update progress with last activity
    progress.last_activity = datetime.utcnow()
    db.commit()
    
    # Determine the difficulty level based on user progress
    difficulty = progress.current_level
    
    # Get question IDs that have already been asked in this session
    exclude_ids = [answer.get('question_id') for answer in prev_answers if answer.get('question_id')]
    
    # Check if we've reached the assessment limit
    if len(prev_answers) >= 15:  # Maximum of 15 questions per assessment
        return None
    
    # Get a random question of appropriate difficulty
    question = get_random_question(db, domain, difficulty, exclude_ids)
    
    # If no questions available at current difficulty, try to find questions at other difficulties
    if not question:
        logger.warning(f"No questions available for domain '{domain}' at difficulty level {difficulty}")
        # Try one level higher
        question = get_random_question(db, domain, difficulty + 1, exclude_ids)
        if not question:
            # Try one level lower
            if difficulty > 1:
                question = get_random_question(db, domain, difficulty - 1, exclude_ids)
    
    return question

def submit_answer_and_update(
    db: Session,
    user_id: int,
    question_id: int,
    answer: str,
    time_taken: Optional[int] = None
) -> Optional[AnswerFeedback]:
    """
    Submit an answer and update user progress
    
    Args:
        db: Database session
        user_id: User ID
        question_id: Question ID
        answer: User's answer
        time_taken: Time taken to answer in seconds (optional)
        
    Returns:
        AnswerFeedback object or None if question not found
    """
    # Get the question
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        logger.error(f"Question with ID {question_id} not found")
        return None
    
    # Check if the answer is correct
    is_correct = answer.upper() == question.correct_answer.upper()
    
    # Calculate points earned
    points_earned = question.points_for_difficulty if is_correct else 0
    
    # Create a new UserAnswer record
    session_id = str(uuid.uuid4())
    user_answer = UserAnswer(
        user_id=user_id,
        question_id=question_id,
        answer=answer,
        is_correct=is_correct,
        time_taken=time_taken,
        points_earned=points_earned,
        session_id=session_id
    )
    db.add(user_answer)
    db.commit()
    
    # Update user's progress
    next_difficulty = update_user_performance(
        db, 
        user_id, 
        question.domain.name, 
        question.difficulty, 
        is_correct, 
        points_earned
    )
    
    # Create feedback
    if is_correct:
        message = get_success_message(question.difficulty)
    else:
        message = get_encouragement_message()
    
    feedback = AnswerFeedback(
        is_correct=is_correct,
        points_earned=points_earned,
        explanation=question.explanation,
        next_difficulty=next_difficulty,
        resources=question.resources,
        message=message
    )
    
    return feedback

def update_user_performance(
    db: Session,
    user_id: int,
    domain: str,
    difficulty: int,
    is_correct: bool,
    points_earned: int
) -> int:
    """
    Update user performance metrics after answering a question
    
    Args:
        db: Database session
        user_id: User ID
        domain: Question domain
        difficulty: Question difficulty
        is_correct: Whether the answer was correct
        points_earned: Points earned for this answer
        
    Returns:
        Next difficulty level for the user
    """
    # Get the domain object
    domain_obj = db.query(Domain).filter(Domain.name == domain).first()
    if not domain_obj:
        logger.error(f"Domain '{domain}' not found")
        return difficulty
    
    # Get or create user domain progress
    progress = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == user_id,
        UserDomainProgress.domain_id == domain_obj.id
    ).first()
    
    if not progress:
        progress = UserDomainProgress(
            user_id=user_id,
            domain_id=domain_obj.id,
            current_level=1,
            questions_attempted=0,
            questions_correct=0,
            streak=0,
            highest_streak=0,
            total_points=0
        )
        db.add(progress)
        db.commit()
    
    # Update basic stats
    progress.questions_attempted += 1
    if is_correct:
        progress.questions_correct += 1
    
    # Update total points
    progress.total_points += points_earned
    
    # Update streak
    if is_correct:
        progress.streak += 1
        if progress.streak > progress.highest_streak:
            progress.highest_streak = progress.streak
    else:
        progress.streak = 0
    
    # Update last activity timestamp
    progress.last_activity = datetime.utcnow()
    
    # Determine next difficulty level based on performance
    next_difficulty = progress.current_level
    
    # Adaptive difficulty adjustment
    if is_correct and progress.streak >= 3 and progress.current_level == difficulty:
        # If user correctly answers 3 questions in a row at their current level, 
        # increase the difficulty
        next_difficulty = min(5, progress.current_level + 1)
        progress.current_level = next_difficulty
        progress.streak = 0  # Reset streak after level change
    elif not is_correct and progress.questions_attempted > 3 and progress.proficiency < 0.4:
        # If user is performing poorly (less than 40% correct), decrease difficulty
        # but never below level 1
        if progress.current_level > 1:
            next_difficulty = progress.current_level - 1
            progress.current_level = next_difficulty
            progress.streak = 0  # Reset streak after level change
    
    db.commit()
    
    return next_difficulty

def get_success_message(difficulty: int) -> str:
    """
    Get a success message based on difficulty
    
    Args:
        difficulty: Question difficulty level
        
    Returns:
        Success message
    """
    success_messages = {
        1: [
            "Great job! That's correct!",
            "Perfect! You've got it!",
            "Absolutely right!",
            "Well done! That's correct!"
        ],
        2: [
            "Excellent work! That was a good one!",
            "Very well done! You're getting the hang of this!",
            "That's right! You're showing solid knowledge!"
        ],
        3: [
            "Impressive! That was a challenging question!",
            "Outstanding work! That was not an easy one!",
            "Excellent thinking! That was a tough question!"
        ],
        4: [
            "Remarkable! That was quite difficult!",
            "Exceptional work! You're mastering advanced concepts!",
            "Brilliant! You're handling expert-level questions!"
        ],
        5: [
            "Exceptional! You've mastered even the most difficult concepts!",
            "Extraordinary! That was a master-level question!",
            "Incredible work! You're at the top of your field!"
        ]
    }
    
    # Default to level 3 messages if difficulty is out of range
    messages = success_messages.get(difficulty, success_messages[3])
    return random.choice(messages)

def get_encouragement_message() -> str:
    """
    Get a random encouragement message for incorrect answers
    
    Returns:
        Encouragement message
    """
    encouragement_messages = [
        "Not quite right, but you're learning!",
        "That's not correct, but don't worry - learning is a journey!",
        "Not that one, but you'll get it next time!",
        "Almost! Keep going, you're making progress!",
        "Not quite, but every attempt helps build your knowledge!",
        "That's not it, but making mistakes is part of the learning process!",
        "Not correct, but you're getting closer to mastery!",
        "That's not the right answer, but your effort counts!"
    ]
    
    return random.choice(encouragement_messages)

class LearningPath:
    """Learning path recommendation class"""
    
    def __init__(
        self,
        user_id: int,
        questions_asked: int = 0,
        questions_correct: int = 0,
        strongest_domain: str = "",
        weakest_domain: str = "",
        user_name: str = "User",
        total_points_earned: int = 0
    ):
        self.user_id = user_id
        self.user_name = user_name
        self.questions_asked = questions_asked
        self.questions_correct = questions_correct
        self.strongest_domain = strongest_domain
        self.weakest_domain = weakest_domain
        self.total_points_earned = total_points_earned
        self.recommended_videos = []
        self.recommended_assessments = []
        self.bear_bucks = total_points_earned // 50  # 50 points = 1 Bear Buck
        
        # Dynamic messages based on performance
        self.proficiency_rate = (questions_correct / questions_asked) if questions_asked > 0 else 0
        
        if self.proficiency_rate >= 0.8:
            self.performance_message = f"Excellent work, {user_name}! You're demonstrating mastery with {int(self.proficiency_rate * 100)}% correct answers."
        elif self.proficiency_rate >= 0.6:
            self.performance_message = f"Good progress, {user_name}! You've answered {int(self.proficiency_rate * 100)}% of questions correctly."
        elif self.proficiency_rate >= 0.4:
            self.performance_message = f"You're on the right track, {user_name}. Keep practicing to improve your {int(self.proficiency_rate * 100)}% success rate."
        else:
            self.performance_message = f"Keep going, {user_name}! Every question helps you learn, even if your current success rate is {int(self.proficiency_rate * 100)}%."
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "user_id": self.user_id,
            "user_name": self.user_name,
            "questions_asked": self.questions_asked,
            "questions_correct": self.questions_correct,
            "proficiency_rate": self.proficiency_rate,
            "strongest_domain": self.strongest_domain,
            "weakest_domain": self.weakest_domain,
            "total_points_earned": self.total_points_earned,
            "bear_bucks": self.bear_bucks,
            "performance_message": self.performance_message,
            "recommended_videos": self.recommended_videos,
            "recommended_assessments": self.recommended_assessments
        }

def generate_learning_path(db: Session, user_id: int) -> LearningPath:
    """
    Generate a personalized learning path for a user
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        LearningPath object with recommendations
    """
    # Get the user's answers
    user_answers = db.query(UserAnswer).filter(UserAnswer.user_id == user_id).all()
    
    # Count total questions and correct answers
    questions_asked = len(user_answers)
    questions_correct = sum(1 for answer in user_answers if answer.is_correct)
    
    # Calculate total points earned
    total_points = sum(answer.points_earned for answer in user_answers)
    
    # Get user's domain progress
    domain_progress = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == user_id
    ).all()
    
    # Find strongest and weakest domains
    strongest_domain = ""
    weakest_domain = ""
    
    if domain_progress:
        # Only consider domains with at least 5 attempts
        active_domains = [p for p in domain_progress if p.questions_attempted >= 5]
        
        if active_domains:
            # Find strongest domain (highest proficiency)
            strongest = max(active_domains, key=lambda p: p.proficiency)
            strongest_domain = strongest.domain.name if strongest.domain else ""
            
            # Find weakest domain (lowest proficiency)
            weakest = min(active_domains, key=lambda p: p.proficiency)
            weakest_domain = weakest.domain.name if weakest.domain else ""
    
    # Get user's name if available
    user_name = "User"
    user = db.query("SELECT username FROM users WHERE id = :user_id", {"user_id": user_id}).first()
    if user and hasattr(user, 'username'):
        user_name = user.username
    
    # Create learning path object
    learning_path = LearningPath(
        user_id=user_id,
        questions_asked=questions_asked,
        questions_correct=questions_correct,
        strongest_domain=strongest_domain,
        weakest_domain=weakest_domain,
        user_name=user_name,
        total_points_earned=total_points
    )
    
    # Generate recommendations
    # In a real system, this would be connected to a content recommendation engine
    # For now, we'll just recommend a few assessments based on proficiency
    
    if weakest_domain:
        learning_path.recommended_assessments.append({
            "domain": weakest_domain,
            "reason": "This area needs the most improvement",
            "priority": "high"
        })
    
    # Add the logic for video recommendations here
    # This would typically come from a content database with tagged videos
    
    return learning_path