#!/bin/bash

echo "Starting MentorMe Assessment API with data import..."

# Set environment variable to enable data import
export IMPORT_DATA=true

# Run the Python script to start the server
python3 run_backend.py