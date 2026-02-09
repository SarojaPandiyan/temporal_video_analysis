# backend/routers/chat.py
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated, List
from datetime import datetime
from bson.objectid import ObjectId
import google.generativeai as genai
import os

from backend.dependencies import get_current_user
from backend.models.user import UserOut
from backend.models.message import ChatMessage, ChatSession, MessageRole, ChatRequest
from backend.db import chat_sessions_collection, events_collection
from backend.core.config import settings

router = APIRouter(prefix="/chat", tags=["chat"])

# Configure Gemini
genai.configure(api_key=settings.GOOGLE_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")  # or gemini-1.5-pro

@router.post("/message", response_model=ChatMessage)
async def send_chat_message(
    request: ChatRequest,
    current_user: Annotated[UserOut, Depends(get_current_user)] = None
):
    content = request.content
    session_id = request.session_id
    if not content.strip():
        raise HTTPException(400, "Message cannot be empty")
    if session_id:
        session_doc = await chat_sessions_collection.find_one({
            "_id": ObjectId(session_id),
            "user_id": current_user.id
        })
        if not session_doc:
            raise HTTPException(404, "Chat session not found or not yours")
    else:
        # Create new session
        new_session = ChatSession(
            session_id=str(ObjectId()),
            user_id=current_user.id,
            title=content[:50] + "..." if len(content) > 50 else content,
        )
        result = await chat_sessions_collection.insert_one(new_session.model_dump(by_alias=True))
        session_id = str(result.inserted_id)
        session_doc = new_session.model_dump(by_alias=True)

    user_msg = ChatMessage(
        id=str(ObjectId()),
        session_id=session_id,
        role=MessageRole.USER,
        content=content,
    )
    await chat_sessions_collection.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$push": {"messages": user_msg.model_dump(by_alias=True)},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )

    time_context = ""
    if any(word in content.lower() for word in ["between", "from", "since", "until", "during", "time", "when"]):
        # Simple time extraction (you can improve with regex/NLP later)
        # For now, assume user provides timestamps in message
        events = await events_collection.find({
            "entry_time": {"$exists": True}
            # You can add real time filtering later
        }).to_list(20)

        if events:
            time_context = "Relevant events in the database:\n"
            for e in events:
                time_context += f"- {e.get('object_type')} ({e.get('color') or 'unknown color'}) entered at {e['entry_time']} and exited at {e.get('exit_time', 'still active')}\n"

    # ────────────────────────────────────────────────
    # 4. Build prompt for Gemini
    # ────────────────────────────────────────────────
    system_prompt = """
You are a helpful video surveillance assistant. 
You analyze entry/exit events from security cameras.
Answer naturally and concisely.
If you have time-based events, summarize what happened.
If no relevant data, say so honestly.
"""

    messages_for_gemini = [
        {"role": "user", "parts": [system_prompt]},
        {"role": "model", "parts": ["Understood. I will answer based on the provided events."]},
    ]

    # Add recent conversation context (last 6 messages)
    print(session_doc)
    # recent_msgs = session_doc["messages"][-6:]
    # for msg in recent_msgs:
    #     role = "user" if msg["role"] == MessageRole.USER else "model"
    #     messages_for_gemini.append({"role": role, "parts": [msg["content"]]})

    # Add current question + time context
    full_prompt = f"User question: {content}\n\n{time_context}"
    messages_for_gemini.append({"role": "user", "parts": [full_prompt]})

    # ────────────────────────────────────────────────
    # 5. Call Gemini
    # ────────────────────────────────────────────────
    try:
        response = model.generate_content(messages_for_gemini)
        answer = response.text.strip()
    except Exception as e:
        raise HTTPException(500, f"LLM error: {str(e)}")

    # ────────────────────────────────────────────────
    # 6. Save assistant reply
    # ────────────────────────────────────────────────
    assistant_msg = ChatMessage(
        id=str(ObjectId()),
        session_id=session_id,
        role=MessageRole.ASSISTANT,
        content=answer,
        metadata={"model_name": "gemini-2.5-flash"}
    )

    await chat_sessions_collection.update_one(
        {"_id": ObjectId(session_id)},
        {
            "$push": {"messages": assistant_msg.model_dump(by_alias=True)},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )

    return assistant_msg