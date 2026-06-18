from celery_app import app
import requests
from readability import Document
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from pymongo import MongoClient
import redis
import json
import os
from groq import Groq

# =========================
# CONFIG
# =========================
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
MONGO_URL = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = "insightforge"

# ✅ SAFE, ACTIVE MODEL
GROQ_MODEL = "llama-3.1-8b-instant"



# =========================
# CLIENTS
# =========================
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
mongo = MongoClient(MONGO_URL)
db = mongo[DB_NAME]
jobs = db.jobs


# =========================
# HELPERS
# =========================
def normalize_url(url: str) -> str:
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip("/")


def extract_text(url: str) -> str:
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }
    response = requests.get(url, headers=headers, timeout=15)
    response.raise_for_status()

    doc = Document(response.text)
    html = doc.summary()
    soup = BeautifulSoup(html, "html.parser")

    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()

    text = " ".join(soup.stripped_strings)
    
    return text[:45000]


def rewrite_with_brain(text: str) -> str:
    prompt = f"""
You are InsightForge — an AI designed to turn the web pages into clear, fast learning insights.

GOAL:
Help a user understand the essence of a web page in under 20 seconds.

STRICT RULES:
- Be concise and practical
- NO history unless essential
- NO step-by-step tutorials
- NO storytelling
- NO repetition
- Use simple, clear language and easy to understand
- Assume the reader is intelligent but short on time
-Extract and prioritize the most critical specifications and takeaways from the input below.

OUTPUT FORMAT (MUST FOLLOW EXACTLY):

Summary:
<3–8 short sentences explaining what this page is about and why it matters>

Key Topics:
- <short noun phrase>
- <short noun phrase>
- <short noun phrase>
- <short noun phrase>
- <short noun phrase>

Who this is for:
<one short sentence>

IMPORTANT:
If content is long or complex, compress harder.


CONTENT (for understanding only):
{text}
"""

    response = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.25
    )

    return response.choices[0].message.content.strip()


def extract_topics(summary: str) -> list:
    prompt = f"""
Extract 5 to 10important technical topics.
Return ONLY a comma-separated list.

TEXT:
{summary}
"""

    response = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1
    )

    return [t.strip() for t in response.choices[0].message.content.split(",") if t.strip()]


# =========================
# CELERY TASK
# =========================
@app.task(bind=True)
def scrape_url(self, url: str):
    job_id = self.request.id
    url = normalize_url(url)

    try:
        # 🔁 URL-level cache
        cached_job_id = redis_client.get(f"url:{url}")
        if cached_job_id:
            cached_data = redis_client.get(f"job:{cached_job_id}")
            if cached_data:
                return json.loads(cached_data)

        # 🧠 PROCESS
        raw_text = extract_text(url)
        summary = rewrite_with_brain(raw_text)
        topics = extract_topics(summary)

        result = {
            "jobId": job_id,
            "url": url,
            "status": "SUCCESS",
            "summary": summary,
            "topics": topics,
            "wordCount": len(summary.split())
        }

        # 🗄️ Mongo (INSERT COPY — CRITICAL)
        mongo_doc = dict(result)
        jobs.insert_one(mongo_doc)

        # ⚡ Redis cache (JSON-safe)
        redis_client.setex(f"job:{job_id}", 3600, json.dumps(result))
        redis_client.setex(f"url:{url}", 3600, job_id)

        return result

    except Exception as e:
        error_result = {
            "jobId": job_id,
            "url": url,
            "status": "FAILED",
            "error": str(e)
        }

        redis_client.setex(f"job:{job_id}", 600, json.dumps(error_result))
        return error_result
