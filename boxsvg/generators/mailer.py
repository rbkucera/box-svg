"""Mailer box (roll-end tuck-top) dieline generator.

Layout (top to bottom in SVG):

    Tuck flap       L × H/2       (tapered, inset by T)
    ─── score ───
    Top panel       (L+T) × (W + T/2)   side flaps: H/2 + T
    ─── score ───
    Front panel     L × H                side flaps: W/2 + T
    ─── score ───
    Bottom panel    (L+T) × W            side flaps: H/2 + T
    ─── score ───
    Back panel      L × H                side flaps: W/2 + T

Notch gaps use 45-degree bevels. The cut outline is a continuous
connected path around the entire dieline.
"""

from __future__ import annotations

from boxsvg.models import BoxRequest, Dieline, Element, Line


def _hline(x1: float, x2: float, y: float, kind: str) -> Line:
    return Line(x1=x1, y1=y, x2=x2, y2=y, kind=kind)


def _vline(x: float, y1: float, y2: float, kind: str) -> Line:
    return Line(x1=x, y1=y1, x2=x, y2=y2, kind=kind)


def _path_from_points(points: list[tuple[float, float]], kind: str) -> list[Line]:
    """Generate connected Line segments from a sequence of points."""
    lines = []
    for i in range(len(points) - 1):
        x1, y1 = points[i]
        x2, y2 = points[i + 1]
        if abs(x1 - x2) > 1e-6 or abs(y1 - y2) > 1e-6:  # skip zero-length
            lines.append(Line(x1=x1, y1=y1, x2=x2, y2=y2, kind=kind))
    return lines


