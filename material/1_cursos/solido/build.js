/* Compila la aplicación en un único HTML.
   dist/index.html     → documento completo para abrir localmente
   dist/solido.html → fragmento para publicar como Artifact */
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
/* Informe de validación desde tests/resultados.json */
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const fmtN = (x) => (typeof x !== 'number' ? String(x) : x === 0 ? '0' : Math.abs(x) >= 1e5 || Math.abs(x) < 1e-3 ? x.toExponential(4) : (+x.toPrecision(6)).toString());
/* tolerancia 'rel 0.000001' → 'rel 10⁻⁶' o 'rel 3×10⁻⁶' */
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
  const GR = [['SciPy', 'Contra SciPy, NumPy y mpmath'], ['ASE', 'Contra ASE, spglib y scipy.spatial'], ['pymatgen', 'Contra pymatgen (difracción de rayos X y sumas de Ewald)'], ['Numérico', 'Soluciones numéricas contra soluciones exactas'], ['Literatura', 'Contra datos experimentales y valores de la literatura']];
  valHTML = `<p><b>${R.ok} de ${R.ok + R.bad} pruebas superadas</b> (ejecución del ${R.fecha}).</p>` + GR.filter(([g]) => grp(g).length).map(([g, t]) => `<h3>${t} (${grp(g).length})</h3>` + tbl(grp(g))).join('');
} catch (e) { console.warn('Sin resultados de validación'); }
/* Tablas de datos (apéndice B) generadas desde src/core/29-data.js */
let datHTML = '';
try {
  const SSn = require(path.join(src, 'core', '31-ss2.js'));
  const DT = require(path.join(src, 'core', '29-data.js'));
  const f = (x, n = 3) => (x === null || x === undefined ? '—' : typeof x === 'number' ? (Math.abs(x) >= 1e5 || (Math.abs(x) < 1e-2 && x !== 0) ? x.toExponential(2).replace('e+', '×10^').replace('e-', '×10^-') : (+x.toPrecision(n)).toString()) : String(x));
  const sup = (t) => String(t).replace(/×10\^(-?\d+)/g, (m, e) => '×10<sup>' + e.replace('-', '−') + '</sup>');
  const row = (cells) => '<tr>' + cells.map((c, i) => (i ? `<td class="c">${sup(c)}</td>` : `<td>${c}</td>`)).join('') + '</tr>';
  const tbl = (head, rows, note) => `<div class="tablewrap"><table><tr>${head.map((h, i) => (i ? `<th class="c">${h}</th>` : `<th>${h}</th>`)).join('')}</tr>${rows.map(row).join('')}</table></div>` + (note ? `<p class="ctrl-note">${note}</p>` : '');
  const cr = Object.entries(DT.crystals).map(([k, d]) => [k, SSn.STRUCT_NAMES[d.s] || d.s, f(d.a, 4), d.c ? f(d.c, 4) : '—', f(SSn.density(k), 4), DT.debye[k] || '—', DT.cohesive[k] || '—']);
  datHTML += '<section>\n<h2>Cristales</h2>\n' + tbl(['Cristal', 'Estructura', 'a (Å)', 'c (Å)', 'Densidad calculada (g/cm³)', 'θ_D (K)', 'Cohesión (eV/átomo)'], cr, 'Constantes de red de Kittel (cap. 1) y Ashcroft–Mermin (tablas 4.3–4.7); temperaturas de Debye de Kittel, tabla 5.1; energías de cohesión de Kittel, tabla 3.1. La densidad se calcula con la constante de red.') + '\n</section>\n';
  const fe = Object.entries(DT.freeElectron).map(([k, v]) => { const g = SSn.fermiGas(v[1] * 1e28); return [k, v[0], v[1], f(g.rsa0), f(g.EFeV), f(g.TF / 1e4), f(g.vF / 1e6), DT.resistivity[k] || '—', DT.gamma[k] ? DT.gamma[k][0] : '—']; });
  datHTML += '<section>\n<h2>Electrones libres en metales</h2>\n' + tbl(['Metal', 'Valencia', 'n (10²² cm⁻³)', 'rₛ/a₀', 'E_F (eV)', 'T_F (10⁴ K)', 'v_F (10⁸ cm/s)', 'ρ a 273 K (µΩ·cm)', 'γ medido (mJ mol⁻¹ K⁻²)'], fe, 'Densidades de Ashcroft–Mermin (tabla 1.1); los parámetros de Fermi se calculan con ellas (y se comparan en el apéndice C con los de la tabla 2.1). Resistividades de Ashcroft–Mermin, tabla 1.2; γ de Kittel, tabla 6.3.') + '\n</section>\n';
  const se = Object.entries(DT.semi).map(([k, d]) => [k, f(d.Eg, 4) + (d.ind ? ' (i)' : ' (d)'), `${d.v[0]}, ${d.v[1]}, ${d.v[2]}`, f(d.Nc), f(d.Nv), f(SSn.ni(k, 300)), d.eps, d.mun, d.mup, d.me, d.mh, d.chi]);
  datHTML += '<section>\n<h2>Semiconductores a 300 K</h2>\n' + tbl(['Material', 'E_g (eV)', 'Varshni E_g(0), α, β', 'N_c (cm⁻³)', 'N_v (cm⁻³)', 'n_i calculada (cm⁻³)', 'ε_r', 'µ_n', 'µ_p (cm²/V·s)', 'm_e*/m', 'm_h*/m', 'χ (eV)'], se, 'Sze y Ng (2007); para el Si, N_c y N_v de Green (1990). (i) brecha indirecta, (d) directa. Las masas son de densidad de estados.') + '\n</section>\n';
  const fm = Object.entries(DT.ferro).map(([k, v]) => [k, v[0], v[1], v[2]]);
  const sc = Object.entries(DT.super).map(([k, v]) => [k, v[0], v[1], DT.gapRatio[k] || '—', DT.lengths[k] ? DT.lengths[k][0] : '—', DT.lengths[k] ? DT.lengths[k][1] : '—']);
  datHTML += '<section>\n<h2>Magnetismo y superconductividad</h2>\n' + tbl(['Ferromagneto', 'M_s a 0 K (G)', 'n_B (µ_B)', 'T_C (K)'], fm, 'Kittel, tabla 12.1.') + tbl(['Superconductor', 'T_c (K)', 'B_c(0) (mT)', '2Δ/k_BT_c', 'ξ₀ (nm)', 'λ_L (nm)'], sc, 'Kittel, tablas 10.1, 10.3 y 10.5.') + '\n</section>\n';
} catch (e) { console.warn('Sin tablas de datos', e.message); }
const templates = chFiles.filter((f) => f.endsWith('.html')).map((f) => `<!-- ${f} -->\n` + read(path.join(chDir, f)).replace('<!--VALIDACION-->', () => valHTML).replace('<!--DATOS-->', () => datHTML));
const chJs = chFiles.filter((f) => f.endsWith('.js')).map((f) => `/* ==== chapters/${f} ==== */\n` + read(path.join(chDir, f)));

