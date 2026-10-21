// next.config.mjs
//
// One codebase, two ways to deploy (see docs/Deployment.md):
//
//   Node server   npm run build && npm start          → full Next.js (any host that runs Node.js)
//   Static export npm run build:static                → plain files in ./out (any web host)
//
// Optional env vars:
//   BUILD_TARGET=static          set by `npm run build:static`; switches on `output: 'export'`
//   NEXT_PUBLIC_BASE_PATH=/sub   host the site under a sub-path (e.g. GitHub Pages /portfolio)

const isStatic = process.env.BUILD_TARGET === 'static';
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  // /projects/mh1 → /projects/mh1/ (static export emits projects/mh1/index.html, which every
  // web server serves with no rewrite rules; Node mode redirects the same way).
  trailingSlash: true,

  ...(basePath ? { basePath } : {}),

  // We reference public/ files with plain URLs (see src/utils/assetPath.js), not next/image.
  images: { unoptimized: true },

  // three's examples/ESM builds are shipped untranspiled.
  transpilePackages: ['three'],

  ...(isStatic
    ? { output: 'export' }
    : {
        // Large, immutable 3D assets: let browsers and CDNs cache them hard (Node mode only;
        // for static hosting the same rules live in deploy/static/.htaccess).
        async headers() {
          const immutable = [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }];
          return ['/models/:path*', '/textures/:path*', '/assets/:path*'].map((source) => ({ source, headers: immutable }));
        },
      }),
};

export default nextConfig;
