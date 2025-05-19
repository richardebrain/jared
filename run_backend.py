"""
Main entry point for MentorMe Assessment API
This script starts the FastAPI server for the assessment system
"""

import os
import argparse
import uvicorn
from backend.database import Base, engine
from backend import import_data

def setup_database():
    """Create database tables if they don't exist"""
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="MentorMe Enhanced Assessment API")
    parser.add_argument(
        "--host", 
        default="0.0.0.0", 
        help="Host to bind the server to (default: 0.0.0.0)"
    )
    parser.add_argument(
        "--port", 
        type=int, 
        default=5050, 
        help="Port to bind the server to (default: 5050)"
    )
    parser.add_argument(
        "--reload", 
        action="store_true", 
        help="Enable auto-reload for development"
    )
    parser.add_argument(
        "--import-questions", 
        action="store_true", 
        help="Import questions from CSV before starting the server"
    )

    args = parser.parse_args()
    
    # Setup database
    setup_database()
    
    # Import questions if requested
    if args.import_questions:
        print("Importing questions from CSV...")
        import_data.run_import()
    
    # Start the FastAPI server
    print(f"Starting MentorMe Enhanced Assessment API on {args.host}:{args.port}")
    uvicorn.run(
        "backend.server:app", 
        host=args.host, 
        port=args.port, 
        reload=args.reload
    )

if __name__ == "__main__":
    main()