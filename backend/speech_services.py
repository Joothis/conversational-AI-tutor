import os
import io
import logging
import asyncio
from typing import Optional, Dict, Any
import base64
import tempfile
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# --- Configuration ---
STT_PROVIDER = os.getenv("STT_PROVIDER", "openai")  # Options: google, openai, huggingface, local
TTS_PROVIDER = os.getenv("TTS_PROVIDER", "google")  # Options: google, elevenlabs, openai, local

# API Keys (set these in your .env file)
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

# --- Speech-to-Text Services ---

async def speech_to_text_service(audio_data: bytes, audio_format: str = "webm") -> str:
    """
    Main STT service that routes to the appropriate provider.
    """
    provider = STT_PROVIDER.lower()
    
    try:
        if provider == "openai":
            return await stt_openai(audio_data, audio_format)
        elif provider == "google":
            return await stt_google(audio_data, audio_format)
        elif provider == "huggingface":
            return await stt_huggingface(audio_data, audio_format)
        elif provider == "local":
            return await stt_local(audio_data, audio_format)
        else:
            logger.warning(f"Unknown STT provider: {provider}, using local fallback")
            return await stt_local(audio_data, audio_format)
    except Exception as e:
        logger.error(f"STT service error: {e}")
        raise

async def stt_openai(audio_data: bytes, audio_format: str) -> str:
    """
    OpenAI Whisper API for speech-to-text.
    """
    try:
        from openai import OpenAI
        
        if not OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not set in environment")
        
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # Convert audio to WAV format if it's not already
        if audio_format.lower() != "wav":
            try:
                audio_data = await convert_audio_format(audio_data, audio_format, "wav")
                audio_format = "wav"
            except Exception as e:
                logger.warning(f"Audio conversion failed: {e}, attempting with original format")
        
        # Save audio to temporary file (Whisper API requires file)
        with tempfile.NamedTemporaryFile(suffix=f".{audio_format}", delete=False) as tmp_file:
            tmp_file.write(audio_data)
            tmp_file_path = tmp_file.name
        
        try:
            # Use Whisper API
            with open(tmp_file_path, "rb") as audio_file:
                transcript_response = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="text"
                )
                return str(transcript_response)
        finally:
            # Clean up temporary file
            os.unlink(tmp_file_path)
            
    except ImportError:
        logger.error("OpenAI library not installed. Run: pip install openai")
        return await stt_local(audio_data, audio_format)
    except Exception as e:
        logger.error(f"OpenAI STT error: {e}")
        return await stt_local(audio_data, audio_format)

async def stt_google(audio_data: bytes, audio_format: str) -> str:
    """
    Google Cloud Speech-to-Text API.
    """
    try:
        from google.cloud import speech
        
        # Initialize client
        client = speech.SpeechClient()
        
        # Configure audio
        audio = speech.RecognitionAudio(content=audio_data)
        
        # Configure recognition
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS
            if audio_format == "webm"
            else speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            language_code="en-US",
            enable_automatic_punctuation=True,
        )
        
        # Perform recognition
        response = client.recognize(config=config, audio=audio)
        
        # Extract transcript
        transcript = ""
        for result in response.results:
            transcript += result.alternatives[0].transcript + " "
        
        return transcript.strip()
        
    except ImportError:
        logger.error("Google Cloud Speech library not installed. Run: pip install google-cloud-speech")
        return await stt_local(audio_data, audio_format)
    except Exception as e:
        logger.error(f"Google STT error: {e}")
        return await stt_local(audio_data, audio_format)

async def stt_huggingface(audio_data: bytes, audio_format: str) -> str:
    """
    Hugging Face Transformers for local speech recognition.
    """
    try:
        from transformers import pipeline
        import soundfile as sf
        import numpy as np
        
        # Initialize the pipeline (this will download the model on first use)
        transcriber = pipeline(
            "automatic-speech-recognition",
            model="openai/whisper-small"
        )
        
        # Convert audio data to numpy array
        with tempfile.NamedTemporaryFile(suffix=f".{audio_format}", delete=False) as tmp_file:
            tmp_file.write(audio_data)
            tmp_file_path = tmp_file.name
        
        try:
            # Read audio file
            audio_array, sample_rate = sf.read(tmp_file_path)
            
            # Transcribe
            result = transcriber(audio_array, sampling_rate=sample_rate)
            return result["text"]
        finally:
            os.unlink(tmp_file_path)
            
    except ImportError:
        logger.error("Transformers/soundfile not installed. Run: pip install transformers soundfile")
        return await stt_local(audio_data, audio_format)
    except Exception as e:
        logger.error(f"Hugging Face STT error: {e}")
        return await stt_local(audio_data, audio_format)

