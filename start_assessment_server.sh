#!/bin/bash
# Shell script to start the MentorMe Assessment Server with data import
# This script runs the FastAPI server and imports assessment data

echo "Starting MentorMe Assessment Server with data import..."

# Ensure required packages are installed
pip install fastapi uvicorn sqlalchemy python-dotenv psycopg2-binary pydantic --quiet

# Set default port (can be overridden with environment variable)
API_PORT=${ASSESSMENT_API_PORT:-8000}

# Check if CSV file exists
if [ -f "attached_assets/ece_master_database_full_with_why.csv" ]; then
  echo "Found ECE question database CSV"
  
  # Run the FastAPI server with data import
  python run_backend.py --host 0.0.0.0 --port $API_PORT --reload --import-data
else
  echo "Warning: ECE question database CSV not found at attached_assets/ece_master_database_full_with_why.csv"
  echo "The assessment server will start, but no questions will be imported"
  
  # Run the FastAPI server without data import
  python run_backend.py --host 0.0.0.0 --port $API_PORT --reload
fi

echo "Assessment server shutdown"