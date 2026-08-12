from celery import Celery
from dotenv import load_dotenv

load_dotenv(override=True)

import os

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
#celery declaration
app = Celery(
    "worker",
    broker=redis_url,
    backend=redis_url,
    include=["tasks"]
)

