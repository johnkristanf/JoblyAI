import logging
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status
from jose import JWTError

from src.auth.dependencies import decode_supabase_token
from src.interview.service import InterviewService

logger = logging.getLogger("interview.router")

interview_router = APIRouter()


async def _verify_ws_token(token: str) -> dict | None:
    """
    Verify the Supabase JWT passed as a query param.
    Uses the shared JWKS-based helper from auth/dependencies so the
    HTTP and WebSocket paths stay in sync.
    """
    try:
        payload = await decode_supabase_token(token)
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
        interview_service = InterviewService()
        await interview_service.run_session(websocket, job_title, employer)
    except WebSocketDisconnect:
        logger.info(f"Interview session ended — user={user['id']}")
    except Exception as e:
        logger.error(f"Unhandled interview error: {e}", exc_info=True)
    finally:
        logger.info(f"Interview WebSocket closed — user={user['id']}")
