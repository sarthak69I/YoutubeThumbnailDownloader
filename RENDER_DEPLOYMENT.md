# Deploy E-LEAKxDOWN to Render

## Overview
Your E-LEAKxDOWN app is ready for deployment on Render with both Next.js frontend and Flask backend in a single service.

## Deployment Options

### Option 1: Single Service (Recommended)
Deploy both Next.js and Flask together using Docker:

#### Steps:
1. **Create GitHub Repository**
   - Push all your code to GitHub
   - Include: `Dockerfile`, `render.yaml`, all Next.js and Flask files

2. **Deploy to Render**
   - Go to [render.com](https://render.com)
   - Connect your GitHub account
   - Create "New Web Service"
   - Select your repository
   - Choose "Docker" as environment
   - Set build command: `docker build -t eleakxdown .`
   - Set start command: `./start.sh`

3. **Configure Environment Variables**
   ```
   NODE_ENV=production
   FLASK_ENV=production
   PORT=3000
   ```

### Option 2: Separate Services
Deploy Next.js and Flask as separate services:

#### Frontend Service (Next.js):
- **Environment**: Node.js
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Port**: 3000

#### Backend Service (Flask):
- **Environment**: Python
- **Build Command**: `pip install flask gunicorn yt-dlp requests email-validator flask-sqlalchemy psycopg2-binary`
- **Start Command**: `gunicorn --bind 0.0.0.0:$PORT main:app`
- **Port**: 5000

## File Structure for Deployment
```
├── Dockerfile                    # Multi-stage build for both services
├── render.yaml                   # Render configuration
├── RENDER_DEPLOYMENT.md          # This guide
├── app/                          # Next.js app
├── components/                   # React components
├── app.py                        # Flask backend
├── main.py                       # Flask entry point
├── static/                       # Static assets
├── templates/                    # Flask templates (if needed)
├── next.config.js                # Next.js config with backend URL
└── public/                       # Public assets
```

## Environment Variables Required

### Production Settings:
- `NODE_ENV=production`
- `FLASK_ENV=production` 
- `PORT=3000` (or assigned by Render)
- `FLASK_BACKEND_URL=http://localhost:5000` (for local backend)

### Optional (for separate services):
- `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com`

## Build Process
1. **Docker builds both services** in multi-stage process
2. **Next.js frontend** compiled and optimized
3. **Flask backend** with yt-dlp and dependencies installed
4. **Startup script** runs both services simultaneously

## Post-Deployment
After successful deployment:

### Your app will be available at:
- `https://your-app-name.onrender.com`

### Features Available:
- ✅ Full cyberpunk design
- ✅ YouTube video analysis and downloads
- ✅ MP3 audio extraction
- ✅ Thumbnail downloads
- ✅ Mobile-responsive interface
- ✅ Unlimited downloads

## Performance Notes
- **Free tier**: 750 hours/month (enough for testing)
- **Paid tier**: Better performance and no sleeping
- **Cold starts**: ~30 seconds on free tier
- **Build time**: 3-5 minutes for initial deployment

## Troubleshooting

### Common Issues:
1. **Build fails**: Check Dockerfile syntax
2. **Services don't communicate**: Verify port configuration
3. **yt-dlp errors**: Ensure FFmpeg is installed in Docker

### Debug Commands:
```bash
# Check logs in Render dashboard
# Test locally with Docker:
docker build -t eleakxdown .
docker run -p 3000:3000 -p 5000:5000 eleakxdown
```

## Alternative: Railway
If Render has issues, Railway is another great option:
- Similar setup process
- Better free tier limits
- Excellent for full-stack apps

Your E-LEAKxDOWN app is ready for production deployment on Render!