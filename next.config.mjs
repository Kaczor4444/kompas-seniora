/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Wyłącz type checking podczas production build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
