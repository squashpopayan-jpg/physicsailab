/* Servidor local ultraligero sin dependencias externas
   Uso: node serve.js [puerto] */
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || parseInt(process.argv[2], 10) || 3000;
const root = path.join(__dirname, 'dist');

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let file = req.url.split('?')[0];
  if (file === '/' || file === '') file = '/index.html';
  const fp = path.join(root, file);

  if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return;
  }

  const ext = path.extname(fp);
  res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
});

server.listen(port, () => {
  console.log(`Manu_Squash Arbitraje disponible en http://localhost:${port}`);
});
