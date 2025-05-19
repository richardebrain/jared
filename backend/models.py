"""
Database models for the assessment system

This module defines the SQLAlchemy models for the assessment database.
"""

import json
from datetime import datetime
from typing import Dict, Any, List, Optional, Union
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()

class Question(Base):
    """Model for assessment questions"""
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    q_type = Column(String(20), nullable=False)  # multiple_choice, true_false, short_answer
    options = Column(Text, nullable=True)  # JSON string of options
    domain = Column(String(50), nullable=False)
    difficulty = Column(Integer, nullable=False, default=1)
    sub_competency = Column(String(100), nullable=True)
    enhanced_content = Column(Text, nullable=True)  # JSON string with additional content
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    performances = relationship("UserPerformance", back_populates="question")
    
    def get_options(self) -> Dict[str, str]:
        """Get question options as a dictionary"""
        if not self.options:
            return {}
        
        try:
            return json.loads(self.options)
        except json.JSONDecodeError:
            return {}
    
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
        if self.q_type == 'multiple_choice':
            # For multiple choice, answer should store the correct option key
            return user_answer.lower() == self.answer.lower()
        elif self.q_type == 'true_false':
            # For true/false, normalize to lowercase
            return user_answer.lower() == self.answer.lower()
        else:
            # For short answer, do a more flexible check
            # Could be enhanced with more sophisticated text matching
            user_answer = user_answer.lower().strip()
            correct_answer = self.answer.lower().strip()
            return user_answer == correct_answer or user_answer in correct_answer
    
    def calculate_points(self, is_correct: bool, time_taken: Optional[int] = None) -> int:
        """Calculate points earned for this question"""
        if not is_correct:
            return 0
            
        # Base points based on difficulty
        base_points = self.difficulty * 2
        
        # Time bonus (if time tracking is enabled)
        time_bonus = 0
        if time_taken is not None:
            # Give bonus for quick answers, capped at difficulty level
            time_bonus = max(0, min(self.difficulty, 10 - time_taken // 3))
        
        return base_points + time_bonus
    
    def sanitize_for_api(self) -> Dict[str, Any]:
        """Convert model to API-friendly dictionary without the answer"""
        options = self.get_options()
        enhanced = self.get_enhanced_content()
        
        # Don't include the answer in the API response
        result = {
            "id": self.id,
            "question": self.question,
            "q_type": self.q_type,
            "options": options,
            "domain": self.domain,
            "difficulty": self.difficulty,
            "sub_competency": self.sub_competency
        }
        
        # Add non-answer enhanced content
        if enhanced:
            result["enhanced_content"] = {
                k: v for k, v in enhanced.items() 
                if k != "answer" and k != "explanation"
            }
            
            # Only include hint if it exists
            if "hint" in enhanced:
                result["enhanced_content"]["hint"] = enhanced["hint"]
                
        return result


class UserPerformance(Base):
    """Model for tracking user performance in assessment domains"""
    __tablename__ = "user_performances"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True)
    domain = Column(String(50), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=True)
    is_correct = Column(Boolean, nullable=False)
    difficulty = Column(Integer, nullable=False)
    points_earned = Column(Integer, nullable=False, default=0)
    time_taken = Column(Integer, nullable=True)  # Time in seconds
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    question = relationship("Question", back_populates="performances")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "domain": self.domain,
            "question_id": self.question_id,
            "is_correct": self.is_correct,
            "difficulty": self.difficulty,
            "points_earned": self.points_earned,
            "time_taken": self.time_taken,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class UserDomainProgress(Base):
    """Model for tracking user progress in assessment domains"""
    __tablename__ = "user_domain_progresses"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True)
    domain = Column(String(50), nullable=False)
    performance_score = Column(Float, nullable=False, default=0.0)
    highest_difficulty = Column(Integer, nullable=False, default=1)
    questions_answered = Column(Integer, nullable=False, default=0)
    questions_correct = Column(Integer, nullable=False, default=0)
    points_earned = Column(Integer, nullable=False, default=0)
    last_question_timestamp = Column(DateTime, nullable=True)
    is_completed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Composite unique constraint on user_id and domain
    __table_args__ = (
        {'sqlite_autoincrement': True},
    )
    
    def update_progress(self, is_correct: bool, difficulty: int, points: int):
        """Update progress based on a new performance record"""
        self.questions_answered += 1
        
        if is_correct:
            self.questions_correct += 1
            
        self.points_earned += points
        
        # Update highest difficulty if this one was higher
        if difficulty > self.highest_difficulty:
            self.highest_difficulty = difficulty
            
        # Calculate new performance score (weighted by difficulty)
        if self.questions_answered > 0:
            self.performance_score = (
                self.questions_correct / self.questions_answered
            ) * (self.highest_difficulty / 5.0)
            
        self.last_question_timestamp = datetime.utcnow()
        
        # Check if domain is completed
        if (self.questions_correct >= 10 and self.performance_score >= 0.8) or self.questions_answered >= 15:
            self.is_completed = True
            
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary"""
        return {
            "user_id": self.user_id,
            "domain": self.domain,
            "performance_score": self.performance_score,
            "highest_difficulty": self.highest_difficulty,
            "questions_answered": self.questions_answered,
            "questions_correct": self.questions_correct,
            "points_earned": self.points_earned,
            "is_completed": self.is_completed,
            "last_question_timestamp": self.last_question_timestamp.isoformat() if self.last_question_timestamp else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class AssessmentSession(Base):
    """Model for tracking assessment sessions"""
    __tablename__ = "assessment_sessions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True)
    domain = Column(String(50), nullable=True)
    is_completed = Column(Boolean, nullable=False, default=False)
    questions_asked = Column(Integer, nullable=False, default=0)
    questions_correct = Column(Integer, nullable=False, default=0)
    total_points = Column(Integer, nullable=False, default=0)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary"""
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


class User(Base):
    """Model for users (simplified for assessment purposes)"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), nullable=False, unique=True)
    first_name = Column(String(50), nullable=True)
    last_name = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    school_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "username": self.username,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "email": self.email,
            "school_id": self.school_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
        
    def get_full_name(self) -> str:
        """Get user's full name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        elif self.first_name:
            return self.first_name
        elif self.last_name:
            return self.last_name
        else:
            return self.username