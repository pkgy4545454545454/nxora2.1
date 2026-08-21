"""Ollama local LLM client (chat + vision). Runs against a local Ollama server."""
import json
import requests


def _post(url: str, path: str, payload: dict, timeout: int = 120) -> dict:
    r = requests.post(f"{url.rstrip('/')}{path}", json=payload, timeout=timeout)
    r.raise_for_status()
    return r.json()


def chat(url: str, model: str, messages: list, tools: list | None = None) -> dict:
    payload = {"model": model, "messages": messages, "stream": False}
    if tools:
        payload["tools"] = tools
    data = _post(url, "/api/chat", payload)
    return data.get("message", {})


def vision(url: str, model: str, prompt: str, image_b64: str) -> str:
    # strip data-url prefix if present
    if "," in image_b64 and image_b64.strip().startswith("data:"):
        image_b64 = image_b64.split(",", 1)[1]
    payload = {
        "model": model, "stream": False,
        "messages": [{"role": "user", "content": prompt or "Décris précisément ce que tu vois.",
                      "images": [image_b64]}],
    }
    data = _post(url, "/api/chat", payload, timeout=180)
    return (data.get("message", {}) or {}).get("content", "")


def health(url: str) -> bool:
    try:
        r = requests.get(f"{url.rstrip('/')}/api/tags", timeout=5)
        return r.status_code == 200
    except Exception:
        return False
