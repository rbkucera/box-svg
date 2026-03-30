export type BoxStyle = "mailer";
export type Units = "in" | "mm";
export type Material = "corrugated" | "chipboard";
export type LidFit = "over" | "inside";

export const SUPPORTED_STYLES: BoxStyle[] = ["mailer"];
export const SUPPORTED_UNITS: Units[] = ["in", "mm"];
export const SUPPORTED_MATERIALS: Material[] = ["corrugated", "chipboard"];
export const SUPPORTED_LID_FITS: LidFit[] = ["over", "inside"];

export const DEFAULT_THICKNESS: Record<Material, number> = {
  corrugated: 0.125,
  chipboard: 0.05,
};

export interface BoxRequest {
  style: BoxStyle;
  length: number;
  width: number;
  height: number;
  units: Units;
  material: Material;
  lid: LidFit;
  thickness?: number;
  kerf?: number;
}

export function effectiveThickness(req: BoxRequest): number {
  return req.thickness ?? DEFAULT_THICKNESS[req.material];
}

export function effectiveKerf(req: BoxRequest): number {
  return req.kerf ?? 0;
}

export interface Line {
  type: "line";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  kind: "cut" | "score";
}

export type Element = Line;

export interface Dieline {
  width: number;
  height: number;
  elements: Element[];
}
