
import base64
import json
import re
import logging

from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from core.config_parser import GROQ_API_KEY, VISION_MODEL_ID, config
from langchain_groq import ChatGroq
from agent.prompts import (
    MEDICAL_ANALYSIS_SYSTEM_PROMPT,
    MEDICAL_ANALYSIS_HUMAN_PROMPT,
    MEDICAL_CHAT_SYSTEM_PROMPT
)

logger = logging.getLogger(__name__)

# 1. Initialize the LangChain Gemini Client
llm = ChatGroq(
    api_key=GROQ_API_KEY,
    model=VISION_MODEL_ID,
    temperature=float(config['MODEL']['temperature'])
)


def _extract_json(text: str) -> dict:
    """Robustly extract a JSON object from LLM output, handling code fences and extra text."""
    cleaned = text.strip()

    # Try direct parse first (fast path optimization)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Strip markdown code fences (```json ... ``` or ``` ... ```)
    fence_pattern = r"```(?:json)?\s*\n?(.*?)```"
    fence_match = re.search(fence_pattern, cleaned, re.DOTALL)
    if fence_match:
        try:
            return json.loads(fence_match.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Fallback: find the first { ... } block in the text
    brace_match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if brace_match:
        try:
            return json.loads(brace_match.group())
        except json.JSONDecodeError:
            pass

    # Nothing worked – raise with a short preview for debugging
    preview = text[:300] + ("..." if len(text) > 300 else "")
    raise ValueError(f"Could not extract valid JSON from LLM response. Preview: {preview}")


def analyze_medical_images(image_list: list[dict]) -> dict:
    """
    Accepts a list of in-memory image dicts [{"bytes": <raw_bytes>, "mime": "image/png"}, ...]
    Sends them to the Gemini Vision LLM and returns structured JSON.
    No file I/O is performed.
    """
    # 2. Add our strict instructions from agent/prompts.py
    messages = [SystemMessage(content=MEDICAL_ANALYSIS_SYSTEM_PROMPT)]
    
    # 3. Construct the Human Message containing the images (optimized using list comprehension)
    human_content = [{"type": "text", "text": MEDICAL_ANALYSIS_HUMAN_PROMPT}] + [
        {
            "type": "image_url",
            "image_url": {
                "url": f"data:{img['mime']};base64,{base64.b64encode(img['bytes']).decode('utf-8')}"
            }
        }
        for img in image_list
    ]
        
    messages.append(HumanMessage(content=human_content))
    
    # 4. Invoke the model
    try:
        response = llm.invoke(messages)
        return _extract_json(response.content)
        
    except ValueError:
        # Re-raise JSON extraction errors as-is
        raise
    except Exception as e:
        raise RuntimeError(f"Error communicating with Groq API: {str(e)}")


def chat_about_analysis(question: str, analysis: dict, history: list[dict] | None = None) -> str:
    """
    Ask the LLM a question using the structured `analysis` as context.
    Accepts optional conversation history for multi-turn memory.
    Each history entry: {"role": "user"|"assistant", "content": "..."}
    Returns the assistant's textual reply.
    """
    # Construct a system message that instructs the model to rely on the provided analysis
    formatted_prompt = MEDICAL_CHAT_SYSTEM_PROMPT.format(analysis=json.dumps(analysis, ensure_ascii=False))
    messages = [SystemMessage(content=formatted_prompt)]

    # Add conversation history for multi-turn context
    if history:
        for msg in history:
            role = msg.get("role")
            if role == "user":
                messages.append(HumanMessage(content=msg["content"]))
            elif role == "assistant":
                messages.append(AIMessage(content=msg["content"]))

    # Add the current question
    messages.append(HumanMessage(content=question))

    try:
        return llm.invoke(messages).content.strip()
    except Exception as e:
        raise RuntimeError(f"Error during chat with Groq: {str(e)}")