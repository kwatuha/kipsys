import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@zoom/meetingsdk'],
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
  onDemandEntries: {
    // Keep pages in memory longer (60 minutes instead of 5)
    maxInactiveAge: 60 * 60 * 1000,
    // Keep more pages in buffer for faster access
    pagesBufferLength: 100,
  },

  // Enable faster refresh in development
  reactStrictMode: true,

  // Disable source maps in development for faster compilation (can re-enable if needed for debugging)
  productionBrowserSourceMaps: false,
  // Keep your DOCKER_BUILD logic
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,

  /**
   * Optional: Cross-Origin isolation improves Zoom gallery view / virtual backgrounds (SharedArrayBuffer).
   * Set ENABLE_ZOOM_COEP_HEADERS=true when building — may affect other embeds/CDN assets site-wide.
   * Also configure the same headers on your reverse proxy in production.
   */
  async headers() {
    if (process.env.ENABLE_ZOOM_COEP_HEADERS === 'true') {
      return [
        {
          source: '/:path*',
          headers: [
            { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
            { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          ],
        },
      ]
    }
    return []
  },

  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-tooltip',
      'recharts',
      'date-fns',
      'framer-motion',
    ],
    // Enable faster refresh
    optimizeCss: false, // Disable CSS optimization in dev for faster builds
  },

  // ADD THIS WEBPACK SECTION:
  webpack: (config, { isServer, dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './'),
    };

    // Handle Node.js modules for client-side only
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        buffer: false,
      };
    }

    // Ensure qrcode.react is resolved correctly
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
      '.jsx': ['.jsx', '.tsx'],
    };

    // Enable webpack caching for faster rebuilds in development
    if (dev && !isServer) {
      config.cache = {
        type: 'filesystem',
        buildDependencies: {
          config: [__filename],
        },
      };
    }

    // Optimize module resolution
    config.resolve.modules = ['node_modules', path.resolve(__dirname, './')];

    // Optimize for faster builds in development
    if (dev) {
      // Reduce work in development
      config.optimization = config.optimization || {};
      config.optimization.removeAvailableModules = false;
      config.optimization.removeEmptyChunks = false;
      config.optimization.splitChunks = false;
    }

    return config;
  },
}

export default nextConfig;
