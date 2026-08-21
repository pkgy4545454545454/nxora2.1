"""Screenshot tool (works on the local machine that runs the backend)."""
from datetime import datetime, timezone
from jarvis.store import REPORTS_DIR


def take_screenshot():
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    out = REPORTS_DIR / f"screenshot-{stamp}.png"
    try:
        import mss
        with mss.mss() as sct:
            sct.shot(mon=-1, output=str(out))
        return {"ok": True, "file": str(out), "message": "Capture d'écran enregistrée."}
    except Exception as e:
        return {"ok": False, "error": f"Capture impossible ({e}). Fonctionne uniquement en local avec un écran."}


REGISTRY = [
    {"name": "take_screenshot", "category": "normal", "func": take_screenshot,
     "description": "Prendre une capture d'écran de l'ordinateur et l'enregistrer (fonctionne en local).",
     "input_schema": {"type": "object", "properties": {}, "required": []}},
]
