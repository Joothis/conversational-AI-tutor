const API_URL = "http://localhost:8000";

/**
 * Sends a query to the stateless /query endpoint.
 * @param {string} question The question to send to the backend.
 * @returns {Promise<object>} The response from the backend.
 */
export const postQuery = async (question) => {
    const response = await fetch(`${API_URL}/query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
};

/**
 * Sends a query to the stateful /chat endpoint.
 * @param {string} question The question to send to the backend.
 * @returns {Promise<object>} The response from the backend.
 */
export const postChat = async (question) => {
    const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
};
