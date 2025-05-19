"""
SQLAlchemy models for the MentorMe Enhanced Assessment system
"""

from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, 
    ForeignKey, JSON, Float, func
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import json
from typing import Dict, List, Any, Optional

Base = declarative_base()

class User(Base):
    """User model for the assessment system"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    first_name = Column(String(50))
    last_name = Column(String(50))
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=True)
    password_hash = Column(String(100))
    email_verified = Column(Boolean, default=False)
    profile_image_url = Column(String(255), nullable=True)
    role = Column(String(20), default="teacher")  # teacher, director, owner, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    points = Column(Integer, default=0)
    bear_bucks = Column(Integer, default=0)
    lifetime_points = Column(Integer, default=0)
    teacher_level = Column(String(30), default="Teacher in Training")
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_streak_date = Column(DateTime, nullable=True)
    
    # Relationships
    assessments = relationship("Assessment", back_populates="user")
    school = relationship("School", back_populates="users")
    
    def to_dict(self):
        """Convert user to dictionary"""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "role": self.role,
            "points": self.points,
            "bear_bucks": self.bear_bucks,
            "lifetime_points": self.lifetime_points,
            "teacher_level": self.teacher_level,
            "current_streak": self.current_streak,
            "longest_streak": self.longest_streak,
            "profile_image_url": self.profile_image_url,
            "school_id": self.school_id
        }

class School(Base):
    """School model for the assessment system"""
    __tablename__ = "schools"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)
    active_subscription = Column(Boolean, default=True)
    subscription_expires = Column(DateTime, nullable=True)
    subscription_level = Column(String(20), default="basic")  # basic, premium, enterprise
    admin_password_hash = Column(String(100), nullable=True)
    contact_email = Column(String(100), nullable=True)
    contact_phone = Column(String(20), nullable=True)
    address = Column(String(255), nullable=True)
    city = Column(String(50), nullable=True)
    state = Column(String(50), nullable=True)
    zip_code = Column(String(20), nullable=True)
    logo_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="school")
    
    def to_dict(self):
        """Convert school to dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "active_subscription": self.active_subscription,
            "subscription_expires": self.subscription_expires.isoformat() if self.subscription_expires else None,
            "subscription_level": self.subscription_level,
            "contact_email": self.contact_email,
            "contact_phone": self.contact_phone,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "zip_code": self.zip_code,
            "logo_url": self.logo_url,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Question(Base):
    """Question model for the assessment system"""
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    domain = Column(String(50), index=True, nullable=False)
    sub_competency = Column(String(100), nullable=True)
    competency = Column(String(100), nullable=True)
    class_dimension = Column(String(100), nullable=True)
    difficulty = Column(Integer, default=1)
    q_type = Column(String(20), default="multiple_choice")  # multiple_choice, true_false, etc.
    
    # Store options as JSON, but access through property
    _options = Column("options", Text)
    
    # Enhanced content fields
    practical_application_strategy = Column(Text, nullable=True)
    why_behind_it = Column(Text, nullable=True)
    classroom_examples = Column(Text, nullable=True)
    citations = Column(Text, nullable=True)
    resources = Column(JSON, nullable=True)
    correct_answer = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(String, default=datetime.utcnow().isoformat())
    
    # Relationships
    answers = relationship("Answer", back_populates="question")
    
    @property
    def options(self) -> Dict[str, str]:
        """Get options as dict"""
        if self._options:
            return json.loads(self._options)
        return {}
    
    @options.setter
    def options(self, value: Dict[str, str]):
        """Set options from dict"""
        if value:
            self._options = json.dumps(value)
        else:
            self._options = "{}"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "question": self.question,
            "domain": self.domain,
            "sub_competency": self.sub_competency,
            "competency": self.competency,
            "class_dimension": self.class_dimension,
            "difficulty": self.difficulty,
            "q_type": self.q_type,
            "options": self.options,
            "correct_answer": self.correct_answer,
            "practical_application_strategy": self.practical_application_strategy,
            "why_behind_it": self.why_behind_it,
            "classroom_examples": self.classroom_examples,
            "citations": self.citations,
            "resources": self.resources
        }

class Assessment(Base):
    """Assessment model to track user assessments"""
    __tablename__ = "assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    active = Column(Boolean, default=True)
    questions_asked = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    points_earned = Column(Integer, default=0)
    
    # Relationships
    user = relationship("User", back_populates="assessments")
    answers = relationship("Answer", back_populates="assessment")
    
    def to_dict(self):
        """Convert assessment to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "active": self.active,
            "questions_asked": self.questions_asked,
            "questions_correct": self.questions_correct,
            "points_earned": self.points_earned
        }

class Answer(Base):
    """Answer model to track user responses"""
    __tablename__ = "answers"
    
    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    user_answer = Column(String(100), nullable=False)
    is_correct = Column(Boolean, nullable=False)
    time_taken_ms = Column(Integer, nullable=True)  # Time taken to answer in milliseconds
    answer_time = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    assessment = relationship("Assessment", back_populates="answers")
    question = relationship("Question", back_populates="answers")
    
    def to_dict(self):
        """Convert answer to dictionary"""
        return {
            "id": self.id,
            "assessment_id": self.assessment_id,
            "question_id": self.question_id,
            "user_answer": self.user_answer,
            "is_correct": self.is_correct,
            "time_taken_ms": self.time_taken_ms,
            "answer_time": self.answer_time.isoformat() if self.answer_time else None
        }

class LearningResource(Base):
    """Learning resource model for recommendations"""
    __tablename__ = "learning_resources"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    resource_type = Column(String(50))  # video, article, quiz, etc.
    url = Column(String(500), nullable=True)
    domain = Column(String(50), index=True)
    difficulty = Column(Integer, default=1)
    tags = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Convert learning resource to dictionary"""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "resource_type": self.resource_type,
            "url": self.url,
            "domain": self.domain,
            "difficulty": self.difficulty,
            "tags": self.tags,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }