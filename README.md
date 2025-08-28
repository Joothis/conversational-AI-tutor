
# Conversational AI Tutor (Full Stack)

This project provides a comprehensive, full-stack foundation for a conversational AI tutor. It includes a RAG-powered backend API and a scaffolded React frontend with pre-configured API communication and placeholder components.

## System Architecture

The system follows this high-level architecture:

1.  **Frontend (React)**: A user interacts with a web interface.
    *   A **Microphone Button** captures user speech.
    *   The browser's **Web Speech API** (or another STT service) converts speech to text.
2.  **API Communication**: The frontend sends the transcribed text to the backend via a REST API call.
3.  **Backend (FastAPI)**: The Python backend receives the query.
    *   The query hits the `/chat` endpoint, which maintains conversation history.
    *   A **LangChain RAG pipeline** retrieves relevant information from a **ChromaDB vector store**.
    *   A language model generates an answer and an associated "emotion."
    *   The backend returns a `{"text": "...", "emotion": "..."}` JSON response.
4.  **Frontend (React)**: The frontend receives the response.
    *   The **Web Speech API** (or another TTS service) speaks the text response aloud.
    *   A **Mascot** component updates its facial expression based on the `emotion` field and animates while speaking.

---

## How to Run This Project

This project has two parts: the **backend** server and the **frontend** application. You will need to run them in two separate terminals.

### Part 1: Running the Backend

**a. Prerequisites:**
*   Python 3.8+
*   An OpenAI API key (if using OpenAI models). Set it in the `.env` file as `OPENAI_API_KEY=your_key_here`.

**b. Setup and Run:**

```bash
# 1. Navigate to the project root directory

# 2. Create a virtual environment and activate it
python -m venv venv
# On Windows:
source venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the backend server
# The first time you run this, it will create the vector database.
uvicorn main:app --reload
```

The backend API will now be running at `http://localhost:8000`.

### Part 2: Running the Frontend

**a. Prerequisites:**
*   Node.js and npm

**b. Setup and Run:**

```bash
# 1. Navigate to the frontend directory in a new terminal
cd frontend

# 2. Install dependencies
npm install

# 3. Start the React development server
npm start
```

The frontend application will now be running and will open automatically in your browser at `http://localhost:3000`.

---

## Developing the Frontend

The React frontend has been scaffolded to make development as easy as possible.

*   **API Communication**: All API calls are handled in `frontend/src/services/api.js`. You do not need to modify this to get started.

*   **Main Logic**: The main application flow is in `frontend/src/App.js`. This file contains the logic for handling user input, managing conversation state, and coordinating the STT/TTS flow.

*   **Your Task**: Your primary focus will be on replacing the placeholder components and functions:

    1.  **Mascot Component**: In `App.js`, find the `Mascot` component. Replace the simple `<div>` with your 2D/3D animated character. You can use libraries like [Lottie](https://lottiefiles.com/) for animations. The `emotion` and `speaking` props are already passed to the component for you to use.

    2.  **STT Integration**: In `App.js`, find the `handleListen` function. The code is currently commented out. Uncomment it to use the browser's built-in Web Speech API for speech recognition. You can replace this with any other STT service.

    3.  **TTS Integration**: In `App.js`, find the `handleSpeak` function. Uncomment the example code to use the browser's built-in Web Speech API for text-to-speech. You can replace this with a more advanced service like ElevenLabs or Google TTS for higher-quality voices.