def generate_mailer_dieline(request: BoxRequest) -> Dieline:
    L = request.length
    W = request.width
    H = request.height
    T = request.effective_thickness()
    kerf = request.effective_kerf()

    # Panel heights
    tuck_h = H / 2
    top_panel_h = W + T / 2
    front_panel_h = H
    bottom_panel_h = W
    back_panel_h = H

    # Panel body widths
    narrow_body = L
    wide_body = L + T

    # Side flap widths
    height_flap_w = W / 2 + T    # front, back
    width_flap_w = H / 2 + T     # top, bottom

    # Total dieline
    total_h = tuck_h + top_panel_h + front_panel_h + bottom_panel_h + back_panel_h
    total_w = max(narrow_body + 2 * height_flap_w, wide_body + 2 * width_flap_w)

    cx = total_w / 2
    narrow_left = cx - narrow_body / 2
    narrow_right = cx + narrow_body / 2
    wide_left = cx - wide_body / 2
    wide_right = cx + wide_body / 2

    # Y coordinates
    y_tuck_top = 0.0
    y_top = tuck_h
    y_front = y_top + top_panel_h
    y_bottom = y_front + front_panel_h
    y_back = y_bottom + bottom_panel_h
    y_end = total_h

    # Flap edges (inset T from panel boundaries)
    top_ft = y_top + T       # top panel flap top
    top_fb = y_front - T     # top panel flap bottom
    front_ft = y_front + T
    front_fb = y_bottom - T
    bottom_ft = y_bottom + T
    bottom_fb = y_back - T
    back_ft = y_back + T
    back_fb = y_end - T

    # Flap outer x positions
    top_flap_left = wide_left - width_flap_w
    top_flap_right = wide_right + width_flap_w
    front_flap_left = narrow_left - height_flap_w
    front_flap_right = narrow_right + height_flap_w
    bottom_flap_left = wide_left - width_flap_w
    bottom_flap_right = wide_right + width_flap_w
    back_flap_left = narrow_left - height_flap_w
    back_flap_right = narrow_right + height_flap_w

    # Tuck flap geometry
    tuck_base_inset = T
    tuck_taper = H / 8
    tuck_bl = narrow_left + tuck_base_inset
    tuck_br = narrow_right - tuck_base_inset
    tuck_tl = tuck_bl + tuck_taper
    tuck_tr = tuck_br - tuck_taper

    elements: list[Element] = []

    # === CUT OUTLINE — one continuous path ===
    # Trace clockwise: tuck top → right side down → bottom edge → left side up → back to tuck

    # --- TUCK (top portion) ---
    tuck_points = [
        (tuck_tl, y_tuck_top),      # tuck tip left
        (tuck_tr, y_tuck_top),      # tuck tip right
        (tuck_br, y_top),           # tuck base right (taper)
        (narrow_right, y_top),      # connection to body right
        (wide_right, y_top),        # transition to wide body right
    ]
    elements.extend(_path_from_points(tuck_points, "cut"))

    # --- RIGHT SIDE (going down) ---
    right_points = [
        # Edge bevel: top panel top-right
        (wide_right, y_top),
        (wide_right + T, top_ft),
        # Top panel right flap
        (top_flap_right, top_ft),
        (top_flap_right, top_fb),
        (wide_right + T, top_fb),
        # Bevel to score line + transition to narrow body
        (wide_right, y_front),
        (narrow_right, y_front),
        # Bevel to front panel right flap
        (narrow_right + T, front_ft),
        (front_flap_right, front_ft),
        (front_flap_right, front_fb),
        (narrow_right + T, front_fb),
        # Bevel to score line + transition to wide body
        (narrow_right, y_bottom),
        (wide_right, y_bottom),
        # Bevel to bottom panel right flap
        (wide_right + T, bottom_ft),
        (bottom_flap_right, bottom_ft),
        (bottom_flap_right, bottom_fb),
        (wide_right + T, bottom_fb),
        # Bevel to score line + transition to narrow body
        (wide_right, y_back),
        (narrow_right, y_back),
        # Bevel to back panel right flap
        (narrow_right + T, back_ft),
        (back_flap_right, back_ft),
        (back_flap_right, back_fb),
        (narrow_right + T, back_fb),
        # Edge bevel to bottom
        (narrow_right, y_end),
    ]
    elements.extend(_path_from_points(right_points, "cut"))

    # --- BOTTOM EDGE ---
    elements.append(_hline(narrow_right, narrow_left, y_end, "cut"))

    # --- LEFT SIDE (going up) ---
    left_points = [
        # Edge bevel: back panel bottom-left
        (narrow_left, y_end),
        (narrow_left - T, back_fb),
        # Back panel left flap
        (back_flap_left, back_fb),
        (back_flap_left, back_ft),
        (narrow_left - T, back_ft),
        # Bevel to score line + transition to wide body
        (narrow_left, y_back),
        (wide_left, y_back),
        # Bevel to bottom panel left flap
        (wide_left - T, bottom_fb),
        (bottom_flap_left, bottom_fb),
        (bottom_flap_left, bottom_ft),
        (wide_left - T, bottom_ft),
        # Bevel to score line + transition to narrow body
        (wide_left, y_bottom),
        (narrow_left, y_bottom),
        # Bevel to front panel left flap
        (narrow_left - T, front_fb),
        (front_flap_left, front_fb),
        (front_flap_left, front_ft),
        (narrow_left - T, front_ft),
        # Bevel to score line + transition to wide body
        (narrow_left, y_front),
        (wide_left, y_front),
        # Bevel to top panel left flap
        (wide_left - T, top_fb),
        (top_flap_left, top_fb),
        (top_flap_left, top_ft),
        (wide_left - T, top_ft),
        # Edge bevel to top
        (wide_left, y_top),
    ]
    elements.extend(_path_from_points(left_points, "cut"))

    # --- Close back to tuck ---
    close_points = [
        (wide_left, y_top),
        (narrow_left, y_top),
        (tuck_bl, y_top),           # tuck base left
        (tuck_tl, y_tuck_top),      # back to tuck tip (closes the path)
    ]
    elements.extend(_path_from_points(close_points, "cut"))

    # === SCORE LINES ===
    # Horizontal score lines at panel boundaries
    elements.append(_hline(wide_left, wide_right, y_top, "score"))
    elements.append(_hline(wide_left, wide_right, y_front, "score"))
    elements.append(_hline(narrow_left, narrow_right, y_bottom, "score"))
    elements.append(_hline(wide_left, wide_right, y_back, "score"))

    # Vertical score lines (full panel height, at body edges)
    for body_l, body_r, yt, yb in [
        (wide_left, wide_right, y_top, y_front),
        (narrow_left, narrow_right, y_front, y_bottom),
        (wide_left, wide_right, y_bottom, y_back),
        (narrow_left, narrow_right, y_back, y_end),
    ]:
        elements.append(_vline(body_l, yt, yb, "score"))
        elements.append(_vline(body_r, yt, yb, "score"))

    # Kerf compensation: uniform expansion
    k = kerf / 2
    if k > 0:
        for el in elements:
            el.x1 += k
            el.y1 += k
            el.x2 += k
            el.y2 += k
        total_w += kerf
        total_h += kerf

    return Dieline(width=total_w, height=total_h, elements=elements)
