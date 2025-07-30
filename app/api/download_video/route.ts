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
    
    // Construct yt-dlp command for video download with 720p limit
    let command = `yt-dlp --format "${formatId}" --output "${outputTemplate}" "${url}"`
    
    // Progressive quality fallbacks to ensure downloads always succeed
    if (formatId === 'best') {
      // Best quality with progressive fallbacks for reliability
      command = `yt-dlp --format "best[height<=720][filesize<=200M]/best[height<=480][filesize<=100M]/best[height<=360][filesize<=50M]/worst" --output "${outputTemplate}" "${url}"`
    } else if (formatId === 'slow_connection') {
      // Optimized for slow connections - guaranteed success
      command = `yt-dlp --format "best[height<=480][filesize<=80M]/best[height<=360][filesize<=40M]/worst[height<=240]" --output "${outputTemplate}" "${url}"`
    } else if (formatId === 'ultra_reliable') {
      // Ultra reliable option - works on any connection speed
      command = `yt-dlp --format "best[height<=360][filesize<=30M]/worst[height<=240]/worst" --output "${outputTemplate}" "${url}"`
    } else {
      // Specific format with multiple fallbacks
      command = `yt-dlp --format "${formatId}[height<=720][filesize<=200M]/${formatId}[height<=480]/${formatId}/best[height<=480][filesize<=100M]/best[height<=360]/worst" --output "${outputTemplate}" "${url}"`
    }

    try {
      // Execute download with extended timeout for reliability
      await execAsync(command, { timeout: 28000 })
      
      // Find the downloaded file
      const files = fs.readdirSync(tempDir).filter(f => f.startsWith(`video_${timestamp}`))
      
      if (files.length === 0) {
        // If no file found, try one more time with the most reliable format
        console.log('First attempt failed, trying ultra-reliable format')
        const fallbackCommand = `yt-dlp --format "worst[height<=240]/worst" --output "${outputTemplate}" "${url}"`
        await execAsync(fallbackCommand, { timeout: 20000 })
        
        const fallbackFiles = fs.readdirSync(tempDir).filter(f => f.startsWith(`video_${timestamp}`))
        if (fallbackFiles.length === 0) {
          throw new Error('Download failed - no file created after fallback attempt')
        }
        tempFilePath = path.join(tempDir, fallbackFiles[0])
      } else {
        tempFilePath = path.join(tempDir, files[0])
      }
      
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