"""
SQLAlchemy models for the MentorMe assessment system
This module defines all database models and their relationships
"""

import enum
import logging
from typing import List, Dict, Any, Optional, Union
from datetime import datetime, timedelta

from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, 
    ForeignKey, Float, Text, Table, Enum,
    func, select, and_
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship, backref
from sqlalchemy.types import JSON

# Setup logging
logger = logging.getLogger("mentorme-assessment-api")

# Create SQLAlchemy base
Base = declarative_base()

# Association tables for many-to-many relationships
question_tag_association = Table(
    'question_tag',
    Base.metadata,
    Column('question_id', Integer, ForeignKey('questions.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id'), primary_key=True)
)

class QuestionType(enum.Enum):
    """Enum for question types"""
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    FILL_BLANK = "fill_blank"
    SHORT_ANSWER = "short_answer"
    MATCHING = "matching"

class Question(Base):
    """Assessment question model"""
    __tablename__ = 'questions'
    
    id = Column(Integer, primary_key=True)
    question = Column(Text, nullable=False)
    domain = Column(String(100), nullable=False, index=True)
    sub_domain = Column(String(100), nullable=True, index=True)
    difficulty = Column(Integer, nullable=False, default=1)
    q_type = Column(String(20), nullable=False, default="multiple_choice")
    options = Column(JSON, nullable=True)
    correct_answer = Column(String(255), nullable=False)
    explanation = Column(Text, nullable=True)
    hints = Column(JSON, nullable=True)
    resources = Column(JSON, nullable=True)
    time_limit = Column(Integer, nullable=True)  # Seconds
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tags = relationship("Tag", secondary=question_tag_association, backref="questions")
    answers = relationship("UserAnswer", back_populates="question")
    
    @hybrid_property
    def points_value(self) -> int:
        """Calculate points value based on difficulty"""
        # Base points: 5 for easiest, up to 25 for hardest
        return 5 * self.difficulty
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "question": self.question,
            "domain": self.domain,
            "sub_domain": self.sub_domain,
            "difficulty": self.difficulty,
            "q_type": self.q_type,
            "options": self.options or {},
            "correct_answer": self.correct_answer,
            "explanation": self.explanation,
            "hints": self.hints or [],
            "resources": self.resources or [],
            "time_limit": self.time_limit,
            "points_value": self.points_value,
            "is_active": self.is_active
        }

class Tag(Base):
    """Tags for questions"""
    __tablename__ = 'tags'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "name": self.name
        }

class Domain(Base):
    """Knowledge domain model"""
    __tablename__ = 'domains'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    parent_id = Column(Integer, ForeignKey('domains.id'), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    sub_domains = relationship("Domain", backref=backref("parent", remote_side=[id]))
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "parent_id": self.parent_id,
            "is_active": self.is_active
        }

class School(Base):
    """School model for subscription management"""
    __tablename__ = 'schools'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    contact_email = Column(String(255), nullable=True)
    logo_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    max_users = Column(Integer, default=10)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    users = relationship("User", back_populates="school")
    subscriptions = relationship("Subscription", back_populates="school")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "name": self.name,
            "contact_email": self.contact_email,
            "logo_url": self.logo_url,
            "is_active": self.is_active,
            "is_default": self.is_default,
            "max_users": self.max_users
        }

class Subscription(Base):
    """Subscription model for schools"""
    __tablename__ = 'subscriptions'
    
    id = Column(Integer, primary_key=True)
    school_id = Column(Integer, ForeignKey('schools.id'), nullable=False)
    plan_name = Column(String(50), nullable=False)
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)  # Null means unlimited
    is_active = Column(Boolean, default=True)
    payment_status = Column(String(20), default="pending")
    max_users = Column(Integer, default=10)
    features = Column(JSON, nullable=True)  # JSON of enabled features
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    school = relationship("School", back_populates="subscriptions")
    
    @hybrid_property
    def is_expired(self) -> bool:
        """Check if subscription is expired"""
        if not self.end_date:
            return False  # Never expires
        return datetime.utcnow() > self.end_date
    
    @hybrid_property
    def days_remaining(self) -> Optional[int]:
        """Get days remaining in subscription"""
        if not self.end_date:
            return None  # Never expires
        if self.is_expired:
            return 0
        delta = self.end_date - datetime.utcnow()
        return max(0, delta.days)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "school_id": self.school_id,
            "plan_name": self.plan_name,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "is_active": self.is_active,
            "is_expired": self.is_expired,
            "days_remaining": self.days_remaining,
            "payment_status": self.payment_status,
            "max_users": self.max_users,
            "features": self.features or {}
        }

