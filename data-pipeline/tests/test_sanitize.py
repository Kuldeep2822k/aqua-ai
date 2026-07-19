"""Unit tests for the input-sanitisation helpers in fetch_data."""

import fetch_data


class TestSanitizeText:
    def test_strips_html_tags(self):
        assert fetch_data.sanitize_text("<b>Ganga</b>") == "Ganga"

    def test_decodes_html_entities(self):
        assert fetch_data.sanitize_text("A &amp; B") == "A & B"

    def test_removes_null_bytes(self):
        assert "\x00" not in fetch_data.sanitize_text("a\x00b")

    def test_removes_control_characters(self):
        assert fetch_data.sanitize_text("a\x07b") == "ab"

    def test_keeps_newlines_and_tabs_but_trims_edges(self):
        assert fetch_data.sanitize_text("  line1\n\tline2  ") == "line1\n\tline2"

    def test_enforces_max_length(self):
        assert len(fetch_data.sanitize_text("x" * 1000, max_length=10)) == 10

    def test_coerces_non_string_input(self):
        assert fetch_data.sanitize_text(123) == "123"

    def test_none_becomes_empty_string(self):
        assert fetch_data.sanitize_text(None) == ""


class TestSanitizeRecord:
    def test_only_listed_fields_are_sanitized(self):
        record = {"name": "<i>Yamuna</i>", "note": "<b>raw</b>", "value": 5}
        out = fetch_data.sanitize_record(record, ["name"])
        assert out["name"] == "Yamuna"
        assert out["note"] == "<b>raw</b>"
        assert out["value"] == 5

    def test_does_not_mutate_the_original_record(self):
        record = {"name": "<i>Yamuna</i>"}
        fetch_data.sanitize_record(record, ["name"])
        assert record["name"] == "<i>Yamuna</i>"

    def test_ignores_missing_and_none_fields(self):
        record = {"name": None}
        out = fetch_data.sanitize_record(record, ["name", "absent"])
        assert out["name"] is None
        assert "absent" not in out
