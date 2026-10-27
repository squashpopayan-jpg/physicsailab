/* Compila la aplicación en un único HTML.
   dist/index.html → documento completo para abrir localmente
   dist/historia.html → fragmento para publicar como Artifact */
const fs = require('fs');
const path = require('path');
const root = __dirname;
const src = path.join(root, 'src');
const read = (p) => fs.readFileSync(p, 'utf8');

const css = read(path.join(src, 'styles.css'));
const coreDir = path.join(src, 'core');
const core = fs.readdirSync(coreDir).filter((f) => f.endsWith('.js')).sort()
  .filter((f) => !f.startsWith('90-'))
  .map((f) => `/* ==== core/${f} ==== */\n` + read(path.join(coreDir, f)));
const appJs = read(path.join(coreDir, '90-app.js'));
const chDir = path.join(src, 'chapters');
const chFiles = fs.readdirSync(chDir).sort();

/* ---------- Datos históricos (src/data/*.json) ---------- */
const H = { people: [], events: [], formulas: [], myths: [] };
const dataDir = path.join(src, 'data');
if (fs.existsSync(dataDir)) {
  for (const f of fs.readdirSync(dataDir).filter((f) => f.endsWith('.json')).sort()) {
    /* Convención: los JSON se escriben con una sola barra invertida en el TeX; aquí se duplica antes de analizarlos */
    const d = JSON.parse(read(path.join(dataDir, f)).split('\\').join('\\\\'));
    for (const k of Object.keys(H)) if (d[k]) H[k].push(...d[k]);
  }
}
const dataJs = '/* ==== data ==== */\nwindow.EM = window.EM || {};\nEM.hist = ' + JSON.stringify(H) + ';';

/* ---------- Informe de validación ---------- */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const fmtN = (x) => (typeof x !== 'number' ? String(x) : x === 0 ? '0' : Math.abs(x) >= 1e5 || Math.abs(x) < 1e-3 ? x.toExponential(4) : (+x.toPrecision(6)).toString());
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const fmtTol = (t) => t.replace(/([0-9.e+-]+)$/, (m) => {
  const v = +m;
  if (!isFinite(v) || v === 0 || v >= 0.01) return m;
  const e = Math.floor(Math.log10(v) + 1e-9), c = +(v / Math.pow(10, e)).toPrecision(3), ex = String(e).replace(/./g, (ch) => SUP[ch]);
  return (c === 1 ? '' : c + '×') + '10' + ex;
});
let valHTML = '<p>Sin resultados: ejecute <code>node tests/validar.js</code>.</p>';
try {
  const R = JSON.parse(read(path.join(root, 'tests', 'resultados.json')));
  const grp = (g) => R.rows.filter((r) => r.group === g);
  const tbl = (rows) => '<div class="tablewrap"><table><tr><th>Comprobación</th><th class="c">Obtenido</th><th class="c">Referencia</th><th class="c">Tolerancia</th><th class="c">Estado</th></tr>' +
    rows.map((r) => `<tr><td>${esc(r.name)}</td><td class="c">${fmtN(r.got)}</td><td class="c">${fmtN(r.exp)}</td><td class="c" style="white-space:nowrap">${esc(fmtTol(r.tol))}</td><td class="c">${r.pass ? '✓' : '✗'}</td></tr>`).join('') + '</table></div>';
  const GR = [['SciPy', 'Contra SciPy, NumPy, SymPy y las constantes CODATA'], ['Histórico', 'Reconstrucciones contra los datos y resultados publicados por los propios autores'], ['Numérico', 'Soluciones numéricas contra soluciones exactas'], ['Datos', 'Coherencia interna de los datos históricos (vidas, fechas, enlaces entre capítulos)']];
  valHTML = `<p><b>${R.ok} de ${R.ok + R.bad} pruebas superadas</b> (ejecución del ${R.fecha}).</p>` + GR.filter(([g]) => grp(g).length).map(([g, t]) => `<h3>${t} (${grp(g).length})</h3>` + tbl(grp(g))).join('');
} catch (e) { console.warn('Sin resultados de validación'); }

