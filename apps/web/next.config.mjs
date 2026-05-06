/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@saba/shared", "@saba/database"],
  experimental: {
    optimizePackageImports: ["lucide-react"]
  }
};

export default nextConfig;
