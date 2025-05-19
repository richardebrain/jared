"""
FastAPI server for the MentorMe Enhanced Assessment system
This module sets up and configures the FastAPI server
"""

import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from .main import app as assessment_app

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("server")

# Create main FastAPI app
app = FastAPI(
    title="MentorMe Enhanced Assessment API",
    description="API for delivering personalized learning assessments to early childhood educators",
    version="1.0.0"
)

# Add CORS middleware to allow cross-origin requests
# In production, specify exact origins instead of allowing all
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the assessment API routes
app.mount("/assessment", assessment_app)

# Root endpoint for health checks
@app.get("/")
async def root():
    """Root endpoint for API health check"""
    return {
        "status": "online",
        "message": "MentorMe Enhanced Assessment API is running",
        "version": "1.0.0",
        "documentation": "/docs"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

def start_server():
    """Start the FastAPI server"""
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    
    logger.info(f"Starting MentorMe Assessment API server on {host}:{port}")
    
    # Start uvicorn server
    uvicorn.run(
        "backend.server:app", 
        host=host, 
        port=port, 
        reload=os.getenv("API_ENV", "development") == "development"
    )

if __name__ == "__main__":
    start_server()