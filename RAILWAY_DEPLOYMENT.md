# Deploy E-LEAKxDOWN on Railway - Large File Support

## Why Railway for Large Downloads?

### ✅ Perfect for Large Files:
- **No function timeouts** - Downloads can take hours if needed
- **500 free hours/month** - About 16+ hours daily usage
- **1GB RAM included** - Handles large video processing
- **Persistent containers** - Better for file operations
- **No hard limits** - Process files of any size

### 🚀 Railway vs Vercel:
- **Vercel**: Perfect for small-medium files, instant response
- **Railway**: Ideal for large files (500MB+), no timeouts
- **Best strategy**: Use both with automatic routing

---

## Step-by-Step Railway Deployment

### Step 1: Prepare Your Repository (5 minutes)

1. **Create Railway-specific Dockerfile**:
```dockerfile
# Dockerfile.railway
FROM node:18-alpine

# Install Python, pip, ffmpeg, and system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    ffmpeg \
    curl \
    bash

# Install yt-dlp
RUN pip3 install yt-dlp

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.js ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Build Next.js application
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

2. **Create Railway configuration**:
```json
// railway.json
{
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "sleepApplication": false,
    "numReplicas": 1
  }
}
```

### Step 2: Deploy to Railway (3 minutes)

1. **Sign up at railway.app**
2. **Connect GitHub account**
3. **Create new project** → "Deploy from GitHub repo"
4. **Select your E-LEAKxDOWN repository**
5. **Configure build settings**:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Dockerfile**: Use `Dockerfile.railway`

### Step 3: Environment Variables
```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_URL=https://your-app.up.railway.app
```

### Step 4: Custom Domain (Optional)
- **Railway provides**: `your-app.up.railway.app`
- **Custom domain**: Add in Railway dashboard
- **SSL**: Automatic with custom domains

---

## Enhanced Large File Handling

### Modified API Route for Railway:
```typescript
// app/api/download_video_large/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { promisify } from 'util'
import { exec } from 'child_process'

const execAsync = promisify(exec)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')
    const formatId = searchParams.get('format_id') || 'best'

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Enhanced streaming for very large files
    return new Promise((resolve) => {
      const args = [
        '--format', formatId === 'best' ? 'best[height<=1080]' : formatId,
        '--output', '-',
        '--no-warnings',
        '--extract-flat', 'false',
        url
      ]
      
      const ytdlp = spawn('yt-dlp', args, {
        stdio: ['ignore', 'pipe', 'pipe']
      })
      
      let filename = 'video.mp4'
      let contentLength = 0
      
      // Get video title for better filename
      exec(`yt-dlp --get-title "${url}"`, (error, stdout) => {
        if (!error && stdout.trim()) {
          const title = stdout.trim().replace(/[^a-zA-Z0-9.-\s]/g, '').substring(0, 50)
          filename = `${title}.mp4`
        }
      })
      
      const stream = new ReadableStream({
        start(controller) {
          ytdlp.stdout.on('data', (chunk) => {
            contentLength += chunk.length
            controller.enqueue(new Uint8Array(chunk))
          })
          
          ytdlp.stdout.on('end', () => {
            controller.close()
          })
          
          ytdlp.on('error', (error) => {
            console.error('yt-dlp error:', error)
            controller.error(error)
          })
          
          ytdlp.on('close', (code) => {
            if (code !== 0) {
              controller.error(new Error(`Download failed with code ${code}`))
            }
          })
        },
        
        cancel() {
          ytdlp.kill('SIGKILL')
        }
      })

      resolve(new NextResponse(stream, {
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-store',
          'X-Accel-Buffering': 'no' // Disable nginx buffering
        },
      }))
    })

  } catch (error) {
    console.error('Large download error:', error)
    return NextResponse.json(
      { error: 'Failed to process large download' },
      { status: 500 }
    )
  }
}
```

---

## Monitoring and Optimization

### Railway Dashboard Features:
- **Real-time logs** - Monitor download progress
- **Resource usage** - Track CPU/memory consumption
- **Deployment history** - Easy rollbacks
- **Environment management** - Secure configuration

### Performance Tips:
```typescript
// Optimize for large downloads
const optimizedArgs = [
  '--format', 'best[height<=1080][filesize<500M]/best[height<=720]/best',
  '--concurrent-fragments', '4',
  '--buffer-size', '16K',
  '--no-cache-dir',
  '--output', '-',
  url
]
```

---

## Hybrid Deployment Strategy

### Smart Routing Implementation:
```typescript
// components/DownloadRouter.tsx
async function handleDownload(url: string, formatId: string) {
  // Check estimated file size
  const videoInfo = await fetch('/api/get_video_info', {
    method: 'POST',
    body: new FormData([['url', url]])
  }).then(r => r.json())
  
  const estimatedSize = getEstimatedSize(videoInfo, formatId)
  
  if (estimatedSize > 100 * 1024 * 1024) { // 100MB threshold
    // Route to Railway for large files
    window.location.href = `https://your-railway-app.up.railway.app/api/download_video_large?url=${encodeURIComponent(url)}&format_id=${formatId}`
  } else {
    // Use Vercel for smaller files
    window.location.href = `/api/download_video?url=${encodeURIComponent(url)}&format_id=${formatId}`
  }
}
```

---

## Cost and Usage Optimization

### Railway Free Tier Maximization:
- **500 hours/month** = ~16.7 hours/day
- **Sleep after 30 minutes** of inactivity
- **Wake time**: ~10-30 seconds
- **Strategy**: Use for large downloads only

### Usage Monitoring:
```bash
# Check Railway usage
railway status
railway logs

# Monitor resource consumption
railway metrics
```

---

## Troubleshooting

### Common Issues:

**Build Failures**:
```bash
# Check build logs
railway logs --build

# Rebuild with verbose output
railway up --verbose
```

**Memory Issues**:
```typescript
// Add memory optimization
process.env.NODE_OPTIONS = '--max-old-space-size=1024'
```

**yt-dlp Not Found**:
```dockerfile
# Ensure yt-dlp is properly installed
RUN pip3 install --upgrade yt-dlp
RUN yt-dlp --version  # Verify installation
```

---

## Production Checklist

### Before Going Live:
- [ ] Test large file downloads (500MB+)
- [ ] Verify yt-dlp installation
- [ ] Configure error handling
- [ ] Set up monitoring
- [ ] Test automatic routing logic
- [ ] Verify SSL certificate
- [ ] Test mobile compatibility

### Launch Commands:
```bash
# Deploy to Railway
git push origin main

# Check deployment status
railway status

# View live logs
railway logs --tail
```

Your E-LEAKxDOWN app will now handle unlimited downloads of any size with Railway backing up Vercel for large files!