#!/bin/bash
# Start the MentorMe Assessment API in production mode

echo "Starting MentorMe Assessment API in production mode..."

# Set environment variables for production
export HOST=0.0.0.0
export PORT=8000

# Start with uvicorn directly for production
uvicorn backend.main:app --host $HOST --port $PORT --workers 4