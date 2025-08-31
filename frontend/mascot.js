import React from "react";
import './mascot.css';

import { MASCOT_EXPRESSIONS } from "./lib/constants.js";

const Mascot = ({
  emotion = "neutral",
  isSpeaking = false,
  isLoading = false,
}) => {
  // Emotion to expression mapping
  const expressions = MASCOT_EXPRESSIONS;

  const currentExpression = expressions[emotion] || expressions.neutral;

  let eyeAnimation = "";
  if (isLoading || emotion === "thinking") {
    eyeAnimation = "thinking";
  } else if (emotion === "listening") {
    eyeAnimation = "listening";
  }

  const mouthAnimation = isSpeaking ? "speaking" : "";

  return (
    <div className={`mascot-container ${eyeAnimation} ${mouthAnimation}`}>
      {/* Mascot Head */}
      <div className="mascot-head">
        {/* Eyes */}
        <div className="eyes">
          <div className={`eye left-eye ${eyeAnimation}`}>
            <div className="pupil"></div>
          </div>
          <div className={`eye right-eye ${eyeAnimation}`}>
            <div className="pupil"></div>
          </div>
        </div>

        {/* Mouth */}
        <div className={`mouth ${mouthAnimation}`}>
          {isSpeaking ? (
            <div className="speaking-mouth">
              <div className="mouth-shape"></div>
            </div>
          ) : (
            <div className="static-mouth"></div>
          )}
        </div>

        {/* Expression overlay */}
        <div className="expression-overlay">
          <span className="emoji-expression">{currentExpression}</span>
        </div>

        {/* Cheeks for blushing effect */}
        <div
          className={`cheek left-cheek ${
            emotion === "happy" || emotion === "excited" ? "blushing" : ""
          }`}
        ></div>
        <div
          className={`cheek right-cheek ${
            emotion === "happy" || emotion === "excited" ? "blushing" : ""
          }`}
        ></div>
      </div>

      {/* Body */}
      <div className="mascot-body">
        <div className="body-shape"></div>

        {/* Arms */}
        <div className={`arm left-arm ${isSpeaking ? "gesturing" : ""}`}></div>
        <div className={`arm right-arm ${isSpeaking ? "gesturing" : ""}`}></div>
      </div>

      {/* Status indicators */}
      {isLoading && (
        <div className="status-indicator loading">
          <div className="thinking-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}

      {emotion === "listening" && (
        <div className="status-indicator listening">
          <div className="sound-waves">
            <div className="wave"></div>
            <div className="wave"></div>
            <div className="wave"></div>
          </div>
        </div>
      )}

      {/* Floating particles for excitement */}
      {emotion === "excited" && (
        <div className="particles">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`particle particle-${i}`}>
              ✨
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Mascot;
