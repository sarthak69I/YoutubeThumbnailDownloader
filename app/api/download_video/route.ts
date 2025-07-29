import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)

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

    // First, check file size to determine download strategy
    try {
      const infoCommand = `yt-dlp --dump-json --no-download "${url}"`
      const { stdout } = await execAsync(infoCommand, { timeout: 8000 })
      const videoInfo = JSON.parse(stdout)
      
      // Find the format that will be downloaded
      let selectedFormat = null
      if (videoInfo.formats && Array.isArray(videoInfo.formats)) {
        if (formatId === 'best') {
          selectedFormat = videoInfo.formats
            .filter((f: any) => f.vcodec !== 'none' && f.height && f.height <= 1080)
            .sort((a: any, b: any) => (b.height || 0) - (a.height || 0))[0]
        } else {
          selectedFormat = videoInfo.formats.find((f: any) => f.format_id === formatId)
        }
      }

      const estimatedSize = selectedFormat?.filesize || 0
      const isLargeFile = estimatedSize > 100 * 1024 * 1024 // 100MB threshold

      // For large files, provide streaming download
      if (isLargeFile) {
        return streamingDownload(url, formatId, videoInfo.title)
      } else {
        return regularDownload(url, formatId)
      }

    } catch (infoError) {
      console.error('Info extraction error:', infoError)
      // Fallback to regular download if info extraction fails
      return regularDownload(url, formatId)
    }

  } catch (error) {
    console.error('Download Error:', error)
    return NextResponse.json(
      { error: 'Internal server error during download' },
      { status: 500 }
    )
  }
}

// Streaming download for large files (bypasses timeout)
async function streamingDownload(url: string, formatId: string, title: string) {
  return new Promise((resolve) => {
    // Construct yt-dlp command for streaming
    let format = formatId === 'best' ? 'best[height<=1080]/best' : formatId
    const args = ['--format', format, '--output', '-', url]
    
    const ytdlp = spawn('yt-dlp', args)
    
    // Create readable stream
    const stream = new ReadableStream({
      start(controller) {
        ytdlp.stdout.on('data', (chunk) => {
          controller.enqueue(new Uint8Array(chunk))
        })
        
        ytdlp.stdout.on('end', () => {
          controller.close()
        })
        
        ytdlp.stderr.on('data', (data) => {
          console.error('yt-dlp stderr:', data.toString())
        })
        
        ytdlp.on('error', (error) => {
          console.error('yt-dlp process error:', error)
          controller.error(error)
        })
        
        ytdlp.on('close', (code) => {
          if (code !== 0) {
            console.error(`yt-dlp process exited with code ${code}`)
            controller.error(new Error(`Download failed with code ${code}`))
          }
        })
      },
      
      cancel() {
        ytdlp.kill()
      }
    })

    // Clean filename for download
    const cleanTitle = title?.replace(/[^a-zA-Z0-9.-\s]/g, '') || 'video'
    const filename = `${cleanTitle.substring(0, 50)}.mp4`

    resolve(new NextResponse(stream, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache'
      },
    }))
  })
}

// Regular download for smaller files
async function regularDownload(url: string, formatId: string) {
  let tempFilePath = ''
  
  try {
    // Create temporary directory for download
    const tempDir = os.tmpdir()
    const timestamp = Date.now()
    const outputTemplate = path.join(tempDir, `video_${timestamp}.%(ext)s`)
    
    // Construct yt-dlp command for video download
    let command = `yt-dlp --format "${formatId}" --output "${outputTemplate}" "${url}"`
    
    // Add quality fallbacks for better success rate
    if (formatId === 'best') {
      command = `yt-dlp --format "best[height<=720]/best[height<=1080]/best" --output "${outputTemplate}" "${url}"`
    }

    // Execute download with shorter timeout for regular downloads
    await execAsync(command, { timeout: 8000 })
    
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
        error: 'Download timeout. This video may be too large for quick download. Try using a dedicated hosting service for large files.' 
      }, { status: 408 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to download video. It may be private, deleted, or too large for this service.' 
    }, { status: 400 })
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