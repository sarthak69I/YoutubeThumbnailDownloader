import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
  let tempFilePath = ''
  
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

    // Create temporary directory for download
    const tempDir = os.tmpdir()
    const timestamp = Date.now()
    const outputTemplate = path.join(tempDir, `audio_${timestamp}.%(ext)s`)
    
    // Construct yt-dlp command for audio extraction
    let audioQuality = '192'
    if (formatId === 'good') audioQuality = '128'
    else if (formatId === 'medium') audioQuality = '96'

    const command = `yt-dlp --extract-audio --audio-format mp3 --audio-quality ${audioQuality} --output "${outputTemplate}" "${url}"`

    try {
      // Execute download with timeout
      await execAsync(command, { timeout: 25000 })
      
      // Find the downloaded file
      const files = fs.readdirSync(tempDir).filter(f => f.startsWith(`audio_${timestamp}`) && f.endsWith('.mp3'))
      
      if (files.length === 0) {
        throw new Error('Audio extraction failed - no MP3 file created')
      }

      tempFilePath = path.join(tempDir, files[0])
      
      // Check if file exists and has content
      const stats = fs.statSync(tempFilePath)
      if (stats.size === 0) {
        throw new Error('Extracted audio file is empty')
      }

      // Read file and create response
      const fileBuffer = fs.readFileSync(tempFilePath)

      // Clean filename for download
      const cleanFilename = files[0].replace(/[^a-zA-Z0-9.-]/g, '_')

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': `attachment; filename="${cleanFilename}"`,
          'Content-Length': stats.size.toString(),
          'Cache-Control': 'no-cache'
        },
      })

    } catch (execError: any) {
      console.error('yt-dlp audio extraction error:', execError)
      
      if (execError.message.includes('timeout')) {
        return NextResponse.json({ 
          error: 'Audio extraction timeout. Please try again.' 
        }, { status: 408 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to extract audio. The video may be private, deleted, or unsupported.' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Audio Download Error:', error)
    return NextResponse.json(
      { error: 'Internal server error during audio extraction' },
      { status: 500 }
    )
  } finally {
    // Clean up temporary file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath)
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError)
      }
    }
  }
}