from app.db.database import SessionLocal
from app.models.report import Report
from app.services.embedding_service import (
    EMBEDDING_DIMENSION,
    SentenceTransformerEmbeddingService,
)
from app.services.vector_service import (
    find_similar_reports,
    generate_and_store_embedding,
)


def test_embedding_has_correct_dimension():
    service = SentenceTransformerEmbeddingService()

    embedding = service.embed("Worker entered a confined space.")

    assert len(embedding) == EMBEDDING_DIMENSION
    assert EMBEDDING_DIMENSION == 384


def test_embedding_is_deterministic():
    service = SentenceTransformerEmbeddingService()
    text = "Worker entered a confined space."

    first = service.embed(text)
    second = service.embed(text)

    assert len(first) == 384
    assert len(second) == 384

    for first_value, second_value in zip(first, second):
        assert abs(first_value - second_value) < 1e-6


def test_find_similar_reports():
    db = SessionLocal()

    reports = []

    try:
        report_a = Report(
            raw_text="Worker entered a confined space without atmospheric testing.",
            metadata_={"site": "Test Site A"},
            is_synthetic=True,
        )

        report_b = Report(
            raw_text="Worker entered a confined space and atmospheric testing was incomplete.",
            metadata_={"site": "Test Site B"},
            is_synthetic=True,
        )

        report_c = Report(
            raw_text="Worker was exposed to an unguarded rotating machine.",
            metadata_={"site": "Test Site C"},
            is_synthetic=True,
        )

        db.add_all([report_a, report_b, report_c])
        db.commit()

        db.refresh(report_a)
        db.refresh(report_b)
        db.refresh(report_c)

        reports.extend([report_a, report_b, report_c])

        generate_and_store_embedding(db, report_a)
        generate_and_store_embedding(db, report_b)
        generate_and_store_embedding(db, report_c)

        results = find_similar_reports(
            db=db,
            report_id=report_a.id,
            top_k=2,
        )

        assert len(results) == 2

        returned_reports = [report for report, similarity in results]
        similarities = [similarity for report, similarity in results]

        assert report_a not in returned_reports
        assert report_b in returned_reports
        assert all(0 <= similarity <= 1 for similarity in similarities)

        # The semantically similar confined-space report should
        # rank higher than the unrelated rotating-machine report.
        if report_c in returned_reports:
            report_b_similarity = next(
                similarity
                for report, similarity in results
                if report is report_b
            )
            report_c_similarity = next(
                similarity
                for report, similarity in results
                if report is report_c
            )
            assert report_b_similarity > report_c_similarity

    finally:
        for report in reports:
            db.delete(report)

        db.commit()
        db.close()
