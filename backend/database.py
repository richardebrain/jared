"""
Database connection module for the FastAPI backend
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Get database URL from environment or use a default SQLite database
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./assessment.db")

# Create engine with appropriate settings
if DATABASE_URL.startswith("postgres://"):
    # Handle Postgres scheme URLs for compatibility with some hosting platforms
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine
engine = create_engine(
    DATABASE_URL, 
    echo=False,  # Set to True for SQL debugging output
    pool_pre_ping=True,  # Check connection validity before using it
    connect_args={} if not DATABASE_URL.startswith("sqlite") else {"check_same_thread": False},
)

# Create session maker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create declarative base for models
Base = declarative_base()

def get_db():
    """Provide a database session for a request"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()