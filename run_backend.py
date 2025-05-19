"""
Main entry point for MentorMe Assessment API
This script starts the FastAPI server for the assessment system
"""

import os
import sys
import logging
import uvicorn
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("main")

def setup_database_wrapper():
    """Wrapper for database setup to handle exceptions"""
    try:
        # Import here to avoid circular imports
        from backend.database import setup_database
        success, message = setup_database()
        if not success:
            logger.error(f"Database setup failed: {message}")
            sys.exit(1)
        logger.info(message)
    except Exception as e:
        logger.error(f"Unexpected error setting up database: {str(e)}")
        sys.exit(1)

def main():
    """Main entry point"""
    logger.info("Starting MentorMe Assessment API")
    
    # Set up database
    logger.info("Setting up database...")
    setup_database_wrapper()
    
    # Define startup and shutdown events for FastAPI
    @asynccontextmanager
    async def lifespan(app):
        # Startup logic
        logger.info("API server starting up...")
        yield
        # Shutdown logic
        logger.info("API server shutting down...")
    
    # Import and create the FastAPI app with lifespan
    from backend.server import app
    app.router.lifespan_context = lifespan
    
    # Get host and port from environment or use defaults
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 8000))
    
    # Start the server
    logger.info(f"Starting server at http://{host}:{port}")
    uvicorn.run(app, host=host, port=port)

if __name__ == "__main__":
    main()