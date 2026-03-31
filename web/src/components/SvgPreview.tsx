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

  const svgW = dieline.height * PPI;  // rotated: height becomes width
  const svgH = dieline.width * PPI;   // rotated: width becomes height

  const cutElements = dieline.elements.filter((el) => el.kind === "cut");
  const scoreElements = dieline.elements.filter((el) => el.kind === "score");

  // Rotate 90° CCW by swapping coordinates: (x,y) → (y, maxX - x)
  const maxX = dieline.width * PPI;
  const rx = (_x: number, y: number) => y * PPI;
  const ry = (x: number, _y: number) => maxX - x * PPI;

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%", background: "#fff" }}
    >
      <g id="cut" stroke={CUT_COLOR} strokeWidth={STROKE_WIDTH} fill="none">
        {cutElements.map((el, i) => (
          <line
            key={`cut-${i}`}
            x1={rx(el.x1, el.y1)}
            y1={ry(el.x1, el.y1)}
            x2={rx(el.x2, el.y2)}
            y2={ry(el.x2, el.y2)}
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
            x1={rx(el.x1, el.y1)}
            y1={ry(el.x1, el.y1)}
            x2={rx(el.x2, el.y2)}
            y2={ry(el.x2, el.y2)}
          />
        ))}
      </g>
    </svg>
  );
}
