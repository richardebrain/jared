#!/bin/bash
# Start the MentorMe Assessment API in development mode with auto-reload and sample data

# Set environment variables
export PORT=8000

# Run the FastAPI application with uvicorn in development mode
echo "Starting MentorMe Assessment API in development mode on port $PORT..."
python3 run_backend.py --host 0.0.0.0 --port $PORT --reload --import-data