import uuid
from datetime import datetime, timezone
from app.models.analysis import Analysis
from pgvector.sqlalchemy import Vector
from sqlalchemy import Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    raw_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    metadata_: Mapped[dict] = mapped_column(
        "metadata",
        JSONB,
        default=dict,
        nullable=False,
    )

    is_synthetic: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    embedding: Mapped[list[float] | None] = mapped_column(
    JSONB,
    nullable=True,
)
    analysis: Mapped["Analysis | None"] = relationship(
        back_populates="report",
        uselist=False,
        cascade="all, delete-orphan",
    )