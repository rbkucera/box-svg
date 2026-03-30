import { useBoxRequest } from "./hooks/useBoxRequest";
import { ParameterForm } from "./components/ParameterForm";
import { SvgPreview } from "./components/SvgPreview";
import { DownloadButton } from "./components/DownloadButton";
import "./App.css";

function App() {
  const { form, setField, errors, warnings, dieline, thicknessPlaceholder } = useBoxRequest();

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>boxsvg</h1>
        <ParameterForm
          form={form}
          setField={setField}
          errors={errors}
          warnings={warnings}
          thicknessPlaceholder={thicknessPlaceholder}
        />
        <DownloadButton dieline={dieline} units={form.units} />
      </aside>
      <main className="preview">
        <SvgPreview dieline={dieline} />
      </main>
    </div>
  );
}

export default App;
