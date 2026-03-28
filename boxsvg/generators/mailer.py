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

Side flaps extend from the left and right edges of each panel,
inset vertically by material thickness to create notch gaps at folds.
"""

from __future__ import annotations

from boxsvg.models import BoxRequest, Dieline, Line


def _hline(x1: float, x2: float, y: float, kind: str) -> Line:
    return Line(x1=x1, y1=y, x2=x2, y2=y, kind=kind)


def _vline(x: float, y1: float, y2: float, kind: str) -> Line:
    return Line(x1=x, y1=y1, x2=x, y2=y2, kind=kind)


def _side_flaps(
    lines: list[Line],
    x_left_flap: float,
    x_body_left: float,
    x_body_right: float,
    x_right_flap: float,
    y_top: float,
    y_bottom: float,
    t: float,
) -> None:
    """Add left and right side flaps for a panel, inset by thickness t."""
    # Flaps are inset vertically by t at top and bottom to create notch gaps
    flap_top = y_top + t
    flap_bot = y_bottom - t

    # Left flap
    lines.append(_hline(x_body_left, x_left_flap, flap_top, "cut"))   # top notch
    lines.append(_vline(x_left_flap, flap_top, flap_bot, "cut"))      # outer edge
    lines.append(_hline(x_left_flap, x_body_left, flap_bot, "cut"))   # bottom notch

    # Right flap
    lines.append(_hline(x_body_right, x_right_flap, flap_top, "cut"))
    lines.append(_vline(x_right_flap, flap_top, flap_bot, "cut"))
    lines.append(_hline(x_right_flap, x_body_right, flap_bot, "cut"))

    # Vertical cut segments along the body edge (above and below the flap)
    # Top notch vertical segments
    lines.append(_vline(x_body_left, y_top, flap_top, "cut"))
    lines.append(_vline(x_body_right, y_top, flap_top, "cut"))
    # Bottom notch vertical segments
    lines.append(_vline(x_body_left, flap_bot, y_bottom, "cut"))
    lines.append(_vline(x_body_right, flap_bot, y_bottom, "cut"))

    # Score lines at flap fold edges
    lines.append(_vline(x_body_left, flap_top, flap_bot, "score"))
    lines.append(_vline(x_body_right, flap_top, flap_bot, "score"))


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

    # Key y coordinates (from top of SVG)
    y_tuck_top = 0.0
    y_top_panel_top = tuck_depth
    y_front_panel_top = y_top_panel_top + top_panel_h
    y_bottom_panel_top = y_front_panel_top + front_panel_h
    y_dust_top = y_bottom_panel_top + bottom_panel_h
    y_bottom = total_h

    lines: list[Line] = []

    # === TUCK FLAP ===
    tuck_inset = t
    x_tuck_left = x_body_left + tuck_inset
    x_tuck_right = x_body_right - tuck_inset

    lines.append(_hline(x_tuck_left, x_tuck_right, y_tuck_top, "cut"))       # top edge
    lines.append(_vline(x_tuck_left, y_tuck_top, y_top_panel_top, "cut"))    # left edge
    lines.append(_vline(x_tuck_right, y_tuck_top, y_top_panel_top, "cut"))   # right edge
    # Horizontal cuts connecting tuck flap to body
    lines.append(_hline(x_body_left, x_tuck_left, y_top_panel_top, "cut"))
    lines.append(_hline(x_tuck_right, x_body_right, y_top_panel_top, "cut"))

    # === TOP PANEL ===
    lines.append(_hline(x_body_left, x_body_right, y_top_panel_top, "score"))
    lines.append(_hline(x_body_left, x_body_right, y_front_panel_top, "score"))
    _side_flaps(lines, x_left_flap, x_body_left, x_body_right, x_right_flap,
                y_top_panel_top, y_front_panel_top, t)

    # === FRONT PANEL ===
    lines.append(_hline(x_body_left, x_body_right, y_bottom_panel_top, "score"))
    _side_flaps(lines, x_left_flap, x_body_left, x_body_right, x_right_flap,
                y_front_panel_top, y_bottom_panel_top, t)

    # === BOTTOM PANEL ===
    lines.append(_hline(x_body_left, x_body_right, y_dust_top, "score"))
    _side_flaps(lines, x_left_flap, x_body_left, x_body_right, x_right_flap,
                y_bottom_panel_top, y_dust_top, t)

    # === BOTTOM DUST FLAPS ===
    # Left dust flap (inset by t at top, flush at bottom)
    dust_flap_top = y_dust_top + t
    lines.append(_vline(x_body_left, y_dust_top, dust_flap_top, "cut"))
    lines.append(_hline(x_body_left, x_left_flap, dust_flap_top, "cut"))
    lines.append(_vline(x_left_flap, dust_flap_top, y_bottom, "cut"))
    lines.append(_hline(x_left_flap, x_body_left, y_bottom, "cut"))

    # Right dust flap
    lines.append(_vline(x_body_right, y_dust_top, dust_flap_top, "cut"))
    lines.append(_hline(x_body_right, x_right_flap, dust_flap_top, "cut"))
    lines.append(_vline(x_right_flap, dust_flap_top, y_bottom, "cut"))
    lines.append(_hline(x_right_flap, x_body_right, y_bottom, "cut"))

    # Bottom edge of body
    lines.append(_hline(x_body_left, x_body_right, y_bottom, "cut"))

    # Score at dust flap fold
    lines.append(_vline(x_body_left, dust_flap_top, y_bottom, "score"))
    lines.append(_vline(x_body_right, dust_flap_top, y_bottom, "score"))

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
