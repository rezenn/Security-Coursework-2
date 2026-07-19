/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.DOCKER_BUILD === "true" ? "standalone" : undefined,

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/:path*`,
      },
      {
        source: "/uploads/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/uploads/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/uploads/**",
      },
      { protocol: "https", hostname: "**" },
    ],
  },
};

module.exports = nextConfig;
