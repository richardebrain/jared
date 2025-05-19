#!/usr/bin/env python3
"""
Main entry point for MentorMe Assessment API
This script starts the FastAPI server for the assessment system
"""

import argparse
import logging
import importlib
import sys
from pathlib import Path

import uvicorn
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from backend.models import Base

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("mentorme-backend")

# Get the database URL from environment, with SQLite as fallback
from os import environ
DATABASE_URL = environ.get("DATABASE_URL", "sqlite:///./mentorme.db")

def setup_database():
    """Create database tables if they don't exist"""
    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Run the MentorMe Assessment API server")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host to listen on")
    parser.add_argument("--port", type=int, default=8000, help="Port to listen on")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    parser.add_argument("--import-data", action="store_true", help="Import assessment data on startup")
    
    args = parser.parse_args()
    
    # Set up database
    setup_database()
    
    # Import data if requested
    if args.import_data:
        try:
            logger.info("Starting data import process...")
            from backend.import_data import run_import
            run_import()
            logger.info("Data import completed successfully")
        except Exception as e:
            logger.error(f"Failed to import data: {e}")
            sys.exit(1)
    
    # Run the FastAPI server
    logger.info(f"Starting FastAPI server on {args.host}:{args.port}")
    uvicorn.run(
        "backend.server:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info",
    )

if __name__ == "__main__":
    main()