"""Mailer box (roll-end tuck-top) dieline generator.

Layout (unfolded, bottom-up):

    Bottom dust flaps
    ─── score ───
    Bottom panel    (length × width)
    ─── score ───
    Front panel     (length × height)
    ─── score ───
    Top panel       (length × width)
    ─── score ───
    Top tuck flap   (length × tuck_depth)

Side flaps extend from the left and right edges of each panel.
"""

from __future__ import annotations

from boxsvg.models import BoxRequest, Dieline, Line


def _hline(x1: float, x2: float, y: float, kind: str) -> Line:
    return Line(x1=x1, y1=y, x2=x2, y2=y, kind=kind)


def _vline(x: float, y1: float, y2: float, kind: str) -> Line:
    return Line(x1=x, y1=y1, x2=x, y2=y2, kind=kind)


def generate_mailer_dieline(request: BoxRequest) -> Dieline:
    L = request.length  # along the horizontal center
    W = request.width
    H = request.height
    t = request.effective_thickness()
    kerf = request.effective_kerf()
    fa = request.fold_allowance()

    # Flap dimensions — reduced by thickness to prevent overlap when folded
    flap_w = W / 2 - t
    tuck_depth = W * 0.75   # tuck flap depth
    dust_flap_h = W * 0.5   # bottom dust flaps

    # Panel heights with fold allowance compensation
    bottom_panel_h = W                # base panel, no compensation needed
    front_panel_h = H + fa            # wraps around bottom panel material
    top_panel_h = W + fa              # wraps over front panel material

    # Total layout dimensions
    # Horizontal: flap_w | L | flap_w
    # Vertical (bottom to top): dust_flap_h | bottom | front | top | tuck
    total_w = flap_w + L + flap_w
    total_h = dust_flap_h + bottom_panel_h + front_panel_h + top_panel_h + tuck_depth

    # Key x coordinates
    x_left_flap = 0.0
    x_body_left = flap_w
    x_body_right = flap_w + L
    x_right_flap = total_w

    # Key y coordinates (from bottom)
    y_bottom = total_h
    y_dust_top = total_h - dust_flap_h
    y_bottom_panel_top = y_dust_top - bottom_panel_h
    y_front_panel_top = y_bottom_panel_top - front_panel_h
    y_top_panel_top = y_front_panel_top - top_panel_h
    y_tuck_top = 0.0

    lines: list[Line] = []

    # === BOTTOM DUST FLAPS ===
    # Left dust flap
    lines.append(_hline(x_left_flap, x_body_left, y_dust_top, "cut"))        # top edge
    lines.append(_vline(x_left_flap, y_dust_top, y_bottom, "cut"))            # left edge
    lines.append(_hline(x_left_flap, x_body_left, y_bottom, "cut"))           # bottom edge

    # Right dust flap
    lines.append(_hline(x_body_right, x_right_flap, y_dust_top, "cut"))      # top edge
    lines.append(_vline(x_right_flap, y_dust_top, y_bottom, "cut"))           # right edge
    lines.append(_hline(x_body_right, x_right_flap, y_bottom, "cut"))         # bottom edge

    # Bottom dust flap body bottom edge
    lines.append(_hline(x_body_left, x_body_right, y_bottom, "cut"))

    # Score line between dust flaps and bottom panel
    lines.append(_hline(x_left_flap, x_right_flap, y_dust_top, "score"))

    # === BOTTOM PANEL ===
    # Score line at top of bottom panel
    lines.append(_hline(x_body_left, x_body_right, y_bottom_panel_top, "score"))

    # Left side flap for bottom panel
    lines.append(_vline(x_left_flap, y_bottom_panel_top, y_dust_top, "cut"))
    lines.append(_hline(x_left_flap, x_body_left, y_bottom_panel_top, "cut"))

    # Right side flap for bottom panel
    lines.append(_vline(x_right_flap, y_bottom_panel_top, y_dust_top, "cut"))
    lines.append(_hline(x_body_right, x_right_flap, y_bottom_panel_top, "cut"))

    # Score lines at flap folds
    lines.append(_vline(x_body_left, y_dust_top, y_bottom_panel_top, "score"))
    lines.append(_vline(x_body_right, y_dust_top, y_bottom_panel_top, "score"))

    # === FRONT PANEL ===
    # Score at top of front panel
    lines.append(_hline(x_body_left, x_body_right, y_front_panel_top, "score"))

    # Left side flap for front panel
    lines.append(_vline(x_left_flap, y_front_panel_top, y_bottom_panel_top, "cut"))
    lines.append(_hline(x_left_flap, x_body_left, y_front_panel_top, "cut"))
    lines.append(_hline(x_left_flap, x_body_left, y_bottom_panel_top, "cut"))

    # Right side flap for front panel
    lines.append(_vline(x_right_flap, y_front_panel_top, y_bottom_panel_top, "cut"))
    lines.append(_hline(x_body_right, x_right_flap, y_front_panel_top, "cut"))
    lines.append(_hline(x_body_right, x_right_flap, y_bottom_panel_top, "cut"))

    # Score lines at flap folds
    lines.append(_vline(x_body_left, y_bottom_panel_top, y_front_panel_top, "score"))
    lines.append(_vline(x_body_right, y_bottom_panel_top, y_front_panel_top, "score"))

    # === TOP PANEL ===
    # Score at top of top panel
    lines.append(_hline(x_body_left, x_body_right, y_top_panel_top, "score"))

    # Left side flap for top panel
    lines.append(_vline(x_left_flap, y_top_panel_top, y_front_panel_top, "cut"))
    lines.append(_hline(x_left_flap, x_body_left, y_top_panel_top, "cut"))
    lines.append(_hline(x_left_flap, x_body_left, y_front_panel_top, "cut"))

    # Right side flap for top panel
    lines.append(_vline(x_right_flap, y_top_panel_top, y_front_panel_top, "cut"))
    lines.append(_hline(x_body_right, x_right_flap, y_top_panel_top, "cut"))
    lines.append(_hline(x_body_right, x_right_flap, y_front_panel_top, "cut"))

    # Score lines at flap folds
    lines.append(_vline(x_body_left, y_front_panel_top, y_top_panel_top, "score"))
    lines.append(_vline(x_body_right, y_front_panel_top, y_top_panel_top, "score"))

    # === TUCK FLAP ===
    # Tuck flap is slightly narrower than the body for easier insertion
    tuck_inset = t  # inset by material thickness on each side
    x_tuck_left = x_body_left + tuck_inset
    x_tuck_right = x_body_right - tuck_inset

    lines.append(_vline(x_tuck_left, y_top_panel_top, y_tuck_top, "cut"))    # left edge
    lines.append(_hline(x_tuck_left, x_tuck_right, y_tuck_top, "cut"))       # top edge
    lines.append(_vline(x_tuck_right, y_tuck_top, y_top_panel_top, "cut"))   # right edge

    # Angled cuts connecting tuck flap to body at top panel score line
    lines.append(Line(x1=x_body_left, y1=y_top_panel_top, x2=x_tuck_left, y2=y_top_panel_top, kind="cut"))
    lines.append(Line(x1=x_body_right, y1=y_top_panel_top, x2=x_tuck_right, y2=y_top_panel_top, kind="cut"))

    # Kerf compensation: expand the dieline uniformly so the laser kerf
    # (material removed by the cut) doesn't shrink final dimensions.
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
