/* Genera guías .docx de prueba en tests/salida para validarlas con python-docx */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = { window: {}, TextEncoder, console, Math, Date, JSON };
vm.createContext(ctx);
const lib = path.join(__dirname, '..', 'src', 'lib');
for (const f of fs.readdirSync(lib).filter((x) => x.endsWith('.js')).sort()) vm.runInContext(fs.readFileSync(path.join(lib, f), 'utf8'), ctx);
const EM = ctx.window.EM;
const out = path.join(__dirname, 'salida');
fs.mkdirSync(out, { recursive: true });
/* PNG mínimo de 1×1 para probar imágenes */
const png = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'));
for (const p of EM.PR.lista) for (const nivel of [0, 1, 2, 3]) {
  const o = { nivel, institucion: 'I. E. de prueba', docente: 'Docente de prueba', png: { data: png, w: 400, h: 300 } };
  fs.writeFileSync(path.join(out, `${p.id}-n${nivel}.docx`), EM.docx(EM.GUIA.bloques(p, o), EM.GUIA.meta(p, o)));
}
console.log('docx generados:', EM.PR.lista.length * 4);
