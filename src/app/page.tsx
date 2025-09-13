'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Play, BarChart3, Trash2, Eye } from 'lucide-react'
import MultiUpload from '@/components/MultiUpload'
import VideoPlayer from '@/components/VideoPlayer'
import AudioManager from '@/components/AudioManager'
import { BatchSummary, Video, Event } from '@/types'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [activeTab, setActiveTab] = useState<'upload' | 'analyze'>('upload')
  const [currentBatch, setCurrentBatch] = useState<string | null>(null)
  const [batchSummary, setBatchSummary] = useState<BatchSummary | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [videoEvents, setVideoEvents] = useState<Event[]>([])
  const [videoQueue, setVideoQueue] = useState<Video[]>([])
  const [autoRun, setAutoRun] = useState(false)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Load batch summary when batch changes
  useEffect(() => {
    if (!currentBatch) return

    const loadBatchSummary = async () => {
      try {
        const response = await fetch(`/api/batches/${currentBatch}/summary`)
        if (response.ok) {
          const summary = await response.json()
          setBatchSummary(summary)
          
          // Set up video queue for analysis
          const completedVideos = summary.videos.filter(
            (v: Video) => v.analysis_status === 'completed'
          )
          setVideoQueue(completedVideos)
          
          if (completedVideos.length > 0) {
            setSelectedVideo(completedVideos[0])
            loadVideoEvents(completedVideos[0].id)
          }
        }
      } catch (error) {
        console.error('Failed to load batch summary:', error)
      }
    }

    loadBatchSummary()
    // Poll for updates every 5 seconds during processing
    const interval = setInterval(loadBatchSummary, 5000)
    
    return () => clearInterval(interval)
  }, [currentBatch])

  const loadVideoEvents = async (videoId: string) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('video_id', videoId)
        .order('start_time')
      
      if (!error && data) {
        setVideoEvents(data)
      }
    } catch (error) {
      console.error('Failed to load video events:', error)
    }
  }

  const handleBatchComplete = (batchId: string) => {
    setCurrentBatch(batchId)
    setActiveTab('analyze')
  }

  const selectVideo = (video: Video) => {
    setSelectedVideo(video)
    loadVideoEvents(video.id)
    setCurrentVideoIndex(videoQueue.findIndex(v => v.id === video.id))
  }

  // Auto-run next video functionality (for future use)
  // const nextVideo = () => {
  //   if (currentVideoIndex < videoQueue.length - 1) {
  //     const nextIndex = currentVideoIndex + 1
  //     const nextVid = videoQueue[nextIndex]
  //     selectVideo(nextVid)
  //   }
  // }

  const handleDeleteOriginals = async (deleteOriginals: boolean) => {
    if (!currentBatch) return

    try {
      // This would implement the actual deletion logic
      console.log(deleteOriginals ? 'Deleting originals' : 'Keeping originals')
      setShowDeleteModal(false)
    } catch (error) {
      console.error('Failed to handle originals:', error)
    }
  }

  const getVideoUrl = (video: Video) => {
    if (!video.storage_path) return ''
    
    // Generate signed URL for video playback
    const { data } = supabase.storage
      .from('videos')
      .getPublicUrl(video.storage_path)
    
    return data.publicUrl
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <AudioManager />
      
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                NightWatch Pro
              </h1>
              <p className="text-gray-400">
                Advanced Multi-Video UAP Analysis Pipeline
              </p>
            </div>

            {batchSummary && (
              <div className="flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{batchSummary.videos.length}</div>
                  <div className="text-gray-400">Videos</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{batchSummary.batch.total_duration_minutes}</div>
                  <div className="text-gray-400">Minutes</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{batchSummary.total_events}</div>
                  <div className="text-gray-400">Events</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { id: 'upload', label: 'Multi-Upload', icon: Upload },
              { id: 'analyze', label: 'Analysis View', icon: Play }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'upload' | 'analyze')}
                className={`
                  flex items-center gap-2 px-6 py-4 font-medium transition-all duration-200
                  ${activeTab === tab.id 
                    ? 'bg-blue-500/20 text-white border-b-2 border-blue-500' 
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Parallel Multi-Upload
                </h2>
                <p className="text-gray-400">
                  Upload multiple videos simultaneously. Analysis starts only when all files complete.
                </p>
              </div>

              <MultiUpload onBatchComplete={handleBatchComplete} />
            </motion.div>
          )}

          {activeTab === 'analyze' && (
            <motion.div
              key="analyze"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {selectedVideo ? (
                <>
                  {/* Video Player */}
                  <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">
                        {selectedVideo.filename}
                      </h3>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-gray-400">
                          <input
                            type="checkbox"
                            checked={autoRun}
                            onChange={(e) => setAutoRun(e.target.checked)}
                            className="accent-blue-500"
                          />
                          Auto-run next
                        </label>
                        {batchSummary?.batch.status === 'completed' && (
                          <button
                            onClick={() => setShowDeleteModal(true)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 mr-2 inline" />
                            Manage Originals
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <VideoPlayer
                      videoId={selectedVideo.id}
                      videoUrl={getVideoUrl(selectedVideo)}
                      events={videoEvents}
                    />
                  </div>

                  {/* Video Queue */}
                  <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Video Queue ({videoQueue.length})
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {videoQueue.map((video, index) => (
                        <motion.div
                          key={video.id}
                          whileHover={{ scale: 1.02 }}
                          className={`
                            p-4 rounded-lg border cursor-pointer transition-all
                            ${selectedVideo.id === video.id 
                              ? 'border-blue-500 bg-blue-500/10' 
                              : 'border-gray-700 hover:border-gray-600 bg-black/30'
                            }
                          `}
                          onClick={() => selectVideo(video)}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-sm font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-white font-medium truncate">{video.filename}</div>
                              <div className="text-sm text-gray-400">
                                {video.event_count} events • {Math.floor((video.duration_seconds || 0) / 60)}m
                              </div>
                            </div>
                          </div>
                          
                          {selectedVideo.id === video.id && (
                            <div className="flex items-center gap-1 text-xs text-blue-400">
                              <Eye className="w-3 h-3" />
                              Currently viewing
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-black/20 backdrop-blur-sm rounded-lg p-12 text-center">
                  <Upload className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-400 mb-2">
                    No Analysis Ready
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Upload and process a batch of videos to begin analysis
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Start Upload
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Delete Originals Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md mx-4"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Manage Original Files</h3>
              <p className="text-gray-600 mb-6">
                Analysis is complete. What would you like to do with the original video files?
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => handleDeleteOriginals(false)}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Keep Originals
                </button>
                <button
                  onClick={() => handleDeleteOriginals(true)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Delete Originals
                </button>
              </div>
              
              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full mt-3 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Decide Later
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
