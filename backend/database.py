"""
Database connection module for the FastAPI backend
"""

import os
import logging
from contextlib import contextmanager
from typing import Generator, Tuple

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

from .models import Base

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("database")

# Get database URL from environment or use SQLite as fallback
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite:///./mentorme_assessment.db"
)

# Create SQLAlchemy engine
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )
else:
    # For PostgreSQL
    engine = create_engine(DATABASE_URL)

# Create sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def setup_database() -> Tuple[bool, str]:
    """Create database tables if they don't exist"""
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        return True, "Database setup successful"
    except Exception as e:
        error_msg = f"Error setting up database: {str(e)}"
        logger.error(error_msg)
        return False, error_msg

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