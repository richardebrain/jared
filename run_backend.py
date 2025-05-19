#!/usr/bin/env python3
"""
Main entry point for MentorMe Assessment API
This script starts the FastAPI server for the assessment system
"""

import argparse
import logging
import os
import sys
import importlib.util
from pathlib import Path
import uvicorn
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("mentorme-assessment-api")

# Load environment variables from .env file if present
load_dotenv()

def setup_database_wrapper():
    """Wrapper for database setup to handle exceptions"""
    try:
        # Dynamically import and initialize database
        if importlib.util.find_spec("backend.database") is not None:
            from backend.database import init_db, check_db_connection
            
            # Initialize the database
            logger.info("Initializing database...")
            init_db()
            
            # Check if database connection is working
            if check_db_connection():
                logger.info("Database connection successful")
                return True
            else:
                logger.error("Database connection failed")
                return False
        else:
            logger.error("Database module not found")
            return False
    except Exception as e:
        logger.error(f"Error setting up database: {str(e)}")
        return False

def import_sample_data():
    """Import sample questions if available"""
    try:
        sample_data_path = Path("data/sample_questions.csv")
        if sample_data_path.exists():
            logger.info("Sample data file found, importing...")
            # Check if import_data module exists
            if importlib.util.find_spec("backend.import_data") is not None:
                from backend.import_data import import_questions_from_csv
                count = import_questions_from_csv(str(sample_data_path))
                logger.info(f"Imported {count} sample questions")
            else:
                logger.warning("Import data module not found, skipping sample data import")
        else:
            logger.info("No sample data file found, skipping import")
    except Exception as e:
        logger.error(f"Error importing sample data: {str(e)}")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Run the MentorMe Assessment API server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8088, help="Port to bind to")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    args = parser.parse_args()

    # Setup the database
    db_setup_success = setup_database_wrapper()
    if not db_setup_success:
        logger.warning("Database setup incomplete. Some features might not work correctly.")
    
    # Import sample data if needed
    import_sample_data()
    
    # Start the FastAPI server
    logger.info(f"Starting server on {args.host}:{args.port}")
    uvicorn.run(
        "backend.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload
    )

if __name__ == "__main__":
    main()