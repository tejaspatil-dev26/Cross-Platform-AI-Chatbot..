import logging
from fastapi import APIRouter, HTTPException, Depends
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.ai.base import BaseAIProvider
from app.services.ai.factory import get_ai_provider
from app.core.config import settings
from app.services.rag import retriever

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("", response_model=ChatResponse)
@router.post("/", response_model=ChatResponse)
async def chat_completion(

    request: ChatRequest,
    ai_provider: BaseAIProvider = Depends(get_ai_provider)
):
    try:
        messages = [{"role": msg.role, "content": msg.content} for msg in request.history]
        messages.append({"role": "user", "content": request.message})

        final_system_prompt = request.system_prompt
        sources = []
        rag_applied = False

        # Attempt RAG context retrieval if enabled
        if settings.RAG_ENABLED and request.use_rag:
            try:
                context_str, retrieved_sources = retriever.retrieve_context(request.message)
                if context_str:
                    final_system_prompt = retriever.build_rag_system_prompt(
                        context_str=context_str,
                        base_prompt=request.system_prompt
                    )
                    sources = retrieved_sources
                    rag_applied = True
                    logger.info(f"RAG applied with {len(sources)} source chunks for query: '{request.message[:40]}'")
            except Exception as e:
                logger.warning(f"RAG retrieval skipped due to error: {e}")

        bot_reply = await ai_provider.generate_response(
            messages=messages,
            system_prompt=final_system_prompt
        )
        return ChatResponse(
            response=bot_reply,
            sources=sources,
            rag_applied=rag_applied
        )
    except Exception as e:
        logger.error(f"Chat completion failed: {e}")
        raise HTTPException(status_code=500, detail=f"LLM generation failed: {str(e)}")