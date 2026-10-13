/* ===================================================================
   10-ui.js — Panel de simulación: lienzos, controles, lecturas,
   reloj de simulación, situaciones predefinidas y pantalla completa
   =================================================================== */
(function () {
  'use strict';
  const MC = window.MC;
  const el = MC.el;

  const ICON = {
    play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor"/></svg>',
    reset: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8a5 5 0 1 0 1.6-3.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M2.5 1.8v3.6h3.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    step: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2.5v11l7-5.5zM11 2.5h2.5v11H11z" fill="currentColor"/></svg>',
    full: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    exit: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2v4H2M14 6h-4V2M10 14v-4h4M2 10h4v4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    fire: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 12 L12 4 M12 4 L8 4.4 M12 4 L11.6 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="3" cy="12" r="1.8" fill="currentColor"/></svg>',
    copy: '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5" y="5" width="8.5" height="9" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M3 11V3.5A1.5 1.5 0 0 1 4.5 2H10" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
    sound: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 6h2.5l3.5-3v10L5 10H2.5z" fill="currentColor"/><path d="M11 5.5a3.5 3.5 0 0 1 0 5M12.8 3.6a6 6 0 0 1 0 8.8" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>'
  };
  MC.ICON = ICON;

  const allSims = new Set();
  MC.allSims = allSims;

  class Sim {
    constructor(host, name, opts = {}) {
      this.host = host;
      this.name = name;
      this.p = {};
      this.ctl = {};
      this.canvases = [];
      this.visible = false;
      this.active = true;
      this.playing = false;
      this.ended = false;
      this._raf = null;
      this._pending = false;
      this.drawFn = null;
      this.stepFn = null;
      this.t = 0;
      this.speed = 1;
      this._presets = [];
      const title = host.dataset.title || opts.title || '';
      host.innerHTML = '';
      host.classList.add('sim-ready');
      const head = el('div', 'sim-head');
      this.numEl = el('span', 'sim-num', host.dataset.num || 'Simulación');
      this.titleEl = el('h3', 'sim-title', title);
      this.actions = el('div', 'sim-actions');
      this.tools = el('div', 'sim-tools');
      head.append(this.numEl, this.titleEl, this.actions, this.tools);
      this.head = head;
      this.body = el('div', 'sim-body');
      this.stage = el('div', 'sim-stage');
      this.side = el('div', 'sim-side');
      this.presetBox = el('div', 'sim-presets');
      this.presetBox.hidden = true;
      this.ctrlBox = el('div', 'sim-ctrls');
      this.outBox = el('dl', 'sim-out');
      this.side.append(this.presetBox, this.ctrlBox, this.outBox);
      this.stageCol = el('div', 'sim-stagecol');
      this.stageCol.append(this.stage);
      this.body.append(this.stageCol, this.side);
      host.append(head, this.body);
      if (opts.below || host.dataset.layout === 'below') this.body.classList.add('below');
      this._group = null;
      this._outs = {};
      this._ro = new ResizeObserver(() => this._resize());
      this._io = new IntersectionObserver((es) => {
        for (const e of es) this.visible = e.isIntersecting;
        if (this.visible) this._resize();
        this._kick();
      }, { rootMargin: '120px' });
      this._io.observe(host);
      MC.onTheme.push(() => { this.canvases.forEach((c) => c.onTheme && c.onTheme()); this.redraw(); });
      document.addEventListener('visibilitychange', () => this._kick());
      this._fullBtn();
      allSims.add(this);
    }

    /* ---------- Lienzos ---------- */
    canvas(opts = {}) {
      const wrap = el('div', 'sim-canvas' + (opts.cls ? ' ' + opts.cls : ''));
      const c = document.createElement('canvas');
      wrap.append(c);
      (opts.parent || this.stage).append(wrap);
      const o = { el: c, wrap, ctx: c.getContext('2d'), w: 0, h: 0, dpr: 1, aspect: opts.aspect || 1.6 };
      wrap.style.aspectRatio = String(o.aspect);
      if (opts.maxH) wrap.style.maxHeight = opts.maxH;
      if (opts.minH) wrap.style.minHeight = opts.minH;
      if (opts.label) c.setAttribute('aria-label', opts.label);
      c.setAttribute('role', 'img');
      this.canvases.push(o);
      this._ro.observe(wrap);
      return o;
    }
    cols2(ratio) {
      this.stage.classList.add('cols2', 'fillh');
      if (ratio) { const [a, b] = ratio.split(/\s+/); this.stage.style.setProperty('--cols', `minmax(0, ${a}) minmax(0, ${b})`); }
      return this;
    }
    below() { this.body.classList.add('below'); return this; }
    _resize() {
      let changed = false;
      for (const o of this.canvases) {
        const w = Math.round(o.wrap.clientWidth), h = Math.round(o.wrap.clientHeight);
        if (!w || !h) continue;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        if (w !== o.w || h !== o.h || dpr !== o.dpr) {
          o.w = w; o.h = h; o.dpr = dpr;
          o.el.width = Math.round(w * dpr);
          o.el.height = Math.round(h * dpr);
          o.el.style.width = w + 'px';
          o.el.style.height = h + 'px';
          o.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          changed = true;
          if (o.onResize) o.onResize();
        }
      }
      if (changed) this._draw();
    }
    hint(text, cv) {
      const h = el('div', 'sim-hint', text);
      ((cv && cv.wrap) || this.stage).append(h);
      return h;
    }
    legend(items) {
      if (!this._legend) {
        this._legend = el('div', 'sim-legend');
        this.stageCol.append(this._legend);
      }
      this._legend.innerHTML = '';
      for (const it of items) {
        const s = el('span');
        const i = el('b', 'sw' + (it.kind ? ' ' + it.kind : ''));
        i.style.color = it.color.startsWith('--') ? `var(${it.color})` : it.color;
        const t = el('span', null, it.label);
        s.append(i, t);
        this._legend.append(s);
      }
    }

    /* ---------- Dibujo y animación ---------- */
    onDraw(fn) { this.drawFn = fn; this.redraw(); return this; }
    redraw() {
      if (this._pending) return;
      this._pending = true;
      requestAnimationFrame(() => { this._pending = false; this._draw(); });
    }
    _draw() {
      if (!this.drawFn || this._dead) return;
      for (const o of this.canvases) if (!o.w || !o.h) return;
      try { this.drawFn(); } catch (e) { this.fail(e); }
    }
    /* Animación libre (sin reloj): stepFn(dtReal) */
    animate(stepFn, opts = {}) {
      this.stepFn = stepFn;
      if (opts.button !== false) {
        this.playBtn = el('button', 'btn primary');
        this.playBtn.type = 'button';
        this.playBtn.addEventListener('click', () => this.toggle());
        this.actions.prepend(this.playBtn);
      }
      const auto = opts.autoplay !== false && !MC.reducedMotion();
      this.playing = auto;
      this._syncPlay();
      this._kick();
      return this;
    }
    /* Reloj de simulación con paso fijo.
       o = {reset(), step(h), h, autoplay, speeds:true|false, speed, stepDt,
            timeScale (s simulados por s real), timeFmt(t) → texto del reloj} */
    run(o) {
      this._run = o;
      this.h = o.h || 1 / 600;
      this.speed = o.speed || 1;
      this.ts = o.timeScale || 1;
      this._acc = 0;
      this.stepFn = (dt) => this._advance(dt * this.speed * this.ts);
      this.playBtn = el('button', 'btn primary');
      this.playBtn.type = 'button';
      this.playBtn.addEventListener('click', () => this.toggle());
      const stepBtn = el('button', 'btn icon', ICON.step);
      stepBtn.type = 'button';
      stepBtn.title = 'Avanzar un paso (1/30 s de tiempo simulado)';
      stepBtn.setAttribute('aria-label', 'Avanzar un paso');
      stepBtn.addEventListener('click', () => {
        if (this.ended) return;
        this.playing = false;
        this._syncPlay();
        try { this._advance((o.stepDt || 1 / 30) * this.ts); } catch (e) { this.fail(e); }
        this.redraw();
      });
      const resetBtn = el('button', 'btn', ICON.reset + '<span>Reiniciar</span>');
      resetBtn.type = 'button';
      resetBtn.addEventListener('click', () => { this.pause(); this.reset(); });
      this.actions.append(this.playBtn, stepBtn, resetBtn);
      if (o.speeds !== false) {
        const sp = document.createElement('select');
        sp.className = 'speed';
        sp.id = this._id('speed');
        sp.title = 'Velocidad de reproducción';
        sp.setAttribute('aria-label', 'Velocidad de reproducción');
        for (const v of [0.1, 0.25, 0.5, 1, 2, 4]) {
          const op = document.createElement('option');
          op.value = v;
          op.textContent = '×' + String(v).replace('.', ',');
          sp.append(op);
        }
        sp.value = String(this.speed);
        sp.addEventListener('change', () => { this.speed = +sp.value; });
        this.actions.append(sp);
        this._speedSel = sp;
      }
      this.timeEl = el('span', 'sim-time', 't = 0.00 s');
      this.actions.append(this.timeEl);
      this.reset(true);
      if (o.autoplay && !MC.reducedMotion()) this.play();
      else this._syncPlay();
      return this;
    }
    setSpeed(v) { this.speed = v; if (this._speedSel) this._speedSel.value = String(v); }
    _advance(simDt) {
      this._acc += simDt;
      let n = 0;
      const maxN = 40000;
      while (this._acc >= this.h * (1 - 1e-9) && n < maxN && !this.ended) {
        this._run.step(this.h);
        this.t += this.h;
        this._acc -= this.h;
        n++;
      }
      if (n >= maxN) this._acc = 0;
      this._syncTime();
    }
    _syncTime() {
      if (!this.timeEl) return;
      const t = this.t;
      this.timeEl.textContent = this._run && this._run.timeFmt ? this._run.timeFmt(t) : 't = ' + (t < 100 ? MC.fix(t, 2) : MC.fix(t, 1)) + ' s';
    }
    reset(silent) {
      this.ended = false;
      this.t = 0;
      this._acc = 0;
      if (this._run && this._run.reset) { try { this._run.reset(); } catch (e) { this.fail(e); } }
      this._syncTime();
      this._syncPlay();
      if (!silent) this.redraw();
    }
    end() {
      this.ended = true;
      this.playing = false;
      this._syncPlay();
      this.redraw();
    }
    play() {
      if (this.ended) this.reset(true);
      this.playing = true;
      this._syncPlay();
      this._kick();
    }
    pause() { this.playing = false; this._syncPlay(); }
    toggle(force) {
      const want = force === undefined ? !this.playing : !!force;
      if (want) this.play(); else this.pause();
    }
    _syncPlay() {
      if (!this.playBtn) return;
      if (this.playing) this.playBtn.innerHTML = ICON.pause + '<span>Pausar</span>';
      else if (this.ended) this.playBtn.innerHTML = ICON.reset + '<span>Repetir</span>';
      else this.playBtn.innerHTML = ICON.play + '<span>' + (this._run && this.t === 0 ? (this._run.startLabel || 'Iniciar') : 'Continuar') + '</span>';
      this.playBtn.setAttribute('aria-pressed', this.playing ? 'true' : 'false');
    }
    setActive(a) { this.active = a; if (!a && this.playing && this._run) this.pause(); this._kick(); if (a) this._resize(); }
    _kick() {
      if (this.playing && this.visible && this.active && !document.hidden && !this._raf && this.stepFn && !this._dead) {
        this._last = performance.now();
        this._raf = requestAnimationFrame((t) => this._tick(t));
      }
    }
    _tick(t) {
      this._raf = null;
      if (!(this.playing && this.visible && this.active) || document.hidden || this._dead) return;
      let dt = (t - this._last) / 1000;
      this._last = t;
      if (!(dt > 0)) dt = 0;
      dt = Math.min(dt, 0.05);
      try {
        this.stepFn(dt);
        this._draw();
      } catch (e) { this.fail(e); return; }
      if (this.playing) this._raf = requestAnimationFrame((tt) => this._tick(tt));
    }
    fail(e) {
      console.error('[' + this.name + ']', e);
      this._dead = true;
      if (!this._errEl) {
        this._errEl = el('div', 'sim-error', 'La simulación encontró un error: ' + (e && e.message ? e.message : e));
        this.stage.prepend(this._errEl);
      }
    }

    /* ---------- Pantalla completa (modo clase) ---------- */
    _fullBtn() {
      const b = el('button', 'btn icon ghost', ICON.full);
      b.type = 'button';
      b.title = 'Pantalla completa (modo clase)';
      b.setAttribute('aria-label', 'Pantalla completa');
      b.addEventListener('click', () => this.fullscreen());
      this.tools.append(b);
      this._fsBtn = b;
      const sync = () => {
        const on = document.fullscreenElement === this.host || this.host.classList.contains('maxi');
        b.innerHTML = on ? ICON.exit : ICON.full;
        b.title = on ? 'Salir de pantalla completa' : 'Pantalla completa (modo clase)';
        setTimeout(() => this._resize(), 60);
      };
      document.addEventListener('fullscreenchange', sync);
      this._fsSync = sync;
    }
    fullscreen() {
      const h = this.host;
      if (document.fullscreenElement === h) { document.exitFullscreen().catch(() => {}); return; }
      if (h.classList.contains('maxi')) { h.classList.remove('maxi'); document.body.classList.remove('has-maxi'); this._fsSync(); return; }
      const fallback = () => { h.classList.add('maxi'); document.body.classList.add('has-maxi'); this._fsSync(); };
      try {
        if (h.requestFullscreen) h.requestFullscreen().catch(fallback);
        else fallback();
      } catch (e) { fallback(); }
    }

    /* ---------- Controles ---------- */
    group(title) {
      const g = el('fieldset', 'ctrl-group');
      if (title) g.append(el('legend', null, title));
      this.ctrlBox.append(g);
      this._group = g;
      return g;
    }
    _parent() { if (!this._group) this.group(); return this._group; }
    _id(id) { return (this.name + '-' + id).replace(/[^A-Za-z0-9_-]/g, '_'); }
    changed(id, o) {
      if (id !== 'preset' && this._presetSel && !(o && o.keepPreset)) {
        this._presetSel.value = '';
        if (this._presetNote) this._presetNote.hidden = true;
      }
      if (this.onChange) {
        try { this.onChange(id); } catch (e) { this.fail(e); }
      }
      if (o && o.reset && this._run) { this.pause(); this.reset(); }
      if (!(this.playing && this.visible && this.active)) this.redraw();
    }
    /* Deslizador. o = {label, min, max, step, value, unit, fmt, log, reset, onInput} */
    slider(id, o) {
      const row = el('div', 'ctrl slider');
      const top = el('div', 'ctrl-top');
      const lab = el('label', null, o.label);
      const out = el('button', 'ctrl-val');
      out.type = 'button';
      out.title = 'Clic para escribir un valor';
      const inp = document.createElement('input');
      inp.type = 'range';
      inp.id = this._id(id);
      lab.htmlFor = inp.id;
      const log = !!o.log;
      const toS = (v) => (log ? (1000 * Math.log(v / o.min)) / Math.log(o.max / o.min) : v);
      const fromS = (s) => (log ? o.min * Math.pow(o.max / o.min, s / 1000) : +s);
      if (log) { inp.min = 0; inp.max = 1000; inp.step = 1; }
      else { inp.min = o.min; inp.max = o.max; inp.step = o.step || (o.max - o.min) / 200; }
      this.p[id] = o.value;
      inp.value = toS(o.value);
      const show = () => {
        const v = this.p[id];
        out.innerHTML = MC.supHTML((o.fmt ? o.fmt(v) : MC.sci(v, 3)) + (o.unit ? ' ' + o.unit : ''));
      };
      show();
      inp.addEventListener('input', () => {
        let v = fromS(inp.value);
        if (log && o.step) v = Math.max(o.min, Math.round(v / o.step) * o.step);
        this.p[id] = v;
        show();
        if (o.onInput) o.onInput(v);
        this.changed(id, o);
      });
      /* Edición directa del valor */
      out.addEventListener('click', () => {
        const ed = document.createElement('input');
        ed.type = 'text';
        ed.inputMode = 'decimal';
        ed.className = 'ctrl-edit';
        ed.value = String(+this.p[id].toPrecision(6));
        ed.setAttribute('aria-label', 'Valor de ' + lab.textContent);
        out.replaceWith(ed);
        ed.focus();
        ed.select();
        let done = false;
        const finish = (apply) => {
          if (done) return;
          done = true;
          if (apply) {
            const v = parseFloat(ed.value.replace(',', '.').replace('−', '-'));
            if (isFinite(v)) {
              const c = MC.M.clamp(v, o.min, o.max);
              this.p[id] = c;
              inp.value = toS(c);
              if (o.onInput) o.onInput(c);
              show();
              ed.replaceWith(out);
              this.changed(id, o);
              return;
            }
          }
          ed.replaceWith(out);
        };
        ed.addEventListener('keydown', (e) => { if (e.key === 'Enter') finish(true); else if (e.key === 'Escape') finish(false); });
        ed.addEventListener('blur', () => finish(true));
      });
      top.append(lab, out);
      row.append(top, inp);
      this._parent().append(row);
      const api = {
        el: row, input: inp,
        get: () => this.p[id],
        set: (v, silent) => { this.p[id] = v; inp.value = toS(v); show(); if (o.onInput) o.onInput(v); if (!silent) this.changed(id, o); },
        range: (min, max, step) => { o.min = min; o.max = max; if (!log) { inp.min = min; inp.max = max; if (step) inp.step = step; } inp.value = toS(this.p[id]); },
        show: (vis) => { row.hidden = !vis; },
        enable: (on) => { inp.disabled = !on; row.classList.toggle('off', !on); },
        label: (html) => { lab.innerHTML = html; },
        refresh: show
      };
      this.ctl[id] = api;
      return api;
    }
    /* Lista desplegable. o = {label, options:[[valor, texto],...], value} */
    select(id, o) {
      const row = el('div', 'ctrl');
      const lab = el('label', null, o.label || '');
      const s = document.createElement('select');
      s.id = this._id(id);
      lab.htmlFor = s.id;
      const fill = (opts) => {
        s.innerHTML = '';
        for (const [v, t] of opts) {
          const op = document.createElement('option');
          op.value = v;
          op.textContent = t;
          s.append(op);
        }
      };
      fill(o.options);
      s.value = o.value;
      this.p[id] = o.value;
      s.addEventListener('change', () => {
        const opt = o.options.find((q) => String(q[0]) === s.value);
        this.p[id] = opt ? opt[0] : s.value;
        if (o.onInput) o.onInput(this.p[id]);
        this.changed(id, o);
      });
      if (o.label) row.append(lab);
      row.append(s);
      this._parent().append(row);
      const api = {
        el: row, input: s,
        get: () => this.p[id],
        set: (v, silent) => { this.p[id] = v; s.value = v; if (o.onInput) o.onInput(v); if (!silent) this.changed(id, o); },
        options: (opts, v) => { o.options = opts; fill(opts); if (v !== undefined) { this.p[id] = v; } s.value = this.p[id]; },
        show: (vis) => { row.hidden = !vis; }
      };
      this.ctl[id] = api;
      return api;
    }
    /* Campo numérico libre. o = {label, value, unit, min, max} */
    number(id, o) {
      const row = el('div', 'ctrl');
      const lab = el('label', null, o.label || '');
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.inputMode = 'decimal';
      inp.className = 'num-in';
      inp.id = this._id(id);
      lab.htmlFor = inp.id;
      this.p[id] = o.value;
      inp.value = String(o.value);
      const apply = () => {
        const v = parseFloat(inp.value.replace(',', '.').replace('−', '-').replace(/\s/g, '').replace(/×10\^?/, 'e'));
        if (!isFinite(v)) { inp.classList.add('bad'); return; }
        inp.classList.remove('bad');
        let c = v;
        if (o.min !== undefined) c = Math.max(o.min, c);
        if (o.max !== undefined) c = Math.min(o.max, c);
        this.p[id] = c;
        if (o.onInput) o.onInput(c);
        this.changed(id, o);
      };
      inp.addEventListener('change', apply);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') apply(); });
      const wrap = el('div', 'num-wrap');
      wrap.append(inp);
      if (o.unit) wrap.append(el('span', 'num-unit', o.unit));
      if (o.label) row.append(lab);
      row.append(wrap);
      this._parent().append(row);
      const api = {
        el: row, input: inp,
        get: () => this.p[id],
        set: (v, silent) => { this.p[id] = v; inp.value = String(v); if (!silent) this.changed(id, o); },
        show: (vis) => { row.hidden = !vis; },
        unit: (u) => { const s = wrap.querySelector('.num-unit'); if (s) s.innerHTML = u; }
      };
      this.ctl[id] = api;
      return api;
    }
    /* Casilla de verificación */
    check(id, o) {
      const row = el('div', 'ctrl check');
      const inp = document.createElement('input');
      inp.type = 'checkbox';
      inp.id = this._id(id);
      inp.checked = !!o.value;
      const lab = el('label', null, o.label);
      lab.htmlFor = inp.id;
      this.p[id] = !!o.value;
      inp.addEventListener('change', () => {
        this.p[id] = inp.checked;
        if (o.onInput) o.onInput(inp.checked);
        this.changed(id, Object.assign({ keepPreset: true }, o));
      });
      row.append(inp, lab);
      this._parent().append(row);
      const api = {
        el: row, input: inp,
        get: () => this.p[id],
        set: (v, silent) => { this.p[id] = !!v; inp.checked = !!v; if (o.onInput) o.onInput(!!v); if (!silent) this.changed(id, Object.assign({ keepPreset: true }, o)); },
        show: (vis) => { row.hidden = !vis; }
      };
      this.ctl[id] = api;
      return api;
    }
    /* Botones segmentados. o = {label, options:[[v, texto]], value} */
    seg(id, o) {
      const row = el('div', 'ctrl');
      if (o.label) row.append(el('span', 'ctrl-lab', o.label));
      const box = el('div', 'seg');
      box.setAttribute('role', 'group');
      if (o.label) box.setAttribute('aria-label', o.label.replace(/<[^>]+>/g, ''));
      this.p[id] = o.value;
      const btns = [];
      for (const [v, t] of o.options) {
        const b = el('button', null, t);
        b.type = 'button';
        b.id = this._id(id + '-' + v);
        b.addEventListener('click', () => {
          this.p[id] = v;
          sync();
          if (o.onInput) o.onInput(v);
          this.changed(id, o);
        });
        btns.push([v, b]);
        box.append(b);
      }
      const sync = () => btns.forEach(([v, b]) => { b.classList.toggle('on', v === this.p[id]); b.setAttribute('aria-pressed', v === this.p[id] ? 'true' : 'false'); });
      sync();
      row.append(box);
      this._parent().append(row);
      const api = {
        el: row,
        get: () => this.p[id],
        set: (v, silent) => { this.p[id] = v; sync(); if (o.onInput) o.onInput(v); if (!silent) this.changed(id, o); },
        show: (vis) => { row.hidden = !vis; }
      };
      this.ctl[id] = api;
      return api;
    }
    /* Botón: where = 'ctrl' | 'head' */
    button(label, fn, o = {}) {
      const b = el('button', 'btn' + (o.primary ? ' primary' : '') + (o.cls ? ' ' + o.cls : ''), (o.icon ? ICON[o.icon] || '' : '') + '<span>' + label + '</span>');
      b.type = 'button';
      if (o.id) b.id = this._id(o.id);
      if (o.title) b.title = o.title;
      b.addEventListener('click', (e) => { try { fn(e); } catch (err) { this.fail(err); } if (!this.playing) this.redraw(); });
      if (o.where === 'head') this.actions.append(b);
      else {
        let row = this._parent().querySelector(':scope > .ctrl-row:last-child');
        if (!row || o.newRow) { row = el('div', 'ctrl-row'); this._parent().append(row); }
        row.append(b);
      }
      return b;
    }
    note(html) {
      const n = el('div', 'ctrl-note', html);
      this._parent().append(n);
      return n;
    }
    /* Situaciones predefinidas: [{id, label, v:{param: valor}, fn(sim), note, play}] */
    presets(list, o = {}) {
      this._presets = list;
      const box = this.presetBox;
      box.hidden = false;
      const lab = el('label', null, o.label || 'Situación');
      const s = document.createElement('select');
      s.id = this._id('preset');
      lab.htmlFor = s.id;
      const op0 = document.createElement('option');
      op0.value = '';
      op0.textContent = o.custom || 'Personalizada (valores propios)';
      s.append(op0);
      for (const p of list) {
        const op = document.createElement('option');
        op.value = p.id;
        op.textContent = p.label;
        s.append(op);
      }
      s.addEventListener('change', () => { if (s.value) this.applyPreset(s.value); });
      this._presetSel = s;
      this._presetNote = el('div', 'preset-note');
      this._presetNote.hidden = true;
      box.append(lab, s, this._presetNote);
      if (o.initial) this.applyPreset(o.initial, true);
      return s;
    }
    applyPreset(id, quiet) {
      const p = this._presets.find((q) => q.id === id);
      if (!p) { console.warn(`[${this.name}] situación inexistente: ${id}`); return false; }
      this.pause();
      for (const [k, v] of Object.entries(p.v || {})) if (this.ctl[k]) this.ctl[k].set(v, true);
      if (p.fn) { try { p.fn(this); } catch (e) { this.fail(e); } }
      if (this._presetSel) this._presetSel.value = id;
      if (this._presetNote) {
        this._presetNote.innerHTML = p.note || '';
        this._presetNote.hidden = !p.note;
      }
      if (this.onChange) { try { this.onChange('preset'); } catch (e) { this.fail(e); } }
      if (this._run) this.reset(true);
      this.redraw();
      if (p.play && !quiet) this.play();
      return true;
    }
    /* Lecturas numéricas */
    out(id, label, o = {}) {
      if (this._outs[id]) return this._outs[id];
      const dt = el('dt', null, label);
      const dd = el('dd', o.hl ? 'hl' : '', '—');
      this.outBox.append(dt, dd);
      const api = { set: (html) => { dd.innerHTML = html; }, dt, dd, show: (vis) => { dt.hidden = !vis; dd.hidden = !vis; }, label: (h) => { dt.innerHTML = h; } };
      this._outs[id] = api;
      return api;
    }
    outSep(title) { this.outBox.append(el('div', title ? 'sub' : 'sep', title || '')); }
    set(id, html) { if (this._outs[id]) this._outs[id].set(MC.supHTML(html)); }
    /* Mensaje de estado sobre el lienzo */
    status(cv) {
      const s = el('div', 'sim-status');
      s.hidden = true;
      ((cv && cv.wrap) || this.stage).append(s);
      return {
        show: (html, kind) => { s.innerHTML = html; s.className = 'sim-status' + (kind ? ' ' + kind : ''); s.hidden = false; },
        hide: () => { s.hidden = true; }
      };
    }
    /* Copia de datos tabulados (para hoja de cálculo) */
    dataCopy(fn, label = 'Copiar datos') {
      const b = el('button', 'btn icon ghost', ICON.copy);
      b.type = 'button';
      b.title = label + ' (separados por tabulador, para hoja de cálculo)';
      b.setAttribute('aria-label', label);
      b.addEventListener('click', () => {
        let txt = '';
        try {
          const d = fn();
          txt = [d.headers.join('\t')].concat(d.rows.map((r) => r.map((v) => (typeof v === 'number' ? String(+v.toPrecision(6)) : v)).join('\t'))).join('\n');
        } catch (e) { this.fail(e); return; }
        const ok = () => { b.classList.add('done'); b.title = 'Datos copiados'; setTimeout(() => { b.classList.remove('done'); b.title = label; }, 1400); };
        try {
          navigator.clipboard.writeText(txt).then(ok, () => fallback());
        } catch (e) { fallback(); }
        const self = this;
        function fallback() {
          const ta = el('textarea', 'copy-fallback');
          ta.value = txt;
          self.stage.append(ta);
          ta.select();
          setTimeout(() => ta.remove(), 12000);
        }
      });
      this.tools.prepend(b);
      return b;
    }
  }
  MC.Sim = Sim;

  /* ---------- Interacción con el puntero sobre un lienzo ---------- */
  MC.pointer = function (cv, h) {
    const c = cv.el;
    c.style.touchAction = h.touch || 'none';
    let active = null;
    const pos = (e) => {
      const r = c.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    c.addEventListener('pointerdown', (e) => {
      const [x, y] = pos(e);
      const r = h.down ? h.down(x, y, e) : null;
      if (r !== null && r !== undefined && r !== false) {
        active = r;
        try { c.setPointerCapture(e.pointerId); } catch (err) { /* */ }
        c.style.cursor = 'grabbing';
        e.preventDefault();
      }
    });
    c.addEventListener('pointermove', (e) => {
      const [x, y] = pos(e);
      if (active !== null) { if (h.move) h.move(active, x, y, e); }
      else if (h.hover) { const r = h.hover(x, y); c.style.cursor = r ? (r === true ? 'grab' : r) : 'default'; }
    });
    const end = () => {
      if (active !== null) {
        if (h.up) h.up(active);
        active = null;
        c.style.cursor = 'default';
      }
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('pointerleave', () => { if (active === null && h.leave) h.leave(); });
  };

  /* ---------- Texto enriquecido en lienzo: _{...}, ^{...}, _x, ^x ---------- */
  function parseRich(str) {
    const out = [];
    let i = 0, buf = '';
    const flush = () => { if (buf) { out.push({ t: buf, m: 0 }); buf = ''; } };
    while (i < str.length) {
      const ch = str[i];
      if ((ch === '_' || ch === '^') && i + 1 < str.length) {
        flush();
        const mode = ch === '_' ? -1 : 1;
        if (str[i + 1] === '{') {
          const j = str.indexOf('}', i + 2);
          out.push({ t: str.slice(i + 2, j < 0 ? str.length : j), m: mode });
          i = j < 0 ? str.length : j + 1;
        } else {
          out.push({ t: str[i + 1], m: mode });
          i += 2;
        }
      } else if (ch === '\\' && str[i + 1] === '_') { buf += '_'; i += 2; }
      else { buf += ch; i++; }
    }
    flush();
    return out;
  }
  const SUPD = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '−', '⁺': '+' };
  const SUBD = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9', '₋': '−' };
  const normRich = (s) => s
    .replace(/[⁻⁺]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => '^{' + m.split('').map((c) => SUPD[c]).join('') + '}')
    .replace(/[₋]?[₀₁₂₃₄₅₆₇₈₉]+/g, (m) => '_{' + m.split('').map((c) => SUBD[c]).join('') + '}');
  MC.supHTML = function (html) {
    return String(html)
      .replace(/[⁻⁺]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => '<sup>' + m.split('').map((c) => SUPD[c]).join('') + '</sup>')
      .replace(/[₋]?[₀₁₂₃₄₅₆₇₈₉]+/g, (m) => '<sub>' + m.split('').map((c) => SUBD[c]).join('') + '</sub>');
  };
  MC.FONT_UI = '"Barlow", "Segoe UI", system-ui, sans-serif';
  MC.FONT_COND = '"Barlow Condensed", "Arial Narrow", "Segoe UI", sans-serif';
  MC.FONT_MONO = '"IBM Plex Mono", Consolas, Menlo, monospace';
  MC.FONT_MATH = '"Literata", Georgia, "Times New Roman", serif';
  /* Dibuja texto con sub/superíndices.
     o: {size, family, mono, math, color, align, baseline, italic, weight, halo, vec, hat} */
  MC.text = function (ctx, str, x, y, o = {}) {
    str = normRich(String(str));
    const size = o.size || 12;
    const fam = o.family || (o.mono ? MC.FONT_MONO : o.math ? MC.FONT_MATH : MC.FONT_UI);
    const wt = o.weight || 400;
    const it = o.italic || o.math ? 'italic ' : '';
    const segs = parseRich(str);
    const fontFor = (m) => `${it}${wt} ${m ? Math.round(size * 0.72) : size}px ${fam}`;
    let total = 0;
    for (const s of segs) { ctx.font = fontFor(s.m); s.w = ctx.measureText(s.t).width; total += s.w; }
    let x0 = x;
    const al = o.align || 'left';
    if (al === 'center') x0 = x - total / 2;
    else if (al === 'right') x0 = x - total;
    let yb = y;
    const bl = o.baseline || 'alphabetic';
    if (bl === 'middle') yb = y + size * 0.35;
    else if (bl === 'top') yb = y + size * 0.8;
    else if (bl === 'bottom') yb = y - size * 0.2;
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const dy = (m) => (m < 0 ? size * 0.28 : m > 0 ? -size * 0.42 : 0);
    const haloCol = o.halo ? (o.halo === true ? MC.col('--canvas') : MC.col(o.halo)) : null;
    if (haloCol) {
      ctx.lineJoin = 'round';
      ctx.strokeStyle = haloCol;
      ctx.lineWidth = 3.5;
      let xx = x0;
      for (const s of segs) { ctx.font = fontFor(s.m); ctx.strokeText(s.t, xx, yb + dy(s.m)); xx += s.w; }
    }
    const fill = o.color ? MC.col(o.color) : MC.col('--ink');
    ctx.fillStyle = fill;
    let xx = x0;
    for (const s of segs) { ctx.font = fontFor(s.m); ctx.fillText(s.t, xx, yb + dy(s.m)); xx += s.w; }
    /* Flecha de vector o circunflejo sobre el primer segmento */
    if (o.vec || o.hat) {
      const w0 = segs.length ? segs[0].w : total;
      const slant = it ? size * 0.08 : 0;
      const top = yb - size * 0.86;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (o.vec) {
        const xa = x0 + slant + w0 * 0.05, xb = x0 + slant + Math.max(w0 * 0.98, size * 0.55);
        const hh = size * 0.14;
        ctx.moveTo(xa, top); ctx.lineTo(xb, top);
        ctx.moveTo(xb - hh * 1.3, top - hh); ctx.lineTo(xb, top); ctx.lineTo(xb - hh * 1.3, top + hh);
      } else {
        const cxh = x0 + w0 / 2 + slant, hw = Math.min(w0 * 0.42, size * 0.26), hh = size * 0.19;
        ctx.moveTo(cxh - hw, top + hh); ctx.lineTo(cxh, top); ctx.lineTo(cxh + hw, top + hh);
      }
      if (haloCol) { ctx.strokeStyle = haloCol; ctx.lineWidth = Math.max(1, size * 0.085) + 3; ctx.stroke(); }
      ctx.strokeStyle = fill;
      ctx.lineWidth = Math.max(1.1, size * 0.085);
      ctx.stroke();
    }
    ctx.restore();
    return total;
  };
  MC.textWidth = function (ctx, str, o = {}) {
    str = normRich(String(str));
    const size = o.size || 12;
    const fam = o.family || (o.mono ? MC.FONT_MONO : o.math ? MC.FONT_MATH : MC.FONT_UI);
    let total = 0;
    ctx.save();
    for (const s of parseRich(str)) {
      ctx.font = `${o.italic || o.math ? 'italic ' : ''}${o.weight || 400} ${s.m ? Math.round(size * 0.72) : size}px ${fam}`;
      total += ctx.measureText(s.t).width;
    }
    ctx.restore();
    return total;
  };
})();
