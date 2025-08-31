import React from 'react';
import { EMOTION_MAP } from '../lib/constants';
import './EmotionIndicator.css'; // Assuming you'll create a CSS file for this

const EmotionIndicator = ({ emotion }) => {
  return (
    <div className="emotion-indicator">
      <span className="emotion-emoji">
        {EMOTION_MAP[emotion] || "😊"}
      </span>
      <span className="emotion-text">
        {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
      </span>
    </div>
  );
};

export default EmotionIndicator;
