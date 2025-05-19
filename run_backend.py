#!/usr/bin/env python3
"""
Main entry point for MentorMe Assessment API
This script starts the FastAPI server for the assessment system
"""

import argparse
import os
import uvicorn
from backend.database import Base, engine
from backend.import_data import run_import

def setup_database():
    """Create database tables if they don't exist"""
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully")
    except Exception as e:
        print(f"Error creating database tables: {e}")
        raise

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="MentorMe Assessment API Server")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host to bind")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload")
    parser.add_argument("--import-data", action="store_true", help="Import question data")
    
    args = parser.parse_args()
    
    # Create database tables if they don't exist
    setup_database()
    
    # Import data if requested
    if args.import_data:
        print("Importing question data...")
        run_import()
    
    # Start FastAPI server
    print(f"Starting MentorMe Assessment API server on {args.host}:{args.port}")
    uvicorn.run(
        "backend.server:app",
        host=args.host,
        port=args.port,
        reload=args.reload
    )

if __name__ == "__main__":
    main()