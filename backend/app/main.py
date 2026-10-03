import logging
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from app.api.v1.reports import router as reports_router
from app.debug_db import router as debug_router


app = FastAPI(
    title="SIF Intelligence API",
    description="Backend API for SIH26165 - AI-powered SIF precursor detection.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://oilsentinel.vercel.app",
        "https://sih-26165-sif-intelligence.vercel.app",
        "https://oil-sentinel.onrender.com",
        "https://oilsentinel-ipzv1p3mk-amnas-projects-c8a968a1.vercel.app",
        "https://oilsentinel-eta.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(reports_router, prefix="/api/v1")
app.include_router(debug_router, prefix="/api/v1")


@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SIF Intelligence API",
        "version": "0.1.0",
    }



@app.exception_handler(SQLAlchemyError)
async def database_failure(request, exc):
    logging.getLogger(__name__).error("Database request failed (%s)", type(exc).__name__)
    return JSONResponse(status_code=503, content={"detail": "Database request could not be completed. Retry the same submission after the service recovers."})
