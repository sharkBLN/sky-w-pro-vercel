-- Create batches table
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('uploading', 'ready', 'processing', 'completed', 'error')),
    video_count INTEGER NOT NULL DEFAULT 0,
    total_duration_minutes INTEGER NOT NULL DEFAULT 0,
    total_events INTEGER NOT NULL DEFAULT 0,
    process_folder TEXT,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create videos table
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    duration_seconds INTEGER,
    upload_status TEXT NOT NULL DEFAULT 'pending' CHECK (upload_status IN ('pending', 'uploading', 'completed', 'error')),
    analysis_status TEXT NOT NULL DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'error')),
    event_count INTEGER NOT NULL DEFAULT 0,
    storage_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    start_time FLOAT NOT NULL,
    end_time FLOAT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('uap', 'satellite', 'airplane', 'meteor', 'star', 'cloud', 'unknown')),
    confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    bbox_x FLOAT,
    bbox_y FLOAT,
    bbox_width FLOAT,
    bbox_height FLOAT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_videos_batch_id ON videos(batch_id);
CREATE INDEX idx_videos_upload_status ON videos(upload_status);
CREATE INDEX idx_videos_analysis_status ON videos(analysis_status);
CREATE INDEX idx_events_video_id ON events(video_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_batches_status ON batches(status);
CREATE INDEX idx_batches_created_at ON batches(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication requirements)
-- For now, allowing all operations for demonstration
CREATE POLICY "Allow all operations on batches" ON batches FOR ALL USING (true);
CREATE POLICY "Allow all operations on videos" ON videos FOR ALL USING (true);
CREATE POLICY "Allow all operations on events" ON events FOR ALL USING (true);

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('videos', 'videos', true);

-- Create policy for storage bucket
CREATE POLICY "Allow all operations on videos bucket" ON storage.objects FOR ALL USING (bucket_id = 'videos');