import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const url = formData.get('url') as string

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Forward request to Flask backend
    const flaskResponse = await fetch('http://localhost:5000/get_video_info', {
      method: 'POST',
      body: formData,
    })

    if (!flaskResponse.ok) {
      throw new Error(`Flask server error: ${flaskResponse.status}`)
    }

    const data = await flaskResponse.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch video information' },
      { status: 500 }
    )
  }
}