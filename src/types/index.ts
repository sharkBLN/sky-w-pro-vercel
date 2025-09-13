export interface Batch {
  id: string
  created_at: string
  status: 'uploading' | 'ready' | 'processing' | 'completed' | 'error'
  video_count: number
  total_duration_minutes: number
  total_events: number
  process_folder?: string
  completed_at?: string
}

export interface Video {
  id: string
  batch_id: string
  filename: string
  file_size: number
  duration_seconds?: number
  upload_status: 'pending' | 'uploading' | 'completed' | 'error'
  analysis_status: 'pending' | 'processing' | 'completed' | 'error'
  event_count: number
  storage_path?: string
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  video_id: string
  start_time: number
  end_time: number
  event_type: 'uap' | 'satellite' | 'airplane' | 'meteor' | 'star' | 'cloud' | 'unknown'
  confidence: number
  bbox_x?: number
  bbox_y?: number
  bbox_width?: number
  bbox_height?: number
  metadata?: Record<string, unknown>
  created_at: string
}

export interface BatchSummary {
  batch: Batch
  videos: Video[]
  total_events: number
  event_breakdown: Record<string, number>
  process_folder_url?: string
}

export interface UploadProgress {
  fileId: string
  filename: string
  status: 'queued' | 'uploading' | 'completed' | 'error'
  progress: number
  error?: string
}