/* Comprobaciones */
let problems = 0;
const defined = new Set();
for (const js of chJs) for (const m of js.matchAll(/EM\.defineSim\(\s*'([^']+)'/g)) {
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
  const a = count('('), b = count(')'), c = count('['), d = count(']');
  if (a !== b) { console.warn(`[${f}] inline abre ${a} ≠ cierra ${b}`); problems++; }
  if (c !== d) { console.warn(`[${f}] display abre ${c} ≠ cierra ${d}`); problems++; }
  const o1 = cnt(/<section[\s>]/g), o2 = cnt(/<\/section>/g);
  if (o1 !== o2) { console.warn(`[${f}] <section> ${o1} ≠ </section> ${o2}`); problems++; }
  const dv1 = cnt(/<div[\s>]/g), dv2 = cnt(/<\/div>/g);
  if (dv1 !== dv2) { console.warn(`[${f}] <div> ${dv1} ≠ </div> ${dv2}`); problems++; }
  const dt1 = cnt(/<details[\s>]/g), dt2 = cnt(/<\/details>/g);
  if (dt1 !== dt2) { console.warn(`[${f}] <details> ${dt1} ≠ </details> ${dt2}`); problems++; }
  const t1 = cnt(/<table[\s>]/g), t2 = cnt(/<\/table>/g);
  if (t1 !== t2) { console.warn(`[${f}] <table> ${t1} ≠ </table> ${t2}`); problems++; }
  const u1 = cnt(/<(ul|ol)[\s>]/g), u2 = cnt(/<\/(ul|ol)>/g);
  if (u1 !== u2) { console.warn(`[${f}] listas abiertas ${u1} ≠ cerradas ${u2}`); problems++; }
  const p1 = cnt(/<p[\s>]/g), p2 = cnt(/<\/p>/g);
  if (p1 !== p2) { console.warn(`[${f}] <p> ${p1} ≠ </p> ${p2}`); problems++; }
}
for (const d of defined) if (!used.has(d) && d !== 'home-hero') console.warn('Simulación definida pero no usada:', d);

const js = core.join('\n') + '\n' + chJs.join('\n') + '\n/* ==== core/90-app.js ==== */\n' + appJs;
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
fs.writeFileSync(path.join(root, 'dist', 'solido.html'), fragment);
fs.writeFileSync(path.join(root, 'dist', 'Estado-Solido.html'), full);
console.log(`OK · ${chFiles.filter((f) => f.endsWith('.html')).length} plantillas · ${defined.size} simulaciones · ${(full.length / 1024).toFixed(0)} KB` + (problems ? ` · ${problems} advertencias` : ''));
