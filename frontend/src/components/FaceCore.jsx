import React from "react";

const IAIA = "https://customer-assets-0z36b82j.emergentagent.net/job_personal-ai-252/artifacts/n4ashj22_iaia.webp";

const GLOW = {
  idle: "0 0 40px rgba(35,168,255,.35)",
  listening: "0 0 70px rgba(79,214,255,.65)",
  thinking: "0 0 60px rgba(255,182,72,.55)",
  executing: "0 0 60px rgba(35,168,255,.6)",
  speaking: "0 0 90px rgba(79,214,255,.8)",
  error: "0 0 60px rgba(255,59,82,.6)",
};

export default function FaceCore({ state = "idle" }) {
  const glow = GLOW[state] || GLOW.idle;
  const speaking = state === "speaking";
  const thinking = state === "thinking";
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", display: "flex",
                  alignItems: "center", justifyContent: "center" }}>
      {/* orbit rings */}
      <svg viewBox="0 0 400 400" style={{ position: "absolute", width: "min(100%, 460px)", height: "min(100%, 460px)" }}>
        <circle cx="200" cy="200" r="190" fill="none" stroke="rgba(35,168,255,.18)" strokeWidth="1" />
        <circle cx="200" cy="200" r="150" fill="none" stroke="rgba(35,168,255,.28)" strokeWidth="1" strokeDasharray="3 7" >
          <animateTransform attributeName="transform" type="rotate" from="0 200 200" to="360 200 200"
            dur={thinking ? "6s" : "26s"} repeatCount="indefinite" />
        </circle>
        <circle cx="200" cy="200" r="120" fill="none" stroke="rgba(79,214,255,.35)" strokeWidth="1.5" strokeDasharray="180 400" strokeLinecap="round">
          <animateTransform attributeName="transform" type="rotate" from="360 200 200" to="0 200 200"
            dur={thinking ? "4s" : "16s"} repeatCount="indefinite" />
        </circle>
      </svg>

      {/* face */}
      <div style={{ position: "relative", width: "min(58%, 260px)", filter: `drop-shadow(${glow})`,
                    transition: "filter .4s ease", animation: speaking ? "facePulse 1.1s ease-in-out infinite" : "faceFloat 6s ease-in-out infinite" }}>
        <img src={IAIA} alt="JARVIS" style={{ width: "100%", display: "block", objectFit: "contain",
             maskImage: "radial-gradient(circle at 50% 42%, #000 62%, transparent 82%)",
             WebkitMaskImage: "radial-gradient(circle at 50% 42%, #000 62%, transparent 82%)" }} />
      </div>

      <style>{`
        @keyframes faceFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes facePulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.035)} }
      `}</style>
    </div>
  );
}
