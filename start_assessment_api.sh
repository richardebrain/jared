#!/bin/bash
# Start the MentorMe assessment API server

# Set environment variables
export API_ENV=production
export API_HOST=0.0.0.0
export API_PORT=8000

# Run the server
python run_backend.py