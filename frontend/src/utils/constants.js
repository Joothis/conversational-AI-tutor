// Emotion mappings for consistent UI
export const EMOTIONS = {
  NEUTRAL: 'neutral',
  HAPPY: 'happy',
  EXCITED: 'excited',
  THINKING: 'thinking',
  CONFUSED: 'confused',
  EXPLAINING: 'explaining',
  ENCOURAGING: 'encouraging',
  LISTENING: 'listening',
  SURPRISED: 'surprised'
}

export const EMOTION_COLORS = {
  [EMOTIONS.NEUTRAL]: '#4facfe',
  [EMOTIONS.HAPPY]: '#4ecdc4',
  [EMOTIONS.EXCITED]: '#ff6b6b',
  [EMOTIONS.THINKING]: '#ffa726',
  [EMOTIONS.CONFUSED]: '#ef5350',
  [EMOTIONS.EXPLAINING]: '#ab47bc',
  [EMOTIONS.ENCOURAGING]: '#66bb6a',
  [EMOTIONS.LISTENING]: '#42a5f5',
  [EMOTIONS.SURPRISED]: '#ff7043'
}

export const EMOTION_DESCRIPTIONS = {
  [EMOTIONS.NEUTRAL]: 'Ready to help',
  [EMOTIONS.HAPPY]: 'Pleased to assist',
  [EMOTIONS.EXCITED]: 'Enthusiastic about learning',
  [EMOTIONS.THINKING]: 'Processing your question',
  [EMOTIONS.CONFUSED]: 'Need clarification',
  [EMOTIONS.EXPLAINING]: 'Teaching mode active',
  [EMOTIONS.ENCOURAGING]: 'Motivating you to learn',
  [EMOTIONS.LISTENING]: 'Paying attention',
  [EMOTIONS.SURPRISED]: 'Interesting question!'
}

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000 // 1 second
}

// Speech Configuration
export const SPEECH_CONFIG = {
  RECOGNITION: {
    LANG: 'en-US',
    CONTINUOUS: false,
    INTERIM_RESULTS: false,
    MAX_ALTERNATIVES: 1
  },
  SYNTHESIS: {
    DEFAULT_RATE: 1.0,
    DEFAULT_PITCH: 1.0,
    DEFAULT_VOLUME: 0.8,
    PREFERRED_VOICE_GENDER: 'female',
    PREFERRED_ACCENT: 'us'
  }
}

// UI Configuration
export const UI_CONFIG = {
  ANIMATION_DURATION: 0.3,
  MESSAGE_MAX_LENGTH: 1000,
  CONVERSATION_MAX_MESSAGES: 100,
  AUTO_SCROLL_DELAY: 100
}

// Error Messages
export const ERROR_MESSAGES = {
  API_CONNECTION: 'Unable to connect to AI tutor. Please check your connection.',
  SPEECH_RECOGNITION: 'Speech recognition failed. Please try again or use text input.',
  SPEECH_SYNTHESIS: 'Text-to-speech failed. The response is displayed as text.',
  MICROPHONE_ACCESS: 'Microphone access denied. Please allow microphone access in your browser.',
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
}

// Success Messages
export const SUCCESS_MESSAGES = {
  CONNECTION_ESTABLISHED: 'Connected to AI tutor successfully!',
  SPEECH_RECOGNITION_READY: 'Speech recognition is ready.',
  CONVERSATION_CLEARED: 'Conversation history cleared.',
  MODE_SWITCHED: 'Mode switched successfully.'
}

// Feature Flags
export const FEATURES = {
  SPEECH_RECOGNITION: true,
  TEXT_TO_SPEECH: true,
  CONVERSATION_MEMORY: true,
  EMOTION_DETECTION: true,
  SOURCE_CITATIONS: true,
  QUICK_ACTIONS: true,
  VOICE_VISUALIZATION: true
}

export default {
  EMOTIONS,
  EMOTION_COLORS,
  EMOTION_DESCRIPTIONS,
  API_CONFIG,
  SPEECH_CONFIG,
  UI_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  FEATURES
}