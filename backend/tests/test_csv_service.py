import pytest

from app.services.csv_service import parse_csv


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