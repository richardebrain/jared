#!/bin/bash
# Script to start the Assessment server as a background process
# This ensures the server keeps running even in the background

# Make sure the script is executable
chmod +x start_assessment_api.sh

# Check if the server is already running
if pgrep -f "run_backend.py" > /dev/null; then
    echo "Assessment server is already running."
else
    # Start the server in the background
    echo "Starting assessment server in the background..."
    nohup ./start_assessment_api.sh > data/assessment_server.log 2>&1 &
    
    # Give it a moment to start
    sleep 2
    
    # Check if it started successfully
    if pgrep -f "run_backend.py" > /dev/null; then
        echo "Assessment server started successfully. Check data/assessment_server.log for details."
        echo "The server is running on port 8088"
    else
        echo "Failed to start assessment server. Check data/assessment_server.log for errors."
        exit 1
    fi
fi