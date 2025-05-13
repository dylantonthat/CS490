//** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      // FLASK ROUTES - All backend routes explicitly mapped
      {
        source: "/api/resumes/:path*",
        destination: "http://localhost:5000/api/resumes/:path*",
      },
      {
        source: "/api/jobs/:path*",
        destination: "http://localhost:5000/api/jobs/:path*",
      },
      {
        source: "/api/user/:path*",
        destination: "http://localhost:5000/api/user/:path*",
      },
      {
        source: "/api/templates",
        destination: "http://localhost:5000/api/templates",
      },
      {
        source: "/api/testdb/:path*",
        destination: "http://localhost:5000/api/testdb/:path*",
      },
      {
        source: "/api/auth/:path*",
        destination: "http://localhost:5000/api/auth/:path*",
      },
      {
        source: "/api",
        destination: "http://localhost:5000/api",
      },
      // Optional catch-all proxy for other /api/* paths not listed above
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;



export default nextConfig;
