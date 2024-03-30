/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/abstract/:id*",
        destination: "https://bdtd.ibict.br/vufind/Record/:slug*",
      },
    ];
  },
};

export default nextConfig;
