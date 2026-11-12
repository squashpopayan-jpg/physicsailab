/* ===================================================================
   45-lab.js — El laboratorio (EM.Lab.mount): protoboard interactiva con piezas que se arrastran,
   cables y puntas que se mueven, instrumentos, efectos de calor y daño, bandeja de piezas,
   propiedades, metas y lecturas. Sin dependencias fuera de EM.
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM, BB = EM.bb, DW = EM.dw, FX = EM.fx, PT = EM.parts, CAT = PT.CAT, el = EM.el;
  const TAU = Math.PI * 2;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const LS = 'pl:';
  EM.Lab = {};

  /* ---------- Sonido ---------- */
  const AU = (EM.audio = { ctx: null, on: false, osc: null, gain: null, f: 0 });
  AU.enable = function (on) {
    AU.on = on;
    if (on && !AU.ctx) {
      try {
        AU.ctx = new (window.AudioContext || window.webkitAudioContext)();
        AU.gain = AU.ctx.createGain(); AU.gain.gain.value = 0; AU.gain.connect(AU.ctx.destination);
        AU.osc = AU.ctx.createOscillator(); AU.osc.type = 'square'; AU.osc.frequency.value = 440; AU.osc.connect(AU.gain); AU.osc.start();
      } catch (e) { AU.on = false; }
    }
    if (!on && AU.gain) AU.gain.gain.value = 0;
  };
  AU.tone = function (f, a) {
    if (!AU.on || !AU.ctx) return;
    if (f > 0) { AU.osc.frequency.setTargetAtTime(clamp(f, 40, 12000), AU.ctx.currentTime, 0.01); AU.gain.gain.setTargetAtTime(a === undefined ? 0.04 : a, AU.ctx.currentTime, 0.01); } else AU.gain.gain.setTargetAtTime(0, AU.ctx.currentTime, 0.02);
  };
  AU.pop = function () {
    if (!AU.on || !AU.ctx) return;
    const c = AU.ctx, n = c.createBufferSource(), b = c.createBuffer(1, c.sampleRate * 0.25, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (c.sampleRate * 0.035));
    n.buffer = b; const g = c.createGain(); g.gain.value = 0.35; n.connect(g); g.connect(c.destination); n.start();
  };
  EM.beep = (f) => AU.tone(f, 0.05);

  const ICO = {
    undo: '<svg viewBox="0 0 16 16"><path d="M5 3 2 6l3 3M2 6h7a4 4 0 0 1 0 8H6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    redo: '<svg viewBox="0 0 16 16"><path d="M11 3l3 3-3 3M14 6H7a4 4 0 0 0 0 8h3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    rot: '<svg viewBox="0 0 16 16"><path d="M13 8a5 5 0 1 1-1.6-3.7M13 2v3.5h-3.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    del: '<svg viewBox="0 0 16 16"><path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    fit: '<svg viewBox="0 0 16 16"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    plus: '<svg viewBox="0 0 16 16"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    minus: '<svg viewBox="0 0 16 16"><path d="M3 8h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    fix: '<svg viewBox="0 0 16 16"><path d="M10.5 2.5a3.5 3.5 0 0 0-3.2 4.8L2.5 12.1l1.4 1.4 4.8-4.8a3.5 3.5 0 0 0 4.8-3.2l-2 2-1.8-.4-.4-1.8z" fill="currentColor"/></svg>',
    check: '<svg viewBox="0 0 16 16"><path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    sound: '<svg viewBox="0 0 16 16"><path d="M2.5 6v4h2.6L9 13V3L5.1 6zM11 5.5a3.5 3.5 0 0 1 0 5M12.8 3.6a6 6 0 0 1 0 8.8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    bolt: '<svg viewBox="0 0 16 16"><path d="M9 1L3 9h4l-1 6 7-9H9z" fill="currentColor"/></svg>'
  };

  class Lab {
    constructor(sim, cfg) {
      this.sim = sim;
      const c = (this.cfg = Object.assign({ aspect: 1.8, edit: 'full', instruments: ['psu', 'fg', 'dmm', 'scope'], tray: true, tdiv: 1e-3, goals: [], controls: [], outs: [], faults: [], thermal: 4, labels: true }, cfg));
      this.bench = new EM.Bench({ boards: c.boards || ['half'], instruments: c.instruments, tdiv: c.tdiv, thermalSpeed: c.thermal, damage: c.damage !== false, tolErr: !!c.tolErr, par: !!c.par });
      this.edit = c.edit;
      this.view = { s: 3, ox: 0, oy: 0 };
      this.sel = null; this.hover = null; this.drag = null; this.hist = []; this.future = [];
      this.particles = new FX.Particles();
      this.t = 0; this.dtDraw = 0.016;
      this.showVolts = !!c.volts; this.thermalView = false; this.labels = c.labels; this.showPins = true;
      this.toast = []; this.msg = null;
      if (c.spec) this.bench.loadSpec(c.spec);
      else if (c.autosave) { try { const s = localStorage.getItem(LS + c.autosave); if (s) this.bench.fromJSON(JSON.parse(s)); } catch (e) { /* sin almacenamiento */ } }
      this.bench.zeroOnReset = !!c.startZero; this.bench.noPrefill = !!c.startZero;
      this.bench.rebuild();
      if (c.startZero && this.bench.net.dyn) this.bench.zeroState();
      if (!this.bench.noPrefill && this.bench.net.dyn) this.bench.fastForward(3 * this.bench.N * this.bench.dt);
      this.buildDOM();
      this.fit();
      sim.onDraw(() => this.drawAll());
      sim.animate((dt) => this.frame(dt), { autoplay: c.autoplay !== false });
      sim.resetButton(() => this.reset());
    }

    /* ======================= DOM ======================= */
    buildDOM() {
      const sim = this.sim, c = this.cfg;
      this.root = el('div', 'bl-root'); sim.stage.append(this.root);
      this.bar = el('div', 'bl-bar'); this.root.append(this.bar);
      this.trayBox = el('div', 'bl-tray'); this.root.append(this.trayBox);
      this.cv = sim.canvas({ parent: this.root, aspect: c.aspect, label: 'Banco de trabajo con protoboard', cls: 'bl-main' });
      const cv = this.cv.el; cv.tabIndex = 0; cv.style.touchAction = 'none'; cv.style.outline = 'none';
      this.banner = el('div', 'bl-banner'); this.banner.hidden = true; this.cv.wrap.append(this.banner);
      this.tip = el('div', 'bl-tip'); this.tip.hidden = true; this.cv.wrap.append(this.tip);
      this.toastBox = el('div', 'bl-toasts'); this.cv.wrap.append(this.toastBox);
      if (c.hint) this.hintEl = sim.hint(c.hint, this.cv);
      this.cv.onResize = () => { if (!this._fitted) this.fit(); };
      this.buildBar(); this.buildTray(); this.bindEvents();
      this.inst = c.instruments.length ? EM.Inst.mount(this.bench, this.root, sim, c.instruments.filter((k) => ['psu', 'ac', 'fg', 'dmm', 'scope'].includes(k))) : null;
      if (c.showInst) this.inst.show(c.showInst);
      this.propBox = el('div', 'bl-props'); sim.side.prepend(this.propBox); this.showProps();
      if (c.goals && c.goals.length) {
        this.goalBox = el('div', 'bl-goals'); this.goalBox.append(el('div', 'bl-gt', c.goalTitle || 'Objetivos'));
        this.goalItems = c.goals.map((g) => { const r = el('div', 'bl-goal', '<span class="bl-gk">○</span><span>' + g.label + '</span>'); this.goalBox.append(r); return r; });
        sim.side.prepend(this.goalBox);
      }
      if (c.controls && c.controls.length) this.addControls();
      for (const o of c.outs || []) sim.out(o.id, o.label, { hl: o.hl });
      if (c.faults && c.faults.length) this.addFaults();
    }
    btn(icon, label, title, fn, o = {}) {
      const b = el('button', 'bl-t' + (o.cls ? ' ' + o.cls : ''), (icon || '') + (label ? `<span>${label}</span>` : ''));
      b.type = 'button'; b.title = title || label || '';
      b.addEventListener('click', (e) => { e.preventDefault(); fn(e); this.sim.redraw(); });
      (o.parent || this.bar).append(b); return b;
    }
    toggle(label, title, init, fn, parent) {
      const lab = el('label', 'bl-chk2'); const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!init;
      cb.addEventListener('change', () => { fn(cb.checked); this.sim.redraw(); });
      lab.append(cb, el('span', null, label)); lab.title = title || ''; (parent || this.bar).append(lab); return cb;
    }
    buildBar() {
      const full = this.edit === 'full', B = this.bench;
      this.bar.innerHTML = '';
      if (full) {
        const g = el('div', 'bl-grp'); this.bar.append(g);
        this.btn(ICO.rot, '', 'Girar la pieza seleccionada 90° (R)', () => this.rotateSel(), { parent: g });
        this.btn(ICO.del, '', 'Quitar la pieza o el cable seleccionado (Supr)', () => this.deleteSel(), { parent: g });
        this.btn(ICO.undo, '', 'Deshacer (Ctrl+Z)', () => this.undo(), { parent: g });
        this.btn(ICO.redo, '', 'Rehacer (Ctrl+Y)', () => this.redo(), { parent: g });
      }
      const gz = el('div', 'bl-grp'); this.bar.append(gz);
      this.btn(ICO.plus, '', 'Acercar', () => this.zoomBy(1.25), { parent: gz });
      this.btn(ICO.minus, '', 'Alejar', () => this.zoomBy(0.8), { parent: gz });
      this.btn(ICO.fit, '', 'Ajustar la vista', () => this.fit(), { parent: gz });
      const gf = el('div', 'bl-grp'); this.bar.append(gf);
      if (this.edit !== 'none') {
        this.btn(ICO.fix, 'Reparar', 'Reemplaza todas las piezas quemadas y los fusibles', () => { this.pushHist(); B.repairAll(); this.particles.clear(); this.toast = []; this.showProps(); }, { parent: gf });
        this.btn(ICO.check, 'Revisar', 'Busca errores típicos del montaje: patas sueltas, piezas puenteadas por la tira…', () => this.runCheck(), { parent: gf });
      }
      const gv = el('div', 'bl-grp bl-grp-r'); this.bar.append(gv);
      this.toggle('Tensiones', 'Colorea las tiras de la protoboard según su potencial', this.showVolts, (v) => { this.showVolts = v; }, gv);
      this.toggle('Temperatura', 'Vista térmica: color y temperatura de cada pieza', this.thermalView, (v) => { this.thermalView = v; }, gv);
      this.toggle('Etiquetas', 'Muestra el nombre y valor de cada pieza', this.labels, (v) => { this.labels = v; }, gv);
      const snd = this.btn(ICO.sound, '', 'Sonido (zumbadores, altavoces y estallidos)', () => { AU.enable(!AU.on); snd.classList.toggle('on', AU.on); }, { parent: gv });
      if (this.cfg.instruments.includes('scope') || this.cfg.slowmo) {
        const sp = document.createElement('select'); sp.className = 'bl-sel'; sp.title = 'Velocidad del tiempo en el circuito: tiempo real o cámara lenta para ver señales rápidas';
        for (const [v, t] of [[0.001, 'Cámara lenta 0,001×'], [0.01, 'Cámara lenta 0,01×'], [0.1, 'Cámara lenta 0,1×'], [1, 'Tiempo real 1×'], [10, 'Rápido 10×']]) { const o = document.createElement('option'); o.value = v; o.textContent = t; sp.append(o); }
        sp.value = B.speed; sp.addEventListener('change', () => { B.speed = +sp.value; }); gv.append(sp);
      }
      const th = document.createElement('select'); th.className = 'bl-sel'; th.title = 'Rapidez del calentamiento: 1× es tiempo real; valores mayores aceleran el daño por calor';
      for (const [v, t] of [[1, 'Calor 1×'], [4, 'Calor 4×'], [20, 'Calor 20×'], [100, 'Calor 100×']]) { const o = document.createElement('option'); o.value = v; o.textContent = t; th.append(o); }
      th.value = B.net.cfg.thermalSpeed; th.addEventListener('change', () => { B.net.cfg.thermalSpeed = +th.value; });
      gv.append(th);
      if (this.cfg.damage !== false && this.edit !== 'none') this.toggle('Se queman', 'Si se desactiva, las piezas no se dañan', true, (v) => { B.net.cfg.damage = v; }, gv);
    }
    buildTray() {
      const box = this.trayBox; box.innerHTML = '';
      if (this.edit !== 'full' || this.cfg.tray === false) { box.hidden = true; return; }
      box.hidden = false;
      const tabs = el('div', 'bl-ptabs'), items = el('div', 'bl-pitems');
      box.append(el('div', 'bl-pt', 'Caja de componentes — un clic coloca la pieza junto a la protoboard; luego arrástrela a los agujeros'), tabs, items);
      let list = BB.TRAY;
      if (Array.isArray(this.cfg.tray)) list = BB.TRAY.filter((t) => this.cfg.tray.includes(t.k) || this.cfg.tray.includes(t.label));
      const cats = BB.TRAY_CATS.filter((cat) => list.some((t) => BB.TYPES[t.k].cat === cat));
      this.palCat = this.palCat && cats.includes(this.palCat) ? this.palCat : cats[0];
      const show = () => {
        items.innerHTML = '';
        for (const t of list) {
          if (BB.TYPES[t.k].cat !== this.palCat) continue;
          const b = el('button', 'bl-chip', t.label); b.type = 'button';
          b.addEventListener('click', () => { this.pushHist(); const P = this.bench.addPart(t.k, t.preset); this.select({ kind: 'part', id: P.id }); this.say('«' + P.id + '» está sobre la mesa. Arrastre el cuerpo para moverla y agarre las patas para estirarlas.'); this.sim.redraw(); });
          items.append(b);
        }
      };
      cats.forEach((cat) => { const b = el('button', 'bl-ptab' + (cat === this.palCat ? ' on' : ''), cat); b.type = 'button'; b.addEventListener('click', () => { this.palCat = cat; [...tabs.children].forEach((x) => x.classList.toggle('on', x === b)); show(); }); tabs.append(b); });
      show();
      if (cats.length < 2) tabs.hidden = true;
    }
    addControls() {
      const sim = this.sim;
      for (const k of this.cfg.controls) {
        const apply = (v) => { k.apply(this, v); this.bench.invalidate(); this.showProps(); };
        if (k.type === 'slider') sim.slider(k.id, { label: k.label, min: k.min, max: k.max, step: k.step, value: k.value, unit: k.unit, log: k.log, fmt: k.fmt, onInput: apply });
        else if (k.type === 'select') sim.select(k.id, { label: k.label, options: k.options, value: k.value, onInput: apply });
        else if (k.type === 'seg') sim.seg(k.id, { label: k.label, options: k.options, value: k.value, onInput: apply });
        else if (k.type === 'check') sim.check(k.id, { label: k.label, value: k.value, onInput: apply });
        else if (k.type === 'button') sim.button(k.label, () => { k.apply(this); this.bench.invalidate(); this.showProps(); });
        if (k.value !== undefined && k.init !== false) k.apply(this, k.value);
      }
      this.bench.invalidate();
    }
    addFaults() {
      const sim = this.sim; sim.group('Fallas del banco');
      this.faultState = {};
      for (const f of this.cfg.faults) {
        sim.check('f_' + f.id, { label: f.label, value: false, onInput: (v) => { this.faultState[f.id] = v; if (v) f.apply(this); else if (f.revert) f.revert(this); this.bench.invalidate(); this.showProps(); } });
      }
    }
    say(t) { this.msg = { t, life: 5 }; }
    flash(t) { this.toast.push({ t, life: 4.5 }); this.renderToasts(); }
    renderToasts() { this.toastBox.innerHTML = ''; for (const q of this.toast.slice(-3)) this.toastBox.append(el('div', 'bl-toast', q.t)); }

    /* ======================= API para capítulos ======================= */
    v(a, b) { return b === undefined ? this.bench.vRef(a) : this.bench.vBetween(a, b); }
    vp(id, i, j) { return this.bench.vPart(id, i, j); }
    i(id) { return this.bench.iPart(id); }
    part(id) { return this.bench.part(id); }
    T(id) { const r = this.bench.net.rt[id]; return r ? r.T : 25; }
    dead(id) { const p = this.bench.part(id); return !!(p && p.dead); }
    anyDead() { return this.bench.scene.parts.some((p) => p.dead); }
    set(id, k, v) { const p = this.bench.part(id) || this.bench.ip[id]; if (!p) return; p.p[k] = v; if (CAT[p.t].apply && k === 'kind') { const keep = Object.assign({}, p.p); CAT[p.t].apply(p); Object.assign(p.p, { kind: keep.kind }); } this.bench.invalidate(); }
    psu(ch, o) { Object.assign(this.bench.inst.ps[ch], o); this.bench.invalidate(); if (this.inst) this.inst.refresh(); }
    fg(o) { Object.assign(this.bench.inst.fg, o); this.bench.invalidate(); if (this.inst) this.inst.refresh(); }
    dmmSet(o) { Object.assign(this.bench.inst.dmm, o); this.bench.invalidate(); if (this.inst) this.inst.refresh(); }
    dmm() { return this.bench.readDMM(); }
    wire(a, b, color, id) { const w = this.bench.addWire(a, b, color, id); this.sim.redraw(); return w; }
    unwire(id) { this.bench.removeWire(id); this.sim.redraw(); }
    hasWire(id) { return !!this.bench.wire(id); }
    addPartAt(id, key, props, refs, opts) { const B = this.bench; if (B.part(id)) return; const P = EM.bb.newPart(key, id, props); B.putPart(P, refs, opts || {}); B.invalidate(); this.sim.redraw(); }
    removePart(id) { if (this.bench.part(id)) { this.bench.removePart(id); this.sim.redraw(); } }
    press(id, on) { const p = this.bench.part(id); if (p) { p.p.on = on; this.bench.net.invalidate(); } }
    stat(ch) { const r = this.bench.rings[ch]; return EM.sigStats(r.last(Math.min(r.count(), this.bench.N)), this.bench.dt); }
    fastForward(s) { this.bench.fastForward(s); this.sim.redraw(); }
    autoTdiv(f, periods = 3) { const want = periods / f / 10; let best = EM.Inst.TDIVS[0]; for (const t of EM.Inst.TDIVS) if (t <= want * 1.2) best = t; this.bench.setTdiv(best); if (this.inst) this.inst.refresh(); return best; }
    load(spec) { this.bench.loadSpec(spec); this.bench.rebuild(); this.sel = null; this.particles.clear(); this.toast = []; this.renderToasts(); this.showProps(); if (this.inst) this.inst.refresh(); this.sim.redraw(); }
    reset() {
      this.bench.reset(); this.particles.clear(); this.toast = []; this.renderToasts(); this.showProps(); this.sim.redraw();
    }
    runCheck() {
      const r = this.bench.check();
      if (!r.length) this.flash('✔ Revisión: no se encontraron errores típicos de montaje.');
      else r.slice(0, 4).forEach((q) => this.flash('⚠ ' + q.text));
    }

    /* ======================= vista ======================= */
    worldBBox() {
      const B = this.bench, L = B.L;
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      const add = (x, y, r = 0) => { x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r); };
      for (const b of B.boards) { const k = BB.KINDS[b.kind]; add(b.x - 4, b.y - 4); add(b.x + k.w + 4, b.y + k.h + 4); }
      const has = (k) => this.cfg.instruments.includes(k);
      for (const [n, j] of Object.entries(L.jacks)) if (has(j.inst)) add(j.x, j.y, 8);
      for (const [n, j] of Object.entries(L.probeJacks)) if (has(j.inst)) add(j.x, j.y, 7);
      if (this.edit === 'full' && this.cfg.tray !== false) { add(L.stage.x, L.stage.y); add(L.stage.x + L.stage.w, L.stage.y + L.stage.h); }
      for (const p of B.scene.parts) { if (p._w) for (const q of p._w.pkg) add(q.x, q.y, 8); if (p.body) add(p.body[0], p.body[1], 17); }
      if (x0 > x1) { x0 = 0; y0 = 0; x1 = L.W; y1 = L.H; }
      return this.cfg.focus || [x0, y0, x1, y1];
    }
    fit() {
      const w = this.cv.w, h = this.cv.h; if (!w || !h) return;
      this._fitted = true;
      const b = this.worldBBox(), bw = b[2] - b[0], bh = b[3] - b[1];
      const s = Math.min((w - 12) / bw, (h - 12) / bh);
      this.view.s = s; this.view.ox = (w - bw * s) / 2 - b[0] * s; this.view.oy = (h - bh * s) / 2 - b[1] * s;
      this.sim.redraw();
    }
    zoomBy(f, cx, cy) {
      const w = this.cv.w, h = this.cv.h; cx = cx === undefined ? w / 2 : cx; cy = cy === undefined ? h / 2 : cy;
      const ns = clamp(this.view.s * f, 1.5, 40);
      this.view.ox = cx - (cx - this.view.ox) * (ns / this.view.s); this.view.oy = cy - (cy - this.view.oy) * (ns / this.view.s); this.view.s = ns; this.sim.redraw();
    }
    toWorld(px, py) { return [(px - this.view.ox) / this.view.s, (py - this.view.oy) / this.view.s]; }
    evPos(e) { const r = this.cv.el.getBoundingClientRect(); return this.toWorld(e.clientX - r.left, e.clientY - r.top); }

    /* ======================= historial ======================= */
    pushHist() { this.hist.push(JSON.stringify(this.bench.toJSON())); if (this.hist.length > 50) this.hist.shift(); this.future = []; }
    undo() { if (!this.hist.length) return; this.future.push(JSON.stringify(this.bench.toJSON())); this.restore(this.hist.pop()); }
    redo() { if (!this.future.length) return; this.hist.push(JSON.stringify(this.bench.toJSON())); this.restore(this.future.pop()); }
    restore(s) { const o = JSON.parse(s); this.bench.fromJSON(o); this.bench.rebuild(); this.sel = null; this.showProps(); this.autosave(); if (this.inst) this.inst.refresh(); }
    autosave() { if (this.cfg.autosave) { try { localStorage.setItem(LS + this.cfg.autosave, JSON.stringify(this.bench.toJSON())); } catch (e) { /* ignora */ } } }

    /* ======================= selección y edición ======================= */
    select(s) { this.sel = s; this.showProps(); this.sim.redraw(); }
    selPart() { return this.sel && this.sel.kind === 'part' ? this.bench.part(this.sel.id) : null; }
    rotateSel() {
      const P = this.selPart(); if (!P || BB.isFlex(P) || this.isFixed(P)) return;
      this.pushHist();
      const c = this.bench.partCenter(P);
      const before = P.at.slice();
      P.rot = ((P.rot || 0) + 1) % 4;
      /* girar alrededor del centro del encapsulado y alinear a la rejilla de la protoboard si es posible */
      const c2 = this.bench.partCenter(P); P.at = [P.at[0] + c[0] - c2[0], P.at[1] + c[1] - c2[1]];
      this.snapRigid(P, [0, 0], null);
      void before; this.bench.refreshPlacement(); this.showProps();
    }
    deleteSel() {
      if (this.edit !== 'full' || !this.sel) return;
      this.pushHist();
      if (this.sel.kind === 'part') { const P = this.bench.part(this.sel.id); if (P && this.isFixed(P)) return; this.bench.removePart(this.sel.id); }
      else if (this.sel.kind === 'wire') this.bench.removeWire(this.sel.id);
      this.sel = null; this.showProps(); this.autosave();
    }
    isFixed(P) { return !!(this.cfg.fixed && (this.cfg.fixed === true || this.cfg.fixed.includes(P.id))); }

    /* ---- ajuste a los agujeros ---- */
    freeHole(h, P) { return h && !this.bench.occupant(h.ref, P && P.id); }
    /* mueve una pieza rígida: dx,dy relativo a su pose original; intenta alinear todas las patas con agujeros libres */
    snapRigid(P, d, orig) {
      const B = this.bench;
      const base = orig ? orig.at : P.at;
      const g = BB.TYPES[P.k].geo(P);
      const pins = g.offs.map((o) => { const [x, y] = BB.rot(o[0], o[1], P.rot); return [base[0] + d[0] + x, base[1] + d[1] + y]; });
      let best = null;
      for (let j = 0; j < pins.length; j++) {
        const h = BB.holeAt(B.boards, pins[j][0], pins[j][1], 3.2);
        if (!h) continue;
        const sh = [h.x - pins[j][0], h.y - pins[j][1]];
        let ok = 0, tot = 0;
        for (let k = 0; k < pins.length; k++) { const hk = BB.holeAt(B.boards, pins[k][0] + sh[0], pins[k][1] + sh[1], 0.5); if (hk && this.freeHole(hk, P)) ok++; tot++; }
        const sc = ok * 100 - Math.hypot(sh[0], sh[1]);
        if (!best || sc > best.sc) best = { sh, ok, tot, sc };
      }
      if (best && best.ok === best.tot) P.at = [base[0] + d[0] + best.sh[0], base[1] + d[1] + best.sh[1]];
      else P.at = [base[0] + d[0], base[1] + d[1]];
      P._free = !(best && best.ok === best.tot);
    }
    snapFlex(P, d, orig) {
      const B = this.bench;
      const pins = orig.pos.map((q) => [q[0] + d[0], q[1] + d[1]]);
      let best = null;
      pins.forEach((q, j) => {
        const h = BB.holeAt(B.boards, q[0], q[1], 3.2); if (!h) return;
        const sh = [h.x - q[0], h.y - q[1]];
        let ok = 0;
        pins.forEach((r) => { const hk = BB.holeAt(B.boards, r[0] + sh[0], r[1] + sh[1], 0.5); if (hk && this.freeHole(hk, P)) ok++; });
        const sc = ok * 100 - Math.hypot(sh[0], sh[1]);
        if (!best || sc > best.sc) best = { sh, ok, sc };
      });
      const sh = best && best.ok >= 1 ? best.sh : [0, 0];
      P.pos = pins.map((q) => [q[0] + sh[0], q[1] + sh[1]]);
      P._free = !(best && best.ok >= 1);
    }

    /* ======================= eventos ======================= */
    bindEvents() {
      const cv = this.cv.el, self = this;
      cv.addEventListener('pointerdown', (e) => this.onDown(e));
      cv.addEventListener('pointermove', (e) => this.onMove(e));
      cv.addEventListener('pointerup', (e) => this.onUp(e));
      cv.addEventListener('pointercancel', (e) => this.onUp(e));
      cv.addEventListener('pointerleave', () => { if (!this.drag) { this.hover = null; this.tip.hidden = true; this.sim.redraw(); } });
      cv.addEventListener('wheel', (e) => {
        const p = this.selPart();
        if (p && (p.k === 'POT') && this.hover === p.id) { e.preventDefault(); p.p.pos = clamp(p.p.pos - Math.sign(e.deltaY) * 0.04, 0, 1); this.bench.invalidate(); this.showProps(); this.sim.redraw(); return; }
        if (e.ctrlKey || e.metaKey) { e.preventDefault(); const r = cv.getBoundingClientRect(); this.zoomBy(e.deltaY < 0 ? 1.15 : 0.87, e.clientX - r.left, e.clientY - r.top); }
      }, { passive: false });
      cv.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' || e.key === 'Backspace') { this.deleteSel(); e.preventDefault(); }
        else if (e.key === 'r' || e.key === 'R') { this.rotateSel(); e.preventDefault(); }
        else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { this.undo(); e.preventDefault(); }
        else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { this.redo(); e.preventDefault(); }
        else if (e.key === 'Escape') { this.select(null); }
        this.sim.redraw();
      });
    }
    probeList() {
      const has = (k) => this.cfg.instruments.includes(k), out = [];
      if (has('dmm')) out.push(['dmmR', 'tip', '#d73a31'], ['dmmB', 'tip', '#1e1e22']);
      if (has('scope')) out.push(['s1', 'tip', '#f2c200'], ['s1g', 'clip', '#222'], ['s2', 'tip', '#17b3d6'], ['s2g', 'clip', '#222']);
      return out;
    }
    probeBack(name) { const q = this.bench.scene.probes[name], jk = this.bench.L.probeJacks[name]; return DW.probeGeom([jk.x, jk.y], q, /g$/.test(name) ? 'clip' : 'tip').back; }
    distSeg(p, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2; t = clamp(t, 0, 1); return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy)); }
    hitTest(q) {
      const B = this.bench, canE = this.edit === 'full', canW = canE || this.edit === 'wires';
      /* puntas */
      if (this.edit !== 'none' || true) for (const [nm] of this.probeList().reverse()) { const tip = B.scene.probes[nm]; if (this.distSeg(q, tip, this.probeBack(nm)) < 2.4) return { kind: 'probe', name: nm }; }
      /* patas de piezas flexibles */
      if (canE) for (const P of [...B.scene.parts].reverse()) { if (!BB.isFlex(P) || this.isFixed(P)) continue; for (let i = 0; i < P.pos.length; i++) if (dist(P.pos[i], q) < 1.1) return { kind: 'leg', id: P.id, i }; }
      /* extremos de cables */
      if (canW) for (const w of [...B.scene.wires].reverse()) for (const e of ['a', 'b']) { if (dist(B.refPos(w[e]), q) < 1.7) return { kind: 'wend', id: w.id, end: e }; }
      /* cuerpos */
      for (let k = this.hits.length - 1; k >= 0; k--) {
        const h = this.hits[k];
        if (h.poly ? this.inPoly(q, h.poly) : dist([h.x, h.y], q) < h.r) return { kind: 'part', id: h.id };
      }
      /* cables */
      for (const w of [...B.scene.wires].reverse()) { const g = this.wireGeom[w.id]; if (g && DW.wireDist(g, q[0], q[1]) < 1.4) return { kind: 'wire', id: w.id }; }
      /* tomas y agujeros libres: iniciar cable */
      if (canW) {
        for (const [nm, j] of Object.entries(B.L.jacks)) if (this.cfg.instruments.includes(j.inst) && dist([j.x, j.y], q) < 3.6) return { kind: 'jack', ref: '@' + nm };
        const h = BB.holeAt(B.boards, q[0], q[1], 1.2);
        if (h) return { kind: 'hole', ref: h.ref, free: !B.occupant(h.ref) };
      }
      return null;
    }
    inPoly(p, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
    onDown(e) {
      if (e.button === 2) return;
      this.cv.el.focus({ preventScroll: true });
      const q = this.evPos(e), B = this.bench;
      this.pt = { x0: e.clientX, y0: e.clientY, q0: q, moved: false, id: e.pointerId, t0: performance.now() };
      this.cv.el.setPointerCapture(e.pointerId);
      const h = this.hitTest(q);
      const canE = this.edit === 'full';
      if (h && h.kind === 'probe') { this.drag = { kind: 'probe', name: h.name, off: [q[0] - B.scene.probes[h.name][0], q[1] - B.scene.probes[h.name][1]] }; this.select(null); }
      else if (h && h.kind === 'leg') { this.drag = { kind: 'leg', id: h.id, i: h.i }; this.hist0 = JSON.stringify(B.toJSON()); this.select({ kind: 'part', id: h.id }); }
      else if (h && h.kind === 'wend') { this.drag = { kind: 'wend', id: h.id, end: h.end, orig: B.wire(h.id)[h.end] }; this.hist0 = JSON.stringify(B.toJSON()); this.select({ kind: 'wire', id: h.id }); }
      else if (h && h.kind === 'part') {
        const P = B.part(h.id);
        this.select({ kind: 'part', id: h.id });
        if (P.k === 'BTN') { P.p.on = true; B.net.invalidate(); this.pressing = P; }
        if (P.k === 'POT' && (!canE || dist(B.partCenter(P), q) < 99) && this.potHit(P, q)) { this.drag = { kind: 'pot', id: P.id, y0: q[1], v0: P.p.pos }; return; }
        if (canE && !this.isFixed(P)) {
          this.drag = { kind: 'body', id: P.id, q0: q, orig: BB.isFlex(P) ? { pos: P.pos.map((x) => x.slice()), body: P.body ? P.body.slice() : null } : { at: P.at.slice() } };
          this.hist0 = JSON.stringify(B.toJSON());
        } else this.drag = { kind: 'click', id: P.id };
      } else if (h && h.kind === 'wire') this.select({ kind: 'wire', id: h.id });
      else if ((h && (h.kind === 'jack' || (h.kind === 'hole' && h.free)))) {
        this.drag = { kind: 'newwire', from: h.ref, to: q }; this.hist0 = JSON.stringify(B.toJSON());
      } else { this.drag = { kind: 'pan', ox: this.view.ox, oy: this.view.oy }; this.select(null); }
      this.sim.redraw();
    }
    potHit(P, q) { const c = this.knobPos(P); return dist(c, q) < 3.4; }
    knobPos(P) { const c = BB.pinsWorld(P); const [dx, dy] = BB.rot(2.54, -7.2, P.rot || 0); return [P.at[0] + dx, P.at[1] + dy]; }
    onMove(e) {
      const q = this.evPos(e), B = this.bench;
      if (!this.drag) { this.updateHover(q, e); return; }
      const d = this.drag, pt = this.pt;
      if (!pt.moved && Math.hypot(e.clientX - pt.x0, e.clientY - pt.y0) > 3) { pt.moved = true; if (this.pressing && d.kind === 'body') { this.pressing.p.on = false; B.net.invalidate(); this.pressing = null; } }
      if (d.kind === 'pan') { this.view.ox = d.ox + (e.clientX - pt.x0); this.view.oy = d.oy + (e.clientY - pt.y0); }
      else if (d.kind === 'probe') { if (pt.moved || true) B.setProbe(d.name, q[0] - d.off[0], q[1] - d.off[1]); }
      else if (d.kind === 'pot') { const P = B.part(d.id); P.p.pos = clamp(d.v0 + (d.y0 - q[1]) / 14, 0, 1); B.net.invalidate(); this.showProps(); }
      else if (d.kind === 'newwire') d.to = q;
      else if (!pt.moved) return;
      else if (d.kind === 'leg') {
        const P = B.part(d.id), hh = BB.holeAt(B.boards, q[0], q[1], 1.9);
        P.pos[d.i] = hh && this.freeHole(hh, P) ? [hh.x, hh.y] : [q[0], q[1]];
        P._free = false; B.refreshPlacement();
      } else if (d.kind === 'wend') {
        const w = B.wire(d.id); let ref = null;
        for (const [nm, j] of Object.entries(B.L.jacks)) if (this.cfg.instruments.includes(j.inst) && dist([j.x, j.y], q) < 3.6) ref = '@' + nm;
        if (!ref) { const hh = BB.holeAt(B.boards, q[0], q[1], 1.9); if (hh && !B.occupant(hh.ref, null, w.id)) ref = hh.ref; }
        d.free = !ref; d.q = q;
        if (ref) w[d.end] = ref;
        B.refreshPlacement();
      } else if (d.kind === 'body') {
        const P = B.part(d.id), dd = [q[0] - d.q0[0], q[1] - d.q0[1]];
        if (BB.isFlex(P)) {
          if (BB.TYPES[P.k].flex.tether) {
            P.body = [d.orig.body[0] + dd[0], d.orig.body[1] + dd[1]];
            P.pos = d.orig.pos.map((p0, i) => (P._h && P._h[i] ? p0 : [p0[0] + dd[0], p0[1] + dd[1]]));
          } else this.snapFlex(P, dd, d.orig);
        } else this.snapRigid(P, dd, d.orig);
        B.refreshPlacement();
      }
      this.sim.redraw();
    }
    onUp(e) {
      const d = this.drag, B = this.bench; this.drag = null;
      if (this.pressing) { this.pressing.p.on = false; B.net.invalidate(); this.pressing = null; }
      if (!d) return;
      try { this.cv.el.releasePointerCapture(e.pointerId); } catch (er) { /* */ }
      const moved = this.pt && this.pt.moved;
      if (d.kind === 'probe') { B.invalidate(); }
      else if (d.kind === 'newwire') {
        const q = d.to; let ref = null;
        for (const [nm, j] of Object.entries(B.L.jacks)) if (this.cfg.instruments.includes(j.inst) && dist([j.x, j.y], q) < 3.6) ref = '@' + nm;
        if (!ref) { const hh = BB.holeAt(B.boards, q[0], q[1], 1.9); if (hh && !B.occupant(hh.ref)) ref = hh.ref; }
        if (ref && ref !== d.from && !(ref[0] === '@' && d.from[0] === '@' && false)) {
          this.histPush(this.hist0);
          const w = B.addWire(d.from, ref); this.select({ kind: 'wire', id: w.id }); this.autosave();
        } else if (moved) this.say('Suelte el cable sobre un agujero libre o una toma.');
        else if (d.from[0] !== '@') this.say('Arrastre desde un agujero hasta otro para tender un cable.');
      } else if (d.kind === 'wend') {
        if (d.free) { const w = B.wire(d.id); w[d.end] = d.orig; this.say('Un cable debe terminar en un agujero libre o en una toma.'); }
        else if (moved) this.histPush(this.hist0);
        B.refreshPlacement(); B.invalidate(); this.autosave();
      } else if (d.kind === 'leg' || d.kind === 'body') {
        if (moved) {
          B.place();
          if (B.issues.length) { const o = JSON.parse(this.hist0); B.fromJSON(o); B.rebuild(); this.say('Ese agujero ya está ocupado: una sola pata por agujero.'); }
          else { this.histPush(this.hist0); const P = B.part(d.id); if (P && P._free) this.say(P.id + ' quedó sobre la mesa sin insertar en la protoboard.'); }
          B.invalidate(); this.autosave(); this.showProps();
        }
      } else if (d.kind === 'click') {
        const P = B.part(d.id);
        if (P && !moved && (P.k === 'SW')) { P.p.pos = P.p.pos ? 0 : 1; B.invalidate(); this.showProps(); }
      } else if (d.kind === 'pot') { this.autosave(); }
      if (d.kind === 'body' && !moved) { const P = B.part(d.id); if (P && P.k === 'SW') { P.p.pos = P.p.pos ? 0 : 1; B.invalidate(); this.showProps(); } }
      this.sim.redraw();
    }
    histPush(s) { this.hist.push(s); if (this.hist.length > 50) this.hist.shift(); this.future = []; }
    updateHover(q, e) {
      const h = this.hitTest(q);
      const old = this.hover; let id = null, tipTxt = null;
      if (h && h.kind === 'part') { id = h.id; tipTxt = this.partTip(this.bench.part(id)); }
      else if (h && h.kind === 'hole') { const k = this.bench.holeKey(h.ref); const v = this.bench.vRef(h.ref); tipTxt = `<b>${h.ref.split(':')[1]}</b> · tira ${k.split(':')[1]}<br>${EM.si(v, 'V', 3)} respecto a tierra`; this.hoverHole = h.ref; }
      this.hover = id;
      this.cv.el.style.cursor = h ? (h.kind === 'probe' || h.kind === 'part' || h.kind === 'leg' || h.kind === 'wend' ? 'grab' : 'crosshair') : 'default';
      if (tipTxt && !this.drag) { const r = this.cv.el.getBoundingClientRect(); this.tip.hidden = false; this.tip.innerHTML = tipTxt; this.tip.style.left = Math.min(e.clientX - r.left + 14, this.cv.w - 190) + 'px'; this.tip.style.top = Math.max(4, e.clientY - r.top - 12) + 'px'; } else this.tip.hidden = true;
      if (old !== id || tipTxt) this.sim.redraw();
    }
    partLabel(P) {
      const p = P.p;
      switch (P.k) {
        case 'R': return S_R(p.r); case 'C': case 'CF': case 'CE': return EM.si(p.c, 'F', 3).replace(/\.0+(?=\D)/, ''); case 'L': return EM.si(p.l, 'H', 3);
        case 'POT': return S_R(p.r); case 'LED': return p.color; case 'D': return p.model; case 'ZD': return p.vz + ' V';
        case 'NPN': case 'PNP': case 'NMOS': case 'PMOS': case 'REG': case 'OA': return p.model; case 'BATP': return p.v + ' V';
        default: return BB.TYPES[P.k].name;
      }
    }
    partTip(P) {
      const B = this.bench; const I = B.info(P);
      const lines = [`<b>${P.id}</b> · ${this.partLabel(P)}`];
      if (P.dead) lines.push(`<span class="bad">✖ ${P.dead.desc}</span>`);
      else {
        const t = BB.TYPES[P.k];
        if (t.flex || ['POT', 'SW', 'BTN'].includes(P.k)) {
          if (P.k !== 'POT') lines.push(`V entre patas: ${EM.si(I.v, 'V', 3)}`);
          if (!['SW', 'BTN'].includes(P.k)) lines.push(`I: ${EM.si(I.i, 'A', 3)}`);
        }
        if (I.pw > 1e-4) lines.push(`P: ${EM.si(I.pw, 'W', 3)}`);
        if (I.T > 32) lines.push(`T: ${Math.round(I.T)} °C`);
        const un = (P._h || []).filter((h) => !h).length; if (un && !P._free) lines.push('<span class="bad">patas sin insertar: ' + un + '</span>');
      }
      return lines.join('<br>');
    }

    /* ======================= propiedades ======================= */
    showProps() {
      const box = this.propBox; if (!box) return; box.innerHTML = '';
      const P = this.selPart(), B = this.bench;
      if (this.sel && this.sel.kind === 'wire') {
        const w = B.wire(this.sel.id); if (!w) return;
        box.append(el('div', 'bl-ph', 'Cable ' + w.id));
        const row = el('div', 'bl-colors');
        for (const [nm, hex] of Object.entries(DW.WIRE_COLORS)) { const b = el('button', 'bl-col' + (w.color === nm ? ' on' : '')); b.style.background = hex; b.type = 'button'; b.title = nm; b.addEventListener('click', () => { w.color = nm; this.showProps(); this.sim.redraw(); }); row.append(b); }
        box.append(row, el('div', 'bl-pn', `De <b>${w.a.replace('@', 'toma ').replace('bb:', '')}</b> a <b>${w.b.replace('@', 'toma ').replace('bb:', '')}</b>. Agarre un extremo para cambiarlo de agujero.`));
        return;
      }
      if (!P) { box.hidden = !this.cfg.alwaysProps; if (!box.hidden) box.append(el('div', 'bl-pn', 'Seleccione una pieza para ver y cambiar sus propiedades.')); return; }
      box.hidden = false;
      const c = CAT[P.t], t = BB.TYPES[P.k];
      box.append(el('div', 'bl-ph', `${P.id} — ${t.name}`));
      if (P.dead) {
        box.append(el('div', 'bl-dead', '✖ ' + P.dead.desc + '<br><small>' + (P.dead.why || '') + '</small>'));
        if (this.edit !== 'none') this.btn(ICO.fix, 'Reemplazar', 'Pone una pieza nueva', () => { this.pushHist(); B.net.repair(P); B.repair && 0; P.dead = null; this.showProps(); }, { parent: box, cls: 'bl-small' });
      }
      const editable = this.edit === 'full' || this.edit === 'values' || this.edit === 'wires';
      const lock = this.cfg.lockValues;
      for (const pr of c.props || []) {
        if (pr.edu && !(P.p.model && /EDU/.test(P.p.model))) continue;
        if (pr.k === 'hs' && !/to220/.test((BB.PINOUT[P.p.model] || [''])[0] || '') && P.k !== 'REG' && P.k !== 'DARL') continue;
        const row = el('label', 'bl-pr'); row.append(el('span', null, pr.label + (pr.unit ? ' (' + pr.unit + ')' : '')));
        let inp;
        if (pr.kind === 'sel') { inp = document.createElement('select'); for (const [v, tx] of pr.opts) { const o = document.createElement('option'); o.value = v; o.textContent = tx; inp.append(o); } inp.value = P.p[pr.k]; inp.addEventListener('change', () => this.setProp(P, pr, inp.value)); }
        else if (pr.kind === 'bool') { inp = document.createElement('input'); inp.type = 'checkbox'; inp.checked = !!P.p[pr.k]; inp.addEventListener('change', () => this.setProp(P, pr, inp.checked)); }
        else if (pr.kind === 'txt') { inp = document.createElement('input'); inp.type = 'text'; inp.value = P.p[pr.k]; inp.addEventListener('change', () => this.setProp(P, pr, inp.value)); }
        else { inp = document.createElement('input'); inp.type = 'text'; inp.value = this.numStr(P.p[pr.k]); inp.addEventListener('change', () => { const v = PT.parseVal(inp.value); if (isFinite(v)) this.setProp(P, pr, clamp(v, pr.min === undefined ? -Infinity : pr.min, pr.max === undefined ? Infinity : pr.max)); else inp.value = this.numStr(P.p[pr.k]); }); }
        if (!editable || lock) inp.disabled = true;
        row.append(inp); box.append(row);
      }
      if (P.k === 'R') {
        const e = el('div', 'bl-pn', 'Código de colores: ' + S_bandsText(P.p.r, P.p.tol)); box.append(e);
      }
      if (P.k === 'POT') { const s = document.createElement('input'); s.type = 'range'; s.min = 0; s.max = 1; s.step = 0.01; s.value = P.p.pos; s.addEventListener('input', () => { P.p.pos = +s.value; B.invalidate(); }); const l = el('label', 'bl-pr'); l.append(el('span', null, 'Cursor'), s); box.append(l); }
      if (P.k === 'LDR' || P.k === 'PD') { const s = document.createElement('input'); s.type = 'range'; s.min = 0; s.max = 5; s.step = 0.05; s.value = Math.log10(Math.max(P.p.lux, 1)); s.addEventListener('input', () => { P.p.lux = Math.round(Math.pow(10, +s.value)); B.invalidate(); }); const l = el('label', 'bl-pr'); l.append(el('span', null, 'Iluminación (lux, log)'), s); box.append(l); }
      if (P.k === 'NTC') { const s = document.createElement('input'); s.type = 'range'; s.min = -10; s.max = 120; s.step = 1; s.value = P.p.T; s.addEventListener('input', () => { P.p.T = +s.value; B.invalidate(); }); const l = el('label', 'bl-pr'); l.append(el('span', null, 'Temperatura (°C)'), s); box.append(l); }
      if (P.k === 'SOLAR') { const s = document.createElement('input'); s.type = 'range'; s.min = 0; s.max = 1200; s.step = 10; s.value = P.p.irr; s.addEventListener('input', () => { P.p.irr = +s.value; B.invalidate(); }); const l = el('label', 'bl-pr'); l.append(el('span', null, 'Irradiancia (W/m²)'), s); box.append(l); }
      /* patas */
      const pn = c.pn || [], pins = el('div', 'bl-pins');
      const hs = P._h || [];
      const g = t.geo ? t.geo(P) : null;
      pins.append(el('div', 'bl-pt2', g ? 'Patas (vista superior, marca/cara plana al frente): <b>' + g.label + '</b>' : 'Patas'));
      pn.forEach((nm, i) => { if (c.pins.length > 9) return; pins.append(el('div', 'bl-pinrow', `<b>${nm}</b> → ${hs[i] ? hs[i].ref.split(':')[1] : '<span class="bad">sin insertar</span>'}`)); });
      box.append(pins);
      if (this.edit === 'full') {
        const g2 = el('div', 'bl-grp'); box.append(g2);
        if (!BB.isFlex(P)) this.btn(ICO.rot, 'Girar', 'Girar 90° (R)', () => this.rotateSel(), { parent: g2, cls: 'bl-small' });
        this.btn(ICO.del, 'Quitar', 'Quitar la pieza (Supr)', () => this.deleteSel(), { parent: g2, cls: 'bl-small' });
      }
      if (this.edit !== 'none' && this.cfg.partFaults) {
        const f = document.createElement('select'); f.className = 'bl-sel'; for (const [v, tx] of [['', 'Falla de la pieza: ninguna'], ['open', 'Abierta (se cortó)'], ['short', 'En cortocircuito'], ['leak', 'Con fugas'], ['drift', 'Valor deriva ×2']]) { const o = document.createElement('option'); o.value = v; o.textContent = tx; f.append(o); }
        f.value = P.fault ? P.fault.kind : ''; f.addEventListener('change', () => { P.fault = f.value ? { kind: f.value, factor: 2 } : null; B.invalidate(); }); box.append(f);
      }
    }
    numStr(v) { if (typeof v !== 'number') return v; if (v === 0) return '0'; const a = Math.abs(v); if (a >= 1e6) return +(v / 1e6).toPrecision(4) + 'M'; if (a >= 1e3) return +(v / 1e3).toPrecision(4) + 'k'; if (a >= 1) return String(+v.toPrecision(4)); if (a >= 1e-3) return +(v * 1e3).toPrecision(4) + 'm'; if (a >= 1e-6) return +(v * 1e6).toPrecision(4) + 'u'; if (a >= 1e-9) return +(v * 1e9).toPrecision(4) + 'n'; return +(v * 1e12).toPrecision(4) + 'p'; }
    setProp(P, pr, v) {
      this.pushHist();
      P.p[pr.k] = pr.kind === 'sel' && typeof pr.opts[0][0] === 'number' ? +v : v;
      const c = CAT[P.t];
      if (pr.k === 'kind' && c.apply) { const keep = P.p.kind; c.apply(P); P.p.kind = keep; }
      if (P.k === 'C' || P.k === 'CF' || P.k === 'CE') { const m = EM.spice.MOD.CAP[P.p.kind]; if (pr.k === 'kind' && m) P.p.vmax = m.vmaxDef; }
      this.bench.place(); this.bench.invalidate(); this.autosave(); this.showProps();
    }

    /* ======================= animación ======================= */
    frame(dtw) {
      const B = this.bench;
      B.frame(dtw);
      this.t += dtw; this.dtDraw = dtw;
      this.particles.update(dtw);
      for (const ev of B.events.splice(0)) {
        if (ev.kind === 'fail') {
          this.particles.sparks(ev.pos[0], ev.pos[1], 16, true); AU.pop();
          this.flash('✖ ' + ev.id + ': ' + ev.desc + ' — ' + ev.why + '.');
          this.showProps();
        } else if (ev.kind === 'fuse') { this.particles.sparks(B.L.probeJacks.dmmR.x, B.L.probeJacks.dmmR.y, 8, false); AU.pop(); this.flash('⚠ ' + ev.desc); if (this.inst && this.inst.get('dmm')) this.inst.get('dmm').refresh(); }
      }
      for (const q of this.toast) q.life -= dtw;
      if (this.toast.some((q) => q.life <= 0)) { this.toast = this.toast.filter((q) => q.life > 0); this.renderToasts(); }
      if (this.msg) { this.msg.life -= dtw; if (this.msg.life <= 0) this.msg = null; }
      if (this.inst) this.inst.update(dtw);
      this.soundUpdate();
      this._acc = (this._acc || 0) + dtw;
      if (this._acc > 0.25) { this._acc = 0; this.updateOuts(); this.updateGoals(); this.updateBanner(); if (this.cfg.autosave && !this.drag) this.autosave(); }
      if (this.cfg.onFrame) this.cfg.onFrame(this, dtw);
    }
    soundUpdate() {
      if (!AU.on) return;
      let f = 0, a = 0;
      for (const P of this.bench.scene.parts) {
        if (P.dead || !P._plugged) continue;
        if (P.k === 'BUZA') { const r = this.bench.net.rt[P.id], e = r && r.ref && r.ref.main; if (e && Math.abs(e.i) > 0.006) { f = 2700; a = 0.04; } }
        if (P.k === 'SPK') { const s = EM.sigStats(this.bench.spkRing(P.id).last(1024), this.bench.dt); if (s && isFinite(s.f) && s.rmsAC > 0.3) { f = s.f; a = clamp(s.rmsAC / 10, 0.01, 0.08); } }
      }
      AU.tone(f, a);
    }
    updateOuts() { const o = this.cfg.outs; if (!o || !o.length) return; for (const q of o) { try { this.sim.set(q.id, q.fn(this)); } catch (e) { this.sim.set(q.id, '—'); } } }
    updateGoals() { if (!this.goalItems) return; this.cfg.goals.forEach((g, k) => { let ok = false; try { ok = !!g.test(this); } catch (e) { ok = false; } const r = this.goalItems[k]; r.classList.toggle('ok', ok); r.firstChild.textContent = ok ? '✔' : '○'; }); }
    updateBanner() {
      const B = this.bench, msgs = [];
      if (B.shortInfo) msgs.push(B.shortInfo.cc ? `⚡ La fuente está en limitación de corriente (C.C.): entrega ${EM.si(B.shortInfo.i, 'A', 3)} y su tensión cae. Hay una carga excesiva o un cortocircuito.` : `⚡ CORTOCIRCUITO: ${B.shortInfo.id} entrega ${EM.si(B.shortInfo.i, 'A', 3)}`);
      for (const P of B.scene.parts) if (P.dead) msgs.push(`✖ ${P.id}: ${P.dead.desc}`);
      for (const id in B.ip) { const q = B.ip[id]; if (q.dead) msgs.push(`✖ ${id}: ${q.dead.desc}`); }
      for (const P of B.scene.parts) { const r = B.net.rt[P.id]; if (r && r.regHot) msgs.push(`🌡 ${P.id}: protección térmica activada`); if (!P.dead && r && r.T > 150) msgs.push(`🔥 ${P.id} está a ${Math.round(r.T)} °C`); }
      if (this.msg) msgs.push('ℹ ' + this.msg.t);
      const b = this.banner;
      if (!msgs.length) { b.hidden = true; return; }
      b.hidden = false; b.classList.toggle('warn', msgs.some((m) => /^[⚡✖🌡🔥]/.test(m)));
      b.innerHTML = msgs.slice(0, 3).map((m) => `<div>${m}</div>`).join('') + (msgs.length > 3 ? `<div>… y ${msgs.length - 3} avisos más</div>` : '');
    }

    /* ======================= dibujo ======================= */
    drawAll() {
      this.drawMain();
      if (this.inst) this.inst.draw();
    }
    stripOf(ref) { const b = this.bench.boards.find((q) => q.id === ref.split(':')[0]); const h = ref.split(':')[1]; const p = BB.parse(h); return { b, h, key: BB.strip(b.kind, h) }; }
    drawMain() {
      const cv = this.cv, c = cv.ctx, w = cv.w, h = cv.h; if (!w) return;
      const B = this.bench, net = B.net, s = this.view.s, L = B.L;
      if (B.net.dirty) { try { B.rebuild(); } catch (e) { /* se reintenta en el siguiente cuadro */ } }
      c.save();
      /* mesa */
      const dark = EM.isDark();
      c.fillStyle = dark ? '#1b1f26' : '#d9dde3'; c.fillRect(0, 0, w, h);
      c.translate(this.view.ox, this.view.oy); c.scale(s, s);
      c.save(); DW.rr(c, -6, -6, L.W + 12, L.H + 12, 4);
      c.fillStyle = dark ? '#252b34' : '#e8ebf0'; c.fill(); c.strokeStyle = dark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.08)'; c.lineWidth = 0.4; c.stroke(); c.restore();
      const has = (k) => this.cfg.instruments.includes(k);
      /* placas de instrumentos */
      if (has('psu')) { DW.plate(c, 3, 13, 19, 61, 'FUENTE'); }
      if (has('fg')) { DW.plate(c, L.jacks.fgo.x - 7, 2, 26, 17, 'GENERADOR'); }
      if (has('ac')) { DW.plate(c, 3, 77, 19, 26, 'TRANSF.'); }
      if (has('dmm')) { DW.plate(c, L.probeJacks.dmmR.x - 8, L.probeJacks.dmmR.y - 6, 16, 23, 'DMM'); }
      if (has('scope')) { DW.plate(c, L.probeJacks.s1.x - 8, L.probeJacks.s1.y - 6, 16, 48, 'OSC'); }
      for (const [nm, j] of Object.entries(L.jacks)) if (has(j.inst)) DW.jack(c, j.x, j.y, j.color, j.label, { hot: this.drag && this.drag.kind === 'newwire' && dist([j.x, j.y], this.drag.to) < 3.6 });
      for (const [nm, j] of Object.entries(L.probeJacks)) if (has(j.inst)) DW.jack(c, j.x, j.y, j.color, j.label, { ly: 5.2, labelColor: 'rgba(255,255,255,.8)' });
      if (this.edit === 'full' && this.cfg.tray !== false) {
        const st = L.stage; c.save(); c.setLineDash([2, 1.6]); c.strokeStyle = dark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.22)'; c.lineWidth = 0.4; DW.rr(c, st.x, st.y, st.w, st.h, 2); c.stroke(); c.setLineDash([]);
        DW.text(c, 'PIEZAS SUELTAS', st.x + st.w / 2, st.y + 3.4, 2.2, dark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.35)', { weight: 800 }); c.restore();
      }
      /* protoboards */
      const view = { scale: s, dpr: cv.dpr };
      for (const b of B.boards) DW.board(c, b, view);
      if (B.placeDirty) B.place();
      this.drawStrips(c);
      /* piezas */
      const v = this.viewCtx(c);
      this.hits = v.hit;
      for (const P of B.scene.parts) {
        const r = net.rt[P.id]; P._T = r ? r.T : 25; P._dm = r ? clamp(r.dm || 0, 0, 1) : 0; P._I = (() => { try { return net.iPart(P); } catch (e) { return 0; } })();
        if (!P._w) continue;
        c.save(); if (P._free && this.drag && this.drag.id === P.id) { c.globalAlpha = 0.92; }
        DW.part(c, P, v); c.restore();
        if (this.sel && this.sel.kind === 'part' && this.sel.id === P.id) this.drawSel(c, P);
      }
      /* vista térmica */
      if (this.thermalView) this.drawThermal(c);
      /* cables */
      this.wireGeom = {};
      for (const wr of B.scene.wires) {
        const a = B.refPos(wr.a), b = B.refPos(wr.b);
        const col = DW.WIRE_COLORS[wr.color] || wr.color;
        const brk = B.scene.faults.some((f) => f.kind === 'wirebreak' && f.id === wr.id);
        c.save(); if (this.sel && this.sel.kind === 'wire' && this.sel.id === wr.id) { c.shadowColor = 'rgba(255,200,40,.95)'; c.shadowBlur = 6; }
        const jackLead = wr.a[0] === '@' || wr.b[0] === '@';
        const g = DW.wire(c, a, b, col, { w: jackLead ? 1.7 : 1.5, lift: jackLead ? 0.8 : 1, dir: wr.a[0] === '@' ? 1 : -1 });
        c.restore(); this.wireGeom[wr.id] = g;
        if (brk) { const m = DW.bez(g, 0.5); c.strokeStyle = '#fff'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(m[0] - 1, m[1] - 1); c.lineTo(m[0] + 1, m[1] + 1); c.stroke(); }
      }
      if (this.drag && this.drag.kind === 'newwire') { const a = B.refPos(this.drag.from); DW.wire(c, a, this.drag.to, '#2a62d4', { lift: 0.8 }); }
      /* puntas */
      for (const [nm, kind, col] of this.probeList()) {
        const tip = B.scene.probes[nm], jn = nm === 'dmmR' ? 'dmmR' : nm === 'dmmB' ? 'dmmB' : nm;
        const jk = L.probeJacks[jn]; const touching = B.touch(tip).key;
        DW.probe(c, [jk.x, jk.y], tip, col, kind, { cable: nm[0] === 's' ? '#1b1d21' : (nm === 'dmmR' ? '#a82a22' : '#1b1d21'), hot: !!touching });
      }
      /* destino al arrastrar */
      if (this.drag && (this.drag.kind === 'body' || this.drag.kind === 'leg' || this.drag.kind === 'probe')) this.drawDropHint(c);
      this.particles.draw(c);
      FX.glows(c, v.glows);
      c.restore();
      if (this.msg && this.cfg.hintOnCanvas !== false) { /* mensaje corto en el aviso */ }
    }
    viewCtx(ctx) {
      const self = this, B = this.bench;
      return {
        t: this.t, dt: this.dtDraw, bench: B, glows: [], hit: [], hover: this.hover, showPins: true,
        smokeAt: (id, x, y, k) => this.particles.smoke(id, x, y, this.dtDraw, k),
        label: (p, x, y, txt) => { if (!self.labels && !(self.hover === p.id) && !(self.sel && self.sel.id === p.id)) return; DW.text(ctx, txt || self.partLabel(p), x, y, 1.55, EM.isDark() ? 'rgba(255,255,255,.85)' : 'rgba(30,36,48,.9)', { weight: 800 }); },
        tether: (p, b, t1, t2, W, cols) => {
          const c1 = cols ? cols[0] : '#c9ccd2', c2 = cols ? cols[1] : '#c9ccd2';
          const pc = p.k === 'MOT' ? ['#d73a31', '#1e1e22'] : p.k === 'SPK' || p.k === 'BUZA' ? ['#d73a31', '#1e1e22'] : p.k === 'SOLAR' ? ['#d73a31', '#1e1e22'] : p.k === 'LAMP' ? ['#8a8f98', '#8a8f98'] : [c1, c2];
          DW.wire(ctx, [b[0] + t1[0], b[1] + t1[1]], W.cat[0], pc[0], { lift: 0.6, noShadow: false });
          DW.wire(ctx, [b[0] + t2[0], b[1] + t2[1]], W.cat[1], pc[1], { lift: 0.6 });
        }
      };
    }
    drawSel(c, P) {
      c.save(); c.strokeStyle = 'rgba(255,200,40,.95)'; c.lineWidth = 0.4; c.setLineDash([1.2, 0.8]);
      const hs = this.hits.filter((q) => q.id === P.id);
      for (const q of hs) { if (q.poly) { c.beginPath(); q.poly.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.closePath(); c.stroke(); } else { c.beginPath(); c.arc(q.x, q.y, q.r + 0.8, 0, TAU); c.stroke(); } }
      c.restore();
    }
    drawStrips(c) {
      const B = this.bench, active = new Map();
      if (!this.showVolts && !this.hoverHole) return;
      if (this.showVolts && B.net.cir && B.net.cir.x) {
        for (const ref of B.occ.keys()) { const sp = this.stripOf(ref); active.set(sp.b.id + ':' + sp.key, ref); }
        for (const nm of Object.keys(B.scene.probes)) { const t = B.touch(B.scene.probes[nm]); if (t.ref) { const sp = this.stripOf(t.ref); active.set(sp.b.id + ':' + sp.key, t.ref); } }
        let vmax = 1; const vals = new Map();
        for (const [k, ref] of active) { const v = B.vRef(ref); vals.set(k, v); vmax = Math.max(vmax, Math.abs(v)); }
        for (const [k, ref] of active) {
          const sp = this.stripOf(ref), rc = DW.stripRect(sp.b.kind, sp.h);
          c.save(); c.translate(sp.b.x, sp.b.y); c.fillStyle = FX.voltColor(vals.get(k), vmax, 0.42); DW.rr(c, rc[0], rc[1], rc[2], rc[3], 0.8); c.fill(); c.restore();
        }
      }
      if (this.hover === null && this.hoverHole && !this.drag) { const sp = this.stripOf(this.hoverHole); DW.hiliteStrip(c, sp.b, sp.h, 'rgba(255,170,0,.28)'); }
    }
    drawThermal(c) {
      for (const P of this.bench.scene.parts) {
        if (!P._w) continue; const T = P._T || 25; const ctr = this.bench.partCenter(P);
        const u = clamp((T - 25) / 175, 0, 1);
        const col = u < 0.5 ? DW.mixc('#2a62d4', '#f0c020', u * 2) : DW.mixc('#f0c020', '#e23428', (u - 0.5) * 2);
        c.save(); c.globalAlpha = 0.55; c.fillStyle = col; c.beginPath(); c.arc(ctr[0], ctr[1] - 1.4, 3.6 + u * 3, 0, TAU); c.fill(); c.globalAlpha = 1;
        DW.text(c, Math.round(T) + '°', ctr[0], ctr[1] - 1.4, 1.9, '#111', { weight: 800 }); c.restore();
      }
    }
    drawDropHint(c) {
      const d = this.drag, B = this.bench; const P = d.id && B.part(d.id);
      c.save(); c.lineWidth = 0.4;
      if (P && P._w) { (P._hp ? P._hp : P._h).forEach((h) => { if (h) { c.strokeStyle = 'rgba(40,200,90,.9)'; c.beginPath(); c.arc(h.x, h.y, 1.3, 0, TAU); c.stroke(); } }); }
      if (d.kind === 'probe') { const t = B.touch(B.scene.probes[d.name]); if (t.ref) { const q = B.refPos(t.ref); c.strokeStyle = 'rgba(40,200,90,.95)'; c.beginPath(); c.arc(q[0], q[1], 1.5, 0, TAU); c.stroke(); } }
      c.restore();
    }
  }
  const S_R = (r) => EM.spice.fmtR(r).replace(' ', '');
  const S_bandsText = (R, tol) => { const b = EM.spice.bands(R, 4, tol); return b.map((i) => EM.spice.COLORS[i].n).join(' · '); };

  EM.Lab.all = [];
  EM.Lab.mount = (sim, cfg) => { const l = new Lab(sim, cfg); EM.Lab.all.push(l); sim.host.__lab = l; return l; };
  EM.Lab.Class = Lab;
})();
