// Local dev server: serves public/ and runs api/*.js the way Vercel does.
// Usage: PICKEM_PASSCODE=test npm run dev  ->  http://localhost:3000
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const PORT = Number(process.env.PORT || 3000);
const ROOT = new URL('./public/', import.meta.url).pathname;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    const api = url.pathname.match(/^\/api\/([a-z]+)$/);
    if (api) {
      const { default: handler } = await import(`./api/${api[1]}.js`);
      let raw = '';
      for await (const chunk of req) raw += chunk;
      req.body = raw;
      req.query = Object.fromEntries(url.searchParams);
      return await handler(req, res);
    }
    const path = normalize(join(ROOT, url.pathname === '/' ? 'index.html' : url.pathname));
    if (!path.startsWith(ROOT)) throw new Error('outside root');
    const body = await readFile(path);
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' });
    res.end(body);
  } catch (err) {
    if (err.code !== 'ENOENT' && err.code !== 'ERR_MODULE_NOT_FOUND') console.error(err);
    res.writeHead(404).end('Not found');
  }
}).listen(PORT, () => console.log(`Pick'em running at http://localhost:${PORT}`));
