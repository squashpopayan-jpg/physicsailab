/* Mide un circuito de capítulo sin navegador:
   node tests/measure.js <sim> <tmax> <dt> <etiqueta1,etiqueta2,...> [ajustes "R1.r=100,C1.c=1e-3"] [--ac f0,f1,n,etiqueta] [--op]
   Imprime pico, mínimo, media y valor eficaz del último tercio de la simulación para cada etiqueta (o pin «R1.1»). */
global.window = global;
global.document = { createElement: () => ({ style: {}, classList: { add() {}, toggle() {} }, append() {}, addEventListener() {}, setAttribute() {} }), documentElement: {}, addEventListener() {}, hidden: false };
global.EM = { si: (x, u) => (typeof x === 'number' ? x.toPrecision(3) : String(x)) + ' ' + (u || ''), fix: (x, n = 2) => (+x).toFixed(n), sci: (x) => String(x), sims: {}, defineSim(n, f) { EM.sims[n] = f; }, el: () => ({}), col: () => '#000', onTheme: [], isDark: () => false, supHTML: (x) => x, Panels: { TDIVS: [1e-6, 1e-3] } };
const fs = require('fs'), path = require('path');
const core = path.join(__dirname, '../src/core');
for (const f of ['30-spice', '31-spice-ac', '32-models', '33-parts', '34-net', '38-cx']) require(path.join(core, f + '.js'));
const captured = {};
EM.Taller = { mount(sim, cfg) { captured[sim.__name] = cfg; const o = { cfg: {}, sim, net: null }; return new Proxy(o, { get: (t, k) => (k in t ? t[k] : () => {}) }); } };
const chDir = path.join(__dirname, '../src/chapters');
for (const f of fs.readdirSync(chDir).filter((f) => f.endsWith('.js')).sort()) { try { new Function(fs.readFileSync(path.join(chDir, f), 'utf8'))(); } catch (e) { /* ignora */ } }
const pos = process.argv.slice(2).filter((a, i, arr) => !a.startsWith('--') && !(i > 0 && arr[i - 1] === '--ac'));
const [name, tmaxS, dtS, labS, setS] = pos;
const sim = { __name: name };
const sp = new Proxy(sim, { get: (o, k) => (k in o ? o[k] : (...a) => sp) });
EM.sims[name](sp);
const cfg = captured[name];
if (!cfg) { console.log('No es una simulación del Taller'); process.exit(1); }
const net = new EM.Net(Object.assign({ damage: false }, cfg.net || {}));
net.load(cfg.doc || EM.Net.fromSpec(cfg.spec));
const T = { set: (id, k, v) => { net.part(id).p[k] = v; }, v: () => 0, net, setTdiv() {} };
for (const kv of (setS || '').split(',').filter(Boolean)) { const [a, b] = kv.split('='); const [id, k] = a.split('.'); net.part(id).p[k] = isNaN(+b) ? b : +b; }
net.rebuild(); net.cir.solveDC();
if (process.argv.includes('--op')) { for (const k in net.netInfo.labelNet) console.log(k, net.v(net.netInfo.labelNet[k]).toFixed(5)); for (const P of net.doc.parts) { const r = net.rt[P.id]; if (r && r.ref && r.ref.main) console.log(P.id, 'I=', net.iPart(P).toExponential(3)); } process.exit(0); }
const ai = process.argv.indexOf('--ac');
if (ai >= 0) { const [f0, f1, n, lab] = process.argv[ai + 1].split(','); const r = net.cir.acSweep(+f0, +f1, +n, net.netInfo.labelNet[lab] || lab); const mx = Math.max(...r.mag), i = r.mag.indexOf(mx); console.log('pico', mx.toFixed(2), 'dB a', r.f[i].toFixed(1), 'Hz'); r.f.forEach((f, k) => { if (k % Math.ceil(r.f.length / 12) === 0) console.log(f.toFixed(1), r.mag[k].toFixed(2), r.ph[k].toFixed(1)); }); process.exit(0); }
const tmax = +tmaxS, dt = +dtS, labs = labS.split(',');
const nodeOf = (l) => net.netInfo.labelNet[l] !== undefined ? net.netInfo.labelNet[l] : (() => { const [id, pin] = l.split('.'); const P = net.part(id); const i = /^\d+$/.test(pin) ? +pin : EM.parts.CAT[P.t].pn.indexOf(pin); return net.netInfo.pinNet[id][i]; })();
const nodes = labs.map((l) => (l.includes('~') ? l.split('~').map(nodeOf) : nodeOf(l)));
if (cfg.startZero || process.argv.includes('--zero')) { for (const e of net.cir.els) { if (e.type === 'C' || e.type === 'L') { e.vprev = 0; e.iprev = 0; } } net.cir.x.fill(0); net.cir.restart = true; }
const n = Math.round(tmax / dt), data = labs.map(() => []);
const watch = (process.env.WATCH || '').split(',').filter(Boolean); const wd = watch.map(() => []);
for (let k = 0; k < n; k++) { if (!net.step(dt)) { console.log('FALLO de convergencia en t=', net.cir.t); break; } nodes.forEach((nd, j) => data[j].push(Array.isArray(nd) ? net.v(nd[0]) - net.v(nd[1]) : net.v(nd))); watch.forEach((id, j) => wd[j].push(net.iPart(net.part(id)))); }
labs.forEach((l, j) => { const a = data[j].slice(Math.floor(data[j].length * 2 / 3)); const mx = Math.max(...a), mn = Math.min(...a), mean = a.reduce((s, x) => s + x, 0) / a.length, rms = Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length); console.log(l.padEnd(8), 'max', mx.toFixed(4), 'min', mn.toFixed(4), 'pp', (mx - mn).toFixed(4), 'media', mean.toFixed(4), 'rms', rms.toFixed(4)); });
watch.forEach((id, j) => { const a = wd[j].slice(Math.floor(wd[j].length * 2 / 3)); console.log('I(' + id + ')', 'max', Math.max(...a).toExponential(3), 'min', Math.min(...a).toExponential(3), 'media', (a.reduce((s, x) => s + x, 0) / a.length).toExponential(3)); });
