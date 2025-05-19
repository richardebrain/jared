#!/bin/bash
# Script to start the MentorMe Assessment API server

# Ensure the script is executable
chmod +x ./start_assessment_server.sh

# Define color codes for better readability
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
BLUE="\033[0;34m"
RED="\033[0;31m"
NC="\033[0m" # No Color

echo -e "${BLUE}=======================================================${NC}"
echo -e "${GREEN}     MentorMe Assessment API Launcher${NC}"
echo -e "${BLUE}=======================================================${NC}"

# Create data directory for questions if it doesn't exist
if [ ! -d "./data" ]; then
    echo -e "${YELLOW}Creating data directory...${NC}"
    mkdir -p ./data
fi

# Make sure Python is installed and accessible
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed or not in PATH${NC}"
    echo -e "Please install Python 3 and try again."
    exit 1
fi

# Make sure the database is accessible
echo -e "${YELLOW}Checking database connection...${NC}"
if [ -z "$DATABASE_URL" ]; then
    echo -e "${YELLOW}Warning: DATABASE_URL environment variable not set.${NC}"
    echo -e "Using default PostgreSQL connection or SQLite fallback."
else
    echo -e "${GREEN}Database URL is set.${NC}"
fi

# Check for required Python modules
echo -e "${YELLOW}Checking for required Python modules...${NC}"
REQUIRED=("fastapi" "uvicorn" "sqlalchemy" "pydantic")
MISSING=()

for module in "${REQUIRED[@]}"; do
    python3 -c "import $module" 2>/dev/null || MISSING+=("$module")
done

if [ ${#MISSING[@]} -gt 0 ]; then
    echo -e "${YELLOW}Installing missing Python modules: ${MISSING[*]}${NC}"
    pip install "${MISSING[@]}"
fi

# Start the server
echo -e "${GREEN}Starting the MentorMe Assessment API server...${NC}"
echo -e "${BLUE}=======================================================${NC}"

# Check if running in development mode
if [ "$1" == "--dev" ]; then
    echo -e "${YELLOW}Running in development mode with auto-reload${NC}"
    python3 run_backend.py --host 0.0.0.0 --port 8088 --reload
else
    echo -e "${YELLOW}Running in production mode${NC}"
    python3 run_backend.py --host 0.0.0.0 --port 8088
fi