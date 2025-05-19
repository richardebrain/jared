"""
Database models for the assessment system
"""

import json
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, 
    ForeignKey, JSON, func
)
from sqlalchemy.orm import relationship

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
    
    # Enhanced content for learning
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
        return f"<Question {self.id}: {self.question_text[:30]}...>"
    
    def to_dict(self):
        """Convert the question to a dictionary for API responses"""
        options = {}
        if self.option_a:
            options["A"] = self.option_a
        if self.option_b:
            options["B"] = self.option_b
        if self.option_c:
            options["C"] = self.option_c
        if self.option_d:
            options["D"] = self.option_d
            
        result = {
            "id": self.id,
            "question": self.question_text,
            "options": options,
            "domain": self.domain,
            "sub_competency": self.sub_competency,
            "difficulty": self.difficulty,
            "q_type": self.q_type,
            "answer": self.answer,
            "teaching_explanation": self.teaching_explanation,
        }
        
        # Add enhanced content if available
        enhanced_content = {}
        if self.story_why:
            enhanced_content["story_why"] = self.story_why
        if self.implementation_how:
            enhanced_content["implementation_how"] = self.implementation_how
        if self.reflection_considerations:
            enhanced_content["reflection_considerations"] = self.reflection_considerations
        if self.child_impact_story:
            enhanced_content["child_impact_story"] = self.child_impact_story
        if self.science_behind_it:
            enhanced_content["science_behind_it"] = self.science_behind_it
        if self.practical_application_strategy:
            enhanced_content["practical_application_strategy"] = self.practical_application_strategy
        if self.why_behind_it:
            enhanced_content["why_behind_it"] = self.why_behind_it
            
        if enhanced_content:
            result["enhanced_content"] = enhanced_content
            
        # Add resources if available
        if self.resources:
            result["resources"] = self.resources
            
        return result

class Assessment(Base):
    __tablename__ = "assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    started_at = Column(String)  # ISO timestamp
    completed_at = Column(String, nullable=True)  # ISO timestamp
    
    # Progress metrics
    questions_asked = Column(Integer, default=0)
    questions_correct = Column(Integer, default=0)
    
    # Results
    domain_scores = Column(JSON)  # JSON object with domain scores
    learning_path = Column(JSON, nullable=True)  # Recommended learning path
    
    # Relationships
    responses = relationship("Response", back_populates="assessment")
    
    def __repr__(self):
        return f"<Assessment {self.id} for user {self.user_id}>"

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
        return f"<Response {self.id} for question {self.question_id}>"