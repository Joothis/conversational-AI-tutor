const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error)
      throw error
    }
  }

  // Health check
  async healthCheck() {
    return await this.request('/health')
  }

  // Chat endpoint - maintains conversation history
  async sendChatMessage(question, sessionId = null) {
    const payload = { question }
    if (sessionId) {
      payload.session_id = sessionId
    }

    return await this.request('/chat', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }

  // Query endpoint - stateless single questions
  async sendQuery(question) {
    return await this.request('/query', {
      method: 'POST',
      body: JSON.stringify({ question })
    })
  }

  // Speech-to-Text conversion
  async convertSpeechToText(audioBlob) {
    try {
      // Convert blob to base64
      const base64Audio = await this.blobToBase64(audioBlob)
      
      const response = await this.request('/stt/base64', {
        method: 'POST',
        body: JSON.stringify({
          audio_base64: base64Audio,
          format: audioBlob.type.includes('webm') ? 'webm' : 'wav'
        })
      })

      return response.text
    } catch (error) {
      console.error('STT API error:', error)
      throw new Error('Failed to convert speech to text')
    }
  }

  // Text-to-Speech conversion
  async convertTextToSpeech(text, emotion = 'neutral') {
    try {
      const response = await fetch(`${this.baseURL}/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          emotion,
          voice: 'default',
          speed: 1.0
        })
      })

      if (!response.ok) {
        throw new Error(`TTS HTTP ${response.status}: ${response.statusText}`)
      }

      const audioBlob = await response.blob()
      return URL.createObjectURL(audioBlob)
    } catch (error) {
      console.error('TTS API error:', error)
      throw new Error('Failed to convert text to speech')
    }
  }

  // Reset conversation
  async resetConversation(sessionId = null) {
    const payload = {}
    if (sessionId) {
      payload.session_id = sessionId
    }

    return await this.request('/reset', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }

  // Get session information
  async getSessionInfo(sessionId) {
    return await this.request(`/session/${sessionId}`)
  }

  // Get all sessions (for debugging)
  async getAllSessions() {
    return await this.request('/sessions')
  }

  // Utility method to convert blob to base64
  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result
          .replace('data:audio/webm;base64,', '')
          .replace('data:audio/wav;base64,', '')
          .replace('data:audio/mp3;base64,', '')
          .replace('data:audio/ogg;base64,', '')
        resolve(base64String)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Upload knowledge base file (if implemented)
  async uploadKnowledgeFile(file) {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${this.baseURL}/upload-knowledge`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('File upload error:', error)
      throw error
    }
  }

  // Test connection with timeout
  async testConnection(timeout = 5000) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(`${this.baseURL}/health`, {
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      return response.ok
    } catch (error) {
      clearTimeout(timeoutId)
      return false
    }
  }
}

// Create singleton instance
export const apiService = new ApiService()

// Export individual functions for backward compatibility
export const chatAPI = (question, sessionId) => apiService.sendChatMessage(question, sessionId)
export const queryAPI = (question) => apiService.sendQuery(question)
export const healthCheck = () => apiService.healthCheck()
export const resetConversation = (sessionId) => apiService.resetConversation(sessionId)

export default apiService