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

Side flaps are inset vertically by T with radiused corners at notch gaps.
Top and bottom panels are wider than front/back by T to account for
material thickness when wrapping.
"""

from __future__ import annotations

from boxsvg.models import Arc, BoxRequest, Dieline, Element, Line


def _hline(x1: float, x2: float, y: float, kind: str) -> Line:
    return Line(x1=x1, y1=y, x2=x2, y2=y, kind=kind)


def _vline(x: float, y1: float, y2: float, kind: str) -> Line:
    return Line(x1=x, y1=y1, x2=x, y2=y2, kind=kind)


def _side_flaps(
    elements: list[Element],
    body_left: float,
    body_right: float,
    flap_w: float,
    y_top: float,
    y_bottom: float,
    t: float,
) -> None:
    """Add left and right side flaps for a panel with radiused notch gaps.

    The notch gap is t tall. Each corner gets a quarter-circle arc with
    radius r = t, connecting the body edge directly to the flap edge.
    """
    x_left_flap = body_left - flap_w
    x_right_flap = body_right + flap_w
    flap_top = y_top + t
    flap_bot = y_bottom - t
    r = t  # arc radius = notch gap size

    # --- LEFT FLAP ---
    # Top-left notch: arc from body edge at score line curving to flap top
    elements.append(Arc(x1=body_left, y1=y_top,
                        x2=body_left - r, y2=flap_top,
                        r=r, sweep=1, kind="cut"))
    elements.append(_hline(body_left - r, x_left_flap, flap_top, "cut"))

    # Left flap outer edge
    elements.append(_vline(x_left_flap, flap_top, flap_bot, "cut"))

    # Bottom-left notch: flap bottom curving back to body edge at score line
    elements.append(_hline(x_left_flap, body_left - r, flap_bot, "cut"))
    elements.append(Arc(x1=body_left - r, y1=flap_bot,
                        x2=body_left, y2=y_bottom,
                        r=r, sweep=1, kind="cut"))

    # --- RIGHT FLAP ---
    # Top-right notch
    elements.append(Arc(x1=body_right, y1=y_top,
                        x2=body_right + r, y2=flap_top,
                        r=r, sweep=0, kind="cut"))
    elements.append(_hline(body_right + r, x_right_flap, flap_top, "cut"))

    # Right flap outer edge
    elements.append(_vline(x_right_flap, flap_top, flap_bot, "cut"))

    # Bottom-right notch
    elements.append(_hline(x_right_flap, body_right + r, flap_bot, "cut"))
    elements.append(Arc(x1=body_right + r, y1=flap_bot,
                        x2=body_right, y2=y_bottom,
                        r=r, sweep=0, kind="cut"))

    # Score lines at flap fold edges (full panel height — arcs branch off from these)
    elements.append(_vline(body_left, y_top, y_bottom, "score"))
    elements.append(_vline(body_right, y_top, y_bottom, "score"))


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

    elements: list[Element] = []

    # === TUCK FLAP (tapered trapezoid) ===
    tuck_base_inset = T
    tuck_taper = H / 8  # additional inset at the top edge
    x_tuck_base_left = narrow_left + tuck_base_inset
    x_tuck_base_right = narrow_right - tuck_base_inset
    x_tuck_tip_left = narrow_left + tuck_base_inset + tuck_taper
    x_tuck_tip_right = narrow_right - tuck_base_inset - tuck_taper

    elements.append(_hline(x_tuck_tip_left, x_tuck_tip_right, y_tuck_top, "cut"))  # top edge
    elements.append(Line(x1=x_tuck_tip_left, y1=y_tuck_top,
                         x2=x_tuck_base_left, y2=y_top_top, kind="cut"))            # left taper
    elements.append(Line(x1=x_tuck_tip_right, y1=y_tuck_top,
                         x2=x_tuck_base_right, y2=y_top_top, kind="cut"))           # right taper
    # Horizontal cuts connecting tuck base to top panel body
    elements.append(_hline(narrow_left, x_tuck_base_left, y_top_top, "cut"))
    elements.append(_hline(x_tuck_base_right, narrow_right, y_top_top, "cut"))

    # === TOP PANEL === (wide body: L+T)
    elements.append(_hline(wide_left, wide_right, y_top_top, "score"))
    elements.append(_hline(wide_left, wide_right, y_front_top, "score"))
    # Horizontal cuts: narrow tuck edge to wide top panel body
    elements.append(_hline(wide_left, narrow_left, y_top_top, "cut"))
    elements.append(_hline(narrow_right, wide_right, y_top_top, "cut"))
    _side_flaps(elements, wide_left, wide_right, width_flap_w, y_top_top, y_front_top, T)
    # Transition cuts: wide top panel to narrow front panel
    elements.append(_hline(wide_left, narrow_left, y_front_top, "cut"))
    elements.append(_hline(narrow_right, wide_right, y_front_top, "cut"))

    # === FRONT PANEL === (narrow body: L)
    elements.append(_hline(narrow_left, narrow_right, y_bottom_top, "score"))
    _side_flaps(elements, narrow_left, narrow_right, height_flap_w, y_front_top, y_bottom_top, T)
    # Transition cuts: narrow front to wide bottom
    elements.append(_hline(wide_left, narrow_left, y_bottom_top, "cut"))
    elements.append(_hline(narrow_right, wide_right, y_bottom_top, "cut"))

    # === BOTTOM PANEL === (wide body: L+T)
    elements.append(_hline(wide_left, wide_right, y_back_top, "score"))
    _side_flaps(elements, wide_left, wide_right, width_flap_w, y_bottom_top, y_back_top, T)
    # Transition cuts: wide bottom to narrow back
    elements.append(_hline(wide_left, narrow_left, y_back_top, "cut"))
    elements.append(_hline(narrow_right, wide_right, y_back_top, "cut"))

    # === BACK PANEL === (narrow body: L)
    elements.append(_hline(narrow_left, narrow_right, y_back_bottom, "cut"))  # bottom edge
    _side_flaps(elements, narrow_left, narrow_right, height_flap_w, y_back_top, y_back_bottom, T)

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
