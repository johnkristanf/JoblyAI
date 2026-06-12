from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.resume.router import resume_router
from src.user.router import user_route
from src.job.router import job_router
from src.celery.router import celery_router
from src.interview.router import interview_router
from src.utils import group
from src.database import Database
import os
import time


@asynccontextmanager
async def lifespan(app: FastAPI):
    Database.connect_async_session()
    Database.connect_redis()
    yield
    await Database.close()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "https://jobly-ai-weld.vercel.app", 
        "https://49ff-110-54-206-6.ngrok-free.app",
        "http://192.168.43.253:3000",
        "http://192.168.43.253"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str):
    return JSONResponse(
        status_code=204,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
            "Access-Control-Allow-Headers": "Authorization,Content-Type",
            "Access-Control-Allow-Credentials": "true", 
        },
    )


api_v1_router = group(
    "/api/v1",
    (job_router, "/job", ["Job"]),
    (user_route, "/user", ["User"]),
    (resume_router, "/resume", ["Resume"]),
    (celery_router, "/celery", ["Celery"]),
    (interview_router, "/interview", ["Interview"]),
)

app.include_router(api_v1_router)


@app.get("/health")
def check_server_health():
    return {"message": "Server is Healthy"}


@app.post("/api/v1/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    public_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../client/public"))
    os.makedirs(public_dir, exist_ok=True)
    filename = f"recording_{int(time.time())}_{file.filename}"
    file_path = os.path.join(public_dir, filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())
    return {"message": "File saved", "path": filename}
