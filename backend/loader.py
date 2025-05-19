"""
MentorMe adaptive question loading and assessment module
This module handles the logic for selecting questions based on user ability
"""

import random
import logging
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple
from sqlalchemy import func, desc, asc
from sqlalchemy.orm import Session
from backend.models import Question, UserAnswer, UserDomainProgress, Domain, Tag, AnswerFeedback

# Configure logging
logger = logging.getLogger(__name__)

# Constants
MAX_MASTERY_CORRECT = 10  # Number of correct answers needed to consider a domain mastered
MAX_DIFFICULTY = 5  # Maximum difficulty level
MIN_DIFFICULTY = 1  # Minimum difficulty level
MAX_ASSESSMENT_QUESTIONS = 15  # Maximum number of questions in an assessment session
PERFORMANCE_THRESHOLD = 0.8  # Performance threshold for advancing difficulty
DEFAULT_POINTS_PER_QUESTION = 10  # Default points per question
DEFAULT_POINTS_MULTIPLIER = 1.5  # Multiplier for correct answers

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
    query = db.query(Question).filter(Question.is_active == True)
    
    if domain:
        domain_obj = db.query(Domain).filter(Domain.name == domain).first()
        if domain_obj:
            query = query.filter(Question.domain_id == domain_obj.id)
    
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    
    # Get random selection
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
    domains = db.query(Domain).all()
    return [domain.name for domain in domains]

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
    difficulty_counts = (
        db.query(Question.difficulty, func.count(Question.id))
        .filter(Question.domain_id == domain_obj.id)
        .filter(Question.is_active == True)
        .group_by(Question.difficulty)
        .all()
    )
    
    # Get total question count
    total_questions = (
        db.query(func.count(Question.id))
        .filter(Question.domain_id == domain_obj.id)
        .filter(Question.is_active == True)
        .scalar()
    )
    
    # Format the difficulty counts
    difficulty_stats = {}
    for difficulty, count in difficulty_counts:
        difficulty_stats[str(difficulty)] = count
    
    # Get sub-domain stats
    subdomains = (
        db.query(Question.sub_domain, func.count(Question.id))
        .filter(Question.domain_id == domain_obj.id)
        .filter(Question.is_active == True)
        .filter(Question.sub_domain != None)
        .filter(Question.sub_domain != "")
        .group_by(Question.sub_domain)
        .all()
    )
    
    subdomain_stats = {}
    for subdomain, count in subdomains:
        subdomain_stats[subdomain] = count
    
    return {
        "domain": domain_obj.name,
        "description": domain_obj.description,
        "total_questions": total_questions,
        "difficulty_distribution": difficulty_stats,
        "subdomains": subdomain_stats
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
    query = db.query(Question).filter(Question.is_active == True)
    
    if domain:
        domain_obj = db.query(Domain).filter(Domain.name == domain).first()
        if domain_obj:
            query = query.filter(Question.domain_id == domain_obj.id)
    
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    
    if exclude_ids:
        query = query.filter(~Question.id.in_(exclude_ids))
    
    # Get count of matching questions
    count = query.count()
    
    if count == 0:
        return None
    
    # Get random index
    random_index = random.randint(0, count - 1)
    
    # Get question at random index
    question = query.offset(random_index).first()
    
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
    # Check if we've reached the maximum number of questions
    if len(prev_answers) >= MAX_ASSESSMENT_QUESTIONS:
        logger.info(f"Assessment complete for user {user_id} in domain {domain}: reached maximum questions")
        return None
    
    # Create a session ID if this is the first question
    assessment_session = None
    if prev_answers:
        assessment_session = prev_answers[0].get("session_id")
        
        # Check if we have enough correct answers to consider the domain mastered
        correct_answers = sum(1 for answer in prev_answers if answer.get("is_correct", False))
        if correct_answers >= MAX_MASTERY_CORRECT:
            logger.info(f"Assessment complete for user {user_id} in domain {domain}: mastered domain")
            return None
    
    # Get user progress for this domain
    domain_obj = db.query(Domain).filter(Domain.name == domain).first()
    if not domain_obj:
        logger.error(f"Domain {domain} not found")
        return None
    
    progress = (
        db.query(UserDomainProgress)
        .filter(UserDomainProgress.user_id == user_id)
        .filter(UserDomainProgress.domain_id == domain_obj.id)
        .first()
    )
    
    # Get current difficulty level
    current_difficulty = MIN_DIFFICULTY
    if progress:
        current_difficulty = progress.current_level
    
    # Get previous question IDs to exclude
    exclude_ids = [answer.get("question_id") for answer in prev_answers if "question_id" in answer]
    
    # Determine if we should increase difficulty
    should_increase = False
    if prev_answers:
        # Calculate performance on current difficulty level
        current_level_answers = [a for a in prev_answers if a.get("difficulty") == current_difficulty]
        if current_level_answers:
            correct_count = sum(1 for a in current_level_answers if a.get("is_correct", False))
            performance = correct_count / len(current_level_answers)
            if performance >= PERFORMANCE_THRESHOLD and len(current_level_answers) >= 3:
                should_increase = True
                current_difficulty = min(current_difficulty + 1, MAX_DIFFICULTY)
                logger.info(f"Increasing difficulty to {current_difficulty} for user {user_id} in domain {domain}")
    
    # Try to get a question at the current difficulty level
    question = get_random_question(db, domain, current_difficulty, exclude_ids)
    
    # If no question found, try one level lower
    if not question and current_difficulty > MIN_DIFFICULTY:
        question = get_random_question(db, domain, current_difficulty - 1, exclude_ids)
    
    # If still no question found, try any difficulty level
    if not question:
        question = get_random_question(db, domain, None, exclude_ids)
    
    # If we found a question, add the session ID
    if question and not assessment_session:
        assessment_session = str(uuid.uuid4())
        logger.info(f"Created new assessment session {assessment_session} for user {user_id} in domain {domain}")
    
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
        logger.error(f"Question {question_id} not found")
        return None
    
    # Check if the answer is correct
    is_correct = question.is_correct(answer)
    
    # Calculate points earned
    points_earned = 0
    if is_correct:
        points_earned = question.calculate_points(time_taken)
    
    # Create user answer record
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
    next_difficulty = update_user_performance(
        db,
        user_id,
        question.domain.name,
        question.difficulty,
        is_correct,
        points_earned
    )
    
    # Create feedback message
    feedback_message = None
    if is_correct:
        feedback_message = get_success_message(question.difficulty)
    else:
        feedback_message = get_encouragement_message()
    
    # Create answer feedback
    feedback = AnswerFeedback(
        question_id=question.id,
        is_correct=is_correct,
        correct_answer=question.correct_answer,
        points_earned=points_earned,
        explanation=question.explanation,
        feedback_message=feedback_message,
        resources=question.get_resources()
    )
    
    # Commit changes
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
    # Get domain
    domain_obj = db.query(Domain).filter(Domain.name == domain).first()
    if not domain_obj:
        logger.error(f"Domain {domain} not found")
        return difficulty
    
    # Get or create user progress
    progress = (
        db.query(UserDomainProgress)
        .filter(UserDomainProgress.user_id == user_id)
        .filter(UserDomainProgress.domain_id == domain_obj.id)
        .first()
    )
    
    if not progress:
        progress = UserDomainProgress(
            user_id=user_id,
            domain_id=domain_obj.id,
            current_level=difficulty
        )
        db.add(progress)
    
    # Update progress metrics
    progress.questions_answered += 1
    if is_correct:
        progress.questions_correct += 1
    
    # Update performance score
    progress.performance_score = progress.calculate_performance()
    
    # Update points earned
    progress.points_earned += points_earned
    
    # Update last assessment timestamp
    progress.last_assessment = datetime.utcnow()
    
    # Determine if the user should advance to a higher difficulty
    next_level = progress.current_level
    
    # Check if the domain is already mastered
    if progress.mastered:
        db.commit()
        return next_level
    
    # Update streak for consecutive correct answers
    if is_correct:
        progress.streak += 1
    else:
        progress.streak = 0
    
    # Adjust difficulty based on performance
    # Advance if 3+ consecutive correct answers at current level
    if is_correct and progress.streak >= 3 and progress.current_level < MAX_DIFFICULTY:
        next_level = progress.current_level + 1
        progress.current_level = next_level
        progress.streak = 0  # Reset streak after advancing
    
    # Check if mastery achieved (at least 10 correct answers and performance > 80%)
    if (
        progress.questions_correct >= MAX_MASTERY_CORRECT and 
        progress.performance_score >= PERFORMANCE_THRESHOLD and
        progress.current_level >= MAX_DIFFICULTY
    ):
        progress.mastered = True
        logger.info(f"User {user_id} has mastered domain {domain}")
    
    db.commit()
    return next_level

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
            "Well done! You've got the basics covered.",
            "Great job! You're establishing a solid foundation.",
            "That's correct! You're on the right track."
        ],
        2: [
            "Good thinking! You're showing solid understanding.",
            "Excellent work! You're developing valuable knowledge.",
            "You got it! You're building important skills."
        ],
        3: [
            "Fantastic! You're demonstrating strong expertise.",
            "Excellent analysis! Your understanding is impressive.",
            "That's right! You're showing advanced knowledge."
        ],
        4: [
            "Outstanding! You've mastered complex concepts.",
            "Brilliant answer! You're demonstrating expert knowledge.",
            "Superb! You're showing exceptional understanding."
        ],
        5: [
            "Phenomenal! You're operating at a master teacher level.",
            "Exceptional reasoning! Your expertise is truly impressive.",
            "Perfect answer! You're demonstrating mastery of the subject."
        ]
    }
    
    # Get appropriate messages for difficulty level
    messages = success_messages.get(difficulty, success_messages[3])
    
    # Return random message
    return random.choice(messages)

