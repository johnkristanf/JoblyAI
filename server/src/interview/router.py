from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
import logging
from src.interview.dependencies import get_interview_service
from src.interview.service import InterviewService

router = APIRouter()
logger = logging.getLogger(__name__)

@router.websocket("/ws")
async def mock_interview_websocket(
    websocket: WebSocket,
    interview_service: InterviewService = Depends(get_interview_service)
):
    await websocket.accept()
    logger.info("WebSocket connection accepted for mock interview.")
    
    conversation_history = []

    # 1. Send AI intro first
    intro = "Hello! I'm your interviewer today. Let's start — tell me about yourself."
    conversation_history.append({ "role": "assistant", "content": intro })
    audio = await interview_service.text_to_speech(intro)          # ElevenLabs
    await websocket.send_bytes(audio)
    
    try:
        while True:
            # Receive audio/video chunks from the client
            data = await websocket.receive_bytes()
            # For this implementation, we just log the size of the received chunk.
            # In a real AI implementation, this data would be passed to a model.
            logger.info(f"Received media chunk of size: {len(data)} bytes")
            
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected.")
    except Exception as e:
        logger.error(f"Error in websocket connection: {e}")
