#!/bin/bash
# Start the MentorMe assessment API

# Use port 8088 to avoid conflict with the Express server
PORT=8088
HOST="0.0.0.0"  # Listen on all network interfaces

# Check if Python is installed
if ! command -v python3 &> /dev/null
then
    echo "Python 3 is required but not installed. Please install Python 3."
    exit 1
fi

# Check if required Python packages are installed
if ! python3 -c "import fastapi, uvicorn, sqlalchemy, pydantic" &> /dev/null
then
    echo "Installing required Python packages..."
    pip install fastapi uvicorn[standard] sqlalchemy pydantic python-dotenv
fi

# Check if the environment variable DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "WARNING: DATABASE_URL environment variable is not set."
    echo "Using SQLite database as fallback."
fi

# Start the FastAPI server with uvicorn
echo "Starting MentorMe Assessment API on $HOST:$PORT..."
python3 run_backend.py --host "$HOST" --port "$PORT" --reload