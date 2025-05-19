"""
Main entry point for MentorMe Assessment API
This script starts the FastAPI server for the assessment system
"""
import argparse
import os
import sys
import uvicorn
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models import Base
from backend.import_data import run_import

def setup_database():
    """Create database tables if they don't exist"""
    # Load environment variables from .env if present
    load_dotenv()
    
    # Get database URL from environment
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("Warning: DATABASE_URL not set. Using SQLite as fallback.")
        database_url = "sqlite:///./mentorme_assessment.db"
    
    # Create database engine and tables
    engine = create_engine(database_url)
    Base.metadata.create_all(engine)
    
    # Create a session factory
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Import questions data if needed
    session = SessionLocal()
    try:
        # Check if questions already exist
        from backend.models import Question
        question_count = session.query(Question).count()
        if question_count == 0:
            print("No questions found in database. Importing from CSV...")
            run_import()
            print(f"Imported questions into database.")
        else:
            print(f"Database already contains {question_count} questions.")
    finally:
        session.close()

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Run the MentorMe Assessment API server")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind the server to")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind the server to")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload for development")
    
    args = parser.parse_args()
    
    # Setup database and import data if needed
    setup_database()
    
    # Start the FastAPI server
    print(f"Starting MentorMe Assessment API server at http://{args.host}:{args.port}")
    uvicorn.run(
        "backend.server:app",
        host=args.host,
        port=args.port,
        reload=args.reload
    )

if __name__ == "__main__":
    main()