"""
Main entry point for the MentorMe Assessment API
"""

import os
import logging
from fastapi import FastAPI
from .server import get_app
from .database import setup_database

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("main")

# Initialize database
try:
    setup_database()
    logger.info("Database setup complete")
except Exception as e:
    logger.error(f"Error setting up database: {e}")
    raise

# Create FastAPI app
app = get_app()

# If running this file directly as a module
if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment variable or use 8000 as default
    port = int(os.getenv("PORT", 8000))
    
    logger.info(f"Starting MentorMe Assessment API on port {port}")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)