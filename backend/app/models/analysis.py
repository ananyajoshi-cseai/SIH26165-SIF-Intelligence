import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    report_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("reports.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    extracted_data: Mapped[dict] = mapped_column(
        JSONB,
        default=dict,
        nullable=False,
    )

    risk_score: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    sif_level: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="LOW",
    )

    confidence: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="PENDING",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    
    @property
    def report_type(self) -> str:
        value = (self.extracted_data or {}).get("report_type", "Unknown")
        return value if isinstance(value, str) else str(value)
    
    @property
    def report_type_confidence(self) -> float:
        return (self.extracted_data or {}).get("report_type_confidence", 0.0)
    
    @property
    def sif_potential(self) -> str:
        value = (self.extracted_data or {}).get("sif_potential", "Unknown")
        if isinstance(value, bool):
            return "SIF Potential" if value else "Non-SIF Potential"
        return value if isinstance(value, str) else str(value)
    
    @property
    def sif_confidence(self) -> float:
        return (self.extracted_data or {}).get("sif_confidence", 0.0)

    @property
    def risk_context(self) -> dict | None:
        return (self.extracted_data or {}).get("risk_context")

    report: Mapped["Report"] = relationship(
        back_populates="analysis",
    )