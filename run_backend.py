#!/usr/bin/env python3
"""
Main entry point for MentorMe Assessment API
This script starts the FastAPI server for the assessment system
"""

import os
import sys
import logging
import uvicorn
from backend.database import setup_database
from backend.import_data import import_questions_from_csv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def setup_database_wrapper():
    """Wrapper for database setup to handle exceptions"""
    try:
        logger.info("Setting up database...")
        success = setup_database()
        if success:
            logger.info("Database setup complete")
        else:
            logger.error("Database setup failed")
            sys.exit(1)
    except Exception as e:
        logger.error(f"Error setting up database: {e}")
        sys.exit(1)

def import_sample_data():
    """Import sample questions if available"""
    sample_data_path = os.path.join('data', 'sample_questions.csv')
    if os.path.exists(sample_data_path):
        try:
            logger.info(f"Importing sample questions from {sample_data_path}")
            count = import_questions_from_csv(sample_data_path)
            logger.info(f"Imported {count} sample questions")
        except Exception as e:
            logger.error(f"Error importing sample data: {e}")
    else:
        logger.info("No sample data found at data/sample_questions.csv")

def main():
    """Main entry point"""
    # Set up the database
    setup_database_wrapper()
    
    # Import sample data if available
    import_sample_data()
    
    # Start FastAPI server
    port = int(os.environ.get('ASSESSMENT_API_PORT', 8088))
    host = os.environ.get('ASSESSMENT_API_HOST', '0.0.0.0')
    
    logger.info(f"Starting MentorMe Assessment API on {host}:{port}")
    uvicorn.run(
        "backend.main:app",
        host=host,
        port=port,
        reload=False,
        workers=1,
        log_level="info"
    )

if __name__ == "__main__":
    main()