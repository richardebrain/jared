"""
Database models for the MentorMe assessment system
"""

import json
import math
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional

from sqlalchemy import (
    Column, Integer, String, Boolean, 
    Float, Text, DateTime, ForeignKey, JSON,
    and_, or_, func, desc
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import expression

from .database import Base

class Question(Base):
    """Question model for assessments"""
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    question = Column(Text, nullable=False)
    correct_answer = Column(String(255), nullable=False)
    options = Column(Text)  # JSON string of answer options
    q_type = Column(String(50), default="multiple_choice")  # multiple_choice, true_false, short_answer, fill_in_blank
    difficulty = Column(Integer, default=1)  # 1-5
    domain = Column(String(100), index=True)
    sub_domain = Column(String(100), nullable=True)
    tags = Column(Text, nullable=True)  # JSON array of tag strings
    enhanced_content = Column(Text, nullable=True)  # JSON object with additional content
    time_limit = Column(Integer, default=60)  # seconds
    points = Column(Integer, default=10)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Define relationships
    performances = relationship("UserPerformance", back_populates="question")
    
    def __init__(self, **kwargs):
        """Initialize the question with provided data"""
        # Convert dict fields to JSON
        if 'options' in kwargs and isinstance(kwargs['options'], dict):
            kwargs['options'] = json.dumps(kwargs['options'])
        
        if 'tags' in kwargs and isinstance(kwargs['tags'], list):
            kwargs['tags'] = json.dumps(kwargs['tags'])
            
        if 'enhanced_content' in kwargs and isinstance(kwargs['enhanced_content'], dict):
            kwargs['enhanced_content'] = json.dumps(kwargs['enhanced_content'])
        
        super().__init__(**kwargs)
    
    def get_options(self) -> Dict[str, str]:
        """Get options as a dictionary"""
        if not self.options:
            return {}
        
        try:
            return json.loads(self.options)
        except json.JSONDecodeError:
            return {}
    
    def get_tags(self) -> List[str]:
        """Get tags as a list"""
        if not self.tags:
            return []
        
        try:
            return json.loads(self.tags)
        except json.JSONDecodeError:
            return []
    
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
        # For multiple choice and true/false
        if self.q_type in ['multiple_choice', 'true_false']:
            return user_answer.upper() == self.correct_answer.upper()
        
        # For short answer and fill in blank, allow more flexibility
        elif self.q_type in ['short_answer', 'fill_in_blank']:
            # Normalize both answers for comparison
            user_clean = user_answer.strip().lower()
            correct_clean = self.correct_answer.strip().lower()
            
            # Exact match
            if user_clean == correct_clean:
                return True
            
            # Check for close match (e.g., allow minor typos)
            # This would be a place to add more sophisticated matching
            if len(user_clean) > 3 and len(correct_clean) > 3:
                # Simple matching based on containing the key parts
                if user_clean in correct_clean or correct_clean in user_clean:
                    return True
                
                # Check if all words in correct answer are in user answer
                correct_words = correct_clean.split()
                user_words = user_clean.split()
                
                matches = sum(1 for word in correct_words if any(
                    word in u_word or u_word in word for u_word in user_words
                ))
                
                if matches / len(correct_words) >= 0.8:  # 80% match
                    return True
            
            return False
        
        return False
    
    def calculate_points(self, is_correct: bool, time_taken: Optional[int] = None) -> int:
        """
        Calculate points earned for this question based on correctness and time
        
        Args:
            is_correct: Whether the answer was correct
            time_taken: Time taken to answer in seconds (optional)
            
        Returns:
            Points earned
        """
        if not is_correct:
            return 0
        
        base_points = self.points
        difficulty_multiplier = math.pow(1.2, self.difficulty - 1)  # Higher difficulty = more points
        
        # Apply difficulty multiplier
        earned_points = base_points * difficulty_multiplier
        
        # Apply time bonus if applicable
        if time_taken is not None and self.time_limit > 0:
            time_factor = 1.0
            
            # If answered quickly, give bonus (up to 50%)
            if time_taken < self.time_limit * 0.5:
                time_factor = 1.5 - (time_taken / self.time_limit)  # Between
                time_factor = min(1.5, max(1.0, time_factor))  # Cap between 1.0-1.5
            
            earned_points *= time_factor
            
        return int(earned_points)
    
    def sanitize_for_api(self) -> Dict[str, Any]:
        """
        Prepare question for API response, without revealing the answer
        """
        options = self.get_options()
        
        # For true/false, ensure standard options
        if self.q_type == 'true_false' and (not options or len(options) < 2):
            options = {'A': 'True', 'B': 'False'}
        
        # Get enhanced content safely
        enhanced = self.get_enhanced_content()
        
        # Create base response
        result = {
            'id': self.id,
            'question': self.question,
            'q_type': self.q_type,
            'options': options,
            'domain': self.domain,
            'difficulty': self.difficulty,
            'time_limit': self.time_limit,
            'points': self.points,
        }
        
        # Add enhanced content if available
        if enhanced:
            # Don't include explanation as it might reveal the answer
            safe_enhanced = {k: v for k, v in enhanced.items() if k != 'explanation'}
            if safe_enhanced:
                result['enhanced_content'] = safe_enhanced
        
        return result

class UserPerformance(Base):
    """User performance on individual questions"""
    __tablename__ = "user_performances"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    domain = Column(String(100), index=True, nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    is_correct = Column(Boolean, default=False)
    difficulty = Column(Integer, nullable=False)
    points_earned = Column(Integer, default=0)
    time_taken = Column(Integer, nullable=True)  # seconds
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Define relationships
    question = relationship("Question", back_populates="performances")

class UserDomainProgress(Base):
    """User progress in a specific learning domain"""
    __tablename__ = "user_domain_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    domain = Column(String(100), index=True, nullable=False)
    current_difficulty = Column(Integer, default=1)
    questions_answered = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    performance_score = Column(Float, default=0.5)  # 0.0 to 1.0
    total_points = Column(Integer, default=0)
    last_activity = Column(DateTime, default=datetime.utcnow)
    mastered = Column(Boolean, default=False)
    proficiency_level = Column(Integer, default=1)  # 1-5
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            'user_id': self.user_id,
            'domain': self.domain,
            'current_difficulty': self.current_difficulty,
            'questions_answered': self.questions_answered,
            'questions_correct': self.questions_correct,
            'performance_score': self.performance_score,
            'total_points': self.total_points,
            'last_activity': self.last_activity.isoformat() if self.last_activity else None,
            'mastered': self.mastered,
            'proficiency_level': self.proficiency_level
        }

class AssessmentSession(Base):
    """Assessment session tracking"""
    __tablename__ = "assessment_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    domain = Column(String(100), index=True, nullable=True)  # Nullable for general assessments
    is_completed = Column(Boolean, default=False)
    questions_asked = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    total_points = Column(Integer, default=0)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'domain': self.domain,
            'is_completed': self.is_completed,
            'questions_asked': self.questions_asked,
            'questions_correct': self.questions_correct,
            'total_points': self.total_points,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'duration': (self.completed_at - self.started_at).total_seconds() if self.completed_at else None
        }

