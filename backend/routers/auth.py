# app/routers/auth.py
from fastapi import APIRouter, HTTPException, status, Depends
from slowapi import Limiter
from slowapi.util import get_remote_address
from datetime import datetime, timedelta

from jose import jwt
from backend.core.config import settings
from backend.core.security import ALGORITHM

from backend.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from backend.dependencies import get_current_user
from backend.models.user import UserCreate, UserLogin, UserOut, AuthResponse, TokenRefresh
from backend.db import users_collection, refresh_tokens_collection

router = APIRouter(prefix="/auth", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)   # global limiter instance (also set in main.py)

@router.post("/signup", response_model=AuthResponse)
@limiter.limit("5/minute")   # D: rate limiting
async def signup(user_in: UserCreate):
    if await users_collection.find_one({"username": user_in.username}):
        raise HTTPException(status_code=400, detail="Username already registered. Please choose a different username.")  # B: clear message

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

    access_token = create_access_token(user_in.username)
    refresh_token = create_refresh_token(user_in.username)

    await refresh_tokens_collection.insert_one({
        "user_id": user_in.username,
        "token": refresh_token,
        "expires_at": datetime.utcnow() + timedelta(days=7)
    })

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserOut(
            id=str(result.inserted_id),
            username=user_in.username,
            full_name=user_in.full_name,
            created_at=user_doc["created_at"]
        )
    )

@router.post("/login", response_model=AuthResponse)
@limiter.limit("5/minute")   # D: rate limiting
async def login(user_in: UserLogin):
    user_doc = await users_collection.find_one({"username": user_in.username})
    if not user_doc or not verify_password(user_in.password, user_doc["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password. Please try again.",  # B: helpful message
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(user_in.username)
    refresh_token = create_refresh_token(user_in.username)

    # Rotate: delete old refresh tokens for this user (optional security)
    await refresh_tokens_collection.delete_many({"user_id": user_in.username})

    await refresh_tokens_collection.insert_one({
        "user_id": user_in.username,
        "token": refresh_token,
        "expires_at": datetime.utcnow() + timedelta(days=7)
    })

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserOut(
            id=str(user_doc["_id"]),
            username=user_doc["username"],
            full_name=user_doc.get("full_name"),
            created_at=user_doc["created_at"]
        )
    )

@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(token_data: TokenRefresh):
    try:
        payload = jwt.decode(token_data.refresh_token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if payload.get("type") != "refresh" or not username:
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

    access_token = create_access_token(username)
    new_refresh = create_refresh_token(username)

    await refresh_tokens_collection.insert_one({
        "user_id": username,
        "token": new_refresh,
        "expires_at": datetime.utcnow() + timedelta(days=7)
    })

    user_doc = await users_collection.find_one({"username": username})
    return AuthResponse(
        access_token=access_token,
        refresh_token=new_refresh,
        user=UserOut(
            id=str(user_doc["_id"]),
            username=username,
            full_name=user_doc.get("full_name"),
            created_at=user_doc["created_at"]
        )
    )

@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: UserOut = Depends(get_current_user)):
    return current_user