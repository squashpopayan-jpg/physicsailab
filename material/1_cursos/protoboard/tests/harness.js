/* Arnés de pruebas en Node: carga el motor y los capítulos, construye cada simulación del laboratorio
   sin navegador y ofrece un «lab» con la misma API que usan los capítulos. */
const fs = require('fs'), path = require('path');
global.window = global;
global.EM = { si: (x, u) => (x === 0 ? '0 ' : Number(x).toPrecision(3) + ' ') + (u || ''), spice: null };
['30-spice', '31-spice-ac', '32-models', '33-parts', '34-net', '35-labparts', '36-bb', '37-bench', '38-specs'].forEach((f) => require('../src/core/' + f + '.js'));
const EM = global.EM;
EM.si = (x, u = '', d = 3) => (x === 0 || Math.abs(x) < 1e-15 ? '0' : (Math.abs(x) >= 1e3 || Math.abs(x) < 1e-2 ? Number(x).toExponential(2) : Number(x).toPrecision(d))) + ' ' + u;

class FakeLab {
  constructor(cfg) {
    this.cfg = cfg;
    this.bench = new EM.Bench({ boards: cfg.boards || ['half'], instruments: cfg.instruments || ['psu', 'fg', 'dmm', 'scope'], tdiv: cfg.tdiv || 1e-3, thermalSpeed: cfg.thermal || 4, damage: cfg.damage !== false, tolErr: !!cfg.tolErr, par: !!cfg.par });
    if (cfg.spec) this.bench.loadSpec(cfg.spec);
    this.bench.noBudget = true;
    this.bench.zeroOnReset = !!cfg.startZero;
    this.bench.rebuild();
    if (cfg.startZero && this.bench.net.dyn) this.bench.zeroState();
    this.particles = { clear() {} };
    this.sim = { redraw() {} };
    this.inst = null;
    for (const k of cfg.controls || []) if (k.value !== undefined && k.init !== false) k.apply(this, k.value);
    this.bench.invalidate();
  }
  v(a, b) { return b === undefined ? this.bench.vRef(a) : this.bench.vBetween(a, b); }
  vp(id, i, j) { return this.bench.vPart(id, i, j); }
  i(id) { return this.bench.iPart(id); }
  part(id) { return this.bench.part(id); }
  T(id) { const r = this.bench.net.rt[id]; return r ? r.T : 25; }
  dead(id) { const p = this.bench.part(id); return !!(p && p.dead); }
  anyDead() { return this.bench.scene.parts.some((p) => p.dead); }
  set(id, k, v) { const p = this.bench.part(id) || this.bench.ip[id]; if (!p) return; p.p[k] = v; const c = EM.parts.CAT[p.t]; if (c.apply && k === 'kind') { const keep = p.p.kind; c.apply(p); p.p.kind = keep; } this.bench.invalidate(); }
  psu(ch, o) { Object.assign(this.bench.inst.ps[ch], o); this.bench.invalidate(); }
  fg(o) { Object.assign(this.bench.inst.fg, o); this.bench.invalidate(); }
  dmmSet(o) { Object.assign(this.bench.inst.dmm, o); this.bench.invalidate(); }
  dmm() { return this.bench.readDMM(); }
  wire(a, b, color, id) { return this.bench.addWire(a, b, color, id); }
  unwire(id) { this.bench.removeWire(id); }
  hasWire(id) { return !!this.bench.wire(id); }
  addPartAt(id, key, props, refs, opts) { const B = this.bench; if (B.part(id)) return; const P = EM.bb.newPart(key, id, props); B.putPart(P, refs, opts || {}); B.invalidate(); }
  removePart(id) { if (this.bench.part(id)) this.bench.removePart(id); }
  press(id, on) { const p = this.bench.part(id); if (p) { p.p.on = on; this.bench.net.invalidate(); } }
  stat(ch) { const r = this.bench.rings[ch]; return EM.sigStats(r.last(Math.min(r.count(), this.bench.N)), this.bench.dt); }
  fastForward(s) { this.bench.fastForward(s); }
  autoTdiv(f, periods = 3) { const T = [1e-6, 2e-6, 5e-6, 1e-5, 2e-5, 5e-5, 1e-4, 2e-4, 5e-4, 1e-3, 2e-3, 5e-3, 1e-2, 2e-2, 5e-2, 0.1, 0.2, 0.5, 1, 2, 5]; const want = periods / f / 10; let best = T[0]; for (const t of T) if (t <= want * 1.2) best = t; this.bench.setTdiv(best); return best; }
  run(sec, dt = 0.02) { for (let t = 0; t < sec; t += dt) this.bench.frame(dt); }
  load(spec) { this.bench.loadSpec(spec); this.bench.rebuild(); }
  reset() { this.bench.reset(); }
  goals() { return (this.cfg.goals || []).map((g) => { try { return !!g.test(this); } catch (e) { return 'ERR ' + e.message; } }); }
  outs() { const o = {}; for (const q of this.cfg.outs || []) { try { o[q.id] = q.fn(this); } catch (e) { o[q.id] = 'ERR ' + e.message; } } return o; }
}
EM.Lab = { mount: (sim, cfg) => { sim.cfgs.push(cfg); return null; }, all: [] };
EM.Inst = {};

/* Carga un archivo de capítulo y devuelve { id: cfg } */
function loadChapter(file) {
  const sims = {};
  const js = fs.readFileSync(path.resolve(__dirname, '../src/chapters/' + file), 'utf8');
  const defs = {};
  EM.defineSim = (name, fn) => { defs[name] = fn; };
  EM.sims = EM.sims || {};
  new Function('window', 'EM', js)(global, EM);
  for (const [name, fn] of Object.entries(defs)) {
    const sim = { cfgs: [], name, host: { dataset: {} } };
    try { fn(sim); } catch (e) { sim.err = e; }
    sims[name] = sim;
  }
  return sims;
}
function labOf(cfg) { return new FakeLab(cfg); }
module.exports = { EM, FakeLab, loadChapter, labOf };
