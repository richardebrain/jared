"""
Database connection and setup for the MentorMe assessment system
"""

import os
import logging
from typing import Generator
from contextlib import contextmanager
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import SingletonThreadPool
from backend.models import Base, Domain, Question, Tag

# Configure logging
logger = logging.getLogger(__name__)

# Determine database path
DATA_DIR = os.environ.get('DATA_DIR', 'data')
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

DATABASE_PATH = os.path.join(DATA_DIR, 'mentorme.sqlite3')
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

# Create engine with better connection pooling for SQLite
engine = create_engine(
    DATABASE_URL,
    poolclass=SingletonThreadPool,  # Better for SQLite to avoid "database is locked" errors
    connect_args={"check_same_thread": False},  # Required for SQLite
    echo=False  # Set to True for SQL query logging (development only)
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Set SQLite pragmas for better performance"""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")  # Write-Ahead Logging for better concurrency
    cursor.execute("PRAGMA synchronous=NORMAL")  # Synchronous mode for better performance
    cursor.execute("PRAGMA foreign_keys=ON")  # Enforce foreign key constraints
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
def get_db_context():
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
        # Create all tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        
        # Seed initial data if needed
        with get_db_context() as db:
            _seed_initial_data(db)
        
        return True
    except Exception as e:
        logger.error(f"Error setting up database: {e}")
        return False

def _seed_initial_data(db: Session):
    """
    Seed initial data into the database
    
    Args:
        db: Database session
    """
    # Check if we need to seed domains
    domains_count = db.query(Domain).count()
    if domains_count == 0:
        logger.info("Seeding initial domains...")
        
        # Create default domains
        default_domains = [
            ("Child Development", "Knowledge about how children grow and develop"),
            ("Guidance", "Strategies for guiding children's behavior positively"),
            ("Curriculum Planning", "Creating effective learning experiences for children"),
            ("Health and Safety", "Ensuring children's physical well-being"),
            ("Family Engagement", "Working with families and caregivers"),
            ("Professionalism", "Professional conduct and development in ECE"),
            ("Environment", "Creating effective learning environments"),
            ("Observation and Assessment", "Monitoring and evaluating children's progress")
        ]
        
        for name, description in default_domains:
            domain = Domain(name=name, description=description)
            db.add(domain)
        
        # Create default tags
        default_tags = [
            "infant", "toddler", "preschool", "primary", "special_needs",
            "literacy", "math", "science", "art", "music", "physical",
            "social", "emotional", "cognitive", "language",
            "indoor", "outdoor", "transition", "routine", "play",
            "iters", "ecers", "naeyc", "class"
        ]
        
        for tag_name in default_tags:
            tag = Tag(name=tag_name)
            db.add(tag)
        
        db.commit()
        logger.info(f"Seeded {len(default_domains)} domains and {len(default_tags)} tags")