#!/bin/bash
# Script to start the Assessment API server
# This runs the FastAPI server on port 8088 to avoid conflicts with other services

# Ensure data directory exists
mkdir -p data

# Set environment variables
export ASSESSMENT_API_PORT=8088
export ASSESSMENT_API_HOST="0.0.0.0"
export DATA_DIR="data"

# Start the FastAPI server
echo "Starting MentorMe Assessment API server on port $ASSESSMENT_API_PORT..."
python run_backend.py