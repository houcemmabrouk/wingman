/** @type {import('next').NextConfig} */
const BACKEND_INTERNAL = process.env.BACKEND_INTERNAL_URL || 'http://wingman-backend:8000'

const nextConfig = {
  output: 'standalone',
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  async redirects() {
    return [
      { source: '/diagnostic', destination: '/results', permanent: true },
      { source: '/performance', destination: '/results', permanent: true },
      { source: '/progress', destination: '/results', permanent: true },
    ]
  },
  // Proxy /proxy-api/* to the backend so iframes can embed generated PDFs
  // from a same-origin URL (avoids Edge blocking cross-origin PDF iframes).
  async rewrites() {
    return [
      { source: '/proxy-api/:path*', destination: `${BACKEND_INTERNAL}/api/:path*` },
    ]
  },
}

module.exports = nextConfig
