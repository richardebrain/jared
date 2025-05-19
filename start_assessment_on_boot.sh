#!/bin/bash
# Script to start the Assessment API when the application boots up

echo "Starting MentorMe Assessment API on application boot..."

# Run the assessment API in the background
nohup bash ./start_assessment_api.sh > assessment_api.log 2>&1 &

# Log the PID for potential cleanup later
echo $! > assessment_api.pid

echo "MentorMe Assessment API started in the background"
echo "Check assessment_api.log for output"