import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, Loader } from 'lucide-react'
import './ConnectionStatus.css'

const ConnectionStatus = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          text: 'Connected',
          className: 'connected',
          color: '#4ecdc4'
        }
      case 'connecting':
        return {
          icon: Loader,
          text: 'Connecting...',
          className: 'connecting',
          color: '#ffa726'
        }
      case 'disconnected':
        return {
          icon: WifiOff,
          text: 'Disconnected',
          className: 'disconnected',
          color: '#ff6b6b'
        }
      default:
        return {
          icon: Loader,
          text: 'Unknown',
          className: 'connecting',
          color: '#ffa726'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <AnimatePresence>
      <motion.div
        className={`connection-status ${config.className}`}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="status-icon"
          animate={status === 'connecting' ? { rotate: 360 } : {}}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Icon className="icon" />
        </motion.div>
        <span className="status-text">{config.text}</span>
        
        {status === 'connected' && (
          <motion.div
            className="status-indicator"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default ConnectionStatus