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
