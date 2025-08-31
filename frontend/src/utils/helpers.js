import { ERROR_MESSAGES } from './constants'

// Format timestamp for display
export const formatTimestamp = (timestamp, format = 'time') => {
  const date = new Date(timestamp)
  
  switch (format) {
    case 'time':
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    case 'date':
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    case 'full':
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    default:
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
  }
}

// Debounce function for performance optimization
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Throttle function for performance optimization
export const throttle = (func, limit) => {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Generate unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Validate text input
export const validateTextInput = (text, maxLength = 1000) => {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: 'Text is required' }
  }
  
  if (text.trim().length === 0) {
    return { valid: false, error: 'Text cannot be empty' }
  }
  
  if (text.length > maxLength) {
    return { valid: false, error: `Text must be less than ${maxLength} characters` }
  }
  
  return { valid: true }
}

// Clean and sanitize text
export const sanitizeText = (text) => {
  if (!text) return ''
  
  return text
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s.,!?;:()\-'"]/g, '') // Remove special characters except common punctuation
}

// Check if browser supports required features
export const checkBrowserSupport = () => {
  const support = {
    speechRecognition: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
    speechSynthesis: 'speechSynthesis' in window,
    mediaRecorder: 'MediaRecorder' in window,
    getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    fetch: 'fetch' in window,
    localStorage: 'localStorage' in window
  }

  const unsupported = Object.entries(support)
    .filter(([key, value]) => !value)
    .map(([key]) => key)

  return {
    ...support,
    allSupported: unsupported.length === 0,
    unsupported
  }
}

// Handle API errors with user-friendly messages
export const handleApiError = (error) => {
  console.error('API Error:', error)
  
  if (!navigator.onLine) {
    return ERROR_MESSAGES.NETWORK_ERROR
  }
  
  if (error.message.includes('fetch')) {
    return ERROR_MESSAGES.API_CONNECTION
  }
  
  if (error.message.includes('timeout')) {
    return 'Request timed out. Please try again.'
  }
  
  if (error.message.includes('500')) {
    return 'Server error. Please try again later.'
  }
  
  if (error.message.includes('404')) {
    return 'Service not found. Please check the configuration.'
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR
}

// Local storage helpers
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.warn('Failed to get from localStorage:', error)
      return defaultValue
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.warn('Failed to set localStorage:', error)
      return false
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error)
      return false
    }
  },
  
  clear: () => {
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.warn('Failed to clear localStorage:', error)
      return false
    }
  }
}

// Audio utilities
export const audioUtils = {
  // Convert audio blob to different formats
  convertFormat: async (audioBlob, targetFormat) => {
    // This is a placeholder - actual conversion would require additional libraries
    console.warn('Audio format conversion not implemented')
    return audioBlob
  },
  
  // Get audio duration
  getDuration: (audioBlob) => {
    return new Promise((resolve) => {
      const audio = new Audio()
      audio.onloadedmetadata = () => {
        resolve(audio.duration)
      }
      audio.onerror = () => {
        resolve(0)
      }
      audio.src = URL.createObjectURL(audioBlob)
    })
  },
  
  // Check if audio format is supported
  isFormatSupported: (mimeType) => {
    return MediaRecorder.isTypeSupported(mimeType)
  }
}

// Performance monitoring
export const performance = {
  mark: (name) => {
    if ('performance' in window && performance.mark) {
      window.performance.mark(name)
    }
  },
  
  measure: (name, startMark, endMark) => {
    if ('performance' in window && performance.measure) {
      try {
        window.performance.measure(name, startMark, endMark)
        const measure = window.performance.getEntriesByName(name)[0]
        return measure ? measure.duration : 0
      } catch (error) {
        console.warn('Performance measurement failed:', error)
        return 0
      }
    }
    return 0
  }
}

// Accessibility helpers
export const a11y = {
  // Announce text to screen readers
  announce: (text) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.style.position = 'absolute'
    announcement.style.left = '-10000px'
    announcement.style.width = '1px'
    announcement.style.height = '1px'
    announcement.style.overflow = 'hidden'
    announcement.textContent = text
    
    document.body.appendChild(announcement)
    
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  },
  
  // Check if user prefers reduced motion
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },
  
  // Check if user prefers high contrast
  prefersHighContrast: () => {
    return window.matchMedia('(prefers-contrast: high)').matches
  }
}

export default {
  formatTimestamp,
  debounce,
  throttle,
  generateId,
  validateTextInput,
  sanitizeText,
  checkBrowserSupport,
  handleApiError,
  storage,
  audioUtils,
  performance,
  a11y
}