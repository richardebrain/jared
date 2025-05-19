#!/bin/bash
# Start the MentorMe assessment server from the Express server

# Set permissions for the start script
chmod +x ./start_assessment_api.sh

# Start the assessment API in the background
./start_assessment_api.sh > assessment_api.log 2>&1 &

# Save the process ID for potential cleanup later
ASSESSMENT_API_PID=$!
echo "Assessment API started with PID: $ASSESSMENT_API_PID"
echo $ASSESSMENT_API_PID > assessment_api.pid

# Success message
echo "MentorMe Assessment server started successfully"
echo "API will be available at http://localhost:8088"
echo "Logs are being written to assessment_api.log"