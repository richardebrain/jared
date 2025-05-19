#!/bin/bash
# Start the FastAPI assessment API server

# Set environment variables
export ASSESSMENT_API_PORT=8000

# Install required Python packages if not already installed
pip install -q fastapi uvicorn sqlalchemy psycopg2-binary python-dotenv pydantic

# Import data if needed
python -c "from backend.import_data import run_import; run_import()"

# Start the FastAPI server
echo "Starting MentorMe Assessment API on port $ASSESSMENT_API_PORT..."
python run_backend.py