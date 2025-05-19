"""
Database connection and setup for the MentorMe assessment system
"""

import os
import logging
from typing import Generator, ContextManager, Optional
from contextlib import contextmanager

from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Get database URL from environment or use default SQLite database
DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///./mentorme_assessment.db')

# Create SQLAlchemy engine with appropriate settings
if DATABASE_URL.startswith('sqlite'):
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False},
        echo=False  # Set to True for SQL query logging
    )
else:
    # For PostgreSQL or other databases
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        echo=False  # Set to True for SQL query logging
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for declarative models
Base = declarative_base()

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Set SQLite pragmas for better performance"""
    if DATABASE_URL.startswith('sqlite'):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
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
    try:
        # Import models here to avoid circular imports
        from backend.models import User, School, Domain, Tag, Question, UserAnswer, UserDomainProgress
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        
        # Seed initial data
        with get_db_context() as db:
            _seed_initial_data(db)
            
        logger.info("Database setup complete")
    except Exception as e:
        logger.error(f"Error setting up database: {e}")
        raise

def _seed_initial_data(db: Session):
    """
    Seed initial data into the database
    
    Args:
        db: Database session
    """
    from backend.models import Domain, School, User
    
    # Add default domains if they don't exist
    domains = [
        {"name": "Child Development", "description": "Understanding how children develop physically, cognitively, and emotionally", "icon": "👶"},
        {"name": "Classroom Management", "description": "Techniques for managing behavior and creating a positive learning environment", "icon": "📚"},
        {"name": "Curriculum Planning", "description": "Designing effective educational activities and lessons", "icon": "📝"},
        {"name": "Health and Safety", "description": "Ensuring children's wellbeing and maintaining a safe environment", "icon": "🏥"},
        {"name": "Family Engagement", "description": "Building partnerships with families and communities", "icon": "👪"},
        {"name": "Professional Development", "description": "Growing as an early childhood education professional", "icon": "🎓"},
        {"name": "Special Needs", "description": "Supporting children with diverse learning needs", "icon": "♿"},
        {"name": "Assessment", "description": "Observing and documenting children's learning", "icon": "📊"}
    ]
    
    for domain_data in domains:
        existing = db.query(Domain).filter(Domain.name == domain_data["name"]).first()
        if not existing:
            domain = Domain(**domain_data)
            db.add(domain)
    
    # Add default school (Raising Arizona)
    default_school = db.query(School).filter(School.name == "Raising Arizona").first()
    if not default_school:
        default_school = School(
            name="Raising Arizona",
            logo_url="/assets/raising-arizona-logo.jpg",
            subscription_active=True  # Default school always has active subscription
        )
        db.add(default_school)
        db.commit()
    
    # Add admin user if not exists
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        admin_user = User(
            username="admin",
            full_name="System Administrator",
            is_admin=True,
            school_id=default_school.id
        )
        db.add(admin_user)
    
    # Add app owner (jlcookie20)
    owner_user = db.query(User).filter(User.username == "jlcookie20").first()
    if not owner_user:
        owner_user = User(
            username="jlcookie20",
            full_name="Jennifer Leonard",
            is_admin=True,
            school_id=default_school.id
        )
        db.add(owner_user)
    
    # Commit all changes
    db.commit()
    logger.info("Initial data seeded successfully")