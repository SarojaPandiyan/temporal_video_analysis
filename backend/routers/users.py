# backend/routers/users.py
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
    Response,
)
from fastapi.responses import StreamingResponse
from bson.objectid import ObjectId
from typing import Annotated

from backend.dependencies import get_current_user
from backend.models.user import UserOut, UserUpdate
from backend.db import users_collection, fs, refresh_tokens_collection 
from backend.core.config import settings

router = APIRouter(prefix="/users", tags=["users"])

@router.patch("/me", response_model=UserOut)
async def update_profile(
    update_data: UserUpdate,
    current_user: Annotated[UserOut, Depends(get_current_user)],
):
    update_dict = update_data.model_dump(exclude_unset=True)
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    if "username" in update_dict:
        existing = await users_collection.find_one(
            {"username": update_dict["username"], "_id": {"$ne": ObjectId(current_user.id)}}
        )
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")

    updated_user = await users_collection.find_one_and_update(
        {"_id": ObjectId(current_user.id)},
        {"$set": update_dict},
        return_document=True,
    )

    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found")

    if "username" in update_dict:
        # No need to update refresh_tokens anymore - since user_id is ID, not username

        pass

    return UserOut(
        id=str(updated_user["_id"]),
        username=updated_user["username"],
        email=updated_user.get("email"),
        full_name=updated_user.get("full_name"),
        profile_picture_url=updated_user.get("profile_picture_url"),
        created_at=updated_user["created_at"],
    )

@router.post("/me/profile-picture", response_model=UserOut)
async def upload_profile_picture(
    current_user: Annotated[UserOut, Depends(get_current_user)],
    file: UploadFile = File(...),
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, detail="File must be an image")

    try:
        # Read file content
        contents = await file.read()

        # Upload to GridFS
        file_id = await fs.upload_from_stream(
            filename=file.filename,
            source=contents,
            metadata={
                "contentType": file.content_type,
                "user_id": current_user.id,
            }
        )

        # Generate URL
        picture_url = f"{settings.API_BASE_URL or 'http://localhost:8000'}/files/{str(file_id)}"

        # Update user document
        updated = await users_collection.find_one_and_update(
            {"_id": ObjectId(current_user.id)},
            {"$set": {"profile_picture_url": picture_url}},
            return_document=True,
        )

        if not updated:
            raise HTTPException(404, "User not found")

        return UserOut(
            id=str(updated["_id"]),
            username=updated["username"],
            email=updated.get("email"),
            full_name=updated.get("full_name"),
            profile_picture_url=updated.get("profile_picture_url"),
            created_at=updated["created_at"],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/files/{file_id}")
async def get_file(file_id: str):
    try:
        grid_out = await fs.open_download_stream(ObjectId(file_id))
        content_type = grid_out.metadata.get("contentType", "application/octet-stream")

        return StreamingResponse(
            grid_out,
            media_type=content_type,
            headers={"Content-Disposition": f"inline; filename={grid_out.filename}"},
        )
    except:
        raise HTTPException(status_code=404, detail="File not found")