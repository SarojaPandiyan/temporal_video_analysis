# backend/db.py
from motor.motor_asyncio import AsyncIOMotorClient
from motor.motor_asyncio import AsyncIOMotorGridFSBucket  
from backend.core.config import settings

client = AsyncIOMotorClient(settings.MONGODB_URL)
db = client[settings.MONGODB_DB_NAME]

users_collection = db["users"]
refresh_tokens_collection = db["refresh_tokens"]

fs = AsyncIOMotorGridFSBucket(db, bucket_name="profile_pictures")