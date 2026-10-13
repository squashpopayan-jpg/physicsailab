/* Genera el DXF de la casa ejemplo en Node (sin DOM) para revisarlo con otros lectores.
   Uso: node tests/dxf-node.js salida.dxf */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const raiz = path.join(__dirname, '..', 'src');
const ctx = { console, Math, JSON, Object, Array, Set, Map, Number, String, isFinite, Infinity, NaN, TextEncoder, Uint8Array, Uint32Array, DataView, ArrayBuffer, Date };
ctx.globalThis = ctx; ctx.window = ctx;
vm.createContext(ctx);
for (const f of fs.readdirSync(path.join(raiz, 'lib')).filter((x) => x.endsWith('.js')).sort()) vm.runInContext(fs.readFileSync(path.join(raiz, 'lib', f), 'utf8'), ctx, { filename: f });
for (const f of ['50-simbolos.js', '87-dxf.js']) vm.runInContext(fs.readFileSync(path.join(raiz, 'core', f), 'utf8'), ctx, { filename: f });
const RT = ctx.RT;
const D = RT.dibujoCasa(RT.L.CASA);
const txt = RT.dxf(D), bytes = RT.dxfBytes(D);
const out = process.argv[2] || 'casa-ejemplo.dxf';
fs.writeFileSync(out, Buffer.from(bytes));
const zip = RT.zip([{ name: 'LEAME.txt', data: 'prueba ñandú' }, { name: 'A01/casa.dxf', data: bytes }]);
fs.writeFileSync(out.replace(/\.dxf$/, '.zip'), Buffer.from(zip));
const porCapa = {};
D.ents.forEach((e) => { porCapa[e.l] = (porCapa[e.l] || 0) + 1; });
console.log('entidades', D.ents.length, 'bloques', Object.keys(D.bloques).length, 'bytes', txt.length);
console.log(porCapa);
