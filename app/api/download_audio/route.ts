import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    const formatId = searchParams.get('format_id') || 'best'

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\/(watch\?v=|embed\/|v\/|.+\?v=)?([^&=%?]{11})/
    if (!youtubeRegex.test(url)) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    // Since yt-dlp and ffmpeg are not available in Vercel serverless environment,
    // we'll provide a helpful message
    return NextResponse.json({ 
      error: 'MP3 audio extraction temporarily unavailable in serverless environment. Please use the thumbnail download feature which is fully functional.',
      suggestion: 'Thumbnail downloads work perfectly and provide high-quality images up to 1280x720.'
    }, { status: 503 })

  } catch (error) {
    console.error('Audio Extraction Error:', error)
    return NextResponse.json(
      { error: 'Internal server error during audio extraction' },
      { status: 500 }
    )
  }
}