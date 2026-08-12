import os
from pymongo import MongoClient
#adding of the mongo_url
mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(mongo_uri)
db = client["readinglist"]
jobs = db["jobs"]

