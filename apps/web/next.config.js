/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@stellar-veilyield/shared", "@stellar-veilyield/sdk"],
};

module.exports = nextConfig;
