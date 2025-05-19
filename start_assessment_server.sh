#!/bin/bash
# Start the MentorMe Assessment API server in production mode
# This script starts the API without auto-reload and with optimized settings

# Use the default port 8000 or allow override with PORT environment variable
PORT=${PORT:-8000}
HOST=${HOST:-0.0.0.0}

echo "Starting MentorMe Assessment API in production mode on $HOST:$PORT"

# Import the sample questions CSV file if it exists and the database is empty
if [ -f "data/sample_questions.csv" ] && [ ! -f ".imported_questions" ]; then
  echo "Found sample questions CSV file. Importing..."
  python run_backend.py --import-csv data/sample_questions.csv
  # Create a marker file to avoid importing questions again
  touch .imported_questions
  echo "Questions imported successfully."
fi

# Start the server without auto-reload for production
python run_backend.py --host $HOST --port $PORT