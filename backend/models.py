"""
Database models for the MentorMe Enhanced Assessment system
"""

import json
from datetime import datetime
from typing import Dict, List, Any, Optional

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Float, func
from sqlalchemy.orm import relationship, Session

from .database import Base

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

    responses = relationship("QuestionResponse", back_populates="question")

    def get_options(self) -> Dict[str, str]:
        """Get options as a dictionary"""
        if not self.options:
            return {}
        try:
            return json.loads(str(self.options))
        except json.JSONDecodeError:
            return {}

    def get_enhanced_content(self) -> Dict[str, Any]:
        """Get enhanced content as a dictionary"""
        if not self.enhanced_content:
            return {}
        try:
            return json.loads(str(self.enhanced_content))
        except json.JSONDecodeError:
            return {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "question": self.question,
            "q_type": self.q_type,
            "options": self.get_options(),
            "answer": self.answer,
            "domain": self.domain,
            "difficulty": self.difficulty,
            "sub_competency": self.sub_competency,
            "enhanced_content": self.get_enhanced_content(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }

class Assessment(Base):
    """Assessment model to track user assessments"""
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    start_time = Column(DateTime, default=func.now())
    end_time = Column(DateTime, nullable=True)
    completed = Column(Boolean, default=False)

    questions_asked = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    points_earned = Column(Integer, default=0)

    responses = relationship("QuestionResponse", back_populates="assessment")

    def calculate_score(self) -> float:
        """Calculate the score as a percentage"""
        if not self.questions_asked:
            return 0.0
        
        if isinstance(self.questions_correct, (int, float)) and isinstance(self.questions_asked, (int, float)):
            return (self.questions_correct / self.questions_asked) * 100.0
        
        return 0.0

    def get_domain_scores(self, db: Session) -> Dict[str, float]:
        """Get scores by domain"""
        domain_scores = {}
        domain_counts = {}
        
        for response in self.responses:
            question = response.question
            if question.domain not in domain_scores:
                domain_scores[question.domain] = 0
                domain_counts[question.domain] = 0
                
            domain_counts[question.domain] += 1
            if response.is_correct:
                domain_scores[question.domain] += 1
        
        # Calculate percentage scores
        for domain in domain_scores:
            if domain_counts[domain] > 0:
                domain_scores[domain] = (domain_scores[domain] / domain_counts[domain]) * 100.0
            else:
                domain_scores[domain] = 0.0
        
        return domain_scores

    def get_strongest_domain(self, db: Session) -> str:
        """Get the domain with the highest score"""
        domain_scores = self.get_domain_scores(db)
        
        if not domain_scores:
            return "None"
            
        max_domain = max(domain_scores.items(), key=lambda x: x[1])
        return max_domain[0]

    def get_weakest_domain(self, db: Session) -> str:
        """Get the domain with the lowest score"""
        domain_scores = self.get_domain_scores(db)
        
        if not domain_scores:
            return "None"
            
        min_domain = min(domain_scores.items(), key=lambda x: x[1])
        return min_domain[0]

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
        if not self.questions_attempted:
            return 0.0
            
        if isinstance(self.questions_correct, (int, float)) and isinstance(self.questions_attempted, (int, float)):
            return min(1.0, max(0.0, self.questions_correct / self.questions_attempted))
            
        return 0.0