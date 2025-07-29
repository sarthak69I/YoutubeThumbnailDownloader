import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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

    // Use yt-dlp to extract video information
    const command = `yt-dlp --dump-json --no-download "${url}"`
    
    try {
      const { stdout } = await execAsync(command, { timeout: 25000 })
      const videoData = JSON.parse(stdout)

      // Extract thumbnails
      const thumbnails = {
        default: videoData.thumbnail || '',
        medium: videoData.thumbnail || '',
        high: videoData.thumbnail || '',
        standard: videoData.thumbnail || '',
        maxres: videoData.thumbnail || ''
      }

      // Find thumbnail URLs of different qualities
      if (videoData.thumbnails && Array.isArray(videoData.thumbnails)) {
        videoData.thumbnails.forEach((thumb: any) => {
          if (thumb.width <= 120) thumbnails.default = thumb.url
          else if (thumb.width <= 320) thumbnails.medium = thumb.url
          else if (thumb.width <= 480) thumbnails.high = thumb.url
          else if (thumb.width <= 640) thumbnails.standard = thumb.url
          else thumbnails.maxres = thumb.url
        })
      }

      // Extract video streams with 720p maximum for Vercel compatibility
      const video_streams: any[] = []
      if (videoData.formats && Array.isArray(videoData.formats)) {
        videoData.formats
          .filter((format: any) => 
            format.vcodec !== 'none' && 
            format.height && 
            format.height <= 720 // Limit to 720p maximum
          )
          .sort((a: any, b: any) => (b.height || 0) - (a.height || 0))
          .slice(0, 8) // Limit to top 8 formats under 720p
          .forEach((format: any) => {
            const fileSizeMB = format.filesize ? Math.round(format.filesize / 1024 / 1024) : 0
            video_streams.push({
              format_id: format.format_id,
              resolution: `${format.height}p`,
              fps: format.fps || 30,
              filesize: format.filesize || 0,
              filesize_mb: fileSizeMB,
              ext: format.ext || 'mp4',
              recommended: fileSizeMB > 0 && fileSizeMB <= 200 // Mark files under 200MB as recommended
            })
          })
      }

      // Add fallback formats if no suitable formats found
      if (video_streams.length === 0) {
        video_streams.push({
          format_id: 'best',
          resolution: '720p',
          fps: 30,
          filesize: 0,
          filesize_mb: 0,
          ext: 'mp4',
          recommended: true
        })
      }

      const videoInfo: VideoInfo = {
        title: videoData.title || 'Unknown Title',
        author: videoData.uploader || videoData.channel || 'Unknown Author',
        duration_str: videoData.duration_string || 'Unknown',
        views: videoData.view_count || 0,
        publish_date: videoData.upload_date || '',
        description: videoData.description || '',
        thumbnails,
        video_streams
      }

      return NextResponse.json({ video_info: videoInfo })

    } catch (execError: any) {
      console.error('yt-dlp error:', execError)
      
      if (execError.message.includes('timeout')) {
        return NextResponse.json({ error: 'Request timeout. Please try again.' }, { status: 408 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to extract video information. The video may be private, deleted, or unsupported.' 
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