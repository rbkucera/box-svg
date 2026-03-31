import type { BoxRequest, Dieline, Element } from "../models";
import { effectiveThickness, effectiveKerf } from "../models";
import { hline, vline, pathFromPoints, applyKerf } from "./helpers";
import {
  MAILER_TUCK_DEPTH_RATIO,
  MAILER_TUCK_TAPER_RATIO,
  MAILER_FLAP_WIDTH_RATIO,
  MAILER_LID_THICKNESS_RATIO,
  MAILER_BEVEL_INSET_MULTIPLIER,
} from "./proportions";

export function generateMailerDieline(request: BoxRequest): Dieline {
  const L = request.length;
  const W = request.width;
  const H = request.height;
  const T = effectiveThickness(request);
  const kerf = effectiveKerf(request);

  // Panel heights
  const tuckH = H * MAILER_TUCK_DEPTH_RATIO;
  const lidAdj = T * MAILER_LID_THICKNESS_RATIO;
  const topPanelH = request.lid === "inside" ? W - lidAdj : W + lidAdj;
  const frontPanelH = H;
  const bottomPanelH = W;
  const backPanelH = H;

  // Panel body widths
  const narrowBody = L;
  const wideBody = L + T;

  // Side flap widths
  const heightFlapW = W * MAILER_FLAP_WIDTH_RATIO;
  const widthFlapW = H * MAILER_FLAP_WIDTH_RATIO;

  // Bevel inset
  const bevel = T * MAILER_BEVEL_INSET_MULTIPLIER;

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
  const tuckTaper = H * MAILER_TUCK_TAPER_RATIO;
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
    [wideRight + bevel, topFt],
    [topFlapRight, topFt],
    [topFlapRight, topFb],
    [wideRight + bevel, topFb],
    [wideRight, yFront],
    [narrowRight, yFront],
    [narrowRight + bevel, frontFt],
    [frontFlapRight, frontFt],
    [frontFlapRight, frontFb],
    [narrowRight + bevel, frontFb],
    [narrowRight, yBottom],
    [wideRight, yBottom],
    [wideRight + bevel, bottomFt],
    [bottomFlapRight, bottomFt],
    [bottomFlapRight, bottomFb],
    [wideRight + bevel, bottomFb],
    [wideRight, yBack],
    [narrowRight, yBack],
    [narrowRight + bevel, backFt],
    [backFlapRight, backFt],
    [backFlapRight, backFb],
    [narrowRight + bevel, backFb],
    [narrowRight, yEnd],
  ], "cut"));

  // --- BOTTOM EDGE ---
  elements.push(hline(narrowRight, narrowLeft, yEnd, "cut"));

  // --- LEFT SIDE (going up) ---
  elements.push(...pathFromPoints([
    [narrowLeft, yEnd],
    [narrowLeft - bevel, backFb],
    [backFlapLeft, backFb],
    [backFlapLeft, backFt],
    [narrowLeft - bevel, backFt],
    [narrowLeft, yBack],
    [wideLeft, yBack],
    [wideLeft - bevel, bottomFb],
    [bottomFlapLeft, bottomFb],
    [bottomFlapLeft, bottomFt],
    [wideLeft - bevel, bottomFt],
    [wideLeft, yBottom],
    [narrowLeft, yBottom],
    [narrowLeft - bevel, frontFb],
    [frontFlapLeft, frontFb],
    [frontFlapLeft, frontFt],
    [narrowLeft - bevel, frontFt],
    [narrowLeft, yFront],
    [wideLeft, yFront],
    [wideLeft - bevel, topFb],
    [topFlapLeft, topFb],
    [topFlapLeft, topFt],
    [wideLeft - bevel, topFt],
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
  applyKerf(elements, kerf);
  if (kerf > 0) {
    totalW += kerf;
    totalH += kerf;
  }

  return { width: totalW, height: totalH, elements };
}
