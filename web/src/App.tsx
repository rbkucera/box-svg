import { useBoxRequest } from "./hooks/useBoxRequest";
import { ParameterForm } from "./components/ParameterForm";
import { SvgPreview } from "./components/SvgPreview";
import { DownloadButton } from "./components/DownloadButton";
import { IsometricBox } from "./components/IsometricBox";
import "./App.css";

function App() {
  const {
    form, setField, setUnits, swapToSmallest,
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
        <div className="brand">
          <span className="brand-name">boxsvg</span>
        </div>
        <ParameterForm
          form={form}
          setField={setField}
          setUnits={setUnits}
          swapToSmallest={swapToSmallest}
          errors={errors}
          warnings={warnings}
          thicknessPlaceholder={thicknessPlaceholder}
          defaultFilename={defaultFilename}
        />
        <div className="isometric-preview">
          <IsometricBox length={L} width={W} height={H} lid={form.lid} size={180} />
        </div>
        <DownloadButton dieline={dieline} units={form.units} filename={filename} />
        <footer className="sidebar-footer">
          Parametric box dieline generator
        </footer>
      </aside>
      <main className="preview">
        <SvgPreview dieline={dieline} />
      </main>
    </div>
  );
}

export default App;
