import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const batchId = resolvedParams.id
    
    // Check if all videos in batch are uploaded
    const { data: videos, error: videosError } = await supabaseAdmin
      .from('videos')
      .select('*')
      .eq('batch_id', batchId)

    if (videosError) {
      throw new Error(`Failed to fetch videos: ${videosError.message}`)
    }

    const allUploaded = videos.every(video => video.upload_status === 'completed')
    
    if (!allUploaded) {
      return NextResponse.json(
        { error: 'Not all files in batch are uploaded' },
        { status: 400 }
      )
    }

    // Update batch status to ready for analysis
    const { error: batchError } = await supabaseAdmin
      .from('batches')
      .update({ status: 'ready' })
      .eq('id', batchId)

    if (batchError) {
      throw new Error(`Failed to update batch: ${batchError.message}`)
    }

    // Start analysis process (simulate with status update)
    await simulateAnalysis(batchId, videos)

    return NextResponse.json({
      success: true,
      message: 'Batch committed and analysis started'
    })

  } catch (error) {
    console.error('Batch commit error:', error)
    return NextResponse.json(
      { error: 'Failed to commit batch' },
      { status: 500 }
    )
  }
}

async function simulateAnalysis(batchId: string, videos: Record<string, unknown>[]) {
  // Update batch to processing
  await supabaseAdmin
    .from('batches')
    .update({ status: 'processing' })
    .eq('id', batchId)

  // Update videos to processing
  for (const video of videos) {
    await supabaseAdmin
      .from('videos')
      .update({ 
        analysis_status: 'processing',
        duration_seconds: Math.floor(Math.random() * 300) + 60 // Simulate 1-5 min videos
      })
      .eq('id', video.id)
  }

  // Simulate analysis completion after delay
  setTimeout(async () => {
    try {
      // Generate mock events for each video
      let totalEvents = 0
      const eventBreakdown: Record<string, number> = {}

      for (const video of videos) {
        const eventCount = Math.floor(Math.random() * 10) + 1
        totalEvents += eventCount

        // Create mock events
        const events = []
        const eventTypes = ['uap', 'satellite', 'airplane', 'meteor', 'star', 'cloud']
        
        for (let i = 0; i < eventCount; i++) {
          const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
          const startTime = Math.random() * (Number(video.duration_seconds) || 120)
          
          events.push({
            id: crypto.randomUUID(),
            video_id: video.id,
            start_time: startTime,
            end_time: startTime + Math.random() * 10 + 2,
            event_type: eventType,
            confidence: Math.random() * 0.4 + 0.6, // 0.6-1.0
            bbox_x: Math.floor(Math.random() * 800),
            bbox_y: Math.floor(Math.random() * 600),
            bbox_width: Math.floor(Math.random() * 100) + 50,
            bbox_height: Math.floor(Math.random() * 100) + 50
          })

          eventBreakdown[eventType] = (eventBreakdown[eventType] || 0) + 1
        }

        // Insert events
        if (events.length > 0) {
          await supabaseAdmin
            .from('events')
            .insert(events)
        }

        // Update video with event count
        await supabaseAdmin
          .from('videos')
          .update({ 
            analysis_status: 'completed',
            event_count: eventCount
          })
          .eq('id', video.id)
      }

      // Create process folder name
      const now = new Date()
      const timestamp = now.toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '_')
      const totalDuration = videos.reduce((sum, v) => sum + (Number(v.duration_seconds) || 0), 0)
      const processFolder = `${timestamp}_batch-${batchId.slice(0, 8)}__videos-${videos.length}__duration-${Math.floor(totalDuration / 60)}__events-${totalEvents}`

      // Update batch as completed
      await supabaseAdmin
        .from('batches')
        .update({ 
          status: 'completed',
          total_events: totalEvents,
          total_duration_minutes: Math.floor(totalDuration / 60),
          process_folder: processFolder,
          completed_at: now.toISOString()
        })
        .eq('id', batchId)

    } catch (error) {
      console.error('Analysis simulation error:', error)
      // Mark as error if analysis fails
      await supabaseAdmin
        .from('batches')
        .update({ status: 'error' })
        .eq('id', batchId)
    }
  }, 15000) // 15 second analysis simulation
}