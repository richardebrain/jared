#!/usr/bin/env python
"""
Main entry point for MentorMe Assessment API
This script starts the FastAPI server for the assessment system
"""

import argparse
import uvicorn
import os
import sys
from backend.database import Base, engine
from backend.import_data import run_import


def setup_database():
    """Create database tables if they don't exist"""
    try:
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully")
    except Exception as e:
        print(f"Error creating database tables: {e}")
        sys.exit(1)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="MentorMe Assessment API Server")
    parser.add_argument(
        "--host", 
        type=str, 
        default="127.0.0.1", 
        help="Host to bind the server to"
    )
    parser.add_argument(
        "--port", 
        type=int, 
        default=8000, 
        help="Port to bind the server to"
    )
    parser.add_argument(
        "--reload", 
        action="store_true", 
        help="Enable auto-reload for development"
    )
    parser.add_argument(
        "--import-data", 
        action="store_true", 
        help="Import questions data on startup"
    )
    
    args = parser.parse_args()
    
    # Ensure database tables exist
    setup_database()
    
    # Import data if requested
    if args.import_data:
        print("Importing assessment questions...")
        run_import()
        print("Data import complete")
    
    # Start the FastAPI server
    print(f"Starting FastAPI server at {args.host}:{args.port}")
    uvicorn.run(
        "backend.server:app",
        host=args.host,
        port=args.port,
        reload=args.reload
    )


if __name__ == "__main__":
    main()