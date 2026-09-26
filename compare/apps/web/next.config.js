/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@bandinghidup/core"],
  experimental: {
    typedRoutes: true,
  },
};

module.exports = nextConfig;
