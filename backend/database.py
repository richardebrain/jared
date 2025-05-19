"""
Database connection module for the MentorMe assessment system
This module handles database initialization and connection management
"""

import os
import logging
from typing import Generator
from contextlib import contextmanager

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError

from backend.models import Base

# Setup logging
logger = logging.getLogger("mentorme-assessment-api")

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    logger.warning("DATABASE_URL not found in environment, using SQLite in-memory database")
    DATABASE_URL = "sqlite:///:memory:"

# Configure engine with appropriate settings based on database type
if DATABASE_URL.startswith("sqlite"):
    # SQLite settings (for development/testing)
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        echo=False
    )
    
    # Set SQLite pragmas for better performance
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()
else:
    # PostgreSQL settings (for production)
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=5,
        max_overflow=10,
        echo=False
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db() -> None:
    """Initialize the database"""
    try:
        # Don't create tables automatically - use existing tables
        # Only create tables that don't exist yet
        tables_to_create = []
        for table in Base.metadata.tables.values():
            if not engine.dialect.has_table(engine.connect(), table.name):
                tables_to_create.append(table)
        
        if tables_to_create:
            # Create only new tables
            for table in tables_to_create:
                table.create(bind=engine)
            logger.info(f"Created {len(tables_to_create)} new database tables")
        else:
            logger.info("All tables already exist, no new tables created")
    except SQLAlchemyError as e:
        logger.error(f"Error initializing database: {str(e)}")
        # Continue without failing - existing tables will be used
        pass

def get_db() -> Generator[Session, None, None]:
    """Get a database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@contextmanager
def get_db_context():
    """Context manager for database sessions"""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Database error: {str(e)}")
        raise
    finally:
        db.close()

def check_db_connection() -> bool:
    """Check if the database connection is working"""
    try:
        # Get a connection from the engine
        connection = engine.connect()
        # Execute a simple query
        connection.execute("SELECT 1")
        # Close the connection
        connection.close()
        return True
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        return False