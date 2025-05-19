"""
Database models for the MentorMe assessment system
"""

import json
from datetime import datetime
from typing import Dict, List, Any, Optional
from sqlalchemy import (
    Boolean, Column, ForeignKey, Integer, String, Text, 
    DateTime, Float, func, select, desc
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, Session

# Create base class for SQLAlchemy models
Base = declarative_base()

class Question(Base):
    """Assessment question model"""
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    answer = Column(String(255), nullable=False)
    q_type = Column(String(50), default="multiple_choice")  # multiple_choice, true_false, short_answer
    options = Column(Text, nullable=True)  # JSON string of options
    domain = Column(String(100), nullable=False, index=True)  # Subject domain
    difficulty = Column(Integer, default=1)  # 1-5 difficulty scale
    sub_competency = Column(String(255), nullable=True)  # More specific competency area
    enhanced_content = Column(Text, nullable=True)  # JSON string with explanation, tips, etc.
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    responses = relationship("QuestionResponse", back_populates="question")
    
    def get_options(self) -> Dict[str, str]:
        """Convert options JSON string to dictionary"""
        if self.options:
            try:
                return json.loads(self.options)
            except json.JSONDecodeError:
                return {}
        return {}
    
    def get_enhanced_content(self) -> Dict[str, Any]:
        """Convert enhanced content JSON string to dictionary"""
        if self.enhanced_content:
            try:
                return json.loads(self.enhanced_content)
            except json.JSONDecodeError:
                return {}
        return {}

class Assessment(Base):
    """Assessment session model"""
    __tablename__ = "assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    start_time = Column(DateTime, default=datetime.now)
    end_time = Column(DateTime, nullable=True)
    completed = Column(Boolean, default=False)
    questions_asked = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    points_earned = Column(Integer, default=0)
    
    # Relationships
    responses = relationship("QuestionResponse", back_populates="assessment")
    
    def get_score(self) -> float:
        """Calculate percentage score"""
        if self.questions_asked == 0:
            return 0
        return (self.questions_correct / self.questions_asked) * 100
    
    def get_duration_seconds(self) -> Optional[int]:
        """Calculate assessment duration in seconds"""
        if self.end_time and self.start_time:
            return int((self.end_time - self.start_time).total_seconds())
        return None
    
    def get_domain_scores(self, db: Session) -> Dict[str, float]:
        """Get scores by domain"""
        scores = {}
        
        # Group responses by domain and calculate score for each
        domain_results = (
            db.query(
                QuestionResponse.domain,
                func.count(QuestionResponse.id).label("total"),
                func.sum(QuestionResponse.is_correct.cast(Integer)).label("correct")
            )
            .filter(QuestionResponse.assessment_id == self.id)
            .group_by(QuestionResponse.domain)
            .all()
        )
        
        for domain, total, correct in domain_results:
            if total > 0:
                scores[domain] = (correct / total) * 100
            else:
                scores[domain] = 0
                
        return scores
    
    def get_strongest_domain(self, db: Session) -> Optional[str]:
        """Get the domain with highest score"""
        domain_scores = self.get_domain_scores(db)
        if not domain_scores:
            return None
            
        return max(domain_scores.items(), key=lambda x: x[1])[0]
    
    def get_weakest_domain(self, db: Session) -> Optional[str]:
        """Get the domain with lowest score"""
        domain_scores = self.get_domain_scores(db)
        if not domain_scores:
            return None
            
        return min(domain_scores.items(), key=lambda x: x[1])[0]
    
    def get_highest_difficulty_reached(self, db: Session) -> int:
        """Get the highest difficulty level reached across all domains"""
        result = (
            db.query(func.max(QuestionResponse.difficulty))
            .filter(QuestionResponse.assessment_id == self.id)
            .scalar()
        )
        return result if result is not None else 1

class QuestionResponse(Base):
    """User response to a question"""
    __tablename__ = "question_responses"
    
    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    user_answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)
    time_taken_ms = Column(Integer, nullable=True)  # Time taken to answer in milliseconds
    difficulty = Column(Integer, nullable=False)  # Difficulty level of the question
    domain = Column(String(100), nullable=True)  # Copied from question for quicker queries
    answered_at = Column(DateTime, default=datetime.now)
    
    # Relationships
    assessment = relationship("Assessment", back_populates="responses")
    question = relationship("Question", back_populates="responses")
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # If domain not provided, copy it from the question
        if not self.domain and self.question:
            self.domain = self.question.domain

class UserPerformance(Base):
    """Tracks user performance in each domain"""
    __tablename__ = "user_performance"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    domain = Column(String(100), nullable=False)
    questions_attempted = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    highest_difficulty = Column(Integer, default=1)
    last_updated = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    __table_args__ = (
        # Composite unique constraint to ensure one record per user per domain
        dict(sqlite_autoincrement=True),
    )
    
    def get_performance_score(self) -> float:
        """Calculate performance score (0-1)"""
        if self.questions_attempted == 0:
            return 0
        return self.questions_correct / self.questions_attempted