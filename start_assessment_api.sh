#!/bin/bash
# Start script for the MentorMe Assessment API
# This script starts the FastAPI server on port 8088

echo "Starting MentorMe Assessment API..."
python3 run_backend.py --host 0.0.0.0 --port 8088 --reload