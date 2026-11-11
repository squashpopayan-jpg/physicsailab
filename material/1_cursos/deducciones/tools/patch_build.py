import re
s = open('build.js', encoding='utf-8').read()
old = [l for l in s.split('\n') if l.startswith('const templates')][0]
new = r"""let VR = { rows: [] };
try { VR = JSON.parse(read(path.join(root, 'tests', 'resultados.json'))); } catch (e) { /* sin resultados */ }
const nByDeriv = {};
for (const r of VR.rows) if (r.deriv && r.pass) nByDeriv[r.deriv] = (nByDeriv[r.deriv] || 0) + 1;
const expand = require('./tools/expand.js');
const templates = chFiles.filter((f) => f.endsWith('.html')).map((f) => `<!-- ${f} -->\n` + expand(read(path.join(chDir, f)).replace('<!--VALIDACION-->', () => valHTML), nByDeriv));"""
s = s.replace(old, new)
chk = r"""  for (const [a1, a2] of [['<deriv[\s>]', '</deriv>'], ['<step[\s>]', '</step>'], ['<given>', '</given>'], ['<vars>', '</vars>'], ['<effects>', '</effects>'], ['<limits>', '</limits>'], ['<result[\s>]', '</result>']]) {
    const x1 = cnt(new RegExp(a1, 'g')), x2 = cnt(new RegExp(a2, 'g'));
    if (x1 !== x2) { console.warn(`[${f}] ${a1} ${x1} ≠ ${a2} ${x2}`); problems++; }
  }
"""
s = s.replace("  const p1 = cnt(/<p[\s>]/g)", chk + "  const p1 = cnt(/<p[\s>]/g)")
open('build.js','w',encoding='utf-8').write(s)
