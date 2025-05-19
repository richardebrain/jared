"""
Main entry point for MentorMe Assessment API
This script starts the FastAPI server for the assessment system
"""

import os
import sys
import logging
import contextlib
import asyncio
from typing import Dict, Any

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import setup_database
from backend.main import app

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
        if not success:
            logger.error(f"Database setup failed: {message}")
            return False
        logger.info(message)
        return True
    except Exception as e:
        logger.error(f"Error setting up database: {str(e)}")
        return False

def main():
    """Main entry point"""
    # Get environment variables or use defaults
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 8000))
    
    # Set up database
    if not setup_database_wrapper():
        logger.error("Database setup failed, exiting...")
        sys.exit(1)
    
    # Define lifespan context
    @contextlib.asynccontextmanager
    async def lifespan(app):
        # Startup
        logger.info("Starting MentorMe Assessment API...")
        yield
        # Shutdown
        logger.info("Shutting down MentorMe Assessment API...")
    
    # Run the FastAPI application with uvicorn
    logger.info(f"Starting server on {host}:{port}")
    uvicorn.run(
        "backend.main:app",
        host=host,
        port=port,
        reload=True,
        workers=1,
        log_level="info"
    )

if __name__ == "__main__":
    main()