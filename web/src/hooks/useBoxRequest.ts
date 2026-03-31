import { useState, useMemo, useEffect, useCallback } from "react";
import type { BoxRequest, BoxStyle, Dieline, Units, Material, LidFit, EmbellishmentConfig } from "../core/models";
import { DEFAULT_THICKNESS, DEFAULT_EMBELLISHMENTS, getStyleDefinition } from "../core/models";
import { toInches, fromInches, MM_PER_INCH } from "../core/units";
import { validateRequest, warnUnusual } from "../core/validation";
import { generateDieline } from "../core/generators";

export interface FormState {
  style: BoxStyle;
  length: string;
  width: string;
  height: string;
  units: Units;
  material: Material;
  lid: LidFit;
  thickness: string;
  kerf: string;
  filename: string;
}

const INITIAL_STATE: FormState = {
  style: "mailer",
  length: "4",
  width: "4",
  height: "2",
  units: "in",
  material: "corrugated",
  lid: "over",
  thickness: "",
  kerf: "",
  filename: "",
};

function convertDimension(value: string, toUnits: Units): string {
  const n = parseFloat(value);
  if (!value || isNaN(n)) return value;
  if (toUnits === "mm") return Math.round(n * MM_PER_INCH).toString();
  return (Math.round((n / MM_PER_INCH) * 10) / 10).toString();
}

function convertFine(value: string, toUnits: Units): string {
  const n = parseFloat(value);
  if (!value || isNaN(n)) return value;
  if (toUnits === "mm") return (Math.round(n * MM_PER_INCH * 10) / 10).toString();
  return (Math.round((n / MM_PER_INCH) * 100) / 100).toString();
}

export function useBoxRequest() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setStyle = (newStyle: BoxStyle) => {
    const styleDef = getStyleDefinition(newStyle);
    const defaultLid = styleDef?.defaultLid ?? "over";
    setForm((prev) => ({ ...prev, style: newStyle, lid: defaultLid }));
  };

  const setUnits = (newUnits: Units) => {
    if (newUnits === form.units) return;
    setForm((prev) => ({
      ...prev,
      units: newUnits,
      length: convertDimension(prev.length, newUnits),
      width: convertDimension(prev.width, newUnits),
      height: convertDimension(prev.height, newUnits),
      thickness: convertFine(prev.thickness, newUnits),
      kerf: convertFine(prev.kerf, newUnits),
    }));
  };

  const swapToSmallest = () => {
    const vals = [
      { key: "length" as const, n: parseFloat(form.length) || 0 },
      { key: "width" as const, n: parseFloat(form.width) || 0 },
      { key: "height" as const, n: parseFloat(form.height) || 0 },
    ];
    vals.sort((a, b) => b.n - a.n);
    setForm((prev) => ({
      ...prev,
      length: prev[vals[0].key],
      width: prev[vals[1].key],
      height: prev[vals[2].key],
    }));
  };

  const [embellishments, setEmbellishments] = useState<Partial<EmbellishmentConfig>>({});

  // Expose on window for console testing:
  //   window.setEmbellishments({ flapCornerRadius: 0.125, bevelRadius: 0.1 })
  //   window.getEmbellishments()
  const stableSetEmb = useCallback((overrides: Partial<EmbellishmentConfig>) => {
    setEmbellishments((prev) => ({ ...prev, ...overrides }));
  }, []);

  useEffect(() => {
    (window as unknown as Record<string, unknown>).setEmbellishments = stableSetEmb;
    (window as unknown as Record<string, unknown>).resetEmbellishments = () => setEmbellishments({});
    (window as unknown as Record<string, unknown>).getEmbellishments = () => ({ ...DEFAULT_EMBELLISHMENTS, ...embellishments });
  }, [stableSetEmb, embellishments]);

  const styleDef = getStyleDefinition(form.style);
  const lidLocked = styleDef?.defaultLid === "inside";

  const parsed = useMemo((): BoxRequest | null => {
    const length = parseFloat(form.length);
    const width = parseFloat(form.width);
    const height = parseFloat(form.height);

    if (isNaN(length) || isNaN(width) || isNaN(height)) return null;

    const req: BoxRequest = {
      style: form.style,
      length: toInches(length, form.units),
      width: toInches(width, form.units),
      height: toInches(height, form.units),
      units: form.units,
      material: form.material,
      lid: form.lid,
      embellishments: Object.keys(embellishments).length > 0 ? embellishments : undefined,
    };

    if (form.thickness) {
      const t = parseFloat(form.thickness);
      if (!isNaN(t)) req.thickness = toInches(t, form.units);
    }
    if (form.kerf) {
      const k = parseFloat(form.kerf);
      if (!isNaN(k)) req.kerf = toInches(k, form.units);
    }

    return req;
  }, [form, embellishments]);

  const errors = useMemo(() => {
    if (!parsed) return ["Enter valid numeric dimensions"];
    return validateRequest(parsed);
  }, [parsed]);

  const warnings = useMemo(() => {
    if (!parsed || errors.length > 0) return [];
    return warnUnusual(parsed);
  }, [parsed, errors]);

  const dieline = useMemo((): Dieline | null => {
    if (!parsed || errors.length > 0) return null;
    return generateDieline(parsed);
  }, [parsed, errors]);

  // Show default thickness in display units
  const defaultT = DEFAULT_THICKNESS[form.material];
  const displayT = form.units === "mm"
    ? `${(Math.round(fromInches(defaultT, "mm") * 10) / 10)} mm`
    : `${defaultT} in`;
  const thicknessPlaceholder = `${displayT} (${form.material} default)`;

  const defaultFilename = `box-${form.style}-${form.length}-${form.width}-${form.height}.svg`;

  return {
    form,
    setField,
    setStyle,
    setUnits,
    swapToSmallest,
    lidLocked,
    errors,
    warnings,
    dieline,
    thicknessPlaceholder,
    defaultFilename,
  };
}
