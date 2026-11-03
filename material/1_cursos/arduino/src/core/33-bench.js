/* ===================================================================
   33-bench.js — Banco de pruebas (EM.Bench): une la escena (protoboard, piezas, cables,
   placas, módulos y multímetros) con el simulador eléctrico, aplica los estados de los pines
   del microcontrolador, calcula promedios por cuadro y detecta sobrecargas, cortocircuitos y piezas dañadas.
   Sin DOM: se prueba en Node.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const sp = EM.spice, BB = EM.bb, PT = EM.parts;
  const Z = 1e12; /* resistencia «infinita» de un pin en alta impedancia */

  class Bench {
    constructor(scene, opts = {}) {
      this.scene = scene;
      this.opts = opts;
      this.t = 0;
      this.version = 0;
      this.events = [];
      this.pinState = {}; /* ref → {mode, level, duty} */
      this.log = [];
      this.build();
    }

    /* ---------------- construcción ---------------- */
    build() {
      const sc = BB.normalize(this.scene);
      sc.env = sc.env || {};
      this.nets = BB.nets(sc);
      this.c = new sp.Circuit();
      this.names = new Map(); /* raíz de red → nombre de nodo */
      this.partById = {};
      this._lim = null;
      this.drivers = []; /* elementos V de pines de placas y de salidas de módulos */
      this.groundRoot = null;
      /* tierra: la red GND de la primera placa; si no hay, el − de la primera fuente */
      for (const m of sc.mcus || []) {
        const spec = EM.mcu.boards[m.kind], g = spec.pins.find((q) => q.net === 'GND');
        if (g) { this.groundRoot = this.nets.root(m.id + ':' + g.id); break; }
      }
      if (this.groundRoot === null) {
        const pw = (sc.parts || []).find((p) => PT[p.type] && PT[p.type].power && p.pins[1]);
        if (pw) this.groundRoot = this.nets.root(pw.pins[1]);
      }
      this.ctx = {
        env: sc.env,
        node: (p, i) => this.nodeOf(p, i),
        add: (el) => { el.id = (this._curPart ? this._curPart.id + ':' : '') + (el.role || el.type + this.c.els.length); el.part = this._curPart ? this._curPart.id : null; return this.c.add(el); },
        el: (p, role) => this.c.find(p.id + ':' + role)
      };
      for (const p of sc.parts || []) {
        const def = PT[p.type];
        if (!def) throw new Error('pieza desconocida: ' + p.type);
        this.partById[p.id] = p;
        this._curPart = p;
        if (p.dead && def.deadKind !== undefined) this.expandDead(p, def);
        else def.expand(p, this.ctx);
        this._curPart = null;
      }
      this.buildMcus();
      this.buildMeters();
      this.c.compile();
      this.dirty = false;
      this.version = (this.version || 0) + 1;
    }
    nodeOf(p, i) {
      if (typeof i === 'string') return p.id + '#' + i;
      let ref = p.pins[p.flip && p.pins.length === 3 ? 2 - i : i];
      if (!ref) return p.id + '#nc' + i; /* pin sin conectar */
      return this.nodeOfRef(ref);
    }
    nodeOfRef(ref) {
      const r = this.nets.root(ref);
      if (r === this.groundRoot) return '0';
      if (!this.names.has(r)) this.names.set(r, 'n' + this.names.size);
      return this.names.get(r);
    }
    expandDead(p, def) {
      const k = def.deadKind;
      if (k === 'short') this.ctx.add({ type: 'R', a: this.nodeOf(p, 0), b: this.nodeOf(p, p.pins.length - 1), r: 1.0, role: 'dead' });
      else if (k === 'vent') this.ctx.add({ type: 'R', a: this.nodeOf(p, 0), b: this.nodeOf(p, 1), r: 5000, role: 'dead' });
      /* 'open': no aporta nada */
    }
    /* placas: fuentes de alimentación y pines */
    buildMcus() {
      this.mcuInfo = {};
      for (const m of this.scene.mcus || []) {
        const spec = EM.mcu.boards[m.kind];
        const info = (this.mcuInfo[m.id] = { spec, m, pins: {}, powered: false });
        const refOf = (id) => m.id + ':' + id;
        const used = (id) => { const r = this.nets.root(refOf(id)); return this.netSize(r) > 1; };
        const gnd = spec.pins.find((q) => q.net === 'GND');
        info.powered = this.mcuPowered(m, spec);
        for (const pin of spec.pins) {
          const ref = refOf(pin.id);
          if (pin.net === '5V' && info.powered && m.power !== 'vin5v') this.addRail(m, pin, spec.v5 || 5.0, spec.r5 || 0.35, 'rail5');
          else if (pin.net === '3V3' && info.powered) this.addRail(m, pin, 3.3, spec.r3 || 1.2, 'rail3');
          else if (pin.net === 'VCC5' && info.powered) this.addRail(m, pin, spec.v5 || 5.0, 0.35, 'rail5b');
          if (pin.gpio !== undefined && info.powered && used(pin.id)) {
            const node = this.nodeOfRef(ref);
            const el = this.c.add({ type: 'V', id: 'pin:' + ref, a: node, b: '0', v: 0, rs: Z, role: 'pin' });
            el.ref = ref; el.pinId = pin.id; el.mcu = m.id;
            info.pins[pin.id] = el;
            this.drivers.push(el);
          }
        }
        info.vcc = spec.vcc;
      }
      /* salidas de módulos activos */
      for (const p of this.scene.parts || []) {
        const M = EM.mcu && EM.mcu.modules && EM.mcu.modules[p.type];
        if (!M || !M.outputs) continue;
        p.drv = {};
        for (const pinName of M.outputs) {
          const idx = PT[p.type].pinNames.indexOf(pinName);
          if (idx < 0 || !p.pins[idx]) continue;
          const el = this.c.add({ type: 'V', id: 'drv:' + p.id + ':' + pinName, a: this.nodeOf(p, idx), b: this.nodeOf(p, PT[p.type].pinNames.indexOf('GND')), v: 0, rs: Z, role: 'drv' });
          el.part = p.id; el.pinName = pinName;
          p.drv[pinName] = el;
          this.drivers.push(el);
        }
      }
    }
    netSize(root) {
      if (!this._sizes) {
        this._sizes = new Map();
        for (const k of this.nets.uf.p.keys()) { const r = this.nets.uf.find(k); this._sizes.set(r, (this._sizes.get(r) || 0) + 1); }
      }
      return this._sizes.get(root) || 1;
    }
    mcuPowered(m, spec) {
      if (m.power === 'off') return false;
      if (m.power === 'vin') {
        /* ¿hay una fuente de más de 6,5 V entre VIN y GND? */
        const vin = spec.pins.find((q) => q.net === 'VIN'), gnd = spec.pins.find((q) => q.net === 'GND');
        if (!vin) return false;
        const rv = this.nets.root(m.id + ':' + vin.id), rg = this.nets.root(m.id + ':' + gnd.id);
        return (this.scene.parts || []).some((p) => PT[p.type] && PT[p.type].power && !p.dead && p.pins[0] && p.pins[1] && this.nets.root(p.pins[0]) === rv && this.nets.root(p.pins[1]) === rg && (PT.val(p, 'v') >= 6.5));
      }
      return !m.tripped;
    }
    addRail(m, pin, v, rs, role) {
      const tr = m.tripped && role === 'rail5';
      this.c.add({ type: 'V', id: 'rail:' + m.id + ':' + pin.id, a: this.nodeOfRef(m.id + ':' + pin.id), b: '0', v: tr ? 0 : v, rs: tr ? 1e6 : rs, role: role, vset: tr ? 0 : v, rsset: tr ? 1e6 : rs, ilim: role === 'rail5' ? 0.5 : (EM.mcu.boards[m.kind].i3 || 0.15) });
    }
    buildMeters() {
      this.meters = this.scene.meters || [];
      for (const mt of this.meters) {
        if (!mt.red || !mt.black) continue;
        const a = this.nodeOfRef(mt.red), b = this.nodeOfRef(mt.black);
        if (mt.mode === 'V') this.c.add({ type: 'R', id: 'meter:' + mt.id, a, b, r: 10e6, role: 'meter', meter: mt.id });
        else if (mt.mode === 'A') this.c.add({ type: 'R', id: 'meter:' + mt.id, a, b, r: mt.blown ? 1e12 : (mt.jack === '10A' ? 0.01 : 1.0), role: 'meter', meter: mt.id });
      }
    }

    /* ---------------- estados de los pines ---------------- */
    /* levels: {ref: {mode:'out'|'in'|'pullup'|'pulldown'|'dac', level:0|1, volts}} */
    applyPins(states) {
      for (const el of this.drivers) {
        if (el.role === 'drv') continue;
        const st = states && states[el.ref];
        const info = this.mcuInfo[el.mcu], spec = info.spec;
        const dead = info.deadPins && info.deadPins[el.pinId];
        if (!st || dead) { el.rs = Z; el.v = 0; continue; }
        const vcc = this.railV(info);
        switch (st.mode) {
          case 'out': el.v = st.level ? vcc : 0; el.rs = spec.rout; break;
          case 'dac': el.v = st.volts; el.rs = 2000; break;
          case 'pullup': el.v = vcc; el.rs = spec.rpu; break;
          case 'pulldown': el.v = 0; el.rs = spec.rpd || 45000; break;
          default: el.rs = Z; el.v = 0;
        }
      }
    }
    railV(info) { return info.spec.vcc; }
    applyModules() {
      for (const p of this.scene.parts || []) {
        const M = EM.mcu && EM.mcu.modules && EM.mcu.modules[p.type];
        if (!M || !M.outputs || !p.drv) continue;
        const out = M.drive(p, this) || {};
        for (const k in p.drv) {
          const o = out[k];
          if (o) { p.drv[k].v = o.v; p.drv[k].rs = o.rs === undefined ? 100 : o.rs; } else { p.drv[k].rs = Z; p.drv[k].v = 0; }
        }
      }
    }
    /* Alimentación de un módulo: tensión entre VCC y GND y si basta para funcionar */
    modPower(p) {
      if (p.forcePower && !p.dead) return { v: p.forcePower, ok: true };
      const d = PT[p.type], iv = d.pinNames.findIndex((n) => n === 'VCC' || n === '3V3'), ig = d.pinNames.indexOf('GND');
      if (iv < 0 || ig < 0 || !p.pins[iv] || !p.pins[ig] || p.dead) return { v: 0, ok: false };
      const v = this.v(p.pins[iv]) - this.v(p.pins[ig]);
      return { v, ok: v >= PT.val(p, 'vmin') - 1e-9 && v <= PT.val(p, 'vmax') * 1.01 };
    }

    /* ---------------- resolver ---------------- */
    updateParams() { /* parámetros que cambian sin reconstruir (pot, LDR, NTC, pulsadores, bombillo) */
      for (const p of this.scene.parts || []) {
        const els = this.c.els.filter((e) => e.part === p.id);
        if (!els.length || p.dead) continue;
        if (PT[p.type].module && p.iload !== undefined) { const ev = this.c.find(p.id + ':vcc'); if (ev) ev.r = 5 / Math.max(p.iload, 1e-6); }
        if (p.type === 'POT') {
          const R = PT.val(p, 'value'), x = Math.min(0.9999, Math.max(0.0001, PT.val(p, 'pos')));
          const up = this.c.find(p.id + ':up'), dn = this.c.find(p.id + ':down');
          up.r = Math.max(R * x, 0.5); dn.r = Math.max(R * (1 - x), 0.5);
        } else if (p.type === 'LDR') {
          const lux = p.lux !== undefined ? p.lux : (this.scene.env.lux !== undefined ? this.scene.env.lux : PT.val(p, 'lux'));
          this.c.find(p.id + ':main').r = sp.ldr(lux, PT.val(p, 'r10'), PT.val(p, 'gamma'));
        } else if (p.type === 'NTC') {
          const T = p.temp !== undefined ? p.temp : (this.scene.env.temp !== undefined ? this.scene.env.temp : PT.val(p, 'temp'));
          this.c.find(p.id + ':main').r = sp.ntc(T, PT.val(p, 'r25'), PT.val(p, 'beta'));
        } else if (p.type === 'BTN') this.c.find(p.id + ':contact').closed = p.contact !== undefined ? !!p.contact : !!p.pressed;
        else if (p.type === 'SW') this.c.find(p.id + ':contact').closed = !!p.closed;
        else if (p.type === 'LAMP') { const Rn = PT.val(p, 'vnom') / PT.val(p, 'inom'); this.c.find(p.id + ':main').r = Rn * (0.1 + 0.9 * (p.heat || 0)); }
        else if (p.type === 'MOTOR') { this.c.find(p.id + ':main').v = PT.val(p, 'ke') * (p.omega || 0); }
        else if (p.type === 'RELAY') { this.c.find(p.id + ':na').closed = !!p.on; this.c.find(p.id + ':nc').closed = !p.on; }
        else if (p.type === 'SIGGEN') { const e = this.c.find(p.id + ':src'); Object.assign(e.wave, { amp: PT.val(p, 'amp'), offset: PT.val(p, 'offset'), freq: PT.val(p, 'freq'), duty: PT.val(p, 'duty'), kind: PT.val(p, 'kind') }); }
        else if (p.type === 'LAB' || p.type === 'BAT' || p.type === 'USB') {
          const e = this.c.find(p.id + ':src');
          if (p.type === 'LAB') { e.v = PT.val(p, 'v'); e.ilim = PT.val(p, 'ilimit'); }
          if (p.type === 'BAT') e.v = PT.val(p, 'v') * (p.charge === undefined ? 1 : Math.max(0.6, 0.78 + 0.22 * p.charge));
          if (p.type === 'USB') { e.v = p.tripped ? 0 : PT.val(p, 'v'); e.rs = p.tripped ? 1e6 : PT.val(p, 'rint'); e.ilim = PT.val(p, 'ilimit'); }
        } else if (p.type === 'FUSE') this.c.find(p.id + ':main').blown = !!p.blown;
        else if (p.type === 'ECAP' || p.type === 'C') { /* nada */ }
      }
    }
    /* fuentes con límite de corriente (modo CV/CC) */
    limitedSources() {
      if (!this._lim) this._lim = this.c.els.filter((e) => e.type === 'V' && e.ilim);
      return this._lim;
    }
    solve(states) {
      this.applyPins(states);
      this.applyModules();
      this.updateParams();
      /* registrar valores de consigna y devolver las fuentes al modo de tensión constante */
      for (const e of this.limitedSources()) {
        if (e.vset === undefined) { e.vset = e.v; e.rsset = e.rs; }
        if (e.part) { const p = this.partById[e.part]; if (p && (p.type === 'USB' || p.type === 'LAB' || p.type === 'BAT')) { e.vset = e.v; e.rsset = e.rs; } }
        e.cc = false; e.v = e.vset; e.rs = e.rsset;
      }
      let ok = this.c.solveDC();
      for (let it = 0; it < 5 && ok; it++) {
        let changed = false;
        for (const e of this.limitedSources()) {
          if (!e.cc) {
            if (-e.i > e.ilim * 1.000001) { e.cc = true; e.v = e.ilim * 1e9; e.rs = 1e9; changed = true; }
          } else {
            const vt = this.c.v(e.na) - this.c.v(e.nb);
            if (vt > e.vset - e.rsset * e.ilim + 1e-9) { e.cc = false; e.v = e.vset; e.rs = e.rsset; changed = true; }
          }
        }
        if (!changed) break;
        ok = this.c.solveDC();
      }
      return ok;
    }
    /* Resuelve un promedio ponderado de varios estados de pines (circuitos sin condensadores).
       segs: [{w, pins}] con w en segundos (o pesos relativos) */
    /* firma de los parámetros que se «estampan» al construir; si cambia, se reconstruye conservando la carga de los condensadores */
    partSig() { let s = ''; for (const p of this.scene.parts || []) s += p.id + '|' + p.type + '|' + (p.value === undefined ? '' : p.value) + '|' + (p.color || '') + '|' + (p.model || '') + '|' + (p.vz || '') + '|' + (p.drift || '') + '|' + (p.dead ? 1 : 0) + ';'; return s; }
    rebuildKeep() {
      const old = new Map(this.c.els.filter((e) => e.type === 'C' || e.type === 'L').map((e) => [e.id, { vprev: e.vprev, iprev: e.iprev }]));
      this.scene._norm = false;
      this.build();
      for (const e of this.c.els) { const o = old.get(e.id); if (o) { e.vprev = o.vprev; e.iprev = o.iprev; } }
      this._tranInit = old.size > 0;
    }
    frame(segs, dt) {
      if (this.dirty) this.build();
      const sg = this.partSig();
      if (this._sig !== undefined && sg !== this._sig) { this._sig = sg; this.rebuildKeep(); } else this._sig = sg;
      const c = this.c;
      if (c.hasReact) return this.tranFrame(segs, dt);
      const tot = segs.reduce((s, q) => s + q.w, 0) || 1;
      let X = null, acc = new Map();
      for (const sg of segs.length ? segs : [{ w: 1, pins: {} }]) {
        const ok = this.solve(sg.pins);
        if (!ok) { this.solveError = c.error; continue; }
        this.solveError = null;
        const f = sg.w / tot;
        if (!X) X = new Float64Array(c.x.length);
        for (let i = 0; i < X.length; i++) X[i] += f * c.x[i];
        for (const e of c.els) {
          let a = acc.get(e.id);
          if (!a) { a = { i: 0, vab: 0, p: 0, max: 0, ic: 0, ib: 0, vce: 0, vbe: 0, ids: 0 }; acc.set(e.id, a); }
          a.i += f * (e.i || 0); a.vab += f * (e.vab || 0); a.p += f * (e.p || 0); a.max = Math.max(a.max, Math.abs(e.i || 0));
          if (e.type === 'Q') { a.ic += f * e.ic; a.ib += f * e.ib; a.vce += f * e.vce; a.vbe += f * e.vbe; }
          if (e.type === 'M') { a.ids += f * e.ids; }
        }
      }
      if (X) {
        c.x = X;
        for (const e of c.els) { const a = acc.get(e.id); if (a) { e.i = a.i; e.vab = a.vab; e.p = a.p; e.imax = a.max; if (e.type === 'Q') { e.ic = a.ic; e.ib = a.ib; e.vce = a.vce; e.vbe = a.vbe; } if (e.type === 'M') e.ids = a.ids; } }
      }
      this.t += dt || 0;
      this.assess(dt || 0);
      return true;
    }
    /* Transitorio con paso fijo dtStep; segs en orden temporal con duración w (s) */
    tranFrame(segs, dt) {
      if (this.dirty) this.build();
      const c = this.c, h = this.opts.dtStep || 20e-6;
      const total = (dt === undefined || dt === null) ? segs.reduce((s, q) => s + q.w, 0) : dt;
      if (!this._tranInit) { this.solve(segs.length ? segs[0].pins : {}); this._tranInit = true; }
      if (!(total > 0)) { this.applyPins(segs.length ? segs[0].pins : {}); this.assess(0); return true; }
      const maxSteps = this.opts.maxSteps || 4000;
      const hh = Math.max(h, total / maxSteps);
      let acc = new Map(), nAcc = 0;
      const list = segs.length ? segs : [{ w: total, pins: {} }];
      let simt = 0;
      for (const sg of list) {
        this.applyPins(sg.pins); this.applyModules(); this.updateParams();
        const n = Math.max(1, Math.round(sg.w / hh));
        const step = sg.w / n;
        for (let k = 0; k < n; k++) {
          const ok = c.step(step, k === 0 ? 'be' : 'trap');
          if (!ok) { this.solveError = c.error; return false; }
          nAcc++;
          for (const e of c.els) { let a = acc.get(e.id); if (!a) { a = { i: 0, vab: 0, p: 0, max: 0 }; acc.set(e.id, a); } a.i += e.i || 0; a.vab += e.vab || 0; a.p += e.p || 0; a.max = Math.max(a.max, Math.abs(e.i || 0)); }
          simt += step;
          if (this.watch) this.watch.forEach((w) => w.push(this.t + simt, this.v(w.ref)));
        }
      }
      for (const e of c.els) { const a = acc.get(e.id); if (a && nAcc) { e.iinst = e.i; e.i = a.i / nAcc; e.vab = a.vab / nAcc; e.p = a.p / nAcc; e.imax = a.max; } }
      this.t += total;
      this.assess(total);
      return true;
    }

    /* ---------------- lecturas ---------------- */
    v(ref) { return this.c.v(this.c.names.get(this.nodeOfRef(ref)) || 0); }
    vDiff(a, b) { return this.v(a) - this.v(b); }
    el(partId, role) { return this.c.find(partId + ':' + role); }
    /* Corriente por un componente de 2 terminales (del pin 1 al pin 2) */
    partCurrent(p) {
      const d = PT[p.type];
      if (d.current) return d.current(p, this.ctx);
      const e = this.c.find(p.id + ':main') || this.c.els.find((q) => q.part === p.id);
      return e ? e.i : 0;
    }
    /* Tensión digital leída por un pin según los umbrales de la placa */
    pinVolts(ref) { return this.v(ref); }
    isFloating(ref) { /* ¿el nodo no tiene camino de corriente hacia una fuente? */
      const node = this.c.names.get(this.nodeOfRef(ref));
      if (!node) return true;
      const adj = new Map();
      const link = (a, b) => { if (!adj.has(a)) adj.set(a, []); if (!adj.has(b)) adj.set(b, []); adj.get(a).push(b); adj.get(b).push(a); };
      const srcNodes = new Set([0]);
      for (const e of this.c.els) {
        if (e.dead && e.dead !== 'short') continue;
        const t = e.type;
        if (t === 'R') { if (e.r < 1e9) link(e.na, e.nb); }
        else if (t === 'V') { if (e.rs < 1e9) { link(e.na, e.nb); srcNodes.add(e.na); srcNodes.add(e.nb); } }
        else if (t === 'SW') { if (e.closed) link(e.na, e.nb); }
        else if (t === 'D' || t === 'L' || t === 'F') link(e.na, e.nb);
        else if (t === 'C') { /* no hay camino continuo */ }
        else if (t === 'Q') { link(e.na, e.nc); link(e.nb, e.nc); }
        else if (t === 'M') { link(e.na, e.nc); }
      }
      const seen = new Set([node]), st = [node];
      while (st.length) { const n = st.pop(); if (srcNodes.has(n)) return false; for (const m of adj.get(n) || []) if (!seen.has(m)) { seen.add(m); st.push(m); } }
      return true;
    }

    /* ---------------- daños y avisos ---------------- */
    assess(dt) {
      const evs = this.events;
      let rebuild = false;
      this.stress = this.stress || {};
      for (const p of this.scene.parts || []) {
        const def = PT[p.type];
        if (p.dead) continue;
        let s = 0;
        try { s = def.stress ? def.stress(p, this.ctx) : 0; } catch (e) { s = 0; }
        if (!isFinite(s)) s = 0;
        p.stress = s;
        p.hot = Math.min(1.5, Math.max(0, s));
        if (dt > 0) {
          if (p.type === 'FUSE') {
            const I = Math.abs(this.c.find(p.id + ':main').i), r = PT.val(p, 'rating');
            const sf = I / r;
            p.stress = sf; p.hot = Math.min(1.5, sf * 0.7);
            if (!p.blown) { p.heat = Math.max(0, (p.heat || 0) + dt * (sf * sf - 1) * 1.2); if (p.heat > 1) { p.blown = true; evs.push({ part: p.id, kind: 'fusible', msg: 'El fusible ' + p.id + ' se fundió: pasaron ' + (I * 1000).toFixed(0) + ' mA.', t: this.t }); rebuild = true; } }
          } else if (def.stress) {
            p.dmg = (p.dmg || 0) + PT.KDMG * Math.max(0, s - 1) * dt;
            if (s <= 1 && p.dmg > 0) p.dmg = Math.max(0, p.dmg - 0.02 * dt); /* se enfría un poco */
            if (p.dmg >= 1 && def.deadKind) {
              p.dead = def.deadKind;
              evs.push({ part: p.id, kind: 'dead', msg: PT[p.type].label + ' ' + p.id + ' se dañó por ' + this.why(p, s) + '.', t: this.t });
              rebuild = true;
            }
          }
          if (p.type === 'LAMP') { const P = Math.abs(this.c.find(p.id + ':main').p), Pn = PT.val(p, 'vnom') * PT.val(p, 'inom'); p.heat = Math.min(1, (p.heat || 0) + (P / Pn - (p.heat || 0)) * Math.min(1, dt / 0.15)); }
          if (p.type === 'MOTOR' && def.step) def.step(p, this.ctx, dt);
          if (p.type === 'RELAY' && def.step) { const was = p.on; def.step(p, this.ctx, dt); if (was !== p.on) rebuild = false, this.updateParams(); }
          if (p.type === 'BAT') { const I = -this.c.find(p.id + ':src').i; p.charge = Math.max(0, (p.charge === undefined ? 1 : p.charge) - I * dt / (3600 * PT.val(p, 'cap'))); }
        }
      }
      /* pilas: un cortocircuito prolongado las recalienta */
      for (const p of this.scene.parts || []) {
        if (p.type !== 'BAT' || p.dead) continue;
        const e = this.c.find(p.id + ':src');
        if (e && -e.i > 2.0) {
          p.hotT = (p.hotT || 0) + (dt || 0); p.stress = Math.max(p.stress || 0, -e.i / 2); p.hot = Math.min(1.5, p.hotT / 1.5);
          if (p.hotT > 1.5) { p.dead = 'open'; evs.push({ part: p.id, kind: 'dead', msg: 'La pila se recalentó por el cortocircuito y quedó inservible. Una batería de litio, en el mismo caso, podría incendiarse.', t: this.t }); rebuild = true; }
        } else p.hotT = Math.max(0, (p.hotT || 0) - (dt || 0) * 0.5);
      }
      /* multímetros: fusible de la entrada de corriente */
      for (const mt of this.meters || []) {
        if (mt.mode !== 'A' || mt.blown) continue;
        const e = this.c.find('meter:' + mt.id);
        if (!e) continue;
        const I = Math.abs(e.i), rating = mt.jack === '10A' ? 10 : 0.2;
        if (I > rating * 1.05) {
          mt.over = (mt.over || 0) + (dt || 0.02);
          if (mt.over > 0.04) { mt.blown = true; evs.push({ part: mt.id, kind: 'fusemeter', msg: '¡Se quemó el fusible del multímetro! Por su entrada de corriente pasaron ' + (I >= 1 ? I.toFixed(1) + ' A' : (I * 1000).toFixed(0) + ' mA') + ' (el fusible aguanta ' + (rating >= 1 ? rating + ' A' : rating * 1000 + ' mA') + '). Nunca mida corriente en paralelo con una fuente.', t: this.t }); rebuild = true; }
        } else mt.over = 0;
      }
      /* pines de la placa: sobrecorriente */
      for (const id in this.mcuInfo) {
        const info = this.mcuInfo[id];
        info.deadPins = info.deadPins || {};
        info.stressPin = info.stressPin || {};
        for (const pid in info.pins) {
          if (info.deadPins[pid]) continue;
          const el = info.pins[pid];
          const I = Math.abs(el.i), lim = info.spec.imax;
          const vv = this.v(el.ref), ov = vv > info.spec.vabs + 0.3 ? 1 + (vv - info.spec.vabs) : 0;
          const sPin = Math.max(I / lim, ov);
          info.stressPin[pid] = sPin;
          if (dt > 0) {
            info.pdmg = info.pdmg || {};
            info.pdmg[pid] = (info.pdmg[pid] || 0) + PT.KDMG * Math.max(0, sPin - 1) * dt * 2;
            if (info.pdmg[pid] >= 1) { info.deadPins[pid] = true; evs.push({ part: id, kind: 'pin', pin: pid, msg: ov > I / lim ? 'El pin ' + pid + ' se dañó: recibió ' + vv.toFixed(1) + ' V y su máximo es ' + info.spec.vabs + ' V.' : 'El pin ' + pid + ' de la placa se quemó: pasaron ' + (I * 1000).toFixed(0) + ' mA (el máximo absoluto es ' + (lim * 1000).toFixed(0) + ' mA).', t: this.t }); }
          }
        }
      }
      /* fuentes: corriente excesiva / cortocircuito */
      this.shorts = [];
      for (const e of this.c.els) {
        if (e.type !== 'V' || !(e.role === 'src' || e.role === 'rail5' || e.role === 'rail3')) continue;
        const I = -e.i, ilim = this.limitOf(e);
        if (I > ilim * 0.999 && (e.cc || I > ilim)) {
          this.shorts.push({ id: e.id, i: I, lim: ilim });
          if (dt > 0 && !this.scene.noTrip) {
            e.over = (e.over || 0) + dt * (I / ilim);
            if (e.over > 0.6 && e.part) {
              const p = this.partById[e.part];
              if (p && p.type === 'USB' && !p.tripped) { p.tripped = true; evs.push({ part: p.id, kind: 'ptc', msg: 'El fusible reajustable (PTC) de la fuente USB se disparó: pasaron ' + (I * 1000).toFixed(0) + ' mA.', t: this.t }); rebuild = false; this.updateParams(); }
            }
            if (e.role === 'rail5' && e.over > 0.6) {
              const m = this.mcuInfo[e.id.split(':')[1]].m;
              if (!m.tripped) { m.tripped = true; evs.push({ part: m.id, kind: 'ptc', msg: 'El PTC de la placa se disparó por sobrecorriente (' + (I * 1000).toFixed(0) + ' mA): la placa se apagó.', t: this.t }); rebuild = true; }
            }
          }
        } else if (e.over) e.over = Math.max(0, e.over - dt * 0.5);
      }
      if (rebuild) {
        const saved = { x: this.c.x };
        this.build();
        this.solve(this.lastPins);
      }
    }
    limitOf(e) {
      if (e.role === 'rail5') return 0.5;
      if (e.role === 'rail3') return 0.15;
      const p = this.partById[e.part];
      if (!p) return 1;
      if (p.type === 'USB') return PT.val(p, 'ilimit');
      if (p.type === 'LAB') return PT.val(p, 'ilimit') * 3;
      if (p.type === 'BAT') return 1.0;
      return 1;
    }
    why(p, s) {
      const d = p.type;
      if (d === 'LED') return 'exceso de corriente (' + (Math.abs(this.partCurrent(p)) * 1000).toFixed(0) + ' mA) o tensión inversa';
      if (d === 'R') return 'exceso de potencia (' + (Math.abs(this.c.find(p.id + ':main').p) * 1000).toFixed(0) + ' mW en una resistencia de ' + PT.val(p, 'watt') * 1000 + ' mW)';
      if (d === 'ECAP') return 'polaridad invertida o sobretensión';
      return 'sobrecarga (' + s.toFixed(1) + '× su límite)';
    }
    /* Estado global para mostrar avisos */
    status() {
      const dead = (this.scene.parts || []).filter((p) => p.dead).map((p) => p.id);
      const hot = (this.scene.parts || []).filter((p) => !p.dead && p.stress > 1).map((p) => p.id);
      return { dead, hot, shorts: this.shorts || [], error: this.solveError || null };
    }
    /* Reemplaza las piezas dañadas */
    repairAll() {
      for (const p of this.scene.parts || []) { p.dead = false; p.dmg = 0; p.blown = false; p.heat = 0; p.tripped = false; p.hot = 0; }
      for (const m of this.scene.mcus || []) { m.tripped = false; }
      for (const id in this.mcuInfo) { this.mcuInfo[id].deadPins = {}; this.mcuInfo[id].pdmg = {}; }
      this.events.length = 0;
      this.scene._norm = false;
      this.build();
    }

    /* ---------------- multímetro ---------------- */
    /* Lectura de un multímetro de la escena (modo V, A, R, continuidad, diodo) */
    readMeter(mt) {
      const out = { mode: mt.mode, value: NaN, text: '', unit: '', beep: false, warn: null };
      if (!mt.red || !mt.black) { out.text = '----'; return out; }
      const a = this.nodeOfRef(mt.red), b = this.nodeOfRef(mt.black);
      if (mt.mode === 'V') {
        const v = this.c.v(this.c.names.get(a) || 0) - this.c.v(this.c.names.get(b) || 0);
        out.value = v; out.unit = 'V';
        if (Math.abs(v) < 0.0005) { out.value = 0; }
      } else if (mt.mode === 'A') {
        const e = this.c.find('meter:' + mt.id);
        out.value = e ? e.i : 0; out.unit = 'A';
        if (mt.blown) out.warn = 'Fusible del multímetro quemado: ya no mide corriente.';
      } else if (mt.mode === 'R' || mt.mode === 'CONT' || mt.mode === 'DIODE') {
        const r = this.testSource(a, b, mt.mode);
        Object.assign(out, r);
      }
      return out;
    }
    /* Mide con una fuente de prueba propia del multímetro entre los nodos a (rojo) y b (negro) */
    testSource(a, b, mode) {
      const c2 = new sp.Circuit();
      for (const e of this.c.els) {
        if (e.role === 'meter') continue;
        const cp = Object.assign({}, e, { vj: [0, 0] });
        c2.add(cp);
      }
      if (mode === 'DIODE') c2.add({ type: 'I', a: b, b: a, i: 0.001, id: 'test' }); /* 1 mA del rojo al negro */
      else c2.add(sp.V('test', a, b, 0.4, 1e-3));
      if (mode === 'DIODE') c2.add(sp.R('lim', a, b, 3000)); /* compliance ≈ 3 V */
      c2.solveDC();
      const out = { value: NaN, unit: 'Ω', beep: false };
      if (mode === 'DIODE') {
        const v = c2.v(c2.names.get(a) || 0) - c2.v(c2.names.get(b) || 0);
        out.unit = 'V'; out.value = v; out.open = v > 2.9;
        return out;
      }
      const t = c2.find('test');
      const I = -t.i;
      const R = I > 1e-12 ? 0.4 / I : Infinity;
      out.value = R; out.open = R > 40e6 || I < 1e-10;
      out.beep = mode === 'CONT' && R < 50;
      out.stray = this.c.els.some((e) => e.type === 'V' && e.role !== 'pin' && e.role !== 'drv' && Math.abs(e.v) > 0.5 && e.rs < 1e5);
      return out;
    }
  }
  EM.Bench = Bench;
})(typeof globalThis !== 'undefined' ? globalThis : window);
