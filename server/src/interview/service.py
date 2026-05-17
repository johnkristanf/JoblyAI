from elevenlabs.client import AsyncElevenLabs
from fastapi import HTTPException
from src.config.runtime import params

class InterviewService:
    def __init__(self):
        self.api_key = params.get("ELEVENLABS_API_KEY")
        if not self.api_key:
            raise ValueError("ELEVENLABS_API_KEY is not configured")
        self.client = AsyncElevenLabs(api_key=self.api_key)

    async def text_to_speech(self, text: str) -> bytes:
        """
        Implementation of text to speech using ElevenLabs SDK.
        """
        try:
            # Rachel's voice ID is typically 21m00Tcm4TlvDq8ikWAM
            audio_generator = await self.client.text_to_speech.convert(
                text=text,
                voice_id="21m00Tcm4TlvDq8ikWAM",
                model_id="eleven_multilingual_v2",
                output_format="mp3_44100_128",
            )
            
            audio_bytes = b""
            async for chunk in audio_generator:
                audio_bytes += chunk
                
            return audio_bytes
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"ElevenLabs TTS error: {str(e)}")
