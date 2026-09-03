from fastapi import FastAPI

app = FastAPI(
    title="SIF Intelligence API",
    description="Backend API for SIH26165 — AI-powered SIF precursor detection.",
    version="0.1.0",
)


@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SIF Intelligence API",
        "version": "0.1.0",
    }