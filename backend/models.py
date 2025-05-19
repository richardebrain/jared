"""
Data models for the MentorMe assessment system
"""

import json
from datetime import datetime
from typing import Dict, List, Any, Optional

from sqlalchemy import (
    Column, Integer, String, Text, Boolean, 
    Float, DateTime, ForeignKey, Table, func
)
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property

from backend.database import Base

# Association table for question-tag relationship
question_tags = Table(
    'question_tags',
    Base.metadata,
    Column('question_id', Integer, ForeignKey('questions.id', ondelete='CASCADE')),
    Column('tag_id', Integer, ForeignKey('tags.id', ondelete='CASCADE'))
)

class User(Base):
    """User model"""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    full_name = Column(String(100))
    email = Column(String(100), unique=True, index=True, nullable=True)
    is_admin = Column(Boolean, default=False)
    school_id = Column(Integer, ForeignKey('schools.id', ondelete='CASCADE'), nullable=True)
    
    # Relationships
    progress = relationship("UserDomainProgress", back_populates="user", cascade="all, delete-orphan")
    answers = relationship("UserAnswer", back_populates="user", cascade="all, delete-orphan")
    school = relationship("School", back_populates="users")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "username": self.username,
            "full_name": self.full_name,
            "email": self.email,
            "is_admin": self.is_admin,
            "school_id": self.school_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class School(Base):
    """School model"""
    __tablename__ = 'schools'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)
    logo_url = Column(String(255), nullable=True)
    subscription_active = Column(Boolean, default=False)
    subscription_expires = Column(DateTime, nullable=True)
    
    # Relationships
    users = relationship("User", back_populates="school")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "logo_url": self.logo_url,
            "subscription_active": self.subscription_active,
            "subscription_expires": self.subscription_expires.isoformat() if self.subscription_expires else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class Domain(Base):
    """Domain model for categorizing questions"""
    __tablename__ = 'domains'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)
    
    # Relationships
    questions = relationship("Question", back_populates="domain")
    progress = relationship("UserDomainProgress", back_populates="domain")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "icon": self.icon,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class Tag(Base):
    """Tag model for tagging questions"""
    __tablename__ = 'tags'
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True)
    
    # Relationships through association table
    questions = relationship("Question", secondary=question_tags, back_populates="tags")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class Question(Base):
    """Question model"""
    __tablename__ = 'questions'
    
    id = Column(Integer, primary_key=True, index=True)
    question_text = Column(Text, nullable=False)
    domain_id = Column(Integer, ForeignKey('domains.id', ondelete='CASCADE'))
    sub_domain = Column(String(100), nullable=True)
    q_type = Column(String(20), default='multiple_choice')  # multiple_choice, true_false, text
    difficulty = Column(Integer, default=1)
    correct_answer = Column(String(10), nullable=False)
    
    # Options for multiple choice questions
    _options = Column('options', Text, nullable=True)
    
    # Explanations and feedback
    _explanation = Column('explanation', Text, nullable=True)
    _hints = Column('hints', Text, nullable=True)
    
    # Resources for additional learning
    _resources = Column('resources', Text, nullable=True)
    
    # Media URLs
    video_url = Column(String(255), nullable=True)
    image_url = Column(String(255), nullable=True)
    
    # Time limit in seconds, 0 means no limit
    time_limit = Column(Integer, default=60)
    
    # Points earned for correct answer
    points = Column(Integer, default=10)
    
    # Relationships
    domain = relationship("Domain", back_populates="questions")
    tags = relationship("Tag", secondary=question_tags, back_populates="questions")
    answers = relationship("UserAnswer", back_populates="question")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @property
    def options(self) -> Dict[str, str]:
        """Get options as dictionary"""
        if self._options:
            return json.loads(self._options)
        return {}
    
    @options.setter
    def options(self, value: Dict[str, str]):
        """Set options from dictionary"""
        if value:
            self._options = json.dumps(value)
        else:
            self._options = None
    
    @property
    def explanation(self) -> str:
        """Get explanation"""
        return self._explanation or ""
    
    @explanation.setter
    def explanation(self, value: str):
        """Set explanation"""
        self._explanation = value
    
    @property
    def hints(self) -> List[str]:
        """Get hints as list"""
        if self._hints:
            return json.loads(self._hints)
        return []
    
    @hints.setter
    def hints(self, value: List[str]):
        """Set hints from list"""
        if value:
            self._hints = json.dumps(value)
        else:
            self._hints = None
    
    @property
    def resources(self) -> List[Dict[str, str]]:
        """Get resources as list of dictionaries"""
        if self._resources:
            return json.loads(self._resources)
        return []
    
    @resources.setter
    def resources(self, value: List[Dict[str, str]]):
        """Set resources from list of dictionaries"""
        if value:
            self._resources = json.dumps(value)
        else:
            self._resources = None
    
    @hybrid_property
    def points_for_difficulty(self) -> int:
        """Calculate points based on difficulty if not explicitly set"""
        if self.points:
            return self.points
        
        # Default point calculation based on difficulty
        if self.difficulty == 1:
            return 10
        elif self.difficulty == 2:
            return 15
        elif self.difficulty == 3:
            return 20
        elif self.difficulty >= 4:
            return 25
        else:
            return 5
    
    def to_dict(self, include_answer: bool = False) -> Dict[str, Any]:
        """
        Convert to dictionary
        
        Args:
            include_answer: Whether to include the correct answer
        
        Returns:
            Dictionary representation
        """
        result = {
            "id": self.id,
            "question": self.question_text,
            "domain_id": self.domain_id,
            "domain": self.domain.name if self.domain else None,
            "sub_domain": self.sub_domain,
            "type": self.q_type,
            "difficulty": self.difficulty,
            "options": self.options,
            "explanation": self.explanation,
            "hints": self.hints,
            "resources": self.resources,
            "video_url": self.video_url,
            "image_url": self.image_url,
            "time_limit": self.time_limit,
            "points": self.points_for_difficulty,
            "tags": [tag.name for tag in self.tags],
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        
        if include_answer:
            result["correct_answer"] = self.correct_answer
            
        return result

class UserAnswer(Base):
    """User answer model"""
    __tablename__ = 'user_answers'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'))
    question_id = Column(Integer, ForeignKey('questions.id', ondelete='CASCADE'))
    answer = Column(String(255), nullable=False)
    is_correct = Column(Boolean)
    time_taken = Column(Integer, nullable=True)  # Time taken in seconds
    points_earned = Column(Integer, default=0)
    session_id = Column(String(50), nullable=True)  # For tracking assessment sessions
    
    # Relationships
    user = relationship("User", back_populates="answers")
    question = relationship("Question", back_populates="answers")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    @hybrid_property
    def accuracy_score(self) -> float:
        """Calculate accuracy score based on correctness and time taken"""
        base_score = 1.0 if self.is_correct else 0.0
        
        # If no time information, just return base score
        if not self.time_taken or not self.question or not self.question.time_limit:
            return base_score
            
        # Time factor: faster answers get slightly higher scores
        time_limit = self.question.time_limit
        if time_limit > 0 and self.time_taken < time_limit:
            time_factor = 0.2 * (1 - (self.time_taken / time_limit))
            return min(1.0, base_score + time_factor)
            
        return base_score
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "question_id": self.question_id,
            "answer": self.answer,
            "is_correct": self.is_correct,
            "time_taken": self.time_taken,
            "points_earned": self.points_earned,
            "session_id": self.session_id,
            "accuracy_score": self.accuracy_score,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class UserDomainProgress(Base):
    """User progress model for tracking progress in specific domains"""
    __tablename__ = 'user_domain_progress'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'))
    domain_id = Column(Integer, ForeignKey('domains.id', ondelete='CASCADE'))
    current_level = Column(Integer, default=1)
    questions_attempted = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    streak = Column(Integer, default=0)
    highest_streak = Column(Integer, default=0)
    total_points = Column(Integer, default=0)
    
    # Relationships
    user = relationship("User", back_populates="progress")
    domain = relationship("Domain", back_populates="progress")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.utcnow)
    
    @hybrid_property
    def proficiency(self) -> float:
        """Calculate proficiency score (0.0-1.0)"""
        if not self.questions_attempted:
            return 0.0
        return round(self.questions_correct / self.questions_attempted, 2)
    
    @hybrid_property
    def is_active(self) -> bool:
        """Check if user has been active in this domain recently (last 7 days)"""
        if not self.last_activity:
            return False
        
        return (datetime.utcnow() - self.last_activity).days < 7
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "domain_id": self.domain_id,
            "domain": self.domain.name if self.domain else None,
            "current_level": self.current_level,
            "questions_attempted": self.questions_attempted,
            "questions_correct": self.questions_correct,
            "streak": self.streak,
            "highest_streak": self.highest_streak,
            "total_points": self.total_points,
            "proficiency": self.proficiency,
            "is_active": self.is_active,
            "last_activity": self.last_activity.isoformat() if self.last_activity else None,
        }

class AnswerFeedback:
    """
    Non-database class for delivering feedback about answers
    This is a DTO (Data Transfer Object) only
    """
    
    def __init__(
        self,
        is_correct: bool,
        points_earned: int = 0,
        explanation: str = "",
        next_difficulty: Optional[int] = None,
        resources: List[Dict[str, str]] = None,
        message: str = ""
    ):
        self.is_correct = is_correct
        self.points_earned = points_earned
        self.explanation = explanation
        self.next_difficulty = next_difficulty
        self.resources = resources or []
        self.message = message
        
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "is_correct": self.is_correct,
            "points_earned": self.points_earned,
            "explanation": self.explanation,
            "next_difficulty": self.next_difficulty,
            "resources": self.resources,
            "message": self.message
        }