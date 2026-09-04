from fastapi import FastAPI

from app.api.v1.reports import router as reports_router

app = FastAPI(
    title="SIF Intelligence API",
    description="Backend API for SIH26165 — AI-powered SIF precursor detection.",
    version="0.1.0",
)


app.include_router(
    reports_router,
    prefix="/api/v1",
)


@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SIF Intelligence API",
        "version": "0.1.0",
    }