"""AI Chat router — Claude-powered CFA study assistant."""

import os
import logging
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

import anthropic

from app.database import get_db
from app.deps import current_user_id

router = APIRouter(prefix="/api/ai", tags=["ai"])
logger = logging.getLogger("wingman.ai")

SYSTEM_PROMPT = """Tu es Wingman, un coach expert pour la preparation au CFA Level I.
Tu aides les candidats a maitriser le programme du CFA Level I.
Tu reponds TOUJOURS en francais, meme si l'utilisateur ecrit en anglais.

Tes capacites :
- Expliquer clairement tout concept du CFA L1
- Proposer des quiz sur les sujets etudies
- Donner des astuces d'examen, moyens mnemotechniques et strategies
- Identifier les points faibles et suggerer des priorites
- Creer des fiches de revision et resumes

Regles :
- Sois concis — les candidats sont presses
- Utilise des exemples et analogies pour clarifier
- Reference la structure du curriculum (topics, learning modules)
- Pour les formules, montre le raisonnement etape par etape
- Encourage et motive l'utilisateur
- Si tu n'es pas sur, dis-le plutot que de deviner

Topics CFA L1 : Quantitative Methods, Economics, Financial Statement Analysis,
Corporate Issuers, Equity Investments, Fixed Income, Derivatives,
Alternative Investments, Portfolio Management, Ethical & Professional Standards.
"""

MAX_HISTORY = 20  # keep last N messages to control token usage


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []  # [{role, content}]
    module_context: Optional[str] = None  # e.g. "FI-03 — Yield Measures"


class ChatResponse(BaseModel):
    reply: str
    usage: dict = {}


@router.post("/chat", response_model=ChatResponse)
async def ai_chat(
    req: ChatRequest,
    user_id: str = Depends(current_user_id),
    db: AsyncSession = Depends(get_db),
):
    _ = user_id
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key or api_key == "sk-REPLACE_ME":
        return ChatResponse(reply="API key not configured. Please set ANTHROPIC_API_KEY.", usage={})

    # Build messages from history
    messages = []
    for msg in req.history[-MAX_HISTORY:]:
        role = msg.get("role", "user")
        if role in ("user", "assistant"):
            messages.append({"role": role, "content": msg.get("content", "")})

    # Add context if studying a specific module
    user_content = req.message
    if req.module_context:
        user_content = f"[Currently studying: {req.module_context}]\n\n{req.message}"

    messages.append({"role": "user", "content": user_content})

    try:
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=messages,
        )
        reply_text = response.content[0].text
        usage = {
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
        }
        return ChatResponse(reply=reply_text, usage=usage)
    except anthropic.APIError as e:
        logger.error(f"Anthropic API error: {e}")
        return ChatResponse(reply=f"Erreur API: {e.message}", usage={})
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        return ChatResponse(reply="Une erreur est survenue. Réessayez.", usage={})
