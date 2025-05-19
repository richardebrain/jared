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
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("main")

def setup_database_wrapper():
    """Wrapper for database setup to handle exceptions"""
    try:
        from backend.database import setup_database
        setup_database()
        logger.info("Database setup complete")
    except Exception as e:
        logger.error(f"Error setting up database: {e}")
        sys.exit(1)

def main():
    """Main entry point"""
    # Load environment variables
    load_dotenv()
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="MentorMe Assessment API Server")
    parser.add_argument(
        "--host", 
        type=str, 
        default="0.0.0.0", 
        help="Host to bind the server to (default: 0.0.0.0)"
    )
    parser.add_argument(
        "--port", 
        type=int, 
        default=int(os.getenv("PORT", 8000)), 
        help="Port to bind the server to (default: from PORT env var or 8000)"
    )
    parser.add_argument(
        "--reload", 
        action="store_true", 
        help="Enable auto-reload on file changes (for development)"
    )
    parser.add_argument(
        "--import-questions", 
        type=str, 
        help="Import questions from CSV file before starting server"
    )
    args = parser.parse_args()
    
    # Import questions if specified
    if args.import_questions:
        try:
            from backend.database import SessionLocal
            from backend.import_data import import_questions_from_csv
            
            db = SessionLocal()
            count = import_questions_from_csv(args.import_questions, db)
            logger.info(f"Imported {count} questions from {args.import_questions}")
        except Exception as e:
            logger.error(f"Error importing questions: {e}")
            sys.exit(1)
    
    # Setup database (create tables if they don't exist)
    setup_database_wrapper()
    
    # Get the FastAPI app
    try:
        from backend.server import get_app
        app = get_app()
        logger.info("FastAPI app created successfully")
    except Exception as e:
        logger.error(f"Error creating FastAPI app: {e}")
        sys.exit(1)
    
    # Start the server
    logger.info(f"Starting server on {args.host}:{args.port}")
    uvicorn.run(
        "backend.server:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info",
    )

if __name__ == "__main__":
    main()