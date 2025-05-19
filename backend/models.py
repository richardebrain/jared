"""
Database models for the MentorMe assessment system
"""
import json
import enum
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Union, cast

from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime,
    ForeignKey, Enum, Float, Table, JSON, UniqueConstraint
)
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("mentorme.models")


class QuestionType(enum.Enum):
    """Question types"""
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    FILL_BLANK = "fill_blank"
    SHORT_ANSWER = "short_answer"
    MATCHING = "matching"


# Many-to-many relationship between questions and tags
question_tags = Table(
    "question_tags",
    Base.metadata,
    Column("question_id", Integer, ForeignKey("questions.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
)


class User(Base):
    """User model"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=True)
    first_name = Column(String(50), nullable=True)
    last_name = Column(String(50), nullable=True)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=True)
    role = Column(String(20), default="teacher")  # teacher, admin, owner
    profile_image_url = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    total_points = Column(Integer, default=0)
    
    # Relationships
    school = relationship("School", back_populates="users")
    answers = relationship("Answer", back_populates="user", cascade="all, delete-orphan")
    domain_progress = relationship("UserDomainProgress", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User {self.username}>"


class School(Base):
    """School model"""
    __tablename__ = "schools"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    contact_email = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    address = Column(String(255), nullable=True)
    logo_url = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    is_default = Column(Boolean, default=False)
    
    # Relationships
    users = relationship("User", back_populates="school")
    subscriptions = relationship("Subscription", back_populates="school", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<School {self.name}>"


class Subscription(Base):
    """Subscription model"""
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False)
    plan_name = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    max_users = Column(Integer, default=10)
    features = Column(JSON, nullable=True)
    stripe_customer_id = Column(String(100), nullable=True)
    stripe_subscription_id = Column(String(100), nullable=True)
    
    # Relationships
    school = relationship("School", back_populates="subscriptions")
    
    def __repr__(self):
        return f"<Subscription {self.school.name} - {self.plan_name}>"


class Domain(Base):
    """Domain model"""
    __tablename__ = "domains"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<Domain {self.name}>"


class Tag(Base):
    """Tag model"""
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)
    
    def __repr__(self):
        return f"<Tag {self.name}>"


class Question(Base):
    """Question model"""
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True)
    question = Column(Text, nullable=False)
    domain = Column(String(100), nullable=False)
    sub_domain = Column(String(100), nullable=True)
    difficulty = Column(Integer, nullable=False, default=1)
    q_type = Column(Enum(QuestionType), nullable=False)
    correct_answer = Column(String(255), nullable=False)
    explanation = Column(Text, nullable=True)
    hints = Column(JSON, default=list)
    options = Column(JSON, default=dict)
    resources = Column(JSON, default=list)
    time_limit = Column(Integer, nullable=True)  # Time limit in seconds
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    tags = relationship("Tag", secondary=question_tags, backref="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Question {self.id}: {self.question[:30]}...>"
    
    @hybrid_property
    def points_value(self) -> int:
        """Calculate points value based on difficulty"""
        return self.difficulty * 10
    
    def is_correct(self, answer: str) -> bool:
        """Check if an answer is correct"""
        if not answer:
            return False
        
        if self.q_type == QuestionType.MULTIPLE_CHOICE:
            # For multiple choice, compare the letter/option key
            return answer.strip().upper() == self.correct_answer.strip().upper()
        elif self.q_type == QuestionType.TRUE_FALSE:
            # For true/false, normalize to T/F
            user_ans = answer.strip().lower()
            if user_ans in ("true", "t", "yes", "y", "1"):
                user_ans = "T"
            elif user_ans in ("false", "f", "no", "n", "0"):
                user_ans = "F"
            return user_ans.upper() == self.correct_answer.strip().upper()
        elif self.q_type == QuestionType.FILL_BLANK:
            # For fill in the blank, exact match but case insensitive
            return answer.strip().lower() == self.correct_answer.strip().lower()
        elif self.q_type == QuestionType.SHORT_ANSWER:
            # For short answer, check if correct answer is in the user's answer
            # This is a simple implementation; in production, you might use NLP
            correct_keywords = [k.strip().lower() for k in self.correct_answer.split(",")]
            return any(keyword in answer.strip().lower() for keyword in correct_keywords)
        elif self.q_type == QuestionType.MATCHING:
            # For matching, parse JSON and compare
            try:
                user_matches = json.loads(answer)
                correct_matches = json.loads(self.correct_answer)
                return user_matches == correct_matches
            except json.JSONDecodeError:
                return False
        
        return False


class Answer(Base):
    """User answer model"""
    __tablename__ = "answers"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    session_id = Column(String(50), nullable=False)
    answer_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    time_taken = Column(Integer, nullable=True)  # Time taken in seconds
    points_earned = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="answers")
    question = relationship("Question", back_populates="answers")
    
    def __repr__(self):
        return f"<Answer {self.id}: User {self.user_id}, Question {self.question_id}>"


class UserDomainProgress(Base):
    """User progress in a specific domain"""
    __tablename__ = "user_domain_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "domain", name="uq_user_domain"),
    )
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    domain = Column(String(100), nullable=False)
    current_level = Column(Integer, default=1)
    highest_difficulty = Column(Integer, default=1)
    questions_attempted = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    total_points = Column(Integer, default=0)
    last_activity = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="domain_progress")
    
    def __repr__(self):
        return f"<UserDomainProgress {self.user_id}: {self.domain}>"
    
    @hybrid_property
    def accuracy(self) -> float:
        """Calculate accuracy percentage"""
        if self.questions_attempted == 0:
            return 0.0
        
        return round((self.questions_correct / self.questions_attempted) * 100, 1)


class LearningPathRecommendation(Base):
    """Learning path recommendations for users"""
    __tablename__ = "learning_path_recommendations"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    domain = Column(String(100), nullable=False)
    difficulty = Column(Integer, default=1)
    resource_type = Column(String(50), nullable=False)  # video, quiz, reading, etc.
    resource_id = Column(String(100), nullable=True)  # ID of the specific resource
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    
    def __repr__(self):
        return f"<LearningPathRecommendation {self.id}: {self.title}>"


class AnswerFeedback:
    """Feedback on a user's answer (non-persistent class)"""
    
    def __init__(
        self,
        question_id: int,
        user_id: int,
        session_id: str,
        is_correct: bool,
        difficulty: int,
        points_earned: int,
        domain: str,
        correct_answer: str,
        explanation: Optional[str] = None,
        message: Optional[str] = None,
        next_difficulty: int = 0,
        resources: Optional[List[Dict[str, str]]] = None
    ):
        self.question_id = question_id
        self.user_id = user_id
        self.session_id = session_id
        self.is_correct = is_correct
        self.difficulty = difficulty
        self.points_earned = points_earned
        self.domain = domain
        self.correct_answer = correct_answer
        self.explanation = explanation
        self.message = message or ""
        self.next_difficulty = next_difficulty
        self.resources = resources or []
        self.timestamp = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "question_id": self.question_id,
            "user_id": self.user_id,
            "is_correct": self.is_correct,
            "difficulty": self.difficulty,
            "points_earned": self.points_earned,
            "domain": self.domain,
            "correct_answer": self.correct_answer,
            "explanation": self.explanation,
            "message": self.message,
            "next_difficulty": self.next_difficulty,
            "resources": self.resources,
            "timestamp": self.timestamp.isoformat()
        }