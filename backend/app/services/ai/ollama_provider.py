import logging
import httpx
from typing import List, Dict
from app.services.ai.base import BaseAIProvider
from app.core.config import settings

logger = logging.getLogger(__name__)

class OllamaProvider(BaseAIProvider):
    def __init__(
        self,
        base_url: str = settings.OLLAMA_BASE_URL,
        model: str = settings.OLLAMA_MODEL,
        num_gpu: int = settings.OLLAMA_NUM_GPU,
        timeout: float = settings.OLLAMA_TIMEOUT
    ):
        self.base_url = base_url.rstrip("/")
        self.model = model
        # If FORCE_CPU is enabled, always force num_gpu to 0 (CPU only)
        self.num_gpu = 0 if settings.FORCE_CPU else num_gpu
        self.timeout = timeout

    async def _send_chat_request(self, client: httpx.AsyncClient, messages: List[Dict[str, str]], num_gpu: int) -> dict:
        options = {
            "num_gpu": num_gpu,
            "num_ctx": settings.OLLAMA_NUM_CTX,
            "num_predict": 512,
        }
        if settings.OLLAMA_NUM_THREAD > 0:
            options["num_thread"] = settings.OLLAMA_NUM_THREAD

        response = await client.post(
            f"{self.base_url}/api/chat",
            json={
                "model": self.model,
                "messages": messages,
                "stream": False,
                "keep_alive": settings.OLLAMA_KEEP_ALIVE,
                "options": options
            }
        )
        response.raise_for_status()
        return response.json()

    async def generate_response(self, messages: List[Dict[str, str]], system_prompt: str = "") -> str:
        formatted_messages = []
        if system_prompt:
            formatted_messages.append({"role": "system", "content": system_prompt})
        formatted_messages.extend(messages)

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                try:
                    data = await self._send_chat_request(client, formatted_messages, self.num_gpu)
                    return data["message"]["content"]
                except (httpx.HTTPStatusError, httpx.TimeoutException) as err:
                    # If GPU was requested (num_gpu != 0) but failed (e.g. GPU turned off, OOM, or driver crash),
                    # automatically fall back to CPU mode (num_gpu=0)
                    if self.num_gpu != 0:
                        logger.warning(
                            f"Ollama GPU inference failed with num_gpu={self.num_gpu} ({err}). "
                            "Retrying automatically in CPU mode (num_gpu=0)..."
                        )
                        try:
                            data = await self._send_chat_request(client, formatted_messages, 0)
                            return data["message"]["content"]
                        except Exception as cpu_err:
                            logger.error(f"Ollama CPU fallback also failed: {cpu_err}")
                            raise err
                    raise
        except httpx.ConnectError:
            return (
                f"⚠️ Could not connect to Ollama at {self.base_url}. "
                "Please make sure Ollama is running ('ollama serve'), "
                "or set AI_PROVIDER=gemini in backend/.env for instant cloud AI with zero GPU usage."
            )
        except httpx.HTTPStatusError as e:
            return f"⚠️ Ollama API error ({e.response.status_code}): {e.response.text}"
        except httpx.TimeoutException:
            return (
                "⚠️ Request to Ollama timed out. When running on CPU, generation may take a little longer. "
                "You can increase OLLAMA_TIMEOUT in backend/.env or use a lighter model like llama3.2."
            )
        except Exception as e:
            return f"⚠️ LLM generation error: {str(e)}"