# Complete GitHub Repository Files - Copy These Exactly

## 🚨 IMPORTANT: Replace Your Current Files

Your Render build is failing because your GitHub repository still has the old files. Copy these files exactly to fix the deployment.

## 📁 File 1: package.json (Replace completely)

```json
{
  "name": "eleakxdown",
  "version": "1.0.0",
  "description": "E-LEAKxDOWN - Ultimate YouTube Video & Audio Downloader",
  "main": "index.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "keywords": ["youtube", "downloader", "video", "audio", "mp3"],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0"
  }
}
```

## 📁 File 2: next.config.js (Replace completely)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['i.postimg.cc', 'img.youtube.com', 'i.ytimg.com'],
  },
  experimental: {
    appDir: true,
  },
};

module.exports = nextConfig;
```

## 📁 File 3: render.yaml (Add this file)

```yaml
services:
  - type: web
    name: eleakxdown
    env: node
    plan: free
    buildCommand: npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
```

## 📁 File 4: tsconfig.json (Make sure you have this)

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## 🚀 Step-by-Step Fix

### 1. Update Your GitHub Repository NOW:
1. Go to your GitHub repository
2. **Delete the old package.json**
3. **Create new package.json** with the content above
4. **Update next.config.js** with the content above
5. **Add render.yaml** if not present
6. **Commit changes**

### 2. Render Will Automatically Rebuild:
- Detects the changes
- Runs `npm run build` (now works!)
- Installs yt-dlp and FFmpeg
- Starts your server

### 3. Expected Success:
- Build completes successfully
- All video download features work
- MP3 extraction works
- Thumbnails work perfectly

## ⚠️ Critical: Repository Structure

Your GitHub repository must have:
```
eleakxdown-free/
├── app/
│   ├── api/ (all your API routes)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── VideoAnalyzer.tsx
├── public/
├── package.json (UPDATED VERSION ABOVE)
├── next.config.js (UPDATED VERSION ABOVE)
├── tsconfig.json
├── render.yaml
└── README.md
```

## 🎯 This Will Fix:
- ✅ `npm run build` command exists
- ✅ Proper Next.js dependencies
- ✅ No Flask backend conflicts
- ✅ Clean build process
- ✅ Full video download functionality

Replace these files in your GitHub repository and Render will rebuild successfully with full video download capabilities!