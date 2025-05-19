from sqlalchemy import Column, Integer, String, Text, ARRAY, JSON, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Basic question info
    domain = Column(String, index=True)
    sub_competency = Column(String, index=True)
    difficulty = Column(Integer)  # 1-4
    q_type = Column(String)  # mcq, etc.
    question_text = Column(Text)
    
    # Options for multiple choice
    option_a = Column(Text)
    option_b = Column(Text)
    option_c = Column(Text)
    option_d = Column(Text)
    answer = Column(String)  # A, B, C, or D
    
    # Explanation and context
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
    
    # Stats
    questions_asked = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    
    # Domain scores
    domain_scores = Column(JSON)  # JSON object with domain scores
    learning_path = Column(JSON, nullable=True)  # Recommended learning path
    
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

# Set up relationship between Assessment and Response
Assessment.responses = relationship("Response", back_populates="assessment", cascade="all, delete-orphan")