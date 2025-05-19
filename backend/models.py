"""
Data models for the MentorMe assessment system
This module defines the SQLAlchemy models for database tables
"""

import enum
import json
from datetime import datetime
from typing import Dict, List, Any, Optional

from sqlalchemy import (
    Column, Integer, String, Text, ForeignKey, Boolean,
    DateTime, Table, JSON, Float, func, text
)
from sqlalchemy.orm import relationship, backref
from sqlalchemy.ext.hybrid import hybrid_property

from backend.database import Base

# Association table for many-to-many relationship between questions and tags
QuestionTag = Table(
    "question_tag",
    Base.metadata,
    Column("question_id", Integer, ForeignKey("questions.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

class QuestionType(enum.Enum):
    """Question type enum"""
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    FILL_BLANK = "fill_blank"
    SHORT_ANSWER = "short_answer"
    MATCHING = "matching"

class Domain(Base):
    """Domain model"""
    __tablename__ = "domains"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)
    parent_id = Column(Integer, ForeignKey("domains.id"), nullable=True)
    icon = Column(String(255), nullable=True)
    order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    sub_domains = relationship("Domain", backref=backref("parent", remote_side=[id]))
    questions = relationship("Question", back_populates="domain_rel")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "parent_id": self.parent_id,
            "icon": self.icon,
            "is_active": self.is_active,
            "sub_domain_count": len(self.sub_domains) if self.sub_domains else 0,
            "question_count": len(self.questions) if self.questions else 0,
        }

class Tag(Base):
    """Tag model"""
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(Text, nullable=True)

    questions = relationship("Question", secondary=QuestionTag, back_populates="tags")

    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "question_count": len(self.questions) if self.questions else 0,
        }

class Question(Base):
    """Question model"""
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    domain = Column(String(100), index=True, nullable=False)
    sub_domain = Column(String(100), index=True, nullable=True)
    difficulty = Column(Integer, default=1, nullable=False)
    q_type = Column(String(20), nullable=False)
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    hints = Column(JSON, default=list)
    options = Column(JSON, default=dict)
    resources = Column(JSON, default=list)
    time_limit = Column(Integer, nullable=True)  # Time limit in seconds
    is_active = Column(Boolean, default=True)

    domain_rel = relationship("Domain", back_populates="questions", foreign_keys=[domain])
    tags = relationship("Tag", secondary=QuestionTag, back_populates="questions")
    answers = relationship("UserAnswer", back_populates="question")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @hybrid_property
    def points_value(self) -> int:
        """Calculate points value based on difficulty"""
        return self.difficulty * 5  # Points are 5x the difficulty level

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "question": self.question,
            "domain": self.domain,
            "sub_domain": self.sub_domain,
            "difficulty": self.difficulty,
            "q_type": self.q_type,
            "options": self.options,
            "hints": self.hints,
            "time_limit": self.time_limit,
            "points_value": self.points_value,
        }

class School(Base):
    """School model"""
    __tablename__ = "schools"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    contact_email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    logo_url = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    max_users = Column(Integer, default=10)

    users = relationship("User", back_populates="school")
    subscriptions = relationship("Subscription", back_populates="school")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "name": self.name,
            "contact_email": self.contact_email,
            "logo_url": self.logo_url,
            "is_active": self.is_active,
            "is_default": self.is_default,
            "user_count": len(self.users) if self.users else 0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class Subscription(Base):
    """Subscription model"""
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    plan_name = Column(String(50), nullable=False)
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    max_users = Column(Integer, default=10)
    features = Column(JSON, default=dict)
    payment_status = Column(String(50), default="active")
    payment_id = Column(String(100), nullable=True)
    price = Column(Float, default=0.0)

    school = relationship("School", back_populates="subscriptions")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def is_valid(self) -> bool:
        """Check if subscription is valid"""
        now = datetime.utcnow()
        if not self.is_active:
            return False
        if self.end_date and now > self.end_date:
            return False
        if self.payment_status not in ["active", "trial"]:
            return False
        return True

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "school_id": self.school_id,
            "plan_name": self.plan_name,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "is_active": self.is_active,
            "max_users": self.max_users,
            "features": self.features,
            "payment_status": self.payment_status,
            "is_valid": self.is_valid(),
        }

