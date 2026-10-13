import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const root = resolve('dist');
const types = { '.html':'text/html', '.js':'application/javascript', '.mjs':'application/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.wasm':'application/wasm', '.json':'application/json', '.txt':'text/plain' };
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (!pathname.startsWith('/course/')) { response.writeHead(404); response.end('Not found'); return; }
    const file = resolve(root, pathname.slice('/course/'.length) || 'index.html');
    if (!file.startsWith(root + '/')) { response.writeHead(403); response.end(); return; }
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' }); response.end(content);
  } catch { response.writeHead(404); response.end('Not found'); }
}).listen(4174, '127.0.0.1', () => console.log('Production subdirectory preview: http://127.0.0.1:4174/course/'));
