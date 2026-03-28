"""Tests for input validation."""

import pytest
from boxsvg.models import BoxRequest
from boxsvg.validation import validate_request, validate_output_path, warn_unusual


def make_request(**overrides):
    defaults = dict(
        style="mailer",
        length=6.0,
        width=2.0,
        height=3.5,
        units="in",
        material="corrugated",
    )
    defaults.update(overrides)
    return BoxRequest(**defaults)


def test_valid_request():
    assert validate_request(make_request()) == []


def test_invalid_style():
    errors = validate_request(make_request(style="tray"))
    assert any("Unsupported style" in e for e in errors)


def test_invalid_units():
    errors = validate_request(make_request(units="cm"))
    assert any("Unsupported units" in e for e in errors)


def test_invalid_material():
    errors = validate_request(make_request(material="wood"))
    assert any("Unsupported material" in e for e in errors)


def test_zero_length():
    errors = validate_request(make_request(length=0))
    assert any("length must be greater than 0" in e for e in errors)


def test_negative_width():
    errors = validate_request(make_request(width=-1))
    assert any("width must be greater than 0" in e for e in errors)


def test_negative_thickness():
    errors = validate_request(make_request(thickness=-0.1))
    assert any("thickness must be greater than 0" in e for e in errors)


def test_negative_kerf():
    errors = validate_request(make_request(kerf=-0.01))
    assert any("kerf must be non-negative" in e for e in errors)


def test_zero_kerf_valid():
    assert validate_request(make_request(kerf=0.0)) == []


def test_output_path_nonexistent_dir(tmp_path):
    err = validate_output_path(str(tmp_path / "no_such_dir" / "box.svg"))
    assert "does not exist" in err


def test_output_path_exists_no_force(tmp_path):
    f = tmp_path / "box.svg"
    f.write_text("x")
    err = validate_output_path(str(f), force=False)
    assert "already exists" in err


def test_output_path_exists_with_force(tmp_path):
    f = tmp_path / "box.svg"
    f.write_text("x")
    assert validate_output_path(str(f), force=True) is None


def test_warn_extreme_aspect_ratio():
    warnings = warn_unusual(make_request(length=100, width=1, height=1))
    assert any("aspect ratio" in w.lower() for w in warnings)


def test_warn_high_kerf():
    warnings = warn_unusual(make_request(kerf=0.1))
    assert any("kerf" in w.lower() for w in warnings)


def test_no_warnings_normal():
    assert warn_unusual(make_request()) == []
