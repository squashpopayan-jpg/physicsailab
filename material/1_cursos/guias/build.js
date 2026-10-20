/* Compila el cuaderno en un único HTML.
   dist/index.html            → documento completo para abrir localmente
   dist/Guias-y-Montajes.html → copia para compartir
   dist/guias-montajes.html   → fragmento para publicar como Artifact */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = __dirname;
const src = path.join(root, 'src');
const read = (p) => fs.readFileSync(p, 'utf8');
const sortedJs = (dir) => fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort();

/* ---------- Librería pura: se evalúa en Node para la ficha estática ---------- */
const libDir = path.join(src, 'lib');
const libFiles = sortedJs(libDir);
const sandbox = { window: {}, TextEncoder, console, Math, Date, JSON };
vm.createContext(sandbox);
for (const f of libFiles) vm.runInContext(read(path.join(libDir, f)), sandbox, { filename: 'lib/' + f });
const EMN = sandbox.window.EM;
const lib = libFiles.map((f) => `/* ==== lib/${f} ==== */\n` + read(path.join(libDir, f)));

const css = read(path.join(src, 'styles.css'));
const coreDir = path.join(src, 'core');
const core = sortedJs(coreDir).filter((f) => !f.startsWith('90-')).map((f) => `/* ==== core/${f} ==== */\n` + read(path.join(coreDir, f)));
const appJs = read(path.join(coreDir, '90-app.js'));
const chDir = path.join(src, 'chapters');
const chFiles = fs.readdirSync(chDir).sort();

/* ---------- Informe de validación ---------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const fmtN = (x) => (typeof x !== 'number' ? String(x) : x === 0 ? '0' : Math.abs(x) >= 1e5 || Math.abs(x) < 1e-3 ? x.toExponential(4) : (+x.toPrecision(6)).toString()).replace('.', ',');
let valHTML = '<p>Sin resultados: ejecute <code>node tests/validar.js</code>.</p>';
try {
  const R = JSON.parse(read(path.join(root, 'tests', 'resultados.json')));
  const grupos = [...new Set(R.rows.map((r) => r.group))];
  const tbl = (rows) => '<div class="tablewrap"><table><tr><th>Comprobación</th><th class="c">Obtenido</th><th class="c">Referencia</th><th class="c">Tolerancia</th><th class="c">Estado</th></tr>' +
    rows.map((r) => `<tr><td>${esc(r.name)}</td><td class="c">${fmtN(r.got)}</td><td class="c">${fmtN(r.exp)}</td><td class="c">${esc(r.tol)}</td><td class="c">${r.pass ? '✓' : '✗'}</td></tr>`).join('') + '</table></div>';
  valHTML = `<p><b>${R.ok} de ${R.ok + R.bad} pruebas superadas</b> (ejecución del ${R.fecha}).</p>` + grupos.map((g) => `<h3>${esc(g)} (${R.rows.filter((r) => r.group === g).length})</h3>` + tbl(R.rows.filter((r) => r.group === g))).join('');
} catch (e) { console.warn('Sin resultados de validación'); }

/* ---------- Plantillas y marcadores de ficha ---------- */
let problems = 0;
const usadas = new Set();
const templates = chFiles.filter((f) => f.endsWith('.html')).map((f) => {
  let t = read(path.join(chDir, f));
  t = t.replace('<!--VALIDACION-->', () => valHTML);
  t = t.replace('<!--MAPA-->', () => EMN.FICHA.mapa());
  t = t.replace(/<!--F:([a-z0-9-]+):([a-z]+)-->/g, (m, id, parte) => {
    try { usadas.add(id); return EMN.FICHA.parte(id, parte); } catch (e) { console.warn(`[${f}] ${e.message}`); problems++; return ''; }
  });
  return `<!-- ${f} -->\n` + t;
});
for (const p of EMN.PR.lista) if (!usadas.has(p.id)) { console.warn('Práctica sin capítulo:', p.id); problems++; }
const chJs = chFiles.filter((f) => f.endsWith('.js')).map((f) => `/* ==== chapters/${f} ==== */\n` + read(path.join(chDir, f)));

