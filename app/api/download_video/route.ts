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
    const outputTemplate = path.join(tempDir, `video_${timestamp}.%(ext)s`)
    
    // Construct yt-dlp command for video download
    let command = `yt-dlp --format "${formatId}" --output "${outputTemplate}" "${url}"`
    
    // Add quality fallbacks
    if (formatId === 'best') {
      command = `yt-dlp --format "best[height<=1080]/best" --output "${outputTemplate}" "${url}"`
    }

    try {
      // Execute download with timeout
      await execAsync(command, { timeout: 25000 })
      
      // Find the downloaded file
      const files = fs.readdirSync(tempDir).filter(f => f.startsWith(`video_${timestamp}`))
      
      if (files.length === 0) {
        throw new Error('Download failed - no file created')
      }

      tempFilePath = path.join(tempDir, files[0])
      
      // Check if file exists and has content
      const stats = fs.statSync(tempFilePath)
      if (stats.size === 0) {
        throw new Error('Downloaded file is empty')
      }

      // Read file and create response
      const fileBuffer = fs.readFileSync(tempFilePath)
      const fileExtension = path.extname(files[0]).toLowerCase()
      
      // Determine content type
      let contentType = 'video/mp4'
      if (fileExtension === '.webm') contentType = 'video/webm'
      else if (fileExtension === '.mkv') contentType = 'video/x-matroska'
      else if (fileExtension === '.avi') contentType = 'video/x-msvideo'

      // Clean filename for download
      const cleanFilename = files[0].replace(/[^a-zA-Z0-9.-]/g, '_')

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${cleanFilename}"`,
          'Content-Length': stats.size.toString(),
          'Cache-Control': 'no-cache'
        },
      })

    } catch (execError: any) {
      console.error('yt-dlp download error:', execError)
      
      if (execError.message.includes('timeout')) {
        return NextResponse.json({ 
          error: 'Download timeout. Try a smaller video or different quality.' 
        }, { status: 408 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to download video. It may be private, deleted, or too large.' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Download Error:', error)
    return NextResponse.json(
      { error: 'Internal server error during download' },
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