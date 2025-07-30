/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['i.postimg.cc', 'img.youtube.com', 'i.ytimg.com'],
  },
  // Removed Flask backend rewrites for Render deployment
  // API routes are now native Next.js routes in app/api/
  experimental: {
    appDir: true,
  },
};

module.exports = nextConfig;