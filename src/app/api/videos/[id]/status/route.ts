import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const videoId = resolvedParams.id
    const { upload_status, analysis_status } = await request.json()

    const updates: Record<string, unknown> = {}
    if (upload_status) updates.upload_status = upload_status
    if (analysis_status) updates.analysis_status = analysis_status
    updates.updated_at = new Date().toISOString()

    const { error } = await supabaseAdmin
      .from('videos')
      .update(updates)
      .eq('id', videoId)

    if (error) {
      throw new Error(`Failed to update video: ${error.message}`)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Video status update error:', error)
    return NextResponse.json(
      { error: 'Failed to update video status' },
      { status: 500 }
    )
  }
}