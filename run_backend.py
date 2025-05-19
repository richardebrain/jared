"""
Main entry point for MentorMe Assessment API
This script starts the FastAPI server for the assessment system
"""

import argparse
import uvicorn
import logging
from backend import server
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
        setup_database()
        logger.info("Database tables created or verified")
    except Exception as e:
        logger.error(f"Error setting up database: {str(e)}")
        raise

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description="MentorMe Enhanced Assessment API server")
    parser.add_argument(
        "--host", 
        type=str,
        default="127.0.0.1",
        help="Host address (default: 127.0.0.1)"
    )
    parser.add_argument(
        "--port", 
        type=int,
        default=8000,
        help="Port number (default: 8000)"
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        help="Enable auto-reload for development"
    )
    parser.add_argument(
        "--import-data",
        action="store_true",
        help="Import questions data from CSV on startup"
    )
    
    args = parser.parse_args()
    
    # Setup database
    setup_database()
    
    # Import data if requested
    if args.import_data:
        from backend.import_data import run_import
        success, message = run_import()
        logger.info(f"Data import: {message}")
    
    # Start FastAPI server
    logger.info(f"Starting server on {args.host}:{args.port}")
    
    uvicorn.run(
        "backend.server:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        access_log=True
    )

if __name__ == "__main__":
    main()