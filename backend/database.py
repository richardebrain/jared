"""
Database connection module for the FastAPI backend
"""
import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Get database URL from environment variable or use a default SQLite database
# For development, we can use a SQLite database
# For production, we should use a PostgreSQL database
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    logger.warning("DATABASE_URL not found in environment, using SQLite database")
    DATABASE_URL = "sqlite:///./mentorme_assessment.db"
    # Make directory if it doesn't exist
    os.makedirs(os.path.dirname(os.path.abspath("./mentorme_assessment.db")), exist_ok=True)
else:
    logger.info(f"Using database from environment: {DATABASE_URL.split('@')[0].split(':')[0]}:***@***")

# Create engine
if DATABASE_URL.startswith("sqlite"):
    # For SQLite, we need to set check_same_thread to False
    engine = create_engine(
        DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    # For other databases like PostgreSQL
    engine = create_engine(DATABASE_URL)

# Create sessionmaker
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