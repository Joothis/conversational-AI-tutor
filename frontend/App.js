import Mascot from './mascot.js';
import VoiceControls from './voicecontrols.js';
import ChatInterface from './chatInterface.js';
import { chatAPI, queryAPI } from "./api.js";
import React, { useState, useEffect, useRef } from 'react';
import { EMOTION_MAP } from './lib/constants.js';
import EmotionIndicator from './components/EmotionIndicator.js';



function App() {
  // State management
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState("neutral");
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState("chat"); // 'chat' or 'query'

  // Refs for speech services
  const recognitionRef = useRef(null);
  const synthesisRef = useRef(null);
  const isInitialized = useRef(false);

  // Initialize speech services
  useEffect(() => {
    // Initialize Speech Recognition (STT)
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setCurrentEmotion("listening");
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        handleUserInput(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        setCurrentEmotion("confused");
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      console.warn("Speech recognition not supported");
    }

    // Initialize Speech Synthesis (TTS)
    if ("speechSynthesis" in window) {
      synthesisRef.current = window.speechSynthesis;
    } else {
      console.warn("Speech synthesis not supported");
    }

    isInitialized.current = true;

    return () => {
      // Cleanup
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
    };
  // handleUserInput is stable and does not need to be in dependency array
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleListen = () => {
    if (!recognitionRef.current) {
      console.warn("Speech recognition not available");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleUserInput = async (text) => {
    if (!text.trim()) return;

    // Add user message to conversation
    const userMessage = { role: "user", content: text, timestamp: new Date() };
    setConversation((prev) => [...prev, userMessage]);

    setIsLoading(true);
    setCurrentEmotion("thinking");

    try {
      // Call appropriate API endpoint
      const response =
        mode === "chat" ? await chatAPI(text) : await queryAPI(text);

      // Add AI response to conversation
      const aiMessage = {
        role: "assistant",
        content: response.text,
        emotion: response.emotion,
        timestamp: new Date(),
      };
      setConversation((prev) => [...prev, aiMessage]);

      // Update emotion and speak response
      setCurrentEmotion(response.emotion);
      await handleSpeak(response.text);
    } catch (error) {
      console.error("API Error:", error);
      const errorMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        emotion: "confused",
        timestamp: new Date(),
      };
      setConversation((prev) => [...prev, errorMessage]);
      setCurrentEmotion("confused");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (text) => {
    return new Promise((resolve) => {
      if (!synthesisRef.current) {
        resolve();
        return;
      }

      // Cancel any ongoing speech
      synthesisRef.current.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Configure voice settings
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 0.8;

      // Get available voices and select a pleasant one
      const voices = synthesisRef.current.getVoices();
      const preferredVoice = voices.find(
        (voice) =>
          voice.name.includes("Female") ||
          voice.name.includes("Karen") ||
          voice.name.includes("Zira")
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setCurrentEmotion("neutral");
        resolve();
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event.error);
        setIsSpeaking(false);
        setCurrentEmotion("confused");
        resolve();
      };

      synthesisRef.current.speak(utterance);
    });
  };

  const handleTextInput = (text) => {
    handleUserInput(text);
  };

  const clearConversation = () => {
    setConversation([]);
    setCurrentEmotion("neutral");
    // TODO: Call API to reset conversation memory
  };

  const toggleMode = () => {
    setMode((prev) => (prev === "chat" ? "query" : "chat"));
    clearConversation();
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🤖 AI Tutor Companion</h1>
        <div className="mode-toggle">
          <button
            className={mode === "chat" ? "active" : ""}
            onClick={toggleMode}
          >
            {mode === "chat" ? "💬 Chat Mode" : "❓ Query Mode"}
          </button>
        </div>
      </header>

      <main className="App-main">
        <div className="mascot-section">
          <EmotionIndicator emotion={currentEmotion} />
          <Mascot
            emotion={currentEmotion}
            isSpeaking={isSpeaking}
            isLoading={isLoading}
          />
        </div>

        <div className="interaction-section">
          <VoiceControls
            isListening={isListening}
            onListen={handleListen}
            onTextInput={handleTextInput}
            disabled={isLoading || isSpeaking}
          />

          <ChatInterface
            conversation={conversation}
            isLoading={isLoading}
            onClear={clearConversation}
          />
        </div>
      </main>

      <footer className="App-footer">
        <p>Powered by LangChain RAG | Speech Recognition | Text-to-Speech</p>
      </footer>
    </div>
  );
}

export default App;
