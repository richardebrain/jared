"""
Main FastAPI application for the MentorMe assessment API
"""

import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .database import get_db
from .server import app as api_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

# Create FastAPI app
app = FastAPI(
    title="MentorMe Enhanced Assessment API",
    description="API for adaptive assessment and learning path generation for early childhood educators",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Include API routes
app.include_router(api_router, prefix="/api/assessment")

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint for the API"""
    return {
        "message": "MentorMe Enhanced Assessment API",
        "version": "1.0.0",
        "status": "active"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

# Readiness check endpoint
@app.get("/ready")
async def ready_check():
    """Readiness check endpoint"""
    try:
        # Check database connection
        db = next(get_db())
        db.execute("SELECT 1")
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        logger.error(f"Database connection check failed: {str(e)}")
        return {"status": "not ready", "database": "disconnected", "error": str(e)}