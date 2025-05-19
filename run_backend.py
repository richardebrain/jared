"""
Main entry point for MentorMe Assessment API
This script starts the FastAPI server for the assessment system
"""

import logging
import sys

from backend.database import setup_database
from backend.server import start_server
from backend.import_data import run_import

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("run_backend")

def setup_database_wrapper():
    """Wrapper for database setup to handle exceptions"""
    try:
        logger.info("Setting up database...")
        success, message = setup_database()
        if success:
            logger.info("Database setup successful")
            return True
        else:
            logger.warning(f"Database setup warning: {message}")
            # Continue even if there are warnings
            return True
    except Exception as e:
        logger.error(f"Database setup error: {str(e)}")
        return False

def main():
    """Main entry point"""
    logger.info("Starting MentorMe Assessment API")
    
    # Setup database
    if not setup_database_wrapper():
        logger.error("Failed to set up database. Exiting.")
        sys.exit(1)
    
    # Start the server
    try:
        start_server()
    except KeyboardInterrupt:
        logger.info("Server stopped by user")
    except Exception as e:
        logger.error(f"Server error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()