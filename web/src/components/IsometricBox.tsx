const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);

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

  // Lid flap: hinged at top-back edge, extends H/2 down the back face
  // Tapered by H/8 on each side at the outer edge
  const taper = H / 8;
  const lidDepth = H / 2;
  const lid = {
    tl: project(0, 0, W),                    // hinge left (= btl)
    tr: project(L, 0, W),                    // hinge right (= btr)
    br: project(L - taper, lidDepth, W),     // outer right (tapered)
    bl: project(taper, lidDepth, W),         // outer left (tapered)
  };

  // Bottom seam: line bisecting the right face at mid-height
  const seamFront = project(L, H / 2, 0);
  const seamBack = project(L, H / 2, W);

  // Auto-scale to fit viewport (include lid vertices)
  const all = [...Object.values(v), lid.bl, lid.br];
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const bw = maxX - minX, bh = maxY - minY;
  const scale = (size * 0.75) / Math.max(bw, bh);
  const ox = size / 2 - ((minX + maxX) / 2) * scale;
  const oy = size / 2 - ((minY + maxY) / 2) * scale;

  const s = (p: [number, number]) => `${p[0] * scale + ox},${p[1] * scale + oy}`;
  const sx = (p: [number, number]) => p[0] * scale + ox;
  const sy = (p: [number, number]) => p[1] * scale + oy;

  const faces = [
    { pts: [v.fbl, v.bbl, v.bbr, v.fbr], fill: "#7a5a1c" },  // bottom
    { pts: [v.fbl, v.fbr, v.ftr, v.ftl], fill: "#c49450" },  // front
    { pts: [v.ftl, v.btl, v.bbl, v.fbl], fill: "#7a5a1c" },  // left side
    { pts: [v.btl, v.btr, v.bbr, v.bbl], fill: "#8b6520" },  // back
  ];

  const lidPoly = [lid.tl, lid.tr, lid.br, lid.bl].map(s).join(" ");

  const facesOver = [
    { pts: [v.ftl, v.ftr, v.btr, v.btl], fill: "#d4a76a" },  // top
    { pts: [v.ftr, v.btr, v.bbr, v.fbr], fill: "#a07830" },  // right side
  ];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {faces.map((face, i) => (
        <polygon
          key={`f${i}`}
          points={face.pts.map(s).join(" ")}
          fill={face.fill}
          stroke="#6b4c14"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      ))}
      {/* Lid flap on back panel */}
      <polygon
        points={lidPoly}
        fill="#b8884a"
        stroke="#6b4c14"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {facesOver.map((face, i) => (
        <polygon
          key={`o${i}`}
          points={face.pts.map(s).join(" ")}
          fill={face.fill}
          stroke="#6b4c14"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      ))}
      {/* Bottom seam on right face */}
      <line
        x1={sx(seamFront)} y1={sy(seamFront)}
        x2={sx(seamBack)} y2={sy(seamBack)}
        stroke="#6b4c14"
        strokeWidth={1}
      />
    </svg>
  );
}
