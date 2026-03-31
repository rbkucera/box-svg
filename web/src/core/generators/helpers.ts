import type { Element, Line } from "../models";

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
