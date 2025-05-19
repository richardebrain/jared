"""
Database models for the MentorMe assessment system
"""

import json
from datetime import datetime
from typing import Dict, List, Optional, Any, Union, Tuple

from sqlalchemy import (
    Column, 
    Integer, 
    String, 
    Text, 
    Boolean, 
    DateTime, 
    Float,
    ForeignKey
)
from sqlalchemy.orm import relationship

from .database import Base

class Question(Base):
    """Question model for assessments"""
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    correct_answer = Column(String(255), nullable=False)
    options = Column(Text)  # JSON string of answer options
    q_type = Column(String(50), default="multiple_choice")  # multiple_choice, true_false, short_answer, fill_in_blank
    difficulty = Column(Integer, default=1)  # 1-5
    domain = Column(String(100), index=True)
    sub_domain = Column(String(100), nullable=True)
    tags = Column(Text, nullable=True)  # JSON array of tag strings
    enhanced_content = Column(Text, nullable=True)  # JSON object with additional content
    time_limit = Column(Integer, default=60)  # seconds
    points = Column(Integer, default=10)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    performances = relationship("UserPerformance", back_populates="question")
    
    def __init__(self, **kwargs):
        """Initialize the question with provided data"""
        # Convert dict options to JSON string if provided as dict
        if "options" in kwargs and isinstance(kwargs["options"], dict):
            kwargs["options"] = json.dumps(kwargs["options"])
            
        # Convert list tags to JSON string if provided as list
        if "tags" in kwargs and isinstance(kwargs["tags"], list):
            kwargs["tags"] = json.dumps(kwargs["tags"])
            
        # Convert dict enhanced_content to JSON string if provided as dict
        if "enhanced_content" in kwargs and isinstance(kwargs["enhanced_content"], dict):
            kwargs["enhanced_content"] = json.dumps(kwargs["enhanced_content"])
            
        super(Question, self).__init__(**kwargs)
    
    def get_options(self) -> Dict[str, str]:
        """Get options as a dictionary"""
        if not self.options:
            return {}
        try:
            return json.loads(self.options)
        except json.JSONDecodeError:
            return {}
    
    def get_tags(self) -> List[str]:
        """Get tags as a list"""
        if not self.tags:
            return []
        try:
            return json.loads(self.tags)
        except json.JSONDecodeError:
            return []
    
    def get_enhanced_content(self) -> Dict[str, Any]:
        """Get enhanced content as a dictionary"""
        if not self.enhanced_content:
            return {}
        try:
            return json.loads(self.enhanced_content)
        except json.JSONDecodeError:
            return {}
    
    def is_correct_answer(self, user_answer: str) -> bool:
        """Check if the user's answer is correct"""
        # Different validation based on question type
        if self.q_type == "multiple_choice":
            # Strip whitespace and compare case-insensitive
            return user_answer.strip().lower() == self.correct_answer.strip().lower()
        elif self.q_type == "true_false":
            # Convert to boolean for comparison
            user_bool = user_answer.strip().lower() in ("true", "t", "yes", "y", "1")
            correct_bool = self.correct_answer.strip().lower() in ("true", "t", "yes", "y", "1")
            return user_bool == correct_bool
        elif self.q_type == "short_answer":
            # More flexible matching for short answers
            return user_answer.strip().lower() == self.correct_answer.strip().lower()
        elif self.q_type == "fill_in_blank":
            # Exact match for fill in the blank
            return user_answer.strip() == self.correct_answer.strip()
        else:
            # Default to exact match
            return user_answer.strip() == self.correct_answer.strip()
    
    def calculate_points(self, is_correct: bool, time_taken: Optional[int] = None) -> int:
        """
        Calculate points earned for this question based on correctness and time
        
        Args:
            is_correct: Whether the answer was correct
            time_taken: Time taken to answer in seconds (optional)
            
        Returns:
            Points earned
        """
        if not is_correct:
            return 0
        
        # Base points for difficulty level
        difficulty_multiplier = 1 + (self.difficulty * 0.2)  # 1.2, 1.4, 1.6, 1.8, 2.0
        base_points = int(self.points * difficulty_multiplier)
        
        # If time_taken is provided, add time bonus
        if time_taken is not None and self.time_limit > 0:
            # Time bonus: up to 20% extra if answered in half the time or less
            time_ratio = time_taken / self.time_limit
            if time_ratio <= 0.5:  # Answered in half the time or less
                time_bonus = int(base_points * 0.2)
            elif time_ratio <= 0.75:  # Answered in 75% of the time or less
                time_bonus = int(base_points * 0.1)
            else:
                time_bonus = 0
                
            return base_points + time_bonus
        
        return base_points
    
    def sanitize_for_api(self) -> Dict[str, Any]:
        """
        Prepare question for API response, without revealing the answer
        """
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


class UserPerformance(Base):
    """User performance on individual questions"""
    __tablename__ = "user_performances"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    domain = Column(String(100), index=True, nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    is_correct = Column(Boolean, default=False)
    difficulty = Column(Integer, nullable=False)
    points_earned = Column(Integer, default=0)
    time_taken = Column(Integer, nullable=True)  # seconds
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    question = relationship("Question", back_populates="performances")


class UserDomainProgress(Base):
    """User progress in a specific learning domain"""
    __tablename__ = "user_domain_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    domain = Column(String(100), index=True, nullable=False)
    current_difficulty = Column(Integer, default=1)
    questions_answered = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    performance_score = Column(Float, default=0.5)  # 0.0 to 1.0
    total_points = Column(Integer, default=0)
    last_activity = Column(DateTime, default=datetime.utcnow)
    mastered = Column(Boolean, default=False)
    proficiency_level = Column(Integer, default=1)  # 1-5
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "user_id": self.user_id,
            "domain": self.domain,
            "current_difficulty": self.current_difficulty,
            "questions_answered": self.questions_answered,
            "questions_correct": self.questions_correct,
            "performance_score": round(self.performance_score, 2),
            "total_points": self.total_points,
            "last_activity": self.last_activity.isoformat() if self.last_activity else None,
            "mastered": self.mastered,
            "proficiency_level": self.proficiency_level
        }


class AssessmentSession(Base):
    """Assessment session tracking"""
    __tablename__ = "assessment_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    domain = Column(String(100), index=True, nullable=True)  # Nullable for general assessments
    is_completed = Column(Boolean, default=False)
    questions_asked = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    total_points = Column(Integer, default=0)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "domain": self.domain,
            "is_completed": self.is_completed,
            "questions_asked": self.questions_asked,
            "questions_correct": self.questions_correct,
            "total_points": self.total_points,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None
        }


class User:
    """
    User class for generating personalized responses
    This is not a database model but a helper class
    """
    def __init__(self, id: int, name: str = None):
        self.id = id
        self.name = name or "Student"
    
    @staticmethod
    def get_by_id(user_id: int, db) -> 'User':
        """Get user by ID from database"""
        # This would typically query the user table
        # For now, we'll return a dummy user
        return User(id=user_id)


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
            'correct': self.correct,
            'correct_answer': self.correct_answer,
            'personal_message': self.personal_message,
            'teaching_explanation': self.teaching_explanation,
            'next_difficulty': self.next_difficulty
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
            'id': self.id,
            'question': self.question,
            'q_type': self.q_type,
            'options': self.options,
            'domain': self.domain,
            'difficulty': self.difficulty,
            'enhanced_content': self.enhanced_content
        }