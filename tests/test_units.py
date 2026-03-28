"""Tests for unit conversion helpers."""

import pytest
from boxsvg.units import to_inches, from_inches, MM_PER_INCH


def test_to_inches_identity():
    assert to_inches(5.0, "in") == 5.0


def test_to_inches_mm():
    assert to_inches(25.4, "mm") == pytest.approx(1.0)


def test_to_inches_mm_fractional():
    assert to_inches(50.8, "mm") == pytest.approx(2.0)


def test_from_inches_identity():
    assert from_inches(3.0, "in") == 3.0


def test_from_inches_mm():
    assert from_inches(1.0, "mm") == pytest.approx(25.4)


def test_roundtrip_mm():
    original = 12.7
    assert from_inches(to_inches(original, "mm"), "mm") == pytest.approx(original)


def test_to_inches_unsupported_unit():
    with pytest.raises(ValueError, match="Unsupported unit"):
        to_inches(1.0, "cm")


def test_from_inches_unsupported_unit():
    with pytest.raises(ValueError, match="Unsupported unit"):
        from_inches(1.0, "ft")
