const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.join(__dirname, 'web');
const MATERIAL_DIR = path.join(__dirname, 'material');
const STATS_FILE = path.join(__dirname, 'stats.json');

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.mp3': 'audio/mpeg',
    '.m4a': 'audio/mp4',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.aac': 'audio/aac',
    '.mpeg': 'audio/mpeg'
};

function getStats() {
    try {
        if (fs.existsSync(STATS_FILE)) {
            return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
        }
    } catch (e) {}
    return { visits: 342, lastUpdated: new Date().toISOString() };
}

function incrementVisits() {
    const stats = getStats();
    stats.visits = (stats.visits || 0) + 1;
    stats.lastUpdated = new Date().toISOString();
    try {
        fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf8');
    } catch (e) {}
    return stats;
}

function incrementDownloads() {
    const stats = getStats();
    stats.downloads = (stats.downloads || 0) + 1;
    stats.lastUpdated = new Date().toISOString();
    try {
        fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2), 'utf8');
    } catch (e) {}
    return stats;
}

function normalizeStr(s) {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9.]/g, '');
}

// Resuelve archivos incluso con discrepancias de tildes o mayusculas en Windows
function resolveFile(baseDir, relativePath) {
    const parts = relativePath.split(/[/\\]/).filter(Boolean);
    let currentDir = baseDir;

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const directPath = path.join(currentDir, part);

        if (fs.existsSync(directPath)) {
            currentDir = directPath;
            continue;
        }

        // Busqueda insensible a tildes y caracteres especiales
        if (fs.existsSync(currentDir) && fs.statSync(currentDir).isDirectory()) {
            const entries = fs.readdirSync(currentDir);
            const targetNorm = normalizeStr(part);
            const found = entries.find(e => normalizeStr(e) === targetNorm);
            if (found) {
                currentDir = path.join(currentDir, found);
                continue;
            }
        }
        return null;
    }
    return currentDir;
}

const server = http.createServer((req, res) => {
    const decodedUrl = decodeURIComponent(req.url.split('?')[0]);

    // API de Contador de Visitas
    if (decodedUrl === '/api/visit') {
        const updated = incrementVisits();
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(updated));
    }

    // API de Contador de Descargas
    if (decodedUrl === '/api/download') {
        const updated = incrementDownloads();
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(updated));
    }

    if (decodedUrl === '/api/stats') {
        const current = getStats();
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        return res.end(JSON.stringify(current));
    }

    let baseDir;
    let subPath;

    if (decodedUrl.startsWith('/material/')) {
        baseDir = MATERIAL_DIR;
        subPath = decodedUrl.replace('/material/', '');
    } else {
        baseDir = ROOT_DIR;
        subPath = decodedUrl === '/' ? 'index.html' : decodedUrl.replace(/^\//, '');
    }

    const filePath = resolveFile(baseDir, subPath);

    if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('Archivo no encontrado: ' + decodedUrl);
    }

    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Soporte para streaming de audio / video con Range requests
    const range = req.headers.range;
    if (range && (contentType.startsWith('audio/') || contentType.startsWith('video/'))) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${stats.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': contentType
        });
        file.pipe(res);
    } else {
        res.writeHead(200, {
            'Content-Length': stats.size,
            'Content-Type': contentType,
            'Cache-Control': 'no-cache'
        });
        fs.createReadStream(filePath).pipe(res);
    }
});

server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(`  🌐 Portal de Fisica Interactiva iniciado con exito!`);
    console.log(`  🔗 Abre en tu navegador: http://localhost:${PORT}`);
    console.log(`======================================================\n`);
});
