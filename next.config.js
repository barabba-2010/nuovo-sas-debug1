/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'lh3.googleusercontent.com'],
  },
  // Aggiungi eventuali altri domini se usi immagini esterne
  poweredByHeader: false,
  // Configure environment variables that will be available to the browser
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  // Add custom webpack configuration if needed
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig; 