async def stt_local(audio_data: bytes, audio_format: str) -> str:
    """
    Local speech recognition using SpeechRecognition library.
    Falls back to mock data if not available.
    """
    try:
        import speech_recognition as sr
        import pydub
        
        # Convert audio to WAV format if needed
        with tempfile.NamedTemporaryFile(suffix=f".{audio_format}", delete=False) as tmp_input:
            tmp_input.write(audio_data)
            tmp_input_path = tmp_input.name
        
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_output:
            tmp_output_path = tmp_output.name
        
        try:
            # Convert to WAV using pydub
            audio = pydub.AudioSegment.from_file(tmp_input_path)
            audio.export(tmp_output_path, format="wav")
            
            # Use speech recognition
            recognizer = sr.Recognizer()
            with sr.AudioFile(tmp_output_path) as source:
                audio_data = recognizer.record(source)
                text = recognizer.recognize_google(audio_data)
                return text
        finally:
            os.unlink(tmp_input_path)
            os.unlink(tmp_output_path)
            
    except ImportError:
        logger.warning("SpeechRecognition not installed. Returning mock transcription.")
        return "This is a mock transcription. Please install speech_recognition and pydub."
    except Exception as e:
        logger.error(f"Local STT error: {e}")
        return "Error transcribing audio. Please check the audio format and try again."

# --- Text-to-Speech Services ---

async def text_to_speech_service(
    text: str,
    emotion: str = "neutral",
    voice: str = "default",
    speed: float = 1.0
) -> bytes:
    """
    Main TTS service that routes to the appropriate provider.
    """
    provider = TTS_PROVIDER.lower()
    
    try:
        if provider == "google":
            return await tts_google(text, emotion, voice, speed)
        elif provider == "elevenlabs":
            return await tts_elevenlabs(text, emotion, voice, speed)
        elif provider == "openai":
            return await tts_openai(text, emotion, voice, speed)
        elif provider == "local":
            return await tts_local(text, emotion, voice, speed)
        else:
            logger.warning(f"Unknown TTS provider: {provider}, using local fallback")
            return await tts_local(text, emotion, voice, speed)
    except Exception as e:
        logger.error(f"TTS service error: {e}")
        raise

async def tts_google(text: str, emotion: str, voice: str, speed: float) -> bytes:
    """
    Google Cloud Text-to-Speech API.
    """
    try:
        from google.cloud import texttospeech
        
        # Initialize client
        client = texttospeech.TextToSpeechClient()
        
        # Configure synthesis input
        synthesis_input = texttospeech.SynthesisInput(text=text)
        
        # Configure voice
        voice_config = texttospeech.VoiceSelectionParams(
            language_code="en-US",
            name="en-US-Neural2-J" if emotion in ["happy", "encouraging"] else "en-US-Neural2-D",
            ssml_gender=texttospeech.SsmlVoiceGender.NEUTRAL
        )
        
        # Configure audio
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=speed,
            pitch=1.0 if emotion != "confused" else 0.5
        )
        
        # Perform synthesis
        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice_config,
            audio_config=audio_config
        )
        
        return response.audio_content
        
    except ImportError:
        logger.error("Google Cloud TTS library not installed. Run: pip install google-cloud-texttospeech")
        return await tts_local(text, emotion, voice, speed)
    except Exception as e:
        logger.error(f"Google TTS error: {e}")
        return await tts_local(text, emotion, voice, speed)

async def tts_elevenlabs(text: str, emotion: str, voice: str, speed: float) -> bytes:
    """
    ElevenLabs Text-to-Speech API for high-quality voices.
    """
    try:
        import requests
        
        if not ELEVENLABS_API_KEY:
            raise ValueError("ELEVENLABS_API_KEY not set in environment")
        
        # Select voice based on emotion
        voice_id = {
            "happy": "EXAVITQu4vr4xnSDxMaL",  # Sarah - Friendly
            "explaining": "21m00Tcm4TlvDq8ikWAM",  # Rachel - Clear
            "thinking": "AZnzlk1XvdvUeBnXmlld",  # Domi - Thoughtful
            "confused": "ThT5KcBeYPX3keUQqHPh",  # Dorothy - Uncertain
            "encouraging": "jBpfuIE2acCO8z3wKNLl",  # Gigi - Childish
            "neutral": "21m00Tcm4TlvDq8ikWAM"  # Rachel - Default
        }.get(emotion, "21m00Tcm4TlvDq8ikWAM")
        
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY
        }
        
        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": {
                "stability": 0.5 if emotion == "confused" else 0.75,
                "similarity_boost": 0.75,
                "style": 0.5 if emotion in ["happy", "encouraging"] else 0.0,
                "use_speaker_boost": True
            }
        }
        
        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status()
        
        return response.content
        
    except ImportError:
        logger.error("Requests library not installed. Run: pip install requests")
        return await tts_local(text, emotion, voice, speed)
    except Exception as e:
        logger.error(f"ElevenLabs TTS error: {e}")
        return await tts_local(text, emotion, voice, speed)

