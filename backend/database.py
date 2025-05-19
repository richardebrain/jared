"""
Database connection module for the FastAPI backend
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Get database URL from environment or use SQLite as fallback
DATABASE_URL = os.environ.get("DATABASE_URL")

if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    # Heroku provides DATABASE_URL in postgres:// format which SQLAlchemy no longer supports
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Use PostgreSQL in production or SQLite in development
if DATABASE_URL:
    # Use PostgreSQL database
    engine = create_engine(DATABASE_URL)
else:
    # Use SQLite for development and testing
    SQLITE_DATABASE_URL = "sqlite:///./assessment_data.db"
    engine = create_engine(
        SQLITE_DATABASE_URL, connect_args={"check_same_thread": False}
    )
    print("WARNING: Using SQLite database. For production, set DATABASE_URL environment variable.")

# Create a session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a base class for models
Base = declarative_base()

def get_db():
    """Provide a database session for a request"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()