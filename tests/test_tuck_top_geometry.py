"""Tests for the tuck-top geometry generator."""

import pytest

from boxsvg.generators.tuck_top import generate_tuck_top_dieline
from boxsvg.models import Dieline, Line, BoxRequest


def make_request(**overrides):
    defaults = dict(
        style="tuck-top",
        length=6.0,
        width=2.0,
        height=3.5,
        units="in",
        material="corrugated",
        lid="inside",
    )
    defaults.update(overrides)
    return BoxRequest(**defaults)


def test_returns_dieline():
    result = generate_tuck_top_dieline(make_request())
    assert isinstance(result, Dieline)


def test_dieline_has_elements():
    result = generate_tuck_top_dieline(make_request())
    assert len(result.elements) > 0


def test_dieline_dimensions():
    req = make_request(length=6.0, width=2.0, height=3.5)
    result = generate_tuck_top_dieline(req)
    expected_glue = 0.5
    expected_w = expected_glue + (2 * 2.0) + (2 * 6.0)
    expected_h = (2.0 / 2) + 2.0 + 3.5 + 2.0 + (2.0 / 2)
    assert result.width == pytest.approx(expected_w)
    assert result.height == pytest.approx(expected_h)


def test_has_cut_and_score_elements():
    result = generate_tuck_top_dieline(make_request())
    kinds = {el.kind for el in result.elements}
    assert "cut" in kinds
    assert "score" in kinds


def test_all_elements_within_bounds():
    result = generate_tuck_top_dieline(make_request())
    for el in result.elements:
        assert -0.001 <= el.x1 <= result.width + 0.001
        assert -0.001 <= el.x2 <= result.width + 0.001
        assert -0.001 <= el.y1 <= result.height + 0.001
        assert -0.001 <= el.y2 <= result.height + 0.001


def test_score_lines_are_horizontal_or_vertical():
    result = generate_tuck_top_dieline(make_request())
    for el in result.elements:
        if el.kind == "score" and isinstance(el, Line):
            assert el.x1 == el.x2 or el.y1 == el.y2


def test_has_tapered_tuck_flap():
    result = generate_tuck_top_dieline(make_request())
    diagonals = [
        el for el in result.elements
        if isinstance(el, Line) and el.kind == "cut"
        and abs(el.x1 - el.x2) > 0.001 and abs(el.y1 - el.y2) > 0.001
    ]
    assert len(diagonals) >= 4


def test_has_top_and_bottom_closure_scores():
    result = generate_tuck_top_dieline(make_request())
    closure_scores = [
        el for el in result.elements
        if isinstance(el, Line) and el.kind == "score" and el.y1 == el.y2
    ]
    ys = sorted({round(el.y1, 6) for el in closure_scores})
    assert 1.0 in ys
    assert 8.5 in ys


def test_open_panel_edges_are_cut_not_score():
    result = generate_tuck_top_dieline(make_request())
    cut_segments = {
        (round(el.x1, 3), round(el.y1, 3), round(el.x2, 3), round(el.y2, 3))
        for el in result.elements
        if isinstance(el, Line) and el.kind == "cut"
    }
    score_segments = {
        (round(el.x1, 3), round(el.y1, 3), round(el.x2, 3), round(el.y2, 3))
        for el in result.elements
        if isinstance(el, Line) and el.kind == "score"
    }

    assert (8.5, 3.0, 14.5, 3.0) in cut_segments
    assert (0.5, 6.5, 6.5, 6.5) in cut_segments
    assert (8.5, 3.0, 14.5, 3.0) not in score_segments
    assert (0.5, 6.5, 6.5, 6.5) not in score_segments


def test_closure_scores_span_full_panel_width():
    result = generate_tuck_top_dieline(make_request())
    score_segments = {
        (round(el.x1, 3), round(el.y1, 3), round(el.x2, 3), round(el.y2, 3))
        for el in result.elements
        if isinstance(el, Line) and el.kind == "score"
    }

    assert (0.5, 1.0, 6.5, 1.0) in score_segments
    assert (8.5, 8.5, 14.5, 8.5) in score_segments


def test_dust_flaps_have_tapered_edge():
    request = make_request()
    result = generate_tuck_top_dieline(request)
    glue_width = 0.5
    x3 = glue_width + request.length + request.width
    x4 = x3 + request.length
    y2 = (request.width / 2) + request.width
    y3 = y2 + request.height
    dust_depth = request.width / 2

    tapered_segments = [
        el for el in result.elements
        if isinstance(el, Line)
        and el.kind == "cut"
        and abs(el.x1 - el.x2) > 0.001
        and abs(el.y1 - el.y2) > 0.001
    ]
    expected_regions = [
        (x3, y2 - dust_depth, y2),
        (x4, y2 - dust_depth, y2),
        (x3, y3, y3 + dust_depth),
        (x4, y3, y3 + dust_depth),
    ]

    matched_regions = 0
    for x_target, y_min, y_max in expected_regions:
        if any(
            abs(point_x - x_target) < 0.5 and y_min - 0.001 <= point_y <= y_max + 0.001
            for segment in tapered_segments
            for point_x, point_y in ((segment.x1, segment.y1), (segment.x2, segment.y2))
        ):
            matched_regions += 1

    assert matched_regions == 4


def test_kerf_expands_dieline():
    r_no_kerf = generate_tuck_top_dieline(make_request(kerf=0.0))
    r_kerf = generate_tuck_top_dieline(make_request(kerf=0.02))
    assert r_kerf.width == pytest.approx(r_no_kerf.width + 0.02)
    assert r_kerf.height == pytest.approx(r_no_kerf.height + 0.02)
