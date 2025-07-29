# Complete Step-by-Step Guide: Deploy E-LEAKxDOWN on Render

## Prerequisites
- GitHub account
- Render account (free signup at render.com)
- Your E-LEAKxDOWN project files

## Step 1: Prepare Your Project for GitHub

### 1.1 Create a New GitHub Repository
1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name it: `eleakxdown-app`
4. Set to Public (required for Render free tier)
5. Click "Create repository"

### 1.2 Upload Your Project Files
Upload these files to your GitHub repository:

**Required Files:**
```
├── Dockerfile
├── render.yaml
├── start.sh
├── next.config.js
├── tsconfig.json
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   └── api/
├── components/
│   ├── VideoAnalyzer.tsx
│   ├── FeatureSection.tsx
│   └── FloatingNav.tsx
├── public/
│   └── manifest.json
├── app.py
├── main.py
├── static/ (if you have any)
├── templates/ (if you have any)
└── package.json
```

**Upload Methods:**
- **Option A**: Use GitHub web interface (drag and drop files)
- **Option B**: Use Git commands:
```bash
git clone https://github.com/yourusername/eleakxdown-app.git
cd eleakxdown-app
# Copy all your files here
git add .
git commit -m "Initial E-LEAKxDOWN app"
git push origin main
```

## Step 2: Sign Up for Render

### 2.1 Create Render Account
1. Go to [render.com](https://render.com)
2. Click "Get Started" 
3. Sign up with GitHub (recommended)
4. Authorize Render to access your repositories

## Step 3: Deploy on Render

### 3.1 Create New Web Service
1. In Render dashboard, click "New +"
2. Select "Web Service"
3. Choose "Build and deploy from a Git repository"
4. Connect your GitHub account if not already connected

### 3.2 Select Your Repository
1. Find your `eleakxdown-app` repository
2. Click "Connect"

### 3.3 Configure Service Settings
Fill in these settings:

**Basic Settings:**
- **Name**: `eleakxdown` (or your preferred name)
- **Region**: Choose closest to your users (US East recommended)
- **Branch**: `main`
- **Root Directory**: Leave blank

**Build Settings:**
- **Runtime**: `Docker`
- **Build Command**: Leave blank (Docker handles this)
- **Start Command**: `./start.sh`

**Instance Type:**
- **Free** (for testing) or **Starter** ($7/month for better performance)

### 3.4 Environment Variables
Click "Advanced" and add these environment variables:

```
NODE_ENV = production
FLASK_ENV = production
PORT = 3000
FLASK_BACKEND_URL = http://localhost:5000
```

### 3.5 Deploy
1. Click "Create Web Service"
2. Render will start building your app
3. Wait 5-10 minutes for deployment

## Step 4: Monitor Deployment

### 4.1 Watch Build Logs
- Render will show real-time build logs
- Look for "Build successful" message
- Docker will install all dependencies

### 4.2 Check for Errors
Common issues and solutions:

**If build fails:**
- Check Dockerfile syntax
- Ensure all required files are in repository
- Check build logs for specific errors

**If deployment succeeds but app doesn't work:**
- Check service logs in Render dashboard
- Verify environment variables
- Test individual components

## Step 5: Access Your Live App

### 5.1 Get Your App URL
1. In Render dashboard, go to your service
2. Copy the URL (format: `https://eleakxdown.onrender.com`)
3. Click the URL to open your live app

### 5.2 Test Your App
Verify these features work:
- Main cyberpunk interface loads
- YouTube URL input accepts links
- Video analysis works
- Downloads function properly

## Step 6: Custom Domain (Optional)

### 6.1 Add Custom Domain
1. In your service settings, click "Custom Domains"
2. Add your domain (e.g., `eleakxdown.com`)
3. Update your domain's DNS settings:
   - Add CNAME record pointing to your Render URL

## Step 7: Optimize Performance

### 7.1 Upgrade Plan (Recommended)
Free tier limitations:
- App "sleeps" after 15 minutes of inactivity
- 750 hours/month limit
- Slower cold starts

**Upgrade to Starter ($7/month) for:**
- No sleeping
- Faster response times
- Better reliability

### 7.2 Monitor Usage
- Check Render dashboard for usage stats
- Monitor build times and response speeds

## Troubleshooting Common Issues

### Issue: Build Fails
**Solution:**
1. Check Render build logs
2. Verify all files are in GitHub
3. Test Dockerfile locally:
```bash
docker build -t eleakxdown .
docker run -p 3000:3000 eleakxdown
```

### Issue: App Loads but Features Don't Work
**Solution:**
1. Check service logs in Render
2. Verify environment variables
3. Test API endpoints manually

### Issue: Slow Loading
**Solution:**
1. Upgrade from free to paid plan
2. Optimize Docker image size
3. Enable compression in Next.js

### Issue: Downloads Don't Work
**Solution:**
1. Check Flask backend logs
2. Verify yt-dlp is properly installed
3. Test with different YouTube URLs

## Alternative Deployment: Separate Services

If single service has issues, deploy separately:

### Frontend Service (Next.js):
- Runtime: Node.js
- Build: `npm install && npm run build`
- Start: `npm start`

### Backend Service (Flask):
- Runtime: Python
- Build: `pip install -r requirements.txt`
- Start: `gunicorn --bind 0.0.0.0:$PORT main:app`

Then update Next.js config to point to backend URL.

## Final Checklist

Before going live:
- [ ] App loads properly
- [ ] YouTube analysis works
- [ ] Video downloads function
- [ ] Audio extraction works
- [ ] Thumbnail downloads work
- [ ] Mobile interface responsive
- [ ] Custom logo displays correctly
- [ ] All cyberpunk animations work

Your E-LEAKxDOWN app is now live on Render! Share your URL and enjoy unlimited YouTube downloads with your cyberpunk interface.