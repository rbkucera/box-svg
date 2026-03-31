import type { Dieline } from "../core/models";

const PPI = 96;
const CUT_COLOR = "#00FF00";
const SCORE_COLOR = "#FF0000";
const STROKE_WIDTH = 1;

interface Props {
  dieline: Dieline | null;
}

export function SvgPreview({ dieline }: Props) {
  if (!dieline) {
    return (
      <div className="preview-placeholder">
        <p>Enter valid dimensions to see a preview</p>
      </div>
    );
  }

  const svgW = dieline.width * PPI;
  const svgH = dieline.height * PPI;

  const cutElements = dieline.elements.filter((el) => el.kind === "cut");
  const scoreElements = dieline.elements.filter((el) => el.kind === "score");

  // Rotate 90° CCW for landscape display
  // After rotating -90° around origin: (x,y) → (y, -x)
  // Shift right by svgH to keep all coords positive
  // New bounding box: svgH wide × svgW tall
  return (
    <svg
      viewBox={`0 0 ${svgH} ${svgW}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%", background: "#fff" }}
    >
      <g transform={`rotate(-90, 0, 0) translate(${-svgH}, 0)`}>
        <g id="cut" stroke={CUT_COLOR} strokeWidth={STROKE_WIDTH} fill="none">
          {cutElements.map((el, i) => (
            <line
              key={`cut-${i}`}
              x1={el.x1 * PPI}
              y1={el.y1 * PPI}
              x2={el.x2 * PPI}
              y2={el.y2 * PPI}
            />
          ))}
        </g>
        <g
          id="score"
          stroke={SCORE_COLOR}
          strokeWidth={STROKE_WIDTH}
          strokeDasharray="4 2"
          fill="none"
        >
          {scoreElements.map((el, i) => (
            <line
              key={`score-${i}`}
              x1={el.x1 * PPI}
              y1={el.y1 * PPI}
              x2={el.x2 * PPI}
              y2={el.y2 * PPI}
            />
          ))}
        </g>
      </g>
    </svg>
  );
}
