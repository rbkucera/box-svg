"""SVG renderer for dielines."""

from __future__ import annotations

from boxsvg.models import Arc, Dieline, Line
from boxsvg.units import from_inches

# Pixels per inch for SVG coordinate space
PPI = 96

# Line styles
CUT_COLOR = "#00FF00"
SCORE_COLOR = "#FF0000"
STROKE_WIDTH = 1.0  # px


def _render_element(el: Line | Arc) -> str:
    """Render a single element to an SVG string."""
    if isinstance(el, Line):
        return (
            f'    <line x1="{el.x1 * PPI:.4f}" y1="{el.y1 * PPI:.4f}"'
            f' x2="{el.x2 * PPI:.4f}" y2="{el.y2 * PPI:.4f}"/>'
        )
    elif isinstance(el, Arc):
        r_px = el.r * PPI
        return (
            f'    <path d="M {el.x1 * PPI:.4f},{el.y1 * PPI:.4f}'
            f' A {r_px:.4f},{r_px:.4f} 0 0,{el.sweep} {el.x2 * PPI:.4f},{el.y2 * PPI:.4f}"/>'
        )
    raise TypeError(f"Unknown element type: {type(el)}")


def render_svg(dieline: Dieline, units: str) -> str:
    """Render a Dieline to an SVG string."""
    svg_w = dieline.width * PPI
    svg_h = dieline.height * PPI

    display_w = from_inches(dieline.width, units)
    display_h = from_inches(dieline.height, units)
    unit_suffix = units

    parts: list[str] = []
    parts.append('<?xml version="1.0" encoding="UTF-8"?>')
    parts.append(
        f'<svg xmlns="http://www.w3.org/2000/svg"'
        f' width="{display_w:.4f}{unit_suffix}"'
        f' height="{display_h:.4f}{unit_suffix}"'
        f' viewBox="0 0 {svg_w:.4f} {svg_h:.4f}">'
    )

    # Group cut elements
    parts.append(f'  <g id="cut" stroke="{CUT_COLOR}" stroke-width="{STROKE_WIDTH}" fill="none">')
    for el in dieline.elements:
        if el.kind == "cut":
            parts.append(_render_element(el))
    parts.append("  </g>")

    # Group score elements
    parts.append(
        f'  <g id="score" stroke="{SCORE_COLOR}" stroke-width="{STROKE_WIDTH}"'
        f' stroke-dasharray="4 2" fill="none">'
    )
    for el in dieline.elements:
        if el.kind == "score":
            parts.append(_render_element(el))
    parts.append("  </g>")

    parts.append("</svg>")
    return "\n".join(parts) + "\n"
