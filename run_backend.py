"""
Main entry point for MentorMe Assessment API
This script starts the FastAPI server for the assessment system
"""

import os
import argparse
import uvicorn
from backend.database import Base, engine

def setup_database():
    """Create database tables if they don't exist"""
    from backend.database import Base, engine
    Base.metadata.create_all(bind=engine)

def main():
    """Main entry point"""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description="MentorMe Enhanced Assessment API Server")
    parser.add_argument("--host", type=str, default="0.0.0.0", help="Host to bind the server to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind the server to")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload for development")
    parser.add_argument("--import-data", action="store_true", help="Import assessment questions from CSV")
    parser.add_argument("--data-file", type=str, help="Path to CSV file containing questions")
    
    args = parser.parse_args()
    
    # First, make sure database tables exist
    print("Setting up database...")
    setup_database()
    print("Database setup complete")
    
    # Import data if requested
    if args.import_data:
        from backend.import_data import import_questions_from_csv
        file_path = args.data_file or "attached_assets/ece_master_database_full_with_why.csv"
        
        print(f"Importing questions from {file_path}...")
        success = import_questions_from_csv(file_path)
        
        if success:
            print("Questions imported successfully")
        else:
            print("Question import failed")
    
    # Start the server
    print(f"Starting server on {args.host}:{args.port}...")
    uvicorn.run(
        "backend.server:app", 
        host=args.host, 
        port=args.port,
        reload=args.reload
    )

if __name__ == "__main__":
    main()