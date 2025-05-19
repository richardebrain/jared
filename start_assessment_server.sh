#!/bin/bash

# Start the FastAPI server for the MentorMe Enhanced Assessment system in production mode

# Set environment variables
export PORT=8000

# Run the server with uvicorn directly
echo "Starting MentorMe Assessment API server on port $PORT in production mode..."
python run_backend.py