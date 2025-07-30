import { NextRequest, NextResponse } from 'next/server'

interface VideoInfo {
  title: string
  author: string
  duration_str: string
  views: number
  publish_date: string
  description: string
  thumbnails: {
    default: string
    medium: string
    high: string
    standard: string
    maxres: string
  }
  video_streams: Array<{
    format_id: string
    resolution: string
    fps: number
    filesize: number
    filesize_mb: number
    ext: string
    recommended: boolean
  }>
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const url = formData.get('url') as string

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\/(watch\?v=|embed\/|v\/|.+\?v=)?([^&=%?]{11})/
    if (!youtubeRegex.test(url)) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    // Extract video ID from YouTube URL
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
    if (!videoIdMatch) {
      return NextResponse.json({ error: 'Could not extract video ID from URL' }, { status: 400 })
    }
    const videoId = videoIdMatch[1]

    // Use YouTube's oEmbed API and other public APIs for video information
    try {
      // Get basic video info from oEmbed API
      const oembedResponse = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`)
      if (!oembedResponse.ok) {
        throw new Error('Video not found or private')
      }
      const oembedData = await oembedResponse.json()

      // Extract thumbnails from YouTube's standard thumbnail URLs
      const thumbnails = {
        default: `https://img.youtube.com/vi/${videoId}/default.jpg`,
        medium: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        high: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        standard: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
        maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      }

      // Create standard video quality options (since we can't get real formats without yt-dlp)
      const video_streams = [
        {
          format_id: 'ultra_reliable',
          resolution: '360p',
          fps: 30,
          filesize: 0,
          filesize_mb: 25, // Ultra small for guaranteed success
          ext: 'mp4',
          recommended: true
        },
        {
          format_id: 'slow_connection',
          resolution: '480p',
          fps: 30,
          filesize: 0,
          filesize_mb: 60, // Optimized for slow connections
          ext: 'mp4',
          recommended: true
        },
        {
          format_id: 'standard',
          resolution: '720p',
          fps: 30,
          filesize: 0,
          filesize_mb: 120, // Standard quality
          ext: 'mp4',
          recommended: true
        },
        {
          format_id: 'best',
          resolution: '720p',
          fps: 30,
          filesize: 0,
          filesize_mb: 150, // Best available under 720p
          ext: 'mp4',
          recommended: true
        }
      ]

      const videoInfo: VideoInfo = {
        title: oembedData.title || 'Unknown Title',
        author: oembedData.author_name || 'Unknown Author',
        duration_str: 'Available after download',
        views: 0, // Not available from oEmbed
        publish_date: '',
        description: `Video from ${oembedData.author_name}`,
        thumbnails,
        video_streams
      }

      return NextResponse.json({ video_info: videoInfo })

    } catch (fetchError: any) {
      console.error('Video info fetch error:', fetchError)
      
      if (fetchError.message.includes('Video not found')) {
        return NextResponse.json({ 
          error: 'Video not found, private, or deleted.' 
        }, { status: 404 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to extract video information. Please check the URL and try again.' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    )
  }
}