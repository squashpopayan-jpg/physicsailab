/* Compila Quantum Leap English en un único HTML.
   dist/index.html                 → documento completo para abrir localmente (doble clic o node serve.js)
   dist/quantum-leap-english.html  → fragmento para publicar como Artifact
   Uso: node build.js */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = __dirname;
const src = path.join(root, 'src');
const read = (p) => fs.readFileSync(p, 'utf8');

const TITLE = 'Quantum Leap English';
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
  + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=JetBrains+Mono:wght@400;600&display=swap">';

const css = read(path.join(src, 'styles.css'));
const shell = read(path.join(src, 'shell.html'));
const contentDir = path.join(src, 'content');
const contentFiles = fs.readdirSync(contentDir).filter((f) => f.endsWith('.js')).sort();
const content = contentFiles.map((f) => `/* ==== content/${f} ==== */\n` + read(path.join(contentDir, f)));
const app = read(path.join(src, 'app.js'));
const js = content.join('\n') + '\n/* ==== app.js ==== */\n' + app;

/* ---------- Comprobaciones estáticas del contenido ---------- */
let problems = 0;
const warn = (...a) => { console.warn('  !', ...a); problems++; };
try { new vm.Script(js, { filename: 'bundle.js' }); } catch (e) { console.error('Error de sintaxis en el JS:', e.message); process.exit(1); }
if (/<\/script/i.test(js)) { console.error('El JS contiene </script>'); process.exit(1); }

const sandbox = { window: {} };
vm.createContext(sandbox);
for (const c of content) vm.runInContext(c, sandbox);
const LEVELS = sandbox.window.QLE_LEVELS || [];
const X = sandbox.window.QLE_EXTRA || {};
const urls = new Set();
if (LEVELS.map((l) => l.id).join() !== 'a1,a2,b1,b2,c1') warn('Orden de niveles inesperado:', LEVELS.map((l) => l.id).join());
let nUnits = 0, nEx = 0, nCards = 0;
for (const L of LEVELS) {
  if (L.units.length !== 6) warn(`${L.id}: ${L.units.length} unidades (se esperaban 6)`);
  (L.links || []).forEach((l) => urls.add(l[1]));
  L.units.forEach((u, i) => {
    const id = `${L.id}-${i + 1}`;
    nUnits++;
    for (const k of ['title', 'en', 'goal', 'focus', 'grammar', 'sound', 'vocab', 'phrases', 'ex', 'dialogue', 'mission', 'links']) if (!u[k]) warn(`${id}: falta «${k}»`);
    if (u.vocab.length < 10) warn(`${id}: solo ${u.vocab.length} palabras de vocabulario`);
    if (u.phrases.length < 8) warn(`${id}: solo ${u.phrases.length} frases`);
    nCards += u.vocab.length + u.phrases.length;
    u.vocab.forEach((v, j) => { if (v.length < 2 || !v[0] || !v[1]) warn(`${id}: vocabulario #${j} incompleto`); });
    u.ex.forEach((q, j) => {
      nEx++;
      const where = `${id} ejercicio #${j + 1}`;
      if (q[0] === 'mc') { if (!Array.isArray(q[2]) || typeof q[3] !== 'number' || q[3] < 0 || q[3] >= q[2].length) warn(`${where}: opción correcta fuera de rango`); }
      else if (q[0] === 'gap') { if (!Array.isArray(q[2]) || !q[2].length) warn(`${where}: sin respuestas`); if (!/___/.test(q[1])) warn(`${where}: el enunciado no tiene ___`); }
      else if (q[0] === 'order') { if (typeof q[1] !== 'string' || q[1].split('|').length < 3) warn(`${where}: muy pocas fichas`); }
      else if (q[0] === 'tr') { if (!Array.isArray(q[2]) || !q[2].length) warn(`${where}: sin traducciones aceptadas`); }
      else warn(`${where}: tipo desconocido ${q[0]}`);
    });
    if (u.ex.length < 10) warn(`${id}: solo ${u.ex.length} ejercicios`);
    if (!u.dialogue.lines || u.dialogue.lines.length < 8) warn(`${id}: diálogo corto`);
    u.dialogue.lines.forEach((l, j) => { if (l.length !== 3) warn(`${id}: línea de diálogo #${j + 1} mal formada`); });
    const m = u.mission;
    for (const k of ['who', 'role', 'scene', 'goals', 'start', 'guided']) if (!m[k]) warn(`${id}: misión sin «${k}»`);
    if (m.guided && m.guided.length < 3) warn(`${id}: misión guiada corta`);
    if (!u.sound.w || !u.sound.w.length) warn(`${id}: sonido sin palabras`);
    u.links.forEach((l) => { urls.add(l[1]); if (!/^https:\/\//.test(l[1])) warn(`${id}: enlace no https ${l[1]}`); });
    const g = u.grammar;
    const cnt = (re) => (g.match(re) || []).length;
    for (const [n, o, c] of [['div', /<div[\s>]/g, /<\/div>/g], ['table', /<table[\s>]/g, /<\/table>/g], ['p', /<p[\s>]/g, /<\/p>/g], ['ul/ol', /<(ul|ol)[\s>]/g, /<\/(ul|ol)>/g], ['li', /<li[\s>]/g, /<\/li>/g], ['em', /<em>/g, /<\/em>/g], ['tr', /<tr>/g, /<\/tr>/g]]) {
      if (cnt(o) !== cnt(c)) warn(`${id}: <${n}> ${cnt(o)} ≠ </${n}> ${cnt(c)}`);
    }
  });
}
(X.library || []).forEach((s) => s.items.forEach((l) => urls.add(l[1])));
if ((X.placement || []).length !== 25) warn('La prueba de nivel no tiene 25 preguntas');
(X.placement || []).forEach((q, j) => { if (q[3] < 0 || q[3] >= q[2].length) warn(`Prueba #${j + 1}: opción fuera de rango`); });
/* ---------- Salida ---------- */
const fragment = `<title>${TITLE}</title>\n${FONTS}\n<style>\n${css}\n</style>\n${shell}\n<script>\n${js}\n</script>\n`;
const full = `<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<title>${TITLE}</title>\n${FONTS}\n<style>\n:root{color-scheme:light}html,body{margin:0}[hidden]{display:none!important}img{max-width:100%}\n${css}\n</style>\n</head>\n<body>\n${shell}\n<script>\n${js}\n</script>\n</body>\n</html>\n`;
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', 'quantum-leap-english.html'), fragment);
fs.writeFileSync(path.join(root, 'dist', 'index.html'), full);
fs.writeFileSync(path.join(root, 'dist', 'urls.txt'), [...urls].sort().join('\n') + '\n'); // para verificar enlaces con curl
console.log(`${LEVELS.length} niveles · ${nUnits} unidades · ${nEx} ejercicios · ${nCards} tarjetas · ${urls.size} enlaces únicos`);
console.log(`dist/quantum-leap-english.html ${(fragment.length / 1024).toFixed(0)} KB`);
console.log(problems ? `${problems} advertencias` : 'Sin advertencias');
