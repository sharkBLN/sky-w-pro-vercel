'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react'
import { Event } from '@/types'

interface VideoPlayerProps {
  videoId: string
  videoUrl: string
  events: Event[]
}

export default function VideoPlayer({ videoId, videoUrl, events }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [activeEvents, setActiveEvents] = useState<Event[]>([])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleLoadedData = () => setDuration(video.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [])

  useEffect(() => {
    // Find events that are active at current time
    const currentEvents = events.filter(event => 
      currentTime >= event.start_time && currentTime <= event.end_time
    )
    setActiveEvents(currentEvents)
  }, [currentTime, events])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }

  const handleSeek = (time: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = time
    setCurrentTime(time)
  }

  const handleVolumeChange = (newVolume: number) => {
    const video = videoRef.current
    if (!video) return

    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    if (isMuted) {
      video.volume = volume
      setIsMuted(false)
    } else {
      video.volume = 0
      setIsMuted(true)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getEventColor = (eventType: string) => {
    const colors = {
      uap: '#ef4444',        // red
      satellite: '#10b981',   // green
      airplane: '#3b82f6',    // blue
      meteor: '#f59e0b',      // yellow
      star: '#ffffff',        // white
      cloud: '#6b7280',       // gray
      unknown: '#f97316'      // orange
    }
    return colors[eventType as keyof typeof colors] || colors.unknown
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-black rounded-lg overflow-hidden">
      {/* Video Container */}
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full"
          poster={`${videoUrl.replace('.mp4', '_thumb.jpg')}`}
        />

        {/* Event Overlays */}
        {activeEvents.map(event => (
          event.bbox_x !== undefined && (
            <motion.div
              key={event.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute border-2"
              style={{
                left: `${event.bbox_x}%`,
                top: `${event.bbox_y}%`,
                width: `${event.bbox_width}%`,
                height: `${event.bbox_height}%`,
                borderColor: getEventColor(event.event_type)
              }}
            >
              <div 
                className="absolute -top-6 left-0 px-2 py-1 text-xs font-medium rounded"
                style={{ 
                  backgroundColor: getEventColor(event.event_type),
                  color: event.event_type === 'star' ? 'black' : 'white'
                }}
              >
                {event.event_type} ({(event.confidence * 100).toFixed(0)}%)
              </div>
            </motion.div>
          )
        ))}

        {/* Loading Overlay */}
        {duration === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/75">
            <div className="text-white">Loading video...</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-gray-900 space-y-4">
        {/* Timeline with Event Markers */}
        <div className="relative">
          <div 
            className="w-full h-2 bg-gray-700 rounded-full cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = e.clientX - rect.left
              const percentage = x / rect.width
              handleSeek(percentage * duration)
            }}
          >
            {/* Progress Bar */}
            <div 
              className="h-full bg-blue-600 rounded-full transition-all duration-150"
              style={{ width: `${progressPercentage}%` }}
            />

            {/* Event Markers */}
            {events.map(event => (
              <div
                key={event.id}
                className="absolute top-0 w-1 h-full cursor-pointer hover:scale-x-2 transition-transform"
                style={{ 
                  left: `${(event.start_time / duration) * 100}%`,
                  backgroundColor: getEventColor(event.event_type)
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleSeek(event.start_time)
                }}
                title={`${event.event_type} - ${(event.confidence * 100).toFixed(0)}%`}
              />
            ))}
          </div>

          {/* Time Display */}
          <div className="flex justify-between text-sm text-gray-400 mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-20 accent-blue-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Event Count */}
            <div className="text-sm text-gray-400">
              {events.length} events detected
            </div>

            <button className="text-gray-400 hover:text-white transition-colors">
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Active Events Display */}
        {activeEvents.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeEvents.map(event => (
              <div
                key={event.id}
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${getEventColor(event.event_type)}20`,
                  borderColor: getEventColor(event.event_type),
                  color: getEventColor(event.event_type)
                }}
              >
                {event.event_type} ({(event.confidence * 100).toFixed(0)}%)
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}