import { useState, useRef, useCallback, useEffect } from 'react'
import { speechService } from '../services/speech'
import { apiService } from '../services/api'

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState(null)
  const [currentText, setCurrentText] = useState('')
  const [progress, setProgress] = useState(0)
  
  const audioRef = useRef(null)
  const utteranceRef = useRef(null)

  // Initialize text-to-speech
  useEffect(() => {
    const initializeTTS = async () => {
      try {
        await speechService.initialize()
        setIsSupported(speechService.isSpeechSynthesisSupported())
      } catch (error) {
        console.error('Failed to initialize text-to-speech:', error)
        setError('Text-to-speech initialization failed')
        setIsSupported(false)
      }
    }

    initializeTTS()

    return () => {
      stop()
    }
  }, [])

  // Speak using browser's speech synthesis
  const speakWithBrowser = useCallback(async (text, emotion = 'neutral') => {
    if (!isSupported) {
      throw new Error('Speech synthesis not supported')
    }

    try {
      setIsSpeaking(true)
      setCurrentText(text)
      setError(null)
      setProgress(0)

      await speechService.speak(text, emotion)
      
      setIsSpeaking(false)
      setProgress(100)
      setCurrentText('')
    } catch (error) {
      setIsSpeaking(false)
      setError(error.message)
      setCurrentText('')
      throw error
    }
  }, [isSupported])

  // Speak using API-based TTS
  const speakWithAPI = useCallback(async (text, emotion = 'neutral') => {
    try {
      setIsSpeaking(true)
      setCurrentText(text)
      setError(null)
      setProgress(0)

      const audioUrl = await apiService.convertTextToSpeech(text, emotion)
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl
        
        audioRef.current.onloadstart = () => setProgress(10)
        audioRef.current.oncanplay = () => setProgress(50)
        audioRef.current.onplay = () => setProgress(75)
        
        audioRef.current.onended = () => {
          setIsSpeaking(false)
          setProgress(100)
          setCurrentText('')
          URL.revokeObjectURL(audioUrl) // Clean up
        }
        
        audioRef.current.onerror = (error) => {
          setIsSpeaking(false)
          setError('Audio playback failed')
          setCurrentText('')
          URL.revokeObjectURL(audioUrl)
        }

        await audioRef.current.play()
      }
    } catch (error) {
      setIsSpeaking(false)
      setError(error.message)
      setCurrentText('')
      throw error
    }
  }, [])

  // Main speak function with fallback
  const speak = useCallback(async (text, emotion = 'neutral', useAPI = true) => {
    if (!text || text.trim().length === 0) {
      return
    }

    try {
      if (useAPI) {
        await speakWithAPI(text, emotion)
      } else {
        await speakWithBrowser(text, emotion)
      }
    } catch (apiError) {
      console.warn('API TTS failed, falling back to browser TTS:', apiError)
      try {
        await speakWithBrowser(text, emotion)
      } catch (browserError) {
        console.error('Both TTS methods failed:', browserError)
        setError('Text-to-speech failed')
        throw browserError
      }
    }
  }, [speakWithAPI, speakWithBrowser])

  // Stop speaking
  const stop = useCallback(() => {
    // Stop browser synthesis
    if (speechService.synthesis) {
      speechService.synthesis.cancel()
    }

    // Stop audio playback
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    setIsSpeaking(false)
    setCurrentText('')
    setProgress(0)
  }, [])

  // Pause speaking (if supported)
  const pause = useCallback(() => {
    if (speechService.synthesis) {
      speechService.synthesis.pause()
    }
    
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }, [])

  // Resume speaking (if supported)
  const resume = useCallback(() => {
    if (speechService.synthesis) {
      speechService.synthesis.resume()
    }
    
    if (audioRef.current) {
      audioRef.current.play()
    }
  }, [])

  // Get available voices
  const getVoices = useCallback(() => {
    return speechService.getAvailableVoices()
  }, [])

  // Test TTS functionality
  const test = useCallback(async (testText = 'Hello, this is a test of the text-to-speech system.') => {
    try {
      await speak(testText, 'neutral', false) // Use browser TTS for testing
      return true
    } catch (error) {
      console.error('TTS test failed:', error)
      return false
    }
  }, [speak])

  return {
    // State
    isSpeaking,
    isSupported,
    error,
    currentText,
    progress,
    
    // Actions
    speak,
    stop,
    pause,
    resume,
    
    // Utilities
    getVoices,
    test,
    
    // Refs for external access
    audioRef
  }
}

export default useTextToSpeech