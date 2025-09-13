# NightWatch Pro - Vercel Production Deploy

Advanced Multi-Video UAP Analysis Pipeline with Supabase backend.

## 🚀 **Quick Deploy to Vercel**

### 1. **Supabase Setup**
1. Create new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL from `supabase-schema.sql` in your Supabase SQL editor
3. Create a storage bucket named "videos" (should be created by the SQL)
4. Copy your project URL and keys from Settings → API

### 2. **Deploy to Vercel**
1. Visit: https://vercel.com/nils-projects-df2be003
2. Click "New Project"
3. Import this repository/folder
4. Set environment variables in deployment:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE=your-service-role-key-here
CRON_TOKEN=your-secure-random-token-here
SOUND_DEFAULT_MUTED=true
```

5. Deploy!

### 3. **Generate Secure Tokens**
```bash
# Generate a secure cron token
openssl rand -hex 32
```

## ✅ **Verification Checklist**

After deployment, verify these features work:

- [ ] **Multi-Upload**: Drag/drop multiple videos, see individual file status
- [ ] **Analysis Gate**: Upload waits until ALL files complete before analysis
- [ ] **Video Player**: Visible during analysis with timeline markers
- [ ] **Event Markers**: Color-coded timeline markers with probabilities
- [ ] **Auto-Run**: Toggle to automatically play next video in queue
- [ ] **Process Folders**: Created with naming `YYYY-MM-DD_HHMM_batch-<id>__videos-<N>__duration-<mins>__events-<cnt>/`
- [ ] **Delete Modal**: "Keep or delete originals" modal after completion
- [ ] **Soundtrack**: Background audio with 10s pause between loops
- [ ] **Audio Controls**: On/Off, Mute, Volume controls (bottom-right)
- [ ] **Settings Hide**: Option to hide audio controls and auto-play quietly
- [ ] **Cron Endpoint**: `/api/scan-watched-folder` responds with token auth

## 🎵 **Audio Features**
- **Default**: Muted on first load
- **Platform Compliant**: Only plays after user interaction
- **10-Second Pause**: Between track loops
- **Full Controls**: On/Off, Mute/Unmute, Volume slider
- **Hide Option**: Settings to hide controls and enable quiet auto-play
- **Status Display**: Shows interaction requirements and playback state

## 🔥 **Core Features**

### **1. Parallel Multi-Upload**
- Drag & drop multiple video files
- Real-time per-file progress tracking (queued/uploading %/completed/failed)
- Overall batch progress indicator
- Analysis starts only when ALL files uploaded successfully

### **2. Analysis View**
- Video player always visible (during and after analysis)
- Queue/list of latest videos displayed under player
- Auto-run toggle to automatically play next video
- Timeline markers with event probabilities
- Real-time event detection overlays

### **3. Process Folder Output**
- Organized folders: `YYYY-MM-DD_HHMM_batch-<id>__videos-<N>__duration-<mins>__events-<cnt>/`
- Contains: `reports/summary.json`, `events/*.events.json`, `logs/pipeline.log`
- Optional: `renders/*_overlay.mp4` (if overlay generation enabled)

### **4. Post-Analysis Modal**
- "Keep originals or delete originals?" choice
- Both actions implemented and functional
- Archive management options

### **5. Watched Folder Support**
- Daily scan endpoint: `/api/scan-watched-folder`
- Cron token authentication
- Auto-ingestion of new files

## 🏗 **Architecture**

### **Frontend (Next.js 14)**
- **App Router** with TypeScript
- **Supabase** for real-time data
- **Framer Motion** for animations
- **Tailwind CSS** for styling

### **Backend (Supabase)**
- **PostgreSQL** database with RLS
- **Storage** for video files
- **Real-time** subscriptions for live updates

### **API Routes**
- `POST /api/upload/request` - Get signed upload URLs
- `POST /api/batches/:id/commit` - Start analysis after upload
- `GET /api/batches/:id/summary` - Get batch stats and links
- `POST /api/scan-watched-folder` - Cron endpoint for auto-ingest

## 🔧 **Local Development**

```bash
# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📊 **Database Schema**

Three main tables:
- **batches**: Upload batch tracking
- **videos**: Individual video metadata
- **events**: Detected events with timestamps and probabilities

## 🎯 **Production Features**
- **Scalable**: Built for Vercel's serverless functions
- **Real-time**: Live progress updates via Supabase
- **Reliable**: Chunked uploads with retry logic
- **Organized**: Structured process folders for results
- **Professional**: Complete workflow from upload to analysis

---

**🌟 Ready for production UAP analysis at scale!**
