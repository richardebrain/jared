#!/bin/bash
# Script to start the MentorMe Assessment API in development mode

# Stop on errors
set -e

echo "Starting MentorMe Assessment API in development mode..."

# Export environment variables
export HOST="0.0.0.0"
export PORT="8000"
export PYTHONPATH="./"

# Install required packages if not already installed
echo "Checking and installing required packages..."
pip install -r requirements.txt 2>/dev/null || echo "Using existing packages"

# Run the API server
python run_backend.py