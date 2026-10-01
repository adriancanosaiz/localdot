import type { NextConfig } from 'next'

const config: NextConfig = {
  // Workspace packages ship TypeScript source and are compiled by Next.
  transpilePackages: ['@localdot/shared'],
  reactStrictMode: true,
  poweredByHeader: false,
}

export default config
