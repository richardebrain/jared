#!/bin/bash

echo "Starting MentorMe Assessment API Server..."
echo "This API provides enhanced ECE question assessment features"

# Run the server on port 8000
python3 -m uvicorn backend.server:app --host 0.0.0.0 --port 8000 --reload