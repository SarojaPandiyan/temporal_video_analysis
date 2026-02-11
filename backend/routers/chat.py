# backend/routers/chat.py
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated, List
from datetime import datetime
from bson.objectid import ObjectId
import google.generativeai as genai
import os

from backend.dependencies import get_current_user
from backend.models.user import UserOut
from backend.models.message import ChatMessage, ChatSession, MessageRole, ChatRequest, ChatHistory, ChatMessages
from backend.db import chat_sessions_collection, events_collection
from backend.core.config import settings
from backend.utils.time_extraction import extract_time_range

router = APIRouter(prefix="/chat", tags=["chat"])

# Configure Gemini
genai.configure(api_key=settings.GOOGLE_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")  # or gemini-1.5-pro

@router.get('/messages/{session_id}', response_model=ChatMessages)
async def get_messages(
    session_id: str,
    current_user: Annotated[UserOut, Depends(get_current_user)] = None
):
    print(session_id)
    print(current_user.id)
    session_doc = await chat_sessions_collection.find_one({
        "session_id": session_id,
        "user_id": current_user.id
    })
    print(session_doc)
    
    if not session_doc:
        raise HTTPException(404, "Chat session not found or not yours")

    messages = session_doc.get("messages", [])
    return ChatMessages(session_id=session_id, messages=messages)

@router.post("/message", response_model=ChatMessage)
async def send_chat_message(
    request: ChatRequest,
    current_user: Annotated[UserOut, Depends(get_current_user)]
):
    content = request.content.strip()
    session_id = request.session_id

    if not content:
        raise HTTPException(400, "Message cannot be empty")

    if session_id:
        session_doc = await chat_sessions_collection.find_one({
            "session_id": session_id,
            "user_id": current_user.id
        })
        if not session_doc:
            raise HTTPException(404, "Chat session not found or not yours")
    else:
        session_id = str(ObjectId())                     # Generate once

        new_session = ChatSession(
            session_id=session_id,
            user_id=str(current_user.id),
            title=content[:50] + "..." if len(content) > 50 else content,     # updated_at will be auto-filled by default_factory
        )

        await chat_sessions_collection.insert_one(
            new_session.model_dump(by_alias=True)
        )

    user_msg = ChatMessage(
        id=str(ObjectId()),
        session_id=session_id,
        role=MessageRole.USER,
        content=content
    )

    await chat_sessions_collection.update_one(
        {"session_id": session_id},
        {
            "$push": {"messages": user_msg.model_dump(by_alias=True)},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )

    time_context = ""
    start_dt, end_dt = extract_time_range(content)

    if start_dt and end_dt:
        events = await events_collection.find({
            "entry_time": {
                "$gte": start_dt,
                "$lte": end_dt
            }
        }).sort("entry_time", 1).to_list(50)

        if events:
            time_context = f"Events recorded between {start_dt} and {end_dt}:\n"
            for e in events:
                time_context += (
                    f"- {e.get('object_type','object')} "
                    f"({e.get('color','unknown color')}) "
                    f"entered at {e['entry_time']} "
                    f"and exited at {e.get('exit_time','still active')}\n"
                )
        else:
            time_context = f"No events recorded between {start_dt} and {end_dt}."

    system_prompt = """
You are a helpful video surveillance assistant.
You analyze security camera entry and exit events.
Summarize time-based activity clearly and accurately.
If no relevant data exists, say so honestly.
"""

    messages_for_gemini = [
        {"role": "user", "parts": [system_prompt]},
        {"role": "model", "parts": ["Understood."]},
        {"role": "user", "parts": [f"User question: {content}\n\n{time_context}"]}
    ]
    
    try:
        response = model.generate_content(messages_for_gemini)
        answer = response.text.strip()
    except Exception as e:
        raise HTTPException(500, f"LLM error: {str(e)}")

    assistant_msg = ChatMessage(
        id=str(ObjectId()),
        session_id=session_id,
        role=MessageRole.ASSISTANT,
        content=answer,
        metadata={"model_name": "gemini-2.5-flash"}
    )

    await chat_sessions_collection.update_one(
        {"session_id": session_id},
        {
            "$push": {"messages": assistant_msg.model_dump(by_alias=True)},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )

    return assistant_msg

@router.get("/fetch-history", response_model=ChatHistory)
async def get_chat_history(
    current_user: Annotated[UserOut, Depends(get_current_user)]
):
    try:
        projection = {
            "session_id": 1,
            "user_id": 1,
            "title": 1,
            "updated_at": 1,
            "_id": 0
        }

        cursor = chat_sessions_collection.find(
            {"user_id": current_user.id},
            projection=projection
        )
        
        sessions = []
        async for doc in cursor:
            sessions.append(doc)
        return ChatHistory(chat_sessions=sessions)
    except Exception as e:
        print("Error: ", str(e))