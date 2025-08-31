// api.js - API service for communicating with the backend

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

// API request helper
const apiRequest = async (endpoint, method = "GET", data = null) => {
  const config = {
    method,
    headers: {
      "Content-Type": "application/json",
    },
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
};

// Chat API - for conversational queries with memory
export const chatAPI = async (question) => {
  return await apiRequest("/chat", "POST", { question });
};

// Query API - for single, stateless queries
export const queryAPI = async (question) => {
  return await apiRequest("/query", "POST", { question });
};

// Health check
export const healthCheck = async () => {
  return await apiRequest("/");
};

// Upload knowledge base file (if implemented in backend)
export const uploadKnowledge = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${API_BASE_URL}/upload-knowledge`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("File upload failed:", error);
    throw error;
  }
};

// Reset conversation memory
export const resetConversation = async () => {
  return await apiRequest("/reset-conversation", "POST");
};

// Get conversation history (if implemented)
export const getConversationHistory = async () => {
  return await apiRequest("/conversation-history");
};

// Get available emotions
export const getEmotions = async () => {
  return await apiRequest("/emotions");
};

// Export all functions as default object
const api = {
  chatAPI,
  queryAPI,
  healthCheck,
  uploadKnowledge,
  resetConversation,
  getConversationHistory,
  getEmotions,
};

export default api;
