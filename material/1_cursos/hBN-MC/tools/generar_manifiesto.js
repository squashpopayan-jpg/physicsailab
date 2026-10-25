#!/usr/bin/env node
/* Genera los anexos de trazabilidad del paquete:
 *   SHA256SUMS.txt              huella SHA-256 de cada archivo distribuido
 *                               y huella agregada del código ejecutable
 *   docs/INVENTARIO_FUNCIONES.csv  funciones de nivel superior por módulo,
 *                               con línea y primera frase de su documentación
 * Uso: node tools/generar_manifiesto.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const version = JSON.parse(fs.readFileSync(path.join(ROOT, 'VERSION.json'), 'utf8')).version;
const SKIP = new Set(['.git', 'node_modules', 'SHA256SUMS.txt']);

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name) || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

const files = walk(ROOT).map(rel).sort();
const lines = files.map((f) => `${sha(fs.readFileSync(path.join(ROOT, f)))}  ${f}`);

// Huella agregada del código ejecutable (lo que se registra como obra).
const runtime = files.filter((f) => f === 'index.html' || f.startsWith('src/') || f.startsWith('assets/'));
const agg = crypto.createHash('sha256');
for (const f of runtime) agg.update(f + '\0').update(fs.readFileSync(path.join(ROOT, f)));
const aggregate = agg.digest('hex');

fs.writeFileSync(path.join(ROOT, 'SHA256SUMS.txt'), [
  `# hBN-MC v${version} — SHA-256 de los archivos del paquete`,
  `# Huella agregada del código ejecutable (index.html + assets/ + src/, ${runtime.length} archivos): ${aggregate}`,
  ...lines,
  '',
].join('\n'));

// Inventario de funciones de nivel superior.
const rows = ['modulo,funcion,linea,descripcion'];
let nFun = 0;
for (const f of files.filter((x) => x.startsWith('src/') && x.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8').split(/\r?\n/);
  src.forEach((line, i) => {
    const m = /^(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(/.exec(line);
    if (!m) return;
    // Primera frase del bloque JSDoc inmediatamente anterior.
    let desc = '';
    for (let k = i - 1; k >= 0 && k >= i - 40; k--) {
      const t = src[k].trim();
      if (t.startsWith('/**')) {
        for (let q = k; q < i; q++) {
          const s = src[q].trim().replace(/^\/\*\*|\*\/$|^\*/g, '').trim();
          if (s && !s.startsWith('@') && !s.startsWith('[REGISTRO')) { desc = s; break; }
        }
        break;
      }
      if (t && !t.startsWith('*') && !t.startsWith('//') && !t.startsWith('/*')) break;
    }
    rows.push([f, m[1], i + 1, `"${desc.replace(/"/g, "'")}"`].join(','));
    nFun++;
  });
}
fs.writeFileSync(path.join(ROOT, 'docs', 'INVENTARIO_FUNCIONES.csv'), rows.join('\n') + '\n');

console.log(JSON.stringify({ version, archivos: files.length, runtime: runtime.length, huellaAgregada: aggregate, funciones: nFun }, null, 2));
