from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

from src.config import settings
from src.job.router import job_router
from src.utils import group

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




api_v1_router = group(
    "/api/v1",
    (job_router, "/job", ["Job"]),
)

app.include_router(api_v1_router)


@app.get("/health")
def check_server_health():
    return {"message": "Server is Healthy"}
