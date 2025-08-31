import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './Mascot.css'

const EMOTION_EXPRESSIONS = {
  neutral: { emoji: '😊', color: '#4facfe' },
  happy: { emoji: '😄', color: '#4ecdc4' },
  excited: { emoji: '🤩', color: '#ff6b6b' },
  thinking: { emoji: '🤔', color: '#ffa726' },
  confused: { emoji: '😕', color: '#ef5350' },
  explaining: { emoji: '🧠', color: '#ab47bc' },
  encouraging: { emoji: '💪', color: '#66bb6a' },
  listening: { emoji: '👂', color: '#42a5f5' },
  surprised: { emoji: '😮', color: '#ff7043' }
}

const Mascot = ({ 
  emotion = 'neutral', 
  isSpeaking = false, 
  isLoading = false,
  isListening = false 
}) => {
  const currentExpression = EMOTION_EXPRESSIONS[emotion] || EMOTION_EXPRESSIONS.neutral

  const containerVariants = {
    idle: {
      y: [0, -10, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    speaking: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    listening: {
      scale: [1, 1.02, 1],
      rotate: [0, 2, -2, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  const headVariants = {
    thinking: {
      rotate: [-5, 5, -5],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    excited: {
      y: [0, -5, 0],
      scale: [1, 1.1, 1],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  const getAnimationState = () => {
    if (isListening) return 'listening'
    if (isSpeaking) return 'speaking'
    return 'idle'
  }

  return (
    <motion.div
      className="mascot-container"
      variants={containerVariants}
      animate={getAnimationState()}
      style={{ '--emotion-color': currentExpression.color }}
    >
      {/* Status Indicators */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="status-indicator thinking"
          >
            <div className="thinking-dots">
              <motion.span
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
              />
              <motion.span
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
              />
              <motion.span
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
              />
            </div>
          </motion.div>
        )}

        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="status-indicator listening"
          >
            <div className="sound-waves">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="wave"
                  animate={{ scaleY: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.1,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot Head */}
      <motion.div
        className="mascot-head"
        variants={headVariants}
        animate={emotion === 'thinking' ? 'thinking' : emotion === 'excited' ? 'excited' : ''}
      >
        {/* Eyes */}
        <div className="eyes">
          <div className={`eye left-eye ${isLoading ? 'thinking' : isListening ? 'listening' : ''}`}>
            <motion.div
              className="pupil"
              animate={
                isLoading 
                  ? { x: [-3, 3, -3], y: [-2, 2, -2] }
                  : isListening
                  ? { scale: [1, 1.2, 1] }
                  : {}
              }
              transition={{
                duration: isLoading ? 2 : 1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
          <div className={`eye right-eye ${isLoading ? 'thinking' : isListening ? 'listening' : ''}`}>
            <motion.div
              className="pupil"
              animate={
                isLoading 
                  ? { x: [-3, 3, -3], y: [-2, 2, -2] }
                  : isListening
                  ? { scale: [1, 1.2, 1] }
                  : {}
              }
              transition={{
                duration: isLoading ? 2 : 1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
        </div>

        {/* Mouth */}
        <div className="mouth">
          {isSpeaking ? (
            <motion.div
              className="speaking-mouth"
              animate={{
                scaleY: [0.5, 1, 0.8, 1, 0.6],
                scaleX: [1, 0.8, 1.2, 0.9, 1]
              }}
              transition={{
                duration: 0.4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ) : (
            <div className="static-mouth" />
          )}
        </div>

        {/* Expression Overlay */}
        <motion.div
          className="expression-overlay"
          key={emotion}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <span className="emoji-expression">{currentExpression.emoji}</span>
        </motion.div>

        {/* Cheeks for blushing */}
        <AnimatePresence>
          {(emotion === 'happy' || emotion === 'excited') && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.8, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="cheek left-cheek"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.8, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="cheek right-cheek"
              />
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Body */}
      <motion.div
        className="mascot-body"
        animate={isSpeaking ? { rotate: [-1, 1, -1] } : {}}
        transition={{ duration: 0.5, repeat: Infinity }}
      >
        <div className="body-shape" />
        
        {/* Arms */}
        <motion.div
          className="arm left-arm"
          animate={
            isSpeaking 
              ? { rotate: [-30, -10, -30] }
              : { rotate: [-20, -15, -20] }
          }
          transition={{
            duration: isSpeaking ? 0.8 : 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="arm right-arm"
          animate={
            isSpeaking 
              ? { rotate: [30, 10, 30] }
              : { rotate: [20, 15, 20] }
          }
          transition={{
            duration: isSpeaking ? 0.8 : 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      {/* Excitement Particles */}
      <AnimatePresence>
        {emotion === 'excited' && (
          <div className="particles">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className={`particle particle-${i}`}
                initial={{ opacity: 0, scale: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  y: [-30, -60, -90],
                  x: [0, Math.random() * 40 - 20, Math.random() * 60 - 30]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeOut"
                }}
              >
                ✨
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Emotion Aura */}
      <motion.div
        className="emotion-aura"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          background: `radial-gradient(circle, ${currentExpression.color}20 0%, transparent 70%)`
        }}
      />
    </motion.div>
  )
}

export default Mascot