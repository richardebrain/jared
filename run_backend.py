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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def setup_database_wrapper():
    """Wrapper for database setup to handle exceptions"""
    try:
        setup_database()
        logger.info("Database setup complete")
    except Exception as e:
        logger.error(f"Error during database setup: {e}")
        sys.exit(1)

def import_sample_data():
    """Import sample questions if available"""
    try:
        from backend.import_data import import_questions_from_csv
        sample_data_path = os.path.join("data", "sample_questions.csv")
        if os.path.exists(sample_data_path):
            count = import_questions_from_csv(sample_data_path)
            logger.info(f"Imported {count} sample questions from {sample_data_path}")
        else:
            logger.info(f"Sample data file not found at {sample_data_path}")
    except Exception as e:
        logger.error(f"Error importing sample data: {e}")

def main():
    """Main entry point"""
    # Get port from environment or use default
    port = int(os.environ.get("ASSESSMENT_API_PORT", 8088))
    host = os.environ.get("ASSESSMENT_API_HOST", "0.0.0.0")
    reload = os.environ.get("ASSESSMENT_API_RELOAD", "false").lower() == "true"
    
    # Set up database
    setup_database_wrapper()
    
    # Import sample data if available
    import_sample_data()
    
    # Start server
    logger.info(f"Starting MentorMe Assessment API on {host}:{port}")
    uvicorn.run(
        "backend.main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info"
    )

if __name__ == "__main__":
    main()