import { useState, useMemo } from "react";
import type { BoxRequest, BoxStyle, Dieline, Units, Material, LidFit } from "../core/models";
import { DEFAULT_THICKNESS, getStyleDefinition } from "../core/models";
import { toInches, MM_PER_INCH } from "../core/units";
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
  length: "6",
  width: "3",
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
  }, [form]);

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

  const thicknessPlaceholder = `${DEFAULT_THICKNESS[form.material]} ${form.units === "mm" ? "mm" : "in"} (${form.material} default)`;
  const defaultFilename = `box-${form.length}-${form.width}-${form.height}.svg`;

  return {
    form,
    setField,
    setStyle,
    setUnits,
    swapToSmallest,
    errors,
    warnings,
    dieline,
    thicknessPlaceholder,
    defaultFilename,
  };
}
