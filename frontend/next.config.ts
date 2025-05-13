/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://cs490-6018144999aa.herokuapp.com/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;




export default nextConfig;
