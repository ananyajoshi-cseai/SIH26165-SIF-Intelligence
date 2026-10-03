"""Isolated SQLite contract tests. Never connect to deployment databases."""
from datetime import timezone
import pytest
from sqlalchemy import create_engine, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool
from sqlalchemy.types import TypeDecorator
from app.db.database import Base, get_db
from app.main import app

@compiles(JSONB, "sqlite")
def jsonb_sqlite(type_, compiler, **kw):
    return "JSON"

class UTCDateTime(TypeDecorator):
    impl = DateTime
    cache_ok = True
    def process_result_value(self, value, dialect):
        return value.replace(tzinfo=timezone.utc) if value and value.tzinfo is None else value

@pytest.fixture
def db():
    for table in Base.metadata.tables.values():
        for column in table.columns:
            if isinstance(column.type, DateTime):
                column.type = UTCDateTime()
    engine = create_engine("sqlite://", poolclass=StaticPool, connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        app.dependency_overrides[get_db] = lambda: session
        yield session
        app.dependency_overrides.clear()
    engine.dispose()
