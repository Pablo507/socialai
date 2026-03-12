/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: 'vaaooxnolvjtpisufgbf.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.fal.ai' },
      { protocol: 'https', hostname: '*.fal.run' },
      { protocol: 'https', hostname: 'v3.fal.media' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: 'videos.pexels.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://images.unsplash.com https://plus.unsplash.com https://vaaooxnolvjtpisufgbf.supabase.co https://*.supabase.co https://*.fal.ai https://*.fal.run https://v3.fal.media https://images.pexels.com https://videos.pexels.com",
              "connect-src 'self' https://*.supabase.co https://api.groq.com https://api.unsplash.com https://api.pexels.com https://graph.facebook.com https://api.mercadopago.com https://*.fal.run",
              "media-src 'self' blob: https://*.fal.ai https://*.fal.run https://v3.fal.media https://videos.pexels.com",
              "frame-src 'self' https://www.facebook.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
