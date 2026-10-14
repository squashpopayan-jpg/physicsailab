/* Compila el curso «Recablear» en un único HTML.
   dist/index.html      → documento completo para abrir localmente
   dist/recablear.html  → fragmento para publicar como Artifact
   Orden del JS: núcleo de interfaz (src/core, sin 90-app) → núcleo de cálculo
   (src/lib, sin DOM, probado en Node con tests/validar.js) → capítulos → 90-app.
   Los marcadores <div class="py" data-py="NOMBRE"></div> se sustituyen por el
   código de py/NOMBRE.py resaltado y su salida real py/out/NOMBRE.txt
   (generada por python tests/correr_py.py). */
const fs = require('fs');
const path = require('path');
const root = __dirname;
const src = path.join(root, 'src');
const read = (p) => fs.readFileSync(p, 'utf8');
const jsIn = (dir) => fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort();

const css = read(path.join(src, 'styles.css'));
const coreDir = path.join(src, 'core');
const core = jsIn(coreDir).filter((f) => !f.startsWith('90-')).map((f) => `/* ==== core/${f} ==== */\n` + read(path.join(coreDir, f)));
const libDir = path.join(src, 'lib');
const lib = jsIn(libDir).map((f) => `/* ==== lib/${f} ==== */\n` + read(path.join(libDir, f)));
const appJs = read(path.join(coreDir, '90-app.js'));
const chDir = path.join(src, 'chapters');
const chFiles = fs.readdirSync(chDir).sort();
let problems = 0;

