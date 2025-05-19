#!/bin/bash
# Start the MentorMe development assessment server

# Set environment variables
export API_ENV=development
export API_HOST=0.0.0.0
export API_PORT=8000

# Run the server with auto-reload enabled
python run_backend.py