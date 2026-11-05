/* ===================================================================
   37-taller.js — El Taller de circuitos (EM.Taller): editor de esquemas con simulación en vivo,
   instrumentos, paneles de análisis, fallas y cortocircuitos.
   EM.Taller.mount(sim, cfg)  ·  cfg = { spec | doc, edit:'full'|'values'|'none', aspect, panels:[...],
     probes:[{label,at,color}], controls:[...], outs:[...], faults:[...], tdiv, startZero, hint, onFrame }
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM, PT = EM.parts, CAT = PT.CAT, S = EM.spice, SYM = EM.sym, el = EM.el, PN = EM.Panels;
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const key = (x, y) => x + ',' + y;
  const LS = 'dv:taller';

  const ICO = {
    sel: '<svg viewBox="0 0 16 16"><path d="M3 2l9 6-4 1 2 5-2 1-2-5-3 3z" fill="currentColor"/></svg>',
    wire: '<svg viewBox="0 0 16 16"><path d="M2 12h5V4h7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="2" cy="12" r="1.6" fill="currentColor"/><circle cx="14" cy="4" r="1.6" fill="currentColor"/></svg>',
    del: '<svg viewBox="0 0 16 16"><path d="M3 4.5h10M6 4.5V3h4v1.5M4.5 4.5l.6 9h5.8l.6-9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    rot: '<svg viewBox="0 0 16 16"><path d="M13 8a5 5 0 1 1-1.6-3.7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M13.3 1.8v3.6H9.7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    undo: '<svg viewBox="0 0 16 16"><path d="M5 3L2 6l3 3M2 6h7a4 4 0 0 1 0 8H6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    redo: '<svg viewBox="0 0 16 16"><path d="M11 3l3 3-3 3M14 6H7a4 4 0 0 0 0 8h3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    fit: '<svg viewBox="0 0 16 16"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    bolt: '<svg viewBox="0 0 16 16"><path d="M9 1L3 9h4l-1 6 7-9H9z" fill="currentColor"/></svg>',
    fix: '<svg viewBox="0 0 16 16"><path d="M10.5 2.5a3.5 3.5 0 0 0-3.2 4.8L2.5 12.1l1.4 1.4 4.8-4.8a3.5 3.5 0 0 0 4.8-3.2l-2 2-1.8-.4-.4-1.8z" fill="currentColor"/></svg>',
    save: '<svg viewBox="0 0 16 16"><path d="M3 2h8l2 2v10H3zM5 2v4h5V2M5 14v-4h6v4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    open: '<svg viewBox="0 0 16 16"><path d="M2 5V3h4l1.5 1.5H13V6M2 5l1 8h10l1-7H3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>'
  };

  class Taller {
    constructor(sim, cfg) {
      this.sim = sim;
      const c = (this.cfg = Object.assign({ edit: 'values', aspect: 1.75, panels: ['scope'], startZero: false, tdiv: 1e-3, speed: 1, autosave: false, colorV: true, showI: true, probes: [], controls: [], outs: [], faults: [], net: {} }, cfg));
      this.net = new EM.Net(c.net);
      this.edit = c.edit;
      this.N = 1000;
      this.tdiv = c.tdiv;
      this.dt = (10 * this.tdiv) / this.N;
      this.speed = c.speed;
      this.running = true;
      this.sel = { parts: new Set(), wires: new Set() };
      this.tool = 'select';
      this.placing = null;
      this.hist = []; this.future = [];
      this.view = { s: 24, ox: 40, oy: 40 };
      this.channels = []; this.rings = {}; this.meters = [];
      this.fx = []; this.phase = 0;
      this.carry = 0; this.simT = 0;
      this.scope = { tdiv: this.tdiv };
      this.panels = []; this.alerts = [];
      this.wiring = null;
      this.mouse = { x: 0, y: 0, down: false };
      this.shortFrom = null;
      this.framesNoSolve = 0;
      this._panelRefresh = 0;
      this.ctlState = {};
      let doc = c.doc || (c.spec ? EM.Net.fromSpec(c.spec) : { parts: [], wires: [] });
      if (c.autosave) { try { const s = localStorage.getItem(LS); if (s) doc = JSON.parse(s); } catch (e) { /* sin almacenamiento */ } }
      this.net.load(doc);
      this.buildDOM();
      this.rebuild(true);
      this.fitView();
      if (c.controls) this.addControls();
      this.sim.onDraw(() => this.drawAll());
      this.sim.animate((dt) => this.frame(dt), { autoplay: c.autoplay !== false });
      this.sim.resetButton(() => this.reset());
    }

    /* ======================= DOM ======================= */
    buildDOM() {
      const sim = this.sim, c = this.cfg;
      this.root = el('div', 'tl-root');
      sim.stage.append(this.root);
      this.bar = el('div', 'tl-bar');
      this.root.append(this.bar);
      this.palBox = el('div', 'tl-pal');
      this.root.append(this.palBox);
      this.cv = sim.canvas({ parent: this.root, aspect: c.aspect, label: 'Esquema del circuito', cls: 'tl-main' });
      const cv = this.cv.el;
      cv.tabIndex = 0; cv.style.touchAction = 'none'; cv.style.outline = 'none';
      this.banner = el('div', 'tl-banner'); this.banner.hidden = true;
      this.cv.wrap.append(this.banner);
      this.toolHint = el('div', 'tl-toolhint'); this.toolHint.hidden = true;
      this.cv.wrap.append(this.toolHint);
      this.hintEl = c.hint ? sim.hint(c.hint, this.cv) : null;
      this.tipEl = el('div', 'tl-tip'); this.tipEl.hidden = true; this.cv.wrap.append(this.tipEl);
      this.cv.onResize = () => { if (!this._fitted) { this.fitView(); } };
      this.buildBar();
      this.buildPalette();
      this.bindEvents();
      /* paneles */
      this.panelBox = el('div', 'tl-panels');
      this.root.append(this.panelBox);
      this.tabsEl = el('div', 'tl-tabs');
      this.panelBox.append(this.tabsEl);
      this.panelHost = el('div', 'tl-phost');
      this.panelBox.append(this.panelHost);
      this.buildPanels();
      /* propiedades */
      this.propBox = el('div', 'tl-props');
      sim.side.prepend(this.propBox);
      this.showProps();
      if (c.goals && c.goals.length) {
        this.goalBox = el('div', 'tl-goals');
        this.goalBox.append(el('div', 'tl-ph', c.goalTitle || 'Objetivos'));
        this.goalItems = c.goals.map((g) => { const r = el('div', 'tl-goal', '<span class="tl-gk">○</span><span>' + g.label + '</span>'); this.goalBox.append(r); return r; });
        sim.side.prepend(this.goalBox);
      }
    }
    mkBtn(icon, label, title, fn, o = {}) {
      const b = el('button', 'tl-b' + (o.cls ? ' ' + o.cls : ''), (icon || '') + (label ? `<span>${label}</span>` : ''));
      b.type = 'button'; b.title = title || label || '';
      b.addEventListener('click', (e) => { e.preventDefault(); fn(e); this.redraw(); });
      (o.parent || this.bar).append(b);
      return b;
    }
    buildBar() {
      const full = this.edit === 'full';
      this.bar.innerHTML = '';
      this.btn = {};
      const g1 = el('div', 'tl-grp'); this.bar.append(g1);
      if (this.cfg.edit !== 'none' && !this.cfg.lock) this.btn.edit = this.mkBtn(ICO.sel, full ? 'Salir de edición' : 'Editar circuito', 'Activa o desactiva la edición: agregar piezas, cables y borrar', () => { this.setEdit(full ? 'values' : 'full'); }, { parent: g1, cls: full ? 'on' : '' });
      if (full) {
        this.btn.sel = this.mkBtn(ICO.sel, 'Seleccionar', 'Seleccionar y mover (Esc)', () => this.setTool('select'), { parent: g1, cls: this.tool === 'select' ? 'on' : '' });
        this.btn.wire = this.mkBtn(ICO.wire, 'Cable', 'Dibujar un cable: arrastre de un terminal a otro', () => this.setTool('wire'), { parent: g1, cls: this.tool === 'wire' ? 'on' : '' });
        const g2 = el('div', 'tl-grp'); this.bar.append(g2);
        this.mkBtn(ICO.rot, '', 'Girar 90° (R)', () => this.rotateSel(), { parent: g2 });
        this.mkBtn('<b>⇅</b>', '', 'Voltear (F)', () => this.flipSel(), { parent: g2 });
        this.mkBtn(ICO.del, '', 'Eliminar (Supr)', () => this.deleteSel(), { parent: g2 });
        this.mkBtn(ICO.undo, '', 'Deshacer (Ctrl+Z)', () => this.undo(), { parent: g2 });
        this.mkBtn(ICO.redo, '', 'Rehacer (Ctrl+Y)', () => this.redo(), { parent: g2 });
      }
      const g3 = el('div', 'tl-grp'); this.bar.append(g3);
      this.mkBtn(ICO.fit, '', 'Ajustar la vista al circuito', () => this.fitView(), { parent: g3 });
      if (this.cfg.edit !== 'none') {
        const gf = el('div', 'tl-grp'); this.bar.append(gf);
        this.btn.short = this.mkBtn(ICO.bolt, 'Cortocircuito', 'Simular una falla: une dos terminales con un cable sin resistencia. Pulse aquí, haga clic en un terminal y luego en otro. «Reparar» lo quita.', () => this.setTool(this.tool === 'short' ? 'select' : 'short'), { parent: gf, cls: this.tool === 'short' ? 'on warn' : 'warn' });
        this.mkBtn(ICO.fix, 'Reparar', 'Reparar todos los componentes dañados y quitar fallas', () => { this.pushHist(); this.net.repairAll(); this.net.doc.wires = this.net.doc.wires.filter((w) => !w.fault); this.net.invalidate(); this.alerts = []; this.fx = []; this.updateBanner(); }, { parent: gf });
        const gs = el('div', 'tl-grp'); this.bar.append(gs);
        this.mkBtn(ICO.save, '', 'Guardar el circuito en un archivo', () => this.saveFile(), { parent: gs });
        this.mkBtn(ICO.open, '', 'Abrir un circuito guardado', () => this.openFile(), { parent: gs });
      }
      /* velocidad y parásitos */
      const gv = el('div', 'tl-grp'); this.bar.append(gv);
      const sp = document.createElement('select'); sp.className = 'tl-sel'; sp.title = 'Velocidad de la simulación';
      for (const [v, t] of [[0.1, '0,1×'], [0.25, '0,25×'], [0.5, '0,5×'], [1, '1×'], [2, '2×'], [5, '5×'], [20, '20×']]) { const o = document.createElement('option'); o.value = v; o.textContent = 'Velocidad ' + t; sp.append(o); }
      sp.value = this.speed; sp.addEventListener('change', () => { this.speed = +sp.value; });
      gv.append(sp);
      const ff = document.createElement('select'); ff.className = 'tl-sel'; ff.title = 'Avanza la simulación sin dibujar: útil para llegar al régimen permanente';
      const o0 = document.createElement('option'); o0.value = ''; o0.textContent = 'Avanzar…'; ff.append(o0);
      for (const [v, t] of [[0.01, '10 ms'], [0.1, '100 ms'], [1, '1 s'], [5, '5 s'], [20, '20 s']]) { const o = document.createElement('option'); o.value = v; o.textContent = '+' + t + ' de simulación'; ff.append(o); }
      ff.addEventListener('change', () => { if (ff.value) this.fastForward(+ff.value); ff.value = ''; });
      gv.append(ff);
      if (this.cfg.edit !== 'none') {
        const lab = el('label', 'tl-chk'); const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!this.net.cfg.par; cb.addEventListener('change', () => { this.net.cfg.par = cb.checked; this.net.invalidate(); });
        lab.append(cb, el('span', null, 'Efectos parásitos'));
        lab.title = 'ESR y ESL de condensadores, capacitancias de los transistores y de las uniones: más realista pero más lento';
        gv.append(lab);
        const lab2 = el('label', 'tl-chk'); const cb2 = document.createElement('input'); cb2.type = 'checkbox'; cb2.checked = !!this.net.cfg.tolErr; cb2.addEventListener('change', () => { this.net.cfg.tolErr = cb2.checked; this.net.invalidate(); });
        lab2.append(cb2, el('span', null, 'Tolerancias reales'));
        lab2.title = 'Cada resistor tiene un valor ligeramente distinto dentro de su tolerancia';
        gv.append(lab2);
        const lab3 = el('label', 'tl-chk'); const cb3 = document.createElement('input'); cb3.type = 'checkbox'; cb3.checked = this.net.cfg.damage !== false; cb3.addEventListener('change', () => { this.net.cfg.damage = cb3.checked; });
        lab3.append(cb3, el('span', null, 'Los componentes se dañan'));
        gv.append(lab3);
      }
    }
    buildPalette() {
      this.palBox.innerHTML = '';
      if (this.edit !== 'full') { this.palBox.hidden = true; return; }
      this.palBox.hidden = false;
      const tabs = el('div', 'tl-ptabs'); this.palBox.append(tabs);
      const items = el('div', 'tl-pitems'); this.palBox.append(items);
      this.palCat = this.palCat || PT.CATS[1];
      const show = () => {
        items.innerHTML = '';
        for (const t of Object.keys(CAT)) {
          const c = CAT[t];
          if (c.cat !== this.palCat) continue;
          const b = el('button', 'tl-chip' + (this.placing === t ? ' on' : ''), c.name);
          b.type = 'button'; b.title = c.name;
          b.addEventListener('click', () => { this.setTool('place', t); show(); });
          items.append(b);
        }
      };
      for (const cat of PT.CATS) {
        const b = el('button', 'tl-ptab' + (cat === this.palCat ? ' on' : ''), cat);
        b.type = 'button';
        b.addEventListener('click', () => { this.palCat = cat; [...tabs.children].forEach((x) => x.classList.toggle('on', x === b)); show(); });
        tabs.append(b);
      }
      show();
      this._palShow = show;
    }
    buildPanels() {
      const want = this.cfg.panels || [];
      this.panels = [];
      this.tabsEl.innerHTML = ''; this.panelHost.innerHTML = '';
      const defs = { scope: PN.scope, bode: PN.bode, sweep: PN.sweep, table: PN.table };
      let first = null;
      for (const id of want) {
        const mk = defs[id]; if (!mk) continue;
        const p = mk(this, this.panelHost); p.id = id;
        const b = el('button', 'tl-ptab', p.title); b.type = 'button';
        b.addEventListener('click', () => this.showPanel(p));
        p.tab = b; this.tabsEl.append(b); p.el.hidden = true; this.panelHost.append(p.el);
        this.panels.push(p);
        if (!first) first = p;
      }
      this.panelBox.hidden = !this.panels.length;
      if (first) this.showPanel(first);
      this.tabsEl.hidden = this.panels.length < 2;
    }
    showPanel(p) {
      this.panels.forEach((q) => { q.el.hidden = q !== p; q.tab.classList.toggle('on', q === p); });
      this.curPanel = p;
      if (p.refresh) p.refresh();
      if (p.rebuild) p.rebuild();
      if (p.id === 'bode' && this.cfg.autoBode) setTimeout(() => p.run(), 50);
      if (p.id === 'sweep' && this.cfg.autoSweep) setTimeout(() => p.run(), 60);
      this.sim._resize(); this.redraw();
    }
    addControls() {
      const sim = this.sim;
      for (const k of this.cfg.controls) {
        const apply = (v) => { k.apply(this, v, this.net.doc); this.net.invalidate(); };
        if (k.type === 'slider') sim.slider(k.id, { label: k.label, min: k.min, max: k.max, step: k.step, value: k.value, unit: k.unit, log: k.log, fmt: k.fmt, onInput: apply });
        else if (k.type === 'select') sim.select(k.id, { label: k.label, options: k.options, value: k.value, onInput: (v) => apply(v) });
        else if (k.type === 'seg') sim.seg(k.id, { label: k.label, options: k.options, value: k.value, onInput: apply });
        else if (k.type === 'check') sim.check(k.id, { label: k.label, value: k.value, onInput: apply });
        else if (k.type === 'button') sim.button(k.label, () => { k.apply(this, null, this.net.doc); this.net.invalidate(); });
        if (k.value !== undefined && k.init !== false) k.apply(this, k.value, this.net.doc);
      }
      for (const o of this.cfg.outs) sim.out(o.id, o.label, { hl: o.hl });
      this.net.invalidate();
    }
    setEdit(mode) {
      this.edit = mode; this.tool = 'select'; this.placing = null;
      this.buildBar(); this.buildPalette(); this.showProps(); this.sim._resize(); this.redraw();
    }
    setTool(t, type) {
      this.tool = t; this.placing = t === 'place' ? type : null; this.wiring = null; this.shortFrom = null;
      if (this.btn) { for (const k of ['sel', 'wire']) if (this.btn[k]) this.btn[k].classList.toggle('on', (k === 'sel' && t === 'select') || (k === 'wire' && t === 'wire')); if (this.btn.short) this.btn.short.classList.toggle('on', t === 'short'); }
      if (this._palShow) this._palShow();
      this.cv.el.style.cursor = t === 'select' ? '' : 'crosshair';
      this.updateToolHint();
      this.redraw();
    }
    /* Instrucción en pantalla mientras la herramienta de cortocircuito está activa */
    updateToolHint() {
      const h = this.toolHint; if (!h) return;
      if (this.tool === 'short') {
        h.hidden = false;
        h.innerHTML = this.shortFrom
          ? `<b>⚡ Paso 2/2:</b> elegido <b>${this.shortFrom.P.id}</b> (pin ${this.shortFrom.i + 1}). Clic en <b>otro terminal</b> para unirlos con un cable sin resistencia.`
          : `<b>⚡ Falla de cortocircuito · paso 1/2:</b> clic en un <b>terminal</b> (punto rojo) y luego en otro; se unen con un cable sin resistencia. «Reparar» lo quita.`;
      } else h.hidden = true;
    }
    redraw() { this.sim.redraw(); }
    /* Avanza T segundos simulados con un paso grande (sin muestrear) y conserva el último tramo en los osciloscopios */
    fastForward(T) {
      const net = this.net;
      if (net.dirty) this.rebuild();
      if (!net.dyn || !net.cir || !net.cir.x) return;
      const win = this.N * this.dt;
      const dtj = Math.max(this.dt, T / 20000);
      const n = Math.ceil(Math.max(0, T - win) / dtj);
      for (let k = 0; k < n; k++) if (!net.step(dtj)) break;
      for (const kk in this.rings) this.rings[kk].clear();
      for (const m of this.meters) m.ring.clear();
      const nw = Math.ceil(Math.min(T, win) / this.dt);
      for (let k = 0; k < nw; k++) { if (!net.step(this.dt)) break; this.sampleOnce(); }
      this.simT = net.cir.t;
      this.redraw();
    }
    setTdiv(t) {
      this.tdiv = t; this.dt = (10 * t) / this.N; this.scope.tdiv = t;
      if (this.scope.tsel) this.scope.tsel.value = t;
      for (const k in this.rings) this.rings[k].clear();
      for (const m of this.meters) m.ring.clear();
      for (const k in this.wring || {}) { this.wring[k].p.clear(); this.wring[k].i.clear(); }
      this.carry = 0;
    }

    /* ======================= vista ======================= */
    docBBox() {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      for (const P of this.net.doc.parts) { const b = SYM.bbox(P); x0 = Math.min(x0, b[0] - 0.5); y0 = Math.min(y0, b[1] - 1.5); x1 = Math.max(x1, b[2] + (CAT[P.t].instrument ? 0.5 : 3.2)); y1 = Math.max(y1, b[3] + 1.2); }
      for (const w of this.net.doc.wires) for (const q of w.pts) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); }
      if (x0 > x1) { x0 = 0; y0 = 0; x1 = 30; y1 = 18; }
      return [x0, y0, x1, y1];
    }
    fitView() {
      const w = this.cv.w, h = this.cv.h; if (!w || !h) return;
      this._fitted = true;
      const b = this.docBBox();
      const minW = this.edit === 'full' ? 36 : 8, minH = this.edit === 'full' ? 20 : 6;
      let bw = Math.max(b[2] - b[0], minW), bh = Math.max(b[3] - b[1], minH);
      const s = Math.min((w - 20) / bw, (h - 20) / bh, 44);
      this.view.s = s;
      this.view.ox = (w - (b[2] - b[0]) * s) / 2 - b[0] * s;
      this.view.oy = (h - (b[3] - b[1]) * s) / 2 - b[1] * s;
      this.redraw();
    }
    toWorld(px, py) { return [(px - this.view.ox) / this.view.s, (py - this.view.oy) / this.view.s]; }
    toScreen(x, y) { return [x * this.view.s + this.view.ox, y * this.view.s + this.view.oy]; }

    /* ======================= historial ======================= */
    pushHist() { this.hist.push(JSON.stringify(this.net.doc)); if (this.hist.length > 60) this.hist.shift(); this.future = []; }
    undo() { if (!this.hist.length) return; this.future.push(JSON.stringify(this.net.doc)); this.restoreDoc(this.hist.pop()); }
    redo() { if (!this.future.length) return; this.hist.push(JSON.stringify(this.net.doc)); this.restoreDoc(this.future.pop()); }
    restoreDoc(s) { const rt = this.net.rt; this.net.load(JSON.parse(s)); this.net.rt = rt; this.clearSel(); this.net.invalidate(); this.showProps(); this.autosave(); }
    autosave() { if (!this.cfg.autosave) return; try { localStorage.setItem(LS, JSON.stringify(this.net.doc)); } catch (e) { /* ignora */ } }

    /* ======================= edición ======================= */
    clearSel() { this.sel.parts.clear(); this.sel.wires.clear(); }
    selPart() { if (this.sel.parts.size !== 1) return null; return this.net.part([...this.sel.parts][0]); }
    rotateSel() { if (this.placing) { this.placeRot = ((this.placeRot || 0) + 1) % 4; return; } const P = this.selPart(); if (!P) return; this.pushHist(); this.moveWithPins(P, () => { P.rot = ((P.rot || 0) + 1) % 4; }); this.net.invalidate(); }
    flipSel() { const P = this.selPart(); if (!P) return; this.pushHist(); this.moveWithPins(P, () => { P.flip = !P.flip; }); this.net.invalidate(); }
    deleteSel() {
      if (this.edit !== 'full') return;
      if (!this.sel.parts.size && !this.sel.wires.size) return;
      this.pushHist();
      const d = this.net.doc;
      d.parts = d.parts.filter((p) => !this.sel.parts.has(p.id));
      d.wires = d.wires.filter((w, i) => !this.sel.wires.has(i));
      for (const id of this.sel.parts) delete this.net.rt[id];
      this.clearSel(); this.net.invalidate(); this.showProps(); this.autosave();
    }
    /* mueve los extremos de cable que están sobre los pines de P mientras se aplica fn(P) */
    moveWithPins(P, fn) {
      const n = CAT[P.t].pins.length;
      const before = []; for (let i = 0; i < n; i++) before.push(PT.pinPos(P, i));
      fn();
      for (let i = 0; i < n; i++) { const a = PT.pinPos(P, i); this.relocate(before[i], a); }
    }
    relocate(from, to) {
      if (from[0] === to[0] && from[1] === to[1]) return;
      for (const w of this.net.doc.wires) {
        for (const idx of [0, w.pts.length - 1]) {
          const q = w.pts[idx];
          if (q[0] !== from[0] || q[1] !== from[1]) continue;
          const nb = idx === 0 ? w.pts[1] : w.pts[w.pts.length - 2];
          if (!nb) { w.pts[idx] = [to[0], to[1]]; continue; }
          const wasH = nb[1] === q[1], wasV = nb[0] === q[0];
          w.pts[idx] = [to[0], to[1]];
          if ((wasH && nb[1] !== to[1]) || (wasV && nb[0] !== to[0])) {
            const c = wasH ? [to[0], nb[1]] : [nb[0], to[1]];
            if (idx === 0) w.pts.splice(1, 0, c); else w.pts.splice(w.pts.length - 1, 0, c);
          }
        }
      }
    }
    addPart(type, x, y, rot) {
      const P = PT.newPart(type, x, y, { id: this.net.nextId(type), rot: rot || 0 });
      this.net.doc.parts.push(P);
      this.net.assignTol();
      this.net.invalidate();
      return P;
    }
    addWire(pts, fault) {
      const clean = [pts[0]];
      for (let i = 1; i < pts.length; i++) if (pts[i][0] !== clean[clean.length - 1][0] || pts[i][1] !== clean[clean.length - 1][1]) clean.push(pts[i]);
      if (clean.length < 2) return null;
      const w = { pts: clean.map((q) => [q[0], q[1]]) };
      if (fault) w.fault = true;
      this.net.doc.wires.push(w);
      this.net.invalidate();
      return w;
    }
    route(a, b, vfirst) {
      if (a[0] === b[0] || a[1] === b[1]) return [a, b];
      return vfirst ? [a, [a[0], b[1]], b] : [a, [b[0], a[1]], b];
    }

    /* ======================= búsqueda ======================= */
    pinAt(wx, wy, r = 0.5) {
      let best = null, bd = r;
      for (const P of this.net.doc.parts) {
        const c = CAT[P.t];
        for (let i = 0; i < c.pins.length; i++) { const q = PT.pinPos(P, i); const d = Math.hypot(q[0] - wx, q[1] - wy); if (d < bd) { bd = d; best = { P, i, x: q[0], y: q[1] }; } }
      }
      return best;
    }
    wireAt(wx, wy, r = 0.35) {
      let best = null, bd = r;
      this.net.doc.wires.forEach((w, wi) => {
        for (let k = 1; k < w.pts.length; k++) {
          const a = w.pts[k - 1], b = w.pts[k];
          const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy;
          const t = L2 ? Math.max(0, Math.min(1, ((wx - a[0]) * dx + (wy - a[1]) * dy) / L2)) : 0;
          const d = Math.hypot(a[0] + t * dx - wx, a[1] + t * dy - wy);
          if (d < bd) { bd = d; best = { wi, x: a[0] + t * dx, y: a[1] + t * dy }; }
        }
      });
      return best;
    }
    partAt(wx, wy) {
      const parts = this.net.doc.parts;
      for (let k = parts.length - 1; k >= 0; k--) {
        const P = parts[k], b = SYM.bbox(P), pad = 0.15;
        if (wx >= b[0] - pad && wx <= b[2] + pad && wy >= b[1] - pad && wy <= b[3] + pad) return P;
      }
      return null;
    }

    /* ======================= eventos ======================= */
    bindEvents() {
      const cv = this.cv.el;
      const pts = new Map();
      let pinch = null;
      const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      cv.addEventListener('pointerdown', (e) => {
        cv.focus({ preventScroll: true });
        cv.setPointerCapture(e.pointerId);
        const p = pos(e); pts.set(e.pointerId, p);
        if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), s: this.view.s, cx: (a[0] + b[0]) / 2, cy: (a[1] + b[1]) / 2 }; this.drag = null; return; }
        this.onDown(p, e);
      });
      cv.addEventListener('pointermove', (e) => {
        const p = pos(e);
        if (pts.has(e.pointerId)) pts.set(e.pointerId, p);
        if (pinch && pts.size === 2) {
          const [a, b] = [...pts.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
          this.zoomAt(pinch.cx, pinch.cy, Math.max(6, Math.min(80, pinch.s * d / pinch.d)));
          return;
        }
        this.onMove(p, e);
      });
      const up = (e) => { const p = pos(e); pts.delete(e.pointerId); if (pinch && pts.size < 2) { pinch = null; return; } this.onUp(p, e); };
      cv.addEventListener('pointerup', up);
      cv.addEventListener('pointercancel', (e) => { pts.delete(e.pointerId); pinch = null; this.drag = null; this.wiring = null; this.redraw(); });
      cv.addEventListener('wheel', (e) => {
        const p = pos(e);
        const P = this.partAt(...this.toWorld(...p));
        if (P && P.t === 'POT' && this.edit !== 'none') { e.preventDefault(); this.setProp(P, 'pos', Math.max(0, Math.min(1, P.p.pos - Math.sign(e.deltaY) * 0.05))); this.showProps(); return; }
        if (!e.ctrlKey && !e.shiftKey && !this.cfg.zoomWheel && this.edit !== 'full') return; /* no secuestra el scroll de la página */
        e.preventDefault();
        this.zoomAt(p[0], p[1], Math.max(6, Math.min(80, this.view.s * (e.deltaY < 0 ? 1.12 : 1 / 1.12))));
      }, { passive: false });
      cv.addEventListener('keydown', (e) => this.onKey(e));
      cv.addEventListener('dblclick', (e) => { if (this.wiring) { this.wiring = null; this.redraw(); } });
      cv.addEventListener('contextmenu', (e) => { e.preventDefault(); if (this.tool !== 'select') this.setTool('select'); });
    }
    zoomAt(px, py, s) {
      const [wx, wy] = this.toWorld(px, py);
      this.view.s = s; this.view.ox = px - wx * s; this.view.oy = py - wy * s;
      this.redraw();
    }
    onKey(e) {
      const k = e.key;
      if (k === 'Escape') { this.setTool('select'); this.clearSel(); this.showProps(); return; }
      if (this.edit !== 'full') return;
      if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); this.deleteSel(); }
      else if (k === 'r' || k === 'R') { e.preventDefault(); this.rotateSel(); }
      else if (k === 'f' || k === 'F') { e.preventDefault(); this.flipSel(); }
      else if ((e.ctrlKey || e.metaKey) && (k === 'z' || k === 'Z')) { e.preventDefault(); this.undo(); }
      else if ((e.ctrlKey || e.metaKey) && (k === 'y' || k === 'Y')) { e.preventDefault(); this.redo(); }
      else if ((e.ctrlKey || e.metaKey) && (k === 'c' || k === 'C')) { this.clip = [...this.sel.parts].map((id) => clone(this.net.part(id))); }
      else if ((e.ctrlKey || e.metaKey) && (k === 'v' || k === 'V') && this.clip) {
        this.pushHist(); this.clearSel();
        for (const src of this.clip) { const P = clone(src); P.id = this.net.nextId(P.t); P.x += 2; P.y += 2; P.dead = null; this.net.doc.parts.push(P); this.sel.parts.add(P.id); }
        this.net.invalidate(); this.showProps();
      }
      else if (k === ' ') { e.preventDefault(); this.sim.toggle(); }
      this.redraw();
    }
    onDown(p, e) {
      const [wx, wy] = this.toWorld(p[0], p[1]);
      const sx = Math.round(wx), sy = Math.round(wy);
      this.mouse.down = true; this.mouse.start = p; this.mouse.moved = false;
      const full = this.edit === 'full';
      if (this.tool === 'place' && full) {
        this.pushHist();
        const P = this.addPart(this.placing, sx, sy, this.placeRot || 0);
        this.clearSel(); this.sel.parts.add(P.id); this.showProps();
        if (/^(GND|LBL)$/.test(P.t) === false) { /* permanece en modo colocación */ }
        this.drag = null; this.autosave();
        return;
      }
      if (this.tool === 'short') {
        const pin = this.pinAt(wx, wy, 0.7);
        if (pin) {
          if (!this.shortFrom) { this.shortFrom = pin; this.updateToolHint(); this.redraw(); }
          else if (pin.P === this.shortFrom.P && pin.i === this.shortFrom.i) { this.shortFrom = null; this.updateToolHint(); this.redraw(); }
          else {
            this.pushHist();
            const a = [this.shortFrom.x, this.shortFrom.y], b = [pin.x, pin.y];
            this.addWire(this.route(a, b, a[1] !== b[1] && Math.abs(a[0] - b[0]) < 3), true);
            this.shortFrom = null; this.setTool('select'); this.autosave();
          }
        } else { this.shortFrom = null; this.updateToolHint(); this.redraw(); }
        return;
      }
      if (this.tool === 'wire' && full) {
        const pin = this.pinAt(wx, wy, 0.7);
        if (this.wiring) { /* segundo clic */ this.finishWire(wx, wy, pin); return; }
        const w = this.wireAt(wx, wy, 0.4);
        const start = pin ? [pin.x, pin.y] : w ? [Math.round(w.x), Math.round(w.y)] : [sx, sy];
        this.wiring = { a: start, b: start, v: false, click: true };
        return;
      }
      /* seleccionar */
      const pin = full ? this.pinAt(wx, wy, 0.4) : null;
      if (pin && full) { this.wiring = { a: [pin.x, pin.y], b: [pin.x, pin.y], v: false, drag: true }; return; }
      const P = this.partAt(wx, wy);
      if (P) {
        const add = e.shiftKey;
        if (!this.sel.parts.has(P.id)) { if (!add) this.clearSel(); this.sel.parts.add(P.id); }
        else if (add) { this.sel.parts.delete(P.id); }
        this.showProps();
        if (/^(SW|SPDT|JMP)$/.test(P.t) || (P.t === 'SW' && P.p.momentary)) { this.pressPart = P; if (P.t === 'SW' && P.p.momentary) { P.p.on = true; this.net.invalidate(); } }
        if (full) { this.drag = { kind: 'parts', ox: sx, oy: sy, hist: false, start: [...this.sel.parts].map((id) => { const q = this.net.part(id); return { id, x: q.x, y: q.y }; }) }; }
        return;
      }
      const w = this.wireAt(wx, wy, 0.4);
      if (w) { if (!e.shiftKey) this.clearSel(); this.sel.wires.add(w.wi); this.showProps(); if (full) this.drag = { kind: 'wire', wi: w.wi, ox: sx, oy: sy, hist: false, orig: clone(this.net.doc.wires[w.wi].pts) }; return; }
      if (e.shiftKey && full) { this.drag = { kind: 'marquee', a: p, b: p }; return; }
      this.clearSel(); this.showProps();
      this.drag = { kind: 'pan', ox: p[0], oy: p[1], vx: this.view.ox, vy: this.view.oy };
    }
    onMove(p, e) {
      const [wx, wy] = this.toWorld(p[0], p[1]);
      const sx = Math.round(wx), sy = Math.round(wy);
      this.mouse.x = p[0]; this.mouse.y = p[1]; this.mouse.wx = wx; this.mouse.wy = wy; this.mouse.sx = sx; this.mouse.sy = sy;
      if (this.mouse.start && Math.hypot(p[0] - this.mouse.start[0], p[1] - this.mouse.start[1]) > 4) this.mouse.moved = true;
      if (this.wiring) { this.wiring.b = [sx, sy]; this.wiring.v = Math.abs(wy - this.wiring.a[1]) > Math.abs(wx - this.wiring.a[0]) * 1.2; }
      const d = this.drag;
      if (d && this.mouse.down) {
        if (d.kind === 'pan') { this.view.ox = d.vx + p[0] - d.ox; this.view.oy = d.vy + p[1] - d.oy; }
        else if (d.kind === 'marquee') d.b = p;
        else if (d.kind === 'parts' && this.mouse.moved) {
          const dx = sx - d.ox, dy = sy - d.oy;
          if ((dx || dy) && !d.hist) { this.pushHist(); d.hist = true; }
          for (const s of d.start) {
            const P = this.net.part(s.id); const nx = s.x + dx, ny = s.y + dy;
            if (P.x !== nx || P.y !== ny) this.moveWithPins(P, () => { P.x = nx; P.y = ny; });
          }
          this.net.invalidate();
        } else if (d.kind === 'wire' && this.mouse.moved) {
          const dx = sx - d.ox, dy = sy - d.oy;
          if ((dx || dy) && !d.hist) { this.pushHist(); d.hist = true; }
          const w = this.net.doc.wires[d.wi]; w.pts = d.orig.map((q) => [q[0] + dx, q[1] + dy]); this.net.invalidate();
        }
      }
      /* sugerencia al pasar el ratón */
      this.hover = null;
      const pin = this.pinAt(wx, wy, 0.45);
      if (pin) this.hover = { kind: 'pin', ...pin };
      else { const P = this.partAt(wx, wy); if (P) this.hover = { kind: 'part', P }; else { const w = this.wireAt(wx, wy, 0.35); if (w) this.hover = { kind: 'wire', ...w }; } }
      this.updateTip(p);
      this.redraw();
    }
    onUp(p, e) {
      const [wx, wy] = this.toWorld(p[0], p[1]);
      this.mouse.down = false;
      if (this.pressPart) {
        const P = this.pressPart; this.pressPart = null;
        if (P.t === 'SW') {
          if (P.p.momentary) { P.p.on = false; this.net.invalidate(); }
          else if (!this.mouse.moved) { P.p.on = !P.p.on; this.net.invalidate(); this.showProps(); }
        } else if (P.t === 'SPDT' && !this.mouse.moved) { P.p.pos = +P.p.pos === 0 ? 1 : 0; this.net.invalidate(); this.showProps(); }
        else if (P.t === 'JMP' && !this.mouse.moved) { P.p.on = !P.p.on; this.net.invalidate(); this.showProps(); }
      }
      if (this.wiring && this.wiring.drag) {
        const pin = this.pinAt(wx, wy, 0.7);
        if (this.mouse.moved || pin) this.finishWire(wx, wy, pin);
        else this.wiring = null;
      }
      if (this.drag && this.drag.kind === 'marquee') {
        const [a, b] = [this.toWorld(...this.drag.a), this.toWorld(...this.drag.b)];
        const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]), y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1]);
        for (const P of this.net.doc.parts) { const bb = SYM.bbox(P); if (bb[0] >= x0 && bb[2] <= x1 && bb[1] >= y0 && bb[3] <= y1) this.sel.parts.add(P.id); }
        this.showProps();
      }
      if (this.drag && this.drag.hist) this.autosave();
      this.drag = null; this.mouse.start = null;
      this.redraw();
    }
    finishWire(wx, wy, pin) {
      const a = this.wiring.a;
      let b = pin ? [pin.x, pin.y] : [Math.round(wx), Math.round(wy)];
      const wr = this.wireAt(wx, wy, 0.4);
      if (!pin && wr) b = [Math.round(wr.x), Math.round(wr.y)];
      const vfirst = this.wiring.v;
      this.wiring = null;
      if (a[0] === b[0] && a[1] === b[1]) return;
      this.pushHist();
      this.addWire(this.route(a, b, vfirst));
      this.autosave();
    }
    updateTip(p) {
      const t = this.tipEl; if (!this.hover || !this.net.cir || !this.net.cir.x) { t.hidden = true; return; }
      let s = '';
      const net = this.net;
      if (this.hover.kind === 'pin') {
        const P = this.hover.P, i = this.hover.i, nn = net.netInfo.pinNet[P.id][i];
        s = `<b>${P.id}.${CAT[P.t].pn[i]}</b> · ${EM.si(net.v(nn), 'V', 3)}`;
      } else if (this.hover.kind === 'wire') {
        const w = net.doc.wires[this.hover.wi]; const nn = net.netInfo.nameOf(key(w.pts[0][0], w.pts[0][1]));
        s = `<b>Nodo ${net.netLabel(nn)}</b> · ${EM.si(net.v(nn), 'V', 3)}`;
      } else {
        const P = this.hover.P, c = CAT[P.t];
        s = `<b>${P.id}</b> ${c.name}`;
        if (!c.ground && P.t !== 'LBL' && net.rt[P.id] && net.rt[P.id].ref && net.rt[P.id].ref.main) { const m = net.rt[P.id].ref.main; s += ` · ${EM.si(net.iPart(P), 'A', 3)}`; }
        if (P.dead) s += ` · <span class="tl-bad">${P.dead.kind}</span>`;
      }
      t.innerHTML = s; t.hidden = false;
      t.style.left = Math.min(p[0] + 14, this.cv.w - 190) + 'px'; t.style.top = Math.max(4, p[1] - 30) + 'px';
    }

    /* ======================= utilidades para los capítulos ======================= */
    set(id, k, v) { const P = this.net.part(id); if (!P) return; P.p[k] = v; if (CAT[P.t].apply && (k === 'kind' || k === 'model')) CAT[P.t].apply(P); if (k === 'tol') this.net.assignTol(); this.net.invalidate(); if (this.selPart() === P) this.showProps(); }
    v(ref) { const nn = this.netOf(ref); return nn === null || !this.net.cir ? NaN : this.net.v(nn); }
    vd(a, b) { return this.v(a) - (b === undefined ? 0 : this.v(b)); }
    i(id) { const P = this.net.part(id); return P ? this.net.iPart(P) : NaN; }
    m(id) { const r = this.net.rt[id]; return r && r.ref ? r.ref.main : null; }
    stat(label) { const ch = this.channels.find((c) => c.label === label || c.id === label); if (!ch) return null; const r = this.rings[ch.id]; if (!r || r.count() < 5) return null; return PN.stats(r.last(Math.min(this.N, r.count())), this.dt, r.last(Math.min(this.N * 3, r.count()))); }
    /* potencia media absorbida (W) y corriente eficaz de un componente vigilado (cfg.watch) */
    pw(id) { const w = this.wring && this.wring[id]; if (!w || w.p.count() < 5) return NaN; const a = w.p.last(Math.min(this.N, w.p.count())); let s = 0; for (const v of a) s += v; return s / a.length; }
    ipk(id) { const w = this.wring && this.wring[id]; if (!w || w.i.count() < 5) return NaN; const a = w.i.last(Math.min(this.N, w.i.count())); let m = 0; for (const v of a) m = Math.max(m, Math.abs(v)); return m; }
    irms(id) { const w = this.wring && this.wring[id]; if (!w || w.i.count() < 5) return NaN; const a = w.i.last(Math.min(this.N, w.i.count())); let s = 0; for (const v of a) s += v * v; return Math.sqrt(s / a.length); }
    setSweep(o) { const p = this.panels.find((q) => q.id === 'sweep'); if (p) p.setCfg(o); }
    setBode(a, b) { const p = this.panels.find((q) => q.id === 'bode'); if (p) p.setRange(a, b); }
    /* sustituye todo el circuito por otra especificación (EM.Net.fromSpec) */
    loadSpec(spec) { const rt = this.net.rt; this.net.load(EM.Net.fromSpec(spec)); this.clearSel(); this.net.invalidate(); this.showProps(); this.needZero = !!this.cfg.startZero; this.hist = []; this.future = []; this.fitView(); }
    /* texto que mostraría el multímetro: {text, unit} */
    dmm(id) { const P = this.net.part(id); if (!P || !this.net.cir || !this.net.cir.x) return { text: '—', unit: '' }; const st = {}; this.meterFace(P, st); return st; }
    meterOf(id) { const m = this.meters.find((q) => q.id === id); if (!m || m.ring.count() < 5) return null; const a = m.ring.last(Math.min(this.N, m.ring.count())); return PN.stats(a, this.dt); }

    /* ======================= propiedades ======================= */
    setProp(P, k, v) {
      P.p[k] = v;
      const c = CAT[P.t];
      if (c.apply && (k === 'kind' || k === 'model')) c.apply(P);
      if (k === 'tol') this.net.assignTol();
      this.net.invalidate(); this.autosave();
    }
    showProps() {
      const box = this.propBox; box.innerHTML = '';
      const P = this.selPart();
      if (!P) {
        if (this.sel.wires.size) { box.append(el('div', 'tl-ph', 'Cable seleccionado'), el('div', 'tl-sm', 'Presione Supr para eliminarlo.')); return; }
        if (this.sel.parts.size > 1) { box.append(el('div', 'tl-ph', this.sel.parts.size + ' componentes seleccionados'), el('div', 'tl-sm', 'Arrástrelos juntos o presione Supr.')); return; }
        box.hidden = this.edit === 'none' || this.cfg.showHelp === false; if (!box.hidden) box.append(el('div', 'tl-sm', this.edit === 'full' ? 'Elija una pieza de la paleta y haga clic en el lienzo. Arrastre desde un terminal para tender un cable. Clic en un componente para ver y cambiar sus propiedades.' : 'Haga clic en un componente para cambiar su valor o ponerle una falla.'));
        return;
      }
      box.hidden = false;
      const c = CAT[P.t];
      box.append(el('div', 'tl-ph', `<b>${P.id}</b> · ${c.name}`));
      this.liveBox = el('div', 'tl-live'); box.append(this.liveBox);
      for (const f of c.props) {
        if (f.edu && !((P.p.model || '').startsWith('EDU'))) continue;
        const row = el('div', 'tl-prow');
        const id = 'tlp-' + this.sim.name + '-' + P.id + '-' + f.k;
        const lab = el('label', null, f.label + (f.unit && f.kind === 'num' ? ` (${f.unit})` : '')); lab.htmlFor = id;
        row.append(lab);
        if (f.kind === 'num') {
          const inp = document.createElement('input'); inp.id = id; inp.className = 'tl-in wide'; inp.value = this.fmtNum(P.p[f.k], f);
          inp.addEventListener('change', () => { let v = PT.parseVal(inp.value); if (!isFinite(v)) { inp.value = this.fmtNum(P.p[f.k], f); return; } if (f.min !== undefined) v = Math.max(f.min, v); if (f.max !== undefined) v = Math.min(f.max, v); this.pushHist(); this.setProp(P, f.k, v); inp.value = this.fmtNum(v, f); sl && (sl.value = toS(v)); });
          row.append(inp);
          let sl = null, toS = null;
          if (f.slider || (f.log && f.min && f.max)) {
            sl = document.createElement('input'); sl.type = 'range';
            const lg = !!f.log;
            const lo = f.min !== undefined ? f.min : 0, hi = f.max !== undefined ? f.max : 1;
            toS = (v) => (lg ? 1000 * Math.log(Math.max(v, lo) / lo) / Math.log(hi / lo) : 1000 * (v - lo) / (hi - lo));
            const fromS = (s) => (lg ? lo * Math.pow(hi / lo, s / 1000) : lo + (hi - lo) * s / 1000);
            sl.min = 0; sl.max = 1000; sl.value = toS(P.p[f.k]);
            sl.addEventListener('input', () => { let v = fromS(+sl.value); if (lg) v = +v.toPrecision(3); this.setProp(P, f.k, v); inp.value = this.fmtNum(v, f); });
            row.append(sl);
          }
        } else if (f.kind === 'sel') {
          const s = document.createElement('select'); s.id = id; s.className = 'tl-sel wide';
          for (const [v, t] of f.opts) { const o = document.createElement('option'); o.value = v; o.textContent = t; s.append(o); }
          s.value = P.p[f.k];
          s.addEventListener('change', () => { const opt = f.opts.find((o) => String(o[0]) === s.value); this.pushHist(); this.setProp(P, f.k, opt ? opt[0] : s.value); this.showProps(); });
          row.append(s);
        } else if (f.kind === 'bool') {
          const cb = document.createElement('input'); cb.type = 'checkbox'; cb.id = id; cb.checked = !!P.p[f.k];
          cb.addEventListener('change', () => { this.pushHist(); this.setProp(P, f.k, cb.checked); });
          row.classList.add('chk'); row.prepend(cb);
        } else if (f.kind === 'txt') {
          const inp = document.createElement('input'); inp.id = id; inp.className = 'tl-in wide'; inp.value = P.p[f.k] || '';
          inp.addEventListener('change', () => { this.pushHist(); this.setProp(P, f.k, inp.value); });
          row.append(inp);
        }
        box.append(row);
      }
      /* fallas */
      if (this.edit !== 'none' && !c.ground && P.t !== 'LBL') {
        const fb = el('div', 'tl-faults');
        fb.append(el('div', 'tl-sm', 'Fallas:'));
        const mk = (t, kind, o) => { const b = el('button', 'tl-fb' + (P.fault && P.fault.kind === kind ? ' on' : ''), t); b.type = 'button'; b.addEventListener('click', () => { this.pushHist(); P.fault = P.fault && P.fault.kind === kind ? null : Object.assign({ kind }, o); this.net.invalidate(); this.showProps(); }); fb.append(b); };
        mk('Abierto', 'open'); mk('Cortocircuito', 'short'); mk('Fuga', 'leak');
        if (c.defaults.r !== undefined || c.defaults.c !== undefined || c.defaults.l !== undefined) mk('Deriva', 'drift', { factor: P.t === 'C' ? 0.2 : 2 });
        if (P.dead || P.fault) { const b = el('button', 'tl-fb fix', 'Reparar'); b.type = 'button'; b.addEventListener('click', () => { this.pushHist(); this.net.repair(P); this.showProps(); }); fb.append(b); }
        box.append(fb);
        if (P.dead) box.append(el('div', 'tl-bad', P.dead.desc + ' (' + P.dead.why + ')'));
      }
      this.updateLive();
    }
    fmtNum(v, f) {
      if (v === undefined) return '';
      if (f.unit === '%' || f.k === 'pos' || f.k === 'duty' || f.k === 'k' || f.k === 'ctr' || f.k === 'alpha' || f.k === 'n') return String(+(+v).toPrecision(4));
      if (f.unit === 'F' || f.unit === 'H' || f.unit === 'Ω' || f.unit === 'Hz' || f.unit === 'V' || f.unit === 'A' || f.unit === 'W' || f.unit === 'lx') return EM.si(v, '', 4).replace(' ', '');
      return String(+(+v).toPrecision(4));
    }
    updateLive() {
      const P = this.selPart(); if (!P || !this.liveBox || !this.net.cir || !this.net.cir.x) return;
      const net = this.net, r = net.rt[P.id], c = CAT[P.t];
      if (!r || !r.ref || !r.ref.main || c.ground || P.t === 'LBL') { this.liveBox.innerHTML = ''; return; }
      const m = r.ref.main;
      let h = '';
      if (m.type === 'Q') h = `V<sub>CE</sub> = ${EM.si(m.vce, 'V', 3)} · V<sub>BE</sub> = ${EM.si(m.vbe, 'V', 3)}<br>I<sub>C</sub> = ${EM.si(m.ic, 'A', 3)} · I<sub>B</sub> = ${EM.si(m.ib, 'A', 3)} · β = ${Math.abs(m.ib) > 1e-9 ? (m.ic / m.ib).toFixed(0) : '—'}`;
      else if (m.type === 'M') h = `V<sub>DS</sub> = ${EM.si(m.vds, 'V', 3)} · V<sub>GS</sub> = ${EM.si(m.vgs, 'V', 3)}<br>I<sub>D</sub> = ${EM.si(m.ids, 'A', 3)}`;
      else if (m.type === 'OA') h = `Salida = ${EM.si(m.vout, 'V', 3)} · I<sub>sal</sub> = ${EM.si(m.iout, 'A', 3)}${r.ref.railsInt ? '<br><span class="tl-sm">alimentación interna ±' + (m.vcc) + ' V</span>' : ''}`;
      else if (m.type === 'REG') h = `V<sub>ent</sub> = ${EM.si(m.vin, 'V', 3)} · V<sub>sal</sub> = ${EM.si(m.vout, 'V', 3)}<br>I = ${EM.si(m.i, 'A', 3)} · modo ${m.mode}`;
      else if (m.type === 'X') h = `V<sub>1</sub> = ${EM.si(m.vw[0], 'V', 3)} · V<sub>2</sub> = ${EM.si(m.vw[1], 'V', 3)}<br>I<sub>1</sub> = ${EM.si(m.iw[0], 'A', 3)} · I<sub>2</sub> = ${EM.si(m.iw[1], 'A', 3)}`;
      else h = `V = ${EM.si(m.vab, 'V', 3)} · I = ${EM.si(net.iPart(P), 'A', 3)}<br>P = ${EM.si(Math.abs(m.p || 0), 'W', 3)}`;
      if (r.T && r.T > this.net.cfg.Ta + 1) h += `<br>T ≈ ${Math.round(r.T)} °C`;
      if (r.ref.relay) h += `<br>${r.ref.relay.on ? 'energizado' : 'en reposo'}`;
      if (r.motor) h += `<br>${Math.round(Math.abs(r.motor.w) * 60 / (2 * Math.PI))} rpm`;
      this.liveBox.innerHTML = h;
    }

    /* ======================= guardar / abrir ======================= */
    saveFile() {
      const blob = new Blob([JSON.stringify(this.net.doc)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'circuito-dispositivos.json'; document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    }
    openFile() {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
      inp.addEventListener('change', () => {
        const f = inp.files[0]; if (!f) return;
        f.text().then((t) => { try { this.pushHist(); const rt = this.net.rt; this.net.load(JSON.parse(t)); this.clearSel(); this.net.invalidate(); this.reset(); this.fitView(); this.showProps(); } catch (e) { this.showBanner('El archivo no es un circuito válido.'); } });
      });
      inp.click();
    }
    showBanner(msg) { this.banner.hidden = false; this.banner.textContent = msg; this.banner.classList.add('warn'); setTimeout(() => this.updateBanner(), 3000); }

    /* ======================= simulación ======================= */
    resolveChannels() {
      const net = this.net, info = net.netInfo;
      const chs = [];
      const cols = ['#ffd84a', '#4ae3ff', '#7dff82', '#ff7de9', '#ffa55a', '#b9a0ff'];
      let ci = 0;
      for (const P of net.doc.parts) {
        if (P.t !== 'SCOPE') continue;
        const pn = info.pinNet[P.id];
        chs.push({ id: P.id + ':1', label: 'CH1', color: '#ffd84a', net: pn[0], ref: pn[2] });
        chs.push({ id: P.id + ':2', label: 'CH2', color: '#4ae3ff', net: pn[1], ref: pn[2] });
        ci = 2;
      }
      for (const pr of this.cfg.probes || []) {
        const nn = this.netOf(pr.at);
        if (nn === null) continue;
        const rn = pr.ref ? this.netOf(pr.ref) : '0';
        chs.push({ id: 'p:' + pr.label, label: pr.label, color: pr.color || cols[ci++ % cols.length], net: nn, ref: rn === null ? '0' : rn });
        if (pr.ac && this.scope.ac && this.scope.ac['p:' + pr.label] === undefined) this.scope.ac['p:' + pr.label] = true;
      }
      /* PROBE: sondas de tensión como canales extra si no hay osciloscopio */
      this.wring = this.wring || {};
      for (const id of this.cfg.watch || []) if (!this.wring[id]) this.wring[id] = { p: new PN.Ring(this.N * 2), i: new PN.Ring(this.N * 2) };
      this.channels = chs;
      for (const ch of chs) if (!this.rings[ch.id]) this.rings[ch.id] = new PN.Ring(this.N * 4);
      for (const k of Object.keys(this.rings)) if (!chs.some((c) => c.id === k)) delete this.rings[k];
      const sc = this.panels.find((p) => p.id === 'scope'); if (sc && sc.rebuild) sc.rebuild();
      /* multímetros */
      const old = new Map(this.meters.map((m) => [m.id, m]));
      this.meters = [];
      for (const P of net.doc.parts) {
        if (P.t !== 'DMM' && P.t !== 'AMM' && P.t !== 'VM') continue;
        const m = old.get(P.id) || { id: P.id, ring: new PN.Ring(this.N * 2) };
        m.P = P; this.meters.push(m);
      }
    }
    netOf(ref) {
      const info = this.net.netInfo;
      if (!ref) return null;
      if (ref === 'gnd' || ref === '0') return '0';
      const m = /^([^.]+)\.(.+)$/.exec(ref);
      if (m && this.net.part(m[1])) { const P = this.net.part(m[1]); const c = CAT[P.t]; const i = /^\d+$/.test(m[2]) ? +m[2] : c.pn.indexOf(m[2]); if (i >= 0 && info.pinNet[P.id]) return info.pinNet[P.id][i]; }
      if (info.labelNet[ref] !== undefined) return info.labelNet[ref];
      return null;
    }
    rebuild(first) {
      const net = this.net;
      net.rebuild();
      const cir = net.cir;
      if (first || this.needZero) {
        cir.solveDC();
        if (this.cfg.startZero && net.dyn) this.zeroState();
        this.needZero = false;
      } else if (!net.dyn) cir.solveDC();
      else if (!cir.x) cir.solveDC();
      this.resolveChannels();
      for (const p of this.panels) if (p.refresh && p === this.curPanel) p.refresh();
      this.updateBanner();
      if (this.liveBox) this.updateLive();
      if (this.cfg.autoBode && this.curPanel && this.curPanel.id === 'bode') { clearTimeout(this._bt); this._bt = setTimeout(() => this.curPanel.run(), 140); }
    }
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
      this.needZero = true;
      for (const m of Object.values(this.net.rt)) { m.acc = null; if (m.lamp) m.lamp.th = 0.11; if (m.motor) m.motor.w = 0; if (m.t555) m.t555.q = 1; if (m.scr) m.scr.on = false; if (m.triac) m.triac.on = false; if (m.relay) m.relay.on = false; if (m.psu) m.psu.cc = false; }
      this.rebuild();
      for (const k in this.rings) this.rings[k].clear();
      for (const m of this.meters) m.ring.clear();
      this.simT = 0; this.carry = 0;
      if (this.scope.hold) { this.scope.hold = false; this.scope.frozen = null; }
      this.fx = [];
      this.redraw();
    }
    sampleOnce() {
      const net = this.net;
      for (const ch of this.channels) this.rings[ch.id].push(net.v(ch.net) - net.v(ch.ref));
      for (const id in this.wring) { const e = net.rt[id] && net.rt[id].ref && net.rt[id].ref.main; this.wring[id].p.push(e ? e.p || 0 : 0); this.wring[id].i.push(e ? (e.type === 'Q' ? e.ic : e.i) || 0 : 0); }
      for (const m of this.meters) {
        const P = m.P, mode = P.t === 'DMM' ? P.p.mode : P.t === 'AMM' ? 'A=' : 'V=';
        const r = net.rt[P.id], e = r && r.ref && r.ref.main;
        if (!e) { m.ring.push(0); continue; }
        if (/^V/.test(mode)) m.ring.push(e.vab || 0);
        else if (/^A/.test(mode)) m.ring.push(e.i || 0);
        else m.ring.push(0);
      }
    }
    frame(dtw) {
      const net = this.net;
      if (net.dirty) this.rebuild();
      if (!net.cir || !net.cir.x) return;
      if (this.running) {
        const win = this.N * this.dt;
        if (net.dyn) {
          const rate = (win / 1.5) * this.speed; /* segundos simulados por segundo real */
          this.carry += (rate * dtw) / this.dt;
          let steps = Math.floor(this.carry); this.carry -= steps;
          const cap = 6000; if (steps > cap) { steps = cap; this.carry = 0; }
          let fails = 0;
          for (let k = 0; k < steps; k++) {
            if (!net.step(this.dt)) { fails++; if (fails > 3) break; continue; }
            this.sampleOnce();
            net.accumulate(this.dt);
          }
          this.simT = net.cir.t;
          if (fails > 3) { net.cir.restart = true; }
        } else {
          /* circuito estático: valores constantes; el eje de tiempo avanza igual */
          this.carry += (win / 1.5) * this.speed * dtw / this.dt;
          let steps = Math.min(Math.floor(this.carry), this.N); this.carry = 0;
          for (let k = 0; k < steps; k++) this.sampleOnce();
          net.accumulate(dtw);
        }
        const failed = net.tick(dtw);
        if (net.tchg) { net.tchg = false; if (!net.dyn && net.cir) net.cir.solveDC(); } /* circuito estático: la temperatura cambió el punto de operación */
        if (failed.length) this.onFailure(failed);
        if (net.dirty) this.rebuild();
        const sc = net.shortCircuit();
        this.shortInfo = sc;
        this.updateBanner();
      }
      this.phase += dtw;
      this.updateFx(dtw);
      /* lecturas */
      this._panelRefresh += dtw;
      if (this._panelRefresh > 0.2) {
        this._panelRefresh = 0;
        if (this.curPanel && this.curPanel.id === 'table') this.curPanel.refresh();
        this.updateLive(); this.updateOuts(); this.updateGoals();
      }
      if (this.cfg.onFrame) this.cfg.onFrame(this, dtw);
    }
    updateGoals() {
      if (!this.goalItems) return;
      this.cfg.goals.forEach((g, k) => { let ok = false; try { ok = !!g.test(this); } catch (e) { ok = false; } const r = this.goalItems[k]; r.classList.toggle('ok', ok); r.firstChild.textContent = ok ? '✔' : '○'; });
    }
    updateOuts() {
      const o = this.cfg.outs; if (!o || !o.length) return;
      for (const q of o) { try { this.sim.set(q.id, q.fn(this)); } catch (e) { this.sim.set(q.id, '—'); } }
    }
    onFailure(list) {
      for (const P of list) {
        const [x, y] = [P.x, P.y];
        for (let k = 0; k < 24; k++) this.fx.push({ x, y, vx: (Math.random() - 0.5) * 3, vy: -1 - Math.random() * 2.5, life: 1.5 + Math.random() * 2, t: 0, r: 0.3 + Math.random() * 0.5, kind: 'smoke' });
        for (let k = 0; k < 14; k++) this.fx.push({ x, y, vx: (Math.random() - 0.5) * 9, vy: -2 - Math.random() * 6, life: 0.4 + Math.random() * 0.5, t: 0, r: 0.1, kind: 'spark' });
      }
      this.showProps();
    }
    updateFx(dt) {
      for (const f of this.fx) { f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt; if (f.kind === 'smoke') { f.vy -= 0.2 * dt; f.vx *= 0.99; } else f.vy += 14 * dt; }
      this.fx = this.fx.filter((f) => f.t < f.life);
      /* humo continuo en componentes dañados */
      for (const P of this.net.doc.parts) if (P.dead && P.dead.kind !== 'trip' && Math.random() < dt * 5) this.fx.push({ x: P.x + (Math.random() - 0.5), y: P.y, vx: (Math.random() - 0.5) * 0.6, vy: -0.8 - Math.random(), life: 2, t: 0, r: 0.25, kind: 'smoke' });
      if (this.fx.length > 400) this.fx.splice(0, this.fx.length - 400);
    }
    updateBanner() {
      const b = this.banner;
      const msgs = [];
      if (this.shortInfo) msgs.push(`⚡ CORTOCIRCUITO: la fuente ${this.shortInfo.id} entrega ${EM.si(this.shortInfo.i, 'A', 3)}`);
      for (const P of this.net.doc.parts) if (P.dead) msgs.push(`✖ ${P.id}: ${P.dead.desc}`);
      for (const P of this.net.doc.parts) { const r = this.net.rt[P.id]; if (r && r.regHot) msgs.push(`🌡 ${P.id}: protección térmica activada`); if (r && r.fuseBlown) msgs.push(`⚠ ${P.id}: fusible del multímetro quemado`); }
      if (!this.net.warnings.length) { /* ok */ } else msgs.push(...this.net.warnings);
      if (!msgs.length) { b.hidden = true; return; }
      b.hidden = false; b.classList.toggle('warn', true);
      b.innerHTML = msgs.slice(0, 3).map((m) => `<div>${m}</div>`).join('') + (msgs.length > 3 ? `<div>… y ${msgs.length - 3} avisos más</div>` : '');
    }

    /* ======================= dibujo ======================= */
    netColor(nn, vmax) {
      const v = this.net.v(nn);
      if (!this.cfg.colorV || !this.net.cir || !this.net.cir.x) return null;
      const t = Math.max(-1, Math.min(1, v / (vmax || 1)));
      const dark = EM.isDark();
      if (Math.abs(t) < 0.02) return dark ? '#8a97a8' : '#5b6878';
      return t > 0 ? EM.mix(dark ? '#8a97a8' : '#5b6878', dark ? '#4be07c' : '#16a34a', Math.pow(t, 0.6)) : EM.mix(dark ? '#8a97a8' : '#5b6878', dark ? '#ff6a5c' : '#dc2626', Math.pow(-t, 0.6));
    }
    drawAll() {
      this.drawMain();
      for (const p of this.panels) if (!p.el.hidden && p.draw) p.draw();
    }
    drawMain() {
      const cv = this.cv, c = cv.ctx, w = cv.w, h = cv.h; if (!w) return;
      const net = this.net, s = this.view.s;
      c.save();
      c.fillStyle = EM.col('--canvas'); c.fillRect(0, 0, w, h);
      /* rejilla de puntos */
      if (s >= 10 && this.edit === 'full') {
        c.fillStyle = EM.col('--grid-2');
        const x0 = Math.floor(-this.view.ox / s), x1 = Math.ceil((w - this.view.ox) / s), y0 = Math.floor(-this.view.oy / s), y1 = Math.ceil((h - this.view.oy) / s);
        for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) c.fillRect(x * s + this.view.ox - 0.8, y * s + this.view.oy - 0.8, 1.6, 1.6);
      }
      c.translate(this.view.ox, this.view.oy); c.scale(s, s);
      const solved = net.cir && net.cir.x && !net.dirty;
      let vmax = 1;
      if (solved) for (let k = 1; k < net.cir.nNodes; k++) vmax = Math.max(vmax, Math.abs(net.cir.x[k - 1] || 0));
      const info = net.netInfo;
      /* cables */
      const lw = Math.max(1.8, s * 0.09) / s;
      c.lineCap = 'round'; c.lineJoin = 'round';
      const cnt = new Map();
      net.doc.wires.forEach((wr, wi) => {
        const nn = info ? info.nameOf(key(wr.pts[0][0], wr.pts[0][1])) : null;
        let col = (solved && nn !== null ? this.netColor(nn, vmax) : null) || EM.col('--ink-2');
        if (wr.fault) col = EM.col('--c2');
        const selected = this.sel.wires.has(wi);
        c.strokeStyle = selected ? EM.col('--accent') : col; c.lineWidth = selected ? lw * 1.7 : lw;
        if (wr.fault) c.setLineDash([0.5, 0.35]);
        c.beginPath(); wr.pts.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.stroke();
        c.setLineDash([]);
        for (const i of [0, wr.pts.length - 1]) { const k = key(wr.pts[i][0], wr.pts[i][1]); cnt.set(k, (cnt.get(k) || 0) + 1); }
      });
      /* corriente en cables */
      if (solved && this.cfg.showI) this.drawCurrents(c, s);
      /* piezas */
      for (const P of net.doc.parts) {
        for (let i = 0; i < CAT[P.t].pins.length; i++) { const k = key(...PT.pinPos(P, i)); cnt.set(k, (cnt.get(k) || 0) + 1); }
      }
      /* uniones */
      c.fillStyle = EM.col('--ink');
      for (const [k, n] of cnt) {
        let isJ = n >= 3;
        if (!isJ && n === 2) { const [x, y] = k.split(',').map(Number); for (const wr of net.doc.wires) { for (let q = 1; q < wr.pts.length; q++) { const a = wr.pts[q - 1], b = wr.pts[q]; if ((a[0] === b[0] && x === a[0] && y > Math.min(a[1], b[1]) && y < Math.max(a[1], b[1])) || (a[1] === b[1] && y === a[1] && x > Math.min(a[0], b[0]) && x < Math.max(a[0], b[0]))) isJ = true; } } }
        if (isJ) { const [x, y] = k.split(',').map(Number); c.beginPath(); c.arc(x, y, 0.16, 0, Math.PI * 2); c.fill(); }
      }
      for (const P of net.doc.parts) this.drawPart(c, P, solved);
      /* etiquetas */
      for (const P of net.doc.parts) this.drawLabel(c, P, s);
      /* pines (en edición) */
      if (this.edit === 'full') {
        c.fillStyle = EM.col('--accent');
        for (const P of net.doc.parts) { const n = CAT[P.t].pins.length; for (let i = 0; i < n; i++) { const q = PT.pinPos(P, i); const k = key(q[0], q[1]); if ((cnt.get(k) || 0) < 2) { c.globalAlpha = 0.5; c.beginPath(); c.arc(q[0], q[1], 0.17, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; } } }
      }
      /* hover */
      if (this.hover && this.hover.kind === 'pin') { c.strokeStyle = EM.col('--accent'); c.lineWidth = lw * 1.4; c.beginPath(); c.arc(this.hover.x, this.hover.y, 0.42, 0, Math.PI * 2); c.stroke(); }
      /* cable en curso */
      if (this.wiring) {
        c.strokeStyle = EM.col('--accent'); c.lineWidth = lw * 1.3; c.setLineDash([0.4, 0.3]);
        const r = this.route(this.wiring.a, this.wiring.b, this.wiring.v);
        c.beginPath(); r.forEach((q, i) => (i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); c.stroke(); c.setLineDash([]);
      }
      if (this.tool === 'short') { /* marca todos los terminales disponibles */
        c.save(); c.fillStyle = EM.col('--c2'); c.globalAlpha = 0.5;
        for (const P of this.net.doc.parts) { const cc = CAT[P.t]; if (!cc) continue; for (let i = 0; i < cc.pins.length; i++) { const q = PT.pinPos(P, i); c.beginPath(); c.arc(q[0], q[1], 0.28, 0, Math.PI * 2); c.fill(); } }
        c.restore();
      }
      if (this.tool === 'short' && this.shortFrom) { c.strokeStyle = EM.col('--c2'); c.lineWidth = lw * 1.4; c.beginPath(); c.arc(this.shortFrom.x, this.shortFrom.y, 0.5, 0, Math.PI * 2); c.stroke(); }
      /* fantasma al colocar */
      if (this.tool === 'place' && this.placing && this.mouse.sx !== undefined && this.hover !== undefined) {
        const gp = PT.newPart(this.placing, this.mouse.sx, this.mouse.sy, { rot: this.placeRot || 0 });
        c.globalAlpha = 0.55; c.strokeStyle = EM.col('--accent'); c.fillStyle = EM.col('--accent');
        SYM.draw(c, gp, {}, s); c.globalAlpha = 1;
      }
      /* efectos */
      for (const f of this.fx) {
        const a = 1 - f.t / f.life;
        if (f.kind === 'smoke') { c.fillStyle = `rgba(90,90,100,${0.35 * a})`; c.beginPath(); c.arc(f.x, f.y, f.r * (1 + f.t * 1.2), 0, Math.PI * 2); c.fill(); }
        else { c.fillStyle = `rgba(255,${160 + Math.random() * 80},60,${a})`; c.beginPath(); c.arc(f.x, f.y, f.r, 0, Math.PI * 2); c.fill(); }
      }
      c.restore();
      /* marquesina */
      if (this.drag && this.drag.kind === 'marquee') { c.strokeStyle = EM.col('--accent'); c.setLineDash([4, 3]); const a = this.drag.a, b = this.drag.b; c.strokeRect(Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])); c.setLineDash([]); }
      /* leyenda de potencial */
      if (solved && this.cfg.colorV && this.cfg.legend !== false) {
        c.font = `11px ${EM.FONT_MONO}`; c.textBaseline = 'middle'; c.textAlign = 'left';
        const dark = EM.isDark(); const x = w - 100, y = h - 14;
        const g = c.createLinearGradient(x, 0, x + 90, 0); g.addColorStop(0, dark ? '#ff6a5c' : '#dc2626'); g.addColorStop(0.5, dark ? '#8a97a8' : '#5b6878'); g.addColorStop(1, dark ? '#4be07c' : '#16a34a');
        c.fillStyle = g; c.fillRect(x, y - 3, 90, 6);
        c.fillStyle = EM.col('--ink-3'); c.fillText(EM.si(-vmax, 'V', 2), x, y - 10); c.textAlign = 'right'; c.fillText(EM.si(vmax, 'V', 2), x + 90, y - 10);
      }
    }
    drawPart(c, P, solved) {
      const net = this.net, s = this.view.s, cat = CAT[P.t];
      const r = net.rt[P.id] || {};
      const st = {};
      const m = r.ref && r.ref.main;
      if (solved && m) {
        if (P.t === 'LED') { const mod = S.MOD.LED[P.p.color] || S.MOD.LED.rojo; st.bright = P.dead ? 0 : Math.pow(Math.max(0, m.i) / mod.imax, 0.6); }
        else if (P.t === 'LAMP') st.glow = P.dead ? 0 : r.lamp ? Math.pow(r.lamp.th, 4) : 0;
        else if (P.t === 'SCR') st.on = r.scr && r.scr.on;
        else if (P.t === 'TRIAC') st.on = r.triac && r.triac.on;
        else if (P.t === 'RELAY') st.on = r.relay && r.relay.on;
        else if (P.t === 'FUSE') st.blown = !!P.dead;
        else if (P.t === 'MOT') { r.ang = (r.ang || 0) + (r.motor ? r.motor.w : 0) * 0.016 * 0.1; st.ang = r.ang; }
        else if (P.t === 'DMM') this.meterFace(P, st);
        else if (P.t === 'PSU') { const e = r.ref.src; st.v = (c.v ? 0 : 0) + net.v(net.netInfo.pinNet[P.id][0]) - net.v(net.netInfo.pinNet[P.id][1]); st.i = Math.max(0, -e.i + (r.ref.psu && r.ref.psu.cc ? 0 : 0)); const ie = net.cir.find(P.id + ':i'); if (r.ref.psu && r.ref.psu.cc && ie) st.i = Math.abs(ie.iout || 0); st.cc = r.ref.psu && r.ref.psu.cc; }
        else if (P.t === 'SCOPE') {
          st.trace = this.channels.filter((ch) => ch.id.startsWith(P.id + ':')).map((ch) => { const a = this.rings[ch.id].last(this.N); const out = new Float32Array(60); let pk = 0; for (let i = 0; i < a.length; i++) pk = Math.max(pk, Math.abs(a[i])); const sc = pk > 0 ? 2.4 / Math.max(pk, 1e-9) : 0; for (let i = 0; i < 60; i++) out[i] = (a[Math.floor(i / 60 * a.length)] || 0) * sc; return { color: ch.color, y: out }; });
        }
      }
      if (P.t === 'AMM' || P.t === 'VM') { /* lectura sobre el símbolo */ }
      if (P.dead) {
        c.save(); SYM.draw(c, P, st, s); c.restore();
        c.save(); c.strokeStyle = EM.col('--c2'); c.lineWidth = 2.5 / s; const b = SYM.bbox(P); const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2; c.beginPath(); c.moveTo(cx - 0.7, cy - 0.7); c.lineTo(cx + 0.7, cy + 0.7); c.moveTo(cx + 0.7, cy - 0.7); c.lineTo(cx - 0.7, cy + 0.7); c.stroke(); c.restore();
      } else {
        if (P.fault) { c.save(); c.globalAlpha = 0.9; c.strokeStyle = EM.col('--c4'); }
        c.strokeStyle = this.sel.parts.has(P.id) ? EM.col('--accent') : EM.col('--ink'); c.fillStyle = c.strokeStyle;
        if (P.t === 'VDC' || P.t === 'BAT' || P.t === 'VAC') { /* color normal */ }
        SYM.draw(c, P, st, s);
        if (P.fault) c.restore();
        /* brillo de calor */
        if (r.T && r.T > 70 && this.net.cfg.damage) {
          const hot = Math.min(1, (r.T - 70) / 120); const b = SYM.bbox(P); const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
          const g = c.createRadialGradient(cx, cy, 0.2, cx, cy, 2.4); g.addColorStop(0, `rgba(255,120,30,${0.55 * hot})`); g.addColorStop(1, 'rgba(255,120,30,0)'); c.fillStyle = g; c.beginPath(); c.arc(cx, cy, 2.4, 0, Math.PI * 2); c.fill();
        }
      }
      if (this.sel.parts.has(P.id)) { const b = SYM.bbox(P); c.save(); c.strokeStyle = EM.col('--accent'); c.setLineDash([0.3, 0.25]); c.lineWidth = 1.5 / s; c.strokeRect(b[0] - 0.2, b[1] - 0.2, b[2] - b[0] + 0.4, b[3] - b[1] + 0.4); c.restore(); }
    }
    meterFace(P, st) {
      const net = this.net, m = this.meters.find((q) => q.id === P.id);
      const mode = P.p.mode;
      st.unit = ({ 'V=': 'V  DC', 'V~': 'V  AC', 'A=': 'A  DC', 'A~': 'A  AC', 'Ω': 'Ω', '→|': 'diodo', '·)))': 'continuidad' })[mode];
      if (/^[VA]/.test(mode)) {
        if (!m || m.ring.count() < 5) { st.text = '----'; return; }
        const a = m.ring.last(Math.min(m.ring.count(), this.N));
        let mean = 0; for (const v of a) mean += v; mean /= a.length;
        let val = mean;
        if (/~/.test(mode)) { let s2 = 0; for (const v of a) s2 += (v - mean) * (v - mean); val = Math.sqrt(s2 / a.length); }
        const unit = mode[0] === 'V' ? 'V' : 'A';
        const txt = EM.si(val, unit, 4).split(' ');
        st.text = txt[0]; st.unit = (txt[1] || unit) + (/~/.test(mode) ? ' AC' : ' DC');
        const r = net.rt[P.id]; if (mode[0] === 'A' && r && r.fuseBlown) { st.text = 'FUSE'; }
      } else {
        const r = net.rt[P.id]; r.ohm = r.ohm || { t: 0, ver: -1 };
        const now = performance.now();
        if (r.ohm.ver !== net.version || now - r.ohm.t > 1500) {
          r.ohm.ver = net.version; r.ohm.t = now;
          try { r.ohm.res = net.measureOhms(P, mode !== 'Ω'); } catch (e) { r.ohm.res = null; }
        }
        const o = r.ohm.res;
        if (!o) { st.text = '----'; return; }
        if (mode === 'Ω') { if (o.ol) st.text = 'OL'; else { const t = EM.si(o.r, 'Ω', 4).split(' '); st.text = t[0]; st.unit = t[1] || 'Ω'; } }
        else if (mode === '→|') { st.text = o.ol ? 'OL' : o.v.toFixed(3); st.unit = 'V  diodo'; }
        else { st.text = !o.ol && o.r < 50 ? 'ˍˍˍˍ' + '◖))' : 'OPEN'; st.unit = o.ol ? '' : EM.si(o.r, 'Ω', 3); }
      }
    }
    drawLabel(c, P, s) {
      const cat = CAT[P.t]; if (cat.ground) return;
      const b = SYM.bbox(P);
      const px = Math.max(8, Math.min(12, s * 0.46));
      c.save(); c.font = `600 ${px / s}px ${EM.FONT_UI}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.fillStyle = EM.col('--ink-2');
      const cx = (b[0] + b[2]) / 2;
      if (P.t === 'LBL') {
        c.fillStyle = EM.col('--accent'); c.textBaseline = 'middle'; c.font = `700 ${Math.max(10, s * 0.5) / s}px ${EM.FONT_MONO}`;
        const r = ((P.rot || 0) % 4 + 4) % 4;
        if (r === 0) { c.textAlign = 'left'; c.fillText(String(P.p.name), P.x + 1.1, P.y + 0.02); }
        else if (r === 2) { c.textAlign = 'right'; c.fillText(String(P.p.name), P.x - 1.1, P.y + 0.02); }
        else { c.textAlign = 'center'; c.fillText(String(P.p.name), P.x, P.y + (r === 1 ? 1.9 : -1.9)); }
        c.restore(); return;
      }
      if (P.t === 'PROBE') {
        const nn = this.net.netInfo.pinNet[P.id][0];
        c.textAlign = 'left'; c.fillStyle = EM.col('--c3'); c.font = `700 ${Math.max(10, s * 0.5) / s}px ${EM.FONT_MONO}`;
        c.fillText(`${P.p.name}: ${EM.si(this.net.v(nn), 'V', 3)}`, P.x + 0.7, P.y - 0.9); c.restore(); return;
      }
      if (P.t === 'AMM' || P.t === 'VM') {
        const m = this.meters.find((q) => q.id === P.id);
        if (m && m.ring.count() > 4) { const a = m.ring.last(Math.min(m.ring.count(), this.N)); let mean = 0; for (const v of a) mean += v; mean /= a.length; c.fillStyle = EM.col('--c3'); c.font = `700 ${Math.max(10, s * 0.5) / s}px ${EM.FONT_MONO}`; c.fillText(EM.si(mean, P.t === 'AMM' ? 'A' : 'V', 3), cx, b[1] - 0.15); }
      } else if (cat.instrument) {
        c.restore(); return;
      } else {
        const vertical = (b[3] - b[1]) > (b[2] - b[0]) * 1.15;
        const vt = this.valueText(P);
        if (vertical) {
          c.textAlign = 'left'; c.textBaseline = 'middle';
          const cy = (b[1] + b[3]) / 2;
          c.fillText(P.id, b[2] + 0.25, cy - (vt ? 0.45 : 0));
          if (vt) { c.fillStyle = EM.col('--ink-3'); c.font = `500 ${px / s}px ${EM.FONT_MONO}`; c.fillText(vt, b[2] + 0.25, cy + 0.45); }
        } else {
          c.fillText(P.id, cx, b[1] - 0.12);
          if (vt) { c.fillStyle = EM.col('--ink-3'); c.font = `500 ${px / s}px ${EM.FONT_MONO}`; c.textBaseline = 'top'; c.fillText(vt, cx, b[3] + 0.1); }
        }
      }
      c.restore();
    }
    valueText(P) {
      const p = P.p;
      switch (P.t) {
        case 'R': return S.fmtR(p.r); case 'POT': return S.fmtR(p.r);
        case 'C': return EM.si(p.c, 'F', 3); case 'L': return EM.si(p.l, 'H', 3);
        case 'VDC': return EM.si(p.v, 'V', 3); case 'BAT': return EM.si(p.v, 'V', 3);
        case 'VAC': return EM.si(p.amp, 'V', 3) + ' · ' + EM.si(p.f, 'Hz', 3);
        case 'IDC': return EM.si(p.i, 'A', 3);
        case 'D': case 'NPN': case 'PNP': case 'NMOS': case 'PMOS': case 'JFN': case 'JFP': case 'OA': case 'REG': return p.model;
        case 'LED': return p.color; case 'ZD': return p.vz + ' V';
        case 'TR': case 'TRCT': return p.n + ':1'; case 'FUSE': return EM.si(p.ir, 'A', 2);
        case 'NTC': return p.T + ' °C'; case 'LDR': return EM.si(p.lux, 'lx', 3);
        case 'LAMP': return p.model; case 'VAR': return p.vn + ' V';
        case 'RELAY': return p.vnom + ' V'; case 'DARL': return 'TIP120';
        case 'SOLAR': return p.irr + ' W/m²'; case 'PD': return EM.si(p.lux, 'lx', 3);
        case 'SCR': case 'TRIAC': return '';
        default: return '';
      }
    }

    /* Corrientes en los cables: reparto por KCL en cada red (árbol de cables) */
    pinCurrents(P) {
      const net = this.net, r = net.rt[P.id]; if (!r || !r.ref) return null;
      const cat = CAT[P.t], n = cat.pins.length, out = new Array(n).fill(0);
      const cir = net.cir; const E = (id) => cir.find(P.id + ':' + id);
      const m = r.ref.main;
      if (P.dead || !m) return out;
      switch (P.t) {
        case 'NPN': case 'PNP': out[0] = m.ic; out[1] = m.ib; out[2] = m.ie; break;
        case 'DARL': { const q2 = E('q2'), q1 = E('q1'); if (q1 && q2) { out[0] = q1.ic + q2.ic; out[1] = q1.ib; out[2] = q1.ie + q2.ie - 0; out[2] = -(out[0] + out[1]); } break; }
        case 'NMOS': case 'PMOS': case 'JFN': case 'JFP': out[0] = m.i; out[2] = -m.i; break;
        case 'OA': out[2] = -(m.iout || 0); break;
        case 'REG': out[0] = m.i + (m.iqq || 0); out[1] = -m.i; out[2] = -(m.iqq || 0); break;
        case 'TR': out[0] = m.iw[0]; out[1] = -m.iw[0]; out[2] = m.iw[1]; out[3] = -m.iw[1]; break;
        case 'TRCT': out[0] = m.iw[0]; out[1] = -m.iw[0]; out[2] = m.iw[1]; out[3] = -m.iw[1] + m.iw[2]; out[4] = -m.iw[2]; break;
        case 'POT': { const a = E('a'), b = E('b'); if (a && b) { out[0] = a.i; out[1] = -b.i; out[2] = -a.i + b.i; } break; }
        case 'BR': { const d = [1, 2, 3, 4].map((k) => (E('d' + k) || { i: 0 }).i); out[0] = d[0] - d[2]; out[1] = d[1] - d[3]; out[2] = -d[0] - d[1]; out[3] = d[2] + d[3]; break; }
        case 'IDC': out[1] = m.iout || 0; out[0] = -(m.iout || 0); break;
        case 'SOLAR': { const rs = E('rs'); if (rs) { out[0] = -rs.i; out[1] = rs.i; } break; }
        case 'OPTO': { const d = E('d'), x = E('x'); if (d && x) { out[0] = d.i; out[1] = -d.i; out[2] = x.i; out[3] = -x.i; } break; }
        case 'SCR': { const d = E('dv'); if (d) { out[0] = d.i; out[1] = -d.i; } break; }
        case 'TRIAC': { const a = E('da'), b = E('db'); if (a && b) { out[0] = a.i + b.i; out[1] = -(a.i + b.i); } break; }
        case 'T555': { const o = E('out'); if (o) out[4] = o.i; break; }
        case 'SPDT': { const a = E('a'), b = E('b'); if (a && b) { out[0] = a.i + b.i; out[1] = -a.i; out[2] = -b.i; } break; }
        case 'RELAY': out[0] = m.i; out[1] = -m.i; break;
        case 'V': break;
        default:
          if (n === 2 || n === 1) { const i = m.type === 'I' ? (m.iout || 0) : (m.i || 0); out[0] = i; if (n > 1) out[1] = -i; }
      }
      return out.map((v) => (isFinite(v) ? v : 0));
    }
    drawCurrents(c, s) {
      const net = this.net, doc = net.doc;
      if (!this._wc || this._wcVer !== net.version) { this._wc = this.buildWireGraph(); this._wcVer = net.version; }
      const G = this._wc; if (!G) return;
      /* corriente que entra en cada pin (sale de la red hacia el componente) */
      const inj = new Map();
      for (const P of doc.parts) {
        const pc = this.pinCurrents(P); if (!pc) continue;
        pc.forEach((cur, i) => { const q = PT.pinPos(P, i); const k = key(q[0], q[1]); inj.set(k, (inj.get(k) || 0) + cur); });
      }
      for (const comp of G.comps) {
        for (const e of comp.edges) e.flowAB = 0;
        const sub = new Map();
        for (let i = comp.order.length - 1; i >= 0; i--) {
          const u = comp.order[i];
          const t = (sub.get(u) || 0) + (inj.get(u) || 0);
          const pe = comp.parent.get(u);
          if (pe) { sub.set(pe.node, (sub.get(pe.node) || 0) + t); pe.edge.flowAB = pe.edge.ka === pe.node ? t : -t; }
        }
      }
      for (const comp of G.comps) for (const e of comp.edges) {
        const I = e.flowAB || 0; if (Math.abs(I) < 1e-7) continue;
        const [ax, ay] = e.a, [bx, by] = e.b;
        const L = Math.hypot(bx - ax, by - ay); if (!L) continue;
        const sgn = I > 0 ? 1 : -1;
        const ph = (((this.phase * 1.8 * sgn) % 1) + 1) % 1;
        const nDots = Math.max(1, Math.round(L / 0.8));
        const mag = Math.log10(Math.abs(I) * 1e3 + 1);
        c.fillStyle = `rgba(255,170,30,${Math.min(0.95, 0.4 + 0.2 * mag)})`;
        const rad = Math.min(0.2, 0.1 + 0.025 * mag);
        for (let k = 0; k < nDots; k++) {
          const t = (((k + ph) / nDots) % 1 + 1) % 1;
          c.beginPath(); c.arc(ax + (bx - ax) * t, ay + (by - ay) * t, rad, 0, Math.PI * 2); c.fill();
        }
      }
    }
    buildWireGraph() {
      const net = this.net, doc = net.doc;
      const special = [];
      for (const P of doc.parts) for (let i = 0; i < CAT[P.t].pins.length; i++) special.push(PT.pinPos(P, i));
      for (const w of doc.wires) for (const q of w.pts) special.push(q);
      const edges = [];
      for (const w of doc.wires) {
        for (let k = 1; k < w.pts.length; k++) {
          const a = w.pts[k - 1], b = w.pts[k];
          if (a[0] !== b[0] && a[1] !== b[1]) { edges.push({ a, b }); continue; }
          const vert = a[0] === b[0];
          const pts = [a, b];
          for (const [x, y] of special) {
            if ((vert && x === a[0] && y > Math.min(a[1], b[1]) && y < Math.max(a[1], b[1])) || (!vert && y === a[1] && x > Math.min(a[0], b[0]) && x < Math.max(a[0], b[0]))) if (!pts.some((q) => q[0] === x && q[1] === y)) pts.push([x, y]);
          }
          const dir = vert ? Math.sign(b[1] - a[1]) : Math.sign(b[0] - a[0]);
          pts.sort((p, q) => (vert ? (p[1] - q[1]) * dir : (p[0] - q[0]) * dir));
          for (let i = 1; i < pts.length; i++) edges.push({ a: pts[i - 1], b: pts[i] });
        }
      }
      const adj = new Map();
      for (const e of edges) {
        e.ka = key(e.a[0], e.a[1]); e.kb = key(e.b[0], e.b[1]);
        if (!adj.has(e.ka)) adj.set(e.ka, []); if (!adj.has(e.kb)) adj.set(e.kb, []);
        adj.get(e.ka).push({ to: e.kb, e }); adj.get(e.kb).push({ to: e.ka, e });
      }
      const seen = new Set(), comps = [];
      for (const start of adj.keys()) {
        if (seen.has(start)) continue;
        const comp = { root: start, edges: [], order: [start], parent: new Map() };
        const eset = new Set();
        const q = [start]; seen.add(start);
        while (q.length) {
          const u = q.shift();
          for (const { to, e } of adj.get(u)) {
            eset.add(e);
            if (!seen.has(to)) { seen.add(to); q.push(to); comp.order.push(to); comp.parent.set(to, { node: u, edge: e }); }
          }
        }
        comp.edges = [...eset];
        comps.push(comp);
      }
      return { comps };
    }
  }

  EM.tallers = [];
  EM.Taller = { mount: (sim, cfg) => { const T = new Taller(sim, cfg); EM.tallers.push(T); sim.taller = T; return T; }, Class: Taller };
})();
