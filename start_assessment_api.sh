#!/bin/bash
# Script to start the MentorMe Assessment API in development mode

echo "Starting MentorMe Assessment API server in development mode..."
python run_backend.py --host 0.0.0.0 --port 8000 --reload --auto-import-sample