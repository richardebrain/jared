"""
Database connection and setup for the MentorMe assessment system
"""

import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("database")

# Load environment variables
load_dotenv()

# Get database URL from environment or use SQLite as fallback
DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL is None:
    DATABASE_URL = "sqlite:///./mentorme_assessment.db"
    logger.warning(f"DATABASE_URL not found in environment, using SQLite: {DATABASE_URL}")
else:
    logger.info(f"Using database: {DATABASE_URL.split('@')[0].split(':')[0]}://*****@*****")

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    echo=False,  # Set to True for debugging
    pool_pre_ping=True,  # Check connection before using it
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

def get_db():
    """
    Get database session
    
    Yields:
        SQLAlchemy session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def setup_database():
    """
    Set up the database by creating all tables if they don't exist
    """
    try:
        # Import models to ensure they're registered with Base
        from .models import Question, UserPerformance, UserDomainProgress, AssessmentSession
        
        # Create tables in the database
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error setting up database: {e}")
        raise