# Conversational AI Tutor

A full-stack AI-powered tutoring system featuring speech recognition, natural language processing, and an animated character interface.

## Project Outline

This project aims to build a conversational AI tutor with the following components:

- **RAG-powered Backend**: A backend powered by LangChain/LangGraph and a Vector DB to provide answers to user queries.
- **Live API-based Chatbot Interface**: A chatbot interface that interacts with the backend through a live API.
- **Mascot Avatar**: An animated mascot that can:
    - Listen to user queries through speech recognition (STT).
    - Speak out the AI's responses using text-to-speech (TTS).
    - Display animated emotions based on the AI's response.

## Tasks & Deliverables

### 1. Backend – Conversational RAG API

- Implement a RAG pipeline using LangChain and a Vector DB.
- Expose the following REST API endpoints:
    - `POST /query`: To answer a single query.
    - `POST /chat`: To handle multi-turn conversations.
- The API responses should include both the text of the answer and an optional emotion state (e.g., "happy", "thinking", "explaining").

### 2. Speech to Text (Listening)

- Integrate a speech-to-text (STT) service, such as Google Speech, OpenAI Whisper, or a Hugging Face model.
- The system will transcribe the user's spoken questions and send them to the backend to retrieve an answer.

### 3. Text to Speech (Speaking)

- Integrate a text-to-speech (TTS) engine, such as Google TTS, ElevenLabs, AWS Polly, or an open-source option like pyttsx3.
- The mascot will speak out the AI's answer.

### 4. Mascot UI (Frontend)

- Build a simple mascot interface using a 2D or 3D animated character.
- The mascot will have the following features:
    - Its mouth will move while speaking (basic animation or lip-sync).
    - Its facial expression will change based on the emotion field in the AI's response.
    - A microphone button will allow the user to speak, triggering the STT service, API call, and spoken response.
- The frontend can be implemented using:
    - Web technologies like React/Next.js with Web Audio APIs and Canvas/Lottie animations.
    - Desktop technologies like PyGame, PyQt, or Flutter.

### 5. Live API Calling

- Ensure that the mascot calls the live RAG API instead of using hardcoded responses.
- The end-to-end flow will be as follows:
    1. The user speaks to the mascot.
    2. The STT service transcribes the speech and sends it to the RAG API.
    3. The API returns a response containing the answer text and an emotion.
    4. The mascot speaks the answer and animates according to the emotion.

### 6. Submission Requirements

- A GitHub repository containing the backend and frontend code.
- A demo video showing the user speaking to the mascot and the mascot responding.
- Slides explaining the architecture of the STT → RAG → TTS → Mascot pipeline.

## System Requirements

- Python 3.8+
- Node.js and npm
- Virtual environment capability

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Model Configuration
LLM_MODEL=gpt-3.5-turbo

# API Keys
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here

# Speech Service Providers
STT_PROVIDER=openai  # Options: google, openai, huggingface, local
TTS_PROVIDER=google  # Options: google, elevenlabs, openai, local
```

### 2. Backend Setup

```bash
# Create and activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Unix/MacOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the backend server
uvicorn main:app --reload
```

The backend will be available at `http://localhost:8000`.

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm start
```

The frontend will be available at `http://localhost:3000`.

## Project Structure

```
conversational-AI-tutor/
├── frontend/                # React frontend application
│   ├── src/
│   │   ├── services/       # API integration
│   │   ├── components/     # React components
│   │   └── ...
├── knowledge_base/         # RAG source documents
├── chroma_db/             # Vector database storage
├── main.py               # FastAPI backend server
├── rag_pipeline.py      # RAG implementation
├── speech_services.py           # Speech service integrations
└── requirements.txt    # Python dependencies
```

## API Endpoints

- `POST /chat`: Main conversation endpoint
- `POST /stt`: Speech-to-text conversion
- `POST /tts`: Text-to-speech conversion
- `POST /reset`: Reset conversation history

## Configuration Options

### Speech-to-Text Providers

- OpenAI (Whisper)
- Google Cloud Speech-to-Text
- Hugging Face Models
- Local Processing

### Text-to-Speech Providers

- Google Cloud Text-to-Speech
- ElevenLabs
- OpenAI TTS
- Local TTS

## Development Guide

The React frontend has been scaffolded with all necessary components:

- **API Communication**: Handled in `frontend/src/services/api.js`
- **Main Application Logic**: Found in `frontend/src/App.js`
- **Key Components**:
  - Mascot Component: Animated character with emotion states
  - Voice Controls: STT and TTS integration
  - Chat Interface: Message history and input handling

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for GPT models
- LangChain for RAG implementation
- ChromaDB for vector storage
- FastAPI for the backend framework
- React for the frontend framework