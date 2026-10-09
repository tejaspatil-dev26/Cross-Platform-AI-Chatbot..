import httpx
from typing import List, Dict
from app.services.ai.base import BaseAIProvider
from app.core.config import settings

class GeminiProvider(BaseAIProvider):
    def __init__(self, api_key: str = settings.GEMINI_API_KEY, model: str = "gemini-1.5-flash"):
        self.api_key = api_key
        self.model = model
        self.base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"

    async def generate_response(self, messages: List[Dict[str, str]], system_prompt: str = "") -> str:
        if not self.api_key:
            return "Error: GEMINI_API_KEY is not set in the .env file."

        # Convert standard OpenAI/Ollama messages to Gemini format
        contents = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({
                "role": role,
                "parts": [{"text": msg["content"]}]
            })

        payload = {"contents": contents}
        if system_prompt:
            payload["systemInstruction"] = {
                "parts": [{"text": system_prompt}]
            }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.base_url}?key={self.api_key}",
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
            try:
                return data["candidates"][0]["content"]["parts"][0]["text"]
            except (KeyError, IndexError):
                return "Error: Unexpected response format from Gemini API."
