import asyncio
from typing import List, Dict
from app.services.ai.base import BaseAIProvider

class MockProvider(BaseAIProvider):
    async def generate_response(self, messages: List[Dict[str, str]], system_prompt: str = "") -> str:
        # Simulate network delay
        await asyncio.sleep(1)
        
        last_message = messages[-1]["content"] if messages else ""
        return f"Hello! I am a Mock AI. I received your message: '{last_message}'. (Configure Ollama in your .env file to talk to a real AI!)"
