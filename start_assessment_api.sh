#!/bin/bash

# Start the FastAPI server for the MentorMe Enhanced Assessment system in development mode

# Set environment variables
export DEVELOPMENT=true
export PORT=8000

# Run the server
echo "Starting MentorMe Assessment API server on port $PORT in development mode..."
python run_backend.py