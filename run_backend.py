"""
Main entry point for MentorMe Assessment API
This script starts the FastAPI server for the assessment system
"""

import os
import uvicorn
import logging
from dotenv import load_dotenv

from backend.database import setup_database

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("run_backend")

def setup_database():
    """Create database tables if they don't exist"""
    try:
        from backend.database import setup_database as db_setup
        db_setup()
        logger.info("Database tables created or verified")
        return True
    except Exception as e:
        logger.error(f"Database setup error: {e}")
        return False

def main():
    """Main entry point"""
    # Load environment variables
    load_dotenv()
    
    # Set up the database tables
    if not setup_database():
        logger.error("Failed to set up database tables. Exiting.")
        return
    
    # Get port from environment or use default
    port = int(os.environ.get("PORT", 8000))
    
    # Start the server
    logger.info(f"Starting MentorMe Assessment API server on port {port}")
    uvicorn.run(
        "backend.server:app",
        host="0.0.0.0",
        port=port,
        reload=True if os.environ.get("DEVELOPMENT") else False,
        log_level="info"
    )

if __name__ == "__main__":
    main()