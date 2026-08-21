import React, { useEffect, useRef, useState } from "react";

const HANDS_JS = "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/hands.js";
const BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/";

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src; s.crossOrigin = "anonymous";
    s.onload = () => resolve(); s.onerror = reject;
    document.head.appendChild(s);
  });
}

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function extended(lm, tip, pip) { return lm[tip].y < lm[pip].y - 0.02; }

function scrollableParent(el) {
  let n = el;
  while (n && n !== document.body) {
    const s = getComputedStyle(n);
    if ((s.overflowY === "auto" || s.overflowY === "scroll") && n.scrollHeight > n.clientHeight + 4) return n;
    n = n.parentElement;
  }
  return document.scrollingElement || document.documentElement;
}

export default function HandControl({ enabled, onError }) {
  const videoRef = useRef();
  const cursorRef = useRef();
  const [status, setStatus] = useState("init");
  const st = useRef({
    pinch: false, drag: null, dragBase: null, lastY: null, x: 0, y: 0,
    stream: null, hands: null, raf: null, running: false,
  });

  useEffect(() => {
    if (!enabled) { cleanup(); return; }
    let cancelled = false;
    (async () => {
      try {
        setStatus("Chargement du modèle…");
        await loadScript(HANDS_JS);
        if (cancelled) return;
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360 } });
        st.current.stream = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const hands = new window.Hands({ locateFile: (f) => BASE + f });
        hands.setOptions({ maxNumHands: 1, modelComplexity: 0, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 });
        hands.onResults(onResults);
        st.current.hands = hands;
        st.current.running = true;
        setStatus("Actif");
        loop();
      } catch (e) {
        setStatus("Erreur caméra/modèle");
        onError && onError(String(e));
      }
    })();
    return () => { cancelled = true; cleanup(); };
    // eslint-disable-next-line
  }, [enabled]);

  const loop = async () => {
    const s = st.current;
    if (!s.running || !s.hands || !videoRef.current) return;
    try { await s.hands.send({ image: videoRef.current }); } catch (e) {}
    s.raf = requestAnimationFrame(loop);
  };

  function onResults(res) {
    const s = st.current;
    const cur = cursorRef.current;
    const lms = res.multiHandLandmarks && res.multiHandLandmarks[0];
    if (!lms) { if (cur) cur.style.opacity = "0"; s.pinch = false; s.drag = null; s.lastY = null; return; }
    const idx = lms[8];
    const x = (1 - idx.x) * window.innerWidth;   // mirror
    const y = idx.y * window.innerHeight;
    s.x = x; s.y = y;
    if (cur) { cur.style.opacity = "1"; cur.style.left = x + "px"; cur.style.top = y + "px"; }

    const pinchDist = dist(lms[4], lms[8]);
    const isPinch = pinchDist < 0.07;
    const twoFingers = extended(lms, 8, 6) && extended(lms, 12, 10) && !extended(lms, 16, 14);

    // SCROLL mode (index+middle up)
    if (twoFingers && !isPinch) {
      if (s.lastY != null) {
        const dy = y - s.lastY;
        const el = document.elementFromPoint(x, y);
        if (el) scrollableParent(el).scrollBy(0, dy * 2.2);
      }
      s.lastY = y;
      if (cur) cur.className = "hand-cursor scroll";
      return;
    }
    s.lastY = null;

    if (isPinch && !s.pinch) {
      // pinch DOWN
      s.pinch = true;
      if (cur) cur.className = "hand-cursor pinch";
      const el = document.elementFromPoint(x, y);
      if (el) {
        const panel = el.closest(".panel");
        const control = el.closest("button,a,input,select,textarea,[data-testid],[role='button'],.nav-item");
        if (control) {
          control.click();
          if (control.focus) try { control.focus(); } catch (_) {}
        } else if (panel) {
          const rect = panel.getBoundingClientRect();
          const prev = panel.style.transform || "";
          const m = prev.match(/translate\((-?\d+\.?\d*)px,\s*(-?\d+\.?\d*)px\)/);
          const ox = m ? parseFloat(m[1]) : 0;
          const oy = m ? parseFloat(m[2]) : 0;
          s.drag = panel;
          s.dragBase = { px: x, py: y, ox, oy };
          panel.style.zIndex = "50";
          panel.style.transition = "none";
        }
      }
    } else if (isPinch && s.pinch && s.drag) {
      // dragging
      const b = s.dragBase;
      s.drag.style.transform = `translate(${b.ox + (x - b.px)}px, ${b.oy + (y - b.py)}px)`;
    } else if (!isPinch && s.pinch) {
      // pinch UP
      s.pinch = false; s.drag = null;
      if (cur) cur.className = "hand-cursor";
    }
    if (cur && !s.pinch) cur.className = "hand-cursor";
  }

  function cleanup() {
    const s = st.current;
    s.running = false;
    if (s.raf) cancelAnimationFrame(s.raf);
    if (s.hands && s.hands.close) try { s.hands.close(); } catch (_) {}
    if (s.stream) s.stream.getTracks().forEach((t) => t.stop());
    s.hands = null; s.stream = null; s.pinch = false; s.drag = null;
  }

  if (!enabled) return null;
  return (
    <>
      <video ref={videoRef} muted playsInline
        style={{ position: "fixed", bottom: 96, right: 12, width: 160, height: 120, transform: "scaleX(-1)",
                 border: "1px solid var(--panel-border)", borderRadius: 8, zIndex: 60, opacity: 0.85, objectFit: "cover" }}
        data-testid="hand-video" />
      <div style={{ position: "fixed", bottom: 220, right: 12, zIndex: 60, fontSize: 10, color: "var(--cyan-bright)", fontFamily: "Orbitron" }}>
        MAIN : {status}
      </div>
      <div ref={cursorRef} className="hand-cursor" style={{ opacity: 0 }} />
    </>
  );
}