class User(Base):
    """User model"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=True)
    first_name = Column(String(50), nullable=True)
    last_name = Column(String(50), nullable=True)
    role = Column(String(20), default="teacher")  # teacher, admin, owner
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=True)
    is_active = Column(Boolean, default=True)

    # Gamification and progress
    total_points = Column(Integer, default=0)
    bear_bucks = Column(Integer, default=0)
    level = Column(Integer, default=1)
    streak_days = Column(Integer, default=0)
    last_login = Column(DateTime, nullable=True)
    
    # User preferences
    language = Column(String(20), default="en")
    timezone = Column(String(50), default="UTC")
    profile_image_url = Column(String(255), nullable=True)
    learning_preferences = Column(JSON, default=dict)
    
    # Firebase integration
    firebase_uid = Column(String(255), unique=True, nullable=True)
    
    # Stripe integration for school owners
    stripe_customer_id = Column(String(255), unique=True, nullable=True)
    
    school = relationship("School", back_populates="users")
    answers = relationship("UserAnswer", back_populates="user")
    domain_progress = relationship("UserDomainProgress", back_populates="user")
    achievements = relationship("UserAchievement", back_populates="user")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

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
    
    @hybrid_property
    def bear_bucks_value(self) -> int:
        """Calculate Bear Bucks from points (50 points = 1 Bear Buck)"""
        if self.bear_bucks is not None:
            return self.bear_bucks
        if self.total_points is not None:
            return int(self.total_points / 50)
        return 0
    
    def check_level(self) -> int:
        """Check level based on points"""
        points = self.total_points or 0
        
        if points < 300:
            return 1  # Teacher in Training (0-299)
        elif points < 800:
            return 2  # Assistant Teacher (300-799)
        elif points < 1500:
            return 3  # Associate Teacher (800-1499)
        elif points < 2500:
            return 4  # Lead Teacher (1500-2499)
        elif points < 3500:
            return 5  # Master Lead Teacher (2500-3499)
        else:
            return 6  # Mentor Teacher (3500+)
            
    def get_level_title(self) -> str:
        """Get level title based on level"""
        level_titles = {
            1: "Teacher in Training",
            2: "Assistant Teacher",
            3: "Associate Teacher",
            4: "Lead Teacher",
            5: "Master Lead Teacher",
            6: "Mentor Teacher"
        }
        return level_titles.get(self.level, "Unknown")
    
    def to_dict(self, include_sensitive: bool = False) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        result = {
            "id": self.id,
            "username": self.username,
            "email": self.email if include_sensitive else None,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "role": self.role,
            "school_id": self.school_id,
            "is_active": self.is_active,
            "total_points": self.total_points,
            "bear_bucks": self.bear_bucks_value,
            "level": self.level,
            "level_title": self.get_level_title(),
            "streak_days": self.streak_days,
            "last_login": self.last_login.isoformat() if self.last_login else None,
            "language": self.language,
            "timezone": self.timezone,
            "profile_image_url": self.profile_image_url,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        
        if include_sensitive:
            result.update({
                "learning_preferences": self.learning_preferences,
                "firebase_uid": self.firebase_uid,
                "stripe_customer_id": self.stripe_customer_id,
            })
            
        return result

class UserAnswer(Base):
    """User answer model"""
    __tablename__ = "user_answers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    points_earned = Column(Integer, default=0)
    time_taken = Column(Integer, nullable=True)  # Time taken in seconds
    session_id = Column(String(100), nullable=True)  # To group answers from same assessment session

    user = relationship("User", back_populates="answers")
    question = relationship("Question", back_populates="answers")

    created_at = Column(DateTime, default=datetime.utcnow)
    
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
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class UserDomainProgress(Base):
    """User domain progress model"""
    __tablename__ = "user_domain_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    domain = Column(String(100), index=True, nullable=False)
    questions_attempted = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    highest_difficulty = Column(Integer, default=1)
    current_level = Column(Integer, default=1)
    total_points = Column(Integer, default=0)
    last_activity = Column(DateTime, default=datetime.utcnow)
    is_complete = Column(Boolean, default=False)
    
    # For learning path recommendations
    proficiency_score = Column(Float, default=0.0)
    next_recommended_difficulty = Column(Integer, default=1)
    completion_percentage = Column(Float, default=0.0)

    user = relationship("User", back_populates="domain_progress")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @hybrid_property
    def accuracy(self) -> float:
        """Calculate accuracy rate"""
        if not self.questions_attempted:
            return 0.0
        return round((self.questions_correct / self.questions_attempted) * 100, 1)
    
    @hybrid_property
    def proficiency(self) -> int:
        """Calculate proficiency level (1-5)"""
        if not self.accuracy:
            return 1
        
        # Consider both accuracy and highest difficulty achieved
        accuracy_factor = min(5, max(1, int(self.accuracy / 20)))
        difficulty_factor = min(5, max(1, self.highest_difficulty))
        
        # Weight: 60% accuracy, 40% highest difficulty
        return min(5, max(1, int((accuracy_factor * 0.6) + (difficulty_factor * 0.4))))
    
    def is_proficient(self) -> bool:
        """Check if user is proficient in this domain"""
        return self.proficiency >= 4 or self.accuracy > 85 or self.is_complete

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "domain": self.domain,
            "questions_attempted": self.questions_attempted,
            "questions_correct": self.questions_correct,
            "highest_difficulty": self.highest_difficulty,
            "current_level": self.current_level,
            "total_points": self.total_points,
            "accuracy": self.accuracy,
            "proficiency": self.proficiency,
            "is_proficient": self.is_proficient(),
            "is_complete": self.is_complete,
            "proficiency_score": self.proficiency_score,
            "completion_percentage": self.completion_percentage,
            "last_activity": self.last_activity.isoformat() if self.last_activity else None,
        }

class Achievement(Base):
    """Achievement model"""
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=False)
    icon = Column(String(255), nullable=True)
    points_reward = Column(Integer, default=0)
    bear_bucks_reward = Column(Integer, default=0)
    category = Column(String(50), nullable=True)  # e.g., assessment, streak, training
    requirement_type = Column(String(50), nullable=False)  # e.g., points, streak, domain_mastery
    requirement_value = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)

    users = relationship("UserAchievement", back_populates="achievement")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "icon": self.icon,
            "points_reward": self.points_reward,
            "bear_bucks_reward": self.bear_bucks_reward,
            "category": self.category,
            "requirement_type": self.requirement_type,
            "requirement_value": self.requirement_value,
            "is_active": self.is_active,
        }

class UserAchievement(Base):
    """User achievement model"""
    __tablename__ = "user_achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False)
    earned_at = Column(DateTime, default=datetime.utcnow)
    is_acknowledged = Column(Boolean, default=False)

    user = relationship("User", back_populates="achievements")
    achievement = relationship("Achievement", back_populates="users")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "achievement_id": self.achievement_id,
            "earned_at": self.earned_at.isoformat() if self.earned_at else None,
            "is_acknowledged": self.is_acknowledged,
            "achievement": self.achievement.to_dict() if self.achievement else None,
        }