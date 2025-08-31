import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Mascot from './components/Mascot'
import ChatInterface from './components/ChatInterface'
import VoiceControls from './components/VoiceControls'
import ConnectionStatus from './components/ConnectionStatus'
import { apiService } from './services/api'
import { speechService } from './services/speech'
import './App.css'

function App() {
  // Core state
  const [conversation, setConversation] = useState([])
  const [currentEmotion, setCurrentEmotion] = useState('neutral')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState('chat') // 'chat' or 'query'
  const [sessionId, setSessionId] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [error, setError] = useState(null)

  // Refs
  const audioRef = useRef(null)
  const speechSynthesisRef = useRef(null)

  // Initialize services and check connection
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setConnectionStatus('connecting')
        await apiService.healthCheck()
        setConnectionStatus('connected')
        
        // Initialize speech services
        await speechService.initialize()
      } catch (error) {
        console.error('Failed to initialize app:', error)
        setConnectionStatus('disconnected')
        setError('Failed to connect to AI tutor backend')
      }
    }

    initializeApp()
  }, [])

  // Handle user input (text or speech)
  const handleUserInput = useCallback(async (text) => {
    if (!text.trim()) return

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date()
    }

    setConversation(prev => [...prev, userMessage])
    setIsLoading(true)
    setCurrentEmotion('thinking')
    setError(null)

    try {
      // Send to appropriate API endpoint
      const response = mode === 'chat' 
        ? await apiService.sendChatMessage(text, sessionId)
        : await apiService.sendQuery(text)

      // Update session ID for chat mode
      if (mode === 'chat' && response.session_id) {
        setSessionId(response.session_id)
      }

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.text,
        emotion: response.emotion,
        sources: response.sources || [],
        timestamp: new Date()
      }

      setConversation(prev => [...prev, aiMessage])
      setCurrentEmotion(response.emotion)

      // Speak the response
      await handleSpeak(response.text, response.emotion)

    } catch (error) {
      console.error('Error processing user input:', error)
      setError('Failed to get response from AI tutor')
      setCurrentEmotion('confused')
      
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        emotion: 'confused',
        timestamp: new Date()
      }
      setConversation(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [mode, sessionId])

  // Handle speech synthesis
  const handleSpeak = useCallback(async (text, emotion = 'neutral') => {
    try {
      setIsSpeaking(true)
      
      // Try API-based TTS first
      try {
        const audioUrl = await apiService.convertTextToSpeech(text, emotion)
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl
          audioRef.current.onended = () => {
            setIsSpeaking(false)
            setCurrentEmotion('neutral')
          }
          await audioRef.current.play()
        }
      } catch (apiError) {
        console.warn('API TTS failed, falling back to browser TTS:', apiError)
        
        // Fallback to browser speech synthesis
        await speechService.speak(text, emotion)
        setIsSpeaking(false)
        setCurrentEmotion('neutral')
      }
    } catch (error) {
      console.error('Speech synthesis error:', error)
      setIsSpeaking(false)
      setCurrentEmotion('neutral')
    }
  }, [])

  // Handle speech recognition
  const handleStartListening = useCallback(async () => {
    try {
      setIsListening(true)
      setCurrentEmotion('listening')
      setError(null)

      const transcript = await speechService.startListening()
      
      if (transcript) {
        await handleUserInput(transcript)
      }
    } catch (error) {
      console.error('Speech recognition error:', error)
      setError('Speech recognition failed. Please try typing instead.')
      setCurrentEmotion('confused')
    } finally {
      setIsListening(false)
    }
  }, [handleUserInput])

  const handleStopListening = useCallback(() => {
    speechService.stopListening()
    setIsListening(false)
    setCurrentEmotion('neutral')
  }, [])

  // Clear conversation
  const handleClearConversation = useCallback(async () => {
    try {
      if (sessionId) {
        await apiService.resetConversation(sessionId)
      }
      setConversation([])
      setSessionId(null)
      setCurrentEmotion('neutral')
      setError(null)
    } catch (error) {
      console.error('Failed to clear conversation:', error)
    }
  }, [sessionId])

  // Toggle mode
  const handleToggleMode = useCallback(() => {
    setMode(prev => prev === 'chat' ? 'query' : 'chat')
    handleClearConversation()
  }, [handleClearConversation])

  return (
    <div className="app">
      <ConnectionStatus status={connectionStatus} />
      
      <header className="app-header">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="header-content"
        >
          <h1 className="app-title">
            🤖 AI Tutor Companion
          </h1>
          <p className="app-subtitle">
            Your intelligent learning companion with speech recognition and natural conversation
          </p>
          
          <div className="mode-toggle">
            <button
              className={`mode-btn ${mode === 'chat' ? 'active' : ''}`}
              onClick={handleToggleMode}
              disabled={isLoading || isSpeaking}
            >
              💬 Chat Mode
            </button>
            <button
              className={`mode-btn ${mode === 'query' ? 'active' : ''}`}
              onClick={handleToggleMode}
              disabled={isLoading || isSpeaking}
            >
              ❓ Query Mode
            </button>
          </div>
        </motion.div>
      </header>

      <main className="app-main">
        <div className="main-content">
          {/* Mascot Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mascot-section"
          >
            <Mascot
              emotion={currentEmotion}
              isSpeaking={isSpeaking}
              isLoading={isLoading}
              isListening={isListening}
            />
          </motion.div>

          {/* Interaction Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="interaction-section"
          >
            <VoiceControls
              isListening={isListening}
              onStartListening={handleStartListening}
              onStopListening={handleStopListening}
              onTextInput={handleUserInput}
              disabled={isLoading || isSpeaking}
              connectionStatus={connectionStatus}
            />

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="error-banner"
              >
                <span className="error-icon">⚠️</span>
                <span className="error-text">{error}</span>
                <button 
                  className="error-dismiss"
                  onClick={() => setError(null)}
                >
                  ✕
                </button>
              </motion.div>
            )}

            <ChatInterface
              conversation={conversation}
              isLoading={isLoading}
              mode={mode}
              onClear={handleClearConversation}
              onMessageSelect={handleUserInput}
            />
          </motion.div>
        </div>
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p>Powered by LangChain RAG • Speech Recognition • Text-to-Speech</p>
          <div className="footer-stats">
            <span>💬 {conversation.length} messages</span>
            <span>🎯 {mode.toUpperCase()} mode</span>
            <span>🔊 {isSpeaking ? 'Speaking' : 'Ready'}</span>
          </div>
        </div>
      </footer>

      {/* Hidden audio element for TTS playback */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  )
}

export default App