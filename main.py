from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import io
import base64
from rag_pipeline import setup_rag_pipeline, process_query, reset_conversation
from fastapi.middleware.cors import CORSMiddleware
import logging
from datetime import datetime
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- FastAPI App Initialization ---
app = FastAPI(
    title="Conversational AI Tutor API",
    description="A full-featured AI tutor with RAG, STT, and TTS capabilities",
    version="2.0.0"
)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Request/Response Models ---
class QueryRequest(BaseModel):
    question: str
    session_id: Optional[str] = None

class QueryResponse(BaseModel):
    text: str
    emotion: str
    sources: List[str] = []
    session_id: Optional[str] = None
    timestamp: str

class AudioRequest(BaseModel):
    audio_base64: str
    format: str = "webm"  # Default format
    session_id: Optional[str] = None

class TTSRequest(BaseModel):
    text: str
    emotion: str = "neutral"  # Default emotion
    voice: str = "default"    # Default voice
    speed: float = 1.0       # Default speed
    text: str
    emotion: Optional[str] = "neutral"

# --- Speech Services Integration ---
from speech_services import speech_to_text_service, text_to_speech_service

@app.post("/stt")
async def convert_speech_to_text(request: AudioRequest):
    try:
        # Decode base64 audio
        audio_data = base64.b64decode(request.audio_base64)
        
        # Convert speech to text using the specified format
        text = await speech_to_text_service(
            audio_data=audio_data,
            audio_format=request.format
        )
        
        return {"text": text}
    except Exception as e:
        logger.error(f"STT error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tts")
async def convert_text_to_speech(request: TTSRequest):
    try:
        # Convert text to speech with all parameters
        audio_data = await text_to_speech_service(
            text=request.text,
            emotion=request.emotion,
            voice=request.voice,
            speed=request.speed
        )
        
        # Create a stream response
        return StreamingResponse(
            io.BytesIO(audio_data),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "attachment; filename=speech.mp3"
            }
        )
    except Exception as e:
        logger.error(f"TTS error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    text: str
    emotion: Optional[str] = "neutral"
    voice: Optional[str] = "default"
    speed: Optional[float] = 1.0

class ConversationReset(BaseModel):
    session_id: Optional[str] = None

# --- Session Management ---
sessions = {}

def get_or_create_session(session_id: Optional[str] = None):
    """Manages conversation sessions."""
    if not session_id:
        from uuid import uuid4
        session_id = str(uuid4())
    
    if session_id not in sessions:
        sessions[session_id] = {
            "created": datetime.now().isoformat(),
            "message_count": 0,
            "history": []
        }
    
    return session_id

# --- Event Handlers ---
@app.on_event("startup")
async def on_startup():
    """Initialize the RAG pipeline when the server starts."""
    try:
        setup_rag_pipeline()
        logger.info("Application started successfully")
    except Exception as e:
        logger.error(f"Failed to initialize application: {e}")
        raise

@app.on_event("shutdown")
async def on_shutdown():
    """Cleanup when the server shuts down."""
    logger.info("Application shutting down")

# --- Health Check Endpoints ---
@app.get("/")
def read_root():
    """Root endpoint to check if the server is running."""
    return {
        "message": "Welcome to the Conversational AI Tutor API!",
        "version": "2.0.0",
        "endpoints": {
            "chat": "/chat",
            "query": "/query",
            "stt": "/stt",
            "tts": "/tts",
            "reset": "/reset",
            "health": "/health"
        }
    }

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "active_sessions": len(sessions)
    }

