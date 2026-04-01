# from pymongo import MongoClient

# client = MongoClient("mongodb://localhost:27017/") 
# db = client["video_analytics"]
# collection = db["events"]

# def save_event(event):
#     collection.insert_one(event)
# # ------------------------
from pymongo import MongoClient
from pymongo.errors import PyMongoError
import logging

logger = logging.getLogger(__name__)

_client = None
_collection = None


def _get_collection():
    """Lazy-init MongoDB connection so import never crashes the app."""
    global _client, _collection
    if _collection is None:
        _client = MongoClient(
            "mongodb://localhost:27017/",
            serverSelectionTimeoutMS=3000,  # fail fast if Mongo is down
        )
        db = _client["video_analytics"]
        _collection = db["events"]
    return _collection


def save_event(event):
    """Insert an event document. Logs and continues on failure."""
    try:
        _get_collection().insert_one(event)
    except PyMongoError as e:
        logger.error("MongoDB save_event failed: %s", e)

