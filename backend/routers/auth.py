# backend/routers/auth.py
from fastapi import APIRouter, HTTPException, status, Depends, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from datetime import datetime, timedelta
from bson.objectid import ObjectId  # ← NEW import

from jose import jwt
from backend.core.config import settings

from backend.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from backend.dependencies import get_current_user
from backend.models.user import UserCreate, UserLogin, UserOut, AuthResponse, TokenRefresh
from backend.db import users_collection, refresh_tokens_collection

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)

@router.post("/signup", response_model=AuthResponse)
@limiter.limit("5/minute")
async def signup(request: Request, user_in: UserCreate):
    if await users_collection.find_one({"username": user_in.username}):
        raise HTTPException(status_code=400, detail="Username already registered. Please choose a different username.")

    if await users_collection.find_one({"email": user_in.email}):
        raise HTTPException(status_code=400, detail="Email already registered.")

    hashed = get_password_hash(user_in.password)
    user_doc = {
        "username": user_in.username,
        "email": user_in.email,
        "full_name": user_in.full_name,
        "hashed_password": hashed,
        "created_at": datetime.utcnow()
    }
    result = await users_collection.insert_one(user_doc)

    user_id = str(result.inserted_id)  # ← NEW: use ID for tokens

    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)

    await refresh_tokens_collection.insert_one({
        "user_id": user_id,  # ← CHANGED: use ID instead of username
        "token": refresh_token,
        "expires_at": datetime.utcnow() + timedelta(days=7)
    })

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserOut(
            id=user_id,
            username=user_in.username,
            full_name=user_in.full_name,
            created_at=user_doc["created_at"]
        )
    )

@router.post("/login", response_model=AuthResponse)
@limiter.limit("5/minute")
async def login(request: Request, user_in: UserLogin):
    user_doc = await users_collection.find_one({"username": user_in.username})
    if not user_doc or not verify_password(user_in.password, user_doc["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password. Please try again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = str(user_doc["_id"])  # ← NEW: use ID for tokens

    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)

    # Rotate: delete old refresh tokens for this user
    await refresh_tokens_collection.delete_many({"user_id": user_id})  # ← CHANGED: use ID

    await refresh_tokens_collection.insert_one({
        "user_id": user_id,  # ← CHANGED: use ID
        "token": refresh_token,
        "expires_at": datetime.utcnow() + timedelta(days=7)
    })

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserOut(
            id=user_id,
            username=user_doc["username"],
            full_name=user_doc.get("full_name"),
            created_at=user_doc["created_at"]
        )
    )

@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(token_data: TokenRefresh):
    try:
        payload = jwt.decode(token_data.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")  # ← CHANGED: sub is now ID
        if payload.get("type") != "refresh" or not user_id:
            raise HTTPException(status_code=401, detail="Invalid refresh token.")
    except:
        raise HTTPException(status_code=401, detail="Invalid refresh token.")

    token_doc = await refresh_tokens_collection.find_one({
        "token": token_data.refresh_token,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    if not token_doc:
        raise HTTPException(status_code=401, detail="Refresh token expired or revoked. Please log in again.")

    # Rotate
    await refresh_tokens_collection.delete_one({"token": token_data.refresh_token})

    access_token = create_access_token(user_id)
    new_refresh = create_refresh_token(user_id)

    await refresh_tokens_collection.insert_one({
        "user_id": user_id,  # ← CHANGED: use ID
        "token": new_refresh,
        "expires_at": datetime.utcnow() + timedelta(days=7)
    })

    user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})  # ← CHANGED: lookup by ID
    return AuthResponse(
        access_token=access_token,
        refresh_token=new_refresh,
        user=UserOut(
            id=user_id,
            username=user_doc["username"],
            full_name=user_doc.get("full_name"),
            created_at=user_doc["created_at"]
        )
    )

@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: UserOut = Depends(get_current_user)):
    return current_user