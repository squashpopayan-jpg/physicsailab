/* ===================================================================
   34-net.js — Del esquema al simulador (EM.Net)
   Documento = { parts:[{id,t,x,y,rot,flip,p}], wires:[{pts:[[x,y],...]}] }
   Calcula las redes eléctricas (unión–búsqueda), traduce cada componente a elementos de
   EM.spice, gestiona instrumentos, calentamiento y daños, y construye circuitos desde una
   especificación compacta (EM.Net.fromSpec). Sin DOM.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = root.EM, S = EM.spice, PT = EM.parts, CAT = PT.CAT, MOD = S.MOD;
  const key = (x, y) => x + ',' + y;

  /* PRNG determinista (mulberry32) para tolerancias */
  const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  class Net {
    constructor(cfg = {}) {
      this.cfg = Object.assign({ par: false, tolErr: false, Ta: 25, damage: true, thermalSpeed: 5, seed: 1 }, cfg);
      this.doc = { parts: [], wires: [] };
      this.rt = {};
      this.cir = null;
      this.dirty = true;
      this.alerts = [];
      this.version = 0;
    }

    /* ---------- documento ---------- */
    load(doc) {
      this.doc = JSON.parse(JSON.stringify(doc));
      const used = new Set(this.doc.parts.map((p) => p.id).filter(Boolean));
      const cnt = {};
      for (const P of this.doc.parts) {
        if (!P.id) { const pre = PT.PREFIX[P.t] || 'X'; do { cnt[pre] = (cnt[pre] || 0) + 1; P.id = pre + cnt[pre]; } while (used.has(P.id)); used.add(P.id); }
        P.p = Object.assign({}, CAT[P.t].defaults, P.p);
        P.rot = P.rot || 0; P.flip = !!P.flip;
      }
      this.rt = {};
      this.assignTol();
      this.dirty = true;
      this.version++;
    }
    assignTol() {
      for (const P of this.doc.parts) {
        const r = rng(hashStr(P.id) + this.cfg.seed * 7919);
        const tol = (P.p.tol || 5) / 100;
        P.err = (r() * 2 - 1) * tol;
      }
    }
    part(id) { return this.doc.parts.find((p) => p.id === id); }
    nextId(type) {
      const pre = PT.PREFIX[type] || 'X'; let k = 1;
      while (this.doc.parts.some((p) => p.id === pre + k)) k++;
      return pre + k;
    }
    invalidate() { this.dirty = true; this.version++; }

    /* ---------- redes eléctricas ---------- */
    computeNets() {
      const parent = new Map();
      const find = (a) => { let r = a; while (parent.get(r) !== r) r = parent.get(r); while (parent.get(a) !== r) { const n = parent.get(a); parent.set(a, r); a = n; } return r; };
      const add = (a) => { if (!parent.has(a)) parent.set(a, a); return a; };
      const uni = (a, b) => { a = find(add(a)); b = find(add(b)); if (a !== b) parent.set(a, b); };
      const segs = [];
      const pts = new Set();
      for (const w of this.doc.wires) {
        for (let i = 0; i < w.pts.length; i++) {
          const k = key(w.pts[i][0], w.pts[i][1]); add(k); pts.add(k);
          if (i > 0) { uni(key(w.pts[i - 1][0], w.pts[i - 1][1]), k); segs.push([w.pts[i - 1], w.pts[i]]); }
        }
      }
      const pinKey = [];
      for (const P of this.doc.parts) {
        const c = CAT[P.t];
        pinKey[P.id] = c.pins.map((_, i) => { const q = PT.pinPos(P, i); const k = key(q[0], q[1]); add(k); pts.add(k); return k; });
      }
      /* un punto que cae en el interior de un tramo se une a él (T y pin sobre cable) */
      for (const k of pts) {
        const [x, y] = k.split(',').map(Number);
        for (const [a, b] of segs) {
          if (a[0] === b[0] && x === a[0] && y > Math.min(a[1], b[1]) && y < Math.max(a[1], b[1])) uni(k, key(a[0], a[1]));
          else if (a[1] === b[1] && y === a[1] && x > Math.min(a[0], b[0]) && x < Math.max(a[0], b[0])) uni(k, key(a[0], a[1]));
        }
      }
      /* tierra y etiquetas */
      const gnd = [];
      const labels = new Map();
      for (const P of this.doc.parts) {
        if (P.t === 'GND') gnd.push(pinKey[P.id][0]);
        if (P.t === 'LBL') { const nm = String(P.p.name || '').trim(); if (nm) { if (labels.has(nm)) uni(labels.get(nm), pinKey[P.id][0]); else labels.set(nm, pinKey[P.id][0]); } }
      }
      for (let i = 1; i < gnd.length; i++) uni(gnd[0], gnd[i]);
      /* etiquetas «gnd» / «0» */
      for (const nm of ['gnd', 'GND', '0']) if (labels.has(nm) && gnd.length) uni(labels.get(nm), gnd[0]);
      const gRoot = gnd.length ? find(gnd[0]) : null;
      const names = new Map(), members = new Map();
      let n = 0;
      const nameOf = (k) => {
        const r = find(k);
        if (r === gRoot) return '0';
        if (!names.has(r)) names.set(r, 'n' + (++n));
        return names.get(r);
      };
      const pinNet = {};
      for (const P of this.doc.parts) pinNet[P.id] = pinKey[P.id].map((k) => { const nm = nameOf(k); members.set(nm, (members.get(nm) || 0) + 1); return nm; });
      for (const w of this.doc.wires) for (const q of w.pts) { const nm = nameOf(key(q[0], q[1])); members.set(nm, (members.get(nm) || 0) + 1); }
      const labelNet = {};
      for (const [nm, k] of labels) labelNet[nm] = nameOf(k);
      this.netInfo = { pinNet, members, labelNet, hasGround: gnd.length > 0, nameOf, find };
      return this.netInfo;
    }
    /* nombre amistoso de una red (etiqueta o primer pin) */
    netLabel(nm) {
      if (nm === '0') return 'GND';
      for (const k in this.netInfo.labelNet) if (this.netInfo.labelNet[k] === nm) return k;
      return nm;
    }

    /* ---------- traducción a elementos ---------- */
    rebuild(opts = {}) {
      const info = this.computeNets();
      const old = this.cir;
      const cir = new S.Circuit();
      cir.T = this.cfg.Ta + 273.15;
      cir.hooks = [];
      this.dyn = false;
      const self = this;
      for (const P of this.doc.parts) {
        const c = CAT[P.t];
        if (c.ground || P.t === 'LBL') continue;
        const rt = (this.rt[P.id] = this.rt[P.id] || { T: this.cfg.Ta, dm: 0 });
        const pins = info.pinNet[P.id];
        let ctr = 0;
        const B = {
          P, rt, cfg: this.cfg, ref: {}, els: [], pins,
          pin: (i) => pins[i],
          node: (nm) => P.id + '.' + nm,
          connected: (i) => (info.members.get(pins[i]) || 0) > 1,
          add(d) { d.id = P.id + ':' + (d.id !== undefined ? d.id : 'e' + (ctr++)); d.owner = P.id; cir.add(d); this.els.push(d); return d; },
          hook(fn) { cir.hooks.push(fn); },
          dyn() { self.dyn = true; },
          last() { return this.els[this.els.length - 1]; }
        };
        if (P.dead && P.dead.kind) this.buildDead(P, B);
        else if (P.fault && P.fault.kind === 'open') this.buildDead(Object.assign({}, P, { dead: { kind: 'open' } }), B); /* abierto: sin elementos (evita ramas sin ecuación) */
        else { c.build(P, B); if (P.fault && P.fault.kind) this.applyFault(P, B); }
        if (/^(T555|LAMP|MOT)$/.test(P.t)) this.dyn = true;
        rt.els = B.els; rt.ref = B.ref;
      }
      this.tieFloating(cir);
      cir.compile();
      /* fuentes: si hay ondas o reactivos, el circuito es dinámico */
      if (cir.hasReact || cir.hasTime) this.dyn = true;
      this.cir = cir;
      /* conservar estado de un circuito anterior */
      if (old && old.x) this.carryState(old, cir);
      this.dirty = false;
      this.byOwner = {};
      for (const e of cir.els) (this.byOwner[e.owner] = this.byOwner[e.owner] || []).push(e);
      return cir;
    }
    /* Fija una referencia débil a tierra en los subcircuitos sin camino conductor a 0 V
       (fuentes flotantes, secundarios de transformador, puertas aisladas…): evita mal condicionamiento numérico. */
    tieFloating(cir) {
      const par = new Map();
      const find = (a) => { let r = a; while (par.has(r) && par.get(r) !== r) r = par.get(r); return r; };
      const uni = (a, b) => { const ra = find(a), rb = find(b); if (!par.has(ra)) par.set(ra, ra); if (!par.has(rb)) par.set(rb, rb); if (ra !== rb) par.set(ra, rb); };
      const nodes = new Set(['0']);
      const hasSrc = new Map();
      const nm = (n) => (n === undefined ? '0' : String(n));
      for (const e of cir.els) {
        const link = [];
        if (/^(R|SW|V|L|E)$/.test(e.type) || (e.type === 'I' && false)) link.push([e.a, e.b]);
        else if (e.type === 'X') for (const w of e.W) link.push(w);
        else if (e.type === 'REG') { link.push([e.a, e.b]); link.push([e.b, e.c]); }
        for (const [a, b] of link) uni(nm(a), nm(b));
        for (const k of ['a', 'b', 'c', 'd', 'e']) if (e[k] !== undefined) { nodes.add(nm(e[k])); if (!par.has(nm(e[k]))) par.set(nm(e[k]), nm(e[k])); }
        if (e.W) for (const w of e.W) for (const n of w) { nodes.add(nm(n)); if (!par.has(nm(n))) par.set(nm(n), nm(n)); }
      }
      if (!par.has('0')) par.set('0', '0');
      const g = find('0');
      const comps = new Map();
      for (const n of nodes) { const r = find(n); if (r === g) continue; if (!comps.has(r)) comps.set(r, []); comps.get(r).push(n); }
      for (const e of cir.els) if ((e.type === 'V' || e.type === 'X') && !e.dead) {
        const r = find(nm(e.type === 'X' ? e.W[0][1] : e.b));
        if (comps.has(r)) hasSrc.set(r, e.type === 'V' ? e.b : e.W[0][1]);
      }
      let k = 0;
      for (const [r, list] of comps) {
        const anchor = hasSrc.has(r) ? String(hasSrc.get(r)) : list[0];
        cir.add({ type: 'R', id: '~tie' + (k++), owner: '~', a: anchor, b: '0', r: hasSrc.has(r) ? 1e6 : 1e9 });
      }
    }
    carryState(old, cir) {
      const m = new Map(old.els.map((e) => [e.id, e]));
      for (const e of cir.els) {
        const o = m.get(e.id);
        if (!o || o.type !== e.type) continue;
        if (e.type === 'C' || e.type === 'L') { e.vprev = o.vprev; e.iprev = o.iprev; }
        else if (e.type === 'X') { e.iw = o.iw; e.vw = o.vw; }
        else if (e.type === 'OA') e.y = o.y;
        else if (e.type === 'REG') e.mode = o.mode;
      }
      const x = new Float64Array(cir.N);
      for (let i = 1; i < cir.nodeNames.length; i++) {
        const j = old.names.get(cir.nodeNames[i]);
        if (j && old.x && j - 1 < old.x.length) x[i - 1] = old.x[j - 1];
      }
      cir.x = x; cir.t = old.t; cir.restart = true;
    }
    buildDead(P, B) {
      const c = CAT[P.t], k = P.dead.kind;
      const sp = this.shortPins(P);
      if (k === 'short') B.add({ id: 'fail', type: 'R', a: B.pin(sp[0]), b: B.pin(sp[1]), r: P.t === 'VAR' ? 2 : 0.05 });
      else if (k === 'burst') { /* condensador reventado: abierto */ }
      /* 'open' y demás: no se añade nada. Los pines quedan flotantes. */
    }
    shortPins(P) {
      switch (P.t) {
        case 'NPN': case 'PNP': case 'DARL': case 'NMOS': case 'PMOS': case 'JFN': case 'JFP': return [0, 2];
        case 'BR': return [2, 3];
        case 'OPTO': return [2, 3];
        case 'REG': return [0, 1];
        default: return [0, 1];
      }
    }
    /* Fallas inyectadas por el usuario */
    applyFault(P, B) {
      const k = P.fault.kind, sp = this.shortPins(P);
      if (k === 'open') { for (const e of B.els) if (e.type !== 'R' || true) e.dead = 'open'; }
      else if (k === 'short') B.add({ id: 'flt', type: 'R', a: B.pin(sp[0]), b: B.pin(sp[1]), r: 0.01 });
      else if (k === 'leak') B.add({ id: 'flt', type: 'R', a: B.pin(sp[0]), b: B.pin(sp[1]), r: 2000 });
      else if (k === 'drift' && B.ref.main) {
        const e = B.ref.main;
        if (e.type === 'R') e.r *= P.fault.factor || 2;
        else if (e.type === 'C') e.c *= P.fault.factor || 0.2;
        else if (e.type === 'L') e.l *= P.fault.factor || 0.5;
      }
    }

    /* ---------- análisis ---------- */
    get warnings() {
      const w = [];
      if (!this.netInfo || !this.netInfo.hasGround) w.push('Falta la tierra (GND): el circuito no tiene referencia de 0 V.');
      return w;
    }
    solveOP() {
      if (this.dirty || !this.cir) this.rebuild();
      const ok = this.cir.solveDC();
      this.applyRefresh();
      return ok;
    }
    /* un paso de transitorio */
    step(dt, method) {
      if (this.dirty || !this.cir) { this.rebuild(); this.cir.solveDC(); }
      this.cir._dt = dt;
      const ok = this.cir.step(dt, method);
      return ok;
    }
    applyRefresh() { this.cir._dt = 0; }

    /* ---------- lecturas ---------- */
    v(net) { return net === '0' ? 0 : this.cir.vNamed(net); }
    vPin(P, i) { return this.v(this.netInfo.pinNet[P.id][i]); }
    vDiff(P, i, j) { return this.vPin(P, i) - this.vPin(P, j); }
    /* corriente principal de un componente (a→b a través del elemento principal) */
    iPart(P) {
      const r = this.rt[P.id] && this.rt[P.id].ref;
      if (!r || !r.main) return 0;
      const e = r.main;
      if (e.type === 'V') return -e.i;
      return e.i || 0;
    }
    /* Resistencia equivalente (óhmetro): desactiva las fuentes y aplica una corriente de prueba */
    measureOhms(P, diodeMode) {
      if (this.dirty || !this.cir) this.rebuild();
      const info = this.netInfo, pn = info.pinNet[P.id];
      const a = pn[0], b = pn[1];
      /* copia del circuito con las fuentes apagadas */
      const c2 = new S.Circuit();
      c2.T = this.cir.T; c2.hooks = [];
      for (const e of this.cir.els) {
        if (e.owner === P.id) continue;
        const d = Object.assign({}, e);
        delete d.na; delete d.nb; delete d.nc; delete d.nd; delete d.ne; delete d.wn; delete d.br; delete d.vj;
        if (d.W) d.W = e.W;
        if (d.type === 'V') { d.v = 0; d.wave = null; d.acmag = 0; if (!(d.rs > 0)) d.rs = 1e-4; d.dead = false; }
        if (d.type === 'I') { d.i = 0; d.wave = null; }
        if (d.type === 'C') { d.vprev = 0; d.iprev = 0; }
        if (d.type === 'L') { d.vprev = 0; d.iprev = 0; d.emf = 0; }
        if (d.type === 'X') { d.iw = null; d.vw = null; }
        if (d.type === 'REG') d.mode = 'off';
        if (d.type === 'OA') { d.y = 0; }
        if (d.type === 'SW') d.closed = e.closed;
        c2.add(d);
      }
      const ranges = diodeMode ? [1e-3] : [1e-3, 1e-4, 1e-5, 1e-6, 1e-7];
      for (const it of ranges) {
        const test = { type: 'I', id: 'test', a: b, b: a, i: it };
        const cc = c2;
        cc.els = cc.els.filter((e) => e.id !== 'test');
        cc.add(test); cc.compile();
        if (!cc.solveDC({ noEvents: true })) continue;
        const v = cc.vNamed(a) - cc.vNamed(b);
        if (Math.abs(v) < (diodeMode ? 3 : 2.5) || it === ranges[ranges.length - 1]) return { v, i: it, r: v / it, ol: Math.abs(v) >= (diodeMode ? 3 : 2.5) };
      }
      return { v: NaN, i: 0, r: Infinity, ol: true };
    }

    /* ---------- acumuladores para calentamiento y daños ---------- */
    metrics(P) {
      const r = this.rt[P.id];
      if (!r || !r.ref) return null;
      const m = r.ref.main, rate = CAT[P.t].rate ? CAT[P.t].rate(P) : null;
      if (!rate || !m) return null;
      let pw = 0;
      if (rate.iw === 'rs') { const e = r.ref.src; pw = e.i * e.i * (e.rs || 0); }
      else for (const e of (this.byOwner[P.id] || [])) {
        if (e.dead) continue;
        if (/^(R|D|Q|M|SW|REG|OA)$/.test(e.type)) pw += Math.max(0, e.p || 0);
        else if (e.type === 'X') pw += Math.max(0, e.p || 0);
      }
      let i = Math.abs(m.type === 'V' ? m.i : (m.i || 0)), v = Math.abs(m.vab || 0), vrev = 0, vgs = 0;
      switch (m.type) {
        case 'Q': i = Math.abs(m.ic); v = Math.abs(m.vce); vrev = Math.max(0, -m.pol * m.vbe + 0); vgs = 0; break;
        case 'M': i = Math.abs(m.i); v = Math.abs(m.vds); vgs = Math.abs(m.vgs); break;
        case 'D': vrev = Math.max(0, -m.vab); break;
        case 'C': vrev = Math.max(0, -m.vab); break;
        case 'OA': { const vcc = (m.nd !== undefined ? this.cir.v(m.nd) : m.vcc) - (m.ne !== undefined ? this.cir.v(m.ne) : m.vee); v = Math.abs(vcc); i = Math.abs(m.iout || 0); break; }
        case 'REG': v = Math.abs(m.vin); i = Math.abs(m.i); break;
        case 'X': i = Math.max(...(m.iw || [0]).map(Math.abs)); v = Math.abs(m.vw ? m.vw[0] : 0); break;
      }
      return { pw, i, v, vrev, vgs, rate };
    }
    /* se llama tras cada paso para integrar potencias, picos y medias */
    accumulate(dt) {
      if (!(dt > 0)) dt = 1e-9;
      for (const P of this.doc.parts) {
        const c = CAT[P.t];
        if (!c.rate) continue;
        const m = this.metrics(P);
        if (!m) continue;
        const r = this.rt[P.id];
        const a = (r.acc = r.acc || { t: 0, pw: 0, i2: 0, ipk: 0, vpk: 0, vrevpk: 0, vgspk: 0 });
        a.t += dt; a.pw += m.pw * dt; a.i2 += m.i * m.i * dt;
        a.ipk = Math.max(a.ipk, m.i); a.vpk = Math.max(a.vpk, m.v); a.vrevpk = Math.max(a.vrevpk, m.vrev); a.vgspk = Math.max(a.vgspk, m.vgs);
      }
    }
    /* integra calor y daños en el tiempo real transcurrido (dtw, s). Devuelve lista de componentes que fallaron. */
    tick(dtw) {
      const failed = [];
      if (!this.cfg.damage) { for (const P of this.doc.parts) { const r = this.rt[P.id]; if (r) { r.acc = null; } } return failed; }
      const ts = this.cfg.thermalSpeed || 1;
      for (const P of this.doc.parts) {
        const c = CAT[P.t];
        if (!c.rate || P.dead) continue;
        const r = this.rt[P.id];
        if (!r || !r.acc || r.acc.t <= 0) continue;
        const a = r.acc, rate = c.rate(P);
        /* promedios móviles: la potencia térmica y el calor de un fusible se integran en muchos cuadros (los pulsos rápidos no caben en uno) */
        const aw = 1 - Math.exp(-dtw / 0.3), ai = 1 - Math.exp(-dtw / 0.04);
        const pf = a.pw / a.t, i2f = a.i2 / a.t;
        r.pavg = r.pavg === undefined ? 0 : r.pavg + (pf - r.pavg) * aw;
        r.i2avg = r.i2avg === undefined ? i2f : r.i2avg + (i2f - r.i2avg) * ai;
        const pw = r.pavg, irms = Math.sqrt(r.i2avg);
        r.pw = pw; r.irms = irms; r.ipk = a.ipk; r.vpk = a.vpk;
        /* temperatura */
        let rth = rate.rth || 100;
        if (rate.tj && P.p.hs !== undefined && P.p.hs !== null && P.p.hs > 0) rth = (rate.rjc || 1.5) + +P.p.hs;
        const tinf = this.cfg.Ta + pw * rth;
        const tau = (rate.cth ? (rate.cth + (P.p.hs > 0 ? 15 / P.p.hs : 0)) * rth : 3 + 0.04 * rth) / ts;
        r.T += (tinf - r.T) * (1 - Math.exp(-dtw / tau));
        r.Tinf = tinf;
        const e = r.ref.main;
        if (rate.tj && e && (e.type === 'D' || e.type === 'Q') && Math.abs(r.T - (e.T ? e.T - 273.15 : this.cfg.Ta)) > 0.5) { e.T = r.T + 273.15; this.cir.refreshTemp(e); this.tchg = true; }
        /* sobretensión acumulada */
        let dm = 0;
        const over = (val, lim, k) => { if (lim && val > lim) dm += (val / lim - 1) * k; };
        if (rate.vmax) over(a.vpk, rate.vmax, 2.5);
        if (rate.vrev && P.t === 'C' && rate.vrev) { if (a.vrevpk > rate.vrev) dm += (a.vrevpk) * 0.15; }
        if (rate.vgs) over(a.vgspk, rate.vgs * 1.2, 4);
        if (rate.imax && !rate.fuseA) over(a.ipk, rate.imax, 1.2);
        if (rate.vrev && P.t !== 'C') over(a.vrevpk, rate.vrev * 1.15, 1.0);
        r.dm = Math.max(0, (r.dm || 0) + dm * dtw - (dm === 0 ? dtw * 0.05 : 0));
        const tfail = { R: 230, POT: 200, C: (P.p.kind === 'elec' || P.p.kind === 'tant') ? 125 : 160, LED: 130, TR: 160, TRCT: 160, MOT: 150, L: 160 }[P.t] || 175;
        const pcrit = rate.pmax && pw > rate.pmax * 3.0;
        let why = null;
        if (rate.shutdown) {
          const st = this.rt[P.id], hs = (st.reg = st.reg || { hot: false });
          if (!hs.hot && r.T > rate.shutdown) { hs.hot = true; st.regHot = true; this.dirty = true; this.version++; this.alerts.push({ id: P.id, text: 'Protección térmica del regulador ' + P.id + ': se apagó por sobrecalentamiento.' }); }
          else if (hs.hot && r.T < rate.shutdown - 25) { hs.hot = false; st.regHot = false; this.dirty = true; this.version++; }
          if (r.dm >= 1) why = 'sobretensión en el regulador';
        } else {
          if (r.T > tfail) why = 'temperatura ' + Math.round(r.T) + ' °C (límite ' + tfail + ' °C)';
          else if (r.dm >= 1) why = 'esfuerzo eléctrico excesivo';
          else if (pcrit && r.T > tfail * 0.6) why = 'potencia ' + EM.si(pw, 'W') + ' ≫ nominal';
        }
        /* fusibles: i²t */
        if (rate.fuse) {
          const ir = rate.fuse, k = rate.slow ? 0.25 : 1;
          const rr = (irms * irms) / (ir * ir);
          r.h = Math.max(0, (r.h || 0) + (rr > 1.3 ? (rr - 1.0) * dtw * k * 2.2 : -0.3 * dtw * (r.h || 0)));
          if (a.ipk > ir * (rate.slow ? 12 : 8)) r.h = 99;
          if (r.h >= 1) why = 'corriente ' + EM.si(irms, 'A') + ' ≫ nominal ' + EM.si(ir, 'A');
        }
        if (rate.fuseA) {
          if (a.ipk > rate.fuseA * 1.05) { r.fuseBlown = true; why = 'se superó el fusible del multímetro (' + rate.fuseA + ' A)'; }
        }
        if (rate.breaker) {
          if (a.ipk > rate.breaker * 1.6 || irms > rate.breaker * 1.15) { r.tripped = true; why = 'corriente de ' + EM.si(irms, 'A') + ' (disyuntor de ' + rate.breaker + ' A)'; }
        }
        if (P.t === 'VDC' && a.ipk > 200) { r.shortAlert = true; }
        if (why) { P.dead = { kind: c.fail === 'trip' ? 'open' : c.fail || 'open', why, desc: c.failDesc || ('El ' + (rate.label || 'componente') + ' falló') }; failed.push(P); this.dirty = true; this.version++; r.failedAt = Date.now(); r.T = Math.min(r.T, tfail); }
        r.acc = null;
      }
      if (failed.length) for (const P of failed) this.alerts.push({ id: P.id, text: P.id + ': ' + P.dead.desc + ' — ' + P.dead.why + '.' });
      return failed;
    }
    repair(P) {
      if (P) { P.dead = null; P.fault = null; const r = this.rt[P.id]; if (r) { r.T = this.cfg.Ta; r.dm = 0; r.h = 0; r.pavg = undefined; r.i2avg = undefined; r.fuseBlown = false; r.tripped = false; r.regHot = false; } }
      this.dirty = true; this.version++;
    }
    repairAll() { for (const P of this.doc.parts) this.repair(P); this.alerts = []; }
    /* Alerta de cortocircuito: algún bucle con corriente mucho mayor que la usual */
    shortCircuit() {
      let worst = null;
      for (const P of this.doc.parts) {
        if (!/^(VDC|BAT|PSU|VAC|FG|MAINS)$/.test(P.t)) continue;
        const r = this.rt[P.id];
        if (!r || !r.ref || !r.ref.src) continue;
        const i = Math.abs(r.ref.src.i);
        const vs = Math.abs(r.ref.src.vsrc || r.ref.src.v || 0) || 1;
        const lim = P.t === 'PSU' ? P.p.ilim : P.t === 'MAINS' ? P.p.breaker : P.t === 'FG' ? 0.1 : P.t === 'BAT' ? 5 : 50;
        if (i > lim * 1.5 && i > 0.2) { if (!worst || i > worst.i) worst = { id: P.id, i, v: vs }; }
      }
      return worst;
    }
  }
  EM.Net = Net;

  /* ===================================================================
     Construcción desde una especificación compacta
       spec = { parts:[[id,tipo,x,y,rot,props],...], wires:[['R1.1','C1.0'], ['R1.1',[x,y],'C1.0'], ['R2.1','gnd'], ['Q1.0','@vcc:u']] }
     Los pines se nombran «id.índice» o «id.nombre».
     =================================================================== */
  Net.fromSpec = (spec) => {
    const parts = [];
    const byId = {};
    for (const t of spec.parts) {
      const [id, type, x, y, rot, p] = t;
      const P = PT.newPart(type, x, y, { id, rot: rot || 0 });
      if (typeof rot === 'object' && rot) { P.rot = rot.rot || 0; P.flip = !!rot.flip; Object.assign(P.p, rot.p || {}); }
      if (p) { if (p.flip) { P.flip = true; } Object.assign(P.p, p); delete P.p.flip; }
      if (CAT[type].apply && p && p.kind) { const keep = Object.assign({}, p); CAT[type].apply(P); Object.assign(P.p, keep); }
      parts.push(P); byId[id] = P;
    }
    const wires = [];
    const pinPos = (ref) => {
      const m = /^([^.]+)\.(.+)$/.exec(ref);
      const P = byId[m[1]];
      if (!P) throw new Error('Componente inexistente: ' + ref);
      const c = CAT[P.t];
      let i = /^\d+$/.test(m[2]) ? +m[2] : c.pn.indexOf(m[2]);
      if (i < 0 || i >= c.pins.length) throw new Error('Pin inexistente: ' + ref);
      return PT.pinPos(P, i);
    };
    let auto = 0;
    const route = (a, b, hint) => {
      if (a[0] === b[0] || a[1] === b[1]) return [a, b];
      return hint === 'v' ? [a, [a[0], b[1]], b] : [a, [b[0], a[1]], b];
    };
    for (const w of spec.wires || []) {
      if (typeof w[1] === 'string' && w[1] === 'gnd') {
        const a = pinPos(w[0]);
        const dy = w[2] || 1;
        wires.push({ pts: [a, [a[0], a[1] + dy]] });
        parts.push(PT.newPart('GND', a[0], a[1] + dy, { id: '_g' + (++auto), rot: 0 }));
        continue;
      }
      if (typeof w[1] === 'string' && w[1][0] === '@') {
        const [nm, dir] = w[1].slice(1).split(':');
        const a = pinPos(w[0]);
        const d = { u: [0, -2], d: [0, 2], l: [-2, 0], r: [2, 0] }[dir || 'r'];
        const q = [a[0] + d[0], a[1] + d[1]];
        wires.push({ pts: [a, q] });
        parts.push(PT.newPart('LBL', q[0], q[1], { id: '_n' + (++auto), p: { name: nm } }));
        if (dir === 'l') parts[parts.length - 1].flip = false;
        continue;
      }
      if (typeof w[0] === 'string' && w[0] === 'gndat') { /* ['gndat', x, y] */
        parts.push(PT.newPart('GND', w[1], w[2], { id: '_g' + (++auto) })); continue;
      }
      const pts = [];
      const seq = w.filter((t) => t !== 'v' && t !== 'h');
      const hint = w.includes('v') ? 'v' : 'h';
      const coords = seq.map((t) => (typeof t === 'string' ? pinPos(t) : t));
      let acc = [coords[0]];
      for (let i = 1; i < coords.length; i++) {
        const r = route(coords[i - 1], coords[i], hint);
        acc = acc.concat(r.slice(1));
      }
      wires.push({ pts: acc });
    }
    return { parts: parts.map((P) => { const o = { id: P.id, t: P.t, x: P.x, y: P.y, rot: P.rot, flip: P.flip, p: P.p }; return o; }), wires };
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
