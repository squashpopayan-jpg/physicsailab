/* Compila la aplicación en un único HTML.
   dist/index.html → documento completo para abrir localmente
   dist/resultados.html → fragmento para publicar como Artifact */
const fs = require('fs');
const path = require('path');
const root = __dirname;
const src = path.join(root, 'src');
const read = (p) => fs.readFileSync(p, 'utf8');

const css = read(path.join(src, 'styles.css')) + '\n' + read(path.join(src, 'styles-herr.css'));
const coreDir = path.join(src, 'core');
const core = fs.readdirSync(coreDir).filter((f) => f.endsWith('.js')).sort()
  .filter((f) => !f.startsWith('90-'))
  .map((f) => `/* ==== core/${f} ==== */\n` + read(path.join(coreDir, f)));
const appJs = read(path.join(coreDir, '90-app.js'));
const chDir = path.join(src, 'chapters');
const chFiles = fs.readdirSync(chDir).sort();

/* ---------- Informe de validación ---------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const fmtN = (x) => (typeof x !== 'number' ? String(x) : x === 0 ? '0' : Math.abs(x) >= 1e5 || Math.abs(x) < 1e-3 ? x.toExponential(4) : (+x.toPrecision(6)).toString());
let valHTML = '<p>Sin resultados: ejecute <code>node tests/validar.js</code>.</p>';
try {
  const R = JSON.parse(read(path.join(root, 'tests', 'resultados.json')));
  const grp = (g) => R.rows.filter((r) => r.group === g);
  const tbl = (rows) => '<div class="tablewrap"><table><tr><th>Comprobación</th><th class="c">Obtenido</th><th class="c">Referencia</th><th class="c">Tolerancia</th><th class="c">Estado</th></tr>' +
    rows.map((r) => `<tr><td>${esc(r.name)}</td><td class="c">${fmtN(r.got)}</td><td class="c">${fmtN(r.exp)}</td><td class="c" style="white-space:nowrap">${esc(r.tol)}</td><td class="c">${r.pass ? '✓' : '✗'}</td></tr>`).join('') + '</table></div>';
  const GR = [['SciPy', 'Contra SciPy, NumPy y scikit-learn'], ['Lógica', 'Reglas de las herramientas (analizador, matriz, ciclo, fechas, créditos)'], ['Normas', 'Coherencia de las citas normativas con el texto oficial'], ['Programa', 'Cifras citadas de los documentos del programa (créditos, horas, resultados, microcurrículos, actas)']];
  valHTML = `<p><b>${R.ok} de ${R.ok + R.bad} pruebas superadas</b> (ejecución del ${R.fecha}).</p>` + GR.filter(([g]) => grp(g).length).map(([g, t]) => `<h3>${t} (${grp(g).length})</h3>` + tbl(grp(g))).join('');
} catch (e) { console.warn('Sin resultados de validación'); }

const chTitle = {};
for (const f of chFiles.filter((f) => f.endsWith('.html'))) {
  const m = read(path.join(chDir, f)).match(/data-id="([^"]+)" data-num="([^"]+)" data-title="([^"]+)"/);
  if (m) chTitle[m[1]] = { num: m[2], title: m[3] };
}

const templates = chFiles.filter((f) => f.endsWith('.html')).map((f) => `<!-- ${f} -->\n` + read(path.join(chDir, f)).replace('<!--VALIDACION-->', () => valHTML));
const chJs = chFiles.filter((f) => f.endsWith('.js')).map((f) => `/* ==== chapters/${f} ==== */\n` + read(path.join(chDir, f)));

/* ---------- Comprobaciones ---------- */
let problems = 0;
const defined = new Set();
for (const js of chJs.concat(core)) for (const m of js.matchAll(/EM\.defineSim\(\s*'([^']+)'/g)) {
  if (defined.has(m[1])) { console.warn('Herramienta duplicada:', m[1]); problems++; }
  defined.add(m[1]);
}
const used = new Set();
for (const f of chFiles.filter((f) => f.endsWith('.html'))) {
  const t = read(path.join(chDir, f));
  for (const m of t.matchAll(/data-sim="([^"]+)"/g)) {
    if (!defined.has(m[1])) { console.warn(`[${f}] herramienta sin definir: ${m[1]}`); problems++; }
    used.add(m[1]);
  }
  const cnt = (re) => (t.match(re) || []).length;
  const BS = String.fromCharCode(92);
  const count = (s) => t.split(BS + s).length - 1;
  if (count('(') !== count(')')) { console.warn(`[${f}] inline abre ${count('(')} ≠ cierra ${count(')')}`); problems++; }
  if (count('[') !== count(']')) { console.warn(`[${f}] display abre ${count('[')} ≠ cierra ${count(']')}`); problems++; }
  for (const [nm, a, b] of [['section', /<section[\s>]/g, /<\/section>/g], ['div', /<div[\s>]/g, /<\/div>/g], ['details', /<details[\s>]/g, /<\/details>/g], ['table', /<table[\s>]/g, /<\/table>/g], ['lista', /<(ul|ol)[\s>]/g, /<\/(ul|ol)>/g], ['p', /<p[\s>]/g, /<\/p>/g], ['blockquote', /<blockquote[\s>]/g, /<\/blockquote>/g]]) {
    if (cnt(a) !== cnt(b)) { console.warn(`[${f}] <${nm}> ${cnt(a)} ≠ ${cnt(b)}`); problems++; }
  }
  for (const m of t.matchAll(/href="#([a-z0-9-]+)(?:\.\d+)?"/g)) if (chFiles.length && !chTitle[m[1]] && m[1] !== 'inicio') { console.warn(`[${f}] enlace a capítulo inexistente: ${m[1]}`); problems++; }
}
for (const d of defined) if (!used.has(d)) console.warn('Herramienta definida pero no usada:', d);

const js = core.join('\n') + '\n' + chJs.join('\n') + '\n/* ==== core/90-app.js ==== */\n' + appJs;
if (/<\/script/i.test(js)) { console.error('El JS contiene </script>'); process.exit(1); }

const shell = read(path.join(src, 'shell.html'));
const page = shell
  .replace('/*CSS*/', () => css)
  .replace('<!--TEMPLATES-->', () => templates.join('\n'))
  .replace('/*JS*/', () => js);
const guardScripts = `
<script src="/material/course-guard.js"></script>
<script>if(typeof window.PhysicsAILabGuard==='undefined'){var s=document.createElement('script');s.src='../../../course-guard.js';document.head.appendChild(s);}</script>
`;

const [headPart, bodyPart] = page.split('<!--BODY-->');
const fragment = headPart + bodyPart;
const full = '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
  headPart + '</head>\n<body>\n' + bodyPart + guardScripts + '</body>\n</html>\n';
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'index.html'), full);
fs.writeFileSync(path.join(root, 'dist', 'resultados.html'), fragment);
fs.writeFileSync(path.join(root, 'dist', 'Resultados-de-aprendizaje-Ingenieria-Fisica.html'), full);
console.log(`Compilado: ${templates.length} capítulos, ${defined.size} herramientas, ${(full.length / 1024).toFixed(0)} KB` + (problems ? `, ${problems} problemas` : ''));
if (problems) process.exitCode = 1;
