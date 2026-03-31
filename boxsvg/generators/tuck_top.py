"""Tuck-top folding carton dieline generator.

Body layout from left to right:

    glue tab | rear panel | side panel | front panel | side panel

Flap layout:

    top:    rear panel gets the tuck flap + closure panel
            side panels get tapered dust flaps
    bottom: front panel gets the bottom tuck flap + closure panel
            side panels get tapered dust flaps
"""

from __future__ import annotations

from boxsvg.models import BoxRequest, Dieline, Element, Line


def _hline(x1: float, x2: float, y: float, kind: str) -> Line:
    return Line(x1=x1, y1=y, x2=x2, y2=y, kind=kind)


def _vline(x: float, y1: float, y2: float, kind: str) -> Line:
    return Line(x1=x, y1=y1, x2=x, y2=y2, kind=kind)


def _path_from_points(points: list[tuple[float, float]], kind: str) -> list[Line]:
    """Generate connected line segments from a sequence of points."""
    lines: list[Line] = []
    for i in range(len(points) - 1):
        x1, y1 = points[i]
        x2, y2 = points[i + 1]
        if abs(x1 - x2) > 1e-6 or abs(y1 - y2) > 1e-6:
            lines.append(Line(x1=x1, y1=y1, x2=x2, y2=y2, kind=kind))
    return lines


def _glue_tab_width(width: float, thickness: float) -> float:
    """Return a practical glue tab width based on carton width and stock thickness."""
    return min(width / 2, max(width / 4, thickness * 4))


def _dust_flap_taper(width: float, thickness: float) -> float:
    """Return a small taper amount for dust flaps."""
    return min(width / 4, max(width / 8, thickness * 2))


def generate_tuck_top_dieline(request: BoxRequest) -> Dieline:
    """Generate a tuck-top carton dieline matching the rear/front flap layout."""
    length = request.length
    width = request.width
    height = request.height
    thickness = request.effective_thickness()
    kerf = request.effective_kerf()

    glue_w = _glue_tab_width(width, thickness)
    dust_depth = width / 2
    tuck_depth = width
    closure_depth = width / 2
    glue_bevel = min(height / 6, glue_w / 2)
    tuck_inset = min(length / 8, tuck_depth / 3)
    dust_taper = _dust_flap_taper(width, thickness)

    # Horizontal bands: glue tab, rear panel, side panel, front panel, side panel.
    x0 = 0.0
    x1 = glue_w
    x2 = x1 + length
    x3 = x2 + width
    x4 = x3 + length
    x5 = x4 + width

    # Vertical bands: top closure panel, top tuck flap, body, bottom tuck flap, bottom closure panel.
    y0 = 0.0
    y1 = closure_depth
    y2 = y1 + tuck_depth
    y3 = y2 + height
    y4 = y3 + tuck_depth
    y5 = y4 + closure_depth

    elements: list[Element] = []

    # Glue tab with beveled ends.
    glue_points = [
        (x1, y2),
        (x0, y2 + glue_bevel),
        (x0, y3 - glue_bevel),
        (x1, y3),
    ]
    elements.extend(_path_from_points(glue_points, "cut"))

    # Body outer edge on the back panel side.
    elements.append(_vline(x5, y2, y3, "cut"))

    # Top tuck flap plus top closure panel on the rear panel.
    top_tuck_points = [
        (x1, y2),
        (x1, y1),
        (x1 + tuck_inset, y0),
        (x2 - tuck_inset, y0),
        (x2, y1),
        (x2, y2),
    ]
    elements.extend(_path_from_points(top_tuck_points, "cut"))

    # Top dust flap on the first side panel, narrowed with bevels on both sides.
    top_left_dust_points = [
        (x2, y2),
        (x2 + dust_taper, y2 - dust_depth),
        (x3 - dust_taper, y2 - dust_depth),
        (x3, y2),
    ]
    elements.extend(_path_from_points(top_left_dust_points, "cut"))

    # Front panel top edge is an open cut edge.
    elements.append(_hline(x3, x4, y2, "cut"))

    # Top dust flap on the second side panel, narrowed with bevels on both sides.
    top_right_dust_points = [
        (x4, y2),
        (x4 + dust_taper, y2 - dust_depth),
        (x5 - dust_taper, y2 - dust_depth),
        (x5, y2),
    ]
    elements.extend(_path_from_points(top_right_dust_points, "cut"))

    # Rear panel bottom edge is an open cut edge.
    elements.append(_hline(x1, x2, y3, "cut"))

    # Bottom dust flap on the first side panel, narrowed with bevels on both sides.
    bottom_left_dust_points = [
        (x2, y3),
        (x2 + dust_taper, y3 + dust_depth),
        (x3 - dust_taper, y3 + dust_depth),
        (x3, y3),
    ]
    elements.extend(_path_from_points(bottom_left_dust_points, "cut"))

    # Bottom tuck flap plus bottom closure panel on the front panel.
    bottom_tuck_points = [
        (x3, y3),
        (x3, y4),
        (x3 + tuck_inset, y5),
        (x4 - tuck_inset, y5),
        (x4, y4),
        (x4, y3),
    ]
    elements.extend(_path_from_points(bottom_tuck_points, "cut"))

    # Bottom dust flap on the second side panel, narrowed with bevels on both sides.
    bottom_right_dust_points = [
        (x4, y3),
        (x4 + dust_taper, y3 + dust_depth),
        (x5 - dust_taper, y3 + dust_depth),
        (x5, y3),
    ]
    elements.extend(_path_from_points(bottom_right_dust_points, "cut"))

    # Score lines:
    # - vertical body folds between panels
    # - top fold lines only where a flap attaches
    # - bottom fold lines only where a flap attaches
    for x in (x1, x2, x3, x4):
        elements.append(_vline(x, y2, y3, "score"))

    elements.append(_hline(x1, x3, y2, "score"))
    elements.append(_hline(x4, x5, y2, "score"))
    elements.append(_hline(x2, x5, y3, "score"))
    elements.append(_hline(x1, x2, y1, "score"))
    elements.append(_hline(x3, x4, y4, "score"))

    # Kerf compensation: uniform expansion in the positive direction.
    k = kerf / 2
    if k > 0:
        for el in elements:
            el.x1 += k
            el.y1 += k
            el.x2 += k
            el.y2 += k
        x5 += kerf
        y5 += kerf

    return Dieline(width=x5, height=y5, elements=elements)
