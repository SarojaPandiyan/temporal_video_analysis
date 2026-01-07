from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017/") 
db = client["video_analytics"]
collection = db["events"]

def save_event(event):
    collection.insert_one(event)