/* ---------- Apéndices generados desde los datos ---------- */
const yr = (y, ap) => (ap ? 'c. ' : '') + (y < 0 ? Math.abs(y) + ' a. C.' : String(y));
const chTitle = {};
for (const f of chFiles.filter((f) => f.endsWith('.html'))) {
  const m = read(path.join(chDir, f)).match(/data-id="([^"]+)" data-num="([^"]+)" data-title="([^"]+)"/);
  if (m) chTitle[m[1]] = { num: m[2], title: m[3] };
}
const chLink = (id) => (chTitle[id] ? `<a href="#${id}">${chTitle[id].num}</a>` : '—');
let perHTML = '', forHTML = '', mitHTML = '';
{
  const ppl = H.people.slice().sort((a, b) => a.b - b.b);
  perHTML = `<p class="ctrl-note">${ppl.length} personajes ordenados por nacimiento. «c.» indica fecha aproximada. La última columna enlaza al capítulo donde se cuenta su historia.</p>` +
    '<div class="tablewrap"><table class="hist"><tr><th>Nombre</th><th>Vida</th><th>Lugares</th><th>Campo</th><th class="c">Cap.</th></tr>' +
    ppl.map((p) => `<tr><td>${esc(p.n)}</td><td style="white-space:nowrap">${yr(p.b, p.ba)}–${p.d === null || p.d === undefined ? '' : yr(p.d, p.da)}</td><td>${esc(p.pl || '')}</td><td>${esc(p.f || '')}</td><td class="c">${chLink(p.ch)}</td></tr>`).join('') + '</table></div>';
  const fm = H.formulas.slice().sort((a, b) => a.y - b.y);
  forHTML = `<p class="ctrl-note">${fm.length} fórmulas ordenadas por año de publicación o formulación.</p>` +
    fm.map((f) => `<div class="eq key" data-name="${esc(f.n)}">\\[${f.tex}\\]</div><p><b>${yr(f.y, f.ya)}</b> · ${esc(f.who)}. ${f.pre ? esc(f.pre) + ' ' : ''}<small>(Capítulo ${chLink(f.ch)})</small></p>`).join('\n');
  const TAG = { falso: 'Falso', dudoso: 'Dudoso', cierto: 'Cierto', matiz: 'Con matices' };
  mitHTML = `<p class="ctrl-note">${H.myths.length} afirmaciones famosas, con veredicto de los historiadores.</p>` +
    '<div class="tablewrap"><table class="hist"><tr><th>Afirmación</th><th class="c">Veredicto</th><th>Qué dicen los documentos</th><th class="c">Cap.</th></tr>' +
    H.myths.map((m) => `<tr><td>${esc(m.c)}</td><td class="c"><span class="mito-tag ${m.v}">${TAG[m.v]}</span></td><td>${esc(m.n)}</td><td class="c">${chLink(m.ch)}</td></tr>`).join('') + '</table></div>';
}

const templates = chFiles.filter((f) => f.endsWith('.html')).map((f) => `<!-- ${f} -->\n` + read(path.join(chDir, f))
  .replace('<!--VALIDACION-->', () => valHTML).replace('<!--PERSONAS-->', () => perHTML).replace('<!--FORMULAS-->', () => forHTML).replace('<!--MITOS-->', () => mitHTML));
const chJs = chFiles.filter((f) => f.endsWith('.js')).map((f) => `/* ==== chapters/${f} ==== */\n` + read(path.join(chDir, f)));

/* ---------- Comprobaciones ---------- */
let problems = 0;
const defined = new Set();
for (const js of chJs.concat(core)) for (const m of js.matchAll(/EM\.defineSim\(\s*'([^']+)'/g)) {
  if (defined.has(m[1])) { console.warn('Simulación duplicada:', m[1]); problems++; }
  defined.add(m[1]);
}
const used = new Set();
for (const f of chFiles.filter((f) => f.endsWith('.html'))) {
  const t = read(path.join(chDir, f));
  for (const m of t.matchAll(/data-sim="([^"]+)"/g)) {
    if (!defined.has(m[1])) { console.warn(`[${f}] simulación sin definir: ${m[1]}`); problems++; }
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
  /* enlaces internos a capítulos que no existen */
  for (const m of t.matchAll(/href="#([a-z0-9]+)(?:\.\d+)?"/g)) if (chFiles.length && !chTitle[m[1]] && m[1] !== 'inicio') { console.warn(`[${f}] enlace a capítulo inexistente: ${m[1]}`); problems++; }
}
for (const d of defined) if (!used.has(d) && d !== 'home-hero') console.warn('Simulación definida pero no usada:', d);

const js = dataJs + '\n' + core.join('\n') + '\n' + chJs.join('\n') + '\n/* ==== core/90-app.js ==== */\n' + appJs;
if (/<\/script/i.test(js)) { console.error('El JS contiene </script>'); process.exit(1); }

const shell = read(path.join(src, 'shell.html'));
const page = shell
  .replace('/*CSS*/', () => css)
  .replace('<!--TEMPLATES-->', () => templates.join('\n'))
  .replace('/*JS*/', () => js);
const [headPart, bodyPart] = page.split('<!--BODY-->');
const fragment = headPart + bodyPart;
const full = '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
  headPart + '</head>\n<body>\n' + bodyPart + '</body>\n</html>\n';
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'index.html'), full);
fs.writeFileSync(path.join(root, 'dist', 'historia.html'), fragment);
fs.writeFileSync(path.join(root, 'dist', 'Como-llegamos-a-saber.html'), full);
console.log(`OK · ${chFiles.filter((f) => f.endsWith('.html')).length} plantillas · ${defined.size} simulaciones · ${H.people.length} personajes · ${H.events.length} eventos · ${H.formulas.length} fórmulas · ${H.myths.length} mitos · ${(full.length / 1024).toFixed(0)} KB` + (problems ? ` · ${problems} advertencias` : ''));
