import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    const quality = searchParams.get('quality')

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Forward request to Flask backend
    const flaskUrl = `http://localhost:5000/download_thumbnail?url=${encodeURIComponent(url)}&quality=${quality || 'high'}`
    
    const flaskResponse = await fetch(flaskUrl)

    if (!flaskResponse.ok) {
      throw new Error(`Flask server error: ${flaskResponse.status}`)
    }

    // Stream the response from Flask
    const contentType = flaskResponse.headers.get('content-type') || 'image/jpeg'
    const contentDisposition = flaskResponse.headers.get('content-disposition') || 'attachment; filename="thumbnail.jpg"'

    return new NextResponse(flaskResponse.body, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
      },
    })

  } catch (error) {
    console.error('Download Error:', error)
    return NextResponse.json(
      { error: 'Failed to download thumbnail' },
      { status: 500 }
    )
  }
}