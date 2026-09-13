from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.reports import router as reports_router


app = FastAPI(
    title="SIF Intelligence API",
    description="Backend API for SIH26165 - AI-powered SIF precursor detection.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(reports_router, prefix="/api/v1")


@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SIF Intelligence API",
        "version": "0.1.0",
    }
