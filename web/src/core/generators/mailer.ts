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

export function generateMailerDieline(request: BoxRequest): Dieline {
  const L = request.length;
  const W = request.width;
  const H = request.height;
  const T = effectiveThickness(request);
  const kerf = effectiveKerf(request);

  // Panel heights
  const tuckH = H / 2;
  const topPanelH = request.lid === "inside" ? W - T / 2 : W + T / 2;
  const frontPanelH = H;
  const bottomPanelH = W;
  const backPanelH = H;

  // Panel body widths
  const narrowBody = L;
  const wideBody = L + T;

  // Side flap widths
  const heightFlapW = W / 2;
  const widthFlapW = H / 2;

  // Total dieline
  let totalH = tuckH + topPanelH + frontPanelH + bottomPanelH + backPanelH;
  let totalW = Math.max(narrowBody + 2 * heightFlapW, wideBody + 2 * widthFlapW);

  const cx = totalW / 2;
  const narrowLeft = cx - narrowBody / 2;
  const narrowRight = cx + narrowBody / 2;
  const wideLeft = cx - wideBody / 2;
  const wideRight = cx + wideBody / 2;

  // Y coordinates
  const yTop = tuckH;
  const yFront = yTop + topPanelH;
  const yBottom = yFront + frontPanelH;
  const yBack = yBottom + bottomPanelH;
  const yEnd = totalH;

  // Flap edges (inset T from panel boundaries)
  const topFt = yTop + T;
  const topFb = yFront - T;
  const frontFt = yFront + T;
  const frontFb = yBottom - T;
  const bottomFt = yBottom + T;
  const bottomFb = yBack - T;
  const backFt = yBack + T;
  const backFb = yEnd - T;

  // Flap outer x positions
  const topFlapLeft = wideLeft - widthFlapW;
  const topFlapRight = wideRight + widthFlapW;
  const frontFlapLeft = narrowLeft - heightFlapW;
  const frontFlapRight = narrowRight + heightFlapW;
  const bottomFlapLeft = wideLeft - widthFlapW;
  const bottomFlapRight = wideRight + widthFlapW;
  const backFlapLeft = narrowLeft - heightFlapW;
  const backFlapRight = narrowRight + heightFlapW;

  // Tuck flap geometry
  const tuckBaseInset = T;
  const tuckTaper = H / 8;
  const tuckBl = narrowLeft + tuckBaseInset;
  const tuckBr = narrowRight - tuckBaseInset;
  const tuckTl = tuckBl + tuckTaper;
  const tuckTr = tuckBr - tuckTaper;

  const elements: Element[] = [];

  // === CUT OUTLINE — one continuous path ===

  // --- TUCK ---
  elements.push(...pathFromPoints([
    [tuckTl, 0],
    [tuckTr, 0],
    [tuckBr, yTop],
    [narrowRight, yTop],
    [wideRight, yTop],
  ], "cut"));

  // --- RIGHT SIDE (going down) ---
  elements.push(...pathFromPoints([
    [wideRight, yTop],
    [wideRight + T, topFt],
    [topFlapRight, topFt],
    [topFlapRight, topFb],
    [wideRight + T, topFb],
    [wideRight, yFront],
    [narrowRight, yFront],
    [narrowRight + T, frontFt],
    [frontFlapRight, frontFt],
    [frontFlapRight, frontFb],
    [narrowRight + T, frontFb],
    [narrowRight, yBottom],
    [wideRight, yBottom],
    [wideRight + T, bottomFt],
    [bottomFlapRight, bottomFt],
    [bottomFlapRight, bottomFb],
    [wideRight + T, bottomFb],
    [wideRight, yBack],
    [narrowRight, yBack],
    [narrowRight + T, backFt],
    [backFlapRight, backFt],
    [backFlapRight, backFb],
    [narrowRight + T, backFb],
    [narrowRight, yEnd],
  ], "cut"));

  // --- BOTTOM EDGE ---
  elements.push(hline(narrowRight, narrowLeft, yEnd, "cut"));

  // --- LEFT SIDE (going up) ---
  elements.push(...pathFromPoints([
    [narrowLeft, yEnd],
    [narrowLeft - T, backFb],
    [backFlapLeft, backFb],
    [backFlapLeft, backFt],
    [narrowLeft - T, backFt],
    [narrowLeft, yBack],
    [wideLeft, yBack],
    [wideLeft - T, bottomFb],
    [bottomFlapLeft, bottomFb],
    [bottomFlapLeft, bottomFt],
    [wideLeft - T, bottomFt],
    [wideLeft, yBottom],
    [narrowLeft, yBottom],
    [narrowLeft - T, frontFb],
    [frontFlapLeft, frontFb],
    [frontFlapLeft, frontFt],
    [narrowLeft - T, frontFt],
    [narrowLeft, yFront],
    [wideLeft, yFront],
    [wideLeft - T, topFb],
    [topFlapLeft, topFb],
    [topFlapLeft, topFt],
    [wideLeft - T, topFt],
    [wideLeft, yTop],
  ], "cut"));

  // --- Close back to tuck ---
  elements.push(...pathFromPoints([
    [wideLeft, yTop],
    [narrowLeft, yTop],
    [tuckBl, yTop],
    [tuckTl, 0],
  ], "cut"));

  // === SCORE LINES ===
  elements.push(hline(wideLeft, wideRight, yTop, "score"));
  elements.push(hline(wideLeft, wideRight, yFront, "score"));
  elements.push(hline(narrowLeft, narrowRight, yBottom, "score"));
  elements.push(hline(wideLeft, wideRight, yBack, "score"));

  const scoreRanges: [number, number, number, number][] = [
    [wideLeft, wideRight, yTop, yFront],
    [narrowLeft, narrowRight, yFront, yBottom],
    [wideLeft, wideRight, yBottom, yBack],
    [narrowLeft, narrowRight, yBack, yEnd],
  ];
  for (const [bl, br, yt, yb] of scoreRanges) {
    elements.push(vline(bl, yt, yb, "score"));
    elements.push(vline(br, yt, yb, "score"));
  }

  // Kerf compensation
  const k = kerf / 2;
  if (k > 0) {
    for (const el of elements) {
      el.x1 += k;
      el.y1 += k;
      el.x2 += k;
      el.y2 += k;
    }
    totalW += kerf;
    totalH += kerf;
  }

  return { width: totalW, height: totalH, elements };
}
