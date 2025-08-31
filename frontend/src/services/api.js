const API_BASE_URL = "http://localhost:8000";

export const api = {
  // Speech-to-Text conversion
  async convertSpeechToText(audioBlob) {
    try {
      // Convert blob to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve) => {
        reader.onloadend = () => {
          const base64String = reader.result
            .replace("data:audio/webm;base64,", "")
            .replace("data:audio/wav;base64,", "");
          resolve(base64String);
        };
      });
      reader.readAsDataURL(audioBlob);

      const base64Audio = await base64Promise;

      const response = await fetch(`${API_BASE_URL}/stt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio_base64: base64Audio,
          format: audioBlob.type.includes("webm") ? "webm" : "wav",
        }),
      });

      if (!response.ok) {
        throw new Error(`STT Error: ${response.status}`);
      }

      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error("Speech to text error:", error);
      throw error;
    }
  },

  // Send message to tutor
  async sendMessage(message, sessionId = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: message,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Send message error:", error);
      throw error;
    }
  },

  // Convert text to speech
  async convertTextToSpeech(text, emotion = "neutral") {
    try {
      const response = await fetch(`${API_BASE_URL}/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          emotion,
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS Error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      return URL.createObjectURL(audioBlob);
    } catch (error) {
      console.error("Text to speech error:", error);
      throw error;
    }
  },

  // Reset conversation
  async resetConversation(sessionId = null) {
    try {
      const response = await fetch(`${API_BASE_URL}/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Reset Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Reset conversation error:", error);
      throw error;
    }
  },
};
