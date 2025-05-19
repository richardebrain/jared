"""
Main module for MentorMe assessment API
This module integrates the FastAPI server with the application logic
"""

import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from fastapi import FastAPI, Depends, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from .database import get_db, setup_database
from .server import app as server_app

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("main")

# Create the main FastAPI app
app = FastAPI(
    title="MentorMe API",
    description="API for MentorMe Early Childhood Education platform",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add middleware for request logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log incoming requests and their processing time"""
    start_time = datetime.now()
    
    # Process the request
    try:
        response = await call_next(request)
        process_time = (datetime.now() - start_time).total_seconds() * 1000
        logger.info(f"Request {request.method} {request.url.path} processed in {process_time:.2f}ms")
        return response
    except Exception as e:
        process_time = (datetime.now() - start_time).total_seconds() * 1000
        logger.error(f"Request {request.method} {request.url.path} failed after {process_time:.2f}ms: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )

# Include the assessment API routes
app.include_router(server_app, prefix="/api/assessment")

# Root endpoint
@app.get("/")
def read_root():
    """Root endpoint"""
    return {
        "message": "MentorMe API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }

# Health check endpoint
@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    try:
        # Test database connection
        db.execute("SELECT 1")
        
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
        )

# System information endpoint
@app.get("/api/system/info")
def system_info():
    """Get system information"""
    return {
        "version": "1.0.0",
        "python_version": os.environ.get("PYTHON_VERSION", "3.x"),
        "environment": os.environ.get("ENVIRONMENT", "development"),
        "assessment_api_available": True
    }

# Initialize the application
@app.on_event("startup")
async def startup():
    """Startup event handler"""
    logger.info("Starting MentorMe API...")
    
    # Set up database
    logger.info("Setting up database...")
    success, message = setup_database()
    if not success:
        logger.error(f"Database setup failed: {message}")
    else:
        logger.info(message)
    
    logger.info("MentorMe API started successfully")

@app.on_event("shutdown")
async def shutdown():
    """Shutdown event handler"""
    logger.info("Shutting down MentorMe API...")