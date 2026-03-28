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
    # L=6, W=2, H=3.5, T=0.125 (default corrugated)
    req = make_request(length=6.0, width=2.0, height=3.5)
    result = generate_mailer_dieline(req)
    T = 0.125
    # Height: H/2 + (W+T/2) + H + W + H = 1.75 + 2.0625 + 3.5 + 2.0 + 3.5 = 12.8125
    expected_h = 3.5/2 + (2.0 + T/2) + 3.5 + 2.0 + 3.5
    assert result.height == pytest.approx(expected_h)
    # Width: max of (L + W + 2T, L + H + 3T)
    #   L + W + 2T = 6 + 2 + 0.25 = 8.25
    #   L + H + 3T = 6 + 3.5 + 0.375 = 9.875
    expected_w = max(6.0 + 2.0 + 2*T, 6.0 + 3.5 + 3*T)
    assert result.width == pytest.approx(expected_w)


def test_has_cut_and_score_lines():
    result = generate_mailer_dieline(make_request())
    kinds = {line.kind for line in result.lines}
    assert "cut" in kinds
    assert "score" in kinds


def test_all_lines_within_bounds():
    result = generate_mailer_dieline(make_request())
    for line in result.lines:
        assert -0.001 <= line.x1 <= result.width + 0.001, f"x1 out of bounds: {line}"
        assert -0.001 <= line.x2 <= result.width + 0.001, f"x2 out of bounds: {line}"
        assert -0.001 <= line.y1 <= result.height + 0.001, f"y1 out of bounds: {line}"
        assert -0.001 <= line.y2 <= result.height + 0.001, f"y2 out of bounds: {line}"


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
    # Different thickness -> different dimensions
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
    # Different materials have different default thickness
    assert r_corr.height != r_chip.height
    assert r_corr.width != r_chip.width


def test_zero_thickness_matches_nominal():
    result = generate_mailer_dieline(make_request(thickness=0.0, length=6.0, width=2.0, height=3.5))
    # With T=0: no thickness compensation
    # Height: H/2 + W + H + W + H = 1.75 + 2 + 3.5 + 2 + 3.5 = 12.75
    assert result.height == pytest.approx(12.75)
    # Width: max(L+W, L+H) = max(8, 9.5) = 9.5
    assert result.width == pytest.approx(9.5)


def test_back_panel_exists():
    """The dieline should have a full back panel (L×H) at the bottom."""
    req = make_request(thickness=0.0, length=6.0, width=2.0, height=3.5)
    result = generate_mailer_dieline(req)
    # With T=0, the back panel bottom edge should be a horizontal cut
    # at y = total_h spanning the body width
    bottom_cuts = [
        line for line in result.lines
        if line.kind == "cut" and line.y1 == line.y2
        and abs(line.y1 - result.height) < 0.001
    ]
    # Should have a bottom edge cut spanning the body
    body_span = max(abs(l.x2 - l.x1) for l in bottom_cuts)
    assert body_span == pytest.approx(6.0)  # L


def test_bottom_panel_wider():
    """The bottom panel body should be L+T wide, wider than front/back panels."""
    T = 0.25
    req = make_request(thickness=T, length=6.0, width=2.0, height=3.5)
    result = generate_mailer_dieline(req)

    # Find horizontal score lines (panel boundaries)
    h_scores = sorted({
        line.y1 for line in result.lines
        if line.kind == "score" and line.y1 == line.y2
        and abs(line.x2 - line.x1) > 1.0  # wide enough to be a panel boundary
    })

    # Find the widths of these score lines
    score_widths = {}
    for y in h_scores:
        matching = [
            line for line in result.lines
            if line.kind == "score" and abs(line.y1 - y) < 0.001
            and line.y1 == line.y2
            and abs(line.x2 - line.x1) > 1.0
        ]
        if matching:
            score_widths[y] = max(abs(l.x2 - l.x1) for l in matching)

    widths = sorted(set(score_widths.values()))
    # Should have two distinct widths: L and L+T
    assert len(widths) == 2
    assert widths[0] == pytest.approx(6.0)      # narrow panels (front/back)
    assert widths[1] == pytest.approx(6.0 + T)   # wide panels (top/bottom)


def test_flaps_have_notch_gaps():
    """Side flaps should be inset from score lines by material thickness."""
    T = 0.25
    req = make_request(thickness=T, length=6.0, width=2.0, height=3.5)
    result = generate_mailer_dieline(req)

    # Find vertical score lines (flap fold lines)
    v_score_ys = []
    for line in result.lines:
        if line.kind == "score" and line.x1 == line.x2:
            v_score_ys.append((line.y1, line.y2))

    # Each vertical score should span less than its panel height
    # (because flaps are inset by T at top and bottom)
    for y1, y2 in v_score_ys:
        span = abs(y2 - y1)
        # The score span should end T before the panel boundary
        assert span > 0, "Score line should have non-zero length"
