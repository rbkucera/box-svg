import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import type { Dieline } from "../core/models";

const PPI = 96;
const CUT_COLOR = "#00FF00";
const SCORE_COLOR = "#FF0000";
const STROKE_WIDTH = 1;
const NAVIGATOR_SIZE = 180;

interface Props {
  dieline: Dieline | null;
}

type PreviewMode = "fit" | "full";

interface ViewportMetrics {
  scrollLeft: number;
  scrollTop: number;
  clientWidth: number;
  clientHeight: number;
}

function DielineDrawing({ dieline }: { dieline: Dieline }) {
  const cutElements = dieline.elements.filter((el) => el.kind === "cut");
  const scoreElements = dieline.elements.filter((el) => el.kind === "score");

  // Rotate 90 degrees CCW by swapping coordinates: (x,y) -> (y, maxX - x)
  const maxX = dieline.width * PPI;
  const rx = (_x: number, y: number) => y * PPI;
  const ry = (x: number, _y: number) => maxX - x * PPI;

  return (
    <>
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
    </>
  );
}

export function SvgPreview({ dieline }: Props) {
  const [mode, setMode] = useState<PreviewMode>("fit");
  const [viewport, setViewport] = useState<ViewportMetrics>({
    scrollLeft: 0,
    scrollTop: 0,
    clientWidth: 0,
    clientHeight: 0,
  });
  const [fitViewport, setFitViewport] = useState({
    width: 0,
    height: 0,
  });
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const fitCanvasRef = useRef<HTMLDivElement | null>(null);
  const navigatorHintId = useId();

  useEffect(() => {
    if (!dieline) {
      setMode("fit");
    }
  }, [dieline]);

  useEffect(() => {
    if (mode !== "full" || !dieline) {
      return;
    }

    const scrollNode = scrollRef.current;
    const contentNode = contentRef.current;
    if (!scrollNode || !contentNode) {
      return;
    }

    const syncViewport = () => {
      setViewport({
        scrollLeft: scrollNode.scrollLeft,
        scrollTop: scrollNode.scrollTop,
        clientWidth: scrollNode.clientWidth,
        clientHeight: scrollNode.clientHeight,
      });
    };

    syncViewport();

    scrollNode.addEventListener("scroll", syncViewport, { passive: true });
    const observer = new ResizeObserver(syncViewport);
    observer.observe(scrollNode);
    observer.observe(contentNode);
    window.addEventListener("resize", syncViewport);

    return () => {
      scrollNode.removeEventListener("scroll", syncViewport);
      observer.disconnect();
      window.removeEventListener("resize", syncViewport);
    };
  }, [dieline, mode]);

  useEffect(() => {
    if (mode !== "fit" || !dieline) {
      return;
    }

    const fitNode = fitCanvasRef.current;
    if (!fitNode) {
      return;
    }

    const syncFitViewport = () => {
      setFitViewport({
        width: fitNode.clientWidth,
        height: fitNode.clientHeight,
      });
    };

    syncFitViewport();

    const observer = new ResizeObserver(syncFitViewport);
    observer.observe(fitNode);
    window.addEventListener("resize", syncFitViewport);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncFitViewport);
    };
  }, [dieline, mode]);

  if (!dieline) {
    return (
      <div className="preview-surface">
        <div className="preview-toolbar">
          <div className="preview-mode-toggle" role="group" aria-label="Preview scale mode">
            <button type="button" className="preview-mode-button is-active" disabled>
              Scale to fit
            </button>
            <button type="button" className="preview-mode-button" disabled>
              Full size
            </button>
          </div>
          <span className="preview-status">Awaiting valid dimensions</span>
        </div>
        <div className="preview-placeholder">
          <p>Enter valid dimensions to see a preview</p>
          <span>Cut paths render in green and score paths render in red.</span>
        </div>
      </div>
    );
  }

  const svgW = dieline.height * PPI;
  const svgH = dieline.width * PPI;
  const navigatorWidth = Math.min(NAVIGATOR_SIZE, svgW);
  const navigatorHeight = Math.min(NAVIGATOR_SIZE, (svgH / svgW) * navigatorWidth);
  const visibleWidth = mode === "full" ? viewport.clientWidth : fitViewport.width;
  const visibleHeight = mode === "full" ? viewport.clientHeight : fitViewport.height;
  const viewportLabel =
    visibleWidth > 0 && visibleHeight > 0
      ? `${Math.round(visibleWidth)} x ${Math.round(visibleHeight)} px viewport`
      : "";

  const handleNavigatorClick = (event: MouseEvent<HTMLButtonElement>) => {
    const scrollNode = scrollRef.current;
    if (!scrollNode) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const clickX = ((event.clientX - bounds.left) / bounds.width) * svgW;
    const clickY = ((event.clientY - bounds.top) / bounds.height) * svgH;

    scrollNode.scrollTo({
      left: Math.max(0, clickX - scrollNode.clientWidth / 2),
      top: Math.max(0, clickY - scrollNode.clientHeight / 2),
      behavior: "smooth",
    });
  };

  return (
    <div className="preview-surface">
      <div className="preview-toolbar">
        <div className="preview-mode-toggle" role="group" aria-label="Preview scale mode">
          <button
            type="button"
            className={`preview-mode-button${mode === "fit" ? " is-active" : ""}`}
            onClick={() => setMode("fit")}
          >
            Scale to fit
          </button>
          <button
            type="button"
            className={`preview-mode-button${mode === "full" ? " is-active" : ""}`}
            onClick={() => setMode("full")}
          >
            Full size
          </button>
        </div>
        {viewportLabel ? <span className="preview-status">{viewportLabel}</span> : null}
      </div>

      {mode === "fit" ? (
        <div ref={fitCanvasRef} className="preview-canvas preview-canvas-fit">
          <svg
            className="preview-svg preview-svg-fit"
            viewBox={`0 0 ${svgW} ${svgH}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <DielineDrawing dieline={dieline} />
          </svg>
        </div>
      ) : (
        <div className="preview-canvas preview-canvas-full">
          <div ref={scrollRef} className="preview-scroll-area">
            <div
              ref={contentRef}
              className="preview-scroll-content"
              style={{ width: `${svgW}px`, height: `${svgH}px` }}
            >
              <svg
                className="preview-svg preview-svg-full"
                width={svgW}
                height={svgH}
                viewBox={`0 0 ${svgW} ${svgH}`}
                preserveAspectRatio="xMidYMid meet"
              >
                <DielineDrawing dieline={dieline} />
              </svg>
            </div>
          </div>

          <div className="preview-navigator">
            <div className="preview-navigator-title">Navigator</div>
            <button
              type="button"
              className="preview-navigator-button"
              onClick={handleNavigatorClick}
              aria-describedby={navigatorHintId}
            >
              <svg
                className="preview-navigator-svg"
                viewBox={`0 0 ${svgW} ${svgH}`}
                width={navigatorWidth}
                height={navigatorHeight}
                preserveAspectRatio="xMidYMid meet"
              >
                <DielineDrawing dieline={dieline} />
                <rect
                  x={viewport.scrollLeft}
                  y={viewport.scrollTop}
                  width={Math.min(viewport.clientWidth || svgW, svgW)}
                  height={Math.min(viewport.clientHeight || svgH, svgH)}
                  fill="rgba(56, 133, 255, 0.14)"
                  stroke="#2f5bd8"
                  strokeWidth={8}
                />
              </svg>
            </button>
            <p id={navigatorHintId} className="preview-navigator-hint">
              Click to center the visible area.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
