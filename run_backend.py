#!/usr/bin/env python3
"""
Main entry point for MentorMe Assessment API
This script starts the FastAPI server for the assessment system
"""
import argparse
import logging
import os
import sys
from pathlib import Path

import uvicorn
from fastapi import FastAPI

from backend import __version__
from backend.database import init_db, check_db_connection
from backend.import_data import import_questions_from_csv, setup_initial_data
from backend.models import Base

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("mentorme.run")


def setup_database_wrapper():
    """Wrapper for database setup to handle exceptions"""
    try:
        from backend.database import get_db
        init_db()
        # Verify connection
        if not check_db_connection():
            logger.error("Could not connect to database.")
            sys.exit(1)
        
        # Use get_db to get a session
        db = next(get_db())
        try:
            # Set up initial data (default school, owner account, etc.)
            setup_initial_data(db)
        finally:
            db.close()
        
        logger.info("Database setup completed successfully")
        return True
    except Exception as e:
        logger.error(f"Database setup failed: {e}")
        return False


def import_sample_data():
    """Import sample questions if available"""
    try:
        from backend.database import get_db
        
        # Get the path to the sample data
        sample_data_path = Path('data/sample_questions.csv')
        if not sample_data_path.exists():
            logger.warning(f"Sample data file not found: {sample_data_path}")
            return
        
        # Use get_db to get a session
        db = next(get_db())
        try:
            # Import questions
            result = import_questions_from_csv(db, str(sample_data_path))
            if result["success"]:
                logger.info(f"Imported {result['imported']} questions ({result['updated']} updated, {result['skipped']} skipped, {result['failed']} failed)")
            else:
                logger.error(f"Failed to import questions: {result.get('error', 'Unknown error')}")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error importing sample data: {e}")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="MentorMe Assessment API Server")
    parser.add_argument('--host', type=str, default='127.0.0.1', help='Host to bind')
    parser.add_argument('--port', type=int, default=8000, help='Port to bind')
    parser.add_argument('--reload', action='store_true', help='Enable auto-reload')
    parser.add_argument('--workers', type=int, default=1, help='Number of worker processes')
    parser.add_argument('--log-level', type=str, default='info', help='Log level')
    
    args = parser.parse_args()
    
    # Setup database
    if not setup_database_wrapper():
        logger.error("Failed to set up database. Exiting.")
        sys.exit(1)
    
    # Import sample data
    import_sample_data()
    
    # Import the app after database is set up
    from backend.main import app
    
    # Run the server
    logger.info(f"Starting MentorMe Assessment API (version {__version__}) on {args.host}:{args.port}")
    uvicorn.run(
        "backend.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        workers=args.workers,
        log_level=args.log_level
    )


if __name__ == "__main__":
    main()