#!/bin/bash
# Start the MentorMe Assessment Server
# This script runs the FastAPI server for the assessment system in production mode

# Set environment variables
export ASSESSMENT_API_PORT=8088  # Changed to 8088 to avoid conflicts
export ASSESSMENT_API_HOST="0.0.0.0"
export ASSESSMENT_API_RELOAD="false"  # Disable reload in production

# Ensure data directory exists
mkdir -p data

# Install required dependencies
pip install -q fastapi uvicorn sqlalchemy python-multipart pydantic

# Run the backend in production mode
echo "Starting MentorMe Assessment Server on port $ASSESSMENT_API_PORT..."
python run_backend.py