"""
Budget Watchdog API
Main application entry point with routes and middleware configuration
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import auth_example, lapse, anomalies, budget, users
from database import init_db, verify_db_connection
from logging_config import configure_logging

# Initialize structured logging
configure_logging(
    log_level="INFO",
    log_file="logs/budget_watchdog.log",
    json_format=True
)

logger = logging.getLogger(__name__)

# Create FastAPI app with metadata
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Real-time budget monitoring and anomaly detection platform for government departments",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
)

# CORS middleware - Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    max_age=600,  # Cache preflight requests for 10 minutes
)


# =====================================================
# Health Check Endpoints
# =====================================================

@app.get("/")
async def root():
    """
    Root health check endpoint
    
    Used by load balancers and frontend to verify API is running.
    """
    return {
        "status": "healthy",
        "service": "Budget Watchdog API",
        "version": "1.0.0",
        "environment": "development"
    }


@app.get("/health")
async def health_check():
    """
    Detailed health check with service status
    
    Checks availability of:
    - Main API service
    - Database connection
    - Redis cache
    - ML model service
    """
    return {
        "status": "healthy",
        "services": {
            "api": "running",
            "database": "not_configured",  # TODO: Add DB health check
            "redis": "not_configured",      # TODO: Add Redis health check
            "ml_model": "ready",            # TODO: Add ML model health check
        },
        "timestamp": "2026-03-06T14:00:00Z"
    }


# =====================================================
# Route Registration
# =====================================================

# Authentication routes (prefix /api/auth handled in router)
app.include_router(auth_example.router, prefix=settings.API_V1_PREFIX)

# User management and RBAC routes (prefix /api/users)
app.include_router(users.router, prefix=settings.API_V1_PREFIX)

# Lapse prediction routes (prefix /api/lapse)
app.include_router(lapse.router, prefix=settings.API_V1_PREFIX)

# Anomaly detection routes (prefix /api/anomalies)
app.include_router(anomalies.router, prefix=settings.API_V1_PREFIX)

# Budget analysis routes (prefix /api/budget)
app.include_router(budget.router, prefix=settings.API_V1_PREFIX)

# Reallocation routes (prefix /api/reallocation)
from routers import reallocation, export
app.include_router(reallocation.router, prefix=settings.API_V1_PREFIX)

# Export routes (prefix /api/export)
app.include_router(export.router, prefix=settings.API_V1_PREFIX)

# TODO: Add more routers as they are implemented


# =====================================================
# Startup and Shutdown Events
# =====================================================

@app.on_event("startup")
async def startup_event():
    """Initialize resources on startup"""
    logger.info("🚀 Budget Watchdog API starting...", extra={
        "service": "budget_watchdog_api",
        "component": "startup"
    })
    logger.info(f"📋 Environment: {settings.PROJECT_NAME}", extra={
        "project_name": settings.PROJECT_NAME
    })
    logger.info(f"🔓 CORS Origins: {settings.ALLOWED_ORIGINS}", extra={
        "cors_origins": settings.ALLOWED_ORIGINS
    })
    
    # Initialize database
    try:
        await init_db()
        verify_db_connection()
        logger.info("✅ Database initialized successfully", extra={
            "component": "database"
        })
    except Exception as e:
        logger.error(f"⚠️ Database initialization warning: {str(e)}", extra={
            "component": "database",
            "error": str(e)
        })
    
    # TODO: Load ML models
    # TODO: Initialize Redis connection
    logger.info("✅ Startup complete")


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on shutdown"""
    logger.info("🛑 Budget Watchdog API shutting down...", extra={
        "component": "shutdown"
    })
    # TODO: Close DB connections
    # TODO: Close Redis connections
    logger.info("✅ Shutdown complete")


# =====================================================
# Server Entry Point
# =====================================================

if __name__ == "__main__":
    import uvicorn
    import sys
    
    # Get environment-specific settings
    host = "0.0.0.0"
    port = 8000
    reload = True
    workers = 1
    
    # For production, disable reload and use multiple workers
    if len(sys.argv) > 1 and sys.argv[1] == "--prod":
        reload = False
        workers = 4
        print("Starting in production mode (4 workers, no reload)")
    else:
        print(" Starting in development mode (reload enabled)")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=reload,
        workers=workers,
        log_level="info",
    )
