/** @type {import('next').NextConfig} */
const isGithubPages = process.env.NEXT_EXPORT === 'true' || process.env.GITHUB_ACTIONS === 'true';
const repoName = 'humdok-senior-2026';

const nextConfig = {
  reactStrictMode: false,
  output: isGithubPages ? 'export' : undefined,
  basePath: isGithubPages ? `/${repoName}` : '',
  assetPrefix: isGithubPages ? `/${repoName}/` : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
