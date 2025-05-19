"""
Database connection module for the FastAPI backend
"""

import os
import logging
from typing import Generator
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("database")

# SQLAlchemy Base for models
Base = declarative_base()

# Get database URL from environment variables
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    logger.warning("DATABASE_URL not found in environment. Using SQLite database.")
    DATABASE_URL = "sqlite:///./mentorme.db"

# Create engine and session factory
engine = create_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL debugging
    pool_pre_ping=True,  # Test connections before using them
    pool_recycle=300  # Recycle connections after 5 minutes
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def setup_database():
    """Create database tables if they don't exist"""
    try:
        # Create tables based on model classes
        Base.metadata.create_all(engine)
        logger.info("Database tables created successfully")
        return True, "Database setup successful"
    except SQLAlchemyError as e:
        logger.error(f"Database setup error: {e}")
        return False, str(e)

def get_db() -> Generator[Session, None, None]:
    """Provide a database session for a request"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """Context manager for database sessions"""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()