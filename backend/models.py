"""
Data models for the MentorMe assessment system
"""

import json
import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func

from backend.database import Base

class Question(Base):
    """Question model for assessments"""
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    correct_answer = Column(String(255), nullable=False)
    options = Column(Text)  # JSON string of options
    q_type = Column(String(50), default="multiple_choice")  # multiple_choice, true_false, short_answer
    difficulty = Column(Integer, default=1)  # 1-5
    domain = Column(String(100), index=True)  # Subject domain
    sub_domain = Column(String(100))  # Sub-domain if applicable
    tags = Column(Text)  # JSON array of tags
    enhanced_content = Column(Text)  # JSON with explanations, hints, resources
    time_limit = Column(Integer, default=60)  # Time limit in seconds
    points = Column(Integer, default=10)  # Base points for correct answer
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    def get_options(self) -> Dict[str, str]:
        """Get options as dictionary"""
        if self.options:
            return json.loads(self.options)
        return {}
    
    def get_tags(self) -> List[str]:
        """Get tags as list"""
        if self.tags:
            return json.loads(self.tags)
        return []
    
    def get_enhanced_content(self) -> Dict[str, Any]:
        """Get enhanced content as dictionary"""
        if self.enhanced_content:
            return json.loads(self.enhanced_content)
        return {}
    
    def is_correct(self, answer: str) -> bool:
        """Check if an answer is correct"""
        if self.q_type == "multiple_choice":
            # Case-insensitive comparison for multiple choice
            return answer.strip().upper() == self.correct_answer.strip().upper()
        elif self.q_type == "true_false":
            # Convert to boolean for true/false questions
            user_bool = answer.strip().lower() in ("true", "t", "yes", "y", "1")
            correct_bool = self.correct_answer.strip().lower() in ("true", "t", "yes", "y", "1")
            return user_bool == correct_bool
        else:
            # For short answer, use case-insensitive comparison
            return answer.strip().lower() == self.correct_answer.strip().lower()

    def to_dict(self) -> Dict[str, Any]:
        """Convert question to dictionary format"""
        return {
            "id": self.id,
            "question": self.question,
            "options": self.get_options(),
            "q_type": self.q_type,
            "difficulty": self.difficulty,
            "domain": self.domain,
            "sub_domain": self.sub_domain,
            "tags": self.get_tags(),
            "enhanced_content": self.get_enhanced_content(),
            "time_limit": self.time_limit,
            "points": self.points
        }

class UserAnswer(Base):
    """User answer model to track assessment history"""
    __tablename__ = "user_answers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    answer = Column(String(255), nullable=False)
    is_correct = Column(Boolean, default=False)
    difficulty = Column(Integer)
    domain = Column(String(100), index=True)
    time_taken = Column(Integer)  # Time taken in seconds
    points_earned = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())

    def to_dict(self) -> Dict[str, Any]:
        """Convert user answer to dictionary format"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "question_id": self.question_id,
            "answer": self.answer,
            "is_correct": self.is_correct,
            "difficulty": self.difficulty,
            "domain": self.domain,
            "time_taken": self.time_taken,
            "points_earned": self.points_earned,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class UserDomainProgress(Base):
    """User progress model for each domain"""
    __tablename__ = "user_domain_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    domain = Column(String(100), nullable=False, index=True)
    questions_answered = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    performance_score = Column(Float, default=0.0)  # 0.0 to 1.0
    current_difficulty = Column(Integer, default=1)  # 1-5
    highest_difficulty = Column(Integer, default=1)  # 1-5
    points_earned = Column(Integer, default=0)
    mastered = Column(Boolean, default=False)
    proficiency_level = Column(Integer, default=1)  # 1-5 scale
    last_assessment = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    def to_dict(self) -> Dict[str, Any]:
        """Convert user progress to dictionary format"""
        proficiency_text = "Beginner"
        if self.proficiency_level == 2:
            proficiency_text = "Intermediate"
        elif self.proficiency_level == 3:
            proficiency_text = "Advanced"
        elif self.proficiency_level == 4:
            proficiency_text = "Expert"
        elif self.proficiency_level == 5:
            proficiency_text = "Master"
            
        accuracy = round(self.performance_score * 100)
        
        return {
            "id": self.id,
            "user_id": self.user_id,
            "domain": self.domain,
            "questions_answered": self.questions_answered,
            "questions_correct": self.questions_correct,
            "accuracy": accuracy,
            "current_difficulty": self.current_difficulty,
            "highest_difficulty": self.highest_difficulty,
            "proficiency_level": self.proficiency_level,
            "proficiency_text": proficiency_text,
            "mastered": self.mastered,
            "points_earned": self.points_earned,
            "last_assessment": self.last_assessment.isoformat() if self.last_assessment else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class AnswerFeedback:
    """
    Feedback model for answers (non-database class)
    This is used to provide rich feedback after answers are submitted
    """
    
    def __init__(
        self,
        question: Question,
        user_answer: str,
        correct_answer: str,
        is_correct: bool,
        next_difficulty: int,
        explanation: str,
        points_earned: int,
        message: str,
        personalized_feedback: str,
        next_steps: List[str]
    ):
        self.question = question
        self.user_answer = user_answer
        self.correct_answer = correct_answer
        self.is_correct = is_correct
        self.next_difficulty = next_difficulty
        self.explanation = explanation
        self.points_earned = points_earned
        self.message = message
        self.personalized_feedback = personalized_feedback
        self.next_steps = next_steps
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert feedback to dictionary format"""
        return {
            "question_id": self.question.id,
            "user_answer": self.user_answer,
            "correct_answer": self.correct_answer,
            "is_correct": self.is_correct,
            "next_difficulty": self.next_difficulty,
            "explanation": self.explanation,
            "points_earned": self.points_earned,
            "message": self.message,
            "personalized_feedback": self.personalized_feedback,
            "next_steps": self.next_steps,
            # Include domain information for reference
            "domain": self.question.domain,
            "difficulty": self.question.difficulty
        }