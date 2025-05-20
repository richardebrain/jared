"""
Database setup script for the MentorMe assessment system
This script sets up the database tables for the assessment system
"""

import sys
import logging
from backend.database import init_db
from backend.import_data import setup_initial_data, ensure_default_domains
from backend.models import Base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("mentorme-assessment-setup")

def main():
    """Create database tables"""
    try:
        # Initialize database
        init_db()
        logger.info("Database initialized successfully")
        
        # Setup domains
        from backend.database import get_db_context
        with get_db_context() as db:
            ensure_default_domains(db)
            logger.info("Default domains created successfully")
        
        logger.info("Database setup completed successfully!")
        return 0
    except Exception as e:
        logger.error(f"Error setting up database: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())