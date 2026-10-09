from abc import ABC, abstractmethod
from typing import List, Dict

class BaseAIProvider(ABC):
    @abstractmethod
    async def generate_response(self, messages: List[Dict[str, str]], system_prompt: str = "") -> str:
        """Generate a text completion given a conversation history."""
        pass