#!/bin/bash
# Start the MentorMe Assessment API
# This script runs the FastAPI server for the assessment system

# Set environment variables
export ASSESSMENT_API_PORT=8080
export ASSESSMENT_API_HOST="0.0.0.0"
export ASSESSMENT_API_RELOAD="true"

# Install required dependencies if needed
pip install -q fastapi uvicorn sqlalchemy

# Run the backend
echo "Starting MentorMe Assessment API on port $ASSESSMENT_API_PORT..."
python run_backend.py