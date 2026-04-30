from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.websocket("/ws")
async def mock_interview_websocket(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection accepted for mock interview.")
    
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
