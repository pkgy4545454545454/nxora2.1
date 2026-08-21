import React, { useRef, useState, useEffect } from "react";
import { Panel } from "@/components/Hud";
import { api } from "@/lib/api";
import { Eye, Camera, Send, RefreshCw, CircleDot } from "lucide-react";

export default function VisionView() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const [stream, setStream] = useState(null);
  const [prompt, setPrompt] = useState("Décris précisément ce que tu vois.");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);

  const loadStatus = () => api.visionStatus().then(setStatus).catch(() => {});
  const loadHistory = () => api.visionHistory().then((d) => setHistory(d.history || [])).catch(() => {});
  useEffect(() => { loadStatus(); loadHistory(); return () => stream && stream.getTracks().forEach((t) => t.stop()); }, []); // eslint-disable-line

  const startCam = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      setStream(s);
      if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play(); }
    } catch (e) { setAnswer("Caméra inaccessible : " + e.message); }
  };

  const capture = () => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return null;
    c.width = v.videoWidth || 640; c.height = v.videoHeight || 480;
    c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.7);
  };

  const analyze = async () => {
    const img = capture();
    if (!img) { setAnswer("Active d'abord la caméra."); return; }
    setLoading(true); setAnswer("Analyse en cours…");
    try {
      const res = await api.vision(prompt, img);
      setAnswer(res.ok ? res.response : (res.error || "Erreur"));
      loadHistory();
    } catch (e) { setAnswer("Erreur : " + e.message); }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-4" style={{ height: "100%", overflowY: "auto" }}>
      <Panel title={<><Eye size={13} /> Vision — Caméra + IA locale</>} testid="vision-panel"
        right={<span className="chip" style={{ background: status?.online ? "rgba(57,230,160,.12)" : "rgba(255,59,82,.12)", color: status?.online ? "var(--green)" : "var(--red-soft)" }}>
          <CircleDot size={11} className="inline mr-1" />{status?.online ? "Ollama en ligne" : "Ollama hors-ligne"}</span>}>
        <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 8 }}>Modèle : {status?.model || "qwen2.5vl:7b"} · {status?.url}</div>
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--panel-border)", background: "#000", aspectRatio: "4/3" }}>
              <video ref={videoRef} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} data-testid="vision-video" />
            </div>
            <canvas ref={canvasRef} style={{ display: "none" }} />
            <div className="flex gap-2 mt-2">
              <button className="btn flex-1" onClick={startCam} data-testid="vision-start-cam"><Camera size={13} className="inline mr-1" /> Activer caméra</button>
              <button className="btn flex-1" onClick={analyze} disabled={loading} data-testid="vision-analyze"><Send size={13} className="inline mr-1" /> Analyser</button>
            </div>
          </div>
          <div className="flex flex-col">
            <textarea className="field" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} data-testid="vision-prompt" />
            <div className="panel mt-2" style={{ flex: 1, padding: 12, overflowY: "auto", minHeight: 120 }} data-testid="vision-answer">
              <div style={{ fontSize: 14, color: "var(--text)", whiteSpace: "pre-wrap" }}>{answer || "La réponse de l'IA vision apparaîtra ici."}</div>
            </div>
          </div>
        </div>
        {!status?.online && <div style={{ fontSize: 11, color: "var(--amber)", marginTop: 8 }}>Ollama doit tourner en local : <code>ollama serve</code> puis <code>ollama pull {status?.model || "qwen2.5vl:7b"}</code>.</div>}
      </Panel>

      <Panel title={<><RefreshCw size={13} /> Historique Vision</>} testid="vision-history"
        right={<button onClick={loadHistory} style={{ color: "var(--cyan-bright)" }}><RefreshCw size={14} /></button>}>
        <div className="flex flex-col gap-2" style={{ maxHeight: 300, overflowY: "auto" }}>
          {history.map((h) => (
            <div key={h.id} className="panel" style={{ padding: 10 }} data-testid="vision-hist-item">
              <div style={{ fontSize: 11, color: "var(--cyan-bright)" }}>{h.prompt}</div>
              <div style={{ fontSize: 13, color: "var(--text)", marginTop: 4 }}>{h.response}</div>
              <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 4 }}>{h.model} · {new Date(h.created).toLocaleString("fr-FR")}</div>
            </div>
          ))}
          {!history.length && <div style={{ color: "var(--text-dim)" }}>Aucune analyse encore.</div>}
        </div>
      </Panel>
    </div>
  );
}
