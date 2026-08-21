import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mouth } from "@/lib/speech";

const STATE_CFG = {
  idle: { spin: 0.15, glow: 1.0, wob: 0.02 },
  listening: { spin: 0.25, glow: 1.5, wob: 0.05 },
  thinking: { spin: 0.5, glow: 1.3, wob: 0.03 },
  executing: { spin: 0.35, glow: 1.4, wob: 0.04 },
  speaking: { spin: 0.2, glow: 1.8, wob: 0.06 },
  error: { spin: 0.2, glow: 1.2, wob: 0.08 },
};

function useFaceData(src) {
  const [data, setData] = useState(null);
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const W = 168;
      const H = Math.round((img.height / img.width) * W);
      const cv = document.createElement("canvas");
      cv.width = W; cv.height = H;
      const ctx = cv.getContext("2d");
      ctx.drawImage(img, 0, 0, W, H);
      const px = ctx.getImageData(0, 0, W, H).data;
      const pos = [], col = [], mask = [];
      const worldW = 3.2;
      const worldH = worldW * (H / W);
      for (let y = 0; y < H; y += 2) {
        for (let x = 0; x < W; x += 2) {
          const i = (y * W + x) * 4;
          const r = px[i], g = px[i + 1], b = px[i + 2], a = px[i + 3];
          const bright = (r + g + b) / 3;
          if (a < 40 || bright < 34) continue; // skip dark background
          const nx = (x / W - 0.5) * worldW;
          const ny = -(y / H - 0.5) * worldH;
          const nz = (bright / 255) * 0.55 + (Math.random() - 0.5) * 0.04;
          pos.push(nx, ny, nz);
          const boost = 1.75;
          col.push(Math.min(1, (r / 255) * boost), Math.min(1, (g / 255) * boost), Math.min(1, (b / 255) * boost));
          const yr = y / H, xr = x / W;
          mask.push(yr > 0.6 && yr < 0.8 && Math.abs(xr - 0.5) < 0.2 ? 1 : 0); // mouth region
        }
      }
      setData({
        pos: new Float32Array(pos), col: new Float32Array(col),
        mask: new Float32Array(mask), count: pos.length / 3,
      });
    };
    img.src = src;
  }, [src]);
  return data;
}

function FacePoints({ data, stateName }) {
  const ref = useRef();
  const matRef = useRef();
  const cfg = STATE_CFG[stateName] || STATE_CFG.idle;
  const base = useMemo(() => data.pos.slice(), [data]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = Math.sin(t * cfg.spin) * 0.18;
    ref.current.rotation.x = Math.sin(t * 0.2) * 0.05;
    const arr = ref.current.geometry.attributes.position.array;
    const lip = mouth.level;
    for (let i = 0; i < data.count; i++) {
      const ix = i * 3;
      const w = 1 + cfg.wob * Math.sin(t * 2 + base[ix + 1] * 3 + i * 0.03);
      arr[ix] = base[ix] * w;
      arr[ix + 1] = base[ix + 1] * w - (data.mask[i] ? lip * 0.16 : 0);
      arr[ix + 2] = base[ix + 2] * w + (data.mask[i] ? lip * 0.12 : 0);
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    if (matRef.current) matRef.current.size = 0.032 + lip * 0.01;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={data.count} array={data.pos} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={data.count} array={data.col} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial ref={matRef} size={0.032} vertexColors transparent opacity={1}
        sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
}

export default function ParticleFace({ state = "idle" }) {
  const data = useFaceData("/iaia.webp");
  const cfg = STATE_CFG[state] || STATE_CFG.idle;
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <svg viewBox="0 0 400 400" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0, opacity: 0.6 }}>
        <circle cx="200" cy="200" r="188" fill="none" stroke="rgba(35,168,255,.14)" strokeWidth="1" />
        <circle cx="200" cy="200" r="150" fill="none" stroke="rgba(79,214,255,.3)" strokeWidth="1" strokeDasharray="3 8">
          <animateTransform attributeName="transform" type="rotate" from="0 200 200" to="360 200 200" dur="24s" repeatCount="indefinite" />
        </circle>
      </svg>
      <Canvas camera={{ position: [0, 0, 4], fov: 42 }} dpr={[1, 2]} style={{ position: "relative", zIndex: 1 }}>
        <ambientLight intensity={0.6} />
        {data && <FacePoints data={data} stateName={state} />}
      </Canvas>
    </div>
  );
}
