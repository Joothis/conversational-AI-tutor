import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Send, Keyboard, Volume2 } from 'lucide-react'
import './VoiceControls.css'

const VoiceControls = ({ 
  isListening, 
  onStartListening, 
  onStopListening, 
  onTextInput, 
  disabled,
  connectionStatus 
}) => {
  const [inputMode, setInputMode] = useState('voice')
  const [textInput, setTextInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef(null)

  const handleTextSubmit = useCallback((e) => {
    e.preventDefault()
    if (textInput.trim() && !disabled) {
      onTextInput(textInput.trim())
      setTextInput('')
    }
  }, [textInput, disabled, onTextInput])

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleTextSubmit(e)
    }
  }, [handleTextSubmit])

  const handleVoiceToggle = useCallback(() => {
    if (isListening) {
      onStopListening()
    } else {
      onStartListening()
    }
  }, [isListening, onStartListening, onStopListening])

  const quickActions = [
    { text: "What is Python?", icon: "🐍", label: "Python" },
    { text: "Explain variables", icon: "📦", label: "Variables" },
    { text: "Show me an example", icon: "💡", label: "Example" },
    { text: "Help me practice", icon: "🏃", label: "Practice" },
    { text: "What is machine learning?", icon: "🤖", label: "ML" },
    { text: "How do functions work?", icon: "⚙️", label: "Functions" }
  ]

  const isVoiceAvailable = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window

  return (
    <motion.div
      className="voice-controls"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Input Mode Toggle */}
      <div className="input-mode-toggle">
        <motion.button
          className={`mode-btn ${inputMode === 'voice' ? 'active' : ''}`}
          onClick={() => setInputMode('voice')}
          disabled={disabled || !isVoiceAvailable}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Mic className="mode-icon" />
          Voice
        </motion.button>
        <motion.button
          className={`mode-btn ${inputMode === 'text' ? 'active' : ''}`}
          onClick={() => setInputMode('text')}
          disabled={disabled}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Keyboard className="mode-icon" />
          Text
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {inputMode === 'voice' ? (
          <motion.div
            key="voice"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="voice-input-section"
          >
            {/* Microphone Button */}
            <div className="mic-container">
              <motion.button
                className={`mic-button ${isListening ? 'listening' : ''} ${disabled ? 'disabled' : ''}`}
                onClick={handleVoiceToggle}
                disabled={disabled || connectionStatus !== 'connected'}
                whileHover={!disabled ? { scale: 1.05 } : {}}
                whileTap={!disabled ? { scale: 0.95 } : {}}
                animate={isListening ? {
                  boxShadow: [
                    '0 0 0 0 rgba(79, 172, 254, 0.4)',
                    '0 0 0 20px rgba(79, 172, 254, 0)',
                    '0 0 0 0 rgba(79, 172, 254, 0.4)'
                  ]
                } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div className="mic-icon-container">
                  {isListening ? (
                    <>
                      <motion.div
                        className="pulse-ring"
                        animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <motion.div
                        className="pulse-ring delay"
                        animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                      />
                      <MicOff className="mic-icon active" />
                    </>
                  ) : (
                    <Mic className="mic-icon" />
                  )}
                </div>
              </motion.button>
            </div>

            {/* Voice Status */}
            <div className="voice-status">
              <AnimatePresence mode="wait">
                {isListening ? (
                  <motion.div
                    key="listening"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="status-text listening"
                  >
                    <Volume2 className="status-icon" />
                    <span>Listening... Speak now!</span>
                    <div className="sound-visualizer">
                      {[...Array(5)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="visualizer-bar"
                          animate={{
                            scaleY: [0.3, 1, 0.3],
                            opacity: [0.4, 1, 0.4]
                          }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.1,
                            ease: "easeInOut"
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                ) : disabled ? (
                  <motion.div
                    key="disabled"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="status-text disabled"
                  >
                    <span>AI is thinking or speaking...</span>
                  </motion.div>
                ) : connectionStatus !== 'connected' ? (
                  <motion.div
                    key="disconnected"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="status-text error"
                  >
                    <span>Connection required for voice input</span>
                  </motion.div>
                ) : !isVoiceAvailable ? (
                  <motion.div
                    key="unavailable"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="status-text error"
                  >
                    <span>Voice recognition not supported in this browser</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="ready"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="status-text ready"
                  >
                    <Mic className="status-icon" />
                    <span>Press the microphone to start speaking</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="text"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="text-input-section"
          >
            <form onSubmit={handleTextSubmit} className="text-input-form">
              <div className="input-container">
                <textarea
                  ref={textareaRef}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your question here... (Press Enter to send)"
                  disabled={disabled}
                  rows="4"
                  maxLength="1000"
                  className="text-input"
                />
                <div className="input-actions">
                  <span className="character-count">
                    {textInput.length}/1000
                  </span>
                  <motion.button
                    type="submit"
                    disabled={!textInput.trim() || disabled}
                    className="send-button"
                    whileHover={!disabled ? { scale: 1.05 } : {}}
                    whileTap={!disabled ? { scale: 0.95 } : {}}
                  >
                    <Send className="send-icon" />
                  </motion.button>
                </div>
              </div>
            </form>

            <div className="text-status">
              {disabled ? (
                <span className="status-text disabled">
                  AI is processing your request...
                </span>
              ) : (
                <span className="status-text ready">
                  Type your question and press Enter or click send
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Actions */}
      <motion.div
        className="quick-actions"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <h4 className="quick-actions-title">Quick Questions:</h4>
        <div className="quick-actions-grid">
          {quickActions.map((action, index) => (
            <motion.button
              key={index}
              className="quick-action-btn"
              onClick={() => onTextInput(action.text)}
              disabled={disabled}
              whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
              whileTap={!disabled ? { scale: 0.98 } : {}}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <span className="action-icon">{action.icon}</span>
              <span className="action-label">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Tips */}
      <motion.div
        className="interaction-tips"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="tip">
          <span className="tip-icon">💡</span>
          <span className="tip-text">
            {inputMode === 'voice'
              ? "Speak clearly and wait for the microphone to activate. Make sure your browser allows microphone access."
              : "Ask questions about programming, math, science, or any topic in the knowledge base. Use Enter to send quickly."}
          </span>
        </div>
        {inputMode === 'voice' && (
          <div className="tip">
            <span className="tip-icon">🎯</span>
            <span className="tip-text">
              For best results, speak in a quiet environment and pause briefly after your question.
            </span>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default VoiceControls