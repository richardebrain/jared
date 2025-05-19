"""
Database models for the MentorMe Enhanced Assessment system
"""

import json
from datetime import datetime
from typing import Optional, Dict, List, Any, Union

from sqlalchemy import (
    Column, Integer, String, Boolean, Text, 
    ForeignKey, DateTime, JSON, Float, 
    create_engine, inspect
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, Session
from sqlalchemy.sql import func

Base = declarative_base()

class Question(Base):
    """Question model for assessment questions"""
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True)
    question = Column(Text, nullable=False)
    q_type = Column(String(20), nullable=False, default="multiple_choice")  # multiple_choice, true_false, etc.
    options = Column(Text, nullable=True)  # JSON string of options
    answer = Column(String(255), nullable=False)
    domain = Column(String(100), nullable=False)  # Classroom Management, Child Development, etc.
    difficulty = Column(Integer, nullable=False, default=1)  # 1-5 scale
    sub_competency = Column(String(255), nullable=True)  # Sub-competency within the domain
    enhanced_content = Column(Text, nullable=True)  # JSON string of enhanced content
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    responses = relationship("QuestionResponse", back_populates="question")

    def get_options(self) -> Dict[str, str]:
        """Get options as a dictionary"""
        if self.options:
            return json.loads(self.options)
        return {}

    def get_enhanced_content(self) -> Dict[str, Any]:
        """Get enhanced content as a dictionary"""
        if self.enhanced_content:
            return json.loads(self.enhanced_content)
        return {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "question": self.question,
            "q_type": self.q_type,
            "options": self.get_options(),
            "domain": self.domain,
            "difficulty": self.difficulty,
            "enhanced_content": self.get_enhanced_content(),
            "sub_competency": self.sub_competency
        }


class Assessment(Base):
    """Assessment model to track user assessments"""
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    start_time = Column(DateTime, default=func.now())
    end_time = Column(DateTime, nullable=True)
    completed = Column(Boolean, default=False)
    
    # Assessment metrics
    questions_asked = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    points_earned = Column(Integer, default=0)
    
    # Relationships
    responses = relationship("QuestionResponse", back_populates="assessment")

    def calculate_score(self) -> float:
        """Calculate the score as a percentage"""
        if self.questions_asked == 0:
            return 0.0
        return (self.questions_correct / self.questions_asked) * 100.0
    
    def get_domain_scores(self, db: Session) -> Dict[str, float]:
        """Get scores by domain"""
        domain_scores = {}
        
        if not self.responses:
            return domain_scores
            
        domain_totals = {}
        domain_correct = {}
        
        for response in self.responses:
            # Get the question to access its domain
            question = db.query(Question).filter(Question.id == response.question_id).first()
            if not question:
                continue
                
            domain = question.domain
            
            if domain not in domain_totals:
                domain_totals[domain] = 0
                domain_correct[domain] = 0
                
            domain_totals[domain] += 1
            if response.is_correct:
                domain_correct[domain] += 1
        
        # Calculate scores for each domain
        for domain in domain_totals:
            if domain_totals[domain] > 0:
                domain_scores[domain] = (domain_correct[domain] / domain_totals[domain]) * 100.0
            else:
                domain_scores[domain] = 0.0
                
        return domain_scores
    
    def get_strongest_domain(self, db: Session) -> str:
        """Get the domain with the highest score"""
        domain_scores = self.get_domain_scores(db)
        if not domain_scores:
            return "None"
            
        return max(domain_scores, key=domain_scores.get)
    
    def get_weakest_domain(self, db: Session) -> str:
        """Get the domain with the lowest score"""
        domain_scores = self.get_domain_scores(db)
        if not domain_scores:
            return "None"
            
        return min(domain_scores, key=domain_scores.get)


class QuestionResponse(Base):
    """Model to track responses to questions in an assessment"""
    __tablename__ = "question_responses"

    id = Column(Integer, primary_key=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    
    user_answer = Column(String(255), nullable=False)
    is_correct = Column(Boolean, nullable=False)
    time_taken_ms = Column(Integer, nullable=True)  # Time taken to answer in milliseconds
    difficulty = Column(Integer, nullable=False)  # Difficulty level of the question
    
    answered_at = Column(DateTime, default=func.now())
    
    # Relationships
    assessment = relationship("Assessment", back_populates="responses")
    question = relationship("Question", back_populates="responses")


class UserPerformance(Base):
    """Model to track user performance by domain"""
    __tablename__ = "user_performance"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    domain = Column(String(100), nullable=False)
    
    questions_attempted = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    highest_difficulty = Column(Integer, default=1)
    is_proficient = Column(Boolean, default=False)
    
    last_updated = Column(DateTime, default=func.now(), onupdate=func.now())

    def calculate_performance(self) -> float:
        """Calculate performance as a ratio between 0 and 1"""
        if self.questions_attempted == 0:
            return 0.0
        return self.questions_correct / self.questions_attempted