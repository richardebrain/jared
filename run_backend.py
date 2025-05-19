"""
Main entry point for MentorMe Assessment API
This script starts the FastAPI server for the assessment system
"""
import uvicorn
from backend.server import app
from backend.database import engine
from backend.models import Base
from backend.import_data import run_import

def setup_database():
    """Create database tables if they don't exist"""
    print("Setting up database...")
    Base.metadata.create_all(bind=engine)
    print("Database setup complete")

def main():
    """Main entry point"""
    # Setup database
    setup_database()
    
    # Import data if needed
    # Uncomment to import data
    # run_import()
    
    # Start server
    print("Starting FastAPI server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main()