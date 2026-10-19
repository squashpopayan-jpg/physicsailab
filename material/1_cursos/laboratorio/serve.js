/* Servidor estático local sin caché para probar dist/  (node serve.js [puerto]) */
const http = require('http');
const fs = require('fs');
const path = require('path');
const port = +process.argv[2] || 8780;
const root = path.join(__dirname, 'dist');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(root, path.normalize(p).replace(/^([/\\])+/, ''));
  if (!file.startsWith(root)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('No encontrado'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Content-Length': buf.length, 'Cache-Control': 'no-store, max-age=0' });
    res.end(buf);
  });
}).listen(port, '127.0.0.1', () => console.log(`Sirviendo ${root} en http://127.0.0.1:${port}`));
