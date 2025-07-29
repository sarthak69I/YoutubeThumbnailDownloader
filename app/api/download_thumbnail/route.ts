import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    const quality = searchParams.get('quality') || 'high'

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate that it's a valid image URL
    if (!url.startsWith('http')) {
      return NextResponse.json({ error: 'Invalid thumbnail URL' }, { status: 400 })
    }

    try {
      // Fetch the thumbnail image directly
      const imageResponse = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; E-LEAKxDOWN/1.0)',
        },
        timeout: 10000
      })

      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch thumbnail: ${imageResponse.status}`)
      }

      const imageBuffer = await imageResponse.arrayBuffer()
      
      if (imageBuffer.byteLength === 0) {
        throw new Error('Empty thumbnail image')
      }

      // Determine content type from response or URL
      let contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
      
      // Generate filename based on quality
      const timestamp = Date.now()
      const filename = `thumbnail_${quality}_${timestamp}.jpg`

      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': imageBuffer.byteLength.toString(),
          'Cache-Control': 'public, max-age=3600'
        },
      })

    } catch (fetchError: any) {
      console.error('Thumbnail fetch error:', fetchError)
      
      if (fetchError.message.includes('timeout')) {
        return NextResponse.json({ 
          error: 'Thumbnail download timeout. Please try again.' 
        }, { status: 408 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to download thumbnail. The image may be unavailable.' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Thumbnail Download Error:', error)
    return NextResponse.json(
      { error: 'Internal server error during thumbnail download' },
      { status: 500 }
    )
  }
}