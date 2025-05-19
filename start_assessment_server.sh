#!/bin/bash
# Script to import questions and start the MentorMe Enhanced Assessment API server

# Install required Python packages if not already installed
pip install fastapi uvicorn sqlalchemy pydantic python-dotenv

# Import questions before starting
echo "Importing questions from CSV database..."
python run_backend.py --import-questions

# Run the FastAPI server in development mode
echo "Starting MentorMe Enhanced Assessment API with development settings..."
python run_backend.py --host 0.0.0.0 --port 5050 --reload