/* ---------- Resaltado de Python ---------- */
const KW = new Set('False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield'.split(' '));
const BUILTIN = new Set('print len range enumerate zip sorted list dict set tuple int float str abs min max sum round isinstance type super open map filter any all'.split(' '));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function highlight(code) {
  let out = '', i = 0;
  const n = code.length;
  while (i < n) {
    const c = code[i];
    if (c === '#') { const j = code.indexOf('\n', i); const e = j < 0 ? n : j; out += `<span class="sx-com">${esc(code.slice(i, e))}</span>`; i = e; continue; }
    const pre = code.slice(i, i + 2).match(/^[fFrRbB](?=['"])/) ? code[i] : '';
    const q0 = code[i + pre.length];
    if (q0 === '"' || q0 === "'") {
      const triple = code.slice(i + pre.length, i + pre.length + 3) === q0.repeat(3);
      const qq = triple ? q0.repeat(3) : q0;
      let j = i + pre.length + qq.length;
      while (j < n && code.slice(j, j + qq.length) !== qq) { if (code[j] === '\\') j++; if (!triple && code[j] === '\n') break; j++; }
      j = Math.min(n, j + qq.length);
      out += `<span class="sx-str">${esc(code.slice(i, j))}</span>`; i = j; continue;
    }
    if (/[0-9]/.test(c) && !/[A-Za-z_0-9]/.test(code[i - 1] || '')) {
      const m = code.slice(i).match(/^(0x[0-9a-fA-F]+|\d[\d_]*\.?\d*(e[-+]?\d+)?j?)/);
      out += `<span class="sx-num">${esc(m[0])}</span>`; i += m[0].length; continue;
    }
    if (c === '@' && (i === 0 || code[i - 1] === '\n')) { const j = code.indexOf('\n', i); const e = j < 0 ? n : j; out += `<span class="sx-dec">${esc(code.slice(i, e))}</span>`; i = e; continue; }
    if (/[A-Za-z_]/.test(c)) {
      const m = code.slice(i).match(/^[A-Za-z_][A-Za-z_0-9]*/)[0];
      const next = code.slice(i + m.length).match(/^\s*\(/);
      if (KW.has(m)) out += `<span class="sx-kw">${m}</span>`;
      else if (next) out += `<span class="sx-fn">${m}</span>`;
      else out += m;
      i += m.length; continue;
    }
    out += esc(c); i++;
  }
  return out;
}
const pyDir = path.join(root, 'py');
const pyUsed = new Set();
function pyBlock(name, f) {
  const file = path.join(pyDir, name + '.py');
  if (!fs.existsSync(file)) { console.warn(`[${f}] falta py/${name}.py`); problems++; return `<div class="sim-error">Falta el código ${name}.py</div>`; }
  pyUsed.add(name);
  const code = read(file).replace(/\r\n/g, '\n').replace(/\s+$/, '');
  const outFile = path.join(pyDir, 'out', name + '.txt');
  let outHtml = '';
  if (fs.existsSync(outFile)) {
    const o = read(outFile).replace(/\r\n/g, '\n').replace(/\s+$/, '');
    if (fs.statSync(outFile).mtimeMs < fs.statSync(file).mtimeMs) { console.warn(`[${f}] salida desactualizada de ${name}.py (ejecute python tests/correr_py.py)`); problems++; }
    if (o) outHtml = `<div class="out"><pre>${esc(o)}</pre></div>`;
  } else { console.warn(`[${f}] falta la salida de ${name}.py`); problems++; }
  return `<div class="pycode" data-file="${name}.py"><div class="pycode-head"><b>${name}.py</b><span class="sp"></span><button type="button" class="copy">Copiar código</button></div><pre><code>${highlight(code)}</code></pre>${outHtml}</div>`;
}

/* ---------- Capítulos y comprobaciones ---------- */
const chJs = chFiles.filter((f) => f.endsWith('.js')).map((f) => `/* ==== chapters/${f} ==== */\n` + read(path.join(chDir, f)));
const defined = new Set();
for (const js of chJs) for (const m of js.matchAll(/RC\.defineSim\(\s*'([^']+)'/g)) {
  if (defined.has(m[1])) { console.warn('Simulación duplicada:', m[1]); problems++; }
  defined.add(m[1]);
}
const used = new Set(), ids = new Set(), links = [];
const templates = [];
const BOXES = new Set(['def', 'law', 'ex', 'warn', 'note', 'hist', 'explain', 'read', 'when', 'err', 'links', 'valid', 'keys', 'evid', 'myth', 'do', 'teach', 'co', 'py', 'safe', 'verdict']);
let words = 0;
for (const f of chFiles.filter((x) => x.endsWith('.html'))) {
  let t = read(path.join(chDir, f));
  const idm = t.match(/data-id="([^"]+)"/);
  if (idm) { if (ids.has(idm[1])) { console.warn(`[${f}] id de capítulo repetido: ${idm[1]}`); problems++; } ids.add(idm[1]); }
  for (const m of t.matchAll(/data-sim="([^"]+)"/g)) {
    if (!defined.has(m[1])) { console.warn(`[${f}] simulación sin definir: ${m[1]}`); problems++; }
    used.add(m[1]);
  }
  for (const m of t.matchAll(/class="box ([a-z]+)/g)) if (!BOXES.has(m[1])) { console.warn(`[${f}] recuadro desconocido: ${m[1]}`); problems++; }
  for (const m of t.matchAll(/class="nivel ([a-z0-9]+)/g)) if (!/^n[0-5]$/.test(m[1])) { console.warn(`[${f}] nivel de evidencia desconocido: ${m[1]}`); problems++; }
  for (const m of t.matchAll(/<a href="(https?:[^"]+)">([^<]*)<\/a>/g)) links.push({ f, url: m[1], text: m[2] });
  const cnt = (re) => (t.match(re) || []).length;
  const BS = String.fromCharCode(92);
  const count = (s) => t.split(BS + s).length - 1;
  const a = count('('), b = count(')'), c = count('['), d = count(']');
  if (a !== b) { console.warn(`[${f}] inline abre ${a} ≠ cierra ${b}`); problems++; }
  if (c !== d) { console.warn(`[${f}] display abre ${c} ≠ cierra ${d}`); problems++; }
  for (const mm of t.matchAll(/\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g)) if (/<[A-Za-z!\/]/.test(mm[1] || mm[2] || '')) { console.warn(`[${f}] «<» seguido de letra dentro de una fórmula (use \\lt): ${(mm[1] || mm[2]).slice(0, 60)}`); problems++; }
  const pairs = [[/<section[\s>]/g, /<\/section>/g, 'section'], [/<div[\s>]/g, /<\/div>/g, 'div'], [/<details[\s>]/g, /<\/details>/g, 'details'],
    [/<table[\s>]/g, /<\/table>/g, 'table'], [/<(ul|ol)[\s>]/g, /<\/(ul|ol)>/g, 'listas'], [/<p[\s>]/g, /<\/p>/g, 'p'], [/<summary[\s>]/g, /<\/summary>/g, 'summary'],
    [/<tr[\s>]/g, /<\/tr>/g, 'tr'], [/<figure[\s>]/g, /<\/figure>/g, 'figure'], [/<b[\s>]/g, /<\/b>/g, 'b'], [/<li[\s>]/g, /<\/li>/g, 'li'], [/<span[\s>]/g, /<\/span>/g, 'span']];
  for (const [o, cl, name] of pairs) {
    const n1 = cnt(o), n2 = cnt(cl);
    if (n1 !== n2) { console.warn(`[${f}] <${name}> ${n1} ≠ </${name}> ${n2}`); problems++; }
  }
  words += t.replace(/<[^>]+>/g, ' ').replace(/\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/g, ' ').split(/\s+/).filter((w) => /[a-záéíóúñ]/i.test(w)).length;
  /* Espacio sin separación entre una cifra y el signo de porcentaje en el texto */
  t = t.replace(/(\d) %/g, '$1&nbsp;%');
  t = t.replace(/<div class="py" data-py="([^"]+)"><\/div>/g, (_, name) => pyBlock(name, f));
  templates.push(`<!-- ${f} -->\n` + t);
}
for (const d of defined) if (!used.has(d) && d !== 'home-hero') console.warn('Simulación definida pero no usada:', d);
if (fs.existsSync(pyDir)) for (const f of fs.readdirSync(pyDir).filter((x) => x.endsWith('.py'))) if (!pyUsed.has(f.replace(/\.py$/, ''))) console.warn('Código Python sin usar:', f);
fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
fs.writeFileSync(path.join(root, 'docs', 'enlaces.json'), JSON.stringify(links, null, 1));

const js = core.join('\n') + '\n' + lib.join('\n') + '\n' + chJs.join('\n') + '\n/* ==== core/90-app.js ==== */\n' + appJs;
if (/<\/script/i.test(js)) { console.error('El JS contiene </script>'); process.exit(1); }
try { new (require('vm').Script)(js, { filename: 'bundle.js' }); } catch (e) { console.error('Error de sintaxis en el JS compilado:', e.message, '\n', (e.stack || '').split('\n').slice(0, 3).join('\n')); process.exit(1); }

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
fs.writeFileSync(path.join(root, 'dist', 'recablear.html'), fragment);
console.log(`OK · ${chFiles.filter((f) => f.endsWith('.html')).length} plantillas · ${defined.size} simulaciones · ${pyUsed.size} programas Python · ${links.length} enlaces · ~${Math.round(words / 1000)} mil palabras · ${(full.length / 1024).toFixed(0)} KB` + (problems ? ` · ${problems} advertencias` : ''));
