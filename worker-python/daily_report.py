import os
import sys
import requests
from pymongo import MongoClient

# Database Configuration
MONGO_URL = "mongodb://127.0.0.1:27017"
DB_NAME = "insightforge"

mongo = MongoClient(MONGO_URL)
db = mongo[DB_NAME]
jobs = db["jobs"]

def send_daily_report_to_user(email: str, name: str):
    print(f"Gathering metrics from MongoDB for {name} ({email})...")
    
    
    all_jobs = list(jobs.find({}).sort("_id", -1).limit(7))
    
    total_links = len(all_jobs)
    words_summarized = sum([j.get('wordCount', 0) for j in all_jobs])
    read_time_saved = f"{max(1, words_summarized // 200)} mins"
    
    recent_links = [{"url": j["url"], "title": j.get("url"), "summary": j.get("summary", "No summary available")} for j in all_jobs]

    payload = {
        "email": email,
        "name": name,
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
        print(f"✅ Daily report successfully generated and sent to {email}!")
    except Exception as e:
        print(f"❌ Failed to reach the Node Email API generating the daily report: {e}")

if __name__ == "__main__":
    print("-" * 40)
    print("InsightForge Scheduled Reporter")
    print("-" * 40)
    
    if len(sys.argv) == 3:
        target_email = sys.argv[1]
        target_name = sys.argv[2]
        send_daily_report_to_user(target_email, target_name)
    else:
        print("Usage: python daily_report.py [email] [name]")
        print("Example: python daily_report.py test@example.com Varun")
