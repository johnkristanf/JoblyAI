import logging
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import decode_supabase_token, verify_user_from_token
from src.database import Database
from src.interview.schema import CreateInterviewRequest, CreateInterviewResponse, InterviewRecordResponse
from src.interview.service import InterviewService
from src.interview.dependencies import get_interview_service

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


@interview_router.post("/create", response_model=CreateInterviewResponse)
async def create_interview(
    body: CreateInterviewRequest,
    user: dict = Depends(verify_user_from_token),
    session: AsyncSession = Depends(Database.get_async_session),
    service: InterviewService = Depends(get_interview_service),
):
    """
    Create a new interview record in the DB.
    Returns the interview UUID which the client uses as the room ID.
    """
    interview = await service.create(
        db_session=session,
        user_id=user["id"],
        type=body.type,
        job_title=body.job_title,
        employer=body.employer,
        resume_object_key=body.resume_object_key,
    )
    logger.info(f"Interview created — id={interview.id} user={user['id']} type={body.type}")
    return CreateInterviewResponse(interview_id=str(interview.id))


@interview_router.get("/all", response_model=list[InterviewRecordResponse])
async def get_all_interviews(
    user: dict = Depends(verify_user_from_token),
    session: AsyncSession = Depends(Database.get_async_session),
    service: InterviewService = Depends(get_interview_service),
):
    """Return all interview records for the authenticated user, newest first."""
    interviews = await service.get_all(db_session=session, user_id=user["id"])
    return [InterviewRecordResponse.model_validate(i) for i in interviews]


# ── WebSocket: run interview session ─────────────────────────────────────────

@interview_router.websocket("/ws")
async def interview_ws(
    websocket: WebSocket,
    job_title: str = Query(default="Software Engineer"),
    employer: str = Query(default=""),
    interview_type: str = Query(default="BEHAVIORAL"),
    token: str = Query(...),
    interview_id: str = Query(...),
    interview_service: InterviewService = Depends(get_interview_service),
):
    """
    WebSocket endpoint for the AI mock interview.

    Query params:
        job_title       — role being interviewed for
        employer        — company name (used in the LLM system prompt)
        interview_type  — one of TECHNICAL, BEHAVIORAL, HR_SCREENING
        token           — Supabase JWT (passed as query param since browsers
                          cannot send Authorization headers on WebSocket upgrades)
        interview_id    — UUID returned by POST /interview/create; used as room ID
                          and to write transcripts + grading back to the DB
    """
    user = await _verify_ws_token(token)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    logger.info(
        f"Interview session started — user={user['id']} interview={interview_id} "
        f"type='{interview_type}' job='{job_title}' employer='{employer}'"
    )

    try:
        await interview_service.run_session(websocket, job_title, employer, interview_type, interview_id, user["id"])
    except WebSocketDisconnect:
        logger.info(f"Interview session ended — user={user['id']}")
    except Exception as e:
        logger.error(f"Unhandled interview error: {e}", exc_info=True)
    finally:
        logger.info(f"Interview WebSocket closed — user={user['id']}")