def get_encouragement_message() -> str:
    """
    Get a random encouragement message for incorrect answers
    
    Returns:
        Encouragement message
    """
    encouragement_messages = [
        "Good attempt! Keep building your knowledge in this area.",
        "Not quite, but you're learning! Each question helps you grow.",
        "That's not correct, but don't worry - learning is a journey.",
        "Keep going! Every challenge is an opportunity to learn.",
        "Not this time, but stay positive! You're making progress.",
        "That's not right, but remember: progress comes from practice."
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
        self.accuracy = questions_correct / questions_asked if questions_asked > 0 else 0
        self.strongest_domain = strongest_domain
        self.weakest_domain = weakest_domain
        self.total_points_earned = total_points_earned
        self.recommended_domains = []
        self.recommended_resources = []
        self.messages = []
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "user_id": self.user_id,
            "user_name": self.user_name,
            "questions_asked": self.questions_asked,
            "questions_correct": self.questions_correct,
            "accuracy": self.accuracy,
            "strongest_domain": self.strongest_domain,
            "weakest_domain": self.weakest_domain,
            "total_points_earned": self.total_points_earned,
            "recommended_domains": self.recommended_domains,
            "recommended_resources": self.recommended_resources,
            "messages": self.messages,
            "bear_bucks": self.total_points_earned // 50  # Convert 50 points to 1 Bear Buck
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
    # Get user progress across all domains
    progress_records = (
        db.query(UserDomainProgress)
        .filter(UserDomainProgress.user_id == user_id)
        .all()
    )
    
    # Get user answers
    answers = (
        db.query(UserAnswer)
        .filter(UserAnswer.user_id == user_id)
        .all()
    )
    
    # Create learning path
    learning_path = LearningPath(
        user_id=user_id,
        questions_asked=len(answers),
        questions_correct=sum(1 for a in answers if a.is_correct)
    )
    
    # If no progress, return empty learning path
    if not progress_records:
        learning_path.messages.append("Welcome! Start your learning journey by taking your first assessment.")
        
        # Recommend starter domains
        starter_domains = [
            "Child Development",
            "Guidance",
            "Curriculum Planning"
        ]
        
        # Get available domains
        available_domains = get_distinct_domains(db)
        
        # Recommend domains that exist
        for domain in starter_domains:
            if domain in available_domains:
                learning_path.recommended_domains.append(domain)
        
        return learning_path
    
    # Calculate total points earned
    learning_path.total_points_earned = sum(p.points_earned for p in progress_records)
    
    # Find strongest and weakest domains
    if progress_records:
        # Strongest domain (highest performance score with at least 5 questions answered)
        qualifying_records = [p for p in progress_records if p.questions_answered >= 5]
        if qualifying_records:
            strongest = max(qualifying_records, key=lambda p: p.performance_score)
            learning_path.strongest_domain = strongest.domain.name
        
        # Weakest domain (lowest performance score with at least 5 questions answered)
        if qualifying_records:
            weakest = min(qualifying_records, key=lambda p: p.performance_score)
            learning_path.weakest_domain = weakest.domain.name
    
    # Generate recommendations
    if learning_path.weakest_domain:
        learning_path.recommended_domains.append(learning_path.weakest_domain)
        learning_path.messages.append(f"Focus on improving your understanding of {learning_path.weakest_domain}.")
    
    # Recommend any domains with no progress yet
    all_domains = get_distinct_domains(db)
    domains_with_progress = [p.domain.name for p in progress_records]
    new_domains = [d for d in all_domains if d not in domains_with_progress]
    
    if new_domains:
        # Recommend up to 2 new domains
        for domain in new_domains[:2]:
            if domain not in learning_path.recommended_domains:
                learning_path.recommended_domains.append(domain)
        
        # Add message about exploring new domains
        learning_path.messages.append(f"Explore {new_domains[0]} to broaden your expertise.")
    
    # Add encouragement message based on points
    bear_bucks = learning_path.total_points_earned // 50
    if bear_bucks > 0:
        learning_path.messages.append(f"You've earned {bear_bucks} Bear Bucks! Keep up the good work.")
    
    # Return the learning path
    return learning_path