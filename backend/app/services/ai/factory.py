from app.core.config import settings
from app.services.ai.base import BaseAIProvider
from app.services.ai.ollama_provider import OllamaProvider
from app.services.ai.mock_provider import MockProvider
from app.services.ai.gemini_provider import GeminiProvider

def get_ai_provider() -> BaseAIProvider:
    provider = settings.AI_PROVIDER.lower()
    if provider == "ollama":
        return OllamaProvider()
    elif provider == "gemini":
        return GeminiProvider()
    elif provider == "mock":
        return MockProvider()
    raise ValueError(f"Unsupported AI Provider: {settings.AI_PROVIDER}")