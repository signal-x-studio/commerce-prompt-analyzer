/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Use absolute URL for assets when accessed via proxy/rewrite
  assetPrefix: process.env.NODE_ENV === 'production'
    ? 'https://llm-visibility-alpha.vercel.app'
    : undefined,
};

export default nextConfig;
