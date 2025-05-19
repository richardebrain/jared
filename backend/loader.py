"""
MentorMe adaptive question loading and assessment module
This module handles the logic for selecting questions based on user ability
"""
import random
import uuid
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple, Union, cast

from sqlalchemy import func, or_, and_, desc
from sqlalchemy.orm import Session

from .models import (
    Question,
    User,
    Answer,
    Domain,
    UserDomainProgress,
    LearningPathRecommendation,
    AnswerFeedback
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("mentorme.loader")


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
    
    # Apply filters
    if domain:
        query = query.filter(Question.domain == domain)
    
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    
    # Get a random sample
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
    domain_records = db.query(Domain.name).distinct().all()
    return [domain[0] for domain in domain_records]


def get_domain_stats(db: Session, domain: str) -> Dict[str, Any]:
    """
    Get statistics about a specific domain
    
    Args:
        db: Database session
        domain: Domain to get statistics for
        
    Returns:
        Dictionary with domain statistics
    """
    # Check if domain exists
    domain_record = db.query(Domain).filter(Domain.name == domain).first()
    if not domain_record:
        return {}
    
    # Count total questions
    total_questions = db.query(Question).filter(Question.domain == domain).count()
    
    # Get distribution by difficulty
    difficulty_query = db.query(
        Question.difficulty, 
        func.count(Question.id).label('count')
    ).filter(
        Question.domain == domain
    ).group_by(
        Question.difficulty
    ).all()
    
    difficulty_distribution = {difficulty: count for difficulty, count in difficulty_query}
    
    # Get sub-domains if any
    sub_domains_query = db.query(Question.sub_domain).filter(
        Question.domain == domain,
        Question.sub_domain.is_not(None)
    ).distinct().all()
    
    sub_domains = [sub_domain[0] for sub_domain in sub_domains_query if sub_domain[0]]
    
    return {
        "total_questions": total_questions,
        "difficulty_distribution": difficulty_distribution,
        "sub_domains": sub_domains
    }


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
    # Convert inputs to Python types to avoid SQLAlchemy type issues
    domain_val = str(domain) if domain else None
    difficulty_val = int(difficulty) if difficulty is not None else None
    exclude_ids_val = [int(id) for id in exclude_ids] if exclude_ids else []
    
    query = db.query(Question)
    
    # Apply filters
    if domain_val:
        query = query.filter(Question.domain == domain_val)
    
    if difficulty_val:
        query = query.filter(Question.difficulty == difficulty_val)
    
    if exclude_ids_val:
        query = query.filter(Question.id.notin_(exclude_ids_val))
    
    # Get a random question
    question_count = query.count()
    
    if question_count == 0:
        return None
    
    random_offset = random.randint(0, question_count - 1)
    question = query.offset(random_offset).first()
    
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
    # Get user's current progress in this domain
    progress = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == user_id,
        UserDomainProgress.domain == domain
    ).first()
    
    if not progress:
        # Start at difficulty level 1
        difficulty = 1
    else:
        # Use current level from progress
        difficulty = progress.current_level
    
    # Get previously seen question IDs
    prev_question_ids = [answer["question_id"] for answer in prev_answers]
    
    # Check if assessment should end (10 correct or 15 total)
    correct_count = sum(1 for answer in prev_answers if answer.get("is_correct", False))
    total_count = len(prev_answers)
    
    if correct_count >= 10 or total_count >= 15:
        return None  # Assessment complete
    
    # Get a random question at the appropriate difficulty level
    question = get_random_question(
        db=db,
        domain=domain,
        difficulty=difficulty,
        exclude_ids=prev_question_ids
    )
    
    # If no question found at current difficulty, try adjusting
    if not question:
        # Try one level higher or lower
        if difficulty > 1:
            question = get_random_question(
                db=db,
                domain=domain,
                difficulty=difficulty - 1,
                exclude_ids=prev_question_ids
            )
        
        if not question:
            question = get_random_question(
                db=db,
                domain=domain,
                exclude_ids=prev_question_ids
            )
    
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
        return None
    
    # Check if user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        # Create user if needed
        user = User(id=user_id, username=f"user_{user_id}")
        db.add(user)
        db.flush()
    
    # Check if the answer is correct
    is_correct = question.is_correct(answer)
    
    # Calculate points earned
    points_earned = question.points_value if is_correct else 0
    
    # Generate a session ID if not exists
    # We'll use a simple approach here but in production you'd track the session properly
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
    
    # Update user's performance metrics
    next_difficulty = update_user_performance(
        db=db,
        user_id=user_id,
        domain=question.domain,
        difficulty=question.difficulty,
        is_correct=is_correct,
        points_earned=points_earned
    )
    
    # Create feedback with appropriate message
    message = get_success_message(difficulty=question.difficulty) if is_correct else get_encouragement_message()
    
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
        next_difficulty=next_difficulty
    )
    
    db.commit()
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
    # Get or create user progress record
    progress = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == user_id,
        UserDomainProgress.domain == domain
    ).first()
    
    next_difficulty = difficulty  # Default to stay at same level
    
    if not progress:
        # Create new progress record
        progress = UserDomainProgress(
            user_id=user_id,
            domain=domain,
            current_level=difficulty,
            questions_attempted=1,
            questions_correct=1 if is_correct else 0,
            total_points=points_earned,
            highest_difficulty=difficulty
        )
        db.add(progress)
    else:
        # Update existing progress
        progress.questions_attempted += 1
        if is_correct:
            progress.questions_correct += 1
        
        progress.total_points += points_earned
        
        # Update highest difficulty if needed
        if difficulty > progress.highest_difficulty:
            progress.highest_difficulty = difficulty
        
        # Adaptive difficulty logic
        if is_correct:
            # Consecutive correct answers increase difficulty
            consecutive_correct = db.query(Answer).filter(
                Answer.user_id == user_id,
                Answer.is_correct.is_(True)
            ).order_by(
                Answer.created_at.desc()
            ).limit(3).count()
            
            if consecutive_correct >= 3 and difficulty < 5:
                next_difficulty = difficulty + 1
                progress.current_level = next_difficulty
        else:
            # Consecutive wrong answers decrease difficulty
            consecutive_wrong = db.query(Answer).filter(
                Answer.user_id == user_id,
                Answer.is_correct.is_(False)
            ).order_by(
                Answer.created_at.desc()
            ).limit(3).count()
            
            if consecutive_wrong >= 3 and difficulty > 1:
                next_difficulty = difficulty - 1
                progress.current_level = next_difficulty
    
    # Update last activity
    progress.last_activity = datetime.utcnow()
    
    return next_difficulty


