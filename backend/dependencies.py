from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from bson.objectid import ObjectId  # ← NEW import

from backend.core.config import settings
from backend.models.user import UserOut
from backend.db import users_collection

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserOut:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")  # sub is now user ID (str)
        if user_id is None or payload.get("type") == "refresh":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})  # ← CHANGED: lookup by _id
    if user_doc is None:
        raise credentials_exception

    return UserOut(
        id=str(user_doc["_id"]),
        username=user_doc["username"],
        full_name=user_doc.get("full_name"),
        created_at=user_doc["created_at"],
    )