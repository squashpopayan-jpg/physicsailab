/* Compila el curso en un único HTML.
   dist/index.html      → documento completo para abrir localmente
   dist/tejiendo-pec.html → fragmento para publicar como Artifact
   Orden del JS: banco de preguntas (src/data) → figuras → núcleo (app).
   Las imágenes de src/img se incrustan como data: URI donde la lección escribe src="img:nombre". */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = __dirname;
const src = path.join(root, 'src');
const read = (p) => fs.readFileSync(p, 'utf8');
let problems = 0;
const warn = (m) => { console.warn('⚠ ' + m); problems++; };

const avatar = 'data:image/jpeg;base64,' + fs.readFileSync(path.join(src, 'img', 'avatar.jpg')).toString('base64');
const css = read(path.join(src, 'styles.css')) + `
:root { --ave-img: url("${avatar}"); }
`;
const dataDir = path.join(src, 'data');
const dataJs = fs.readdirSync(dataDir).filter((f) => f.endsWith('.js')).sort().map((f) => `/* ==== data/${f} ==== */\n` + read(path.join(dataDir, f)));
const coreJs = ['figs.js', 'app.js'].map((f) => `/* ==== core/${f} ==== */\n` + read(path.join(src, 'core', f)));
const js = dataJs.join('\n') + '\n' + coreJs.join('\n');
if (/<\/script/i.test(js)) { console.error('El JS contiene </script>'); process.exit(1); }
try { new vm.Script(js, { filename: 'bundle.js' }); } catch (e) { console.error('Error de sintaxis en el JS:', e.message); process.exit(1); }

/* ---- Banco de preguntas: se evalúa aquí para validarlo ---- */
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(dataJs.join('\n'), sandbox);
const Q = sandbox.window.PEC && sandbox.window.PEC.Q;
if (!Q) { console.error('No se encontró PEC.Q'); process.exit(1); }