class User:
    """
    User class for generating personalized responses
    This is not a database model but a helper class
    """
    def __init__(self, id: int, name: str = None):
        self.id = id
        self.name = name or "Student"

    @staticmethod
    def get_by_id(user_id: int, db) -> 'User':
        """Get user by ID from database"""
        # This would typically query your User table
        # But for simplicity, we'll just return a new User object
        return User(id=user_id)

# Helper classes for API responses

class AnswerFeedback:
    """Class to provide personalized feedback for question answers"""
    def __init__(
        self, 
        correct: bool, 
        correct_answer: str, 
        personal_message: str, 
        teaching_explanation: str,
        next_difficulty: int = None
    ):
        self.correct = correct
        self.correct_answer = correct_answer
        self.personal_message = personal_message
        self.teaching_explanation = teaching_explanation
        self.next_difficulty = next_difficulty
    
    def to_dict(self):
        """Convert to dictionary for API response"""
        return {
            'correct': self.correct,
            'correct_answer': self.correct_answer,
            'personal_message': self.personal_message,
            'teaching_explanation': self.teaching_explanation,
            'next_difficulty': self.next_difficulty
        }

class LearningPath:
    """Class to generate personalized learning path recommendations"""
    def __init__(
        self,
        learning_path: Dict[str, List[str]],
        domain_scores: Dict[str, float],
        questions_asked: int,
        questions_correct: int,
        strongest_domain: str,
        weakest_domain: str,
        user_name: str = None,
        total_points_earned: int = 10
    ):
        self.learning_path = learning_path
        self.domain_scores = domain_scores
        self.questions_asked = questions_asked
        self.questions_correct = questions_correct
        self.strongest_domain = strongest_domain
        self.weakest_domain = weakest_domain
        self.user_name = user_name or "Student"
        self.total_points_earned = total_points_earned
        
        # Calculate accuracy percentage
        if questions_asked > 0:
            self.accuracy = (questions_correct / questions_asked) * 100
        else:
            self.accuracy = 0
    
    def to_dict(self):
        """Convert to dictionary for API response"""
        return {
            'learning_path': self.learning_path,
            'domain_scores': self.domain_scores,
            'assessment_results': {
                'questions_asked': self.questions_asked,
                'questions_correct': self.questions_correct,
                'accuracy': self.accuracy,
                'strongest_domain': self.strongest_domain,
                'weakest_domain': self.weakest_domain,
                'total_points_earned': self.total_points_earned
            },
            'user_name': self.user_name,
            'celebration_message': self._generate_celebration_message()
        }
    
    def _generate_celebration_message(self) -> str:
        """Generate a personalized celebration message"""
        messages = [
            f"Great job, {self.user_name}! You've earned {self.total_points_earned} points!",
            f"Excellent work, {self.user_name}! Your knowledge in {self.strongest_domain} is impressive!",
            f"Congratulations, {self.user_name}! You're making great progress in your professional development!",
            f"Amazing effort, {self.user_name}! Keep up the excellent work!",
            f"Well done, {self.user_name}! You're on your way to becoming a Master Lead Teacher!"
        ]
        return random.choice(messages)

class QuestionResponse:
    """Class to represent a formatted question for API response"""
    def __init__(
        self,
        id: int,
        question: str,
        q_type: str,
        options: Dict[str, str],
        domain: str,
        difficulty: int,
        enhanced_content: Dict[str, Any] = None
    ):
        self.id = id
        self.question = question
        self.q_type = q_type
        self.options = options
        self.domain = domain
        self.difficulty = difficulty
        self.enhanced_content = enhanced_content or {}
    
    def to_dict(self):
        """Convert to dictionary for API response"""
        result = {
            'id': self.id,
            'question': self.question,
            'q_type': self.q_type,
            'options': self.options,
            'domain': self.domain,
            'difficulty': self.difficulty
        }
        
        if self.enhanced_content:
            result['enhanced_content'] = self.enhanced_content
            
        return result