import os
import json
import httpx
from typing import Any, Dict

DO_BASE_URL = os.getenv("DO_SERVERLESS_INFERENCE_BASE_URL", "https://api.digitalocean.com/v2/gen-ai")
DO_API_KEY = os.getenv("DIGITALOCEAN_INFERENCE_KEY", "")
DO_MODEL = os.getenv("DO_INFERENCE_MODEL", "gpt-4.1-mini")


class AIServiceError(Exception):
    pass


async def do_chat_completion(system_prompt: str, user_payload: Dict[str, Any], temperature: float = 0.1) -> Dict[str, Any]:
    if not DO_API_KEY:
        raise AIServiceError("Missing DIGITALOCEAN_INFERENCE_KEY")

    url = f"{DO_BASE_URL}/chat/completions"
    headers = {
        "Authorization": f"Bearer {DO_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": DO_MODEL,
        "temperature": temperature,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": json.dumps(user_payload)},
        ],
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(url, headers=headers, json=body)
        if resp.status_code >= 400:
            raise AIServiceError(f"Inference request failed ({resp.status_code}): {resp.text}")

        data = resp.json()
        try:
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
        except Exception as exc:
            raise AIServiceError(f"Invalid inference response format: {exc}")

        usage = data.get("usage", {})
        return {"result": parsed, "usage": usage, "model": DO_MODEL}
