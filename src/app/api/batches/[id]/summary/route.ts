import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const batchId = resolvedParams.id

    // Get batch info
    const { data: batch, error: batchError } = await supabaseAdmin
      .from('batches')
      .select('*')
      .eq('id', batchId)
      .single()

    if (batchError || !batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      )
    }

    // Get videos in batch
    const { data: videos, error: videosError } = await supabaseAdmin
      .from('videos')
      .select('*')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true })

    if (videosError) {
      throw new Error(`Failed to fetch videos: ${videosError.message}`)
    }

    // Get event breakdown
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('event_type')
      .in('video_id', videos.map(v => v.id))

    if (eventsError) {
      console.warn('Failed to fetch events:', eventsError.message)
    }

    // Calculate event breakdown
    const eventBreakdown: Record<string, number> = {}
    let totalEvents = 0

    if (events) {
      events.forEach(event => {
        eventBreakdown[event.event_type] = (eventBreakdown[event.event_type] || 0) + 1
        totalEvents++
      })
    }

    // Generate process folder URL if completed
    let processFolderUrl = undefined
    if (batch.status === 'completed' && batch.process_folder) {
      processFolderUrl = `/api/download/process-folder/${batchId}`
    }

    const summary = {
      batch,
      videos,
      total_events: totalEvents,
      event_breakdown: eventBreakdown,
      process_folder_url: processFolderUrl
    }

    return NextResponse.json(summary)

  } catch (error) {
    console.error('Batch summary error:', error)
    return NextResponse.json(
      { error: 'Failed to get batch summary' },
      { status: 500 }
    )
  }
}