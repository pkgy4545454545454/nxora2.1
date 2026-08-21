import React, { useEffect, useRef, useState } from "react";

export default function RadialMenu({ items, active, onSelect, radius = 43 }) {
  const [offset, setOffset] = useState(0);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const moved = useRef(false);

  useEffect(() => {
    const id = setInterval(() => { if (!dragging.current) setOffset((o) => o + 0.0016); }, 30);
    return () => clearInterval(id);
  }, []);

  const n = items.length;
  const onWheel = (e) => setOffset((o) => o + (e.deltaY > 0 ? 0.14 : -0.14));
  const onDown = (e) => { dragging.current = true; moved.current = false; lastX.current = e.clientX; };
  const onMove = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastX.current;
    if (Math.abs(dx) > 2) moved.current = true;
    lastX.current = e.clientX;
    setOffset((o) => o + dx * 0.006);
  };
  const onUp = () => { dragging.current = false; };

  return (
    <div className="radial-menu" onWheel={onWheel} onMouseDown={onDown} onMouseMove={onMove}
      onMouseUp={onUp} onMouseLeave={onUp} style={{ position: "absolute", inset: 0, pointerEvents: "auto", zIndex: 5 }}>
      {items.map((it, i) => {
        const ang = (i / n) * Math.PI * 2 + offset - Math.PI / 2;
        const x = 50 + Math.cos(ang) * radius;
        const y = 50 + Math.sin(ang) * radius;
        const Icon = it.icon;
        const isA = it.id === active;
        return (
          <button key={it.id} className={`radial-node ${isA ? "active" : ""}`} data-testid={`nav-${it.id}`}
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={() => { if (!moved.current) onSelect(it.id); }}>
            <Icon size={17} />
            <span>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}
