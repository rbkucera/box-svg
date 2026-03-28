"""Tests for the mailer geometry generator."""

import pytest
from boxsvg.models import BoxRequest, Dieline
from boxsvg.generators.mailer import generate_mailer_dieline


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


def test_returns_dieline():
    result = generate_mailer_dieline(make_request())
    assert isinstance(result, Dieline)


def test_dieline_has_lines():
    result = generate_mailer_dieline(make_request())
    assert len(result.lines) > 0


def test_dieline_dimensions():
    req = make_request(length=6.0, width=2.0, height=3.5)
    result = generate_mailer_dieline(req)
    # Width: flap_w + L + flap_w = 1 + 6 + 1 = 8
    assert result.width == pytest.approx(8.0)
    # Height: dust(1.0) + W(2.0) + H(3.5) + W(2.0) + tuck(1.5) = 10.0
    assert result.height == pytest.approx(10.0)


def test_has_cut_and_score_lines():
    result = generate_mailer_dieline(make_request())
    kinds = {line.kind for line in result.lines}
    assert "cut" in kinds
    assert "score" in kinds


def test_all_lines_within_bounds():
    result = generate_mailer_dieline(make_request())
    for line in result.lines:
        assert 0 <= line.x1 <= result.width + 0.001, f"x1 out of bounds: {line}"
        assert 0 <= line.x2 <= result.width + 0.001, f"x2 out of bounds: {line}"
        assert 0 <= line.y1 <= result.height + 0.001, f"y1 out of bounds: {line}"
        assert 0 <= line.y2 <= result.height + 0.001, f"y2 out of bounds: {line}"


def test_score_lines_are_horizontal_or_vertical():
    result = generate_mailer_dieline(make_request())
    for line in result.lines:
        if line.kind == "score":
            assert line.x1 == line.x2 or line.y1 == line.y2, f"Diagonal score line: {line}"


def test_different_dimensions_produce_different_output():
    r1 = generate_mailer_dieline(make_request(length=6.0))
    r2 = generate_mailer_dieline(make_request(length=10.0))
    assert r1.width != r2.width


def test_square_box():
    result = generate_mailer_dieline(make_request(length=4.0, width=4.0, height=4.0))
    assert result.width > 0
    assert result.height > 0
    assert len(result.lines) > 0
