import type { BoxRequest } from "./models";
import {
  SUPPORTED_STYLES,
  SUPPORTED_UNITS,
  SUPPORTED_MATERIALS,
  SUPPORTED_LID_FITS,
  getStyleDefinition,
} from "./models";

export function validateRequest(req: BoxRequest): string[] {
  const errors: string[] = [];

  if (!SUPPORTED_STYLES.includes(req.style)) {
    errors.push(`Unsupported style: '${req.style}'. Supported: ${SUPPORTED_STYLES.join(", ")}`);
  }
  if (!SUPPORTED_UNITS.includes(req.units)) {
    errors.push(`Unsupported units: '${req.units}'. Supported: ${SUPPORTED_UNITS.join(", ")}`);
  }
  if (!SUPPORTED_MATERIALS.includes(req.material)) {
    errors.push(`Unsupported material: '${req.material}'. Supported: ${SUPPORTED_MATERIALS.join(", ")}`);
  }
  if (!SUPPORTED_LID_FITS.includes(req.lid)) {
    errors.push(`Unsupported lid fit: '${req.lid}'. Supported: ${SUPPORTED_LID_FITS.join(", ")}`);
  }

  for (const dim of ["length", "width", "height"] as const) {
    if (req[dim] <= 0) {
      errors.push(`${dim} must be greater than 0, got ${req[dim]}`);
    }
  }

  if (req.thickness !== undefined && req.thickness <= 0) {
    errors.push(`thickness must be greater than 0, got ${req.thickness}`);
  }
  if (req.kerf !== undefined && req.kerf < 0) {
    errors.push(`kerf must be non-negative, got ${req.kerf}`);
  }

  if (req.height > req.length || req.height > req.width) {
    errors.push("Height should be the smallest dimension");
  }

  // Style-specific validation
  const styleDef = getStyleDefinition(req.style);
  if (styleDef?.validator) {
    errors.push(...styleDef.validator(req));
  }

  return errors;
}

export function warnUnusual(req: BoxRequest): string[] {
  const warnings: string[] = [];
  const maxDim = Math.max(req.length, req.width, req.height);
  const minDim = Math.min(req.length, req.width, req.height);

  if (maxDim / minDim > 10) {
    warnings.push("Extreme aspect ratio detected — verify dimensions are correct.");
  }
  if (req.kerf !== undefined && req.kerf > 0.05) {
    warnings.push(`Kerf value ${req.kerf} seems high — typical values are under 0.05 inches.`);
  }

  return warnings;
}
