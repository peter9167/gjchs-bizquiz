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
}

module.exports = nextConfig