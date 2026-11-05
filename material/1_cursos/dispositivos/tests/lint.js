/* Revisa los circuitos de los capítulos sin navegador: node tests/lint.js [filtro]
   - carga el motor y los .js de capítulos con un «sim» falso
   - para cada Taller.mount con spec: construye redes, avisa de pines sueltos y resuelve el punto de operación */
global.window = global;
global.document = { createElement: () => ({ style: {}, classList: { add() {}, toggle() {} }, append() {}, addEventListener() {}, setAttribute() {} }), documentElement: {}, addEventListener() {}, hidden: false };
global.EM = { si: (x, u) => (typeof x === 'number' ? x.toPrecision(3) : String(x)) + ' ' + (u || ''), fix: (x, n = 2) => (+x).toFixed(n), sci: (x) => String(x), sims: {}, defineSim(n, f) { EM.sims[n] = f; }, el: () => ({}), col: () => '#000', onTheme: [], isDark: () => false, supHTML: (x) => x };
const fs = require('fs'), path = require('path');
const core = path.join(__dirname, '../src/core');
for (const f of ['30-spice', '31-spice-ac', '32-models', '33-parts', '34-net', '38-cx']) require(path.join(core, f + '.js'));
const filt = process.argv[2];
const captured = [];
EM.Taller = { mount(sim, cfg) { captured.push({ name: sim.__name, cfg }); return new Proxy({ cfg: {} }, { get: (t, k) => (k in t ? t[k] : () => {}) }); } };
const proxy = (name) => { const t = function () { return p; }; const p = new Proxy(t, { get: (o, k) => (k === '__name' ? name : k === 'then' ? undefined : p), apply: () => p }); p.__name = name; return p; };
const chDir = path.join(__dirname, '../src/chapters');
for (const f of fs.readdirSync(chDir).filter((f) => f.endsWith('.js')).sort()) {
  if (filt && !f.includes(filt)) continue;
  try { new Function(fs.readFileSync(path.join(chDir, f), 'utf8'))(); } catch (e) { console.log('ERROR al cargar', f, e.message); }
}
let bad = 0, n = 0;
for (const name of Object.keys(EM.sims)) {
  const sim = { __name: name };
  const sp = new Proxy(sim, { get: (o, k) => (k in o ? o[k] : (...a) => sp), });
  try { EM.sims[name](sp); } catch (e) { /* sims que no son del Taller */ }
}
const IGN = { OA: [3, 4], T555: [], SCOPE: [], DMM: [], PSU: [], FG: [], MAINS: [], BR: [], REG: [] };
for (const c of captured) {
  const cfg = c.cfg; if (!cfg.spec && !cfg.doc) continue;
  n++;
  try {
    const net = new EM.Net(cfg.net || {});
    net.load(cfg.doc || EM.Net.fromSpec(cfg.spec));
    if (cfg.controls) for (const k of cfg.controls) { if (k.value !== undefined && k.init !== false) { try { k.apply({ net, set: (id, kk, v) => { const P = net.part(id); if (P) P.p[kk] = v; else throw new Error('no existe ' + id); }, v: () => 0 }, k.value, net.doc); } catch (e) { console.log('  control', k.id, 'falla:', e.message); } } }
    net.rebuild();
    const info = net.netInfo, probs = [];
    for (const P of net.doc.parts) {
      const cat = EM.parts.CAT[P.t];
      if (cat.ground || P.t === 'LBL') continue;
      info.pinNet[P.id].forEach((nn, i) => { if ((info.members.get(nn) || 0) < 2 && !(IGN[P.t] || []).includes(i) && !/^(SCOPE|DMM|PROBE)$/.test(P.t)) probs.push(`${P.id}.${cat.pn[i]} suelto`); });
    }
    const ok = net.cir.solveDC();
    if (!ok) probs.push('DC sin convergencia');
    if (!info.hasGround) probs.push('SIN TIERRA');
    /* nombres de pines referidos por probes/etiquetas */
    for (const pr of cfg.probes || []) { if (!(info.labelNet[pr.at] !== undefined) && !/\./.test(pr.at) && pr.at !== 'gnd') probs.push('probe sin etiqueta: ' + pr.at); }
    const flag = probs.length ? 'AVISO' : 'ok   ';
    if (probs.length) bad++;
    console.log(flag, c.name, '·', net.doc.parts.length, 'piezas,', net.doc.wires.length, 'cables', probs.length ? '· ' + probs.join('; ') : '');
    if (process.env.V) { for (const k in info.labelNet) console.log('      ', k, '=', net.v(info.labelNet[k]).toFixed(4)); }
  } catch (e) { bad++; console.log('FALLA', c.name, e.stack.split('\n').slice(0, 3).join(' | ')); }
}
console.log(`${n} circuitos, ${bad} con avisos`);
