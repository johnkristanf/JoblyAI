from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.resume.router import resume_router
from src.user.router import user_route
from src.job.router import job_router
from src.utils import group
from src.database import Database


@asynccontextmanager
async def lifespan(app: FastAPI):
    Database.connect_async_session()
    Database.connect_redis()
    yield
    await Database.close()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://jobly-ai-weld.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str):
    return JSONResponse(
        status_code=204,
        headers={
            "Access-Control-Allow-Origin": "https://jobly-ai-weld.vercel.app",
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
)

app.include_router(api_v1_router)


@app.get("/health")
def check_server_health():
    return {"message": "Server is Healthy"}
