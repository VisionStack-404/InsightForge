from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from urllib.parse import urlparse
import requests
from readability import Document
from bs4 import BeautifulSoup
import os
from groq import Groq
import uuid

# =====================================================
# FASTAPI APP
# =====================================================
fastapi_app = FastAPI()

# =====================================================
# CORS (REQUIRED FOR BROWSER)
# =====================================================
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# CLIENTS & CONFIG
# =========================
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
GROQ_MODEL = "llama-3.1-8b-instant"

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
You are InsightForge — an AI designed to turn web pages into clear, fast learning insights.

GOAL:
Help a user understand the essence of a web page in under 30 seconds.

STRICT RULES:
- Be concise and practical
- NO history unless essential
- NO step-by-step tutorials
- NO storytelling
- NO repetition
- Use simple, clear language
- Assume the reader is intelligent but short on time
- Extract and prioritize the most critical specifications and takeaways from the input below.

OUTPUT FORMAT (MUST FOLLOW EXACTLY):

Summary:
<3–5 short sentences explaining what this page is about and why it matters>

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
Extract 5 to 7 important technical topics.
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

# =====================================================
# REQUEST MODEL
# =====================================================
class EnqueueRequest(BaseModel):
    url: str

class ReportRequest(BaseModel):
    name: str
    email: str

# =====================================================
# SYNCHRONOUS SUMMARIZE ENDPOINT
# =====================================================
@fastapi_app.post("/api/summarize")
def summarize_endpoint(req: EnqueueRequest):
    url = normalize_url(req.url)
    job_id = str(uuid.uuid4())

    try:
        raw_text = extract_text(url)
        summary = rewrite_with_brain(raw_text)
        topics = extract_topics(summary)

        return {
            "jobId": job_id,
            "url": url,
            "status": "SUCCESS",
            "summary": summary,
            "topics": topics,
            "wordCount": len(summary.split())
        }
    except Exception as e:
        return {
            "jobId": job_id,
            "url": url,
            "status": "FAILED",
            "error": str(e)
        }

# =====================================================
# MOCK TRIGGER REPORT EMAIL (STATELESS)
# =====================================================
@fastapi_app.post("/trigger-report")
def trigger_report(req: ReportRequest):
    return {"status": "SUCCESS", "message": "Triggered via Node.js backend normally. This route is a placeholder."}

# =====================================================
# VERCEL COMPATIBILITY
# =====================================================
app = fastapi_app