/* ---- Capítulos ---- */
const chDir = path.join(src, 'chapters');
const chFiles = fs.readdirSync(chDir).filter((f) => f.endsWith('.html')).sort();
const imgDir = path.join(src, 'img');
const imgCache = {};
const dataUri = (name) => {
  if (imgCache[name]) return imgCache[name];
  const f = path.join(imgDir, name + '.jpg');
  if (!fs.existsSync(f)) { warn('Imagen inexistente: ' + name); return ''; }
  return (imgCache[name] = 'data:image/jpeg;base64,' + fs.readFileSync(f).toString('base64'));
};
const BOXES = new Set(['idea', 'recordar', 'ojo', 'palabra', 'cita']);
const ids = new Set(), templates = [], usedChecks = new Set(), usedQuiz = new Set(), usedImgs = new Set();
const chapterIds = [];
for (const f of chFiles) {
  let t = read(path.join(chDir, f));
  const idm = t.match(/data-id="([^"]+)"/);
  if (!idm) { warn(`[${f}] sin data-id`); continue; }
  if (ids.has(idm[1])) warn(`[${f}] id de capítulo repetido: ${idm[1]}`);
  if (/^(settings|sidebar|customize|upgrade|downloads|comment-.*)$/.test(idm[1])) warn(`[${f}] id reservado: ${idm[1]}`);
  if (!/^[a-z0-9-]+$/.test(idm[1])) warn(`[${f}] id con caracteres no permitidos: ${idm[1]}`);
  ids.add(idm[1]); chapterIds.push(idm[1]);
  for (const m of t.matchAll(/class="box ([a-z]+)/g)) if (!BOXES.has(m[1])) warn(`[${f}] recuadro desconocido: ${m[1]}`);
  for (const m of t.matchAll(/data-check="([^"]+)"/g)) { usedChecks.add(m[1]); if (!Q.checks[m[1]]) warn(`[${f}] pausa sin pregunta: ${m[1]}`); }
  for (const m of t.matchAll(/data-quiz="([^"]+)"/g)) { usedQuiz.add(m[1]); if (!Q.quiz[m[1]]) warn(`[${f}] quiz sin banco: ${m[1]}`); }
  t = t.replace(/src="img:([a-z0-9_]+)"/g, (_, n) => { usedImgs.add(n); return `src="${dataUri(n)}"`; });
  const cnt = (re) => (t.match(re) || []).length;
  const pairs = [[/<section[\s>]/g, /<\/section>/g, 'section'], [/<div[\s>]/g, /<\/div>/g, 'div'], [/<table[\s>]/g, /<\/table>/g, 'table'], [/<(ul|ol)[\s>]/g, /<\/(ul|ol)>/g, 'listas'],
    [/<p[\s>]/g, /<\/p>/g, 'p'], [/<tr[\s>]/g, /<\/tr>/g, 'tr'], [/<figure[\s>]/g, /<\/figure>/g, 'figure'], [/<b[\s>]/g, /<\/b>/g, 'b'], [/<li[\s>]/g, /<\/li>/g, 'li'],
    [/<svg[\s>]/g, /<\/svg>/g, 'svg'], [/<h2[\s>]/g, /<\/h2>/g, 'h2'], [/<h3[\s>]/g, /<\/h3>/g, 'h3'], [/<a[\s>]/g, /<\/a>/g, 'a'], [/<span[\s>]/g, /<\/span>/g, 'span'], [/<dl[\s>]/g, /<\/dl>/g, 'dl'], [/<template[\s>]/g, /<\/template>/g, 'template']];
  for (const [o, c, n] of pairs) { const a = cnt(o), b = cnt(c); if (a !== b) warn(`[${f}] <${n}> ${a} ≠ </${n}> ${b}`); }
  templates.push(`<!-- ${f} -->\n` + t);
}
for (const id of Object.keys(Q.checks)) if (!usedChecks.has(id)) warn('Pausa de repaso definida y no usada: ' + id);
for (const id of Object.keys(Q.quiz)) if (!usedQuiz.has(id)) warn('Quiz definido y no usado: ' + id);

/* ---- Validación del banco ---- */
const all = [];
const chk = (q, where) => {
  if (!q.q || !q.ok || !Array.isArray(q.no) || q.no.length !== 3 || !q.e) { warn(`${where}: estructura incompleta (${(q.q || '').slice(0, 40)})`); return; }
  const opts = [q.ok, ...q.no];
  if (new Set(opts.map((o) => o.trim().toLowerCase())).size !== 4) warn(`${where}: opciones repetidas (${q.q.slice(0, 40)})`);
  if (opts.some((o) => /todas las anteriores|ninguna de las anteriores/i.test(o))) warn(`${where}: opción «todas/ninguna de las anteriores»`);
  if (q.r && !ids.has(q.r)) warn(`${where}: referencia a lección inexistente: ${q.r}`);
  all.push({ where, q });
};
for (const [k, v] of Object.entries(Q.checks)) chk(v, 'pausa ' + k);
for (const [k, list] of Object.entries(Q.quiz)) list.forEach((q, i) => chk(q, `quiz ${k} #${i + 1}`));
Q.exam.forEach((q, i) => chk(q, `examen #${i + 1}`));
const qtexts = all.map((a) => a.q.q);
const dups = qtexts.filter((t, i) => qtexts.indexOf(t) !== i); if (dups.length) warn('Enunciados repetidos: ' + dups.slice(0, 3).join(' | '));
/* Una respuesta correcta mucho más larga que las demás delata la respuesta: se avisa de las más desparejas */
let desparejas = 0; all.forEach((a) => { const m = a.q.no.reduce((s, x) => s + x.length, 0) / 3; if (a.q.ok.length / m > 1.7) { desparejas++; warn(`${a.where}: la respuesta correcta es mucho más larga que las otras (${(a.q.ok.length / m).toFixed(1)}×)`); } });

const shell = read(path.join(src, 'shell.html'));
const page = shell.replace('/*CSS*/', () => css).replace('<!--TEMPLATES-->', () => templates.join('\n')).replace('/*JS*/', () => js);
const guardScripts = `
<script src="/material/course-guard.js"></script>
<script>if(typeof window.PhysicsAILabGuard==='undefined'){var s=document.createElement('script');s.src='../../../course-guard.js';document.head.appendChild(s);}</script>
`;
const [headPart, bodyPart] = page.split('<!--BODY-->');
const fragment = headPart + bodyPart;
const full = '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' + headPart + '</head>\n<body>\n' + bodyPart + guardScripts + '</body>\n</html>\n';
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'index.html'), full);
fs.writeFileSync(path.join(root, 'dist', 'tejiendo-pec.html'), full);
const nQuiz = Object.values(Q.quiz).reduce((s, l) => s + l.length, 0);
console.log(`OK · ${chFiles.length} lecciones · ${Object.keys(Q.checks).length} pausas · ${nQuiz} preguntas de quiz (${Object.keys(Q.quiz).length} quizzes) · ${Q.exam.length} del examen · ${usedImgs.size} imágenes · ${(full.length / 1024).toFixed(0)} KB` + (problems ? ` · ${problems} advertencias` : ''));
