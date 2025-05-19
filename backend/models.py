"""
Database models for the assessment system
"""
import json
from sqlalchemy import (
    Boolean,
    Column,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
    Table,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from .database import Base


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    
    # Categorization
    domain = Column(String, index=True)  # e.g., "Core Values", "Child Development", etc.
    sub_competency = Column(String, index=True)  # More specific category
    difficulty = Column(Integer)  # 1-4
    q_type = Column(String)  # mcq, etc.

    # Question content
    question_text = Column(Text)
    option_a = Column(Text)
    option_b = Column(Text)
    option_c = Column(Text)
    option_d = Column(Text)
    answer = Column(String)  # A, B, C, or D

    # Extended content for learning
    teaching_explanation = Column(Text)
    story_why = Column(Text, nullable=True)
    implementation_how = Column(Text, nullable=True)
    reflection_considerations = Column(Text, nullable=True)
    child_impact_story = Column(Text, nullable=True)
    science_behind_it = Column(Text, nullable=True)
    practical_application_strategy = Column(Text, nullable=True)
    why_behind_it = Column(Text, nullable=True)
    resources = Column(JSON, nullable=True)  # JSON array of resource IDs

    def __repr__(self):
        return f"<Question {self.id}: {self.domain} - {self.difficulty}>"
    
    def to_dict(self):
        """Convert the question to a dictionary for API responses"""
        return {
            "id": self.id,
            "question": self.question_text,
            "q_type": self.q_type,
            "options": {
                "A": self.option_a,
                "B": self.option_b,
                "C": self.option_c,
                "D": self.option_d,
            },
            "domain": self.domain,
            "difficulty": self.difficulty,
        }


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    started_at = Column(String)  # ISO timestamp
    completed_at = Column(String, nullable=True)  # ISO timestamp

    # Results
    questions_asked = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)

    # Analysis
    domain_scores = Column(JSON)  # JSON object with domain scores
    learning_path = Column(JSON, nullable=True)  # Recommended learning path

    # Relationships
    responses = relationship("Response", back_populates="assessment")

    def __repr__(self):
        return f"<Assessment {self.id}: User {self.user_id}>"


class Response(Base):
    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    
    # Response data
    user_answer = Column(String)  # A, B, C, or D
    is_correct = Column(Boolean)
    responded_at = Column(String)  # ISO timestamp
    time_taken_ms = Column(Integer, nullable=True)  # Response time in milliseconds

    # Relationships
    assessment = relationship("Assessment", back_populates="responses")
    question = relationship("Question")

    def __repr__(self):
        return f"<Response {self.id}: Assessment {self.assessment_id}, Question {self.question_id}>"