async def tts_openai(text: str, emotion: str, voice: str, speed: float) -> bytes:
    """
    OpenAI Text-to-Speech API.
    """
    try:
        import openai
        from openai import OpenAI
        
        if not OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY not set in environment")
        
        client = OpenAI(api_key=OPENAI_API_KEY)
        
        # Select voice based on emotion
        voice_name = {
            "happy": "alloy",
            "explaining": "nova",
            "thinking": "onyx",
            "confused": "echo",
            "encouraging": "shimmer",
            "neutral": "nova"
        }.get(emotion, "nova")
        
        # Generate speech
        response = client.audio.speech.create(
            model="tts-1",
            voice=voice_name,
            input=text,
            speed=speed
        )
        
        # Convert response to bytes
        audio_data = b""
        for chunk in response.iter_bytes():
            audio_data += chunk
        
        return audio_data
        
    except ImportError:
        logger.error("OpenAI library not installed. Run: pip install openai")
        return await tts_local(text, emotion, voice, speed)
    except Exception as e:
        logger.error(f"OpenAI TTS error: {e}")
        return await tts_local(text, emotion, voice, speed)

async def tts_local(text: str, emotion: str, voice: str, speed: float) -> bytes:
    """
    Local text-to-speech using pyttsx3 or gTTS.
    """
    try:
        # Try gTTS first (Google Text-to-Speech, free tier)
        from gtts import gTTS
        import io
        
        # Adjust language/accent based on emotion
        lang = 'en'
        tld = {
            "happy": "com.au",  # Australian accent
            "explaining": "co.uk",  # British accent
            "thinking": "ca",  # Canadian accent
            "confused": "co.in",  # Indian accent
            "encouraging": "com",  # American accent
            "neutral": "com"
        }.get(emotion, "com")
        
        # Create gTTS object
        tts = gTTS(text=text, lang=lang, tld=tld, slow=(speed < 1.0))
        
        # Save to bytes
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)
        
        return audio_buffer.read()
        
    except ImportError:
        try:
            # Fallback to pyttsx3
            import pyttsx3
            import tempfile
            
            engine = pyttsx3.init()
            
            # Configure voice properties based on emotion
            engine.setProperty('rate', 150 * speed)
            
            if emotion == "happy":
                engine.setProperty('pitch', 1.2)
            elif emotion == "confused":
                engine.setProperty('pitch', 0.8)
            
            # Save to temporary file
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_file:
                tmp_file_path = tmp_file.name
            
            try:
                engine.save_to_file(text, tmp_file_path)
                engine.runAndWait()
                
                with open(tmp_file_path, 'rb') as f:
                    audio_data = f.read()
                
                return audio_data
            finally:
                os.unlink(tmp_file_path)
                
        except ImportError:
            logger.error("No TTS library installed. Install gtts or pyttsx3")
            # Return empty audio as fallback
            return b""
        except Exception as e:
            logger.error(f"pyttsx3 TTS error: {e}")
            return b""

# --- Utility Functions ---

def get_audio_duration(audio_data: bytes, format: str = "mp3") -> float:
    """
    Get the duration of audio data in seconds.
    """
    try:
        import pydub
        
        audio = pydub.AudioSegment.from_file(
            io.BytesIO(audio_data),
            format=format
        )
        return len(audio) / 1000.0  # Convert to seconds
    except Exception as e:
        logger.error(f"Error getting audio duration: {e}")
        return 5.0  # Default duration

async def convert_audio_format(
    audio_data: bytes,
    input_format: str,
    output_format: str
) -> bytes:
    """
    Convert audio between different formats.
    """
    try:
        import pydub
        
        audio = pydub.AudioSegment.from_file(
            io.BytesIO(audio_data),
            format=input_format
        )
        
        output_buffer = io.BytesIO()
        audio.export(output_buffer, format=output_format)
        output_buffer.seek(0)
        
        return output_buffer.read()
    except Exception as e:
        logger.error(f"Error converting audio format: {e}")
        return audio_data

# --- Testing Functions ---

async def test_stt():
    """Test STT functionality with a sample audio file."""
    print(f"Testing STT with provider: {STT_PROVIDER}")
    
    # Create a simple test audio (silence)
    test_audio = b"\x00" * 1000
    
    try:
        result = await speech_to_text_service(test_audio, "wav")
        print(f"STT Result: {result}")
    except Exception as e:
        print(f"STT Test failed: {e}")

async def test_tts():
    """Test TTS functionality with sample text."""
    print(f"Testing TTS with provider: {TTS_PROVIDER}")
    
    test_text = "Hello! I am your AI tutor. How can I help you today?"
    
    for emotion in ["happy", "explaining", "thinking", "confused", "encouraging", "neutral"]:
        try:
            audio_data = await text_to_speech_service(test_text, emotion)
            print(f"TTS for emotion '{emotion}': Generated {len(audio_data)} bytes")
        except Exception as e:
            print(f"TTS Test failed for emotion '{emotion}': {e}")

if __name__ == "__main__":
    # Run tests
    asyncio.run(test_stt())
    asyncio.run(test_tts())