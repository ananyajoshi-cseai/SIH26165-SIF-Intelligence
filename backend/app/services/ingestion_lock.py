"""Serialize retries of one ingestion operation without a schema migration."""
import hashlib
from sqlalchemy import text
from sqlalchemy.orm import Session


def lock_ingestion(db: Session, key: str) -> None:
    if db.get_bind().dialect.name == "postgresql":
        lock_id = int.from_bytes(hashlib.sha256(key.encode()).digest()[:8], "big", signed=True)
        db.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": lock_id})
