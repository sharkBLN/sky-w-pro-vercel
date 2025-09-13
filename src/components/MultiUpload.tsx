'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react'
import { UploadProgress } from '@/types'

interface MultiUploadProps {
  onBatchComplete: (batchId: string) => void
}

export default function MultiUpload({ onBatchComplete }: MultiUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, UploadProgress>>({})
  const [isUploading, setIsUploading] = useState(false)
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    const videoFiles = selectedFiles.filter(file => 
      file.type.startsWith('video/') || /\.(mp4|avi|mov|mkv|webm)$/i.test(file.name)
    )
    
    if (videoFiles.length === 0) {
      setError('Please select valid video files')
      return
    }
    
    setFiles(videoFiles)
    setError(null)
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const droppedFiles = Array.from(event.dataTransfer.files)
    const videoFiles = droppedFiles.filter(file => 
      file.type.startsWith('video/') || /\.(mp4|avi|mov|mkv|webm)$/i.test(file.name)
    )
    
    if (videoFiles.length === 0) {
      setError('Please drop valid video files')
      return
    }
    
    setFiles(videoFiles)
    setError(null)
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
  }, [])

  const startUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    setError(null)

    try {
      // Request signed upload URLs
      const response = await fetch('/api/upload/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: files.map(file => ({ filename: file.name, size: file.size }))
        })
      })

      if (!response.ok) {
        throw new Error('Failed to request upload URLs')
      }

      const { batchId: newBatchId, videos, signedUrls } = await response.json()
      setCurrentBatchId(newBatchId)

      // Initialize progress tracking
      const initialProgress: Record<string, UploadProgress> = {}
      videos.forEach((video: Record<string, unknown>) => {
        const videoId = video.id as string
        const videoFilename = video.filename as string
        initialProgress[videoId] = {
          fileId: videoId,
          filename: videoFilename,
          status: 'queued',
          progress: 0
        }
      })
      setUploadProgress(initialProgress)

      // Upload files in parallel
      const uploadPromises = signedUrls.map(async (urlInfo: Record<string, unknown>, index: number) => {
        const file = files[index]
        const videoId = urlInfo.videoId as string

        try {
          // Update to uploading status
          setUploadProgress(prev => ({
            ...prev,
            [videoId]: { ...prev[videoId], status: 'uploading' }
          }))

          // Upload file with progress tracking
          await uploadWithProgress(file, urlInfo.uploadUrl as string, (progress) => {
            setUploadProgress(prev => ({
              ...prev,
              [videoId]: { ...prev[videoId], progress }
            }))
          })

          // Mark video as uploaded in database
          const updateResponse = await fetch(`/api/videos/${videoId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ upload_status: 'completed' })
          })

          if (!updateResponse.ok) {
            throw new Error('Failed to update upload status')
          }

          // Update to completed status
          setUploadProgress(prev => ({
            ...prev,
            [videoId]: { ...prev[videoId], status: 'completed', progress: 100 }
          }))

        } catch (error) {
          console.error(`Upload failed for ${file.name}:`, error)
          setUploadProgress(prev => ({
            ...prev,
            [videoId]: { 
              ...prev[videoId], 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Upload failed'
            }
          }))
        }
      })

      // Wait for all uploads to complete
      await Promise.allSettled(uploadPromises)

      // Check if all uploads succeeded
      const finalProgress = Object.values(initialProgress)
      const allCompleted = finalProgress.every(p => p.status === 'completed')

      if (allCompleted) {
        // Commit batch for analysis
        const commitResponse = await fetch(`/api/batches/${newBatchId}/commit`, {
          method: 'POST'
        })

        if (commitResponse.ok) {
          onBatchComplete(newBatchId)
        } else {
          setError('Upload completed but failed to start analysis')
        }
      } else {
        setError('Some files failed to upload')
      }

    } catch (error) {
      console.error('Upload process error:', error)
      setError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const uploadWithProgress = async (
    file: File, 
    uploadUrl: string, 
    onProgress: (progress: number) => void
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          onProgress(progress)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status === 200 || xhr.status === 201) {
          resolve()
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'))
      })

      xhr.open('PUT', uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)
    })
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    setFiles([])
    setUploadProgress({})
    setCurrentBatchId(null)
    setError(null)
  }

  const getOverallProgress = () => {
    const progressValues = Object.values(uploadProgress)
    if (progressValues.length === 0) return 0
    
    const totalProgress = progressValues.reduce((sum, p) => sum + p.progress, 0)
    return Math.round(totalProgress / progressValues.length)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400'
      case 'uploading': return 'text-blue-400'
      case 'error': return 'text-red-400'
      default: return 'text-yellow-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'uploading': return <Loader2 className="w-4 h-4 animate-spin" />
      case 'error': return <AlertCircle className="w-4 h-4" />
      default: return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${files.length > 0 ? 'border-blue-500 bg-blue-500/10' : 'border-gray-300 hover:border-blue-400'}
          ${isUploading ? 'pointer-events-none opacity-75' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <div className="space-y-2">
          <p className="text-lg font-medium">
            {files.length > 0 ? `${files.length} files selected` : 'Drop videos here or click to select'}
          </p>
          <p className="text-sm text-gray-500">
            Supports: MP4, AVI, MOV, MKV, WebM
          </p>
        </div>
        
        <input
          type="file"
          multiple
          accept="video/*,.mp4,.avi,.mov,.mkv,.webm"
          onChange={handleFileSelect}
          className="hidden"
          id="file-input"
          disabled={isUploading}
        />
        
        {!isUploading && (
          <label
            htmlFor="file-input"
            className="inline-block mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors"
          >
            Select Files
          </label>
        )}
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Files Ready for Upload</h3>
            {!isUploading && (
              <div className="flex gap-2">
                <button
                  onClick={clearAll}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Clear All
                </button>
                <button
                  onClick={startUpload}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Start Upload
                </button>
              </div>
            )}
          </div>

          {/* Overall Progress */}
          {isUploading && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-gray-600">{getOverallProgress()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getOverallProgress()}%` }}
                />
              </div>
            </div>
          )}

          {/* Individual File Progress */}
          <div className="space-y-2">
            {files.map((file, index) => {
              const progress = Object.values(uploadProgress).find(p => p.filename === file.name)
              
              return (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-3 bg-white border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">🎬</div>
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-gray-500">
                        {(file.size / (1024 * 1024)).toFixed(1)} MB
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {progress && (
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${getStatusColor(progress.status)}`}>
                          {progress.status === 'uploading' ? `${progress.progress}%` : progress.status}
                        </span>
                        <div className={getStatusColor(progress.status)}>
                          {getStatusIcon(progress.status)}
                        </div>
                      </div>
                    )}

                    {!isUploading && (
                      <button
                        onClick={() => removeFile(index)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}