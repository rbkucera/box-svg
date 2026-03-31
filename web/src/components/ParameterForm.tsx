import type { FormState } from "../hooks/useBoxRequest";
import type { BoxStyle, Units, Material, LidFit } from "../core/models";
import { SUPPORTED_MATERIALS, SUPPORTED_LID_FITS, STYLE_DEFINITIONS } from "../core/models";

interface Props {
  form: FormState;
  setField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  setStyle: (style: BoxStyle) => void;
  setUnits: (units: Units) => void;
  swapToSmallest: () => void;
  errors: string[];
  warnings: string[];
  thicknessPlaceholder: string;
  defaultFilename: string;
}

const HEIGHT_ERROR = "Height should be the smallest dimension";

export function ParameterForm({
  form, setField, setStyle, setUnits, swapToSmallest,
  errors, warnings, thicknessPlaceholder, defaultFilename,
}: Props) {
  const hasHeightError = errors.includes(HEIGHT_ERROR);
  const otherErrors = errors.filter((e) => e !== HEIGHT_ERROR);

  return (
    <div className="parameter-form">
      <h2>Box Parameters</h2>

      <fieldset>
        <legend>Style</legend>
        <label>
          Box style
          <select value={form.style} onChange={(e) => setStyle(e.target.value as BoxStyle)}>
            {STYLE_DEFINITIONS.map((s) => (
              <option key={s.name} value={s.name}>{s.name} — {s.description}</option>
            ))}
          </select>
        </label>
      </fieldset>

      <fieldset>
        <legend>Dimensions</legend>

        <label>
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

      <fieldset>
        <legend>Material</legend>

        <label>
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

        <label>
          Kerf (optional)
          <input
            type="number"
            value={form.kerf}
            onChange={(e) => setField("kerf", e.target.value)}
            placeholder="0"
            min="0"
            step="any"
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>Options</legend>

        <label>
          Lid fit
          <select value={form.lid} onChange={(e) => setField("lid", e.target.value as LidFit)}>
            {SUPPORTED_LID_FITS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </label>

        <label>
          Filename
          <input
            type="text"
            value={form.filename}
            onChange={(e) => setField("filename", e.target.value)}
            placeholder={defaultFilename}
          />
        </label>
      </fieldset>

      {otherErrors.length > 0 && (
        <div className="error-list">
          {otherErrors.map((e, i) => (
            <p key={i} className="error">{e}</p>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="warning-list">
          {warnings.map((w, i) => <p key={i} className="warning">{w}</p>)}
        </div>
      )}
    </div>
  );
}
