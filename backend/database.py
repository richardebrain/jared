"""
Database connection module for the FastAPI backend
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager

# Determine database URL based on environment
if os.environ.get("DATABASE_URL"):
    # Use PostgreSQL from environment variable
    DATABASE_URL = os.environ.get("DATABASE_URL")
    # Support Heroku-style PostgreSQL URLs
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
else:
    # Default to SQLite for local development
    DATABASE_URL = "sqlite:///./assessment.db"

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL, 
    # Enable for debugging SQL queries
    # echo=True,
    # For SQLite, enable foreign key constraints
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for declarative models
Base = declarative_base()

def setup_database():
    """Create database tables if they don't exist"""
    Base.metadata.create_all(bind=engine)

def get_db():
    """Provide a database session for a request"""
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
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()