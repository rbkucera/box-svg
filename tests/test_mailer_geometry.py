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
    # Default corrugated: t=0.125, fa=0.125*1.0=0.125
    # flap_w = 2.0/2 - 0.125 = 0.875
    # Width: 0.875 + 6.0 + 0.875 = 7.75
    assert result.width == pytest.approx(7.75)
    # Height: dust(1.0) + bottom(2.0) + front(3.5+0.125) + top(2.0+0.125) + tuck(1.5) = 10.25
    assert result.height == pytest.approx(10.25)


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


def test_thickness_affects_output():
    r_thin = generate_mailer_dieline(make_request(thickness=0.05))
    r_thick = generate_mailer_dieline(make_request(thickness=0.25))
    # Thicker material -> narrower flaps -> smaller total width
    assert r_thick.width < r_thin.width
    # Thicker material -> larger fold allowance -> taller total height
    assert r_thick.height > r_thin.height


def test_kerf_expands_dieline():
    r_no_kerf = generate_mailer_dieline(make_request(kerf=0.0))
    r_kerf = generate_mailer_dieline(make_request(kerf=0.02))
    assert r_kerf.width == pytest.approx(r_no_kerf.width + 0.02)
    assert r_kerf.height == pytest.approx(r_no_kerf.height + 0.02)


def test_material_affects_output():
    r_corr = generate_mailer_dieline(make_request(material="corrugated"))
    r_chip = generate_mailer_dieline(make_request(material="chipboard"))
    # Different materials have different default thickness and fold allowance
    assert r_corr.height != r_chip.height
    assert r_corr.width != r_chip.width


def test_zero_thickness_matches_nominal():
    result = generate_mailer_dieline(make_request(thickness=0.0, length=6.0, width=2.0, height=3.5))
    # With t=0: flap_w=1.0, fa=0, no adjustments
    assert result.width == pytest.approx(8.0)  # 1.0 + 6.0 + 1.0
    assert result.height == pytest.approx(10.0)  # 1.0 + 2.0 + 3.5 + 2.0 + 1.5
