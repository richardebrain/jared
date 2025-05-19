"""
Database connection module for the FastAPI backend
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Get database URL from environment, with SQLite fallback
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./mentorme.db")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    # Handling Heroku's DATABASE_URL format
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for declarative models
Base = declarative_base()

def get_db():
    """Provide a database session for a request"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()