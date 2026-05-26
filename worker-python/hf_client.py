import os
import requests

HF_TOKEN = os.getenv("HF_API_TOKEN")
HEADERS = {"Authorization": f"Bearer {HF_TOKEN}"}

def summarize(text):
    response = requests.post(
        "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
        headers=HEADERS,
        json={"inputs": text[:4000]},
        timeout=30
    )
    return response.json()[0]["summary_text"]

def classify(text):
    response = requests.post(
        "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
        headers=HEADERS,
        json={
            "inputs": text[:2000],
            "parameters": {
                "candidate_labels": [
                    "Technology", "AI", "Education",
                    "Finance", "Health", "Politics"
                ]
            }
        },
        timeout=30
    )
    return response.json()["labels"][:2]
