import { useState, useRef, useCallback, useEffect } from 'react'
import { speechService } from '../services/speech'
import { audioRecorder } from '../services/audioRecorder'
import { apiService } from '../services/api'

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState(null)
  const [transcript, setTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  
  const recognitionRef = useRef(null)
  const timeoutRef = useRef(null)

  // Initialize speech recognition
  useEffect(() => {
    const initializeSpeech = async () => {
      try {
        await speechService.initialize()
        setIsSupported(speechService.isSpeechRecognitionSupported())
      } catch (error) {
        console.error('Failed to initialize speech recognition:', error)
        setError('Speech recognition initialization failed')
        setIsSupported(false)
      }
    }

    initializeSpeech()

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      stopListening()
    }
  }, [])

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError('Speech recognition not supported')
      return null
    }

    if (isListening) {
      return null
    }

    try {
      setIsListening(true)
      setError(null)
      setTranscript('')
      setConfidence(0)

      // Set timeout for listening
      timeoutRef.current = setTimeout(() => {
        stopListening()
        setError('Listening timeout. Please try again.')
      }, 10000) // 10 second timeout

      const result = await speechService.startListening()
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      setTranscript(result)
      setConfidence(0.9) // Mock confidence score
      setIsListening(false)
      
      return result
    } catch (error) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      setIsListening(false)
      setError(error.message)
      console.error('Speech recognition error:', error)
      return null
    }
  }, [isSupported, isListening])

  const stopListening = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    speechService.stopListening()
    setIsListening(false)
  }, [])

  // Alternative method using MediaRecorder + API
  const startListeningWithRecorder = useCallback(async () => {
    if (!audioRecorder.constructor.isSupported()) {
      setError('Audio recording not supported')
      return null
    }

    try {
      setIsListening(true)
      setError(null)

      // Initialize and start recording
      await audioRecorder.initialize()
      await audioRecorder.startRecording()

      // Set timeout
      timeoutRef.current = setTimeout(async () => {
        const audioBlob = await audioRecorder.stopRecording()
        setIsListening(false)
        
        if (audioBlob) {
          try {
            const transcript = await apiService.convertSpeechToText(audioBlob)
            setTranscript(transcript)
            return transcript
          } catch (error) {
            setError('Failed to transcribe audio')
            return null
          }
        }
      }, 5000) // 5 second recording

      return new Promise((resolve) => {
        // This will be resolved by the timeout
        const originalTimeout = timeoutRef.current
        timeoutRef.current = setTimeout(async () => {
          const audioBlob = await audioRecorder.stopRecording()
          setIsListening(false)
          
          if (audioBlob) {
            try {
              const transcript = await apiService.convertSpeechToText(audioBlob)
              setTranscript(transcript)
              resolve(transcript)
            } catch (error) {
              setError('Failed to transcribe audio')
              resolve(null)
            }
          } else {
            resolve(null)
          }
        }, 5000)
      })
    } catch (error) {
      setIsListening(false)
      setError(error.message)
      return null
    }
  }, [])

  const stopListeningWithRecorder = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    try {
      const audioBlob = await audioRecorder.stopRecording()
      setIsListening(false)

      if (audioBlob) {
        const transcript = await apiService.convertSpeechToText(audioBlob)
        setTranscript(transcript)
        return transcript
      }
      
      return null
    } catch (error) {
      setError('Failed to process recording')
      return null
    }
  }, [])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setConfidence(0)
    setError(null)
  }, [])

  const checkMicrophonePermission = useCallback(async () => {
    try {
      const permission = await speechService.getMicrophonePermission()
      return permission === 'granted'
    } catch (error) {
      console.error('Failed to check microphone permission:', error)
      return false
    }
  }, [])

  const requestMicrophonePermission = useCallback(async () => {
    try {
      return await speechService.requestMicrophonePermission()
    } catch (error) {
      console.error('Failed to request microphone permission:', error)
      setError('Microphone permission denied')
      return false
    }
  }, [])

  return {
    // State
    isListening,
    isSupported,
    error,
    transcript,
    confidence,
    
    // Actions
    startListening,
    stopListening,
    startListeningWithRecorder,
    stopListeningWithRecorder,
    resetTranscript,
    
    // Utilities
    checkMicrophonePermission,
    requestMicrophonePermission
  }
}

export default useSpeechRecognition