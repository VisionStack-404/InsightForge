from celery import Celery
from dotenv import load_dotenv

load_dotenv(override=True)

app = Celery(
    "worker",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
    include=["tasks"]
)
