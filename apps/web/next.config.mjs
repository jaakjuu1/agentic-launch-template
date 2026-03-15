/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@launch/analytics",
    "@launch/auth",
    "@launch/billing",
    "@launch/config",
    "@launch/design-tokens",
    "@launch/domain",
    "@launch/ui-web",
  ],
};

export default nextConfig;
