const COS30 = Math.cos(Math.PI / 6);
const SIN30 = Math.sin(Math.PI / 6);

function project(x: number, y: number, z: number): [number, number] {
  return [(x - z) * COS30, (x + z) * SIN30 - y];
}

interface Props {
  length: number;
  width: number;
  height: number;
  size?: number;
}

export function IsometricBox({ length: L, width: W, height: H, size = 200 }: Props) {
  if (L <= 0 || W <= 0 || H <= 0) return null;

  // 7 visible vertices of the box
  const pts = {
    fbl: project(0, 0, 0),       // front-bottom-left
    fbr: project(L, 0, 0),       // front-bottom-right
    bbl: project(0, 0, W),       // back-bottom-left
    bbr: project(L, 0, W),       // back-bottom-right
    ftl: project(0, H, 0),       // front-top-left
    ftr: project(L, H, 0),       // front-top-right
    btl: project(0, H, W),       // back-top-left
    btr: project(L, H, W),       // back-top-right
  };

  // Auto-scale to fit viewport
  const all = Object.values(pts);
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const w = maxX - minX, h = maxY - minY;
  const scale = (size * 0.75) / Math.max(w, h);
  const ox = size / 2 - ((minX + maxX) / 2) * scale;
  const oy = size / 2 - ((minY + maxY) / 2) * scale;

  const toSvg = (p: [number, number]) => `${p[0] * scale + ox},${-p[1] * scale + oy}`;

  // 3 visible faces (draw back-to-front for correct occlusion)
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
