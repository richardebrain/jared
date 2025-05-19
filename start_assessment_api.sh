#!/bin/bash
# Script to start the MentorMe Assessment API with data import

echo "Starting MentorMe Assessment API with data import..."
python run_backend.py --host 0.0.0.0 --port 8000 --import-data