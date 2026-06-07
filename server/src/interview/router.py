import logging
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status
from fastapi.concurrency import run_in_threadpool
from jose import jwt, JWTError

from src.config.runtime import params
from src.interview.service import InterviewService

logger = logging.getLogger("interview.router")

interview_router = APIRouter()


async def _verify_ws_token(token: str) -> dict:
    """
    Verify the Supabase JWT passed as a query param.
    Mirrors the logic in src/auth/dependencies.py but works without
    HTTP Bearer headers (WebSocket connections cannot send custom headers
    in the browser).
    """
    try:
        payload = await run_in_threadpool(
            jwt.decode,
            token,
            params["SUPABASE_JWT_SECRET"],
            algorithms=["HS256"],
            audience="authenticated",
        )
        user_id = payload.get("sub")
        if not user_id:
            return None
        return {"id": user_id, "email": payload.get("email")}
    except JWTError:
        return None


@interview_router.websocket("/ws")
async def interview_ws(
    websocket: WebSocket,
    job_title: str = Query(default="Software Engineer"),
    employer: str = Query(default=""),
    token: str = Query(...),
):
    """
    WebSocket endpoint for the AI mock interview.

    Query params:
        job_title  — role being interviewed for
        employer   — company name (used in the LLM system prompt)
        token      — Supabase JWT (passed as query param since browsers
                     cannot send Authorization headers on WebSocket upgrades)
    """
    user = await _verify_ws_token(token)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    logger.info(f"Interview session started — user={user['id']} job='{job_title}' employer='{employer}'")

    try:
        service = InterviewService()
        await service.run_session(websocket, job_title, employer)
    except WebSocketDisconnect:
        logger.info(f"Interview session ended — user={user['id']}")
    except Exception as e:
        logger.error(f"Unhandled interview error: {e}", exc_info=True)
    finally:
        logger.info(f"Interview WebSocket closed — user={user['id']}")
