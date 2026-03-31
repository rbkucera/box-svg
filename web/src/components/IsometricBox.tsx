const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);

// Isometric projection: 3D → 2D (SVG y-down convention)
function project(x: number, y: number, z: number): [number, number] {
  return [
    (x - z) * COS30,
    (x + z) * SIN30 + y,  // +y because SVG y goes down, and height goes down
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
  const pts = {
    ftl: project(0, 0, 0),       // front-top-left
    ftr: project(L, 0, 0),       // front-top-right
    btl: project(0, 0, W),       // back-top-left
    btr: project(L, 0, W),       // back-top-right
    fbl: project(0, H, 0),       // front-bottom-left
    fbr: project(L, H, 0),       // front-bottom-right
    bbl: project(0, H, W),       // back-bottom-left
    bbr: project(L, H, W),       // back-bottom-right
  };

  // Auto-scale to fit viewport with padding
  const all = Object.values(pts);
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const bw = maxX - minX, bh = maxY - minY;
  const scale = (size * 0.75) / Math.max(bw, bh);
  const ox = size / 2 - ((minX + maxX) / 2) * scale;
  const oy = size / 2 - ((minY + maxY) / 2) * scale;

  const toSvg = (p: [number, number]) => `${p[0] * scale + ox},${p[1] * scale + oy}`;

  // 3 visible faces (draw back-to-front: top, right side, front)
  const topFace = [pts.ftl, pts.ftr, pts.btr, pts.btl].map(toSvg).join(" ");
  const rightFace = [pts.fbr, pts.bbr, pts.btr, pts.ftr].map(toSvg).join(" ");
  const frontFace = [pts.fbl, pts.fbr, pts.ftr, pts.ftl].map(toSvg).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <polygon points={topFace} fill="#d4a76a" stroke="#8b6914" strokeWidth={1.5} />
      <polygon points={rightFace} fill="#a07830" stroke="#8b6914" strokeWidth={1.5} />
      <polygon points={frontFace} fill="#c49450" stroke="#8b6914" strokeWidth={1.5} />
    </svg>
  );
}
