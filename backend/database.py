"""
Database connection module for the FastAPI backend
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Get database URL from environment variable or use SQLite as fallback
DATABASE_URL = os.getenv("DATABASE_URL")

# Determine which database to use
if DATABASE_URL and DATABASE_URL.startswith("postgresql"):
    # PostgreSQL connection
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Verify connection is still active
        pool_recycle=3600,   # Recycle connections after 1 hour
    )
else:
    # SQLite connection (for development/testing)
    SQLITE_DATABASE_URL = "sqlite:///./assessment.db"
    engine = create_engine(
        SQLITE_DATABASE_URL, 
        connect_args={"check_same_thread": False}  # Needed for SQLite
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative base class for models
Base = declarative_base()

def get_db():
    """Provide a database session for a request"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()