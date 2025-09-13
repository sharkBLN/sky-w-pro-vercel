import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const { files } = await request.json()
    
    if (!files || !Array.isArray(files)) {
      return NextResponse.json(
        { error: 'Files array is required' },
        { status: 400 }
      )
    }

    // Create batch record
    const batchId = uuidv4()
    const { error: batchError } = await supabaseAdmin
      .from('batches')
      .insert({
        id: batchId,
        status: 'uploading',
        video_count: files.length,
        total_duration_minutes: 0,
        total_events: 0
      })
      .select()
      .single()

    if (batchError) {
      throw new Error(`Failed to create batch: ${batchError.message}`)
    }

    // Create video records and signed upload URLs
    const videoData = []
    const signedUrls = []

    for (const file of files) {
      const videoId = uuidv4()
      const filePath = `videos/${batchId}/${videoId}-${file.filename}`

      // Create video record
      const { error: videoError } = await supabaseAdmin
        .from('videos')
        .insert({
          id: videoId,
          batch_id: batchId,
          filename: file.filename,
          file_size: file.size,
          upload_status: 'pending',
          analysis_status: 'pending',
          event_count: 0,
          storage_path: filePath
        })

      if (videoError) {
        throw new Error(`Failed to create video record: ${videoError.message}`)
      }

      // Generate signed upload URL
      const { data: signedUrl, error: urlError } = await supabaseAdmin
        .storage
        .from('videos')
        .createSignedUploadUrl(filePath)

      if (urlError) {
        throw new Error(`Failed to create signed URL: ${urlError.message}`)
      }

      videoData.push({
        id: videoId,
        filename: file.filename,
        size: file.size
      })

      signedUrls.push({
        videoId,
        uploadUrl: signedUrl.signedUrl,
        token: signedUrl.token,
        path: signedUrl.path
      })
    }

    return NextResponse.json({
      batchId,
      videos: videoData,
      signedUrls
    })

  } catch (error) {
    console.error('Upload request error:', error)
    return NextResponse.json(
      { error: 'Failed to process upload request' },
      { status: 500 }
    )
  }
}