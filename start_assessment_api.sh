#!/bin/bash
# Start the MentorMe Assessment API server
# This script provides a convenient way to start the assessment API

# Use the default port 8000 or allow override with PORT environment variable
PORT=${PORT:-8000}
HOST=${HOST:-0.0.0.0}

echo "Starting MentorMe Assessment API on $HOST:$PORT"

# Import the sample questions CSV file if it exists and the database is empty
if [ -f "data/sample_questions.csv" ]; then
  echo "Found sample questions CSV file. Checking if import is needed..."
  # TODO: Add a check to see if the database is empty before importing
  # For now, we'll just import the questions
  python run_backend.py --import-csv data/sample_questions.csv
fi

# Start the server with auto-reload enabled for development
python run_backend.py --host $HOST --port $PORT --reload
