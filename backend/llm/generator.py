"""
LLM Generator: produces grounded answers using retrieved context + Gemini.
Uses the google-genai SDK.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import GEMINI_API_KEY, LLM_MODEL

from google import genai
from google.genai import types

# Initialize Gemini client
client = genai.Client(api_key=GEMINI_API_KEY)

SYSTEM_PROMPT = """You are a helpful JEE Physics tutor. Answer the student's question using ONLY the provided context from the study material.

Rules:
1. Base your answer strictly on the provided context. Do not use external knowledge.
2. If the context doesn't contain enough information to answer, say: "I don't have enough information in the provided chapters to answer this question fully."
3. Be concise but thorough. Use formulas, examples, and step-by-step explanations where appropriate.
4. Format your response clearly with proper structure (use bullet points, numbered lists, and bold text for key terms).
5. If a formula is relevant, always state it clearly.
6. Reference which chapter/section the information comes from when possible.
7. If the student asks something unrelated to JEE Physics, politely redirect them."""


def build_context(chunks: list[dict]) -> str:
    """Build context string from retrieved chunks."""
    context_parts = []
    for i, chunk in enumerate(chunks):
        header = f"[Source {i+1}: {chunk['chapter']} — {chunk['section']}]"
        context_parts.append(f"{header}\n{chunk['text']}")

    return "\n\n---\n\n".join(context_parts)


def generate_answer(
    question: str,
    chunks: list[dict],
    conversation_history: list[dict] | None = None,
) -> str:
    """
    Generate a grounded answer using retrieved context.
    """
    context = build_context(chunks)

    # Build conversation history for Gemini
    history = []
    if conversation_history:
        for msg in conversation_history[-6:]:
            role = "user" if msg.get("role") == "user" else "model"
            history.append(types.Content(
                role=role,
                parts=[types.Part.from_text(text=msg.get("content", ""))],
            ))

    # Build user message with context
    user_message = f"""Context from study material:

{context}

---

Student's Question: {question}

Please provide a clear, grounded answer based on the context above."""

    try:
        response = client.models.generate_content(
            model=LLM_MODEL,
            contents=history + [
                types.Content(
                    role="user",
                    parts=[types.Part.from_text(text=user_message)],
                )
            ],
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.3,
                max_output_tokens=1000,
            ),
        )
        return response.text
    except Exception as e:
        return f"Sorry, I encountered an error generating the answer: {str(e)}"
