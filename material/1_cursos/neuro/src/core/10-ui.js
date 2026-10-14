/* ===================================================================
   10-ui.js — Panel de simulación: lienzos, controles, lecturas, animación
   =================================================================== */
(function () {
  'use strict';
  const RC = window.RC;
  const el = RC.el;

  const ICON = {
    play: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor"/></svg>',
    reset: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8a5 5 0 1 0 1.6-3.7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M2.5 1.8v3.6h3.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    step: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 2.5v11l7-5.5zM11 2.5h2.5v11H11z" fill="currentColor"/></svg>'
  };
  RC.ICON = ICON;

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
      this._raf = null;
      this._pending = false;
      this.drawFn = null;
      this.stepFn = null;
      this.t = 0;
      const title = host.dataset.title || opts.title || '';
      host.innerHTML = '';
      host.classList.add('sim-ready');
      const head = el('div', 'sim-head');
      this.numEl = el('span', 'sim-num', host.dataset.num || 'Simulación');
      this.titleEl = el('h3', 'sim-title', title);
      this.actions = el('div', 'sim-actions');
      head.append(this.numEl, this.titleEl, this.actions);
      this.body = el('div', 'sim-body');
      this.stage = el('div', 'sim-stage');
      this.side = el('div', 'sim-side');
      this.ctrlBox = el('div', 'sim-ctrls');
      this.outBox = el('dl', 'sim-out');
      this.side.append(this.ctrlBox, this.outBox);
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
      RC.onTheme.push(() => { this.canvases.forEach((c) => c.onTheme && c.onTheme()); this.redraw(); });
      document.addEventListener('visibilitychange', () => this._kick());
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
    cols2() { this.stage.classList.add('cols2'); return this; }
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
        const i = el('b', 'sw' + (it.kind === 'dash' ? ' dash' : it.kind === 'dot' ? ' dot' : it.kind === 'sq' ? ' sq' : ''));
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
    animate(stepFn, opts = {}) {
      this.stepFn = stepFn;
      this.playBtn = el('button', 'btn primary');
      this.playBtn.type = 'button';
      this.playBtn.addEventListener('click', () => this.toggle());
      this.actions.prepend(this.playBtn);
      const auto = opts.autoplay !== false && !RC.reducedMotion();
      this.playing = auto;
      this._syncPlay();
      this._kick();
      return this;
    }
    toggle(force) {
      this.playing = force === undefined ? !this.playing : !!force;
      this._syncPlay();
      this._kick();
    }
    _syncPlay() {
      if (!this.playBtn) return;
      this.playBtn.innerHTML = this.playing ? ICON.pause + 'Pausar' : ICON.play + 'Reproducir';
      this.playBtn.setAttribute('aria-pressed', this.playing ? 'true' : 'false');
    }
    setActive(a) { this.active = a; this._kick(); if (a) this._resize(); }
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
      this._raf = requestAnimationFrame((tt) => this._tick(tt));
    }
    fail(e) {
      console.error('[' + this.name + ']', e);
      this._dead = true;
      if (!this._errEl) {
        this._errEl = el('div', 'sim-error', 'La simulación encontró un error: ' + (e && e.message ? e.message : e));
        this.stage.prepend(this._errEl);
      }
    }

    /* ---------- Controles ---------- */
    group(title) {
      const g = el('fieldset', 'ctrl-group');
      if (title) g.append(el('legend', null, title));
      this.ctrlBox.append(g);
      this._group = g;
      return g;
    }
    _parent() {
      if (!this._group) this.group();
      return this._group;
    }
    _id(id) { return (this.name + '-' + id).replace(/[^A-Za-z0-9_-]/g, '_'); }
    changed(id) {
      if (this.onChange) {
        try { this.onChange(id); } catch (e) { this.fail(e); }
      }
      if (!(this.playing && this.visible && this.active)) this.redraw();
    }
    /* Deslizador. o = {label, min, max, step, value, unit, fmt, log, onInput} */
    slider(id, o) {
      const row = el('div', 'ctrl slider');
      const top = el('div', 'ctrl-top');
      const lab = el('label', null, o.label);
      const out = el('output', 'ctrl-val');
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
        out.innerHTML = RC.supHTML((o.fmt ? o.fmt(v) : RC.sci(v, 3)) + (o.unit ? ' ' + o.unit : ''));
      };
      show();
      inp.addEventListener('input', () => {
        let v = fromS(inp.value);
        if (log && o.step) v = Math.round(v / o.step) * o.step;
        this.p[id] = v;
        show();
        if (o.onInput) o.onInput(v);
        this.changed(id);
      });
      top.append(lab, out);
      row.append(top, inp);
      this._parent().append(row);
      const api = {
        el: row, input: inp,
        get: () => this.p[id],
        set: (v, silent) => { this.p[id] = v; inp.value = toS(v); show(); if (!silent) this.changed(id); },
        range: (min, max, step) => { o.min = min; o.max = max; if (!log) { inp.min = min; inp.max = max; if (step) inp.step = step; } inp.value = toS(this.p[id]); },
        show: (vis) => { row.hidden = !vis; },
        label: (html) => { lab.innerHTML = html; }
      };
      this.ctl[id] = api;
      return api;
    }
    /* Lista desplegable. o = {label, options:[[valor, texto],...], value} */
    select(id, o) {
      const row = el('div', 'ctrl');
      const lab = el('label', null, o.label);
      const s = document.createElement('select');
      s.id = this._id(id);
      lab.htmlFor = s.id;
      for (const [v, t] of o.options) {
        const op = document.createElement('option');
        op.value = v;
        op.textContent = t;
        s.append(op);
      }
      s.value = o.value;
      this.p[id] = o.value;
      s.addEventListener('change', () => {
        const opt = o.options.find((q) => String(q[0]) === s.value);
        this.p[id] = opt ? opt[0] : s.value;
        if (o.onInput) o.onInput(this.p[id]);
        this.changed(id);
      });
      if (o.label) row.append(lab);
      row.append(s);
      this._parent().append(row);
      const api = {
        el: row, input: s,
        get: () => this.p[id],
        set: (v, silent) => { this.p[id] = v; s.value = v; if (!silent) this.changed(id); },
        show: (vis) => { row.hidden = !vis; }
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
        this.changed(id);
      });
      row.append(inp, lab);
      this._parent().append(row);
      const api = {
        el: row, input: inp,
        get: () => this.p[id],
        set: (v, silent) => { this.p[id] = !!v; inp.checked = !!v; if (!silent) this.changed(id); },
        show: (vis) => { row.hidden = !vis; }
      };
      this.ctl[id] = api;
      return api;
    }
    /* Botones segmentados. o = {label, options:[[v, texto]], value} */
    seg(id, o) {
      const row = el('div', 'ctrl');
      if (o.label) row.append(el('label', null, o.label));
      const box = el('div', 'seg');
      box.setAttribute('role', 'group');
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
          this.changed(id);
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
        set: (v, silent) => { this.p[id] = v; sync(); if (!silent) this.changed(id); },
        show: (vis) => { row.hidden = !vis; }
      };
      this.ctl[id] = api;
      return api;
    }
    /* Botón: where = 'ctrl' | 'head' */
    button(label, fn, o = {}) {
      const b = el('button', 'btn' + (o.primary ? ' primary' : ''), (o.icon ? ICON[o.icon] || '' : '') + label);
      b.type = 'button';
      if (o.id) b.id = this._id(o.id);
      b.addEventListener('click', (e) => { try { fn(e); } catch (err) { this.fail(err); } if (!this.playing) this.redraw(); });
      if (o.where === 'head') this.actions.append(b);
      else {
        let row = this._parent().querySelector(':scope > .ctrl-row:last-child');
        if (!row || o.newRow) { row = el('div', 'ctrl-row'); this._parent().append(row); }
        row.append(b);
      }
      return b;
    }
    resetButton(fn) { return this.button('Reiniciar', fn, { icon: 'reset', where: 'head' }); }
    note(html) {
      const n = el('div', 'ctrl-note', html);
      this._parent().append(n);
      return n;
    }
    /* Lecturas numéricas */
    out(id, label, o = {}) {
      if (this._outs[id]) return this._outs[id];
      const dt = el('dt', o.wide ? 'wide' : null, label);
      const dd = el('dd', (o.hl ? 'hl' : '') + (o.wide ? ' wide' : ''), '—');
      this.outBox.append(dt, dd);
      const api = { set: (html) => { dd.innerHTML = html; }, dt, dd, show: (vis) => { dt.hidden = !vis; dd.hidden = !vis; } };
      this._outs[id] = api;
      return api;
    }
    outSep(title) {
      this.outBox.append(el('div', title ? 'sub' : 'sep', title || ''));
    }
    set(id, html) { if (this._outs[id]) this._outs[id].set(RC.supHTML(html)); }
    below() { this.body.classList.add('below'); return this; }
  }
  RC.Sim = Sim;

  /* ---------- Interacción con el puntero sobre un lienzo ---------- */
  RC.pointer = function (cv, h) {
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

  /* ---------- Texto enriquecido en lienzo: soporta _{...}, ^{...}, _x, ^x ---------- */
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
  /* Convierte dígitos Unicode super/subíndice a la notación ^{...} / _{...} */
  const SUPD = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '−', '⁺': '+' };
  const SUBD = { '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9', '₋': '−' };
  const normRich = (s) => s
    .replace(/[⁻⁺]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => '^{' + m.split('').map((c) => SUPD[c]).join('') + '}')
    .replace(/[₋]?[₀₁₂₃₄₅₆₇₈₉]+/g, (m) => '_{' + m.split('').map((c) => SUBD[c]).join('') + '}');
  RC.supHTML = function (html) {
    return String(html)
      .replace(/[⁻⁺]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => '<sup>' + m.split('').map((c) => SUPD[c]).join('') + '</sup>')
      .replace(/[₋]?[₀₁₂₃₄₅₆₇₈₉]+/g, (m) => '<sub>' + m.split('').map((c) => SUBD[c]).join('') + '</sub>');
  };
  /* Dibuja texto con subíndices/superíndices. opts: {size, font, color, align, baseline, italic, weight} */
  RC.text = function (ctx, str, x, y, o = {}) {
    str = normRich(String(str));
    const size = o.size || 12;
    const fam = o.family || (o.mono ? RC.FONT_MONO : RC.FONT_UI);
    const wt = o.weight || 400;
    const it = o.italic ? 'italic ' : '';
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
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    if (o.halo) {
      ctx.save();
      ctx.lineJoin = 'round';
      ctx.strokeStyle = o.halo === true ? RC.col('--canvas') : o.halo;
      ctx.lineWidth = 3.5;
      let xx = x0;
      for (const s of segs) {
        ctx.font = fontFor(s.m);
        ctx.strokeText(s.t, xx, yb + (s.m < 0 ? size * 0.28 : s.m > 0 ? -size * 0.42 : 0));
        xx += s.w;
      }
      ctx.restore();
    }
    ctx.fillStyle = o.color ? (o.color.startsWith('--') ? RC.col(o.color) : o.color) : RC.col('--ink');
    let xx = x0;
    for (const s of segs) {
      ctx.font = fontFor(s.m);
      ctx.fillText(s.t, xx, yb + (s.m < 0 ? size * 0.28 : s.m > 0 ? -size * 0.42 : 0));
      xx += s.w;
    }
    /* Circunflejo de vector unitario sobre el texto */
    if (o.hat) {
      const w0 = segs.length ? segs[0].w : total;
      const cxh = x0 + w0 / 2 + (o.italic ? size * 0.07 : 0);
      const top = yb - size * (o.hatHigh ? 1.02 : 0.76);
      const hw = Math.min(w0 * 0.42, size * 0.26), hh = size * 0.19;
      ctx.save();
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cxh - hw, top + hh);
      ctx.lineTo(cxh, top);
      ctx.lineTo(cxh + hw, top + hh);
      if (o.halo) {
        ctx.strokeStyle = o.halo === true ? RC.col('--canvas') : o.halo;
        ctx.lineWidth = Math.max(1, size * 0.085) + 3;
        ctx.stroke();
      }
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = Math.max(1, size * 0.085);
      ctx.stroke();
      ctx.restore();
    }
    return total;
  };
  RC.textWidth = function (ctx, str, o = {}) {
    str = normRich(String(str));
    const size = o.size || 12;
    const fam = o.family || (o.mono ? RC.FONT_MONO : RC.FONT_UI);
    let total = 0;
    for (const s of parseRich(String(str))) {
      ctx.font = `${o.italic ? 'italic ' : ''}${o.weight || 400} ${s.m ? Math.round(size * 0.72) : size}px ${fam}`;
      total += ctx.measureText(s.t).width;
    }
    return total;
  };
  RC.FONT_UI = '"Archivo", "Segoe UI", system-ui, sans-serif';
  RC.FONT_MONO = '"JetBrains Mono", Consolas, Menlo, monospace';
  RC.FONT_MATH = '"Source Serif 4", Georgia, "Times New Roman", serif';

  /* ---------- Primitivas de dibujo 2D comunes ---------- */
  const D = (RC.draw = {});
  /* Flecha de (x1,y1) a (x2,y2) en píxeles */
  D.arrow = function (ctx, x1, y1, x2, y2, o = {}) {
    const col = o.color ? (o.color.startsWith('--') ? RC.col(o.color) : o.color) : RC.col('--ink');
    const lw = o.width || 1.6;
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    if (L < 0.5) return;
    const hl = Math.min(o.head || 4 + lw * 3, L * 0.6), hw = hl * (o.headW || 0.55);
    const ux = dx / L, uy = dy / L;
    ctx.save();
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - ux * hl * 0.8, y2 - uy * hl * 0.8);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ux * hl - uy * hw, y2 - uy * hl + ux * hw);
    ctx.lineTo(x2 - ux * hl * 0.78, y2 - uy * hl * 0.78);
    ctx.lineTo(x2 - ux * hl + uy * hw, y2 - uy * hl - ux * hw);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
  /* Limpia el lienzo con el color de fondo */
  D.clear = function (cv, color) {
    const ctx = cv.ctx;
    ctx.save();
    ctx.setTransform(cv.dpr, 0, 0, cv.dpr, 0, 0);
    ctx.fillStyle = color ? RC.col(color) : RC.col('--canvas');
    ctx.fillRect(0, 0, cv.w, cv.h);
    ctx.restore();
  };
  /* Polilínea a partir de arreglos de puntos en píxeles */
  D.poly = function (ctx, pts, o = {}) {
    if (pts.length < 2) return;
    ctx.save();
    ctx.strokeStyle = o.color ? (o.color.startsWith('--') ? RC.col(o.color) : o.color) : RC.col('--ink');
    ctx.lineWidth = o.width || 1.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (o.dash) ctx.setLineDash(o.dash);
    if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (o.close) ctx.closePath();
    if (o.fill) { ctx.fillStyle = o.fill.startsWith('--') ? RC.col(o.fill) : o.fill; ctx.fill(); }
    if (o.color !== 'none') ctx.stroke();
    ctx.restore();
  };
})();
