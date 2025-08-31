class AudioRecorder {
  constructor() {
    this.mediaRecorder = null
    this.audioChunks = []
    this.stream = null
    this.isRecording = false
  }

  async initialize() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        } 
      })
      
      // Check for supported MIME types
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav'
      ]

      let selectedMimeType = 'audio/webm'
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType
          break
        }
      }

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: selectedMimeType
      })

      this.setupEventHandlers()
      console.log('Audio recorder initialized with MIME type:', selectedMimeType)
      return true
    } catch (error) {
      console.error('Failed to initialize audio recorder:', error)
      throw error
    }
  }

  setupEventHandlers() {
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data)
      }
    }

    this.mediaRecorder.onstart = () => {
      console.log('Recording started')
      this.isRecording = true
      this.audioChunks = []
    }

    this.mediaRecorder.onstop = () => {
      console.log('Recording stopped')
      this.isRecording = false
    }

    this.mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event.error)
      this.isRecording = false
    }
  }

  async startRecording() {
    if (!this.mediaRecorder) {
      await this.initialize()
    }

    if (this.mediaRecorder.state === 'inactive') {
      this.audioChunks = []
      this.mediaRecorder.start(100) // Collect data every 100ms
      return true
    }
    
    return false
  }

  async stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null)
        return
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { 
          type: this.mediaRecorder.mimeType 
        })
        this.audioChunks = []
        this.isRecording = false
        resolve(audioBlob)
      }

      this.mediaRecorder.onerror = (event) => {
        reject(new Error(`Recording error: ${event.error}`))
      }

      this.mediaRecorder.stop()
    })
  }

  getRecordingState() {
    return this.mediaRecorder ? this.mediaRecorder.state : 'inactive'
  }

  isCurrentlyRecording() {
    return this.isRecording
  }

  async getAudioLevel() {
    if (!this.stream) {
      return 0
    }

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(this.stream)
      
      analyser.fftSize = 256
      microphone.connect(analyser)
      
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      analyser.getByteFrequencyData(dataArray)
      
      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
      return average / 255 // Normalize to 0-1
    } catch (error) {
      console.warn('Could not get audio level:', error)
      return 0
    }
  }

  cleanup() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop()
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }

    this.mediaRecorder = null
    this.isRecording = false
    this.audioChunks = []
  }

  // Static method to check browser support
  static isSupported() {
    return !!(navigator.mediaDevices && 
              navigator.mediaDevices.getUserMedia && 
              window.MediaRecorder)
  }

  // Get supported MIME types
  static getSupportedMimeTypes() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/wav',
      'audio/ogg;codecs=opus'
    ]

    return types.filter(type => MediaRecorder.isTypeSupported(type))
  }
}

// Create singleton instance
export const audioRecorder = new AudioRecorder()

export default audioRecorder