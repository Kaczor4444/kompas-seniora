/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Ignore README and LICENSE files from libsql packages
    config.module.rules.push({
      test: /\.(md|txt)$/,
      type: 'asset/source',
    });
    
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    
    return config;
  },
};

export default nextConfig;
