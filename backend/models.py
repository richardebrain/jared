"""
Database models for the MentorMe assessment system
"""

import json
import random
from datetime import datetime
from typing import Dict, List, Any, Optional

from sqlalchemy import (
    Column, Integer, String, Text, Boolean, 
    Float, DateTime, ForeignKey, and_, func
)
from sqlalchemy.orm import relationship

from backend.database import Base

class Question(Base):
    """Question model for assessments"""
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    correct_answer = Column(String(255), nullable=False)
    options = Column(Text)  # JSON string of options
    q_type = Column(String(50), nullable=False)  # multiple_choice, true_false, etc.
    difficulty = Column(Integer, nullable=False, default=1)
    domain = Column(String(100), nullable=False, index=True)
    sub_domain = Column(String(100), nullable=True)
    tags = Column(Text)  # JSON string of tags
    enhanced_content = Column(Text)  # JSON string of explanations, hints, etc.
    time_limit = Column(Integer, default=60)  # Time limit in seconds
    points = Column(Integer, default=10)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    answers = relationship("UserAnswer", back_populates="question")
    
    def get_options(self) -> Dict[str, str]:
        """Get options as a dictionary"""
        if self.options:
            try:
                return json.loads(str(self.options))
            except (json.JSONDecodeError, TypeError):
                return {}
        return {}
    
    def get_tags(self) -> List[str]:
        """Get tags as a list"""
        if self.tags:
            try:
                return json.loads(str(self.tags))
            except (json.JSONDecodeError, TypeError):
                return []
        return []
    
    def get_enhanced_content(self) -> Dict[str, Any]:
        """Get enhanced content as a dictionary"""
        if self.enhanced_content:
            try:
                return json.loads(str(self.enhanced_content))
            except (json.JSONDecodeError, TypeError):
                return {}
        return {}
    
    def is_correct(self, answer: str) -> bool:
        """Check if an answer is correct"""
        if self.q_type == "multiple_choice":
            # For multiple choice, just compare the answer directly
            return answer.strip() == self.correct_answer.strip()
        elif self.q_type == "true_false":
            # For true/false, normalize to lowercase and check
            return answer.lower().strip() == self.correct_answer.lower().strip()
        else:
            # For other types, implement custom logic as needed
            return answer.strip() == self.correct_answer.strip()
    
    def get_difficulty_name(self) -> str:
        """Get the difficulty level name"""
        difficulty_names = {
            1: "Foundational",
            2: "Intermediate", 
            3: "Advanced",
            4: "Expert",
            5: "Master"
        }
        return difficulty_names.get(self.difficulty, "Unknown")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "question": self.question,
            "options": self.get_options(),
            "type": self.q_type,
            "difficulty": self.difficulty,
            "difficulty_name": self.get_difficulty_name(),
            "domain": self.domain,
            "sub_domain": self.sub_domain,
            "tags": self.get_tags(),
            "time_limit": self.time_limit,
            "points": self.points,
            "enhanced_content": self.get_enhanced_content(),
        }

class UserAnswer(Base):
    """User answer model for tracking assessment responses"""
    __tablename__ = "user_answers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    difficulty = Column(Integer, nullable=False)
    domain = Column(String(100), nullable=False, index=True)
    points_earned = Column(Integer, default=0)
    time_taken = Column(Integer)  # Time taken in seconds
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    question = relationship("Question", back_populates="answers")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "question_id": self.question_id,
            "answer": self.answer,
            "is_correct": self.is_correct,
            "difficulty": self.difficulty,
            "domain": self.domain,
            "points_earned": self.points_earned,
            "time_taken": self.time_taken,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class UserDomainProgress(Base):
    """User progress model for tracking domain proficiency"""
    __tablename__ = "user_domain_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    domain = Column(String(100), nullable=False, index=True)
    questions_answered = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    performance_score = Column(Float, default=0.0)  # 0.0 to 1.0
    current_difficulty = Column(Integer, default=1)
    highest_difficulty = Column(Integer, default=1)
    mastered = Column(Boolean, default=False)
    proficiency_level = Column(Integer, default=1)  # 1 to 5
    points_earned = Column(Integer, default=0)
    last_assessment = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        # Calculate accuracy percentage
        accuracy = round(self.performance_score * 100) if self.performance_score is not None else 0
        
        return {
            "id": self.id,
            "user_id": self.user_id,
            "domain": self.domain,
            "questions_answered": self.questions_answered,
            "questions_correct": self.questions_correct,
            "accuracy": accuracy,
            "current_difficulty": self.current_difficulty,
            "highest_difficulty": self.highest_difficulty,
            "mastered": self.mastered,
            "proficiency_level": self.proficiency_level,
            "points_earned": self.points_earned,
            "last_assessment": self.last_assessment.isoformat() if self.last_assessment else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class AnswerFeedback:
    """
    Class to provide personalized feedback for answers
    Note: This is not a database model, just a helper class
    """
    def __init__(
        self,
        question: Question,
        user_answer: str,
        correct_answer: str,
        is_correct: bool,
        next_difficulty: int,
        explanation: Optional[str] = None,
        points_earned: int = 0,
        message: Optional[str] = None,
        personalized_feedback: Optional[str] = None,
        next_steps: Optional[List[str]] = None
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
        self.next_steps = next_steps or []
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "is_correct": self.is_correct,
            "correct_answer": self.correct_answer,
            "user_answer": self.user_answer,
            "explanation": self.explanation,
            "points_earned": self.points_earned,
            "next_difficulty": self.next_difficulty,
            "message": self.message,
            "personalized_feedback": self.personalized_feedback,
            "next_steps": self.next_steps,
            "question": self.question.to_dict() if self.question else None,
        }