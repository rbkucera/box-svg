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

/**
 * Emit a polyline path with optionally rounded corners.
 *
 * Takes N points and N-2 radii (one per interior corner).
 * radius=0 at any corner produces a sharp bend.
 * Adjacent radii are clamped so they don't overlap on shared edges.
 */
export function roundedPath(
  points: [number, number][],
  radii: number[],
  kind: "cut" | "score",
): Element[] {
  if (points.length < 2) return [];
  if (points.length === 2) return pathFromPoints(points, kind);

  const n = points.length;
  // Compute edge lengths
  const edgeLens: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    edgeLens.push(Math.hypot(points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]));
  }

  // Clamp radii so adjacent corners don't exceed their shared edge
  const clamped = radii.map((r) => Math.max(0, r));
  for (let i = 0; i < clamped.length; i++) {
    // Corner i sits between edge i and edge i+1
    const maxBefore = edgeLens[i] * 0.49;
    const maxAfter = edgeLens[i + 1] * 0.49;
    clamped[i] = Math.min(clamped[i], maxBefore, maxAfter);
  }
  // Second pass: if two corners share an edge, their combined radii can't exceed it
  for (let i = 0; i < clamped.length - 1; i++) {
    const sharedEdge = edgeLens[i + 1];
    const combined = clamped[i] + clamped[i + 1];
    if (combined > sharedEdge * 0.98) {
      const scale = (sharedEdge * 0.98) / combined;
      clamped[i] *= scale;
      clamped[i + 1] *= scale;
    }
  }

  const els: Element[] = [];

  // For each corner, compute the tangent points where the arc meets the edges
  // tangentBefore[i] = point on edge i where arc for corner i starts
  // tangentAfter[i] = point on edge i+1 where arc for corner i ends
  const tangentBefore: [number, number][] = [];
  const tangentAfter: [number, number][] = [];

  for (let i = 0; i < clamped.length; i++) {
    const ci = i + 1; // corner point index
    const r = clamped[i];
    const [cx, cy] = points[ci];

    if (r <= 1e-6) {
      tangentBefore.push([cx, cy]);
      tangentAfter.push([cx, cy]);
    } else {
      const [px, py] = points[ci - 1];
      const [nx, ny] = points[ci + 1];
      const dPx = px - cx, dPy = py - cy;
      const dNx = nx - cx, dNy = ny - cy;
      const lenP = Math.hypot(dPx, dPy);
      const lenN = Math.hypot(dNx, dNy);
      tangentBefore.push([cx + (dPx / lenP) * r, cy + (dPy / lenP) * r]);
      tangentAfter.push([cx + (dNx / lenN) * r, cy + (dNy / lenN) * r]);
    }
  }

  // Emit segments: first edge, then alternating arcs and edges
  // First edge: points[0] → tangentBefore[0]
  const [sx, sy] = points[0];
  const [tb0x, tb0y] = tangentBefore[0];
  if (Math.hypot(tb0x - sx, tb0y - sy) > 1e-6) {
    els.push({ type: "line", x1: sx, y1: sy, x2: tb0x, y2: tb0y, kind });
  }

  for (let i = 0; i < clamped.length; i++) {
    const r = clamped[i];
    const [tbx, tby] = tangentBefore[i];
    const [tax, tay] = tangentAfter[i];

    if (r > 1e-6) {
      // Arc at this corner
      const ci = i + 1;
      const [px, py] = points[ci - 1];
      const [cx, cy] = points[ci];
      const [nx, ny] = points[ci + 1];
      const dPx = px - cx, dPy = py - cy;
      const dNx = nx - cx, dNy = ny - cy;
      const cross = dPx * dNy - dPy * dNx;
      const sweep: 0 | 1 = cross >= 0 ? 1 : 0;
      els.push({ type: "arc", x1: tbx, y1: tby, x2: tax, y2: tay, r, sweep, kind });
    }

    // Edge after this corner: tangentAfter[i] → tangentBefore[i+1] (or last point)
    const endX = i < clamped.length - 1 ? tangentBefore[i + 1][0] : points[n - 1][0];
    const endY = i < clamped.length - 1 ? tangentBefore[i + 1][1] : points[n - 1][1];
    if (Math.hypot(endX - tax, endY - tay) > 1e-6) {
      els.push({ type: "line", x1: tax, y1: tay, x2: endX, y2: endY, kind });
    }
  }

  return els;
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
