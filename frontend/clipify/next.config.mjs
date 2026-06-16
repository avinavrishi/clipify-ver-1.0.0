/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    if (dev) {
      // Avoid Watchpack trying to stat Windows system files (e.g. C:\pagefile.sys) which causes EINVAL
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          ...(Array.isArray(config.watchOptions?.ignored) ? config.watchOptions.ignored : []),
          '**/node_modules',
          '**/.git',
          '**/pagefile.sys',
        ],
      };
    }
    return config;
  },
};

export default nextConfig;

