#!/bin/bash
# Script to start the FastAPI assessment API server in production mode

echo "Starting MentorMe Assessment API in production mode..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not found"
    exit 1
fi

# Make sure dependencies are installed
echo "Installing dependencies..."
pip install uvicorn fastapi sqlalchemy pydantic psycopg2-binary python-dotenv

# Set environment variables for production
export API_HOST="0.0.0.0"
export API_PORT="8000"
export LOG_LEVEL="warning"  # Less verbose logging for production

# Ensure DATABASE_URL exists
if [ -z "${DATABASE_URL}" ]; then
    echo "Warning: DATABASE_URL not set. Using default SQLite database."
    export DATABASE_URL="sqlite:///./mentorme.db"
fi

# Run the API server without auto-reload for stability
echo "Starting API server on $API_HOST:$API_PORT in production mode"
python3 -m uvicorn backend.server:app --host $API_HOST --port $API_PORT --log-level $LOG_LEVEL --no-access-log