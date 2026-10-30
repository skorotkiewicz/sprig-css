// Local preview only. Serve public project files.
import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const publicRoots = new Set(['index.html', 'site', 'dist', 'docs', 'examples', 'data', 'skills', 'llms.txt', 'README.md', 'LICENSE', 'NOTICE']);
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.md': 'text/plain', '.txt': 'text/plain', '.svg': 'image/svg+xml' };
const port = Number(process.env.PORT ?? 4173);
const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const parts = path.split('/').filter(Boolean);
    if (!parts.length) parts.push('index.html');
    if (!publicRoots.has(parts[0]) || parts.some(part => part.startsWith('.') || part.includes('\\'))) throw new Error('Not public');
    let file = await realpath(resolve(root, ...parts));
    if (!file.startsWith(root)) throw new Error('Outside root');
    // Resolve a directory index before applying the final public-path check.
    if ((await stat(file)).isDirectory()) file = await realpath(resolve(file, 'index.html'));
    if (!file.startsWith(root)) throw new Error('Outside root');
    const relative = file.slice(root.length).split(sep);
    if (!publicRoots.has(relative[0]) || relative.some(part => part.startsWith('.'))) throw new Error('Not public');
    const body = await readFile(file);
    response.writeHead(200, { 'Content-Type': `${mime[extname(file)] ?? 'text/plain'}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`🌱 Sprig is growing at http://127.0.0.1:${port}`));
