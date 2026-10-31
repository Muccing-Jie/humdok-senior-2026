/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: process.env.NEXT_EXPORT === 'true' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
