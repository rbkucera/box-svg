import { useState, useMemo } from "react";
import type { BoxRequest, Dieline, Units, Material, LidFit } from "../core/models";
import { DEFAULT_THICKNESS } from "../core/models";
import { toInches } from "../core/units";
import { validateRequest, warnUnusual } from "../core/validation";
import { generateDieline } from "../core/generators";

export interface FormState {
  style: string;
  length: string;
  width: string;
  height: string;
  units: Units;
  material: Material;
  lid: LidFit;
  thickness: string;
  kerf: string;
}

const INITIAL_STATE: FormState = {
  style: "mailer",
  length: "6",
  width: "3",
  height: "4",
  units: "in",
  material: "corrugated",
  lid: "over",
  thickness: "",
  kerf: "",
};

export function useBoxRequest() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const parsed = useMemo((): BoxRequest | null => {
    const length = parseFloat(form.length);
    const width = parseFloat(form.width);
    const height = parseFloat(form.height);

    if (isNaN(length) || isNaN(width) || isNaN(height)) return null;

    const req: BoxRequest = {
      style: "mailer",
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

  return {
    form,
    setField,
    errors,
    warnings,
    dieline,
    thicknessPlaceholder,
  };
}
