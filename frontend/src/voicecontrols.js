import React, { useState, useEffect, useRef } from "react";
import { api } from "../services/api";
import "./voicecontrols.css";

const VoiceControls = ({ onTranscript, isListening, setIsListening }) => {
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Setup MediaRecorder when component mounts
    setupMediaRecorder();
    return () => {
      if (
        mediaRecorder.current &&
        mediaRecorder.current.state === "recording"
      ) {
        mediaRecorder.current.stop();
      }
    };
  }, []);

  const setupMediaRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        audioChunks.current = [];

        try {
          const text = await api.convertSpeechToText(audioBlob);
          onTranscript(text);
          setError(null);
        } catch (error) {
          console.error("Speech recognition error:", error);
          setError("Failed to convert speech to text. Please try again.");
        }
      };

      setError(null);
    } catch (error) {
      console.error("Media recorder setup error:", error);
      setError("Could not access microphone. Please check your permissions.");
    }
  };

  const startListening = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === "inactive") {
      mediaRecorder.current.start();
      setIsListening(true);
      setError(null);
    }
  };

  const stopListening = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop();
      setIsListening(false);
    }
  };

  return (
    <div className="voice-controls">
      <button
        className={`mic-button ${isListening ? "recording" : ""}`}
        onClick={isListening ? stopListening : startListening}
        title={isListening ? "Stop recording" : "Start recording"}
      >
        <i className={`fas fa-microphone${isListening ? "-slash" : ""}`}></i>
      </button>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default VoiceControls;
