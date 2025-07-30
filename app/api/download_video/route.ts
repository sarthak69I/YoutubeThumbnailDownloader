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

    // Since yt-dlp is not available in Vercel serverless environment,
    // we'll redirect users to use a third-party service or provide instructions
    return NextResponse.json({ 
      error: 'Video download temporarily unavailable in serverless environment. Please use the thumbnail download feature or try again later.',
      suggestion: 'You can download thumbnails and audio extracts which are fully functional.'
    }, { status: 503 })

  } catch (error) {
    console.error('Download Error:', error)
    return NextResponse.json(
      { error: 'Internal server error during download' },
      { status: 500 }
    )
  }
}