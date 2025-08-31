"""
Enhanced CLI Client for Conversational AI Tutor
Supports real Speech-to-Text and Text-to-Speech functionality
"""

import requests
import json
import base64
import os
import sys
import time
import threading
from typing import Optional
from datetime import datetime

# --- Configuration ---
API_URL = os.getenv("API_URL", "http://127.0.0.1:8000")
USE_REAL_STT = os.getenv("USE_REAL_STT", "false").lower() == "true"
USE_REAL_TTS = os.getenv("USE_REAL_TTS", "false").lower() == "true"

# --- Color codes for terminal output ---
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

# --- Speech Functions ---

def speech_to_text_real():
    """Real Speech-to-Text using microphone input."""
    try:
        import speech_recognition as sr
        
        recognizer = sr.Recognizer()
        microphone = sr.Microphone()
        
        print(f"{Colors.CYAN}🎤 Listening... (speak now){Colors.ENDC}")
        
        with microphone as source:
            recognizer.adjust_for_ambient_noise(source, duration=0.5)
            audio = recognizer.listen(source, timeout=5, phrase_time_limit=10)
        
        print(f"{Colors.CYAN}🔄 Processing speech...{Colors.ENDC}")
        
        try:
            # Try Google's speech recognition
            text = recognizer.recognize_google(audio)
            return text
        except sr.UnknownValueError:
            print(f"{Colors.WARNING}⚠️  Could not understand audio{Colors.ENDC}")
            return None
        except sr.RequestError as e:
            print(f"{Colors.FAIL}❌ Speech recognition error: {e}{Colors.ENDC}")
            return None
            
    except ImportError:
        print(f"{Colors.WARNING}⚠️  SpeechRecognition not installed. Install with: pip install SpeechRecognition pyaudio{Colors.ENDC}")
        return None
    except Exception as e:
        print(f"{Colors.FAIL}❌ Error: {e}{Colors.ENDC}")
        return None

def speech_to_text_mock():
    """Mock Speech-to-Text using keyboard input."""
    print(f"{Colors.CYAN}💬 Type your question (or 'exit' to quit):{Colors.ENDC}")
    return input(f"{Colors.GREEN}You > {Colors.ENDC}")

def text_to_speech_real(text: str, emotion: str = "neutral"):
    """Real Text-to-Speech using system TTS or API."""
    try:
        # Method 1: Use the API's TTS endpoint
        response = requests.post(
            f"{API_URL}/tts/base64",
            json={"text": text, "emotion": emotion}
        )
        
        if response.status_code == 200:
            data = response.json()
            if "audio_base64" in data:
                # Decode and play audio
                audio_data = base64.b64decode(data["audio_base64"])
                play_audio(audio_data)
                return
        
        # Method 2: Fallback to local TTS
        import pyttsx3
        engine = pyttsx3.init()
        
        # Adjust voice based on emotion
        rate = engine.getProperty('rate')
        if emotion == "thinking":
            engine.setProperty('rate', rate - 30)
        elif emotion == "happy" or emotion == "encouraging":
            engine.setProperty('rate', rate + 20)
        
        engine.say(text)
        engine.runAndWait()
        
    except ImportError:
        try:
            # Method 3: Use gTTS
            from gtts import gTTS
            import tempfile
            import pygame
            
            tts = gTTS(text=text, lang='en')
            
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_file:
                tmp_file_path = tmp_file.name
                tts.save(tmp_file_path)
            
            pygame.mixer.init()
            pygame.mixer.music.load(tmp_file_path)
            pygame.mixer.music.play()
            
            while pygame.mixer.music.get_busy():
                time.sleep(0.1)
            
            os.unlink(tmp_file_path)
            
        except ImportError:
            print(f"{Colors.WARNING}⚠️  TTS libraries not installed. Install with: pip install pyttsx3 gtts pygame{Colors.ENDC}")
    except Exception as e:
        print(f"{Colors.FAIL}❌ TTS Error: {e}{Colors.ENDC}")

def text_to_speech_mock(text: str, emotion: str = "neutral"):
    """Mock Text-to-Speech using text output."""
    emotion_emojis = {
        "happy": "😊",
        "explaining": "🤓",
        "thinking": "🤔",
        "confused": "😕",
        "encouraging": "💪",
        "neutral": "🤖"
    }
    
    emoji = emotion_emojis.get(emotion, "🤖")
    print(f"\n{Colors.BLUE}{emoji} AI Tutor ({emotion}):{Colors.ENDC}")
    
    # Simulate typing effect
    for char in text:
        print(char, end='', flush=True)
        time.sleep(0.01)
    print("\n")

def play_audio(audio_data: bytes):
    """Play audio data using available audio libraries."""
    try:
        import pygame
        import tempfile
        
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_file:
            tmp_file.write(audio_data)
            tmp_file_path = tmp_file.name
        
        pygame.mixer.init()
        pygame.mixer.music.load(tmp_file_path)
        pygame.mixer.music.play()
        
        while pygame.mixer.music.get_busy():
            time.sleep(0.1)
        
        os.unlink(tmp_file_path)
    except ImportError:
        print(f"{Colors.WARNING}⚠️  pygame not installed for audio playback{Colors.ENDC}")

# --- API Communication ---

def send_query(question: str, mode: str = "chat", session_id: Optional[str] = None):
    """Send query to the API and get response."""
    endpoint = f"{API_URL}/{mode}"
    
    payload = {"question": question}
    if session_id:
        payload["session_id"] = session_id
    
    try:
        response = requests.post(endpoint, json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"{Colors.FAIL}❌ API Error: {e}{Colors.ENDC}")
        return None

