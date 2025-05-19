"""
Database connection module for the MentorMe assessment system
This module handles database initialization and connection management
"""

import os
import logging
from typing import Generator
from contextlib import contextmanager
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.engine import Engine
from sqlalchemy.ext.declarative import declarative_base

# Setup logging
logger = logging.getLogger("mentorme-assessment-api")

# Create SQLAlchemy base class for declarative models
Base = declarative_base()

# Get database URL from environment variable or use SQLite as fallback
db_url = os.getenv("DATABASE_URL")
if not db_url:
    logger.warning("DATABASE_URL not set, using SQLite database")
    db_url = "sqlite:///./mentorme_assessment.db"

# Engine configuration with appropriate settings
if db_url.startswith("sqlite"):
    # SQLite settings
    engine = create_engine(
        db_url, 
        connect_args={"check_same_thread": False},
        echo=False
    )
    
    # Enable foreign key constraints for SQLite
    @event.listens_for(Engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
else:
    # PostgreSQL settings
    engine = create_engine(
        db_url,
        pool_size=5,
        max_overflow=10,
        pool_timeout=30,
        pool_recycle=1800,
        echo=False
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db() -> None:
    """Initialize the database"""
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {str(e)}")
        raise

def get_db() -> Generator[Session, None, None]:
    """Get a database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@contextmanager
def get_db_context():
    """Context manager for database sessions"""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Database error: {str(e)}")
        raise
    finally:
        db.close()

def check_db_connection() -> bool:
    """Check if the database connection is working"""
    try:
        # Try to make a simple query to verify the connection
        with get_db_context() as db:
            db.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"Database connection check failed: {str(e)}")
        return False