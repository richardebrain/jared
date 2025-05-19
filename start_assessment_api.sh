#!/bin/bash
# Start the MentorMe Assessment API for production use

# Set environment variables
export PORT=8000

# Run the FastAPI application with uvicorn
echo "Starting MentorMe Assessment API on port $PORT..."
python3 run_backend.py --host 0.0.0.0 --port $PORT