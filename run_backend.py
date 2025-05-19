"""
Main entry point for MentorMe Assessment API
This script starts the FastAPI server for the assessment system
"""

import os
import logging
import uvicorn
from backend.database import setup_database

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("run_backend")

def setup_database_wrapper():
    """Wrapper for database setup to handle exceptions"""
    try:
        success, message = setup_database()
        if success:
            logger.info("Database setup successful")
            return True
        else:
            logger.error(f"Database setup failed: {message}")
            return False
    except Exception as e:
        logger.error(f"Database setup error: {e}")
        return False

def main():
    """Main entry point"""
    logger.info("Starting MentorMe Assessment API")
    
    # Setup database
    if not setup_database_wrapper():
        logger.warning("Database setup failed, but continuing anyway")
    
    # Configure server
    host = os.environ.get("API_HOST", "0.0.0.0")
    port = int(os.environ.get("API_PORT", 8000))
    
    # Start server
    logger.info(f"Starting server on {host}:{port}")
    uvicorn.run(
        "backend.server:app",
        host=host,
        port=port,
        reload=True,  # Enable auto-reload for development
        log_level="info"
    )

if __name__ == "__main__":
    main()