# --- Core Query Endpoints ---
@app.post("/query", response_model=QueryResponse)
async def handle_query(request: QueryRequest):
    """
    Handles a single, stateless query.
    No conversation history is maintained.
    """
    try:
        result = process_query(request.question, is_chat=False)
        
        return QueryResponse(
            text=result["text"],
            emotion=result["emotion"],
            sources=result.get("sources", []),
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"Error in query endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat", response_model=QueryResponse)
async def handle_chat(request: QueryRequest):
    """
    Handles a conversational query with history.
    Maintains conversation context across messages.
    """
    try:
        session_id = get_or_create_session(request.session_id)
        
        # Process the query with conversation history
        result = process_query(request.question, is_chat=True)
        
        # Update session
        sessions[session_id]["message_count"] += 1
        sessions[session_id]["history"].append({
            "question": request.question,
            "answer": result["text"],
            "emotion": result["emotion"],
            "timestamp": datetime.now().isoformat()
        })
        
        # Limit history to last 20 exchanges
        if len(sessions[session_id]["history"]) > 20:
            sessions[session_id]["history"] = sessions[session_id]["history"][-20:]
        
        return QueryResponse(
            text=result["text"],
            emotion=result["emotion"],
            sources=result.get("sources", []),
            session_id=session_id,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Speech-to-Text Endpoint ---
@app.post("/stt")
async def speech_to_text(
    audio: UploadFile = File(...),
    session_id: Optional[str] = Form(None)
):
    """
    Converts speech audio to text.
    Accepts audio file and returns transcribed text.
    """
    try:
        # Import STT service
        from speech_services import speech_to_text_service
        
        # Read audio data
        audio_data = await audio.read()
        
        # Process audio to text
        transcribed_text = await speech_to_text_service(
            audio_data,
            audio.content_type
        )
        
        logger.info(f"STT successful: {transcribed_text[:50]}...")
        
        return {
            "text": transcribed_text,
            "session_id": session_id,
            "timestamp": datetime.now().isoformat()
        }
    except ImportError:
        # Fallback if speech_services not implemented
        logger.warning("STT service not implemented, returning mock response")
        return {
            "text": "This is a placeholder transcription. Please implement speech_services.py",
            "session_id": session_id,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error in STT endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/stt/base64")
async def speech_to_text_base64(request: AudioRequest):
    """
    Converts base64-encoded speech audio to text.
    Useful for web applications.
    """
    try:
        # Import STT service
        from speech_services import speech_to_text_service
        
        # Decode base64 audio
        audio_data = base64.b64decode(request.audio_base64)
        
        # Process audio to text
        transcribed_text = await speech_to_text_service(
            audio_data,
            request.format
        )
        
        return {
            "text": transcribed_text,
            "session_id": request.session_id,
            "timestamp": datetime.now().isoformat()
        }
    except ImportError:
        # Fallback if speech_services not implemented
        return {
            "text": "This is a placeholder transcription. Please implement speech_services.py",
            "session_id": request.session_id,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error in STT base64 endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Text-to-Speech Endpoint ---
@app.post("/tts")
async def text_to_speech(request: TTSRequest):
    """
    Converts text to speech audio.
    Returns audio file as response.
    """
    try:
        # Import TTS service
        from speech_services import text_to_speech_service
        
        # Generate speech audio
        audio_data = await text_to_speech_service(
            text=request.text,
            emotion=request.emotion,
            voice=request.voice,
            speed=request.speed
        )
        
        # Return audio as streaming response
        return StreamingResponse(
            io.BytesIO(audio_data),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "attachment; filename=speech.mp3"
            }
        )
    except ImportError:
        # Fallback if speech_services not implemented
        logger.warning("TTS service not implemented, returning error message")
        raise HTTPException(
            status_code=501,
            detail="TTS service not implemented. Please implement speech_services.py"
        )
    except Exception as e:
        logger.error(f"Error in TTS endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tts/base64")
async def text_to_speech_base64(request: TTSRequest):
    """
    Converts text to speech and returns base64-encoded audio.
    Useful for web applications.
    """
    try:
        # Import TTS service
        from speech_services import text_to_speech_service
        
        # Generate speech audio
        audio_data = await text_to_speech_service(
            text=request.text,
            emotion=request.emotion,
            voice=request.voice,
            speed=request.speed
        )
        
        # Encode to base64
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        
        return {
            "audio_base64": audio_base64,
            "format": "mp3",
            "timestamp": datetime.now().isoformat()
        }
    except ImportError:
        # Fallback if speech_services not implemented
        return {
            "error": "TTS service not implemented. Please implement speech_services.py",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error in TTS base64 endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Conversation Management ---
@app.post("/reset")
async def reset_conversation_endpoint(request: ConversationReset):
    """
    Resets the conversation history for a session.
    """
    try:
        reset_conversation()
        
        if request.session_id and request.session_id in sessions:
            sessions[request.session_id]["history"] = []
            sessions[request.session_id]["message_count"] = 0
        
        return {
            "message": "Conversation reset successfully",
            "session_id": request.session_id,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error resetting conversation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/sessions")
async def get_sessions():
    """
    Returns information about active sessions.
    For debugging and monitoring purposes.
    """
    return {
        "total_sessions": len(sessions),
        "sessions": [
            {
                "id": sid,
                "created": data["created"],
                "message_count": data["message_count"]
            }
            for sid, data in sessions.items()
        ]
    }

@app.get("/session/{session_id}")
async def get_session_history(session_id: str):
    """
    Returns the conversation history for a specific session.
    """
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return sessions[session_id]

# --- Main Execution ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
        reload=True
    )