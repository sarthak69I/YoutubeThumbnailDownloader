/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['i.postimg.cc', 'img.youtube.com', 'i.ytimg.com'],
  },
  async rewrites() {
    const backendUrl = process.env.FLASK_BACKEND_URL || 'http://localhost:5000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
  experimental: {
    appDir: true,
  },
};

module.exports = nextConfig;