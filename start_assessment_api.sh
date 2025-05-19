#!/bin/bash
# Shell script to start the MentorMe Assessment API
# This script runs the FastAPI server with the appropriate parameters

echo "Starting MentorMe Assessment API..."

# Ensure required packages are installed
pip install fastapi uvicorn sqlalchemy python-dotenv psycopg2-binary pydantic --quiet

# Set default port (can be overridden with environment variable)
API_PORT=${ASSESSMENT_API_PORT:-8000}

# Run the FastAPI server
python run_backend.py --host 0.0.0.0 --port $API_PORT --reload

echo "Assessment API shutdown"