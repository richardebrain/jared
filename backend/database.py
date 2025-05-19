"""
Database connection module for the FastAPI backend
"""

import os
import logging
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

from .models import Base

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("database")

# Get the database URL from environment variables
DATABASE_URL = os.environ.get("DATABASE_URL")

# Create SQLAlchemy engine based on the database URL
if DATABASE_URL is not None and DATABASE_URL.startswith("postgres"):
    # Use production PostgreSQL database
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=10,
        max_overflow=20
    )
elif DATABASE_URL is not None and DATABASE_URL.startswith("sqlite"):
    # Use SQLite database (mainly for development)
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    # Default to in-memory SQLite if no URL is provided
    logger.warning("No DATABASE_URL provided, using in-memory SQLite database")
    engine = create_engine(
        "sqlite:///mentorme_assessment.db",
        connect_args={"check_same_thread": False}
    )

# Create sessionmaker
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def setup_database():
    """Create database tables if they don't exist"""
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created or verified successfully")
        
        # Check if we need to create default data
        with get_db_context() as db:
            # Check if we need to create special schools
            from .models import School
            raising_arizona = db.query(School).filter_by(name="Raising Arizona Preschool").first()
            if not raising_arizona:
                # Create special "Raising Arizona Preschool" school with perpetual subscription
                raising_arizona = School(
                    name="Raising Arizona Preschool",
                    active_subscription=True,
                    subscription_level="enterprise",
                    contact_email="admin@raisingarizona.edu",
                    logo_url="/images/raising-arizona-logo.jpg"
                )
                db.add(raising_arizona)
                logger.info("Created Raising Arizona Preschool with perpetual subscription")
            
            db.commit()
        
    except Exception as e:
        logger.error(f"Error setting up database: {str(e)}")
        raise

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
        raise
    finally:
        db.close()