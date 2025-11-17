/** @type {import('next').NextConfig} */
const nextConfig = {
  // Render.com optimization
  output: 'standalone',
  
  // Server actions configuration
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Image optimization for Render
  images: {
    domains: [],
    unoptimized: process.env.NODE_ENV === 'production',
  },
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Compression
  compress: true,
};

module.exports = nextConfig;

