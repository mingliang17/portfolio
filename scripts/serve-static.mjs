// Tiny static server that behaves like a typical web host, for previewing ./out locally:
//   npm run build:static && npm run serve:static      → http://localhost:4000
//   - /projects/mh1  → 301 → /projects/mh1/  → serves projects/mh1/index.html  (like Apache/nginx)
//   - unknown URLs   → 404 status with out/404.html  (like `ErrorDocument 404 /404.html`)
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const ROOT = join(process.cwd(), process.env.OUT_DIR || 'out');
const PORT = Number(process.env.PORT || 4000);
const BASE = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.fbx': 'application/octet-stream', '.hdr': 'application/octet-stream', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain' };

const send = (res, status, file) => {
  res.writeHead(status, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
};

createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let path = decodeURIComponent(url.pathname);
  if (BASE && path.startsWith(BASE)) path = path.slice(BASE.length) || '/';
  const file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT)) return send(res, 403, join(ROOT, '404.html'));

  if (existsSync(file) && statSync(file).isDirectory()) {
    // redirect /dir → /dir/ and keep the ?query, like Apache's mod_dir
    if (!path.endsWith('/')) { res.writeHead(301, { Location: `${BASE}${path}/${url.search}` }); return res.end(); }
    const index = join(file, 'index.html');
    if (existsSync(index)) return send(res, 200, index);
  } else if (existsSync(file)) {
    return send(res, 200, file);
  }
  send(res, 404, join(ROOT, '404.html'));
}).listen(PORT, () => console.log(`Serving ${ROOT} on http://localhost:${PORT}`));
