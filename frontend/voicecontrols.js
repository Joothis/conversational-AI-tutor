import React, { useState } from "react";
import "./voicecontrols.css";

const VoiceControls = ({ isListening, onListen, onTextInput, disabled }) => {
  const [textInput, setTextInput] = useState("");
  const [inputMode, setInputMode] = useState("voice"); // 'voice' or 'text'

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim() && !disabled) {
      onTextInput(textInput.trim());
      setTextInput("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit(e);
    }
  };

  return (
    <div className="voice-controls">
      {/* Mode Toggle */}
      <div className="input-mode-toggle">
        <button
          className={inputMode === "voice" ? "active" : ""}
          onClick={() => setInputMode("voice")}
          disabled={disabled}
        >
          🎤 Voice
        </button>
        <button
          className={inputMode === "text" ? "active" : ""}
          onClick={() => setInputMode("text")}
          disabled={disabled}
        >
          ⌨️ Text
        </button>
      </div>

      {inputMode === "voice" ? (
        /* Voice Input Section */
        <div className="voice-input-section">
          <button
            className={`mic-button ${isListening ? "listening" : ""} ${
              disabled ? "disabled" : ""
            }`}
            onClick={onListen}
            disabled={disabled}
            title={isListening ? "Stop listening" : "Start listening"}
          >
            <div className="mic-icon">
              {isListening ? (
                <div className="listening-animation">
                  <div className="pulse-ring"></div>
                  <div className="pulse-ring delay-1"></div>
                  <div className="pulse-ring delay-2"></div>
                  🎤
                </div>
              ) : (
                <span className="mic-static">🎤</span>
              )}
            </div>
          </button>

          <div className="voice-status">
            {isListening ? (
              <div className="status-text listening">
                <span>🎙️ Listening...</span>
                <div className="sound-visualizer">
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                  <div className="bar"></div>
                </div>
              </div>
            ) : disabled ? (
              <span className="status-text disabled">
                AI is thinking or speaking...
              </span>
            ) : (
              <span className="status-text idle">
                Press the microphone to start speaking
              </span>
            )}
          </div>
        </div>
      ) : (
        /* Text Input Section */
        <div className="text-input-section">
          <form onSubmit={handleTextSubmit} className="text-input-form">
            <div className="input-container">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your question here..."
                disabled={disabled}
                rows="3"
                maxLength="500"
              />
              <div className="input-actions">
                <span className="character-count">{textInput.length}/500</span>
                <button
                  type="submit"
                  disabled={!textInput.trim() || disabled}
                  className="send-button"
                  title="Send message"
                >
                  📤
                </button>
              </div>
            </div>
          </form>

          <div className="text-status">
            {disabled ? (
              <span className="status-text disabled">
                AI is thinking or speaking...
              </span>
            ) : (
              <span className="status-text idle">
                Type your question and press Enter or click send
              </span>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <button
          className="quick-action-btn"
          onClick={() => onTextInput("What is Python?")}
          disabled={disabled}
          title="Ask about Python"
        >
          🐍 Python
        </button>
        <button
          className="quick-action-btn"
          onClick={() => onTextInput("Explain variables")}
          disabled={disabled}
          title="Ask about variables"
        >
          📦 Variables
        </button>
        <button
          className="quick-action-btn"
          onClick={() => onTextInput("Show me an example")}
          disabled={disabled}
          title="Request an example"
        >
          💡 Example
        </button>
        <button
          className="quick-action-btn"
          onClick={() => onTextInput("Help me practice")}
          disabled={disabled}
          title="Practice mode"
        >
          🏃 Practice
        </button>
      </div>

      {/* Tips */}
      <div className="interaction-tips">
        <div className="tip">
          <span className="tip-icon">💡</span>
          <span className="tip-text">
            {inputMode === "voice"
              ? "Speak clearly and wait for the microphone to activate"
              : "Ask questions about programming, math, or any topic in the knowledge base"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VoiceControls;
