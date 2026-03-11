/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'vaaooxnolvjtpisufgbf.supabase.co' },
      { protocol: 'https', hostname: '*.fal.ai' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "img-src 'self' data: blob: https://images.unsplash.com https://plus.unsplash.com https://vaaooxnolvjtpisufgbf.supabase.co https://*.fal.ai;",
          },
        ],
      },
    ];
  },
};
module.exports = nextConfig;
