"""Mailer box (roll-end tuck-top) dieline generator.

Layout (top to bottom in SVG):

    Tuck flap       L × H/2       (inset by T on each side)
    ─── score ───
    Top panel       (L+T) × (W + T/2)   side flaps: H/2 + T
    ─── score ───
    Front panel     L × H                side flaps: W/2 + T
    ─── score ───
    Bottom panel    (L+T) × W            side flaps: H/2 + T
    ─── score ───
    Back panel      L × H                side flaps: W/2 + T

Side flaps are inset vertically by T to create notch gaps at folds.
Top and bottom panels are wider than front/back by T to account for
material thickness when wrapping.
"""

from __future__ import annotations

from boxsvg.models import BoxRequest, Dieline, Line


def _hline(x1: float, x2: float, y: float, kind: str) -> Line:
    return Line(x1=x1, y1=y, x2=x2, y2=y, kind=kind)


def _vline(x: float, y1: float, y2: float, kind: str) -> Line:
    return Line(x1=x, y1=y1, x2=x, y2=y2, kind=kind)


def _side_flaps(
    lines: list[Line],
    body_left: float,
    body_right: float,
    flap_w: float,
    y_top: float,
    y_bottom: float,
    t: float,
) -> None:
    """Add left and right side flaps for a panel, inset vertically by t."""
    x_left_flap = body_left - flap_w
    x_right_flap = body_right + flap_w
    flap_top = y_top + t
    flap_bot = y_bottom - t

    # Left flap
    lines.append(_hline(body_left, x_left_flap, flap_top, "cut"))    # top notch
    lines.append(_vline(x_left_flap, flap_top, flap_bot, "cut"))     # outer edge
    lines.append(_hline(x_left_flap, body_left, flap_bot, "cut"))    # bottom notch

    # Right flap
    lines.append(_hline(body_right, x_right_flap, flap_top, "cut"))
    lines.append(_vline(x_right_flap, flap_top, flap_bot, "cut"))
    lines.append(_hline(x_right_flap, body_right, flap_bot, "cut"))

    # Vertical cut segments at notch gaps (body edge, above and below flap)
    lines.append(_vline(body_left, y_top, flap_top, "cut"))
    lines.append(_vline(body_right, y_top, flap_top, "cut"))
    lines.append(_vline(body_left, flap_bot, y_bottom, "cut"))
    lines.append(_vline(body_right, flap_bot, y_bottom, "cut"))

    # Score lines at flap fold edges
    lines.append(_vline(body_left, flap_top, flap_bot, "score"))
    lines.append(_vline(body_right, flap_top, flap_bot, "score"))


def generate_mailer_dieline(request: BoxRequest) -> Dieline:
    L = request.length
    W = request.width
    H = request.height
    T = request.effective_thickness()
    kerf = request.effective_kerf()

    # Panel heights (vertical extent in the dieline)
    tuck_h = H / 2
    top_panel_h = W + T / 2
    front_panel_h = H
    bottom_panel_h = W
    back_panel_h = H

    # Panel body widths
    narrow_body = L          # front, back panels
    wide_body = L + T        # top, bottom panels

    # Side flap widths (vary by panel type)
    height_flap_w = W / 2 + T    # for height panels (front, back)
    width_flap_w = H / 2 + T     # for width panels (top, bottom)

    # Total dieline height
    total_h = tuck_h + top_panel_h + front_panel_h + bottom_panel_h + back_panel_h

    # Total dieline width = widest panel + its flaps
    # Height panels: (W/2+T) + L + (W/2+T) = L + W + 2T
    # Width panels:  (H/2+T) + (L+T) + (H/2+T) = L + H + 3T
    total_w = max(narrow_body + 2 * height_flap_w, wide_body + 2 * width_flap_w)

    # Center x: all panels are horizontally centered in the canvas
    cx = total_w / 2

    # Body x coordinates for narrow panels (front, back, tuck)
    narrow_left = cx - narrow_body / 2
    narrow_right = cx + narrow_body / 2

    # Body x coordinates for wide panels (top, bottom)
    wide_left = cx - wide_body / 2
    wide_right = cx + wide_body / 2

    # Y coordinates (top to bottom)
    y_tuck_top = 0.0
    y_top_top = tuck_h
    y_front_top = y_top_top + top_panel_h
    y_bottom_top = y_front_top + front_panel_h
    y_back_top = y_bottom_top + bottom_panel_h
    y_back_bottom = total_h

    lines: list[Line] = []

    # === TUCK FLAP ===
    tuck_inset = T
    x_tuck_left = narrow_left + tuck_inset
    x_tuck_right = narrow_right - tuck_inset

    lines.append(_hline(x_tuck_left, x_tuck_right, y_tuck_top, "cut"))       # top edge
    lines.append(_vline(x_tuck_left, y_tuck_top, y_top_top, "cut"))          # left edge
    lines.append(_vline(x_tuck_right, y_tuck_top, y_top_top, "cut"))         # right edge
    # Horizontal cuts connecting tuck to top panel body
    lines.append(_hline(narrow_left, x_tuck_left, y_top_top, "cut"))
    lines.append(_hline(x_tuck_right, narrow_right, y_top_top, "cut"))

    # === TOP PANEL === (wide body: L+T)
    lines.append(_hline(wide_left, wide_right, y_top_top, "score"))
    lines.append(_hline(wide_left, wide_right, y_front_top, "score"))
    # Horizontal cuts connecting narrow tuck edge to wide top panel body
    lines.append(_hline(wide_left, narrow_left, y_top_top, "cut"))
    lines.append(_hline(narrow_right, wide_right, y_top_top, "cut"))
    _side_flaps(lines, wide_left, wide_right, width_flap_w, y_top_top, y_front_top, T)
    # Transition cuts at bottom: wide top panel to narrow front panel
    lines.append(_hline(wide_left, narrow_left, y_front_top, "cut"))
    lines.append(_hline(narrow_right, wide_right, y_front_top, "cut"))

    # === FRONT PANEL === (narrow body: L)
    lines.append(_hline(narrow_left, narrow_right, y_bottom_top, "score"))
    _side_flaps(lines, narrow_left, narrow_right, height_flap_w, y_front_top, y_bottom_top, T)
    # Transition cuts at bottom: narrow front to wide bottom
    lines.append(_hline(wide_left, narrow_left, y_bottom_top, "cut"))
    lines.append(_hline(narrow_right, wide_right, y_bottom_top, "cut"))

    # === BOTTOM PANEL === (wide body: L+T)
    lines.append(_hline(wide_left, wide_right, y_back_top, "score"))
    _side_flaps(lines, wide_left, wide_right, width_flap_w, y_bottom_top, y_back_top, T)
    # Transition cuts at bottom: wide bottom to narrow back
    lines.append(_hline(wide_left, narrow_left, y_back_top, "cut"))
    lines.append(_hline(narrow_right, wide_right, y_back_top, "cut"))

    # === BACK PANEL === (narrow body: L)
    lines.append(_hline(narrow_left, narrow_right, y_back_bottom, "cut"))   # bottom edge
    _side_flaps(lines, narrow_left, narrow_right, height_flap_w, y_back_top, y_back_bottom, T)

    # Kerf compensation: uniform expansion
    k = kerf / 2
    if k > 0:
        for line in lines:
            line.x1 += k
            line.y1 += k
            line.x2 += k
            line.y2 += k
        total_w += kerf
        total_h += kerf

    return Dieline(width=total_w, height=total_h, lines=lines)
