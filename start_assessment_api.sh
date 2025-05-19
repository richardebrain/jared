#!/bin/bash
# Start the MentorMe Assessment API server

# Make sure the script is executable
# chmod +x start_assessment_api.sh

# Set the port (default to 8088)
PORT=${1:-8088}

# Set the host (default to 0.0.0.0 to listen on all interfaces)
HOST=${2:-0.0.0.0}

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
  echo "Python 3 is required but not installed. Please install Python 3 and try again."
  exit 1
fi

# Check if required Python packages are installed
echo "Checking required Python packages..."
python3 -c "import uvicorn, fastapi, sqlalchemy" &> /dev/null
if [ $? -ne 0 ]; then
  echo "Installing required Python packages..."
  pip install uvicorn fastapi sqlalchemy
fi

# Create data directory if it doesn't exist
mkdir -p data

# Make sure the script is being run from the project root
if [ ! -f "run_backend.py" ]; then
  echo "This script must be run from the project root directory."
  exit 1
fi

# Make the run_backend.py script executable
chmod +x run_backend.py

# Start the server
echo "Starting MentorMe Assessment API server on $HOST:$PORT..."
python3 run_backend.py --host $HOST --port $PORT --setup-db --import-sample-data