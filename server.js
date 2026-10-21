// server.js — start file for hosts that run Node.js apps (cPanel "Setup Node.js App"/Passenger,
// PM2, a VPS, Railway, Render, ...). Plain `npm start` (`next start`) works too; use this when the
// host asks for an "application startup file" or hands you a PORT to listen on.
//
//   npm run build && NODE_ENV=production node server.js
const { createServer } = require('node:http');
const next = require('next');

const port = parseInt(process.env.PORT || '3000', 10);
const hostname = process.env.HOSTNAME || '0.0.0.0';
const app = next({ dev: false, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
