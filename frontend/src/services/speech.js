class SpeechService {
  constructor() {
    this.recognition = null
    this.synthesis = null
    this.isInitialized = false
    this.isListening = false
    this.voices = []
  }

  async initialize() {
    try {
      // Initialize Speech Recognition
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        this.recognition = new SpeechRecognition()
        
        this.recognition.continuous = false
        this.recognition.interimResults = false
        this.recognition.lang = 'en-US'
        this.recognition.maxAlternatives = 1
      }

      // Initialize Speech Synthesis
      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis
        
        // Load voices
        await this.loadVoices()
      }

      this.isInitialized = true
      console.log('Speech services initialized successfully')
    } catch (error) {
      console.error('Failed to initialize speech services:', error)
      throw error
    }
  }

  async loadVoices() {
    return new Promise((resolve) => {
      const loadVoicesImpl = () => {
        this.voices = this.synthesis.getVoices()
        if (this.voices.length > 0) {
          resolve(this.voices)
        } else {
          // Some browsers load voices asynchronously
          setTimeout(loadVoicesImpl, 100)
        }
      }

      if (this.synthesis.onvoiceschanged !== undefined) {
        this.synthesis.onvoiceschanged = loadVoicesImpl
      }
      
      loadVoicesImpl()
    })
  }

  async startListening() {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported')
    }

    if (this.isListening) {
      return
    }

    return new Promise((resolve, reject) => {
      this.isListening = true

      this.recognition.onstart = () => {
        console.log('Speech recognition started')
      }

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        console.log('Speech recognition result:', transcript)
        this.isListening = false
        resolve(transcript)
      }

      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        this.isListening = false
        
        let errorMessage = 'Speech recognition failed'
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.'
            break
          case 'audio-capture':
            errorMessage = 'Microphone not accessible. Please check permissions.'
            break
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access.'
            break
          case 'network':
            errorMessage = 'Network error. Please check your connection.'
            break
          default:
            errorMessage = `Speech recognition error: ${event.error}`
        }
        
        reject(new Error(errorMessage))
      }

      this.recognition.onend = () => {
        console.log('Speech recognition ended')
        this.isListening = false
      }

      try {
        this.recognition.start()
      } catch (error) {
        this.isListening = false
        reject(error)
      }
    })
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
    }
  }

  async speak(text, emotion = 'neutral') {
    if (!this.synthesis) {
      throw new Error('Speech synthesis not supported')
    }

    // Cancel any ongoing speech
    this.synthesis.cancel()

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text)

      // Configure voice based on emotion
      const voiceConfig = this.getVoiceConfig(emotion)
      
      // Select appropriate voice
      const voice = this.selectVoice(voiceConfig.gender, voiceConfig.accent)
      if (voice) {
        utterance.voice = voice
      }

      // Configure speech parameters
      utterance.rate = voiceConfig.rate
      utterance.pitch = voiceConfig.pitch
      utterance.volume = voiceConfig.volume

      utterance.onstart = () => {
        console.log('Speech synthesis started')
      }

      utterance.onend = () => {
        console.log('Speech synthesis ended')
        resolve()
      }

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error)
        reject(new Error(`Speech synthesis failed: ${event.error}`))
      }

      try {
        this.synthesis.speak(utterance)
      } catch (error) {
        reject(error)
      }
    })
  }

  getVoiceConfig(emotion) {
    const configs = {
      happy: { rate: 1.1, pitch: 1.2, volume: 0.9, gender: 'female', accent: 'us' },
      excited: { rate: 1.2, pitch: 1.3, volume: 1.0, gender: 'female', accent: 'us' },
      thinking: { rate: 0.8, pitch: 0.9, volume: 0.8, gender: 'male', accent: 'uk' },
      confused: { rate: 0.7, pitch: 0.8, volume: 0.7, gender: 'female', accent: 'us' },
      explaining: { rate: 0.9, pitch: 1.0, volume: 0.9, gender: 'male', accent: 'us' },
      encouraging: { rate: 1.0, pitch: 1.1, volume: 0.9, gender: 'female', accent: 'us' },
      listening: { rate: 1.0, pitch: 1.0, volume: 0.8, gender: 'female', accent: 'us' },
      surprised: { rate: 1.1, pitch: 1.2, volume: 0.9, gender: 'female', accent: 'us' },
      neutral: { rate: 1.0, pitch: 1.0, volume: 0.8, gender: 'female', accent: 'us' }
    }

    return configs[emotion] || configs.neutral
  }

  selectVoice(preferredGender = 'female', preferredAccent = 'us') {
    if (!this.voices.length) {
      return null
    }

    // Try to find a voice matching preferences
    let voice = this.voices.find(v => 
      v.lang.startsWith('en') && 
      v.name.toLowerCase().includes(preferredGender) &&
      (v.name.toLowerCase().includes('us') || v.name.toLowerCase().includes('united states'))
    )

    // Fallback to any English voice
    if (!voice) {
      voice = this.voices.find(v => v.lang.startsWith('en'))
    }

    // Final fallback to first available voice
    if (!voice) {
      voice = this.voices[0]
    }

    return voice
  }

  // Check if speech recognition is supported
  isSpeechRecognitionSupported() {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  }

  // Check if speech synthesis is supported
  isSpeechSynthesisSupported() {
    return 'speechSynthesis' in window
  }

  // Get available voices
  getAvailableVoices() {
    return this.voices
  }

  // Test speech recognition
  async testSpeechRecognition() {
    if (!this.isSpeechRecognitionSupported()) {
      throw new Error('Speech recognition not supported')
    }

    try {
      const result = await this.startListening()
      return { success: true, transcript: result }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Test speech synthesis
  async testSpeechSynthesis(text = 'Hello, this is a test of the speech synthesis system.') {
    if (!this.isSpeechSynthesisSupported()) {
      throw new Error('Speech synthesis not supported')
    }

    try {
      await this.speak(text)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Get microphone permission status
  async getMicrophonePermission() {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' })
      return result.state // 'granted', 'denied', or 'prompt'
    } catch (error) {
      console.warn('Could not check microphone permission:', error)
      return 'unknown'
    }
  }

  // Request microphone permission
  async requestMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Stop the stream immediately as we just wanted permission
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      console.error('Microphone permission denied:', error)
      return false
    }
  }
}

// Create singleton instance
export const speechService = new SpeechService()

export default speechService