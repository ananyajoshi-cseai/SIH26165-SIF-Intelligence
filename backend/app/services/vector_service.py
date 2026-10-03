import math
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.report import Report
from app.services.embedding_service import EMBEDDING_VERSION, embedding_service


SIMILARITY_THRESHOLD = 0.75


def _fresh_report(db: Session, report_id: UUID) -> Report | None:
    return db.get(Report, report_id)


def _get_embedding_vector(report: Report, db: Session | None = None) -> list[float] | None:
    if report is None:
        return None

    try:
        report_id = report.id
    except Exception:
        return None

    if report_id is None:
        return None

    fresh = report if db is None else _fresh_report(db, report_id)
    if fresh is None:
        return None

    try:
        metadata = fresh.metadata_ or {}
    except Exception:
        return None

    embedding = metadata.get("embedding")
    if metadata.get("embedding_version") != EMBEDDING_VERSION:
        return None
    if isinstance(embedding, list) and embedding and all(
        isinstance(value, (int, float)) for value in embedding
    ):
        return [float(value) for value in embedding]
    return None


def _cosine_similarity(left: list[float], right: list[float]) -> float:
    if len(left) != len(right):
        return 0.0

    dot_product = sum(a * b for a, b in zip(left, right))
    left_norm = math.sqrt(sum(value * value for value in left))
    right_norm = math.sqrt(sum(value * value for value in right))

    if left_norm == 0 or right_norm == 0:
        return 0.0

    similarity = dot_product / (left_norm * right_norm)
    return max(0.0, min(1.0, similarity))


def generate_and_store_embedding(
    db: Session,
    report: Report,
    *,
    commit: bool = True,
) -> Report:
    if not report.raw_text:
        return report

    report_id = report.id
    if report_id is None:
        return report

    fresh = _fresh_report(db, report_id)
    if fresh is None:
        return report

    embedding = embedding_service.embed(fresh.raw_text)
    metadata = dict(fresh.metadata_ or {})
    metadata["embedding"] = embedding
    metadata["embedding_version"] = EMBEDDING_VERSION
    fresh.metadata_ = metadata

    db.add(fresh)
    if commit:
        db.commit()
        db.refresh(fresh)
    else:
        db.flush()
    return fresh


def find_similar_reports(
    db: Session,
    report_id: UUID,
    top_k: int = 3,
) -> list[tuple[Report, float]]:
    report = _fresh_report(db, report_id)

    if report is None:
        raise ValueError("Report not found")

    report_embedding = _get_embedding_vector(report)
    if report_embedding is None:
        report = generate_and_store_embedding(db, report, commit=False)
        report_embedding = _get_embedding_vector(report)

    candidates: list[tuple[Report, float]] = []
    for candidate in db.scalars(select(Report).options(selectinload(Report.analysis)).where(Report.id != report_id)).all():
        candidate_embedding = _get_embedding_vector(candidate)
        if candidate_embedding is None:
            candidate = generate_and_store_embedding(db, candidate, commit=False)
            candidate_embedding = _get_embedding_vector(candidate)
        if candidate_embedding is None:
            continue

        similarity = _cosine_similarity(report_embedding, candidate_embedding)
        candidates.append((candidate, similarity))

    db.commit()

    if not candidates:
        return []

    scored = sorted(candidates, key=lambda item: item[1], reverse=True)
    above_threshold = [item for item in scored if item[1] >= SIMILARITY_THRESHOLD]
    return above_threshold[: max(1, top_k)]