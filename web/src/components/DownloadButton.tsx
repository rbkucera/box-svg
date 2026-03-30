import type { Dieline, Units } from "../core/models";
import { renderSvgString } from "../utils/svgSerializer";
import { downloadSvg } from "../utils/downloadSvg";

interface Props {
  dieline: Dieline | null;
  units: Units;
}

export function DownloadButton({ dieline, units }: Props) {
  const handleDownload = () => {
    if (!dieline) return;
    const svgString = renderSvgString(dieline, units);
    downloadSvg(svgString);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={!dieline}
      className="download-button"
    >
      Download SVG
    </button>
  );
}
