"""
MentorMe adaptive question loading and assessment module
This module handles the logic for selecting questions based on user ability
"""

import random
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy import func, and_, or_, desc
from sqlalchemy.orm import Session

from backend.models import Question, UserAnswer, UserDomainProgress, AnswerFeedback

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("loader")

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
        query = query.filter(Question.domain == domain)
    
    # Apply difficulty filter if provided
    if difficulty:
        query = query.filter(Question.difficulty == difficulty)
    
    # Limit and return
    return query.limit(limit).all()

def get_distinct_domains(db: Session) -> List[str]:
    """
    Get a list of all distinct domains in the database
    
    Args:
        db: Database session
        
    Returns:
        List of domain names
    """
    domains = db.query(Question.domain).distinct().all()
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
    # Count total questions
    total_questions = db.query(func.count(Question.id)).filter(
        Question.domain == domain
    ).scalar() or 0
    
    # Count questions by difficulty
    difficulty_counts = {}
    for difficulty in range(1, 6):  # Difficulties 1-5
        count = db.query(func.count(Question.id)).filter(
            Question.domain == domain,
            Question.difficulty == difficulty
        ).scalar() or 0
        difficulty_counts[difficulty] = count
    
    # Get subdomain breakdown
    subdomains = db.query(
        Question.sub_domain, 
        func.count(Question.id)
    ).filter(
        Question.domain == domain
    ).group_by(Question.sub_domain).all()
    
    subdomain_counts = {
        subdomain: count for subdomain, count in subdomains if subdomain
    }
    
    return {
        "total_questions": total_questions,
        "difficulty_counts": difficulty_counts,
        "subdomain_counts": subdomain_counts
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
    query = db.query(Question)
    
    # Apply filters
    if domain:
        query = query.filter(Question.domain == domain)
    
    if difficulty is not None:
        query = query.filter(Question.difficulty == difficulty)
    
    if exclude_ids:
        query = query.filter(Question.id.notin_(exclude_ids))
    
    # Get count of matching questions
    count = query.count()
    
    if count == 0:
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
    # Check if we already have enough answers to determine proficiency
    if len(prev_answers) >= 15:
        # After 15 questions, we've gathered enough data
        return None

    # Get the current user progress for this domain
    progress = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == user_id,
        UserDomainProgress.domain == domain
    ).first()
    
    # Create progress record if it doesn't exist
    if not progress:
        progress = UserDomainProgress(
            user_id=user_id,
            domain=domain,
            current_difficulty=1
        )
        db.add(progress)
        db.commit()
        difficulty = 1
    else:
        difficulty = progress.current_difficulty
    
    # Get IDs of previously answered questions in this session
    exclude_ids = [answer["question_id"] for answer in prev_answers if "question_id" in answer]
    
    # Add IDs of previously answered questions from the database (past sessions)
    past_answers = db.query(UserAnswer.question_id).filter(
        UserAnswer.user_id == user_id,
        UserAnswer.domain == domain
    ).all()
    
    exclude_ids.extend([qa[0] for qa in past_answers])
    
    # Try to get a question at the current difficulty level
    question = get_random_question(
        db=db, 
        domain=domain, 
        difficulty=difficulty,
        exclude_ids=exclude_ids
    )
    
    # If no question is available at the current difficulty, try other difficulties
    if not question:
        # Try one level higher
        if difficulty < 5:
            question = get_random_question(
                db=db, 
                domain=domain, 
                difficulty=difficulty + 1,
                exclude_ids=exclude_ids
            )
        
        # If still no question, try one level lower
        if not question and difficulty > 1:
            question = get_random_question(
                db=db, 
                domain=domain, 
                difficulty=difficulty - 1,
                exclude_ids=exclude_ids
            )
        
        # If still no question, try any difficulty
        if not question:
            question = get_random_question(
                db=db, 
                domain=domain,
                exclude_ids=exclude_ids
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
    
    # Check if the answer is correct
    is_correct = question.is_correct(answer)
    
    # Calculate points earned
    # Base points from question, with bonus for higher difficulty levels
    if is_correct:
        points_earned = question.points * (1 + (question.difficulty - 1) * 0.2)
    else:
        points_earned = 0
    
    # Create user answer record
    user_answer = UserAnswer(
        user_id=user_id,
        question_id=question_id,
        answer=answer,
        is_correct=is_correct,
        difficulty=question.difficulty,
        domain=question.domain,
        points_earned=points_earned,
        time_taken=time_taken
    )
    
    db.add(user_answer)
    
    # Update user progress for this domain
    next_difficulty = update_user_performance(
        db, 
        user_id, 
        question.domain,
        question.difficulty,
        is_correct,
        points_earned
    )
    
    # Commit to database
    db.commit()
    
    # Get explanation from enhanced content
    enhanced_content = question.get_enhanced_content()
    explanation = enhanced_content.get("explanation", "")
    
    # Create message based on correctness
    if is_correct:
        message = get_success_message(question.difficulty)
    else:
        message = get_encouragement_message()
    
    # Create personalized feedback based on answer and performance
    personalized_feedback = ""
    if is_correct:
        if question.difficulty >= 3:
            personalized_feedback = "Excellent work tackling this challenging question!"
        else:
            personalized_feedback = "Great job! You're making good progress."
    else:
        personalized_feedback = (
            "Keep going! Learning is a journey. "
            "Remember to review the explanation to deepen your understanding."
        )
    
    # Create next steps recommendation
    next_steps = []
    if not is_correct:
        # Add resource suggestions if available
        if "resources" in enhanced_content and enhanced_content["resources"]:
            resource = enhanced_content["resources"][0]
            next_steps.append(
                f"Check out this resource: {resource['title']}"
            )
        
        next_steps.append("Review the concept and try again")
    else:
        if next_difficulty > question.difficulty:
            next_steps.append(
                f"Great job! You've advanced to a new difficulty level: {next_difficulty}"
            )
        elif question.difficulty >= 4:
            next_steps.append(
                "You're doing excellent on advanced topics! Keep it up!"
            )
        else:
            next_steps.append(
                "Continue practicing to master these concepts"
            )
    
    # Create answer feedback
    feedback = AnswerFeedback(
        question=question,
        user_answer=answer,
        correct_answer=question.correct_answer,
        is_correct=is_correct,
        next_difficulty=next_difficulty,
        explanation=explanation,
        points_earned=points_earned,
        message=message,
        personalized_feedback=personalized_feedback,
        next_steps=next_steps
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
    # Get the user's progress for this domain
    progress = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == user_id,
        UserDomainProgress.domain == domain
    ).first()
    
    # Create a new progress record if it doesn't exist
    if not progress:
        progress = UserDomainProgress(
            user_id=user_id,
            domain=domain,
            current_difficulty=1,
            highest_difficulty=1
        )
        db.add(progress)
    
    # Update the questions answered and correct counts
    progress.questions_answered += 1
    if is_correct:
        progress.questions_correct += 1
    
    # Calculate performance score (0.0 to 1.0)
    if progress.questions_answered > 0:
        progress.performance_score = progress.questions_correct / progress.questions_answered
    
    # Add points earned
    progress.points_earned += points_earned
    
    # Update last assessment time
    progress.last_assessment = func.now()
    
    # Update current difficulty based on performance
    # If user gets 3 in a row correct at current difficulty, move up
    # If user gets 3 in a row incorrect at current difficulty, move down
    current_difficulty = progress.current_difficulty
    
    # Get the last 3 answers for this domain
    recent_answers = db.query(UserAnswer).filter(
        UserAnswer.user_id == user_id,
        UserAnswer.domain == domain
    ).order_by(desc(UserAnswer.created_at)).limit(3).all()
    
    # Count correct and incorrect answers
    if len(recent_answers) >= 3:
        all_correct = all(answer.is_correct for answer in recent_answers)
        all_incorrect = all(not answer.is_correct for answer in recent_answers)
        
        if all_correct and current_difficulty < 5:
            # Move up a difficulty level
            current_difficulty += 1
        elif all_incorrect and current_difficulty > 1:
            # Move down a difficulty level
            current_difficulty -= 1
    
    # Check if the user has mastered the domain
    # Criteria: Answered at least 10 questions with 90% accuracy at highest difficulty (5)
    if (progress.questions_answered >= 10 and 
            progress.performance_score >= 0.9 and 
            current_difficulty == 5):
        progress.mastered = True
        progress.proficiency_level = 5
    # Otherwise, set proficiency level based on performance and difficulty
    elif progress.questions_answered >= 5:
        # Calculate proficiency level (1-5) based on performance and difficulty
        accuracy_factor = min(progress.performance_score * 5, 5)  # 0-5 based on accuracy
        difficulty_factor = current_difficulty  # 1-5 based on difficulty
        
        # Combined factor, weighing difficulty more heavily
        combined_factor = (accuracy_factor * 0.4) + (difficulty_factor * 0.6)
        progress.proficiency_level = min(round(combined_factor), 5)
    
    # Update current difficulty
    progress.current_difficulty = current_difficulty
    
    # Update highest difficulty if needed
    if current_difficulty > progress.highest_difficulty:
        progress.highest_difficulty = current_difficulty
    
    return current_difficulty

def get_success_message(difficulty: int) -> str:
    """
    Get a success message based on difficulty
    
    Args:
        difficulty: Question difficulty level
        
    Returns:
        Success message
    """
    messages = [
        # Level 1
        [
            "Correct! Great job!",
            "That's right! Keep up the good work!",
            "Yes! You got it!",
            "Perfect! You're doing great!"
        ],
        # Level 2
        [
            "Excellent work! You're mastering these concepts!",
            "That's correct! You're showing good understanding!",
            "Right on target! You're making great progress!"
        ],
        # Level 3
        [
            "Outstanding! That was a challenging question!",
            "Impressive! You're tackling advanced concepts well!",
            "Excellent critical thinking! You're really growing!"
        ],
        # Level 4
        [
            "Remarkable insight! You're showing expertise!",
            "Stellar performance! That was quite challenging!",
            "Exceptional work! You're becoming a master of this subject!"
        ],
        # Level 5
        [
            "Extraordinary! You're at expert level now!",
            "Phenomenal! You've mastered even the most difficult concepts!",
            "Incredible! Your understanding is at the highest level!"
        ]
    ]
    
    # Adjust difficulty to 0-based index
    level_index = min(difficulty - 1, 4)
    
    # Select a random message from the appropriate difficulty
    return random.choice(messages[level_index])

def get_encouragement_message() -> str:
    """
    Get a random encouragement message for incorrect answers
    
    Returns:
        Encouragement message
    """
    messages = [
        "Keep trying! Learning comes from every attempt.",
        "Not quite, but you're making progress!",
        "That's not correct, but don't give up!",
        "Close, but not quite there. Let's review and try again!",
        "Every mistake is a stepping stone to success. Keep going!",
        "Not right this time, but you're learning with each question.",
        "That's not the answer we're looking for, but keep at it!",
        "Remember, expertise comes from practice. Let's continue!"
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
        self.user_name = user_name
        self.questions_asked = questions_asked
        self.questions_correct = questions_correct
        self.strongest_domain = strongest_domain
        self.weakest_domain = weakest_domain
        self.recommended_domains = []
        self.next_challenges = []
        self.learning_resources = []
        self.total_points_earned = total_points_earned
        self.proficiency_levels = {}
        self.bear_bucks = total_points_earned // 50  # 50 points = 1 Bear Buck
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        accuracy = 0
        if self.questions_asked > 0:
            accuracy = round((self.questions_correct / self.questions_asked) * 100)
            
        return {
            "user_id": self.user_id,
            "user_name": self.user_name,
            "questions_asked": self.questions_asked,
            "questions_correct": self.questions_correct,
            "accuracy": accuracy,
            "strongest_domain": self.strongest_domain,
            "weakest_domain": self.weakest_domain,
            "recommended_domains": self.recommended_domains,
            "next_challenges": self.next_challenges,
            "learning_resources": self.learning_resources,
            "total_points_earned": self.total_points_earned,
            "bear_bucks": self.bear_bucks,
            "proficiency_levels": self.proficiency_levels
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
    # Get total questions asked and answered correctly
    questions_asked = db.query(func.count(UserAnswer.id)).filter(
        UserAnswer.user_id == user_id
    ).scalar() or 0
    
    questions_correct = db.query(func.count(UserAnswer.id)).filter(
        UserAnswer.user_id == user_id,
        UserAnswer.is_correct == True
    ).scalar() or 0
    
    # Get total points earned
    total_points = db.query(func.sum(UserAnswer.points_earned)).filter(
        UserAnswer.user_id == user_id
    ).scalar() or 0
    
    # Get user's progress across all domains
    domain_progress = db.query(UserDomainProgress).filter(
        UserDomainProgress.user_id == user_id
    ).all()
    
    # Create learning path object
    path = LearningPath(
        user_id=user_id,
        questions_asked=questions_asked,
        questions_correct=questions_correct,
        total_points_earned=total_points
    )
    
    # If no progress yet, recommend general domains
    if not domain_progress:
        # Get available domains
        domains = get_distinct_domains(db)
        
        # Recommend starting with fundamental domains
        path.recommended_domains = domains[:3] if len(domains) >= 3 else domains
        
        # Add some starter challenges
        path.next_challenges = [
            "Start your learning journey by taking an assessment in one of the recommended domains",
            "Try to answer at least 5 questions to establish your baseline"
        ]
        
        return path
    
    # Initialize proficiency levels dictionary
    proficiency_levels = {}
    
    # Find strongest and weakest domains based on performance score
    best_score = -1
    worst_score = 2  # Higher than max possible score of 1.0
    strongest_domain = ""
    weakest_domain = ""
    
    for progress in domain_progress:
        domain = progress.domain
        score = progress.performance_score
        
        # Store proficiency level
        proficiency_levels[domain] = progress.proficiency_level
        
        # Update strongest domain
        if score > best_score and progress.questions_answered >= 5:
            best_score = score
            strongest_domain = domain
            
        # Update weakest domain
        if score < worst_score and progress.questions_answered >= 5:
            worst_score = score
            weakest_domain = domain
    
    path.strongest_domain = strongest_domain
    path.weakest_domain = weakest_domain
    path.proficiency_levels = proficiency_levels
    
    # Generate domain recommendations
    # Look for domains the user hasn't tried yet
    all_domains = get_distinct_domains(db)
    tried_domains = [progress.domain for progress in domain_progress]
    untried_domains = [domain for domain in all_domains if domain not in tried_domains]
    
    # First recommend untried domains
    path.recommended_domains.extend(untried_domains[:2])
    
    # Then recommend the weakest domain if it exists
    if weakest_domain and weakest_domain not in path.recommended_domains:
        path.recommended_domains.append(weakest_domain)
    
    # Generate challenges based on progress
    # Challenge to improve in weakest domain
    if weakest_domain:
        path.next_challenges.append(
            f"Improve your skills in {weakest_domain} by taking another assessment"
        )
    
    # Challenge to reach higher difficulty in strongest domain
    if strongest_domain:
        progress = next((p for p in domain_progress if p.domain == strongest_domain), None)
        if progress and progress.current_difficulty < 5:
            path.next_challenges.append(
                f"Try to reach difficulty level {progress.current_difficulty + 1} in {strongest_domain}"
            )
    
    # Challenge to earn more points
    next_milestone = ((total_points // 100) + 1) * 100
    path.next_challenges.append(
        f"Earn {next_milestone - total_points} more points to reach {next_milestone} total points"
    )
    
    # Add learning resources
    # This would usually be pulled from a resources database
    # For now, add generic resources based on weakest domain
    if weakest_domain:
        path.learning_resources.append({
            "title": f"{weakest_domain} Fundamentals",
            "type": "Article",
            "description": f"A comprehensive overview of key concepts in {weakest_domain}"
        })
        
        path.learning_resources.append({
            "title": f"Mastering {weakest_domain}",
            "type": "Video",
            "description": f"Expert-led tutorial on advanced {weakest_domain} concepts"
        })
    
    return path