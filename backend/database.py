"""
Database connection module for the FastAPI backend
"""

import os
import logging
from typing import Generator, Tuple
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

from .models import Base

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("database")

# Get database URL from environment or use SQLite default
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./mentorme.db")

# Create the SQLAlchemy engine
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
    echo=False  # Set to True for debugging SQL queries
)

# Create the session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def setup_database() -> Tuple[bool, str]:
    """Create database tables if they don't exist"""
    try:
        # Create all tables defined in the models
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        return True, "Database setup completed successfully"
    except Exception as e:
        logger.error(f"Error creating database tables: {str(e)}")
        return False, f"Database setup failed: {str(e)}"

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