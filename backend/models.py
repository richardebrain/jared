"""
Database models for the assessment system
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .database import Base

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    # Basic question data
    domain = Column(String, index=True)
    sub_competency = Column(String, index=True)
    difficulty = Column(Integer)  # 1-4
    q_type = Column(String)  # mcq, etc.
    question_text = Column(Text)
    
    # Options for multiple choice questions
    option_a = Column(Text)
    option_b = Column(Text)
    option_c = Column(Text)
    option_d = Column(Text)
    answer = Column(String)  # A, B, C, or D
    
    # Enhanced content for explanations and learning resources
    teaching_explanation = Column(Text)
    story_why = Column(Text, nullable=True)
    implementation_how = Column(Text, nullable=True)
    reflection_considerations = Column(Text, nullable=True)
    child_impact_story = Column(Text, nullable=True)
    science_behind_it = Column(Text, nullable=True)
    practical_application_strategy = Column(Text, nullable=True)
    why_behind_it = Column(Text, nullable=True)
    resources = Column(JSON, nullable=True)  # JSON array of resource IDs

class Assessment(Base):
    __tablename__ = "assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    started_at = Column(String)  # ISO timestamp
    completed_at = Column(String, nullable=True)  # ISO timestamp
    
    # Assessment progress
    questions_asked = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    
    # Assessment results
    domain_scores = Column(JSON)  # JSON object with domain scores
    learning_path = Column(JSON, nullable=True)  # Recommended learning path
    
    # Relationship to responses
    responses = relationship("Response", back_populates="assessment")

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