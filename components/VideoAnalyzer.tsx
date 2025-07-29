'use client'

import React, { useState, FormEvent } from 'react'

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

interface VideoAnalyzerResponse {
  video_info?: VideoInfo
  error?: string
}

export default function VideoAnalyzer() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [thumbnailQuality, setThumbnailQuality] = useState('high')
  const [videoQuality, setVideoQuality] = useState('')
  const [audioQuality, setAudioQuality] = useState('best')

  const isValidYouTubeUrl = (url: string): boolean => {
    const regex = /^(https?:\/\/)?(www\.)?(youtube|youtu|youtube-nocookie)\.(com|be)\/(watch\?v=|embed\/|v\/|.+\?v=)?([^&=%?]{11})/
    return regex.test(url)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!url.trim()) {
      setError('Please enter a YouTube URL')
      return
    }

    if (!isValidYouTubeUrl(url)) {
      setError('Please enter a valid YouTube URL')
      return
    }

    setLoading(true)
    setError('')
    setVideoInfo(null)

    try {
      const formData = new FormData()
      formData.append('url', url)

      const response = await fetch('/api/get_video_info', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data: VideoAnalyzerResponse = await response.json()

      if (data.error) {
        setError(data.error)
        return
      }

      if (data.video_info) {
        setVideoInfo(data.video_info)
        if (data.video_info.video_streams.length > 0) {
          setVideoQuality(data.video_info.video_streams[0].format_id)
        }
      }

    } catch (err) {
      console.error('Error:', err)
      setError('Failed to fetch video information. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (type: 'thumbnail' | 'video' | 'audio') => {
    if (!videoInfo) return

    try {
      let downloadUrl = ''
      let filename = ''

      switch (type) {
        case 'thumbnail':
          const thumbnailUrl = videoInfo.thumbnails[thumbnailQuality as keyof typeof videoInfo.thumbnails]
          downloadUrl = `/api/download_thumbnail?url=${encodeURIComponent(thumbnailUrl)}&quality=${thumbnailQuality}`
          filename = `${videoInfo.title}_thumbnail.jpg`
          break
        case 'video':
          downloadUrl = `/api/download_video?url=${encodeURIComponent(url)}&format_id=${videoQuality}`
          filename = `${videoInfo.title}.mp4`
          break
        case 'audio':
          downloadUrl = `/api/download_audio?url=${encodeURIComponent(url)}&format_id=${audioQuality}`
          filename = `${videoInfo.title}.mp3`
          break
      }

      // Create download link
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (err) {
      console.error('Download error:', err)
      setError('Download failed. Please try again.')
    }
  }

  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }

  const formatDate = (dateStr: string): string => {
    if (/^\d{8}$/.test(dateStr)) {
      const year = dateStr.substr(0, 4)
      const month = dateStr.substr(4, 2)
      const day = dateStr.substr(6, 2)
      return `${month}/${day}/${year}`
    }
    return dateStr
  }

  return (
    <>
      {/* Search Form */}
      <div className="search-section">
        <form onSubmit={handleSubmit}>
          <div className="row g-3 align-items-end">
            <div className="col-md-8">
              <label htmlFor="youtubeUrl" className="form-label text-secondary mb-2">
                <i className="fab fa-youtube me-2"></i>
                YouTube URL
              </label>
              <input
                type="text"
                className="cyber-input"
                id="youtubeUrl"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                disabled={loading}
              />
            </div>
            <div className="col-md-4">
              <button
                type="submit"
                className="btn btn-neon w-100"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner me-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-search me-2"></i>
                    Analyze Video
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message fade-in-up">
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {/* Video Information */}
      {videoInfo && (
        <div className="slide-in-up">
          <div className="container mt-5">
            {/* Video Details */}
            <div className="glass-card p-4 mb-4">
              <div className="row">
                <div className="col-md-4">
                  <img
                    src={videoInfo.thumbnails[thumbnailQuality as keyof typeof videoInfo.thumbnails]}
                    alt="Video Thumbnail"
                    className="img-fluid rounded"
                    style={{ border: 'var(--border-neon)' }}
                  />
                </div>
                <div className="col-md-8 ps-md-4">
                  <h3 className="fw-bold mb-3" style={{ color: 'var(--text-neon)' }}>
                    {videoInfo.title}
                  </h3>
                  <div className="row g-3 mb-3">
                    <div className="col-sm-6">
                      <small className="text-muted">Channel</small>
                      <p className="mb-0 text-secondary">{videoInfo.author}</p>
                    </div>
                    <div className="col-sm-6">
                      <small className="text-muted">Duration</small>
                      <p className="mb-0 text-secondary">{videoInfo.duration_str || 'Unknown'}</p>
                    </div>
                    <div className="col-sm-6">
                      <small className="text-muted">Views</small>
                      <p className="mb-0 text-secondary">{formatNumber(videoInfo.views) || 'Unknown'}</p>
                    </div>
                    <div className="col-sm-6">
                      <small className="text-muted">Published</small>
                      <p className="mb-0 text-secondary">{formatDate(videoInfo.publish_date) || 'Unknown'}</p>
                    </div>
                  </div>
                  <div>
                    <small className="text-muted">Description</small>
                    <p className="text-secondary small">
                      {videoInfo.description ? 
                        (videoInfo.description.length > 200 ? 
                          videoInfo.description.substring(0, 200) + '...' : 
                          videoInfo.description
                        ) : 
                        'No description available'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Download Options */}
            <div className="row g-4">
              {/* Thumbnail Download */}
              <div className="col-md-4">
                <div className="download-card">
                  <div className="d-flex align-items-center mb-3">
                    <i className="fas fa-image feature-icon me-3" style={{ fontSize: '2rem' }}></i>
                    <h5 className="mb-0 fw-bold">Thumbnail</h5>
                  </div>
                  <div className="mb-3">
                    <select
                      className="cyber-input"
                      value={thumbnailQuality}
                      onChange={(e) => setThumbnailQuality(e.target.value)}
                    >
                      <option value="default">Default (120x90)</option>
                      <option value="medium">Medium (320x180)</option>
                      <option value="high">High (480x360)</option>
                      <option value="standard">Standard (640x480)</option>
                      <option value="maxres">Max Res (1280x720)</option>
                    </select>
                  </div>
                  <button
                    className="btn btn-neon w-100"
                    onClick={() => handleDownload('thumbnail')}
                  >
                    <i className="fas fa-download me-2"></i>
                    Download Thumbnail
                  </button>
                </div>
              </div>

              {/* Video Download */}
              <div className="col-md-4">
                <div className="download-card">
                  <div className="d-flex align-items-center mb-3">
                    <i className="fas fa-video feature-icon me-3" style={{ fontSize: '2rem' }}></i>
                    <h5 className="mb-0 fw-bold">Video</h5>
                  </div>
                  <div className="mb-3">
                    <select
                      className="cyber-input"
                      value={videoQuality}
                      onChange={(e) => setVideoQuality(e.target.value)}
                    >
                      {videoInfo.video_streams.length > 0 ? (
                        videoInfo.video_streams.map((stream) => {
                          const resolution = stream.resolution
                          const filesize = stream.filesize_mb ? `${stream.filesize_mb} MB` : 'Unknown size'
                          const fps = stream.fps ? ` ${stream.fps}fps` : ''
                          const format = stream.ext ? ` (${stream.ext.toUpperCase()})` : ''
                          
                          let label = ''
                          if (stream.format_id === 'slow_connection') {
                            label = `${resolution} - Slow Internet Optimized ⚡ Fast`
                          } else {
                            const recommended = stream.recommended ? ' ✓ Recommended' : ''
                            const sizeWarning = stream.filesize_mb > 200 ? ' ⚠️ Large file' : ''
                            const slowWarning = stream.filesize_mb > 100 ? ' 🐌 Slow internet may timeout' : ''
                            label = `${resolution}${fps}${format} - ${filesize}${recommended}${sizeWarning}${slowWarning}`
                          }
                          
                          return (
                            <option key={stream.format_id} value={stream.format_id}>
                              {label}
                            </option>
                          )
                        })
                      ) : (
                        <option value="best">Best Quality Available (720p max)</option>
                      )}
                    </select>
                  </div>
                  
                  {/* Connection Speed Guidance */}
                  <div className="mb-3">
                    <div className="alert alert-info small">
                      <strong>Connection Tips:</strong><br/>
                      • Slow internet? Choose "Slow Internet Optimized"<br/>
                      • Files over 100MB may timeout on slow connections<br/>
                      • Audio extraction always works on any speed
                    </div>
                  </div>
                  <button
                    className="btn btn-neon w-100"
                    onClick={() => handleDownload('video')}
                  >
                    <i className="fas fa-download me-2"></i>
                    Download Video
                  </button>
                </div>
              </div>

              {/* Audio Download */}
              <div className="col-md-4">
                <div className="download-card">
                  <div className="d-flex align-items-center mb-3">
                    <i className="fas fa-headphones feature-icon me-3" style={{ fontSize: '2rem' }}></i>
                    <h5 className="mb-0 fw-bold">Audio (MP3)</h5>
                  </div>
                  <div className="mb-3">
                    <select
                      className="cyber-input"
                      value={audioQuality}
                      onChange={(e) => setAudioQuality(e.target.value)}
                    >
                      <option value="best">Best Quality (192kbps)</option>
                      <option value="good">Good Quality (128kbps)</option>
                      <option value="medium">Medium Quality (96kbps)</option>
                    </select>
                  </div>
                  <button
                    className="btn btn-neon w-100"
                    onClick={() => handleDownload('audio')}
                  >
                    <i className="fas fa-headphones me-2"></i>
                    Extract MP3
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}