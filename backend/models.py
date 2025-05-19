"""
Database models for the MentorMe assessment system
"""
import enum
import json
from datetime import datetime
from typing import Dict, List, Optional, Any, Union

from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, ForeignKey, 
    UniqueConstraint, JSON, Enum, Table, func
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import relationship

Base = declarative_base()

# Association tables
question_tags = Table(
    "question_tags",
    Base.metadata,
    Column("question_id", Integer, ForeignKey("questions.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
)


class QuestionType(enum.Enum):
    """Question types"""
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    FILL_BLANK = "fill_blank"
    SHORT_ANSWER = "short_answer"
    MATCHING = "matching"


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
        return f"<Subscription {self.plan_name} for School {self.school_id}>"


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
        base_points = 5
        return base_points * self.difficulty

    def is_correct(self, answer: str) -> bool:
        """Check if an answer is correct"""
        # Convert self.correct_answer to string if it's a SQLAlchemy object
        correct_answer = str(self.correct_answer) if hasattr(self.correct_answer, 'text') else self.correct_answer
        
        # For multiple choice, we expect A, B, C, D as the answer
        if self.q_type == QuestionType.MULTIPLE_CHOICE:
            return answer.upper().strip() == correct_answer.upper().strip()
        
        # For true/false, we expect T/F or True/False
        elif self.q_type == QuestionType.TRUE_FALSE:
            answer = answer.upper().strip()
            if answer in ["T", "TRUE"]:
                return correct_answer.upper() in ["T", "TRUE"]
            elif answer in ["F", "FALSE"]:
                return correct_answer.upper() in ["F", "FALSE"]
            return False
        
        # For fill in the blank, we do case-insensitive comparison
        elif self.q_type == QuestionType.FILL_BLANK:
            return answer.lower().strip() == correct_answer.lower().strip()
        
        # For short answer, check if correct_answer (or any comma-separated part) is contained in answer
        elif self.q_type == QuestionType.SHORT_ANSWER:
            answer_lower = answer.lower().strip()
            # Convert options to dict if it's stored as JSON string
            if isinstance(self.options, str):
                try:
                    options = json.loads(self.options)
                except json.JSONDecodeError:
                    options = {}
            else:
                options = self.options or {}
            
            # If there are multiple possible answers
            correct_answers = [a.lower().strip() for a in correct_answer.split(",")]
            
            # Check if any acceptable answer is in the user's response
            return any(correct in answer_lower for correct in correct_answers)
        
        # For matching, expect a JSON object mapping keys to values
        elif self.q_type == QuestionType.MATCHING:
            try:
                # Parse both the correct answer and submitted answer
                expected = json.loads(correct_answer) if isinstance(correct_answer, str) else correct_answer
                submitted = json.loads(answer) if isinstance(answer, str) else answer
                
                # Check if all mappings match
                return expected == submitted
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
        return f"<Answer {self.id} by User {self.user_id} for Question {self.question_id}>"


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
        return f"<UserDomainProgress for User {self.user_id} in {self.domain}>"

    @hybrid_property
    def accuracy(self) -> float:
        """Calculate accuracy percentage"""
        if not self.questions_attempted:
            return 0.0
        return round(100 * self.questions_correct / self.questions_attempted, 1)


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
        return f"<LearningPathRecommendation for User {self.user_id}: {self.title}>"


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
        self.message = message or self._default_message(is_correct)
        self.next_difficulty = next_difficulty if next_difficulty > 0 else difficulty
        self.resources = resources or []

    def _default_message(self, is_correct: bool) -> str:
        """Generate a default feedback message"""
        if is_correct:
            return "That's correct! Great job!"
        return "Sorry, that's not correct. Keep trying!"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API response"""
        return {
            "question_id": self.question_id,
            "user_id": self.user_id,
            "session_id": self.session_id,
            "is_correct": self.is_correct,
            "difficulty": self.difficulty,
            "points_earned": self.points_earned,
            "domain": self.domain,
            "correct_answer": self.correct_answer,
            "explanation": self.explanation,
            "message": self.message,
            "next_difficulty": self.next_difficulty,
            "resources": self.resources
        }