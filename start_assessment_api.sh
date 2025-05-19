#!/bin/bash
# Script to start the MentorMe Enhanced Assessment API server

# Install required Python packages if not already installed
pip install fastapi uvicorn sqlalchemy pydantic python-dotenv

# Run the FastAPI server
echo "Starting MentorMe Enhanced Assessment API..."
python run_backend.py --host 0.0.0.0 --port 5050 --reload