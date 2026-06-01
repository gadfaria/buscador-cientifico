/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // ioredis é só servidor; mantém fora do bundle do edge/client.
    serverComponentsExternalPackages: ["ioredis"],
  },
};

export default nextConfig;
