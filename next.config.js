/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  redirects: [
    {
      source: "/logout",
      destination: "/signout",
      permanent: true,
    },
  ],
};

module.exports = nextConfig;
