"""
Main entry point for MentorMe Assessment API
This script starts the FastAPI server for the assessment system
"""
import uvicorn
import os
from backend.database import engine
from backend.models import Base
from backend.import_data import run_import

def setup_database():
    """Create database tables if they don't exist"""
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully")
    except Exception as e:
        print(f"Error setting up database: {str(e)}")

def main():
    """Main entry point"""
    # Set up database
    print("Setting up database...")
    setup_database()
    
    # Check if we need to import data
    import_data = os.environ.get("IMPORT_DATA", "false").lower() == "true"
    if import_data:
        print("Importing question data...")
        run_import()
    
    # Start the server
    print("Starting FastAPI server...")
    uvicorn.run(
        "backend.server:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True
    )

if __name__ == "__main__":
    main()