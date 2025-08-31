import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, MessageCircle, Clock, ExternalLink } from 'lucide-react'
import './ChatInterface.css'

const EMOTION_EMOJIS = {
  neutral: '😊',
  happy: '😄',
  excited: '🤩',
  thinking: '🤔',
  confused: '😕',
  explaining: '🧠',
  encouraging: '💪',
  listening: '👂',
  surprised: '😮'
}

const ChatInterface = ({ 
  conversation, 
  isLoading, 
  mode, 
  onClear, 
  onMessageSelect 
}) => {
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [conversation, isLoading])

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEmotionEmoji = (emotion) => {
    return EMOTION_EMOJIS[emotion] || '😊'
  }

  const renderMessage = (message, index) => {
    const isUser = message.role === 'user'
    const isLast = index === conversation.length - 1

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.4, 
          delay: isLast ? 0.1 : 0,
          type: "spring",
          stiffness: 200,
          damping: 20
        }}
        className={`message ${isUser ? 'user-message' : 'ai-message'}`}
      >
        <div className="message-avatar">
          {isUser ? (
            <div className="user-avatar">
              <span className="avatar-emoji">👤</span>
            </div>
          ) : (
            <div className="ai-avatar">
              <span className="avatar-emoji">🤖</span>
              {message.emotion && (
                <motion.div
                  className="emotion-indicator"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  {getEmotionEmoji(message.emotion)}
                </motion.div>
              )}
            </div>
          )}
        </div>

        <div className="message-content">
          <div className="message-bubble">
            {!isUser && message.emotion && (
              <div className="emotion-label">
                <span className="emotion-emoji">{getEmotionEmoji(message.emotion)}</span>
                <span className="emotion-text">
                  {message.emotion.charAt(0).toUpperCase() + message.emotion.slice(1)}
                </span>
              </div>
            )}
            
            <div className="message-text">
              {message.content}
            </div>

            {message.sources && message.sources.length > 0 && (
              <div className="message-sources">
                <div className="sources-header">
                  <ExternalLink className="sources-icon" />
                  <span>Sources:</span>
                </div>
                <div className="sources-list">
                  {message.sources.map((source, idx) => (
                    <span key={idx} className="source-tag">
                      {source}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="message-meta">
              <Clock className="time-icon" />
              <span className="message-time">{formatTime(message.timestamp)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const EmptyState = () => (
    <motion.div
      className="empty-state"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="empty-icon">
        <MessageCircle className="empty-icon-svg" />
      </div>
      <h3 className="empty-title">Start a conversation!</h3>
      <p className="empty-description">
        {mode === 'chat' 
          ? "I'll remember our conversation and build upon previous topics."
          : "Each question will be answered independently without conversation memory."
        }
      </p>
      
      <div className="conversation-starters">
        <h4 className="starters-title">Try asking about:</h4>
        <div className="starters-grid">
          {[
            { icon: '🐍', text: 'Python programming basics' },
            { icon: '🧮', text: 'Mathematical concepts' },
            { icon: '🔬', text: 'Scientific principles' },
            { icon: '💡', text: 'Problem-solving strategies' }
          ].map((starter, index) => (
            <motion.button
              key={index}
              className="starter-btn"
              onClick={() => onMessageSelect(starter.text)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <span className="starter-icon">{starter.icon}</span>
              <span className="starter-text">{starter.text}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="chat-interface">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-title">
          <MessageCircle className="chat-icon" />
          <h3>Conversation History</h3>
          <span className="mode-badge">{mode.toUpperCase()}</span>
        </div>
        
        <div className="chat-actions">
          {conversation.length > 0 && (
            <motion.button
              onClick={onClear}
              className="clear-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Clear conversation"
            >
              <Trash2 className="clear-icon" />
              Clear
            </motion.button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        <AnimatePresence>
          {conversation.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {conversation.map((message, index) => renderMessage(message, index))}
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="message ai-message loading-message"
                >
                  <div className="message-avatar">
                    <div className="ai-avatar">
                      <span className="avatar-emoji">🤖</span>
                      <motion.div
                        className="thinking-indicator"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        🤔
                      </motion.div>
                    </div>
                  </div>
                  <div className="message-content">
                    <div className="message-bubble loading">
                      <div className="typing-indicator">
                        <span className="typing-text">AI is thinking</span>
                        <div className="typing-dots">
                          <motion.span
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                          />
                          <motion.span
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                          />
                          <motion.span
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Footer */}
      <div className="chat-footer">
        <div className="conversation-stats">
          <div className="stat">
            <MessageCircle className="stat-icon" />
            <span>{conversation.length} messages</span>
          </div>
          <div className="stat">
            <span className="stat-emoji">💬</span>
            <span>{Math.ceil(conversation.length / 2)} exchanges</span>
          </div>
          <div className="stat">
            <span className="stat-emoji">🎯</span>
            <span>{mode} mode</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatInterface