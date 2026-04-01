import type { BoxRequest, Dieline, Element } from "../models";
import { effectiveThickness, effectiveKerf, resolveEmbellishments } from "../models";
import { hline, vline, roundedPath, applyKerf } from "./helpers";
import {
  TUCKTOP_DUST_DEPTH_RATIO,
  TUCKTOP_TUCK_DEPTH_RATIO,
  TUCKTOP_CLOSURE_DEPTH_RATIO,
  TUCKTOP_GLUE_BEVEL_HEIGHT_RATIO,
  TUCKTOP_GLUE_BEVEL_WIDTH_RATIO,
  TUCKTOP_TUCK_INSET_LENGTH_RATIO,
  TUCKTOP_TUCK_INSET_DEPTH_RATIO,
  TUCKTOP_GLUE_TAB_MIN_RATIO,
  TUCKTOP_GLUE_TAB_MAX_RATIO,
  TUCKTOP_GLUE_TAB_THICKNESS_MULTIPLIER,
  TUCKTOP_DUST_TAPER_MIN_RATIO,
  TUCKTOP_DUST_TAPER_MAX_RATIO,
  TUCKTOP_DUST_TAPER_THICKNESS_MULTIPLIER,
} from "./proportions";

function glueTabWidth(width: number, thickness: number): number {
  return Math.min(
    width * TUCKTOP_GLUE_TAB_MAX_RATIO,
    Math.max(width * TUCKTOP_GLUE_TAB_MIN_RATIO, thickness * TUCKTOP_GLUE_TAB_THICKNESS_MULTIPLIER),
  );
}

function dustFlapTaper(width: number, thickness: number): number {
  return Math.min(
    width * TUCKTOP_DUST_TAPER_MAX_RATIO,
    Math.max(width * TUCKTOP_DUST_TAPER_MIN_RATIO, thickness * TUCKTOP_DUST_TAPER_THICKNESS_MULTIPLIER),
  );
}

export function generateTuckTopDieline(request: BoxRequest): Dieline {
  const length = request.length;
  const width = request.width;
  const height = request.height;
  const thickness = effectiveThickness(request);
  const kerf = effectiveKerf(request);
  const emb = resolveEmbellishments(request);

  const glueW = glueTabWidth(width, thickness);
  const dustDepth = width * TUCKTOP_DUST_DEPTH_RATIO;
  const tuckDepth = width * TUCKTOP_TUCK_DEPTH_RATIO;
  const closureDepth = width * TUCKTOP_CLOSURE_DEPTH_RATIO;
  const glueBevel = Math.min(height * TUCKTOP_GLUE_BEVEL_HEIGHT_RATIO, glueW * TUCKTOP_GLUE_BEVEL_WIDTH_RATIO);
  const tuckInset = Math.min(length * TUCKTOP_TUCK_INSET_LENGTH_RATIO, tuckDepth * TUCKTOP_TUCK_INSET_DEPTH_RATIO);
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

  const glueR = emb.glueTabCornerRadius;
  const tuckR = emb.tuckCornerRadius;
  const dustR = emb.dustFlapCornerRadius;

  // Glue tab with beveled ends (optionally rounded)
  elements.push(...roundedPath(
    [[x1, y2], [x1, y2 + thickness], [x0, y2 + glueBevel], [x0, y3 - glueBevel], [x1, y3 - thickness], [x1, y3]],
    [0, glueR, glueR, 0],
    "cut",
  ));

  // Body outer edge on the back panel side
  elements.push(vline(x5, y2, y3, "cut"));

  // Top tuck flap + top closure panel on the rear panel
  elements.push(...roundedPath(
    [[x1, y2], [x1, y1], [x1 + thickness, y1], [x1 + tuckInset, y0], [x2 - tuckInset, y0], [x2 - thickness, y1], [x2, y1], [x2, y2]],
    [0, 0, tuckR, tuckR, 0, 0],
    "cut",
  ));

  // Top dust flap on first side panel
  elements.push(...roundedPath(
    [[x2, y2], [x2 + thickness, y2], [x2 + dustTaper, y2 - dustDepth], [x3 - dustTaper, y2 - dustDepth], [x3 - thickness, y2], [x3, y2]],
    [0, dustR, dustR, 0],
    "cut",
  ));

  // Front panel top edge (open cut)
  elements.push(hline(x3, x4, y2, "cut"));

  // Top dust flap on second side panel
  elements.push(...roundedPath(
    [[x4, y2], [x4 + thickness, y2], [x4 + dustTaper, y2 - dustDepth], [x5 - dustTaper, y2 - dustDepth], [x5 - thickness, y2], [x5, y2]],
    [0, dustR, dustR, 0],
    "cut",
  ));

  // Rear panel bottom edge (open cut)
  elements.push(hline(x1, x2, y3, "cut"));

  // Bottom dust flap on first side panel
  elements.push(...roundedPath(
    [[x2, y3], [x2 + thickness, y3], [x2 + dustTaper, y3 + dustDepth], [x3 - dustTaper, y3 + dustDepth], [x3 - thickness, y3], [x3, y3]],
    [0, dustR, dustR, 0],
    "cut",
  ));

  // Bottom tuck flap + bottom closure panel on the front panel
  elements.push(...roundedPath(
    [[x3, y3], [x3, y4], [x3 + thickness, y4], [x3 + tuckInset, y5], [x4 - tuckInset, y5], [x4 - thickness, y4], [x4, y4], [x4, y3]],
    [0, 0, tuckR, tuckR, 0, 0],
    "cut",
  ));

  // Bottom dust flap on second side panel
  elements.push(...roundedPath(
    [[x4, y3], [x4 + thickness, y3], [x4 + dustTaper, y3 + dustDepth], [x5 - dustTaper, y3 + dustDepth], [x5 - thickness, y3], [x5, y3]],
    [0, dustR, dustR, 0],
    "cut",
  ));

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
  applyKerf(elements, kerf);
  if (kerf > 0) {
    x5 += kerf;
    y5 += kerf;
  }

  return { width: x5, height: y5, elements };
}
