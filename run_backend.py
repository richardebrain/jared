#!/usr/bin/env python3
"""
Main entry point for MentorMe Assessment API
This script starts the FastAPI server for the assessment system
"""

import os
import sys
import logging
import argparse
import uvicorn
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("mentorme-assessment-api")

def setup_database_wrapper():
    """Wrapper for database setup to handle exceptions"""
    try:
        # Import and initialize database
        from backend.database import init_db
        from backend.import_data import setup_initial_data
        
        # Initialize database
        init_db()
        logger.info("Database initialized successfully")
        
        # Setup initial data
        setup_initial_data()
        logger.info("Initial data setup complete")
        
        return True
    except Exception as e:
        logger.error(f"Database setup error: {str(e)}")
        return False

def import_sample_data():
    """Import sample questions if available"""
    try:
        # Check for sample data (CSV format)
        sample_data_path = "data/sample_questions.csv"
        
        if Path(sample_data_path).is_file():
            from sqlalchemy.orm import Session
            from backend.database import get_db_context
            from backend.loader import load_questions_from_csv
            
            with get_db_context() as db:
                count = load_questions_from_csv(db, sample_data_path)
                logger.info(f"Imported {count} sample questions from {sample_data_path}")
        else:
            logger.info(f"No sample CSV data found at {sample_data_path}")
        
        # Check for JSON question files
        data_dir = Path("data")
        if data_dir.exists() and data_dir.is_dir():
            # Import all JSON question files
            try:
                from backend.import_json_questions import import_all_json_questions
                
                count = import_all_json_questions()
                logger.info(f"Imported {count} questions from JSON files in data directory")
            except Exception as e:
                logger.error(f"Error importing JSON questions: {str(e)}")
    except Exception as e:
        logger.error(f"Error importing sample data: {str(e)}")

def main():
    """Main entry point"""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="Start the MentorMe Assessment API server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8088, help="Port to bind to (default: 8088)")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload for development")
    args = parser.parse_args()
    
    # Setup database
    db_ready = setup_database_wrapper()
    if not db_ready:
        logger.warning("Database setup encountered issues, but continuing startup...")
    
    # Import sample data if available
    import_sample_data()
    
    # Start the server
    logger.info(f"Starting FastAPI server on {args.host}:{args.port}")
    uvicorn.run(
        "backend.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info"
    )

if __name__ == "__main__":
    main()