/* Plantillas binarias (xlsx) en base64 */
const plDir = path.join(root, 'plantillas');
const plant = {};
if (fs.existsSync(plDir)) for (const f of fs.readdirSync(plDir)) if (/\.(xlsx|docx)$/.test(f)) plant[f] = fs.readFileSync(path.join(plDir, f)).toString('base64');
const plantJs = `/* ==== plantillas ==== */\nwindow.EM.PLANTILLAS = ${JSON.stringify(plant)};\n`;

/* ---------- Comprobaciones ---------- */
const defined = new Set();
for (const js of chJs) for (const m of js.matchAll(/EM\.defineSim\(\s*'([^']+)'/g)) {
  if (defined.has(m[1])) { console.warn('Simulación duplicada:', m[1]); problems++; }
  defined.add(m[1]);
}
const used = new Set();
templates.forEach((t, k) => {
  const f = chFiles.filter((x) => x.endsWith('.html'))[k];
  for (const m of t.matchAll(/data-sim="([^"]+)"/g)) {
    if (!defined.has(m[1])) { console.warn(`[${f}] simulación sin definir: ${m[1]}`); problems++; }
    used.add(m[1]);
  }
  const cnt = (re) => (t.match(re) || []).length;
  const BS = String.fromCharCode(92);
  const count = (s) => t.split(BS + s).length - 1;
  const pares = [['(', ')', 'inline'], ['[', ']', 'display']];
  for (const [a, b, n] of pares) if (count(a) !== count(b)) { console.warn(`[${f}] ${n} abre ${count(a)} ≠ cierra ${count(b)}`); problems++; }
  for (const [re1, re2, n] of [[/<section[\s>]/g, /<\/section>/g, 'section'], [/<div[\s>]/g, /<\/div>/g, 'div'], [/<details[\s>]/g, /<\/details>/g, 'details'], [/<table[\s>]/g, /<\/table>/g, 'table'], [/<(ul|ol)[\s>]/g, /<\/(ul|ol)>/g, 'listas'], [/<p[\s>]/g, /<\/p>/g, 'p']]) {
    const a = cnt(re1), b = cnt(re2);
    if (a !== b) { console.warn(`[${f}] <${n}> ${a} ≠ ${b}`); problems++; }
  }
  if (/<!--F:/.test(t)) { console.warn(`[${f}] marcador de ficha sin resolver`); problems++; }
});
for (const d of defined) if (!used.has(d) && d !== 'home-hero') console.warn('Simulación definida pero no usada:', d);

const js = lib.join('\n') + '\n' + core.join('\n') + '\n' + plantJs + chJs.join('\n') + '\n/* ==== core/90-app.js ==== */\n' + appJs;
if (/<\/script/i.test(js)) { console.error('El JS contiene </script>'); process.exit(1); }
if (js.includes(String.fromCharCode(65533))) { console.error('El JS contiene U+FFFD'); process.exit(1); }

const shell = read(path.join(src, 'shell.html'));
const page = shell.replace('/*CSS*/', () => css).replace('<!--TEMPLATES-->', () => templates.join('\n')).replace('/*JS*/', () => js);
if (page.includes(String.fromCharCode(65533))) { console.error('La página contiene U+FFFD'); process.exit(1); }
const [headPart, bodyPart] = page.split('<!--BODY-->');
const fragment = headPart + bodyPart;
const full = '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
  headPart + '</head>\n<body>\n' + bodyPart + '</body>\n</html>\n';
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'index.html'), full);
fs.writeFileSync(path.join(root, 'dist', 'guias-montajes.html'), fragment);
fs.writeFileSync(path.join(root, 'dist', 'Guias-y-Montajes.html'), full);
console.log(`OK · ${templates.length} plantillas · ${EMN.PR.lista.length} prácticas · ${defined.size} simulaciones · ${(full.length / 1024).toFixed(0)} KB` + (problems ? ` · ${problems} advertencias` : ''));
