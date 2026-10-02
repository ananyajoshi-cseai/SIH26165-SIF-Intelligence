import pytest

from app.services.csv_service import parse_csv
from app.services.report_service import is_report_csv_document
from app.services.mock_nlp_service import MockNLPService


def test_parse_valid_csv():
    content = (
        b"site,text,is_synthetic\n"
        b"Refinery A,Confined space incident,true\n"
        b"Refinery B,Machine guarding issue,false\n"
    )

    rows = parse_csv(content)

    assert len(rows) == 2
    assert rows[0]["site"] == "Refinery A"
    assert rows[0]["text"] == "Confined space incident"
    assert rows[0]["is_synthetic"] is True
    assert rows[1]["is_synthetic"] is False


def test_missing_required_column():
    content = b"site,is_synthetic\nRefinery A,true\n"

    with pytest.raises(ValueError, match="Missing required columns: text"):
        parse_csv(content)


def test_empty_csv():
    with pytest.raises(ValueError, match="CSV file is empty"):
        parse_csv(b"")


def test_empty_report_text():
    content = b"site,text,is_synthetic\nRefinery A,,true\n"

    with pytest.raises(ValueError, match="'text' cannot be empty"):
        parse_csv(content)


def test_missing_site_defaults_to_unknown():
    content = b"site,text,is_synthetic\n,Test safety report,true\n"

    rows = parse_csv(content)

    assert rows[0]["site"] == "Unknown"


def test_site_is_inferred_when_csv_has_no_site_column():
    content = b'text,is_synthetic\n"Site: Jorajan Oil Field\nWorker reported a hazard.",true\n'

    rows = parse_csv(content)

    assert rows[0]["site"] == "Jorajan Oil Field"


def test_csv_upload_defaults_to_real_report_input():
    rows = parse_csv(b"text\n\"Site: Jorajan Oil Field\nHazard observed.\"\n")

    assert rows[0]["is_synthetic"] is False


def test_modified_report_text_is_preferred_over_original_text():
    content = (
        b"site,report_text,modified_report_text\n"
        b'Rig A,"Worker entered confined space without atmospheric testing.","Worker fell from rig platform and died."\n'
    )

    rows = parse_csv(content)
    analyzer = MockNLPService()

    assert rows[0]["text"] == "Worker fell from rig platform and died."
    assert analyzer.extract("Worker entered confined space without atmospheric testing.").hazard == "Confined space"
    assert analyzer.extract(rows[0]["text"]).hazard == "Fall from height"


def test_detects_whole_csv_text_accidentally_submitted_as_one_report():
    assert is_report_csv_document("report_id,site,report_text\n1,Rig A,Near miss\n")
    assert is_report_csv_document("report_id,site,modified_text\n1,Rig A,Modified report\n")
    assert not is_report_csv_document("A worker reported a near miss at Rig A.")