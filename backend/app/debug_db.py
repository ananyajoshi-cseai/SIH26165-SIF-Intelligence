from urllib.parse import urlparse

from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import settings
from app.db.database import engine

router = APIRouter(prefix="/debug", tags=["Debug"])


@router.get("/database")
def database_debug():
    parsed = urlparse(settings.database_url)

    result = {
        "database_url_present": bool(settings.database_url),
        "scheme": parsed.scheme,
        "host": parsed.hostname,
        "port": parsed.port,
        "database": parsed.path.lstrip("/"),
        "connection": "not_tested",
    }

    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        result["connection"] = "OK"
    except Exception as exc:
        result["connection"] = "FAILED"
        result["error_type"] = type(exc).__name__
        result["error"] = str(exc)

    return result
