from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from celery.result import AsyncResult
from urllib.parse import urlparse

from celery_app import app as celery_app
from tasks import scrape_url
from pymongo import MongoClient
import redis
import requests


# FASTAPI APP

fastapi_app = FastAPI()

# =====================================================
# CORS (REQUIRED FOR BROWSER)
# =====================================================
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # ⚠️ allow all for the development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# REDIS
# =====================================================
redis_client = redis.Redis(
    host="localhost",
    port=6379,
    db=0,
    decode_responses=True
)

# =====================================================
# MONGODB
# =====================================================
mongo = MongoClient("mongodb://127.0.0.1:27017")
db = mongo["insightforge"]
jobs = db["jobs"]

# =====================================================
# HELPERS
# =====================================================
def normalize_url(url: str) -> str:
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip("/")

# =====================================================
# REQUEST MODEL
# =====================================================
class EnqueueRequest(BaseModel):
    url: str

# =====================================================
# ENQUEUE URL
# =====================================================
@fastapi_app.post("/enqueue")
def enqueue(req: EnqueueRequest):
    url = normalize_url(req.url)

    #
    cached_job = redis_client.get(f"url:{url}")
    if cached_job:
        return {
            "jobId": cached_job,
            "cached": True
        }

    task = scrape_url.delay(url)

    redis_client.setex(
        f"url:{url}",
        3600,
        task.id
    )

    return {
        "jobId": task.id,
        "cached": False
    }

# =====================================================
# CHECK JOB STATUS

@fastapi_app.get("/status/{job_id}")
def get_status(job_id: str):
    result = AsyncResult(job_id, app=celery_app)

    if result.state == "PENDING":
        return {"status": "PENDING"}

    if result.state == "SUCCESS":
        return {"status": "SUCCESS"}

    if result.state == "FAILURE":
        return {"status": "FAILED"}

    return {"status": result.state}

# =====================================================
# FETCH FINAL RESULT
# =====================================================
@fastapi_app.get("/result/{job_id}")
def get_result(job_id: str):
    doc = jobs.find_one(
        {"jobId": job_id},
        {"_id": 0}   # ❗ remove Mongo ObjectId
    )

    if not doc:
        return {"status": "NOT_FOUND"}

    return doc

# =====================================================
# TRIGGER REPORT EMAIL
# =====================================================
class ReportRequest(BaseModel):
    name: str
    email: str

@fastapi_app.post("/trigger-report")
def trigger_report(req: ReportRequest):
    all_jobs = list(jobs.find({}).sort("_id", -1).limit(7))
    total_links = len(all_jobs)
    words_summarized = sum([j.get('wordCount', 0) for j in all_jobs])
    read_time_saved = f"{max(1, words_summarized // 200)} mins"
    
    recent_links = [{"url": j["url"], "title": j.get("url")} for j in all_jobs]

    payload = {
        "email": req.email,
        "name": req.name,
        "stats": {
            "totalLinks": total_links,
            "wordsSummarized": words_summarized,
            "readTimeSaved": read_time_saved
        },
        "recentLinks": recent_links
    }

    try:
        res = requests.post("http://localhost:5000/api/email/report", json=payload)
        res.raise_for_status()
        return {"status": "SUCCESS"}
    except Exception as e:
        return {"status": "FAILED", "error": str(e)}
