#!/bin/bash
# Script to start the FastAPI assessment API server in development mode

echo "Starting MentorMe Assessment API in development mode..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not found"
    exit 1
fi

# Check if uvicorn is installed
if ! python3 -c "import uvicorn" &> /dev/null; then
    echo "Installing uvicorn and FastAPI..."
    pip install uvicorn fastapi sqlalchemy pydantic psycopg2-binary
fi

# Set environment variables for development
export API_HOST="0.0.0.0"
export API_PORT="8000"

# Run the API server with auto-reload
echo "Starting API server on $API_HOST:$API_PORT"
python3 run_backend.py