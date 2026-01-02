/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Optimize for faster development
  onDemandEntries: {
    // Keep pages in memory longer (reduces recompilation)
    maxInactiveAge: 5 * 60 * 1000, // 5 minutes
    // Keep more pages in buffer
    pagesBufferLength: 10,
  },
  // Enable standalone output for Docker
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,
  // Optimize Turbopack for faster compilation
  experimental: {
    // Enable faster refresh
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      'recharts',
    ],
  },
}

export default nextConfig
