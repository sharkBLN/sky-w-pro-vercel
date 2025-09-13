'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Volume2, VolumeX, Music, Settings } from 'lucide-react'

interface AudioManagerProps {
  className?: string
}

export default function AudioManager({ className = '' }: AudioManagerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const [isEnabled, setIsEnabled] = useState(false)
  const [isMuted, setIsMuted] = useState(true) // Default muted
  const [volume, setVolume] = useState(0.3)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [isHidden, setIsHidden] = useState(false)

  // Load settings from environment
  useEffect(() => {
    const defaultMuted = process.env.NEXT_PUBLIC_SOUND_DEFAULT_MUTED !== 'false'
    setIsMuted(defaultMuted)
  }, [])

  // Handle user interaction requirement
  useEffect(() => {
    const handleInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true)
      }
    }

    document.addEventListener('click', handleInteraction)
    document.addEventListener('keydown', handleInteraction)

    return () => {
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
    }
  }, [hasInteracted])

  // Audio event handlers
  const handleEnded = () => {
    setIsPlaying(false)
    
    if (isEnabled && !isMuted && hasInteracted) {
      // 10-second pause between loops
      timeoutRef.current = setTimeout(() => {
        if (audioRef.current && isEnabled && !isMuted) {
          audioRef.current.currentTime = 0
          audioRef.current.play().catch(console.error)
        }
      }, 10000)
    }
  }

  const handlePlay = () => setIsPlaying(true)
  const handlePause = () => setIsPlaying(false)

  // Control functions
  const toggleEnabled = () => {
    const newEnabled = !isEnabled
    setIsEnabled(newEnabled)

    if (newEnabled && !isMuted && hasInteracted && audioRef.current) {
      audioRef.current.play().catch(console.error)
    } else if (!newEnabled && audioRef.current) {
      audioRef.current.pause()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }

  const toggleMute = () => {
    if (!hasInteracted) return

    const newMuted = !isMuted
    setIsMuted(newMuted)

    if (audioRef.current) {
      audioRef.current.muted = newMuted
      
      if (!newMuted && isEnabled) {
        audioRef.current.play().catch(console.error)
      } else if (newMuted) {
        audioRef.current.pause()
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }
  }

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const toggleHidden = () => {
    setIsHidden(!isHidden)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  if (isHidden) {
    return (
      <button
        onClick={toggleHidden}
        className="fixed bottom-4 right-4 w-12 h-12 bg-gray-900/90 backdrop-blur-sm rounded-full border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white transition-colors z-50"
        title="Show audio controls"
      >
        <Music className="w-5 h-5" />
      </button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`fixed bottom-4 right-4 z-50 ${className}`}
    >
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        src="/audio/soundtrack.mp3"
        onEnded={handleEnded}
        onPlay={handlePlay}
        onPause={handlePause}
        preload="none"
      />

      {/* Compact Controls */}
      <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg border border-gray-700 p-3 min-w-[200px]">
        {/* Main Controls Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {/* Enable/Disable */}
            <button
              onClick={toggleEnabled}
              className={`p-2 rounded-full transition-colors ${
                isEnabled 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
              title={isEnabled ? 'Disable Audio' : 'Enable Audio'}
            >
              <Music className="w-4 h-4" />
            </button>

            {/* Mute/Unmute */}
            {isEnabled && (
              <button
                onClick={toggleMute}
                disabled={!hasInteracted}
                className={`p-2 rounded-full transition-colors ${
                  !hasInteracted
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : isMuted 
                      ? 'bg-red-600 text-white hover:bg-red-700' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                title={!hasInteracted ? 'Interact with page first' : isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Settings */}
            <button
              onClick={() => setShowControls(!showControls)}
              className="p-2 rounded-full bg-gray-700 text-gray-400 hover:bg-gray-600 transition-colors"
              title="Settings"
            >
              <Settings className="w-3 h-3" />
            </button>

            {/* Hide */}
            <button
              onClick={toggleHidden}
              className="p-1 rounded text-gray-400 hover:text-white transition-colors"
              title="Hide controls"
            >
              ×
            </button>
          </div>
        </div>

        {/* Volume Control */}
        {isEnabled && !isMuted && (
          <div className="mb-2">
            <div className="flex items-center gap-2">
              <Volume2 className="w-3 h-3 text-gray-400" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="flex-1 accent-blue-500"
              />
              <span className="text-xs text-gray-400 w-8">
                {(volume * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        )}

        {/* Extended Settings */}
        {showControls && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="pt-2 border-t border-gray-700"
          >
            <div className="text-xs text-gray-400 space-y-1">
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <span className={
                  !hasInteracted 
                    ? 'text-yellow-400' 
                    : !isEnabled 
                      ? 'text-gray-400'
                      : isMuted
                        ? 'text-red-400'
                        : isPlaying
                          ? 'text-green-400'
                          : 'text-blue-400'
                }>
                  {!hasInteracted 
                    ? 'Click to enable'
                    : !isEnabled 
                      ? 'Disabled'
                      : isMuted
                        ? 'Muted'
                        : isPlaying
                          ? 'Playing'
                          : 'Ready'
                  }
                </span>
              </div>
              {isEnabled && !isMuted && (
                <div className="text-center text-gray-500">
                  10s pause between loops
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}