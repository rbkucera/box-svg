import type { Dieline, Element } from "../core/models";
import { fromInches } from "../core/units";

const PPI = 96;
const CUT_COLOR = "#00FF00";
const SCORE_COLOR = "#FF0000";
const STROKE_WIDTH = 1.0;

function renderElement(el: Element): string {
  if (el.type === "arc") {
    const rPx = el.r * PPI;
    return (
      `    <path d="M ${(el.x1 * PPI).toFixed(4)},${(el.y1 * PPI).toFixed(4)}` +
      ` A ${rPx.toFixed(4)},${rPx.toFixed(4)} 0 0,${el.sweep} ${(el.x2 * PPI).toFixed(4)},${(el.y2 * PPI).toFixed(4)}"/>`
    );
  }
  return (
    `    <line x1="${(el.x1 * PPI).toFixed(4)}" y1="${(el.y1 * PPI).toFixed(4)}"` +
    ` x2="${(el.x2 * PPI).toFixed(4)}" y2="${(el.y2 * PPI).toFixed(4)}"/>`
  );
}

export function renderSvgString(dieline: Dieline, units: string): string {
  const svgW = dieline.width * PPI;
  const svgH = dieline.height * PPI;
  const displayW = fromInches(dieline.width, units);
  const displayH = fromInches(dieline.height, units);

  const parts: string[] = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg"` +
    ` width="${displayW.toFixed(4)}${units}"` +
    ` height="${displayH.toFixed(4)}${units}"` +
    ` viewBox="0 0 ${svgW.toFixed(4)} ${svgH.toFixed(4)}">`
  );

  parts.push(`  <g id="cut" stroke="${CUT_COLOR}" stroke-width="${STROKE_WIDTH}" fill="none">`);
  for (const el of dieline.elements) {
    if (el.kind === "cut") parts.push(renderElement(el));
  }
  parts.push("  </g>");

  parts.push(
    `  <g id="score" stroke="${SCORE_COLOR}" stroke-width="${STROKE_WIDTH}"` +
    ` stroke-dasharray="4 2" fill="none">`
  );
  for (const el of dieline.elements) {
    if (el.kind === "score") parts.push(renderElement(el));
  }
  parts.push("  </g>");

  parts.push("</svg>");
  return parts.join("\n") + "\n";
}
