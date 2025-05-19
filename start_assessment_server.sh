#!/bin/bash
# Script to start the MentorMe Assessment API in production mode

echo "Starting MentorMe Assessment API server in production mode..."
python run_backend.py --host 0.0.0.0 --port 8000