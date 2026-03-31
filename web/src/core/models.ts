export type BoxStyle = "mailer" | "tuck-top";
export type Units = "in" | "mm";
export type Material = "corrugated" | "chipboard";
export type LidFit = "over" | "inside";

export const SUPPORTED_STYLES: BoxStyle[] = ["mailer", "tuck-top"];
export const SUPPORTED_UNITS: Units[] = ["in", "mm"];
export const SUPPORTED_MATERIALS: Material[] = ["corrugated", "chipboard"];
export const SUPPORTED_LID_FITS: LidFit[] = ["over", "inside"];

export const DEFAULT_THICKNESS: Record<Material, number> = {
  corrugated: 0.125,
  chipboard: 0.05,
};

export interface BoxStyleDefinition {
  name: BoxStyle;
  description: string;
  defaultLid: LidFit;
  validator?: (req: BoxRequest) => string[];
}

export const STYLE_DEFINITIONS: BoxStyleDefinition[] = [
  {
    name: "mailer",
    description: "Roll-end shipping box with glue tab",
    defaultLid: "over",
  },
  {
    name: "tuck-top",
    description: "Folding carton with tuck flap and glue tab",
    defaultLid: "inside",
    validator: (req) =>
      req.lid !== "inside" ? ["Tuck-top boxes require lid fit 'inside'"] : [],
  },
];

export function getStyleDefinition(name: string): BoxStyleDefinition | undefined {
  return STYLE_DEFINITIONS.find((s) => s.name === name);
}

// Embellishment configuration — all values in inches, 0 = sharp/straight
export interface EmbellishmentConfig {
  flapCornerRadius: number;      // outer flap corners
  bevelRadius: number;           // notch bevel transitions
  tuckCornerRadius: number;      // tuck flap tip corners
  dustFlapCornerRadius: number;  // dust flap taper corners (tuck-top)
  glueTabCornerRadius: number;   // glue tab end corners (tuck-top)
}

export const DEFAULT_EMBELLISHMENTS: EmbellishmentConfig = {
  flapCornerRadius: 0,
  bevelRadius: 0,
  tuckCornerRadius: 0,
  dustFlapCornerRadius: 0,
  glueTabCornerRadius: 0,
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
  embellishments?: Partial<EmbellishmentConfig>;
}

export function resolveEmbellishments(req: BoxRequest): EmbellishmentConfig {
  return { ...DEFAULT_EMBELLISHMENTS, ...req.embellishments };
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

export interface Arc {
  type: "arc";
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  r: number;
  sweep: 0 | 1;
  kind: "cut" | "score";
}

export type Element = Line | Arc;

export interface Dieline {
  width: number;
  height: number;
  elements: Element[];
}
