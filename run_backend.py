#!/usr/bin/env python3
"""
Main entry point for MentorMe Assessment API
This script starts the FastAPI server for the assessment system
"""
import os
import sys
import uvicorn
import logging
import argparse
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("mentorme.runner")

def setup_database_wrapper():
    """Wrapper for database setup to handle exceptions"""
    try:
        from backend.database import setup_database
        setup_database()
    except Exception as e:
        logger.error(f"Database setup failed: {e}")
        sys.exit(1)

def import_sample_data():
    """Import sample questions if available"""
    # Path to sample questions (adjust as needed)
    data_dir = Path("data")
    sample_file = data_dir / "sample_questions.csv"
    
    if sample_file.exists():
        try:
            from backend.import_data import import_questions_from_csv
            count = import_questions_from_csv(str(sample_file))
            logger.info(f"Imported {count} sample questions")
        except Exception as e:
            logger.error(f"Failed to import sample questions: {e}")
    else:
        logger.warning(f"Sample questions file not found at {sample_file}")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Run the MentorMe Assessment API server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind the server to")
    parser.add_argument("--port", type=int, default=8088, help="Port to bind the server to")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload for development")
    parser.add_argument("--no-db-setup", action="store_true", help="Skip database setup")
    parser.add_argument("--no-sample-data", action="store_true", help="Skip importing sample data")
    
    args = parser.parse_args()
    
    # Set up the database if not disabled
    if not args.no_db_setup:
        setup_database_wrapper()
    
    # Import sample data if not disabled
    if not args.no_sample_data:
        import_sample_data()
    
    # Run the FastAPI server
    logger.info(f"Starting FastAPI server at http://{args.host}:{args.port}")
    uvicorn.run(
        "backend.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info"
    )

if __name__ == "__main__":
    main()