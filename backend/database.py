"""
Database connection module for the FastAPI backend
"""

import os
import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("database")

# Get database URL from environment variables
DATABASE_URL = os.getenv("DATABASE_URL")

# Create engine - Support both PostgreSQL (production) and SQLite (development)
if DATABASE_URL and DATABASE_URL.startswith("postgresql"):
    # PostgreSQL connection
    logger.info("Using PostgreSQL database")
    engine = create_engine(DATABASE_URL)
else:
    # SQLite connection (fallback for development)
    logger.warning("PostgreSQL URL not found, using SQLite database (development only)")
    SQLITE_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "assessment.db")
    engine = create_engine(f"sqlite:///{SQLITE_DB_PATH}", connect_args={"check_same_thread": False})

# Create sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Import models to create tables
from .models import Base

def setup_database():
    """Create database tables if they don't exist"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created or verified")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise

def get_db() -> Generator[Session, None, None]:
    """Provide a database session for a request"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_db_context() -> Generator[Session, None, None]:
    """Context manager for database sessions"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()