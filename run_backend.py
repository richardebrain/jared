#!/usr/bin/env python3
"""
Main entry point for MentorMe Assessment API
This script starts the FastAPI server for the assessment system
"""

import os
import sys
import logging
import uvicorn
import argparse
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def setup_database_wrapper():
    """Wrapper for database setup to handle exceptions"""
    try:
        from backend.database import setup_database
        setup_database()
    except Exception as e:
        logger.error(f"Error setting up database: {e}")
        logger.warning("Continuing anyway, the API might still work with existing database")

def import_sample_data():
    """Import sample questions if available"""
    try:
        from backend.import_data import import_questions_from_csv
        
        # Import sample data if available
        sample_data_path = Path("data/sample_questions.csv")
        if sample_data_path.exists():
            logger.info(f"Found sample data at {sample_data_path}, importing...")
            imported_count = import_questions_from_csv(str(sample_data_path))
            logger.info(f"Imported {imported_count} sample questions")
        else:
            logger.info("No sample data found at data/sample_questions.csv")
    except Exception as e:
        logger.error(f"Error importing sample data: {e}")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="MentorMe Assessment API Server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to")
    parser.add_argument("--port", type=int, default=8088, help="Port to bind to")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    parser.add_argument(
        "--import-sample-data", action="store_true", 
        help="Import sample questions from data/sample_questions.csv"
    )
    parser.add_argument(
        "--setup-db", action="store_true", 
        help="Setup database schema and initial data"
    )
    
    args = parser.parse_args()
    
    # Add the current directory to the Python path
    sys.path.insert(0, os.path.abspath("."))
    
    # Setup database if requested
    if args.setup_db:
        setup_database_wrapper()
    
    # Import sample data if requested
    if args.import_sample_data:
        import_sample_data()
    
    # Start the server
    logger.info(f"Starting MentorMe Assessment API on {args.host}:{args.port}")
    uvicorn.run(
        "backend.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info"
    )

if __name__ == "__main__":
    main()