import type { BoxRequest, Dieline, Element } from "../models";
import { effectiveThickness, effectiveKerf, resolveEmbellishments } from "../models";
import { hline, vline, pathFromPoints, roundedPath, applyKerf } from "./helpers";
import {
  MAILER_TUCK_DEPTH_RATIO,
  MAILER_TUCK_TAPER_RATIO,
  MAILER_FLAP_WIDTH_RATIO,
  MAILER_LID_THICKNESS_RATIO,
  MAILER_BEVEL_INSET_MULTIPLIER,
} from "./proportions";

/**
 * Emit one side flap as a continuous path using roundedPath:
 *   score line → bevel → flap top → outer edge → flap bot → bevel → score line
 *
 * Uses roundedPath so adjacent corners (bevel + flap) correctly share edges
 * and radii are clamped to prevent overlap.
 */
function sideFlap(
  bodyTop: number, bodyBot: number,
  bevelTop: number, bevelBot: number,
  flapOuter: number,
  ft: number, fb: number,
  yScoreTop: number, yScoreBot: number,
  flapR: number, bevelR: number,
  kind: "cut" | "score",
): Element[] {
  return roundedPath(
    [
      [bodyTop, yScoreTop],    // 0: start at score line
      [bevelTop, ft],          // 1: bevel corner (in)
      [flapOuter, ft],         // 2: flap top-outer corner
      [flapOuter, fb],         // 3: flap bot-outer corner
      [bevelBot, fb],          // 4: bevel corner (out)
      [bodyBot, yScoreBot],    // 5: end at score line
    ],
    [bevelR, flapR, flapR, bevelR],
    kind,
  );
}

export function generateMailerDieline(request: BoxRequest): Dieline {
  const L = request.length;
  const W = request.width;
  const H = request.height;
  const T = effectiveThickness(request);
  const kerf = effectiveKerf(request);
  const emb = resolveEmbellishments(request);

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
  const topFlapRight = wideRight + widthFlapW;
  const frontFlapRight = narrowRight + heightFlapW;
  const bottomFlapRight = wideRight + widthFlapW;
  const backFlapRight = narrowRight + heightFlapW;
  const topFlapLeft = wideLeft - widthFlapW;
  const frontFlapLeft = narrowLeft - heightFlapW;
  const bottomFlapLeft = wideLeft - widthFlapW;
  const backFlapLeft = narrowLeft - heightFlapW;

  // Tuck flap geometry
  const tuckBaseInset = T;
  const tuckTaper = H * MAILER_TUCK_TAPER_RATIO;
  const tuckBl = narrowLeft + tuckBaseInset;
  const tuckBr = narrowRight - tuckBaseInset;
  const tuckTl = tuckBl + tuckTaper;
  const tuckTr = tuckBr - tuckTaper;

  // Embellishment radii
  const flapR = emb.flapCornerRadius;
  const bevelR = emb.bevelRadius;
  const tuckR = emb.tuckCornerRadius;

  const elements: Element[] = [];

  // === CUT OUTLINE ===

  // --- TUCK (rounded at tip corners, sharp at base) ---
  elements.push(...roundedPath([
    [tuckTl, 0],
    [tuckTr, 0],
    [tuckBr, yTop],
    [narrowRight, yTop],
    [wideRight, yTop],
  ], [tuckR, 0, 0], "cut"));

  // --- RIGHT SIDE (going down) ---
  // Top panel flap
  elements.push(...sideFlap(
    wideRight, wideRight,
    wideRight + bevel, wideRight + bevel,
    topFlapRight, topFt, topFb, yTop, yFront,
    flapR, bevelR, "cut",
  ));

  // Transition: wide → narrow
  elements.push(...pathFromPoints([
    [wideRight, yFront], [narrowRight, yFront],
  ], "cut"));

  // Front panel flap
  elements.push(...sideFlap(
    narrowRight, narrowRight,
    narrowRight + bevel, narrowRight + bevel,
    frontFlapRight, frontFt, frontFb, yFront, yBottom,
    flapR, bevelR, "cut",
  ));

  // Transition: narrow → wide
  elements.push(...pathFromPoints([
    [narrowRight, yBottom], [wideRight, yBottom],
  ], "cut"));

  // Bottom panel flap
  elements.push(...sideFlap(
    wideRight, wideRight,
    wideRight + bevel, wideRight + bevel,
    bottomFlapRight, bottomFt, bottomFb, yBottom, yBack,
    flapR, bevelR, "cut",
  ));

  // Transition: wide → narrow
  elements.push(...pathFromPoints([
    [wideRight, yBack], [narrowRight, yBack],
  ], "cut"));

  // Back panel flap
  elements.push(...sideFlap(
    narrowRight, narrowRight,
    narrowRight + bevel, narrowRight + bevel,
    backFlapRight, backFt, backFb, yBack, yEnd,
    flapR, bevelR, "cut",
  ));

  // --- BOTTOM EDGE ---
  elements.push(hline(narrowRight, narrowLeft, yEnd, "cut"));

  // --- LEFT SIDE (going up, mirrored) ---
  // Back panel flap (left)
  elements.push(...sideFlap(
    narrowLeft, narrowLeft,
    narrowLeft - bevel, narrowLeft - bevel,
    backFlapLeft, backFb, backFt, yEnd, yBack,
    flapR, bevelR, "cut",
  ));

  // Transition: narrow → wide
  elements.push(...pathFromPoints([
    [narrowLeft, yBack], [wideLeft, yBack],
  ], "cut"));

  // Bottom panel flap (left)
  elements.push(...sideFlap(
    wideLeft, wideLeft,
    wideLeft - bevel, wideLeft - bevel,
    bottomFlapLeft, bottomFb, bottomFt, yBack, yBottom,
    flapR, bevelR, "cut",
  ));

  // Transition: wide → narrow
  elements.push(...pathFromPoints([
    [wideLeft, yBottom], [narrowLeft, yBottom],
  ], "cut"));

  // Front panel flap (left)
  elements.push(...sideFlap(
    narrowLeft, narrowLeft,
    narrowLeft - bevel, narrowLeft - bevel,
    frontFlapLeft, frontFb, frontFt, yBottom, yFront,
    flapR, bevelR, "cut",
  ));

  // Transition: narrow → wide
  elements.push(...pathFromPoints([
    [narrowLeft, yFront], [wideLeft, yFront],
  ], "cut"));

  // Top panel flap (left)
  elements.push(...sideFlap(
    wideLeft, wideLeft,
    wideLeft - bevel, wideLeft - bevel,
    topFlapLeft, topFb, topFt, yFront, yTop,
    flapR, bevelR, "cut",
  ));

  // --- Close back to tuck ---
  elements.push(...roundedPath([
    [wideLeft, yTop],
    [narrowLeft, yTop],
    [tuckBl, yTop],
    [tuckTl, 0],
  ], [0, 0], "cut"));

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
