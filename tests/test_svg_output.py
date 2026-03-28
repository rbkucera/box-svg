"""Tests for SVG rendering."""

import pytest
from xml.etree import ElementTree as ET

from boxsvg.models import BoxRequest
from boxsvg.generators.mailer import generate_mailer_dieline
from boxsvg.svg import render_svg, CUT_COLOR, SCORE_COLOR


def make_svg(units="in", **overrides):
    defaults = dict(
        style="mailer",
        length=6.0,
        width=2.0,
        height=3.5,
        units=units,
        material="corrugated",
    )
    defaults.update(overrides)
    req = BoxRequest(**defaults)
    dieline = generate_mailer_dieline(req)
    return render_svg(dieline, units)


def test_valid_xml():
    svg = make_svg()
    ET.fromstring(svg)


def test_svg_root_element():
    svg = make_svg()
    root = ET.fromstring(svg)
    assert root.tag == "{http://www.w3.org/2000/svg}svg"


def test_svg_has_viewbox():
    svg = make_svg()
    root = ET.fromstring(svg)
    assert "viewBox" in root.attrib


def test_svg_has_dimensions_with_units():
    svg = make_svg(units="in")
    root = ET.fromstring(svg)
    assert root.attrib["width"].endswith("in")
    assert root.attrib["height"].endswith("in")


def test_svg_mm_units():
    svg = make_svg(units="mm")
    root = ET.fromstring(svg)
    assert root.attrib["width"].endswith("mm")


def test_svg_has_cut_group():
    svg = make_svg()
    root = ET.fromstring(svg)
    ns = {"svg": "http://www.w3.org/2000/svg"}
    groups = root.findall("svg:g", ns)
    ids = [g.attrib.get("id") for g in groups]
    assert "cut" in ids


def test_svg_has_score_group():
    svg = make_svg()
    root = ET.fromstring(svg)
    ns = {"svg": "http://www.w3.org/2000/svg"}
    groups = root.findall("svg:g", ns)
    ids = [g.attrib.get("id") for g in groups]
    assert "score" in ids


def test_cut_lines_are_green():
    svg = make_svg()
    root = ET.fromstring(svg)
    ns = {"svg": "http://www.w3.org/2000/svg"}
    for g in root.findall("svg:g", ns):
        if g.attrib.get("id") == "cut":
            assert g.attrib["stroke"] == CUT_COLOR


def test_score_lines_are_red_dashed():
    svg = make_svg()
    root = ET.fromstring(svg)
    ns = {"svg": "http://www.w3.org/2000/svg"}
    for g in root.findall("svg:g", ns):
        if g.attrib.get("id") == "score":
            assert g.attrib["stroke"] == SCORE_COLOR
            assert "stroke-dasharray" in g.attrib


def test_svg_contains_line_elements():
    svg = make_svg()
    root = ET.fromstring(svg)
    ns = {"svg": "http://www.w3.org/2000/svg"}
    lines = root.findall(".//svg:line", ns)
    assert len(lines) > 0


def test_svg_contains_path_elements_for_arcs():
    svg = make_svg()
    root = ET.fromstring(svg)
    ns = {"svg": "http://www.w3.org/2000/svg"}
    paths = root.findall(".//svg:path", ns)
    assert len(paths) > 0
    # All paths should have arc commands
    for p in paths:
        assert " A " in p.attrib["d"]
