/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Wyłącz ESLint podczas production build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Wyłącz type checking podczas production build (opcjonalnie)
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
