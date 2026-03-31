import type { BoxRequest, Dieline, Element, Line } from "../models";
import { effectiveThickness, effectiveKerf } from "../models";

function hline(x1: number, x2: number, y: number, kind: "cut" | "score"): Line {
  return { type: "line", x1, y1: y, x2, y2: y, kind };
}

function vline(x: number, y1: number, y2: number, kind: "cut" | "score"): Line {
  return { type: "line", x1: x, y1, x2: x, y2, kind };
}

function pathFromPoints(points: [number, number][], kind: "cut" | "score"): Line[] {
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

function glueTabWidth(width: number, thickness: number): number {
  return Math.min(width / 2, Math.max(width / 4, thickness * 4));
}

function dustFlapTaper(width: number, thickness: number): number {
  return Math.min(width / 4, Math.max(width / 8, thickness * 2));
}

export function generateTuckTopDieline(request: BoxRequest): Dieline {
  const length = request.length;
  const width = request.width;
  const height = request.height;
  const thickness = effectiveThickness(request);
  const kerf = effectiveKerf(request);

  const glueW = glueTabWidth(width, thickness);
  const dustDepth = width / 2;
  const tuckDepth = width;
  const closureDepth = width / 2;
  const glueBevel = Math.min(height / 6, glueW / 2);
  const tuckInset = Math.min(length / 8, tuckDepth / 3);
  const dustTaper = dustFlapTaper(width, thickness);

  // Horizontal bands: glue tab, rear, side, front, side
  const x0 = 0;
  const x1 = glueW;
  const x2 = x1 + length;
  const x3 = x2 + width;
  const x4 = x3 + length;
  let x5 = x4 + width;

  // Vertical bands: top closure, top tuck, body, bottom tuck, bottom closure
  const y0 = 0;
  const y1 = closureDepth;
  const y2 = y1 + tuckDepth;
  const y3 = y2 + height;
  const y4 = y3 + tuckDepth;
  let y5 = y4 + closureDepth;

  const elements: Element[] = [];

  // Glue tab with beveled ends
  elements.push(...pathFromPoints([
    [x1, y2],
    [x0, y2 + glueBevel],
    [x0, y3 - glueBevel],
    [x1, y3],
  ], "cut"));

  // Body outer edge on the back panel side
  elements.push(vline(x5, y2, y3, "cut"));

  // Top tuck flap + top closure panel on the rear panel
  elements.push(...pathFromPoints([
    [x1, y2],
    [x1, y1],
    [x1 + tuckInset, y0],
    [x2 - tuckInset, y0],
    [x2, y1],
    [x2, y2],
  ], "cut"));

  // Top dust flap on first side panel
  elements.push(...pathFromPoints([
    [x2, y2],
    [x2 + dustTaper, y2 - dustDepth],
    [x3 - dustTaper, y2 - dustDepth],
    [x3, y2],
  ], "cut"));

  // Front panel top edge (open cut)
  elements.push(hline(x3, x4, y2, "cut"));

  // Top dust flap on second side panel
  elements.push(...pathFromPoints([
    [x4, y2],
    [x4 + dustTaper, y2 - dustDepth],
    [x5 - dustTaper, y2 - dustDepth],
    [x5, y2],
  ], "cut"));

  // Rear panel bottom edge (open cut)
  elements.push(hline(x1, x2, y3, "cut"));

  // Bottom dust flap on first side panel
  elements.push(...pathFromPoints([
    [x2, y3],
    [x2 + dustTaper, y3 + dustDepth],
    [x3 - dustTaper, y3 + dustDepth],
    [x3, y3],
  ], "cut"));

  // Bottom tuck flap + bottom closure panel on the front panel
  elements.push(...pathFromPoints([
    [x3, y3],
    [x3, y4],
    [x3 + tuckInset, y5],
    [x4 - tuckInset, y5],
    [x4, y4],
    [x4, y3],
  ], "cut"));

  // Bottom dust flap on second side panel
  elements.push(...pathFromPoints([
    [x4, y3],
    [x4 + dustTaper, y3 + dustDepth],
    [x5 - dustTaper, y3 + dustDepth],
    [x5, y3],
  ], "cut"));

  // Score lines: vertical body folds
  for (const x of [x1, x2, x3, x4]) {
    elements.push(vline(x, y2, y3, "score"));
  }

  // Score lines: horizontal fold lines
  elements.push(hline(x1, x3, y2, "score"));
  elements.push(hline(x4, x5, y2, "score"));
  elements.push(hline(x2, x5, y3, "score"));
  elements.push(hline(x1, x2, y1, "score"));
  elements.push(hline(x3, x4, y4, "score"));

  // Kerf compensation
  const k = kerf / 2;
  if (k > 0) {
    for (const el of elements) {
      el.x1 += k;
      el.y1 += k;
      el.x2 += k;
      el.y2 += k;
    }
    x5 += kerf;
    y5 += kerf;
  }

  return { width: x5, height: y5, elements };
}
