const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);

// Isometric projection: 3D → 2D (SVG y-down convention)
function project(x: number, y: number, z: number): [number, number] {
  return [
    (x - z) * COS30,
    (x + z) * SIN30 + y,
  ];
}

interface Props {
  length: number;
  width: number;
  height: number;
  size?: number;
}

export function IsometricBox({ length: L, width: W, height: H, size = 200 }: Props) {
  if (L <= 0 || W <= 0 || H <= 0) return null;

  // 8 vertices — y=0 is top, y=H is bottom (SVG convention)
  const v = {
    ftl: project(0, 0, 0),
    ftr: project(L, 0, 0),
    btl: project(0, 0, W),
    btr: project(L, 0, W),
    fbl: project(0, H, 0),
    fbr: project(L, H, 0),
    bbl: project(0, H, W),
    bbr: project(L, H, W),
  };

  // Auto-scale to fit viewport
  const all = Object.values(v);
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const bw = maxX - minX, bh = maxY - minY;
  const scale = (size * 0.75) / Math.max(bw, bh);
  const ox = size / 2 - ((minX + maxX) / 2) * scale;
  const oy = size / 2 - ((minY + maxY) / 2) * scale;

  const s = (p: [number, number]) => `${p[0] * scale + ox},${p[1] * scale + oy}`;

  // All 6 faces, drawn back-to-front for correct occlusion
  // In this isometric view (camera looks down-left), the order is:
  // 1. bottom (furthest), 2. back, 3. left, 4. top, 5. right, 6. front (nearest)
  const faces = [
    { pts: [v.fbl, v.bbl, v.bbr, v.fbr], fill: "#7a5a1c" },  // bottom
    { pts: [v.btl, v.btr, v.bbr, v.bbl], fill: "#8b6520" },  // back
    { pts: [v.ftl, v.btl, v.bbl, v.fbl], fill: "#7a5a1c" },  // left side
    { pts: [v.ftl, v.ftr, v.btr, v.btl], fill: "#d4a76a" },  // top
    { pts: [v.ftr, v.btr, v.bbr, v.fbr], fill: "#a07830" },  // right side
    { pts: [v.fbl, v.fbr, v.ftr, v.ftl], fill: "#c49450" },  // front
  ];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {faces.map((face, i) => (
        <polygon
          key={i}
          points={face.pts.map(s).join(" ")}
          fill={face.fill}
          stroke="#6b4c14"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
