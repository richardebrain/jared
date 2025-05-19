#!/bin/bash
# Start the MentorMe Enhanced Assessment API server

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is required but not found. Please install Python 3."
    exit 1
fi

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    echo "Activating virtual environment..."
    source venv/bin/activate
fi

# Install required packages if needed
echo "Checking for required packages..."
python3 -m pip install -q uvicorn fastapi sqlalchemy pydantic psycopg2-binary

# Run the FastAPI server
echo "Starting MentorMe Enhanced Assessment API server..."
python3 run_backend.py --host 0.0.0.0 --port 8000 --reload

# Deactivate virtual environment on exit
if [ -d "venv" ]; then
    deactivate 2>/dev/null
fi