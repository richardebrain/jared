"""
Database models for the assessment system
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from .database import Base

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    question_text = Column(Text, nullable=False)
    domain = Column(String, index=True)  # e.g., "Core Values", "Child Development", etc.
    sub_competency = Column(String, index=True)  # More specific category
    difficulty = Column(Integer)  # 1-4
    q_type = Column(String)  # mcq, etc.
    
    # Options for multiple choice questions
    option_a = Column(Text)
    option_b = Column(Text)
    option_c = Column(Text)
    option_d = Column(Text)
    answer = Column(String)  # A, B, C, or D
    
    # Enhanced content for each question
    teaching_explanation = Column(Text)
    story_why = Column(Text, nullable=True)
    implementation_how = Column(Text, nullable=True)
    reflection_considerations = Column(Text, nullable=True)
    child_impact_story = Column(Text, nullable=True)
    science_behind_it = Column(Text, nullable=True)
    practical_application_strategy = Column(Text, nullable=True)
    why_behind_it = Column(Text, nullable=True)
    resources = Column(JSON, nullable=True)  # JSON array of resource IDs or objects
    
    # Metadata
    created_at = Column(String, default=lambda: datetime.utcnow().isoformat())
    updated_at = Column(String, default=lambda: datetime.utcnow().isoformat(), 
                       onupdate=lambda: datetime.utcnow().isoformat())
    
    def __repr__(self):
        return f"<Question(id={self.id}, domain={self.domain}, difficulty={self.difficulty})>"
    
    def to_dict(self):
        """Convert the question to a dictionary for API responses"""
        return {
            "id": self.id,
            "question_text": self.question_text,
            "domain": self.domain,
            "sub_competency": self.sub_competency,
            "difficulty": self.difficulty,
            "q_type": self.q_type,
            "options": {
                "A": self.option_a,
                "B": self.option_b,
                "C": self.option_c,
                "D": self.option_d
            },
            "answer": self.answer,
            "teaching_explanation": self.teaching_explanation,
            "story_why": self.story_why,
            "implementation_how": self.implementation_how,
            "reflection_considerations": self.reflection_considerations,
            "child_impact_story": self.child_impact_story,
            "science_behind_it": self.science_behind_it,
            "practical_application_strategy": self.practical_application_strategy,
            "why_behind_it": self.why_behind_it,
            "resources": self.resources,
        }


class Assessment(Base):
    __tablename__ = "assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    started_at = Column(String)  # ISO timestamp
    completed_at = Column(String, nullable=True)  # ISO timestamp
    
    # Stats
    questions_asked = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    
    # Results
    domain_scores = Column(JSON)  # JSON object with domain scores
    learning_path = Column(JSON, nullable=True)  # Recommended learning path
    
    # Relationships
    responses = relationship("Response", back_populates="assessment")
    
    def __repr__(self):
        return f"<Assessment(id={self.id}, user_id={self.user_id}, completed={self.completed_at is not None})>"


class Response(Base):
    __tablename__ = "responses"
    
    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    
    user_answer = Column(String)  # A, B, C, or D
    is_correct = Column(Boolean)
    responded_at = Column(String)  # ISO timestamp
    time_taken_ms = Column(Integer, nullable=True)  # Response time in milliseconds
    
    # Relationships
    assessment = relationship("Assessment", back_populates="responses")
    question = relationship("Question")
    
    def __repr__(self):
        return f"<Response(id={self.id}, assessment_id={self.assessment_id}, is_correct={self.is_correct})>"