def check_api_health():
    """Check if the API is running."""
    try:
        response = requests.get(f"{API_URL}/health")
        response.raise_for_status()
        return True
    except:
        return False

# --- Animation ---

def show_thinking_animation():
    """Show a thinking animation while processing."""
    animation = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
    for _ in range(10):
        for frame in animation:
            print(f"\r{Colors.CYAN}{frame} Thinking...{Colors.ENDC}", end="", flush=True)
            time.sleep(0.1)
    print("\r" + " " * 20 + "\r", end="", flush=True)

# --- Main Application ---

def display_header():
    """Display application header."""
    print(f"""
{Colors.HEADER}{'='*60}
{Colors.BOLD}       🎓 Conversational AI Tutor - Enhanced CLI 🎓{Colors.ENDC}
{Colors.HEADER}{'='*60}{Colors.ENDC}
    
{Colors.CYAN}Features:{Colors.ENDC}
  • 🎤 Speech-to-Text (STT): {'Enabled' if USE_REAL_STT else 'Text Input'}
  • 🔊 Text-to-Speech (TTS): {'Enabled' if USE_REAL_TTS else 'Text Display'}
  • 💬 Conversational Memory
  • 🎭 Emotion Detection
  • 📚 RAG-powered Knowledge Base
    
{Colors.GREEN}Commands:{Colors.ENDC}
  • Type your question or speak (if STT enabled)
  • 'exit' - Quit the application
  • 'reset' - Clear conversation history
  • 'mode' - Switch between chat/query mode
  • 'help' - Show this help message
{Colors.HEADER}{'='*60}{Colors.ENDC}
""")

def main():
    """Main application loop."""
    display_header()
    
    # Check API health
    print(f"{Colors.CYAN}🔍 Checking API connection...{Colors.ENDC}")
    if not check_api_health():
        print(f"{Colors.FAIL}❌ Cannot connect to API at {API_URL}")
        print(f"Please ensure the backend server is running.{Colors.ENDC}")
        return
    
    print(f"{Colors.GREEN}✅ Connected to API successfully!{Colors.ENDC}\n")
    
    # Session management
    session_id = None
    mode = "chat"
    
    # Select STT/TTS functions based on configuration
    stt_func = speech_to_text_real if USE_REAL_STT else speech_to_text_mock
    tts_func = text_to_speech_real if USE_REAL_TTS else text_to_speech_mock
    
    print(f"{Colors.BLUE}Current mode: {mode.upper()}{Colors.ENDC}")
    print(f"{Colors.CYAN}{'='*60}{Colors.ENDC}\n")
    
    while True:
        try:
            # Get user input
            user_input = stt_func()
            
            if user_input is None:
                continue
            
            # Handle commands
            if user_input.lower() == 'exit':
                print(f"\n{Colors.GREEN}👋 Goodbye! Thanks for using AI Tutor!{Colors.ENDC}")
                break
            elif user_input.lower() == 'reset':
                session_id = None
                print(f"{Colors.GREEN}🔄 Conversation history cleared!{Colors.ENDC}\n")
                continue
            elif user_input.lower() == 'mode':
                mode = "query" if mode == "chat" else "chat"
                print(f"{Colors.BLUE}Switched to {mode.upper()} mode{Colors.ENDC}\n")
                continue
            elif user_input.lower() == 'help':
                display_header()
                continue
            
            # Show thinking animation in a separate thread
            thinking_thread = threading.Thread(target=show_thinking_animation)
            thinking_thread.daemon = True
            thinking_thread.start()
            
            # Send query to API
            response = send_query(user_input, mode, session_id)
            
            if response:
                # Update session ID if in chat mode
                if mode == "chat" and "session_id" in response:
                    session_id = response["session_id"]
                
                # Get response text and emotion
                answer_text = response.get("text", "No response")
                emotion = response.get("emotion", "neutral")
                sources = response.get("sources", [])
                
                # Display/speak the response
                tts_func(answer_text, emotion)
                
                # Show sources if available
                if sources:
                    print(f"{Colors.CYAN}📚 Sources: {', '.join(sources)}{Colors.ENDC}")
                
                print(f"{Colors.CYAN}{'='*60}{Colors.ENDC}\n")
            else:
                print(f"{Colors.FAIL}Failed to get response from API{Colors.ENDC}\n")
                
        except KeyboardInterrupt:
            print(f"\n\n{Colors.GREEN}👋 Interrupted. Goodbye!{Colors.ENDC}")
            break
        except Exception as e:
            print(f"{Colors.FAIL}❌ Unexpected error: {e}{Colors.ENDC}")
            continue

if __name__ == "__main__":
    # Parse command line arguments
    import argparse
    
    parser = argparse.ArgumentParser(description="Enhanced CLI for Conversational AI Tutor")
    parser.add_argument("--api-url", default="http://127.0.0.1:8000", help="API URL")
    parser.add_argument("--stt", action="store_true", help="Enable real Speech-to-Text")
    parser.add_argument("--tts", action="store_true", help="Enable real Text-to-Speech")
    
    args = parser.parse_args()
    
    API_URL = args.api_url
    USE_REAL_STT = args.stt
    USE_REAL_TTS = args.tts
    
    try:
        main()
    except Exception as e:
        print(f"{Colors.FAIL}Fatal error: {e}{Colors.ENDC}")
        sys.exit(1)