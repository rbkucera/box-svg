"""Tests for the mailer geometry generator."""

import pytest
from boxsvg.models import Arc, BoxRequest, Dieline, Line
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


def test_dieline_has_elements():
    result = generate_mailer_dieline(make_request())
    assert len(result.elements) > 0


def test_dieline_dimensions():
    # L=6, W=2, H=3.5, T=0.125 (default corrugated)
    req = make_request(length=6.0, width=2.0, height=3.5)
    result = generate_mailer_dieline(req)
    T = 0.125
    expected_h = 3.5/2 + (2.0 + T/2) + 3.5 + 2.0 + 3.5
    assert result.height == pytest.approx(expected_h)
    expected_w = max(6.0 + 2.0 + 2*T, 6.0 + 3.5 + 3*T)
    assert result.width == pytest.approx(expected_w)


def test_has_cut_and_score_elements():
    result = generate_mailer_dieline(make_request())
    kinds = {el.kind for el in result.elements}
    assert "cut" in kinds
    assert "score" in kinds


def test_all_elements_within_bounds():
    result = generate_mailer_dieline(make_request())
    for el in result.elements:
        assert -0.001 <= el.x1 <= result.width + 0.001, f"x1 out of bounds: {el}"
        assert -0.001 <= el.x2 <= result.width + 0.001, f"x2 out of bounds: {el}"
        assert -0.001 <= el.y1 <= result.height + 0.001, f"y1 out of bounds: {el}"
        assert -0.001 <= el.y2 <= result.height + 0.001, f"y2 out of bounds: {el}"


def test_score_lines_are_horizontal_or_vertical():
    result = generate_mailer_dieline(make_request())
    for el in result.elements:
        if el.kind == "score" and isinstance(el, Line):
            assert el.x1 == el.x2 or el.y1 == el.y2, f"Diagonal score line: {el}"


def test_different_dimensions_produce_different_output():
    r1 = generate_mailer_dieline(make_request(length=6.0))
    r2 = generate_mailer_dieline(make_request(length=10.0))
    assert r1.width != r2.width


def test_square_box():
    result = generate_mailer_dieline(make_request(length=4.0, width=4.0, height=4.0))
    assert result.width > 0
    assert result.height > 0
    assert len(result.elements) > 0


def test_thickness_affects_output():
    r_thin = generate_mailer_dieline(make_request(thickness=0.05))
    r_thick = generate_mailer_dieline(make_request(thickness=0.25))
    assert r_thick.width != r_thin.width
    assert r_thick.height != r_thin.height


def test_kerf_expands_dieline():
    r_no_kerf = generate_mailer_dieline(make_request(kerf=0.0))
    r_kerf = generate_mailer_dieline(make_request(kerf=0.02))
    assert r_kerf.width == pytest.approx(r_no_kerf.width + 0.02)
    assert r_kerf.height == pytest.approx(r_no_kerf.height + 0.02)


def test_material_affects_output():
    r_corr = generate_mailer_dieline(make_request(material="corrugated"))
    r_chip = generate_mailer_dieline(make_request(material="chipboard"))
    assert r_corr.height != r_chip.height
    assert r_corr.width != r_chip.width


def test_zero_thickness_matches_nominal():
    result = generate_mailer_dieline(make_request(thickness=0.0, length=6.0, width=2.0, height=3.5))
    assert result.height == pytest.approx(12.75)
    assert result.width == pytest.approx(9.5)


def test_back_panel_exists():
    """The dieline should have a full back panel (L×H) at the bottom."""
    req = make_request(thickness=0.0, length=6.0, width=2.0, height=3.5)
    result = generate_mailer_dieline(req)
    bottom_cuts = [
        el for el in result.elements
        if isinstance(el, Line) and el.kind == "cut" and el.y1 == el.y2
        and abs(el.y1 - result.height) < 0.001
    ]
    body_span = max(abs(l.x2 - l.x1) for l in bottom_cuts)
    assert body_span == pytest.approx(6.0)


def test_bottom_panel_wider():
    """The bottom panel body should be L+T wide."""
    T = 0.25
    req = make_request(thickness=T, length=6.0, width=2.0, height=3.5)
    result = generate_mailer_dieline(req)

    h_scores = sorted({
        el.y1 for el in result.elements
        if isinstance(el, Line) and el.kind == "score" and el.y1 == el.y2
        and abs(el.x2 - el.x1) > 1.0
    })

    score_widths = {}
    for y in h_scores:
        matching = [
            el for el in result.elements
            if isinstance(el, Line) and el.kind == "score" and abs(el.y1 - y) < 0.001
            and el.y1 == el.y2 and abs(el.x2 - el.x1) > 1.0
        ]
        if matching:
            score_widths[y] = max(abs(l.x2 - l.x1) for l in matching)

    widths = sorted(set(score_widths.values()))
    assert len(widths) == 2
    assert widths[0] == pytest.approx(6.0)
    assert widths[1] == pytest.approx(6.0 + T)


def test_has_bevels_at_notch_gaps():
    """Notch gaps should have 45-degree bevel cuts."""
    result = generate_mailer_dieline(make_request(thickness=0.125))
    # Find diagonal lines (bevels: neither horizontal nor vertical)
    bevels = [
        el for el in result.elements
        if isinstance(el, Line) and el.kind == "cut"
        and abs(el.x1 - el.x2) > 0.001 and abs(el.y1 - el.y2) > 0.001
    ]
    assert len(bevels) > 0


def test_tuck_is_tapered():
    """The tuck flap top edge should be narrower than the base."""
    req = make_request(length=6.0, width=2.0, height=3.5, thickness=0.125)
    result = generate_mailer_dieline(req)

    # Find the tuck top edge (horizontal cut at y ≈ 0)
    top_cuts = [
        el for el in result.elements
        if isinstance(el, Line) and el.kind == "cut" and el.y1 == el.y2
        and abs(el.y1) < 0.001
    ]
    assert len(top_cuts) == 1
    top_width = abs(top_cuts[0].x2 - top_cuts[0].x1)

    # The base of the tuck (at the score line) should be wider than the top
    T = 0.125
    base_width = 6.0 - 2 * T
    assert top_width < base_width


def test_zero_thickness_no_arcs():
    """With T=0, arcs have radius 0 but geometry should still be valid."""
    result = generate_mailer_dieline(make_request(thickness=0.0))
    assert result.width > 0
    assert result.height > 0
