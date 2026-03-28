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

Between adjacent panels, the notch gap (2T total) is bridged by a
single semicircle arc of radius T, curving toward the body edge.
"""

from __future__ import annotations

from boxsvg.models import Arc, BoxRequest, Dieline, Element, Line


def _hline(x1: float, x2: float, y: float, kind: str) -> Line:
    return Line(x1=x1, y1=y, x2=x2, y2=y, kind=kind)


def _vline(x: float, y1: float, y2: float, kind: str) -> Line:
    return Line(x1=x, y1=y1, x2=x, y2=y2, kind=kind)


def _flap_rect(
    elements: list[Element],
    body_left: float,
    body_right: float,
    flap_w: float,
    flap_top: float,
    flap_bot: float,
    inset_top: float,
    inset_bot: float,
) -> None:
    """Draw just the rectangular part of side flaps (horizontal cuts + outer edge).

    Horizontal cuts end at `inset` distance from the body edge, leaving
    room for the arc that will be drawn separately. Top and bottom insets
    may differ (edge arcs vs internal arcs have different radii).
    """
    x_left_flap = body_left - flap_w
    x_right_flap = body_right + flap_w

    # Left flap
    elements.append(_hline(body_left - inset_top, x_left_flap, flap_top, "cut"))
    elements.append(_vline(x_left_flap, flap_top, flap_bot, "cut"))
    elements.append(_hline(x_left_flap, body_left - inset_bot, flap_bot, "cut"))

    # Right flap
    elements.append(_hline(body_right + inset_top, x_right_flap, flap_top, "cut"))
    elements.append(_vline(x_right_flap, flap_top, flap_bot, "cut"))
    elements.append(_hline(x_right_flap, body_right + inset_bot, flap_bot, "cut"))


def _notch_arc(
    elements: list[Element],
    x: float,
    y_upper: float,
    y_lower: float,
    side: str,
) -> None:
    """Draw a single semicircle arc connecting two flap edges at a notch gap.

    The arc connects (x, y_upper) to (x, y_lower), curving toward the
    body edge (right for left-side flaps, left for right-side flaps).

    Args:
        x: x-coordinate of both arc endpoints (where horizontal cuts end)
        y_upper: y of the upper flap's bottom edge
        y_lower: y of the lower flap's top edge
        side: "left" or "right" — determines curve direction
    """
    r = (y_lower - y_upper) / 2
    if r <= 0:
        return
    # Left side: arc curves RIGHT (toward body). sweep=1 (CW: right then down)
    # Right side: arc curves LEFT (toward body). sweep=0 (CCW: left then down)
    sweep = 1 if side == "left" else 0
    elements.append(Arc(x1=x, y1=y_upper, x2=x, y2=y_lower,
                        r=r, sweep=sweep, kind="cut"))


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

    # Arc inset: how far from body edge the horizontal cuts end (= semicircle radius)
    arc_inset = T  # radius of the between-panel semicircle

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

    # Flap edges (inset by T from panel boundaries)
    top_flap_top = y_top_top + T
    top_flap_bot = y_front_top - T
    front_flap_top = y_front_top + T
    front_flap_bot = y_bottom_top - T
    bottom_flap_top = y_bottom_top + T
    bottom_flap_bot = y_back_top - T
    back_flap_top = y_back_top + T
    back_flap_bot = y_back_bottom - T

    elements: list[Element] = []

    # === TUCK FLAP (tapered trapezoid) ===
    tuck_base_inset = T
    tuck_taper = H / 8
    x_tuck_base_left = narrow_left + tuck_base_inset
    x_tuck_base_right = narrow_right - tuck_base_inset
    x_tuck_tip_left = narrow_left + tuck_base_inset + tuck_taper
    x_tuck_tip_right = narrow_right - tuck_base_inset - tuck_taper

    elements.append(_hline(x_tuck_tip_left, x_tuck_tip_right, y_tuck_top, "cut"))
    elements.append(Line(x1=x_tuck_tip_left, y1=y_tuck_top,
                         x2=x_tuck_base_left, y2=y_top_top, kind="cut"))
    elements.append(Line(x1=x_tuck_tip_right, y1=y_tuck_top,
                         x2=x_tuck_base_right, y2=y_top_top, kind="cut"))
    elements.append(_hline(narrow_left, x_tuck_base_left, y_top_top, "cut"))
    elements.append(_hline(x_tuck_base_right, narrow_right, y_top_top, "cut"))

    # === PANEL SCORE LINES ===
    elements.append(_hline(wide_left, wide_right, y_top_top, "score"))
    elements.append(_hline(wide_left, wide_right, y_front_top, "score"))
    elements.append(_hline(narrow_left, narrow_right, y_bottom_top, "score"))
    elements.append(_hline(wide_left, wide_right, y_back_top, "score"))

    # === TRANSITION CUTS (wide ↔ narrow body) ===
    elements.append(_hline(wide_left, narrow_left, y_top_top, "cut"))
    elements.append(_hline(narrow_right, wide_right, y_top_top, "cut"))
    elements.append(_hline(wide_left, narrow_left, y_front_top, "cut"))
    elements.append(_hline(narrow_right, wide_right, y_front_top, "cut"))
    elements.append(_hline(wide_left, narrow_left, y_bottom_top, "cut"))
    elements.append(_hline(narrow_right, wide_right, y_bottom_top, "cut"))
    elements.append(_hline(wide_left, narrow_left, y_back_top, "cut"))
    elements.append(_hline(narrow_right, wide_right, y_back_top, "cut"))

    # === BACK PANEL BOTTOM EDGE ===
    elements.append(_hline(narrow_left, narrow_right, y_back_bottom, "cut"))

    # === FLAP RECTANGLES (horizontal cuts + outer edges, no arcs) ===
    # Insets: T for internal boundaries (2T gap, radius T), T/2 for edges (T gap, radius T/2)
    edge_inset = T / 2
    _flap_rect(elements, wide_left, wide_right, width_flap_w,
               top_flap_top, top_flap_bot, edge_inset, arc_inset)     # top=edge, bot=internal
    _flap_rect(elements, narrow_left, narrow_right, height_flap_w,
               front_flap_top, front_flap_bot, arc_inset, arc_inset)  # both internal
    _flap_rect(elements, wide_left, wide_right, width_flap_w,
               bottom_flap_top, bottom_flap_bot, arc_inset, arc_inset) # both internal
    _flap_rect(elements, narrow_left, narrow_right, height_flap_w,
               back_flap_top, back_flap_bot, arc_inset, edge_inset)   # top=internal, bot=edge

    # === SCORE LINES along body edges (full panel height per panel) ===
    for body_l, body_r, yt, yb in [
        (wide_left, wide_right, y_top_top, y_front_top),
        (narrow_left, narrow_right, y_front_top, y_bottom_top),
        (wide_left, wide_right, y_bottom_top, y_back_top),
        (narrow_left, narrow_right, y_back_top, y_back_bottom),
    ]:
        elements.append(_vline(body_l, yt, yb, "score"))
        elements.append(_vline(body_r, yt, yb, "score"))

    # === SEMICIRCLE ARCS between adjacent panels' flaps ===
    # Each boundary has a 2T gap. Arc radius = T.
    # The arc x-position uses the leftmost (for left) body edge minus T.

    # Between top panel and front panel (y_front_top)
    # top panel: wide body, front panel: narrow body
    # Left: use wide_left (further left), so arc x = wide_left - T
    # Right: use wide_right (further right), so arc x = wide_right + T
    arc_x_left = wide_left - arc_inset
    arc_x_right = wide_right + arc_inset
    _notch_arc(elements, arc_x_left, top_flap_bot, front_flap_top, "left")
    _notch_arc(elements, arc_x_right, top_flap_bot, front_flap_top, "right")

    # Between front panel and bottom panel (y_bottom_top)
    # front: narrow, bottom: wide — wide is further left
    arc_x_left = wide_left - arc_inset
    arc_x_right = wide_right + arc_inset
    _notch_arc(elements, arc_x_left, front_flap_bot, bottom_flap_top, "left")
    _notch_arc(elements, arc_x_right, front_flap_bot, bottom_flap_top, "right")

    # Between bottom panel and back panel (y_back_top)
    # bottom: wide, back: narrow — wide is further left
    arc_x_left = wide_left - arc_inset
    arc_x_right = wide_right + arc_inset
    _notch_arc(elements, arc_x_left, bottom_flap_bot, back_flap_top, "left")
    _notch_arc(elements, arc_x_right, bottom_flap_bot, back_flap_top, "right")

    # Top edge of top panel (only one flap edge, T gap, radius T/2)
    arc_x_left = wide_left - edge_inset
    arc_x_right = wide_right + edge_inset
    _notch_arc(elements, arc_x_left, y_top_top, top_flap_top, "left")
    _notch_arc(elements, arc_x_right, y_top_top, top_flap_top, "right")

    # Bottom edge of back panel (only one flap edge, T gap, radius T/2)
    arc_x_left = narrow_left - edge_inset
    arc_x_right = narrow_right + edge_inset
    _notch_arc(elements, arc_x_left, back_flap_bot, y_back_bottom, "left")
    _notch_arc(elements, arc_x_right, back_flap_bot, y_back_bottom, "right")

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
