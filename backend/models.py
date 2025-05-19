"""
Database models for the FastAPI backend
"""

import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from .database import Base

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("models")

class Question(Base):
    """Model for assessment questions"""
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    q_type = Column(String(50), default="multiple_choice")  # multiple_choice, true_false, short_answer
    options = Column(Text, nullable=True)  # JSON string of options
    domain = Column(String(100), nullable=False)  # Knowledge domain
    difficulty = Column(Integer, default=1)  # 1-5 scale
    sub_competency = Column(String(100), nullable=True)  # Optional sub-competency
    enhanced_content = Column(Text, nullable=True)  # JSON string with additional content
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    performance = relationship("UserPerformance", back_populates="question")
    
    def get_options(self) -> Dict[str, str]:
        """Get options as a dictionary"""
        if not self.options:
            return {}
        try:
            return json.loads(self.options)
        except json.JSONDecodeError:
            logger.error(f"Error decoding options JSON for question {self.id}")
            return {}
    
    def get_enhanced_content(self) -> Dict[str, Any]:
        """Get enhanced content as a dictionary"""
        if not self.enhanced_content:
            return {}
        try:
            return json.loads(self.enhanced_content)
        except json.JSONDecodeError:
            logger.error(f"Error decoding enhanced content JSON for question {self.id}")
            return {}
    
    def is_correct(self, user_answer: str) -> bool:
        """Check if the provided answer is correct"""
        if not user_answer:
            return False
        
        # For multiple choice, check if user answer matches the correct answer
        if self.q_type == "multiple_choice":
            return user_answer.strip().lower() == self.answer.strip().lower()
        
        # For true/false, check if user answer matches the correct answer
        elif self.q_type == "true_false":
            return user_answer.strip().lower() == self.answer.strip().lower()
        
        # For short answer, check if user answer contains the correct answer
        elif self.q_type == "short_answer":
            return self.answer.strip().lower() in user_answer.strip().lower()
        
        return False
    
    def calculate_points(self, is_correct: bool) -> int:
        """Calculate points for this question based on difficulty and correctness"""
        if not is_correct:
            return 0
        
        # Base points by difficulty
        base_points = min(self.difficulty * 2, 10)
        
        # Additional bonus for higher difficulties
        if self.difficulty >= 4:
            base_points += 2
        
        return base_points
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "question": self.question,
            "type": self.q_type,
            "options": self.get_options(),
            "domain": self.domain,
            "difficulty": self.difficulty,
            "sub_competency": self.sub_competency,
            "enhanced_content": self.get_enhanced_content(),
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class UserPerformance(Base):
    """Model for tracking user performance in specific domains"""
    __tablename__ = "user_performance"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    domain = Column(String(100), nullable=False)
    proficiency = Column(Float, default=0.0)  # 0.0 to 1.0
    questions_attempted = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    highest_difficulty = Column(Integer, default=0)
    last_difficulty = Column(Integer, default=1)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        # SQLAlchemy Index object would go here if needed
    )
    
    # Relationships
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=True)
    question = relationship("Question", back_populates="performance")
    
    def calculate_proficiency(self) -> float:
        """Calculate proficiency based on performance metrics"""
        if self.questions_attempted == 0:
            return 0.0
        
        # Base proficiency is the ratio of correct to attempted
        base_proficiency = self.questions_correct / self.questions_attempted
        
        # Adjust for difficulty level achieved
        difficulty_modifier = min(self.highest_difficulty / 5.0, 1.0)
        
        # Calculate final proficiency (weighted average)
        proficiency = (base_proficiency * 0.7) + (difficulty_modifier * 0.3)
        
        # Ensure proficiency is between 0.0 and 1.0
        return min(max(proficiency, 0.0), 1.0)
    
    def update_performance(self, is_correct: bool, difficulty: int) -> None:
        """Update performance metrics based on a new question attempt"""
        self.questions_attempted += 1
        
        if is_correct:
            self.questions_correct += 1
        
        # Update highest difficulty if current is higher
        if difficulty > self.highest_difficulty:
            self.highest_difficulty = difficulty
        
        # Update last difficulty
        self.last_difficulty = difficulty
        
        # Recalculate proficiency
        self.proficiency = self.calculate_proficiency()
        
        # Update last updated timestamp
        self.last_updated = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "user_id": self.user_id,
            "domain": self.domain,
            "proficiency": self.proficiency,
            "questions_attempted": self.questions_attempted,
            "questions_correct": self.questions_correct,
            "highest_difficulty": self.highest_difficulty,
            "last_difficulty": self.last_difficulty,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None
        }

class AssessmentResult(Base):
    """Model for storing assessment results"""
    __tablename__ = "assessment_results"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    total_questions = Column(Integer, default=0)
    correct_answers = Column(Integer, default=0)
    points_earned = Column(Integer, default=0)
    domains_assessed = Column(Text, nullable=True)  # JSON string of domains
    duration_seconds = Column(Integer, nullable=True)
    completed = Column(Boolean, default=False)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    def calculate_score(self) -> float:
        """Calculate the score as a percentage"""
        if self.total_questions == 0:
            return 0.0
        return (self.correct_answers / self.total_questions) * 100.0
    
    def get_domains(self) -> List[str]:
        """Get domains as a list"""
        if not self.domains_assessed:
            return []
        try:
            return json.loads(self.domains_assessed)
        except json.JSONDecodeError:
            logger.error(f"Error decoding domains JSON for assessment {self.id}")
            return []
    
    def complete_assessment(self) -> None:
        """Mark the assessment as completed and set completion time"""
        if not self.completed:
            self.completed = True
            self.completed_at = datetime.utcnow()
            
            if self.started_at:
                # Calculate duration in seconds
                duration = (self.completed_at - self.started_at).total_seconds()
                self.duration_seconds = int(duration)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "total_questions": self.total_questions,
            "correct_answers": self.correct_answers,
            "points_earned": self.points_earned,
            "score": self.calculate_score(),
            "domains": self.get_domains(),
            "duration_seconds": self.duration_seconds,
            "completed": self.completed,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None
        }