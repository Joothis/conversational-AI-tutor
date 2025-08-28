
import requests
import json

# --- Configuration ---
API_URL = "http://127.0.0.1:8000"

# --- Placeholder Functions for STT and TTS ---
def speech_to_text():
    """Placeholder for Speech-to-Text functionality."""
    print("\n(STT) Listening... (type your question and press Enter)")
    return input("> ")

def text_to_speech(text: str, emotion: str):
    """Placeholder for Text-to-Speech functionality."""
    print(f"\n(TTS) Mascot says with a '{emotion}' tone:")
    print(f"> {text}")

# --- Main Interaction Loop ---
def main():
    print("--- Welcome to the Conversational AI Tutor CLI ---")
    print("Type 'exit' to quit.")
    
    mode = input("Choose mode: 'chat' (with memory) or 'query' (stateless): ").lower()
    if mode not in ["chat", "query"]:
        mode = "query"
    print(f"Running in '{mode}' mode.")

    endpoint = f"{API_URL}/{mode}"

    while True:
        # 1. Get user input (simulated STT)
        question = speech_to_text()

        if question.lower() == 'exit':
            break

        # 2. Send question to the backend API
        try:
            response = requests.post(endpoint, json={"question": question})
            response.raise_for_status() # Raise an exception for bad status codes
            
            # 3. Get the response and simulate TTS
            data = response.json()
            text_to_speech(data.get("text"), data.get("emotion"))

        except requests.exceptions.RequestException as e:
            print(f"\nError connecting to the API: {e}")
            print("Please make sure the backend server is running.")

if __name__ == "__main__":
    main()
