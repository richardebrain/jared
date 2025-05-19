"""
Main entry point for MentorMe Assessment API
This script starts the FastAPI server for the assessment system
"""

import os
import sys
import logging
import argparse
import uvicorn
from contextlib import asynccontextmanager

from backend.database import setup_database, import_questions_from_csv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger("run_backend")

def setup_database_wrapper():
    """Wrapper for database setup to handle exceptions"""
    try:
        success, message = setup_database()
        if success:
            logger.info(message)
        else:
            logger.error(message)
        return success
    except Exception as e:
        logger.error(f"Database setup failed: {str(e)}")
        return False

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="Run the MentorMe Assessment API")
    parser.add_argument("--host", default=os.environ.get("HOST", "127.0.0.1"), help="Host to bind to")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", 8000)), help="Port to bind to")
    parser.add_argument("--reload", action="store_true", default=False, help="Enable auto-reload")
    parser.add_argument("--import-csv", help="Import questions from a CSV file on startup")
    
    args = parser.parse_args()
    
    # Setup database
    if not setup_database_wrapper():
        logger.error("Failed to set up database. Exiting.")
        sys.exit(1)
    
    # Import questions if CSV file is provided
    if args.import_csv:
        success, message, count = import_questions_from_csv(args.import_csv)
        if success:
            logger.info(f"Successfully imported {count} questions from {args.import_csv}")
        else:
            logger.error(f"Failed to import questions: {message}")
    
    @asynccontextmanager
    async def lifespan(app):
        """
        Lifecycle events for the FastAPI app
        This runs before the application starts and after it shuts down
        """
        # Startup
        logger.info("Starting MentorMe Assessment API...")
        
        # Setup database connection
        logger.info("Database is ready")
        
        yield
        
        # Shutdown
        logger.info("Shutting down MentorMe Assessment API...")
    
    # We import here to ensure database is set up first
    from backend.main import app
    app.router.lifespan_context = lifespan
    
    # Start the server
    logger.info(f"Starting uvicorn server on {args.host}:{args.port}")
    uvicorn.run(
        "backend.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info"
    )

if __name__ == "__main__":
    main()