/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  redirects: [
    {
      source: "/logout",
      destination: "/api/auth/logout",
      permanent: true,
    },
    {
      source: "/signout",
      destination: "/api/auth/logout",
      permanent: true,
    },
  ],
};

module.exports = nextConfig;
