/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['supabase.co'],
    unoptimized: true,
  },
  trailingSlash: false,
  generateBuildId: async () => {
    return 'gjchs-bizquiz-' + Date.now()
  },
  experimental: {
    outputFileTracingExcludes: {
      '/api/**/*': ['./node_modules/typescript/**/*', './node_modules/eslint/**/*'],
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'typescript': 'commonjs typescript',
        'eslint': 'commonjs eslint',
      });
    }
    return config;
  },
}

module.exports = nextConfig