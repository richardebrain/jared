#!/bin/bash
# Start the MentorMe Assessment API server in production mode

# Set the environment variable for the database (if not already set)
if [ -z "$DATABASE_URL" ]; then
  echo "Warning: DATABASE_URL environment variable not set. Using default PostgreSQL connection."
  # This will be overridden if the actual environment variable is set
  export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mentorme"
fi

# Run the server on port 8000, binding to all interfaces
python run_backend.py --host 0.0.0.0 --port 8000