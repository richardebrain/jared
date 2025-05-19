"""
Main FastAPI application for the MentorMe assessment API
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .server import app as router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

# Create FastAPI application
app = FastAPI(
    title="MentorMe Assessment API",
    description="API for adaptive assessment and learning path generation",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, this should be restricted
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include router
app.include_router(router, prefix="/api/assessment")

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint for the API"""
    return {
        "message": "Welcome to MentorMe Assessment API",
        "docs_url": "/docs",
        "version": "1.0.0"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

# Ready check endpoint
@app.get("/ready")
async def ready_check():
    """Readiness check endpoint"""
    return {"status": "ready"}