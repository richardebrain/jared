"""
Main entry point for MentorMe Assessment API
This script starts the FastAPI server for the assessment system
"""
import uvicorn
import sys
import os
from dotenv import load_dotenv
from backend.database import Base, engine
from backend.import_data import run_import

def setup_database():
    """Create database tables if they don't exist"""
    try:
        print("Setting up database tables...")
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully.")
    except Exception as e:
        print(f"Error setting up database: {str(e)}")
        sys.exit(1)

def main():
    """Main entry point"""
    # Load environment variables
    load_dotenv()
    
    # Set up database and import data
    setup_database()
    
    # Import data if needed (only runs if questions table is empty)
    run_import()

    # Start the FastAPI server
    print("Starting FastAPI server...")
    uvicorn.run(
        "backend.server:app", 
        host="0.0.0.0",  # Listen on all interfaces
        port=int(os.getenv("ASSESSMENT_API_PORT", "8000")),
        reload=True  # Enable auto-reload for development
    )

if __name__ == "__main__":
    main()