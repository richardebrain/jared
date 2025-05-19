#!/bin/bash
# Start the assessment server that imports ECE question database and exposes the API

# Make both scripts executable
chmod +x start_assessment_api.sh

# Set up Python environment
echo "Setting up Python environment..."
pip install -q fastapi uvicorn sqlalchemy psycopg2-binary python-dotenv pandas pydantic

# Check if CSV file exists
if [ ! -f "attached_assets/ece_master_database_full_with_why.csv" ]; then
  echo "Error: CSV file not found. Please make sure the ECE question database file exists."
  exit 1
fi

# Start the assessment API
echo "Starting the MentorMe Enhanced Assessment API..."
./start_assessment_api.sh