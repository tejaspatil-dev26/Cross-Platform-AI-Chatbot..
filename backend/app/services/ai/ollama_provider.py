import httpx
from typing import List, Dict
from app.services.ai.base import BaseAIProvider
from app.core.config import settings

class OllamaProvider(BaseAIProvider):
    def __init__(self, base_url: str = settings.OLLAMA_BASE_URL, model: str = settings.OLLAMA_MODEL):
        self.base_url = base_url.rstrip("/")
        self.model = model

    async def generate_response(self, messages: List[Dict[str, str]], system_prompt: str = "") -> str:
        formatted_messages = []
        if system_prompt:
            formatted_messages.append({"role": "system", "content": system_prompt})
        formatted_messages.extend(messages)

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json={
                        "model": self.model,
                        "messages": formatted_messages,
                        "stream": False
                    }
                )
                response.raise_for_status()
                data = response.json()
                return data["message"]["content"]
        except httpx.ConnectError:
            return (
                f"⚠️ Could not connect to Ollama at {self.base_url}. "
                "Please make sure Ollama is running ('ollama serve'), "
                "or set AI_PROVIDER=mock in backend/.env for instant simulated replies."
            )
        except httpx.HTTPStatusError as e:
            return f"⚠️ Ollama API error ({e.response.status_code}): {e.response.text}"
        except httpx.TimeoutException:
            return "⚠️ Request to Ollama timed out. The model may still be loading or generating."
        except Exception as e:
            return f"⚠️ LLM generation error: {str(e)}"