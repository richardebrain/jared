"""
Data models for the MentorMe assessment system
"""

import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

# Create base class for declarative models
Base = declarative_base()

# Many-to-many relationship tables
question_tags = Table(
    'question_tags',
    Base.metadata,
    Column('question_id', Integer, ForeignKey('questions.id'), primary_key=True),
    Column('tag', String(50), primary_key=True)
)


class Domain(Base):
    """Domain model - represents a knowledge area for assessment"""
    __tablename__ = "domains"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    questions = relationship("Question", back_populates="domain")
    progress = relationship("UserDomainProgress", back_populates="domain")
    
    def __init__(self, name: str, description: Optional[str] = None):
        self.name = name
        self.description = description


class Question(Base):
    """Question model - represents an assessment question"""
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    question_text = Column(Text, nullable=False)
    correct_answer = Column(String(255), nullable=False)
    q_type = Column(String(50), default="multiple_choice")
    difficulty = Column(Integer, default=1)
    domain_id = Column(Integer, ForeignKey("domains.id"))
    sub_domain = Column(String(100))
    options = Column(Text)  # JSON string of options
    explanation = Column(Text)
    hints = Column(Text)
    resources = Column(Text)  # JSON string of resources
    time_limit = Column(Integer)  # Seconds
    points = Column(Integer, default=10)
    is_active = Column(Boolean, default=True)
    enhanced_content = Column(Text)  # JSON string of enhanced content
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    domain = relationship("Domain", back_populates="questions")
    answers = relationship("UserAnswer", back_populates="question")
    tags = relationship("Tag", secondary=question_tags, backref="questions")
    
    def get_options(self) -> Dict[str, str]:
        """Get options as a dictionary"""
        if self.options:
            return json.loads(self.options)
        return {}
    
    def get_resources(self) -> List[Dict[str, str]]:
        """Get resources as a list of dictionaries"""
        if self.resources:
            return json.loads(self.resources)
        return []
    
    def get_enhanced_content(self) -> Dict[str, Any]:
        """Get enhanced content as a dictionary"""
        if self.enhanced_content:
            return json.loads(self.enhanced_content)
        return {}
    
    def is_correct(self, answer: str) -> bool:
        """Check if the given answer is correct"""
        if self.q_type in ["multiple_choice", "single_choice"]:
            return answer.upper() == self.correct_answer.upper()
        else:
            return answer.strip().lower() == self.correct_answer.strip().lower()
    
    def calculate_points(self, time_taken: Optional[int] = None) -> int:
        """
        Calculate points based on difficulty and time taken
        
        Args:
            time_taken: Time taken to answer in seconds (optional)
            
        Returns:
            Points earned
        """
        # Base points based on difficulty
        if not self.points:
            base_points = self.difficulty * 5
        else:
            base_points = self.points
        
        # If no time limit or no time taken, return base points
        if not self.time_limit or not time_taken:
            return base_points
        
        # Time bonus: faster answers get more points
        time_ratio = time_taken / self.time_limit
        if time_ratio <= 0.5:  # Under half the time limit
            return int(base_points * 1.2)  # 20% bonus
        elif time_ratio <= 0.75:  # Under 3/4 of the time limit
            return int(base_points * 1.1)  # 10% bonus
        else:
            return base_points  # No bonus
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "question": self.question_text,
            "type": self.q_type,
            "difficulty": self.difficulty,
            "domain": self.domain.name if self.domain else None,
            "sub_domain": self.sub_domain,
            "options": self.get_options(),
            "time_limit": self.time_limit,
            "points": self.points,
            "hints": self.hints,
            "resources": self.get_resources(),
            "enhanced_content": self.get_enhanced_content()
        }


class Tag(Base):
    """Tag model - for categorizing questions"""
    __tablename__ = "tags"
    
    name = Column(String(50), primary_key=True)
    description = Column(Text)


class UserAnswer(Base):
    """UserAnswer model - represents a user's answer to a question"""
    __tablename__ = "user_answers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"))
    answer = Column(String(255), nullable=False)
    is_correct = Column(Boolean)
    points_earned = Column(Integer, default=0)
    time_taken = Column(Integer)  # Seconds
    created_at = Column(DateTime, default=datetime.utcnow)
    assessment_session = Column(String(36), index=True)  # UUID for grouping answers in a session
    
    # Relationships
    question = relationship("Question", back_populates="answers")
    
    def __init__(
        self,
        user_id: int,
        question_id: int,
        answer: str,
        is_correct: bool,
        points_earned: int = 0,
        time_taken: Optional[int] = None,
        assessment_session: Optional[str] = None
    ):
        self.user_id = user_id
        self.question_id = question_id
        self.answer = answer
        self.is_correct = is_correct
        self.points_earned = points_earned
        self.time_taken = time_taken
        self.assessment_session = assessment_session


class UserDomainProgress(Base):
    """UserDomainProgress model - tracks user progress in a specific domain"""
    __tablename__ = "user_domain_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    domain_id = Column(Integer, ForeignKey("domains.id"))
    current_level = Column(Integer, default=1)
    questions_answered = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    performance_score = Column(Float, default=0.0)
    mastered = Column(Boolean, default=False)
    last_assessment = Column(DateTime)
    points_earned = Column(Integer, default=0)
    streak = Column(Integer, default=0)
    
    # Relationships
    domain = relationship("Domain", back_populates="progress")
    
    def __init__(
        self,
        user_id: int,
        domain_id: int,
        current_level: int = 1
    ):
        self.user_id = user_id
        self.domain_id = domain_id
        self.current_level = current_level
        self.questions_answered = 0
        self.questions_correct = 0
        self.performance_score = 0.0
        self.mastered = False
        self.points_earned = 0
        self.streak = 0
        self.last_assessment = datetime.utcnow()
    
    def calculate_performance(self) -> float:
        """
        Calculate performance score based on correct answers and question difficulty
        
        Returns:
            Performance score as a float between 0.0 and 1.0
        """
        if not self.questions_answered:
            return 0.0
        
        return round(self.questions_correct / self.questions_answered, 2)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "domain": self.domain.name if self.domain else "",
            "level": self.current_level,
            "mastered": self.mastered,
            "questions_answered": self.questions_answered,
            "questions_correct": self.questions_correct,
            "performance": self.performance_score,
            "points_earned": self.points_earned,
            "streak": self.streak,
            "last_assessment": self.last_assessment.isoformat() if self.last_assessment else None
        }


class AnswerFeedback:
    """
    AnswerFeedback class - provides feedback for a user's answer
    This is not an ORM model, just a helper class for returning feedback
    """
    
    def __init__(
        self,
        question_id: int,
        is_correct: bool,
        correct_answer: str,
        points_earned: int = 0,
        explanation: Optional[str] = None,
        next_question_id: Optional[int] = None,
        feedback_message: Optional[str] = None,
        resources: Optional[List[Dict[str, str]]] = None
    ):
        self.question_id = question_id
        self.is_correct = is_correct
        self.correct_answer = correct_answer
        self.points_earned = points_earned
        self.explanation = explanation
        self.next_question_id = next_question_id
        self.feedback_message = feedback_message
        self.resources = resources or []
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "question_id": self.question_id,
            "is_correct": self.is_correct,
            "correct_answer": self.correct_answer,
            "points_earned": self.points_earned,
            "explanation": self.explanation,
            "next_question_id": self.next_question_id,
            "feedback_message": self.feedback_message,
            "resources": self.resources
        }