def get_success_message(difficulty: int) -> str:
    """
    Get a success message based on difficulty
    
    Args:
        difficulty: Question difficulty level
        
    Returns:
        Success message
    """
    level1_messages = [
        "Great job! That's correct.",
        "Well done! You got it right.",
        "Excellent! That's the right answer.",
        "Perfect! You're doing great.",
        "Correct! Keep up the good work."
    ]
    
    level2_messages = [
        "Excellent work! That was a good one.",
        "Nice job! You're showing good knowledge.",
        "Well done! That's the right answer.",
        "Correct! You've got this concept down.",
        "Great! You're mastering these concepts."
    ]
    
    level3_messages = [
        "Outstanding! That was a challenging one.",
        "Impressive! You really know this material.",
        "Excellent work! That's not an easy question.",
        "Well done! You're showing depth of knowledge.",
        "Great job! You're demonstrating mastery."
    ]
    
    level4_messages = [
        "Incredible! That was quite difficult.",
        "Wow! You really know your stuff.",
        "Exceptional! That's exactly right.",
        "Outstanding work! That was a tough one.",
        "Excellent! Your knowledge is impressive."
    ]
    
    level5_messages = [
        "Amazing! That's a master-level answer.",
        "Phenomenal! You've truly mastered this topic.",
        "Brilliant! That was one of our toughest questions.",
        "Exceptional! You're performing at an expert level.",
        "Outstanding! Your knowledge is truly impressive."
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


def get_encouragement_message() -> str:
    """
    Get a random encouragement message for incorrect answers
    
    Returns:
        Encouragement message
    """
    messages = [
        "Not quite, but don't give up! Try another question.",
        "That's not correct, but keep going! Everyone is still learning.",
        "Not this time, but you're making progress!",
        "That's not right, but mistakes help us learn!",
        "Not correct, but keep practicing! You'll get it.",
        "Not quite right. Stay positive and keep learning!",
        "That answer isn't correct, but don't get discouraged!",
        "Not exactly. Remember, every attempt is a learning opportunity!",
        "That's not the answer we're looking for, but keep trying!",
        "Not right this time, but you're growing with each question!"
    ]
    
    return random.choice(messages)


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
        self.questions_asked = questions_asked
        self.questions_correct = questions_correct
        self.strongest_domain = strongest_domain
        self.weakest_domain = weakest_domain
        self.user_name = user_name
        self.total_points_earned = total_points_earned
        self.recommendations: List[Dict[str, Any]] = []
    
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
    """
    Generate a personalized learning path for a user
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        LearningPath object with recommendations
    """
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        # Create a placeholder learning path if user doesn't exist
        return LearningPath(user_id=user_id)
    
    # Get user's progress across all domains
    progress_records = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == user_id
    ).all()
    
    # Get total stats
    total_answers = db.query(Answer).filter(Answer.user_id == user_id).count()
    correct_answers = db.query(Answer).filter(
        Answer.user_id == user_id,
        Answer.is_correct.is_(True)
    ).count()
    total_points = sum(p.total_points for p in progress_records)
    
    # Find strongest and weakest domains
    strongest_domain = ""
    weakest_domain = ""
    strongest_accuracy = 0.0
    weakest_accuracy = 1.0
    
    for progress in progress_records:
        if progress.questions_attempted > 0:
            accuracy = progress.questions_correct / progress.questions_attempted
            
            if accuracy > strongest_accuracy:
                strongest_accuracy = accuracy
                strongest_domain = progress.domain
            
            if accuracy < weakest_accuracy:
                weakest_accuracy = accuracy
                weakest_domain = progress.domain
    
    # Create learning path
    path = LearningPath(
        user_id=user_id,
        questions_asked=total_answers,
        questions_correct=correct_answers,
        strongest_domain=strongest_domain,
        weakest_domain=weakest_domain,
        user_name=user.username,
        total_points_earned=total_points
    )
    
    # Generate recommendations
    if weakest_domain:
        # Focus on the weakest domain
        path.recommendations.append({
            "type": "focus_area",
            "domain": weakest_domain,
            "message": f"You might want to focus on {weakest_domain} to improve your understanding."
        })
        
        # Get some specific questions in the weak area
        weak_questions = db.query(Question).filter(
            Question.domain == weakest_domain
        ).order_by(
            func.random()
        ).limit(3).all()
        
        for question in weak_questions:
            path.recommendations.append({
                "type": "practice_question",
                "question_id": question.id,
                "domain": question.domain,
                "difficulty": question.difficulty,
                "message": f"Try this {question.domain} question to build your skills."
            })
    
    # Add recommendation to try new domains if user hasn't tried all domains
    all_domains = get_distinct_domains(db)
    tried_domains = [p.domain for p in progress_records]
    untried_domains = [d for d in all_domains if d not in tried_domains]
    
    if untried_domains:
        # Suggest exploring a new domain
        domain_to_try = random.choice(untried_domains)
        path.recommendations.append({
            "type": "new_domain",
            "domain": domain_to_try,
            "message": f"Try exploring {domain_to_try} to expand your knowledge."
        })
    
    # Add general learning resource recommendations
    path.recommendations.append({
        "type": "resource",
        "domain": "General",
        "title": "Daily Practice",
        "message": "Regular practice is key to mastery. Try to answer at least 10 questions daily."
    })
    
    # Add stretch goal for proficient domains
    if strongest_domain:
        path.recommendations.append({
            "type": "challenge",
            "domain": strongest_domain,
            "message": f"Challenge yourself with higher difficulty questions in {strongest_domain}."
        })
    
    return path