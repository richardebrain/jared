#!/usr/bin/env python3
"""
Main entry point for MentorMe Assessment API
This script starts the FastAPI server for the assessment system
"""

import os
import sys
import time
import logging
import subprocess
import argparse
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("run_backend")

def setup_database_wrapper():
    """Wrapper for database setup to handle exceptions"""
    try:
        # Import here to avoid circular imports
        from backend.database import setup_database
        setup_database()
        logger.info("Database setup complete")
        return True
    except Exception as e:
        logger.error(f"Error setting up database: {e}")
        return False

def import_sample_data():
    """Import sample questions if available"""
    try:
        from backend.import_data import import_questions_from_csv
        
        # Check for sample data
        sample_data_path = Path("data/sample_questions.csv")
        if sample_data_path.exists():
            logger.info(f"Found sample questions at {sample_data_path}, importing...")
            count = import_questions_from_csv(str(sample_data_path))
            logger.info(f"Successfully imported {count} sample questions")
        else:
            logger.warning(f"No sample questions found at {sample_data_path}")
    except Exception as e:
        logger.error(f"Error importing sample data: {e}")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Run the MentorMe Assessment API")
    parser.add_argument(
        "--port", 
        type=int, 
        default=8000, 
        help="Port to run the server on (default: 8000)"
    )
    parser.add_argument(
        "--host", 
        type=str, 
        default="0.0.0.0", 
        help="Host to bind the server to (default: 0.0.0.0)"
    )
    parser.add_argument(
        "--reload", 
        action="store_true", 
        help="Enable auto-reload for development"
    )
    parser.add_argument(
        "--import-data", 
        action="store_true", 
        help="Import sample data before starting"
    )
    
    args = parser.parse_args()
    
    # Setup database
    if not setup_database_wrapper():
        logger.error("Database setup failed, exiting")
        sys.exit(1)
    
    # Import sample data if requested
    if args.import_data:
        import_sample_data()
    
    # Start the FastAPI server with uvicorn
    try:
        import uvicorn
        
        logger.info(f"Starting MentorMe Assessment API on {args.host}:{args.port}")
        uvicorn.run(
            "backend.main:app", 
            host=args.host, 
            port=args.port,
            reload=args.reload
        )
    except Exception as e:
        logger.error(f"Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()