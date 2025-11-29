from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

from src.config import settings
from src.jobs.router import jobs_router
from src.utils import group

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
    yield
    app.state.openai_client = None


api_v1_router = group(
    "/api/v1",
    (jobs_router, "/jobs", ["Jobs"]),
)


@app.get("/health")
def health():
    return {"message": "Server is Healthy"}
