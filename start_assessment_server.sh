#!/bin/bash
# Start script for the MentorMe Assessment Server
# This script starts both the FastAPI backend and the Express frontend

# Make the script executable
chmod +x start_assessment_api.sh

# Start the FastAPI backend in the background
echo "Starting MentorMe Assessment API..."
./start_assessment_api.sh &
BACKEND_PID=$!

# Start the Express server in the foreground
echo "Starting MentorMe Frontend..."
npm run dev

# If the frontend stops, kill the backend
kill $BACKEND_PID