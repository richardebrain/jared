#!/bin/bash
# Start the MentorMe Assessment API server as a background process

# Set the port (default to 8088, which is different from the Node server)
PORT=${1:-8088}
HOST="0.0.0.0"

# Path to the PID file to track the server process
PID_FILE=".assessment_server.pid"

# Check if server is already running
if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if kill -0 $PID 2>/dev/null; then
    echo "Assessment server is already running with PID $PID"
    echo "To restart, first stop the server with: kill $PID"
    exit 0
  else
    echo "Removing stale PID file..."
    rm "$PID_FILE"
  fi
fi

# Make the start script executable
chmod +x start_assessment_api.sh

# Start the server in the background
echo "Starting MentorMe Assessment API server on $HOST:$PORT..."
./start_assessment_api.sh $PORT $HOST > assessment_server.log 2>&1 &

# Save the PID to the file
echo $! > "$PID_FILE"
echo "Server started with PID $(cat $PID_FILE)"
echo "View logs with: tail -f assessment_server.log"
echo "Stop server with: kill $(cat $PID_FILE)"