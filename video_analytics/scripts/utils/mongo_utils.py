# utils/mongo_utils.py
"""
MongoDB helpers for the CCTV analytics engine.

Collections
-----------
events – individual camera events (entry, exit, long_stay, stationary, resumed_moving)
"""

import logging
from pymongo import MongoClient
from pymongo.errors import PyMongoError

logger = logging.getLogger(__name__)

_client = None
_events = None


def _get_collection():
    """Lazy-init MongoDB connection; returns events collection."""
    global _client, _events
    if _events is None:
        _client = MongoClient(
            "mongodb://localhost:27017/",
            serverSelectionTimeoutMS=3000,
        )
        db      = _client["video_analytics"]
        _events = db["events"]

        try:
            _events.create_index([("camera_id", 1), ("event", 1)])
            _events.create_index([("local_id", 1)])
        except PyMongoError:
            pass   # indexes are a nice-to-have

    return _events


# ── events ────────────────────────────────────────────────────────────────

def save_event(event: dict):
    """Insert a single event document.  Logs and continues on failure."""
    try:
        col = _get_collection()
        col.insert_one(event)
    except PyMongoError as exc:
        logger.error("save_event failed: %s", exc)