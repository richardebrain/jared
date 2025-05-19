"""
Database connection module for the FastAPI backend
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Get the database URL from environment variable or use a default SQLite database
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./mentorme_assessment.db")

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL, 
    # For SQLite, connect_args is needed, otherwise it can be omitted
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

# Create a SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a Base class for declarative models
Base = declarative_base()

def get_db():
    """Provide a database session for a request"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()