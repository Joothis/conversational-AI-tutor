import React, { useEffect, useRef } from "react";
import "./chatinterface.css";

import EmptyChatState from "./components/EmptyChatState.js";
import { EMOTION_MAP } from "./lib/constants.js";

const ChatInterface = ({ conversation, isLoading, onClear }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, isLoading]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEmotionIcon = (emotion) => {
    return EMOTION_MAP[emotion] || "😊";
  };

  const renderMessage = (message, index) => {
    const isUser = message.role === "user";
    return (
      <div key={index} className={`message-bubble ${isUser ? "user" : "assistant"} fade-in`}>
        {!isUser && message.emotion && (
          <span className="emotion-label">
            {getEmotionIcon(message.emotion)} {message.emotion.charAt(0).toUpperCase() + message.emotion.slice(1)}
          </span>
        )}
        <span className="message-text">{message.content}</span>
        <span className="message-time">{formatTime(message.timestamp)}</span>
      </div>
    );
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <div className="chat-title">
          <span className="chat-icon">💬</span>
          <h3>Conversation History</h3>
        </div>
        <div className="chat-actions">
          {conversation.length > 0 && (
            <button
              onClick={onClear}
              className="clear-button"
              title="Clear conversation"
            >
              🗑️ Clear
            </button>
          )}
        </div>
      </div>

      <div className="chat-messages">
        {conversation.length === 0 ? (
          <EmptyChatState />
        ) : (
          <>
            {conversation.map((message, index) =>
              renderMessage(message, index)
            )}

            {isLoading && (
              <div className="message ai-message loading-message">
                <div className="message-avatar">
                  <div className="ai-avatar">
                    <span className="avatar-emoji">🤖</span>
                    <span className="thinking-indicator">🤔</span>
                  </div>
                </div>
                <div className="message-content">
                  <div className="message-bubble">
                    <div className="typing-indicator">
                      <span className="typing-text">AI is thinking</span>
                      <div className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-footer">
        <div className="conversation-stats">
          <span className="stat">📝 {conversation.length} messages</span>
          <span className="stat">
            💬 {Math.ceil(conversation.length / 2)} exchanges
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
