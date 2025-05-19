#!/bin/bash
# Auto-start script for the MentorMe Assessment API
# This gets called when the main application starts

# Run in background with nohup to avoid blocking
nohup bash start_assessment_api.sh > assessment_server.log 2>&1 &

echo "Started assessment server in background. Check assessment_server.log for details."