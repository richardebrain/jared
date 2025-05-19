#!/usr/bin/env python3
"""
Main entry point for MentorMe Assessment API
This script starts the FastAPI server for the assessment system
"""
import os
import logging
import argparse
import uvicorn
from backend.import_data import run_import, setup_database

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

def setup_database():
    """Create database tables if they don't exist"""
    from backend.import_data import setup_database
    setup_database()
    logger.info("Database initialized successfully")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="MentorMe Assessment API Server")
    parser.add_argument(
        "--host", 
        type=str, 
        default="0.0.0.0", 
        help="Host to run the server on (default: 0.0.0.0)"
    )
    parser.add_argument(
        "--port", 
        type=int, 
        default=8000, 
        help="Port to run the server on (default: 8000)"
    )
    parser.add_argument(
        "--reload", 
        action="store_true", 
        help="Enable auto-reload for development"
    )
    parser.add_argument(
        "--import-data", 
        action="store_true", 
        help="Import assessment questions data from CSV"
    )
    
    args = parser.parse_args()
    
    # Initialize database
    setup_database()
    
    # Import data if requested
    if args.import_data:
        logger.info("Importing assessment questions data...")
        run_import()
    
    # Start server
    logger.info(f"Starting MentorMe Assessment API on {args.host}:{args.port}")
    uvicorn.run(
        "backend.server:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info"
    )

if __name__ == "__main__":
    main()