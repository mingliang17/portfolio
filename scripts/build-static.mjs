// Builds a fully static copy of the site into ./out (upload its CONTENTS to public_html).
//   npm run build:static
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, rmSync } from 'node:fs';

rmSync('out', { recursive: true, force: true });
const build = spawnSync('npx', ['next', 'build'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, BUILD_TARGET: 'static' },
});
if (build.status !== 0) process.exit(build.status ?? 1);

// Apache rules (compression, caching, 404 page). Ignored by non-Apache servers.
if (existsSync('deploy/static/.htaccess')) cpSync('deploy/static/.htaccess', 'out/.htaccess');
if (existsSync('out/_next/static')) cpSync('deploy/static/next-static.htaccess', 'out/_next/static/.htaccess');
console.log('\n✓ Static site written to ./out — upload the contents of that folder.');
