import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

function getBackendOrigin(value: string | undefined): string {
  const fallback = 'http://localhost:8080';
  const raw = value?.trim();

  if (!raw) {
    return fallback;
  }

  try {
    const url = new URL(raw);
    url.pathname = '';
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/+$/, '');
  } catch {
    return fallback;
  }
}

const backendOrigin = getBackendOrigin(process.env.NEXT_PUBLIC_API_URL);

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      {
        source: '/ws',
        destination: `${backendOrigin}/ws`,
      },
      {
        source: '/ws/:path*',
        destination: `${backendOrigin}/ws/:path*`,
      },
      {
        source: '/api/workspaces/:workspaceId/subscription',
        destination: `${backendOrigin}/api/workspaces/:workspaceId/subscription`,
      },
      {
        source: '/api/workspaces/:workspaceId/payment/:path*',
        destination: `${backendOrigin}/api/workspaces/:workspaceId/payment/:path*`,
      },
      {
        source: '/api/status/:slug',
        destination: `${backendOrigin}/status/:slug`,
      },
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/:path*`,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

export default withNextIntl(nextConfig);
