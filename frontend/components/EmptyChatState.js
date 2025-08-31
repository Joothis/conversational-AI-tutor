import React from 'react';
import './EmptyChatState.css'; // Assuming you'll create a CSS file for this

const EmptyChatState = () => {
  return (
    <div className="empty-state">
      <div className="empty-icon">🎯</div>
      <h4>Start a conversation!</h4>
      <p>Ask me anything about the topics in my knowledge base.</p>
      <div className="conversation-starters">
        <div className="starter-category">
          <h5>📚 Learning Topics:</h5>
          <ul>
            <li>What is Python programming?</li>
            <li>Explain variables and data types</li>
            <li>How do loops work?</li>
            <li>Show me a code example</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmptyChatState;
