"""
Database connection and setup for the MentorMe assessment system
"""
import os
import logging
from typing import Generator
from contextlib import contextmanager

from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("mentorme.database")

# Create SQLAlchemy models base
Base = declarative_base()

# Set up database URL (default to SQLite if no PostgreSQL connection provided)
def get_database_url() -> str:
    """Get database URL from environment or use default SQLite database"""
    db_url = os.environ.get("DATABASE_URL")
    
    if db_url and db_url.startswith("postgres"):
        logger.info("Using PostgreSQL database")
        return db_url.replace("postgres://", "postgresql://", 1)
    
    logger.info("Using SQLite database")
    # Store in the data directory
    os.makedirs("data", exist_ok=True)
    return "sqlite:///data/mentorme.db"

# Create engine and session
engine = create_engine(
    get_database_url(),
    connect_args={"check_same_thread": False} if "sqlite" in get_database_url() else {},
    echo=False  # Set to True for debug SQL output
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Set SQLite pragmas for better performance if using SQLite
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Set SQLite pragmas for better performance"""
    if "sqlite" in get_database_url():
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

def get_db() -> Generator[Session, None, None]:
    """
    Get database session
    
    Yields:
        SQLAlchemy session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """Context manager version of get_db"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def setup_database():
    """
    Set up the database by creating all tables if they don't exist
    """
    from .models import (
        Question, User, Answer, Domain, Tag,
        UserDomainProgress, LearningPathRecommendation, School, Subscription
    )
    
    logger.info("Creating database tables if they don't exist")
    Base.metadata.create_all(bind=engine)
    
    # Seed initial data
    with get_db_context() as db:
        _seed_initial_data(db)
    
    logger.info("Database setup complete")

def _seed_initial_data(db: Session):
    """
    Seed initial data into the database
    
    Args:
        db: Database session
    """
    # Import necessary models here to avoid circular imports
    from .models import Domain, School, Subscription
    
    # Create default domains if they don't exist
    domains = [
        {"name": "Child Development", "description": "Knowledge about how children grow and learn"},
        {"name": "Classroom Management", "description": "Techniques for managing classroom behavior"},
        {"name": "Curriculum Planning", "description": "Designing effective learning experiences"},
        {"name": "Health and Safety", "description": "Keeping children safe and healthy"},
        {"name": "Parent Engagement", "description": "Working with families for better outcomes"}
    ]
    
    for domain_data in domains:
        existing = db.query(Domain).filter(Domain.name == domain_data["name"]).first()
        if not existing:
            db.add(Domain(**domain_data))
    
    # Create default school (Raising Arizona)
    existing_school = db.query(School).filter(School.name == "Raising Arizona").first()
    if not existing_school:
        raising_arizona = School(
            name="Raising Arizona",
            logo_url="/assets/raising-arizona-logo.jpg",
            is_default=True,
            contact_email="admin@raisingarizona.com"
        )
        db.add(raising_arizona)
        
        # Create default subscription for Raising Arizona
        db.flush()  # To get the school ID
        subscription = Subscription(
            school_id=raising_arizona.id,
            is_active=True,
            plan_name="Enterprise",
            max_users=1000
        )
        db.add(subscription)
    
    db.commit()