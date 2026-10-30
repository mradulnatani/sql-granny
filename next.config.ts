import type { NextConfig } from 'next';

const isGithubPages = process.env.DEPLOY_TARGET === 'github-pages';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: isGithubPages ? '/sql-granny' : '',
  assetPrefix: isGithubPages ? '/sql-granny/' : '',
};

export default nextConfig;
