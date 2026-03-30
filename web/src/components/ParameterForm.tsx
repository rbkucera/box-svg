import type { FormState } from "../hooks/useBoxRequest";
import type { Units, Material, LidFit } from "../core/models";
import { SUPPORTED_MATERIALS, SUPPORTED_LID_FITS } from "../core/models";

interface Props {
  form: FormState;
  setField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  errors: string[];
  warnings: string[];
  thicknessPlaceholder: string;
}

export function ParameterForm({ form, setField, errors, warnings, thicknessPlaceholder }: Props) {
  return (
    <div className="parameter-form">
      <h2>Box Parameters</h2>

      <fieldset>
        <legend>Dimensions</legend>

        <label>
          Units
          <select value={form.units} onChange={(e) => setField("units", e.target.value as Units)}>
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
          />
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
      </fieldset>

      {errors.length > 0 && (
        <div className="error-list">
          {errors.map((e, i) => <p key={i} className="error">{e}</p>)}
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
