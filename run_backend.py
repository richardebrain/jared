#!/usr/bin/env python3
"""
Main entry point for MentorMe Assessment API
This script starts the FastAPI server for the assessment system
"""

import os
import sys
import logging
import uvicorn
from fastapi import FastAPI

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("run_backend")

# Add directory to path to allow imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import inside the function to avoid circular imports
def setup_database_wrapper():
    """Wrapper for database setup to handle exceptions"""
    try:
        from backend.database import setup_database
        setup_database()
    except Exception as e:
        logger.error(f"Error setting up database: {e}")
        sys.exit(1)

def import_sample_data():
    """Import sample questions if available"""
    try:
        from backend.import_data import import_questions_from_csv
        
        # Check for sample_questions.csv
        sample_file = os.path.join("data", "sample_questions.csv")
        if os.path.exists(sample_file):
            logger.info(f"Found sample questions file: {sample_file}")
            imported = import_questions_from_csv(sample_file)
            logger.info(f"Imported {imported} sample questions")
        
        # Check for custom data file
        custom_file = os.path.join("data", "ece_master_database_ready.csv")
        if os.path.exists(custom_file):
            logger.info(f"Found ECE questions file: {custom_file}")
            imported = import_questions_from_csv(custom_file)
            logger.info(f"Imported {imported} ECE questions")
            
    except Exception as e:
        logger.error(f"Error importing sample data: {e}")
        # Continue running even if sample data import fails

def main():
    """Main entry point"""
    try:
        # Set up database
        setup_database_wrapper()
        
        # Import sample data
        import_sample_data()
        
        # Get port from environment or use default
        port = int(os.environ.get("ASSESSMENT_API_PORT", 8000))
        
        # Get host from environment or use default
        host = os.environ.get("ASSESSMENT_API_HOST", "0.0.0.0")
        
        # Configure reload based on environment
        reload = os.environ.get("ASSESSMENT_API_RELOAD", "false").lower() == "true"
        
        # Import the FastAPI app
        logger.info("Starting MentorMe Assessment API")
        
        # Start the server
        uvicorn.run(
            "backend.main:app",
            host=host,
            port=port,
            reload=reload,
            log_level="info"
        )
    except Exception as e:
        logger.error(f"Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()