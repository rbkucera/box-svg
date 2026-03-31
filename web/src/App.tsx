import { useBoxRequest } from "./hooks/useBoxRequest";
import { ParameterForm } from "./components/ParameterForm";
import { SvgPreview } from "./components/SvgPreview";
import { DownloadButton } from "./components/DownloadButton";
import { IsometricBox } from "./components/IsometricBox";
import logoUrl from "./assets/rycera3d.svg";
import "./App.css";

function App() {
  const {
    form, setField, setStyle, setUnits, swapToSmallest, lidLocked,
    errors, warnings, dieline,
    thicknessPlaceholder, defaultFilename,
  } = useBoxRequest();

  const L = parseFloat(form.length) || 0;
  const W = parseFloat(form.width) || 0;
  const H = parseFloat(form.height) || 0;
  const filename = form.filename || defaultFilename;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-panel">
          <header className="window-titlebar">
            <span>BOXSVG CONFIG</span>
            <span className="titlebar-dots" aria-hidden="true">_ □ ×</span>
          </header>

          <div className="brand">
            <img src={logoUrl} alt="" aria-hidden="true" className="brand-logo" />
            <div className="brand-copy">
              <span className="brand-name">boxsvg</span>
              <span className="brand-subtitle">RYCERA3D dieline workstation</span>
            </div>
          </div>

          <div className="sidebar-body">
            <ParameterForm
              form={form}
              setField={setField}
              setStyle={setStyle}
              setUnits={setUnits}
              swapToSmallest={swapToSmallest}
              lidLocked={lidLocked}
              errors={errors}
              warnings={warnings}
              thicknessPlaceholder={thicknessPlaceholder}
              defaultFilename={defaultFilename}
            />

            <div className="isometric-panel">
              <div className="mini-panel-title">BOX MODEL</div>
              <div className="isometric-preview">
                <IsometricBox length={L} width={W} height={H} lid={form.lid} size={132} />
              </div>
            </div>

            <DownloadButton dieline={dieline} units={form.units} filename={filename} />

            <footer className="sidebar-footer">
              Parametric box dieline generator
            </footer>
          </div>
        </div>
      </aside>
      <main className="preview">
        <section className="preview-window">
          <header className="window-titlebar preview-titlebar">
            <span>LASER-CUT PREVIEW</span>
            <div className="preview-legend" aria-label="Preview legend">
              <span className="legend-item">
                <span className="legend-swatch legend-swatch-cut" />
                CUT
              </span>
              <span className="legend-item">
                <span className="legend-swatch legend-swatch-score" />
                SCORE
              </span>
            </div>
          </header>
          <div className="preview-stage">
            <div className="preview-frame">
              <SvgPreview dieline={dieline} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
