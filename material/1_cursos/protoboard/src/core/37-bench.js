/* ===================================================================
   37-bench.js — El banco de trabajo (EM.Bench): escena (protoboard, piezas, cables, puntas),
   instrumentos (fuente, generador, multímetro, osciloscopio), traducción a EM.Net, avance en el
   tiempo, daños y lecturas. Sin DOM: se prueba en Node.
   =================================================================== */
(function (root) {
  'use strict';
  const EM = root.EM, PT = EM.parts, CAT = PT.CAT, S = EM.spice, BB = EM.bb;
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const P = BB.PITCH;
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  /* Anillo de muestras */
  class Ring {
    constructor(M) { this.M = M; this.buf = new Float32Array(M); this.n = 0; }
    push(v) { this.buf[this.n % this.M] = v; this.n++; }
    clear() { this.n = 0; this.buf.fill(0); }
    count() { return Math.min(this.n, this.M); }
    last(k) { const c = this.count(); k = Math.min(k, c); const out = new Float32Array(k); for (let i = 0; i < k; i++) out[i] = this.buf[(this.n - k + i) % this.M]; return out; }
  }
  EM.Ring = Ring;

  /* Estadísticas de una señal periódica (media, eficaz, frecuencia, ciclo de trabajo) usando ciclos completos */
  function sigStats(a, dt) {
    const n = a.length;
    if (!n) return null;
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < n; i++) { if (a[i] < mn) mn = a[i]; if (a[i] > mx) mx = a[i]; }
    const lev = (mn + mx) / 2, cr = [];
    if (mx - mn > 1e-6 * Math.max(1e-3, Math.abs(mx), Math.abs(mn))) for (let i = 1; i < n; i++) if (a[i - 1] < lev && a[i] >= lev) cr.push(i - (a[i] - lev) / (a[i] - a[i - 1]));
    let i0 = 0, i1 = n, f = NaN, duty = NaN;
    if (cr.length >= 2) {
      i0 = Math.ceil(cr[0]); i1 = Math.max(i0 + 1, Math.floor(cr[cr.length - 1]));
      const per = (cr[cr.length - 1] - cr[0]) / (cr.length - 1);
      f = 1 / (per * dt);
      let hi = 0; for (let i = i0; i < i1; i++) if (a[i] >= lev) hi++;
      duty = hi / Math.max(1, i1 - i0);
    }
    let s = 0, s2 = 0, m = 0;
    for (let i = i0; i < i1; i++) { s += a[i]; m++; }
    const mean = s / m;
    for (let i = i0; i < i1; i++) s2 += a[i] * a[i];
    let ac2 = 0; for (let i = i0; i < i1; i++) ac2 += (a[i] - mean) * (a[i] - mean);
    return { mn, mx, pp: mx - mn, mean, rms: Math.sqrt(s2 / m), rmsAC: Math.sqrt(ac2 / m), f, T: 1 / f, duty };
  }
  EM.sigStats = sigStats;

  /* ===================================================================
     Disposición del banco (mm)
     =================================================================== */
  function layout(cfg) {
    const boards = [];
    const kinds = cfg.boards && cfg.boards.length ? cfg.boards : ['half'];
    const has = (k) => (cfg.instruments || []).includes(k);
    let y = 26;
    kinds.forEach((kd, i) => { boards.push({ id: i ? 'bb' + (i + 1) : 'bb', kind: kd, x: 44, y }); y += BB.KINDS[kd].h + 12; });
    const b0 = boards[0], k0 = BB.KINDS[b0.kind];
    const right = b0.x + k0.w;
    const bottom = y - 12;
    const needR = has('dmm') || has('scope');
    const jx = right + 27;
    const jacks = {
      'ps1+': { x: 12, y: 24, color: '#d63a30', label: 'CH1 +', inst: 'psu' },
      'ps1-': { x: 12, y: 34, color: '#1d1d20', label: 'CH1 −', inst: 'psu' },
      psg: { x: 12, y: 45, color: '#2f9e44', label: '⏚', inst: 'psu' },
      'ps2+': { x: 12, y: 56, color: '#d63a30', label: 'CH2 +', inst: 'psu' },
      'ps2-': { x: 12, y: 66, color: '#1d1d20', label: 'CH2 −', inst: 'psu' },
      fgo: { x: b0.x + 18, y: 11, color: '#e6b800', label: 'OUT', inst: 'fg' },
      fgg: { x: b0.x + 30, y: 11, color: '#1d1d20', label: 'GND', inst: 'fg' },
      ac1: { x: 12, y: 86, color: '#e08a1e', label: '~ 1', inst: 'ac' },
      ac2: { x: 12, y: 96, color: '#e08a1e', label: '~ 2', inst: 'ac' }
    };
    const y0 = b0.y + 3;
    const probeJacks = {
      dmmR: { x: jx, y: y0, color: '#d63a30', label: 'V·Ω·A', inst: 'dmm' },
      dmmB: { x: jx, y: y0 + 11, color: '#1d1d20', label: 'COM', inst: 'dmm' },
      s1: { x: jx, y: y0 + 25, color: '#f2c200', label: 'CH1', inst: 'scope' },
      s1g: { x: jx, y: y0 + 36, color: '#1d1d20', label: 'GND', inst: 'scope' },
      s2: { x: jx, y: y0 + 49, color: '#17b3d6', label: 'CH2', inst: 'scope' },
      s2g: { x: jx, y: y0 + 60, color: '#1d1d20', label: 'GND', inst: 'scope' }
    };
    const stage = { x: needR ? right + 44 : right + 9, y: 22, w: 46, h: Math.max(50, bottom - 22) };
    const H = Math.max(bottom + 14, has('ac') ? 108 : 96);
    return { boards, jacks, probeJacks, stage, W: stage.x + stage.w + 4, H, right, needR };
  }

  /* ===================================================================
     Red del banco: hereda de EM.Net, pero las redes salen de la conectividad de la protoboard
     =================================================================== */
  class BenchNet extends EM.Net {
    constructor(bench, cfg) { super(cfg); this.bench = bench; }
    computeNets() {
      const C = this.bench.connectivity();
      const parent = new Map();
      const find = (a) => { let r = a; while (parent.get(r) !== r) r = parent.get(r); while (parent.get(a) !== r) { const n = parent.get(a); parent.set(a, r); a = n; } return r; };
      const add = (a) => { if (!parent.has(a)) parent.set(a, a); return a; };
      const uni = (a, b) => { a = find(add(a)); b = find(add(b)); if (a !== b) parent.set(a, b); };
      add('earth');
      for (const [a, b] of C.unions) uni(a, b);
      const gRoot = find('earth');
      const names = new Map();
      let n = 0;
      const nameOf = (k) => { const r = find(add(k)); if (r === gRoot) return '0'; if (!names.has(r)) names.set(r, 'n' + (++n)); return names.get(r); };
      const pinNet = {};
      for (const id in C.pinKeys) pinNet[id] = C.pinKeys[id].map(nameOf);
      const members = { get: () => 2 };
      this.netInfo = { pinNet, members, labelNet: {}, hasGround: true, nameOf, find };
      return this.netInfo;
    }
    get warnings() { return []; }
    /* Sobretensión y polaridad inversa de la alimentación de los circuitos integrados */
    metrics(Pp) {
      const m = super.metrics(Pp);
      const c = CAT[Pp.t];
      if (m && c.sup) {
        const vcc = this.vPin(Pp, c.sup[0]) - this.vPin(Pp, c.sup[1]);
        m.vrev = Math.max(m.vrev || 0, -vcc);
        m.v = Math.max(m.v || 0, Math.abs(vcc));
      }
      return m;
    }
    shortCircuit() {
      let worst = null;
      for (const Pp of this.doc.parts) {
        if (!/^(PSUC|BATP|FGB|ACT)$/.test(Pp.t)) continue;
        const r = this.rt[Pp.id];
        if (!r || !r.ref || !r.ref.main) continue;
        const e = r.ref.main;
        const i = Math.abs(e.type === 'V' ? e.i : 0);
        let lim = Pp.t === 'PSUC' ? Math.max(Pp.p.ilim * 1.5, 0.2) : Pp.t === 'FGB' ? 0.1 : Pp.t === 'ACT' ? 1.5 : 2.5;
        if (Pp.t === 'PSUC' && !Pp.p.on) continue;
        if (Pp.t === 'PSUC') { if (r.psu && r.psu.cc && i > 0.01) { const vs = Pp.p.v; if (!worst || i > worst.i) worst = { id: Pp.id, i, v: vs, cc: true }; } continue; }
        if (i > lim) { if (!worst || i > worst.i) worst = { id: Pp.id, i, v: Math.abs(e.v || 0), cc: false }; }
      }
      return worst;
    }
  }

  /* ===================================================================
     Banco
     =================================================================== */
  class Bench {
    constructor(cfg = {}) {
      this.cfg = Object.assign({ boards: ['half'], tdiv: 1e-3, speed: 1, damage: true, tolErr: false, par: false, thermalSpeed: 4, instruments: ['psu', 'fg', 'dmm', 'scope'], seed: 1 }, cfg);
      this.L = layout(this.cfg);
      this.scene = { boards: this.L.boards, parts: [], wires: [], probes: {}, faults: [] };
      this.inst = {
        ps: { 1: { v: 5, ilim: 0.5, on: false }, 2: { v: 5, ilim: 0.5, on: false } },
        fg: { wave: 'sin', f: 1000, amp: 1, off: 0, duty: 0.5, rs: 50, on: false },
        ac: { vrms: 12, f: 60, rs: 3, on: true },
        dmm: { mode: 'V=', jack: 'v', blown: { ma: false, a10: false } },
        osc: { tdiv: this.cfg.tdiv, ch: [{ vdiv: 1, pos: 0, cpl: 'dc', sw: 10, set: 10, on: true }, { vdiv: 1, pos: 0, cpl: 'dc', sw: 10, set: 10, on: true }], trig: { src: 0, level: 0, slope: 'up', mode: 'auto' }, mode: 'yt', hold: false }
      };
      this.has = (k) => this.cfg.instruments.includes(k);
      this.net = new BenchNet(this, { par: this.cfg.par, tolErr: this.cfg.tolErr, damage: this.cfg.damage, thermalSpeed: this.cfg.thermalSpeed, seed: this.cfg.seed, Ta: 25 });
      this.ip = {};
      this.N = 1000; this.M = 8192;
      this.rings = { c1: new Ring(this.M), c2: new Ring(this.M), dv: new Ring(this.M), di: new Ring(this.M) };
      this.dt = (10 * this.inst.osc.tdiv) / this.N;
      this.speed = this.cfg.speed;
      this.running = true;
      this.simT = 0; this.carry = 0;
      this.events = [];
      this.placeDirty = true; this.version = 0;
      this.tips = {};
      this.needZero = true;
      this.n = { id: {} };
      for (const [k, q] of Object.entries(this.L.probeJacks)) this.scene.probes[k] = [this.L.right + 9, q.y + 3];
      this.syncInst();
    }

    /* ---------- Referencias ---------- */
    get boards() { return this.scene.boards; }
    norm(ref) {
      if (typeof ref !== 'string') return ref;
      if (ref[0] === '@') return ref;
      if (ref.indexOf(':') < 0) return this.boards[0].id + ':' + ref;
      return ref;
    }
    refPos(ref) {
      if (ref[0] === '@') { const j = this.L.jacks[ref.slice(1)]; if (!j) throw new Error('Toma desconocida: ' + ref); return [j.x, j.y]; }
      return BB.holeWorld(this.boards, ref);
    }
    holeAt(x, y, tol) { return BB.holeAt(this.boards, x, y, tol); }
    isDead(ref) { return this.scene.faults.some((f) => f.kind === 'deadhole' && f.ref === ref); }
    holeKey(ref) { return this.isDead(ref) ? 'dead:' + ref : BB.stripKey(this.boards, ref); }

    /* ---------- Piezas ---------- */
    part(id) { return this.scene.parts.find((p) => p.id === id); }
    nextId(ct) {
      const pre = PT.PREFIX[ct] || 'X'; let k = 1;
      while (this.part(pre + k)) k++;
      return pre + k;
    }
    stageSpot() {
      const s = this.L.stage;
      const cells = [];
      for (let y = s.y + 13; y < s.y + s.h - 4; y += 15) for (let x = s.x + 6; x < s.x + s.w - 6; x += 17) cells.push([x, y]);
      const used = this.scene.parts.filter((p) => p._free).map((p) => this.partCenter(p));
      for (const c of cells) if (!used.some((u) => dist(u, c) < 11)) return c;
      return [s.x + 6 + Math.random() * (s.w - 12), s.y + 6 + Math.random() * (s.h - 12)];
    }
    partCenter(p) {
      if (!BB.TYPES[p.k]) { const j = this.L.jacks[{ PS1: 'ps1+', PS2: 'ps2+', FG1: 'fgo', AC1: 'ac1' }[p.id]] || { x: 12, y: 40 }; return [j.x + 4, j.y]; }
      const w = BB.pinsWorld(p);
      const pts = w.pkg.map((q) => [q.x, q.y]);
      return [pts.reduce((s, q) => s + q[0], 0) / pts.length, pts.reduce((s, q) => s + q[1], 0) / pts.length];
    }
    /* Celda k de la zona de piezas sueltas */
    stageCell(k) {
      const s = this.L.stage, cells = [];
      for (let y = s.y + 13; y < s.y + s.h - 4; y += 15) for (let x = s.x + 8; x < s.x + s.w - 6; x += 17) cells.push([x, y]);
      return cells[k % cells.length];
    }
    /* Deja la pieza sobre la mesa, centrada en c */
    placeFree(Pp, c) {
      const t = BB.TYPES[Pp.k], ct = t.ct;
      if (t.flex) {
        const n = CAT[ct].pins.length;
        if (t.flex.tether) {
          Pp.body = [c[0], c[1] - 2];
          Pp.pos = [[c[0] - 3.2, c[1] + 9], [c[0] + 3.2, c[1] + 9]].slice(0, n);
        } else Pp.pos = Array.from({ length: n }, (_, i) => [c[0] + (i - (n - 1) / 2) * t.flex.span * P, c[1]]);
      } else {
        const g = t.geo(Pp), ex = Math.max(...g.offs.map((o) => o[0]));
        Pp.at = [c[0] - ex / 2, c[1] + 3];
      }
      Pp._free = true;
    }
    /* Agrega una pieza nueva «sobre la mesa» (zona de piezas). */
    addPart(key, preset, at, id) {
      const t = BB.TYPES[key];
      const Pp = BB.newPart(key, id || this.nextId(t.ct), preset);
      this.placeFree(Pp, at || this.stageSpot());
      this.scene.parts.push(Pp);
      this.invalidate();
      return Pp;
    }
    removePart(id) {
      this.scene.parts = this.scene.parts.filter((p) => p.id !== id);
      delete this.net.rt[id];
      this.invalidate();
    }
    /* Coloca una pieza en agujeros concretos (usado por las especificaciones de los capítulos) */
    putPart(Pp, refs, opts = {}) {
      const t = BB.TYPES[Pp.k];
      if (t.flex) {
        const n = CAT[t.ct].pins.length;
        Pp.pos = [];
        for (let i = 0; i < n; i++) {
          const r = refs[i];
          if (r === null || r === undefined) Pp.pos.push([this.L.stage.x + 10 + i * 6, this.L.stage.y + 10]);
          else if (typeof r === 'string' && r.endsWith('^')) { const q = this.refPos(this.norm(r.slice(0, -1))); Pp.pos.push([q[0], q[1] - 4]); }
          else if (typeof r === 'string') Pp.pos.push(this.refPos(this.norm(r)));
          else Pp.pos.push([r[0], r[1]]);
        }
        if (t.flex.tether) {
          if (opts.body) Pp.body = opts.body;
          else {
            const a = Pp.pos[0], b = Pp.pos[1];
            Pp.body = [(a[0] + b[0]) / 2 - 12, Math.max(a[1], b[1]) + 21];
            if (opts.bodyAt) Pp.body = this.refPos(this.norm(opts.bodyAt));
          }
        }
      } else {
        const r = refs[0];
        Pp.at = typeof r === 'string' ? this.refPos(this.norm(r)) : [r[0], r[1]];
        if (opts.rot !== undefined) Pp.rot = opts.rot;
      }
      Pp._free = false;
      this.scene.parts.push(Pp);
    }

    /* ---------- Derivados de la colocación ---------- */
    place() {
      this.occ = new Map();
      this.issues = [];
      for (const Pp of this.scene.parts) {
        const w = BB.pinsWorld(Pp);
        Pp._w = w;
        const t = BB.TYPES[Pp.k];
        if (t.flex) {
          Pp._h = w.cat.map((q) => this.holeAt(q[0], q[1], 0.6));
          Pp._hp = null;
        } else {
          const hp = w.pkg.map((q) => this.holeAt(q.x, q.y, 0.6));
          const ok = hp.every((h) => h) && new Set(hp.map((h) => h.ref)).size === hp.length;
          Pp._hp = ok ? hp : null;
          Pp._h = w.cat.map((q, i) => { if (!ok) return null; const j = w.pkg.findIndex((pp) => pp.cat === i); return j >= 0 ? hp[j] : null; });
        }
        Pp._plugged = Pp._h.length > 0 && Pp._h.every((h) => h) && (BB.TYPES[Pp.k].flex ? true : !!Pp._hp);
        const pl = Pp._hp || Pp._h;
        pl.forEach((h, i) => {
          if (!h) return;
          if (this.occ.has(h.ref)) this.issues.push('Agujero ' + h.ref + ' ocupado dos veces (' + Pp.id + ')');
          this.occ.set(h.ref, { kind: 'pin', id: Pp.id, i });
        });
      }
      for (const w of this.scene.wires) for (const e of ['a', 'b']) {
        const r = w[e];
        try { this.refPos(r); } catch (er) { this.issues.push(er.message); continue; }
        if (r[0] === '@') continue;
        if (this.occ.has(r)) this.issues.push('Agujero ' + r + ' ocupado dos veces (cable ' + w.id + ')');
        this.occ.set(r, { kind: 'wire', id: w.id, end: e });
      }
      this.placeDirty = false;
    }
    /* Ocupación de un agujero por otra cosa distinta de «excl» */
    occupant(ref, exclPart, exclWire) {
      const o = this.occ && this.occ.get(ref);
      if (!o) return null;
      if (o.kind === 'pin' && o.id === exclPart) return null;
      if (o.kind === 'wire' && o.id === exclWire) return null;
      return o;
    }
    invalidate() { this.placeDirty = true; this.net.invalidate(); this.version++; }

    /* ---------- Cables y puntas ---------- */
    addWire(a, b, color, id) {
      a = this.norm(a); b = this.norm(b);
      const w = { id: id || 'w' + (1 + this.scene.wires.reduce((m, q) => Math.max(m, +String(q.id).slice(1) || 0), 0)), a, b, color: color || this.autoColor(a, b) };
      this.scene.wires.push(w);
      this.invalidate();
      return w;
    }
    autoColor(a, b) {
      const j = [a, b].filter((r) => r[0] === '@').map((r) => r.slice(1));
      for (const k of j) { if (/\+$/.test(k)) return 'red'; if (/-$/.test(k) || k === 'psg') return 'black'; if (k === 'fgo') return 'yellow'; if (k === 'fgg') return 'black'; }
      for (const r of [a, b]) { const m = /:([TB])\+/.exec(r); if (m) return 'red'; if (/:[TB]-/.test(r)) return 'black'; }
      return ['blue', 'green', 'orange', 'white', 'yellow', 'brown'][this.scene.wires.length % 6];
    }
    removeWire(id) { this.scene.wires = this.scene.wires.filter((w) => w.id !== id); this.invalidate(); }
    wire(id) { return this.scene.wires.find((w) => w.id === id); }
    setProbe(name, x, y) {
      const before = this.touch(this.scene.probes[name]).key;
      const h = this.holeAt(x, y, 1.6);
      this.scene.probes[name] = h ? [h.x, h.y] : [x, y];
      if (this.touch(this.scene.probes[name]).key !== before) { this.net.invalidate(); this.version++; }
    }
    /* Tras mover piezas: recalcula la colocación y solo reconstruye el circuito si cambió alguna conexión */
    refreshPlacement() {
      this.place();
      let sig = '';
      for (const Pp of this.scene.parts) sig += Pp.id + ':' + (Pp._hp || Pp._h).map((h) => (h ? h.ref : '-')).join(',') + ';';
      for (const w of this.scene.wires) sig += w.id + w.a + w.b + ';';
      for (const k in this.scene.probes) sig += k + this.touch(this.scene.probes[k]).key + ';';
      if (sig !== this._sig) { this._sig = sig; this.net.invalidate(); this.version++; return true; }
      return false;
    }
    /* Salida real de un canal de la fuente */
    psuOut(ch) {
      this.ensure();
      const st = this.inst.ps[ch], id = 'PS' + ch, r = this.net.rt[id];
      if (!this.has('psu') || !st.on || !r || !r.ref || !r.ref.main) return { on: false, v: 0, i: 0, cc: false };
      const P_ = this.ip[id], v = this.net.vDiff(P_, 0, 1), cc = !!(r.psu && r.psu.cc);
      const i = cc ? st.ilim : -(r.ref.main.i || 0);
      return { on: true, v, i: Math.max(0, i), cc };
    }
    /* Qué toca una punta en (x,y): agujero, pata libre o toma de un instrumento */
    touch(pos) {
      const h = this.holeAt(pos[0], pos[1], 1.1);
      if (h) return { key: this.holeKey(h.ref), ref: h.ref };
      for (const Pp of this.scene.parts) {
        if (!Pp._w) continue;
        for (let i = 0; i < Pp._w.cat.length; i++) {
          const q = Pp._w.cat[i];
          if (q && !(Pp._h && Pp._h[i]) && dist(q, pos) < 2.4) return { key: 'pin:' + Pp.id + ':' + i, part: Pp.id, pin: i };
        }
      }
      for (const [nm, j] of Object.entries(this.L.jacks)) if (dist([j.x, j.y], pos) < 3.4) return { key: 'j:' + nm, jack: nm };
      return { key: null };
    }
    endKey(ref) { return ref[0] === '@' ? 'j:' + ref.slice(1) : this.holeKey(ref); }

    /* ---------- Instrumentos como piezas ocultas ---------- */
    instPart(id, t, p) {
      let q = this.ip[id];
      if (!q) q = this.ip[id] = { id, k: t, t, rot: 0, flip: false, x: 0, y: 0, p: {}, hidden: true };
      q.p = Object.assign({}, CAT[t].defaults, p);
      return q;
    }
    syncInst() {
      const I = this.inst;
      if (this.has('psu')) { this.instPart('PS1', 'PSUC', I.ps[1]); this.instPart('PS2', 'PSUC', I.ps[2]); }
      if (this.has('fg')) this.instPart('FG1', 'FGB', I.fg);
      if (this.has('ac')) this.instPart('AC1', 'ACT', I.ac);
      if (this.has('dmm')) this.instPart('DMM1', 'DMMB', I.dmm);
      if (this.has('scope')) this.instPart('OSC1', 'SCOPEB', { sw1: I.osc.ch[0].sw, sw2: I.osc.ch[1].sw });
    }
    docParts() {
      const arr = [...this.scene.parts];
      for (const id of ['PS1', 'PS2', 'FG1', 'AC1', 'DMM1', 'OSC1']) if (this.ip[id] && this.instOn(id)) arr.push(this.ip[id]);
      return arr;
    }
    instOn(id) { return (/^PS/.test(id) && this.has('psu')) || (id === 'FG1' && this.has('fg')) || (id === 'AC1' && this.has('ac')) || (id === 'DMM1' && this.has('dmm')) || (id === 'OSC1' && this.has('scope')); }

    /* ---------- Conectividad ---------- */
    connectivity() {
      if (this.placeDirty) this.place();
      const unions = [], pinKeys = {};
      for (const Pp of this.scene.parts) {
        pinKeys[Pp.id] = Pp._h.map((h, i) => (h ? this.holeKey(h.ref) : 'pin:' + Pp.id + ':' + i));
      }
      for (const w of this.scene.wires) {
        if (this.scene.faults.some((f) => f.kind === 'wirebreak' && f.id === w.id)) continue;
        unions.push([this.endKey(w.a), this.endKey(w.b)]);
      }
      if (this.has('psu')) { pinKeys.PS1 = ['j:ps1+', 'j:ps1-']; pinKeys.PS2 = ['j:ps2+', 'j:ps2-']; unions.push(['earth', 'j:psg']); }
      if (this.has('fg')) { pinKeys.FG1 = ['j:fgo', 'j:fgg']; unions.push(['earth', 'j:fgg']); }
      if (this.has('ac')) pinKeys.AC1 = ['j:ac1', 'j:ac2'];
      const T = (nm) => { const t = this.touch(this.scene.probes[nm]); return t.key || 'free:' + nm; };
      this.tipKeys = {};
      if (this.has('dmm')) { pinKeys.DMM1 = [T('dmmR'), T('dmmB')]; this.tipKeys.dmmR = pinKeys.DMM1[0]; this.tipKeys.dmmB = pinKeys.DMM1[1]; }
      if (this.has('scope')) {
        pinKeys.OSC1 = [T('s1'), T('s2'), 'earth'];
        unions.push(['earth', T('s1g')], ['earth', T('s2g')]);
        this.tipKeys.s1 = pinKeys.OSC1[0]; this.tipKeys.s2 = pinKeys.OSC1[1];
      }
      return { unions, pinKeys };
    }

    /* ---------- Construcción y estado ---------- */
    rebuild() {
      this.syncInst();
      if (this.placeDirty) this.place();
      const net = this.net;
      net.doc.parts = this.docParts();
      net.assignTol();
      net.rebuild();
      const info = net.netInfo;
      this.tips = {};
      for (const k in this.tipKeys) this.tips[k] = info.nameOf(this.tipKeys[k]);
      const cir = net.cir;
      if (this.needZero || !cir.x || !net.dyn) {
        const ok = cir.solveDC(); this.needZero = false;
        /* si el punto de operación no converge en un circuito dinámico, se arranca desde el reposo y se deja que el transitorio lo encuentre */
        if (!ok && net.dyn) { for (const e of cir.els) { if (e.type === 'C' || e.type === 'L') { e.vprev = 0; e.iprev = 0; } } cir.x = new Float64Array(cir.N); cir.t = 0; cir.restart = true; }
      } else if (!cir.x) cir.solveDC();
      this.dirtyView = true;
    }
    ensure() { if (this.net.dirty || !this.net.cir) this.rebuild(); }
    /* Voltaje en un agujero / toma / punta */
    vRef(ref) { this.ensure(); return this.net.v(this.net.netInfo.nameOf(this.endKey(this.norm(ref)))); }
    vBetween(a, b) { return this.vRef(a) - this.vRef(b); }
    iPart(id) { this.ensure(); const Pp = this.part(id); return Pp ? this.net.iPart(Pp) : 0; }
    vPart(id, i = 0, j = 1) { this.ensure(); const Pp = this.part(id); return Pp ? this.net.vDiff(Pp, i, j) : 0; }
    info(Pp) {
      this.ensure();
      const r = this.net.rt[Pp.id] || {};
      let v = 0;
      try { v = this.net.vDiff(Pp, 0, 1); } catch (e) { v = 0; }
      return { v, i: this.net.iPart(Pp), T: r.T, pw: r.pw || 0, dm: r.dm || 0, dead: Pp.dead };
    }

    /* ---------- Muestreo y avance ---------- */
    setTdiv(t) {
      this.inst.osc.tdiv = t; this.dt = (10 * t) / this.N;
      for (const k in this.rings) this.rings[k].clear();
      this.carry = 0;
      if (!this.noPrefill && this.net.dyn && this.net.cir && this.net.cir.x) this.fastForward(3 * this.N * this.dt);
    }
    sampleOnce() {
      const net = this.net, T = this.tips, I = this.inst;
      if (T.s1 !== undefined) { this.rings.c1.push(net.v(T.s1)); this.rings.c2.push(net.v(T.s2)); }
      for (const Pp of this.scene.parts) if (Pp.t === 'SPK' && !Pp.dead && Pp._plugged) this.spkRing(Pp.id).push(net.vDiff(Pp, 0, 1));
      if (T.dmmR !== undefined) {
        this.rings.dv.push(net.v(T.dmmR) - net.v(T.dmmB));
        const e = net.rt.DMM1 && net.rt.DMM1.ref && net.rt.DMM1.ref.main;
        this.rings.di.push(e ? e.i || 0 : 0);
      }
    }
    spkRing(id) { return (this.spk = this.spk || {})[id] || (this.spk[id] = new Ring(2048)); }
    zeroState() {
      const c = this.net.cir;
      for (const e of c.els) {
        if (e.type === 'C' || e.type === 'L') { e.vprev = 0; e.iprev = 0; if (e.type === 'C' && e.ic0 !== undefined) e.vprev = e.ic0; }
        if (e.type === 'X') { e.iw = e.wn.map(() => 0); e.vw = e.wn.map(() => 0); }
        if (e.type === 'OA') e.y = 0;
      }
      if (c.x) c.x.fill(0);
      c.t = 0; c.restart = true;
    }
    reset() {
      this.net.invalidate();
      for (const m of Object.values(this.net.rt)) { m.acc = null; if (m.lamp) m.lamp.th = 0.11; if (m.motor) m.motor.w = 0; if (m.t555) m.t555.q = 1; if (m.scr) m.scr.on = false; if (m.relay) m.relay.on = false; if (m.psu) m.psu.cc = false; }
      this.needZero = true;
      this.rebuild();
      if (this.net.dyn && this.zeroOnReset) this.zeroState();
      for (const k in this.rings) this.rings[k].clear();
      this.simT = 0; this.carry = 0;
    }
    fastForward(Tsec) {
      this.ensure();
      const net = this.net;
      if (!net.dyn || !net.cir || !net.cir.x) return;
      const win = this.N * this.dt;
      const dtj = Math.max(this.dt, Tsec / 20000);
      const n = Math.ceil(Math.max(0, Tsec - 3 * win) / dtj);
      for (let k = 0; k < n; k++) { if (!net.step(dtj)) break; net.accumulate(dtj); }
      for (const k in this.rings) this.rings[k].clear();
      const nw = Math.ceil(Math.min(Tsec, 3 * win) / this.dt);
      for (let k = 0; k < nw; k++) { if (!net.step(this.dt)) break; this.sampleOnce(); net.accumulate(this.dt); }
      this.simT = net.cir.t;
    }
    /* Un cuadro de simulación; dtw: segundos reales */
    frame(dtw) {
      const net = this.net;
      this.ensure();
      if (!net.cir || !net.cir.x) return;
      if (this.running) {
        const win = this.N * this.dt;
        if (net.dyn) {
          /* tiempo real: speed segundos simulados por segundo real; si no alcanza el cálculo, la simulación se hace más lenta */
          const want = (this.speed * dtw) / this.dt + this.carry;
          let steps = Math.floor(want); this.carry = want - steps;
          if (steps > 8000) { steps = 8000; this.carry = 0; }
          const t0 = nowMs();
          let fails = 0, done = 0;
          for (let k = 0; k < steps; k++) {
            if (!net.step(this.dt)) { fails++; if (fails > 3) break; continue; }
            this.sampleOnce();
            net.accumulate(this.dt);
            done++;
            if (!this.noBudget && (done & 15) === 0 && nowMs() - t0 > 9) { this.carry = 0; break; }
          }
          this.simT = net.cir.t;
          if (fails > 3) net.cir.restart = true;
        } else {
          this.carry += (win / 1.5) * this.speed * dtw / this.dt;
          const steps = Math.min(Math.floor(this.carry), this.N); this.carry = 0;
          for (let k = 0; k < steps; k++) this.sampleOnce();
          net.accumulate(dtw);
        }
        const failed = net.tick(dtw);
        if (net.tchg) { net.tchg = false; if (!net.dyn && net.cir) net.cir.solveDC(); }
        this.checkFuses();
        if (failed.length) for (const Pp of failed) this.events.push({ kind: 'fail', id: Pp.id, t: Pp.t, why: Pp.dead.why, desc: Pp.dead.desc, pos: this.partCenter(Pp) });
        if (net.dirty) this.rebuild();
        this.shortInfo = net.shortCircuit();
      }
    }
    /* Fusibles del multímetro: 0,2 A (toma mA) y 10 A (toma 10 A) */
    checkFuses() {
      const D = this.inst.dmm;
      if (!this.has('dmm') || D.jack === 'v') return;
      const r = this.net.rt.DMM1, e = r && r.ref && r.ref.main;
      if (!e) return;
      const lim = D.jack === 'ma' ? 0.2 : 10;
      if (Math.abs(e.i || 0) > lim * 1.1) {
        D.blown[D.jack] = true;
        this.events.push({ kind: 'fuse', id: 'DMM1', jack: D.jack, desc: 'Se fundió el fusible de ' + (D.jack === 'ma' ? '0,2 A (toma mA)' : '10 A (toma 10 A)') + ' del multímetro.' });
        this.net.invalidate();
      }
    }
    repairAll() {
      this.net.repairAll();
      for (const Pp of this.scene.parts) { Pp.dead = null; Pp.fault = null; }
      this.inst.dmm.blown = { ma: false, a10: false };
      this.events = [];
      this.net.alerts = [];
      this.invalidate();
    }

    /* ---------- Lecturas del multímetro ---------- */
    readDMM() {
      this.ensure();
      const D = this.inst.dmm, mode = D.mode, net = this.net;
      const out = { mode, text: '0.000', unit: '', ol: false, beep: false, note: '' };
      const Pp = this.ip.DMM1;
      const nR = this.tips.dmmR, nB = this.tips.dmmB;
      const win = this.rings.dv.last(Math.min(this.rings.dv.count(), 4000));
      const winI = this.rings.di.last(Math.min(this.rings.di.count(), 4000));
      const touching = this.tipKeys.dmmR && !/^free:/.test(this.tipKeys.dmmR) && this.tipKeys.dmmB && !/^free:/.test(this.tipKeys.dmmB);
      const live = (r) => Math.abs(net.v(nR) - net.v(nB));
      const dynamic = net.dyn;
      if (D.jack !== 'v' && /^V|Ω|→|·/.test(mode)) out.note = 'La punta roja está en la toma de corriente (' + (D.jack === 'ma' ? 'mA' : '10 A') + '): el multímetro actúa como un cable.';
      const blown = (D.jack === 'ma' && D.blown.ma) || (D.jack === 'a10' && D.blown.a10);
      if (/^V/.test(mode)) {
        if (D.jack !== 'v') { out.value = 0; out.unit = 'V'; return this.fmtDMM(out, 0, 'V'); }
        const st = dynamic && win.length ? sigStats(win, this.dt) : null;
        const v = net.v(nR) - net.v(nB);
        const val = mode === 'V=' ? (st ? st.mean : v) : (st ? st.rmsAC : 0);
        out.unit = 'V'; return this.fmtDMM(out, val, 'V');
      }
      if (/^A/.test(mode)) {
        out.unit = 'A';
        if (D.jack === 'v') { out.note = 'Para medir corriente la punta roja debe ir en la toma mA o 10 A.'; return this.fmtDMM(out, 0, 'A'); }
        if (blown) { out.note = 'Fusible fundido: reemplácelo.'; return this.fmtDMM(out, 0, 'A'); }
        const st = dynamic && winI.length ? sigStats(winI, this.dt) : null;
        const e = net.rt.DMM1 && net.rt.DMM1.ref && net.rt.DMM1.ref.main;
        const i = e ? e.i || 0 : 0;
        const val = mode === 'A=' ? (st ? st.mean : i) : (st ? st.rmsAC : 0);
        return this.fmtDMM(out, val, 'A');
      }
      /* Ω, diodo y continuidad: el multímetro inyecta su propia corriente */
      if (D.jack !== 'v') { out.ol = true; out.text = 'OL'; out.unit = '—'; return out; }
      const vlive = live();
      const r = net.measureOhms(Pp, mode === '→|');
      if (mode === 'Ω' || mode === '·)))') {
        if (vlive > 0.6) { out.text = 'Err'; out.unit = ''; out.note = 'El circuito está energizado: apáguelo antes de medir resistencia.'; out.warn = true; return out; }
        if (mode === '·)))') { out.beep = r.r < 50 && !r.ol; out.unit = 'Ω'; return this.fmtDMM(out, r.ol ? Infinity : r.r, 'Ω', true); }
        out.unit = 'Ω'; return this.fmtDMM(out, r.ol ? Infinity : r.r, 'Ω');
      }
      if (mode === '→|') {
        if (vlive > 0.6) { out.text = 'Err'; out.note = 'El circuito está energizado.'; out.warn = true; return out; }
        out.unit = 'V';
        if (r.ol) { out.text = 'OL'; out.ol = true; return out; }
        out.text = Math.min(3, Math.max(0, r.v)).toFixed(3); out.value = r.v; return out;
      }
      return out;
    }
    /* Pantalla de 3 ½ dígitos (4000 cuentas) con autorango */
    fmtDMM(out, val, unit, cont) {
      out.value = val;
      if (!isFinite(val)) { out.text = 'OL'; out.ol = true; out.unit = unit; return out; }
      const sgn = val < 0 ? '-' : '';
      let a = Math.abs(val);
      const ranges = unit === 'Ω' ? [[400, 1, 'Ω'], [4e3, 1e-3, 'kΩ'], [4e4, 1e-3, 'kΩ'], [4e5, 1e-3, 'kΩ'], [4e6, 1e-6, 'MΩ'], [4e7, 1e-6, 'MΩ']]
        : unit === 'V' ? [[0.4, 1e3, 'mV'], [4, 1, 'V'], [40, 1, 'V'], [400, 1, 'V'], [1000, 1, 'V']]
        : [[0.0004, 1e6, 'µA'], [0.004, 1e3, 'mA'], [0.04, 1e3, 'mA'], [0.4, 1e3, 'mA'], [4, 1, 'A'], [10, 1, 'A']];
      let rg = ranges[ranges.length - 1];
      for (const r of ranges) if (a < r[0] * 0.9995) { rg = r; break; }
      if (a >= rg[0] * 1.0005 && rg === ranges[ranges.length - 1]) { out.text = 'OL'; out.ol = true; out.unit = unit; return out; }
      const sc = a * rg[1];
      /* dígitos: 3 ½ → 3 cifras significativas + el «½» */
      const full = rg[0] * rg[1];
      const dec = full >= 1000 ? 0 : full >= 100 ? 1 : full >= 10 ? 2 : 3;
      let txt = sc.toFixed(dec);
      if (unit === 'Ω' && rg[2] === 'Ω') txt = sc.toFixed(1);
      out.text = sgn + txt; out.unit = rg[2];
      return out;
    }
    /* Resumen de revisión del montaje: avisos didácticos */
    check() {
      this.ensure();
      const out = [];
      for (const Pp of this.scene.parts) {
        const t = BB.TYPES[Pp.k];
        if (!Pp._h) continue;
        const unplug = Pp._h.filter((h) => !h).length;
        if (unplug === Pp._h.length) continue;
        if (unplug) out.push({ id: Pp.id, kind: 'warn', text: Pp.id + ' tiene ' + unplug + ' pata(s) sin insertar.' });
        const keys = Pp._h.filter((h) => h).map((h) => this.holeKey(h.ref));
        if (t.flex && keys.length === 2 && keys[0] === keys[1]) out.push({ id: Pp.id, kind: 'warn', text: Pp.id + ' tiene las dos patas en la misma tira: está en cortocircuito.' });
      }
      return out;
    }

    /* ---------- Guardar y cargar ---------- */
    toJSON() {
      const keep = (k, v) => (k[0] === '_' || k === 'issues' ? undefined : v);
      return JSON.parse(JSON.stringify({ scene: this.scene, inst: this.inst }, keep));
    }
    fromJSON(o) {
      this.scene = Object.assign({ boards: this.L.boards, parts: [], wires: [], probes: this.scene.probes, faults: [] }, o.scene);
      this.scene.boards = this.L.boards;
      Object.assign(this.inst.ps[1], o.inst.ps[1]); Object.assign(this.inst.ps[2], o.inst.ps[2]);
      Object.assign(this.inst.fg, o.inst.fg); if (o.inst.ac) Object.assign(this.inst.ac, o.inst.ac); Object.assign(this.inst.dmm, o.inst.dmm);
      Object.assign(this.inst.osc, o.inst.osc);
      this.net.rt = {};
      this.invalidate();
    }

    /* ---------- Carga desde una especificación compacta ----------
       spec = { parts:[ [id, clave, props, ...refs] | {…} ], wires:[ [a, b, color?] ], probes:{dmmR:'e5',…},
                psu:{1:{v,ilim,on}}, fg:{…}, dmm:{…}, osc:{…}, faults:[…] } */
    loadSpec(spec) {
      this.scene.parts = []; this.scene.wires = []; this.scene.faults = [];
      for (const it of spec.parts || []) {
        let id, key, props, refs, opts = {};
        if (Array.isArray(it)) { [id, key, props] = it; refs = it.slice(3); const last = refs[refs.length - 1]; if (last && typeof last === 'object' && !Array.isArray(last) && last.st === undefined) { opts = last; refs = refs.slice(0, -1); } }
        else { id = it.id; key = it.k; props = it.p; refs = it.pins || [it.at]; opts = it; }
        const Pp = BB.newPart(key, id, props);
        if (opts.fault) Pp.fault = opts.fault;
        if (refs[0] && typeof refs[0] === 'object' && refs[0].st !== undefined) { this.placeFree(Pp, this.stageCell(refs[0].st)); this.scene.parts.push(Pp); } else this.putPart(Pp, refs, opts);
        if (opts.label) Pp.label = opts.label;
        if (opts.pressed) Pp.p.on = true;
      }
      for (const w of spec.wires || []) this.scene.wires.push({ id: 'w' + (this.scene.wires.length + 1), a: this.norm(w[0]), b: this.norm(w[1]), color: w[2] || this.autoColor(this.norm(w[0]), this.norm(w[1])), slack: w[3] });
      for (const [k, v] of Object.entries(spec.probes || {})) {
        if (typeof v === 'string') this.scene.probes[k] = this.refPos(this.norm(v));
        else if (Array.isArray(v)) this.scene.probes[k] = v;
      }
      if (spec.psu) for (const k of [1, 2]) if (spec.psu[k]) Object.assign(this.inst.ps[k], spec.psu[k]);
      if (spec.fg) Object.assign(this.inst.fg, spec.fg);
      if (spec.ac) Object.assign(this.inst.ac, spec.ac);
      if (spec.dmm) Object.assign(this.inst.dmm, spec.dmm);
      if (spec.osc) {
        const o = spec.osc;
        if (o.tdiv) this.setTdiv(o.tdiv);
        o.ch && o.ch.forEach((c, i) => Object.assign(this.inst.osc.ch[i], c));
        if (o.trig) Object.assign(this.inst.osc.trig, o.trig);
        if (o.mode) this.inst.osc.mode = o.mode;
      }
      for (const f of spec.faults || []) this.scene.faults.push(Object.assign({}, f, f.ref ? { ref: this.norm(f.ref) } : {}));
      this.net.rt = {};
      this.placeDirty = true;
      this.place();
      this.net.invalidate();
      this.needZero = true;
      return this;
    }
  }

  Bench.layout = layout;
  EM.Bench = Bench;
  EM.BenchNet = BenchNet;
})(typeof globalThis !== 'undefined' ? globalThis : window);
