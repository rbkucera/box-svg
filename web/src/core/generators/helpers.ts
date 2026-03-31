import type { Arc, Element, Line } from "../models";

export function hline(x1: number, x2: number, y: number, kind: "cut" | "score"): Line {
  return { type: "line", x1, y1: y, x2, y2: y, kind };
}

export function vline(x: number, y1: number, y2: number, kind: "cut" | "score"): Line {
  return { type: "line", x1: x, y1, x2: x, y2, kind };
}

export function pathFromPoints(points: [number, number][], kind: "cut" | "score"): Line[] {
  const lines: Line[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    if (Math.abs(x1 - x2) > 1e-6 || Math.abs(y1 - y2) > 1e-6) {
      lines.push({ type: "line", x1, y1, x2, y2, kind });
    }
  }
  return lines;
}

export function arc(
  x1: number, y1: number,
  x2: number, y2: number,
  r: number, sweep: 0 | 1,
  kind: "cut" | "score",
): Arc {
  return { type: "arc", x1, y1, x2, y2, r, sweep, kind };
}

/**
 * Emit a corner transition between two line segments, optionally rounded.
 *
 * Given three points (p1 → corner → p2), if radius=0, emits two straight
 * line segments. If radius>0, shortens both segments and inserts a
 * quarter-circle arc at the corner.
 *
 * Returns the elements AND the adjusted start/end points so callers can
 * chain corners together.
 */
export function roundedCorner(
  x1: number, y1: number,   // incoming point
  cx: number, cy: number,   // corner point
  x2: number, y2: number,   // outgoing point
  radius: number,
  kind: "cut" | "score",
): Element[] {
  if (radius <= 0) {
    // Sharp corner: two straight segments
    return pathFromPoints([[x1, y1], [cx, cy], [x2, y2]], kind);
  }

  // Compute unit vectors from corner toward each adjacent point
  const d1x = x1 - cx, d1y = y1 - cy;
  const d2x = x2 - cx, d2y = y2 - cy;
  const len1 = Math.hypot(d1x, d1y);
  const len2 = Math.hypot(d2x, d2y);

  // Clamp radius to not exceed either segment length
  const r = Math.min(radius, len1 * 0.99, len2 * 0.99);
  if (r <= 1e-6) {
    return pathFromPoints([[x1, y1], [cx, cy], [x2, y2]], kind);
  }

  // Arc tangent points: r distance from corner along each segment
  const t1x = cx + (d1x / len1) * r;
  const t1y = cy + (d1y / len1) * r;
  const t2x = cx + (d2x / len2) * r;
  const t2y = cy + (d2y / len2) * r;

  // Determine sweep direction using cross product
  // cross > 0 → left turn → sweep=0 (CCW), cross < 0 → right turn → sweep=1 (CW)
  const cross = d1x * d2y - d1y * d2x;
  const sweep: 0 | 1 = cross >= 0 ? 1 : 0;

  const elements: Element[] = [];

  // Incoming line segment (shortened)
  if (Math.hypot(t1x - x1, t1y - y1) > 1e-6) {
    elements.push({ type: "line", x1, y1, x2: t1x, y2: t1y, kind });
  }

  // Arc from tangent point 1 to tangent point 2
  elements.push({ type: "arc", x1: t1x, y1: t1y, x2: t2x, y2: t2y, r, sweep, kind });

  // Outgoing line segment (shortened)
  if (Math.hypot(x2 - t2x, y2 - t2y) > 1e-6) {
    elements.push({ type: "line", x1: t2x, y1: t2y, x2, y2, kind });
  }

  return elements;
}

export function applyKerf(elements: Element[], kerf: number): void {
  const k = kerf / 2;
  if (k > 0) {
    for (const el of elements) {
      el.x1 += k;
      el.y1 += k;
      el.x2 += k;
      el.y2 += k;
    }
  }
}
