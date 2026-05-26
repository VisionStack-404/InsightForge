import requests
import os
token = os.getenv("HF_TOKEN")

url = "https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn"

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

payload = {
    "inputs": "Artificial Intelligence is transforming the world."
}

res = requests.post(url, headers=headers, json=payload)
print(res.status_code)
print(res.text)