class User(Base):
    """User model"""
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    username = Column(String(50), nullable=False, unique=True)
    email = Column(String(255), nullable=True, unique=True)
    first_name = Column(String(50), nullable=True)
    last_name = Column(String(50), nullable=True)
    role = Column(String(20), default="teacher")  # teacher, admin, owner
    school_id = Column(Integer, ForeignKey('schools.id'), nullable=True)
    profile_image_url = Column(String(255), nullable=True)
    language_preference = Column(String(10), default="en")
    learning_style = Column(JSON, nullable=True)
    total_points = Column(Integer, default=0)
    level = Column(Integer, default=1)
    streak_days = Column(Integer, default=0)
    last_login = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    school = relationship("School", back_populates="users")
    answers = relationship("UserAnswer", back_populates="user")
    progress = relationship("UserDomainProgress", back_populates="user")
    achievements = relationship("UserAchievement", back_populates="user")
    
    @hybrid_property
    def full_name(self) -> str:
        """Get full name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        return self.username
    
    def check_level(self) -> int:
        """Check and update level based on points"""
        # Define level thresholds (points needed for each level)
        thresholds = [
            0,      # Level 1: Teacher in Training (0-299)
            300,    # Level 2: Assistant Teacher (300-799)
            800,    # Level 3: Associate Teacher (800-1499)
            1500,   # Level 4: Lead Teacher (1500-2499)
            2500,   # Level 5: Master Lead Teacher (2500-3499)
            3500    # Level 6: Mentor Teacher (3500+)
        ]
        
        # Determine current level
        level = 1
        for i, threshold in enumerate(thresholds):
            if self.total_points >= threshold:
                level = i + 1
            else:
                break
        
        return min(level, 6)  # Max level is 6 (Mentor Teacher)
    
    def get_level_title(self) -> str:
        """Get title for current level"""
        titles = [
            "Teacher in Training",
            "Assistant Teacher",
            "Associate Teacher",
            "Lead Teacher",
            "Master Lead Teacher",
            "Mentor Teacher"
        ]
        
        level_index = min(self.level - 1, 5)
        return titles[level_index]
    
    def get_next_level_points(self) -> int:
        """Get points needed for next level"""
        thresholds = [0, 300, 800, 1500, 2500, 3500]
        
        if self.level >= 6:
            return 0  # Already at max level
        
        next_threshold = thresholds[self.level]
        return next_threshold - self.total_points
    
    @hybrid_property
    def bear_bucks(self) -> int:
        """Calculate Bear Bucks based on points (50 points = 1 Bear Buck)"""
        return self.total_points // 50
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "role": self.role,
            "school_id": self.school_id,
            "profile_image_url": self.profile_image_url,
            "language_preference": self.language_preference,
            "learning_style": self.learning_style or {},
            "total_points": self.total_points,
            "bear_bucks": self.bear_bucks,
            "level": self.level,
            "level_title": self.get_level_title(),
            "streak_days": self.streak_days,
            "last_login": self.last_login,
            "is_active": self.is_active
        }

class UserAnswer(Base):
    """User answer to a question"""
    __tablename__ = 'user_answers'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    question_id = Column(Integer, ForeignKey('questions.id'), nullable=False)
    answer = Column(String(255), nullable=False)
    is_correct = Column(Boolean, nullable=False)
    points_earned = Column(Integer, default=0)
    time_taken = Column(Integer, nullable=True)  # Seconds
    session_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="answers")
    question = relationship("Question", back_populates="answers")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "question_id": self.question_id,
            "answer": self.answer,
            "is_correct": self.is_correct,
            "points_earned": self.points_earned,
            "time_taken": self.time_taken,
            "created_at": self.created_at
        }

class UserDomainProgress(Base):
    """User progress in a specific domain"""
    __tablename__ = 'user_domain_progress'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    domain = Column(String(100), nullable=False)
    questions_attempted = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    highest_difficulty = Column(Integer, default=1)
    current_level = Column(Integer, default=1)
    total_points = Column(Integer, default=0)
    is_complete = Column(Boolean, default=False)
    last_activity = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="progress")
    
    @hybrid_property
    def accuracy(self) -> float:
        """Calculate accuracy percentage"""
        if self.questions_attempted == 0:
            return 0.0
        return round((self.questions_correct / self.questions_attempted) * 100, 1)
    
    @hybrid_property
    def proficiency(self) -> float:
        """Calculate proficiency score (0-5 scale)
        Based on:
        - Accuracy
        - Highest difficulty reached
        - Questions attempted
        """
        # Base score from accuracy
        accuracy_factor = 0.0
        if self.questions_attempted > 0:
            accuracy_factor = self.accuracy / 20  # 100% accuracy gives 5.0
        
        # Difficulty factor (0-1 scale, higher difficulty gives higher score)
        difficulty_factor = (self.highest_difficulty - 1) / 4  # 1-5 → 0-1 scale
        
        # Volume factor (more questions = better assessment of knowledge)
        volume_factor = min(1.0, self.questions_attempted / 10)  # caps at 10 questions
        
        # Calculate weighted score
        weighted_score = (
            (accuracy_factor * 0.6) +  # 60% weight on accuracy
            (difficulty_factor * 0.3) +  # 30% weight on difficulty
            (volume_factor * 0.1)  # 10% weight on volume
        ) * 5  # Scale to 0-5
        
        return round(max(0, min(5, weighted_score)), 1)  # Clamp to 0-5 range
    
    @hybrid_property
    def is_mastered(self) -> bool:
        """Check if domain is mastered (proficiency >= 4 and accuracy > 85%)"""
        return self.proficiency >= 4 and self.accuracy > 85 and self.questions_attempted >= 5
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "domain": self.domain,
            "questions_attempted": self.questions_attempted,
            "questions_correct": self.questions_correct,
            "accuracy": self.accuracy,
            "highest_difficulty": self.highest_difficulty,
            "current_level": self.current_level,
            "total_points": self.total_points,
            "proficiency": self.proficiency,
            "is_mastered": self.is_mastered,
            "is_complete": self.is_complete,
            "last_activity": self.last_activity
        }

class Achievement(Base):
    """Achievement definition"""
    __tablename__ = 'achievements'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    icon_url = Column(String(255), nullable=True)
    requirement_type = Column(String(50), nullable=False)  # points, streak, domain_mastery, etc.
    requirement_value = Column(Integer, nullable=False)
    points_reward = Column(Integer, default=0)
    bear_bucks_reward = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user_achievements = relationship("UserAchievement", back_populates="achievement")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "icon_url": self.icon_url,
            "requirement_type": self.requirement_type,
            "requirement_value": self.requirement_value,
            "points_reward": self.points_reward,
            "bear_bucks_reward": self.bear_bucks_reward,
            "is_active": self.is_active
        }

class UserAchievement(Base):
    """User achievement record"""
    __tablename__ = 'user_achievements'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    achievement_id = Column(Integer, ForeignKey('achievements.id'), nullable=False)
    earned_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="achievements")
    achievement = relationship("Achievement", back_populates="user_achievements")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "achievement_id": self.achievement_id,
            "achievement_name": self.achievement.name if self.achievement else None,
            "achievement_description": self.achievement.description if self.achievement else None,
            "icon_url": self.achievement.icon_url if self.achievement else None,
            "earned_at": self.earned_at
        }