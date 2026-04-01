import { useState } from "react";
import type { FormState } from "../hooks/useBoxRequest";
import type { BoxStyle, Units, Material, LidFit, EmbellishmentConfig } from "../core/models";
import { SUPPORTED_MATERIALS, SUPPORTED_LID_FITS, STYLE_DEFINITIONS, DEFAULT_EMBELLISHMENTS } from "../core/models";

interface Props {
  form: FormState;
  setField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  setStyle: (style: BoxStyle) => void;
  setUnits: (units: Units) => void;
  swapToSmallest: () => void;
  lidLocked: boolean;
  errors: string[];
  warnings: string[];
  thicknessPlaceholder: string;
  defaultFilename: string;
  embellishments: Partial<EmbellishmentConfig>;
  setEmbellishments: React.Dispatch<React.SetStateAction<Partial<EmbellishmentConfig>>>;
}

const HEIGHT_ERROR = "Height should be the smallest dimension";

export function ParameterForm({
  form, setField, setStyle, setUnits, swapToSmallest, lidLocked,
  errors, warnings, thicknessPlaceholder, defaultFilename,
  embellishments, setEmbellishments,
}: Props) {
  const hasHeightError = errors.includes(HEIGHT_ERROR);
  const otherErrors = errors.filter((e) => e !== HEIGHT_ERROR);

  const merged = { ...DEFAULT_EMBELLISHMENTS, ...embellishments };
  const [jsonText, setJsonText] = useState(() => JSON.stringify(merged, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        setJsonError("Must be a JSON object");
        return;
      }
      const validKeys = Object.keys(DEFAULT_EMBELLISHMENTS);
      const badKeys = Object.keys(parsed).filter((k) => !validKeys.includes(k));
      if (badKeys.length > 0) {
        setJsonError(`Unknown keys: ${badKeys.join(", ")}`);
        return;
      }
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v !== "number") {
          setJsonError(`"${k}" must be a number`);
          return;
        }
      }
      setJsonError(null);
      // Only send non-default values
      const partial: Partial<EmbellishmentConfig> = {};
      for (const [k, v] of Object.entries(parsed)) {
        const key = k as keyof EmbellishmentConfig;
        if (v !== DEFAULT_EMBELLISHMENTS[key]) {
          partial[key] = v as number;
        }
      }
      setEmbellishments(partial);  // full replacement, not merge
    } catch {
      setJsonError("Invalid JSON");
    }
  };

  return (
    <div className="parameter-form">
      <fieldset className="fieldset-grid fieldset-style">
        <legend>Style</legend>
        <label className="field-span-2">
          Box style
          <select value={form.style} onChange={(e) => setStyle(e.target.value as BoxStyle)}>
            {STYLE_DEFINITIONS.map((s) => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>
        </label>
      </fieldset>

      <fieldset className="fieldset-grid fieldset-dimensions">
        <legend>Dimensions</legend>

        <label className="field-span-3">
          Units
          <select value={form.units} onChange={(e) => setUnits(e.target.value as Units)}>
            <option value="in">Inches</option>
            <option value="mm">Millimeters</option>
          </select>
        </label>

        <label>
          Length
          <input
            type="number"
            value={form.length}
            onChange={(e) => setField("length", e.target.value)}
            min="0"
            step="any"
          />
        </label>

        <label>
          Width
          <input
            type="number"
            value={form.width}
            onChange={(e) => setField("width", e.target.value)}
            min="0"
            step="any"
          />
        </label>

        <label>
          Height
          <input
            type="number"
            value={form.height}
            onChange={(e) => setField("height", e.target.value)}
            min="0"
            step="any"
            className={hasHeightError ? "input-error" : ""}
          />
          {hasHeightError && (
            <span className="height-fix">
              Height should be the smallest dimension —{" "}
              <button type="button" className="link-button" onClick={swapToSmallest}>
                click to correct
              </button>
            </span>
          )}
        </label>
      </fieldset>

      <fieldset className="fieldset-grid fieldset-material">
        <legend>Material</legend>

        <label className="field-span-2">
          Material
          <select
            value={form.material}
            onChange={(e) => setField("material", e.target.value as Material)}
          >
            {SUPPORTED_MATERIALS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>

        <label>
          Thickness (optional)
          <input
            type="number"
            value={form.thickness}
            onChange={(e) => setField("thickness", e.target.value)}
            placeholder={thicknessPlaceholder}
            min="0"
            step="any"
          />
        </label>

        <label className="field-span-2">
          Filename
          <input
            type="text"
            value={form.filename}
            onChange={(e) => setField("filename", e.target.value)}
            placeholder={defaultFilename}
          />
        </label>
      </fieldset>

      <details className="fieldset-advanced">
        <summary>Advanced</summary>
        <div className="advanced-fields">
          <label>
            Lid fit
            <select
              value={form.lid}
              onChange={(e) => setField("lid", e.target.value as LidFit)}
              disabled={lidLocked}
            >
              {SUPPORTED_LID_FITS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>
          <label>
            Kerf
            <input
              type="number"
              value={form.kerf}
              onChange={(e) => setField("kerf", e.target.value)}
              placeholder="0"
              min="0"
              step="any"
            />
          </label>
        </div>
        <label>
          Embellishments
          <textarea
            className={jsonError ? "json-textarea json-error" : "json-textarea"}
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            rows={8}
            spellCheck={false}
          />
        </label>
        {jsonError && <p className="json-error-msg">{jsonError}</p>}
      </details>

      {otherErrors.length > 0 && (
        <div className="error-list">
          <p className="notice-label">Input issues</p>
          {otherErrors.map((e, i) => (
            <p key={i} className="error">{e}</p>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="warning-list">
          <p className="notice-label">Production notes</p>
          {warnings.map((w, i) => <p key={i} className="warning">{w}</p>)}
        </div>
      )}
    </div>
  );
}
