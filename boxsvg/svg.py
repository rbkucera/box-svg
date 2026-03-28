"""SVG renderer for dielines."""

from __future__ import annotations

from xml.sax.saxutils import quoteattr

from boxsvg.models import Dieline
from boxsvg.units import from_inches

# Pixels per inch for SVG coordinate space
PPI = 96

# Line styles
CUT_COLOR = "#00FF00"
SCORE_COLOR = "#FF0000"
STROKE_WIDTH = 1.0  # px


def render_svg(dieline: Dieline, units: str) -> str:
    """Render a Dieline to an SVG string."""
    # Convert dieline dimensions from inches to SVG coordinates (px at 96 PPI)
    svg_w = dieline.width * PPI
    svg_h = dieline.height * PPI

    # Display dimensions with units
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

    # Group cut lines
    parts.append(f'  <g id="cut" stroke="{CUT_COLOR}" stroke-width="{STROKE_WIDTH}" fill="none">')
    for line in dieline.lines:
        if line.kind == "cut":
            parts.append(
                f'    <line x1="{line.x1 * PPI:.4f}" y1="{line.y1 * PPI:.4f}"'
                f' x2="{line.x2 * PPI:.4f}" y2="{line.y2 * PPI:.4f}"/>'
            )
    parts.append("  </g>")

    # Group score lines
    parts.append(
        f'  <g id="score" stroke="{SCORE_COLOR}" stroke-width="{STROKE_WIDTH}"'
        f' stroke-dasharray="4 2" fill="none">'
    )
    for line in dieline.lines:
        if line.kind == "score":
            parts.append(
                f'    <line x1="{line.x1 * PPI:.4f}" y1="{line.y1 * PPI:.4f}"'
                f' x2="{line.x2 * PPI:.4f}" y2="{line.y2 * PPI:.4f}"/>'
            )
    parts.append("  </g>")

    parts.append("</svg>")
    return "\n".join(parts) + "\n"
