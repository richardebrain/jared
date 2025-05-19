"""
Main entry point for MentorMe Assessment API
This script starts the FastAPI server for the assessment system
"""

import argparse
import uvicorn
import os
import sys
from backend.import_data import run_import
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from backend.models import Base

def setup_database():
    """Create database tables if they don't exist"""
    # Get database URL from environment or use a default SQLite database
    db_url = os.environ.get('DATABASE_URL', 'sqlite:///./assessment.db')
    
    # Create engine
    engine = create_engine(db_url)
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Run data import
    run_import()
    
    return True

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Run the MentorMe Assessment API server")
    parser.add_argument(
        "--host", default="127.0.0.1", help="Host to bind the server to"
    )
    parser.add_argument(
        "--port", type=int, default=8000, help="Port to bind the server to"
    )
    parser.add_argument(
        "--reload", action="store_true", help="Enable auto-reload for development"
    )
    parser.add_argument(
        "--import-only", action="store_true", help="Only import data, don't start the server"
    )
    
    args = parser.parse_args()
    
    print("Setting up database...")
    setup_success = setup_database()
    
    if not setup_success:
        print("Database setup failed.")
        sys.exit(1)
    
    if args.import_only:
        print("Data import completed successfully.")
        sys.exit(0)
    
    print(f"Starting MentorMe Assessment API server on {args.host}:{args.port}")
    print("Adaptive assessment system is ready to serve requests.")
    
    # Start the server
    uvicorn.run(
        "backend.server:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
    )

if __name__ == "__main__":
    main()