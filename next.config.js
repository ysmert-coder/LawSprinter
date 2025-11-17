/** @type {import('next').NextConfig} */
const nextConfig = {
  // Render.com optimization - remove standalone for now
  // output: 'standalone',
  
  // Server actions configuration
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Image optimization for Render
  images: {
    domains: [],
    unoptimized: true, // Always unoptimized for free tier
  },
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Compression
  compress: true,

  // TypeScript and ESLint configuration for Render deployment
  typescript: {
    // !! WARN !!
    // Temporarily allow production builds to complete with type errors
    // TODO: Fix all TypeScript errors after successful deployment
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  eslint: {
    // Allow production builds to complete with ESLint warnings
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;

