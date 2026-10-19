/* ===================================================================
   20-plot.js — Gráficas 2D: ejes con unidades, marcas "bonitas",
   curvas, áreas, rectas tangentes, cursor de lectura y gráficas
   temporales (TGraph) que se alimentan de un historial.
   =================================================================== */
(function () {
  'use strict';
  const MC = window.MC;
  const C = (c) => (c && c.startsWith && c.startsWith('--') ? MC.col(c) : c);

  MC.niceStep = function (range, target) {
    if (!(range > 0)) return 1;
    const raw = range / Math.max(1, target);
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / p;
    const nf = f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10;
    return nf * p;
  };
  MC.ticks = function (min, max, target = 6) {
    const step = MC.niceStep(max - min, target);
    const out = [];
    const start = Math.ceil(min / step - 1e-9) * step;
    for (let v = start, i = 0; v <= max + step * 1e-9 && i < 200; v += step, i++) {
      out.push(Math.abs(v) < step * 1e-9 ? 0 : +v.toPrecision(12));
    }
    return { ticks: out, step };
  };
  MC.tickFmt = function (step) {
    const st = Math.abs(+(+step).toPrecision(6));
    let dec = Math.max(0, -Math.floor(Math.log10(st) + 1e-9));
    while (dec < 8 && Math.abs(Math.round(st * Math.pow(10, dec)) - st * Math.pow(10, dec)) > 1e-6 * Math.pow(10, dec)) dec++;
    return (v) => {
      if (Math.abs(v) >= 1e6 || (Math.abs(v) > 0 && Math.abs(v) < 1e-4)) return MC.sci(v, 2);
      return MC.fix(v, Math.min(dec, 6));
    };
  };
  /* Rango "bonito" para datos [lo, hi]. o = {zero, pad, minSpan, ticks, def, sym} */
  MC.niceRange = function (lo, hi, o = {}) {
    if (!isFinite(lo) || !isFinite(hi)) { lo = o.def ? o.def[0] : 0; hi = o.def ? o.def[1] : 1; }
    if (o.zero !== false) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
    if (o.sym) { const a = Math.max(Math.abs(lo), Math.abs(hi)); lo = -a; hi = a; }
    const minSpan = o.minSpan || 1e-6;
    if (hi - lo < minSpan) {
      const c = (lo + hi) / 2;
      if (lo >= 0 && o.zero !== false && c - minSpan / 2 < 0) { lo = 0; hi = minSpan; }
      else if (hi <= 0 && o.zero !== false && c + minSpan / 2 > 0) { hi = 0; lo = -minSpan; }
      else { lo = c - minSpan / 2; hi = c + minSpan / 2; }
    }
    const pad = (o.pad === undefined ? 0.06 : o.pad) * (hi - lo);
    if (!(lo === 0 && o.zero !== false)) lo -= pad;
    if (!(hi === 0 && o.zero !== false)) hi += pad;
    const step = MC.niceStep(hi - lo, o.ticks || 5);
    lo = Math.floor(lo / step + 1e-9) * step;
    hi = Math.ceil(hi / step - 1e-9) * step;
    if (o.sym) { const a = Math.max(Math.abs(lo), Math.abs(hi)); lo = -a; hi = a; }
    return [lo, hi];
  };
  MC.niceCeil = function (x) {
    if (!(x > 0)) return 1;
    const p = Math.pow(10, Math.floor(Math.log10(x)));
    const f = x / p;
    const nf = f <= 1 ? 1 : f <= 1.5 ? 1.5 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 3 ? 3 : f <= 4 ? 4 : f <= 5 ? 5 : f <= 6 ? 6 : f <= 8 ? 8 : 10;
    return nf * p;
  };
  MC.piFmt = function (v) {
    const k = Math.round((v / Math.PI) * 4);
    if (Math.abs(v - (k * Math.PI) / 4) > 1e-6) return MC.fix(v, 2);
    if (k === 0) return '0';
    const g = (a, b) => (b ? g(b, a % b) : Math.abs(a));
    const d = g(k, 4), num = k / d, den = 4 / d;
    const ns = num === 1 ? '' : num === -1 ? '−' : MC.minus(String(num));
    return den === 1 ? ns + 'π' : ns + 'π/' + den;
  };
  /* Etiqueta de eje: string o [símbolo, unidad] → "símbolo (unidad)" con símbolo en cursiva */
  function axisLabel(ctx, lab, x, y, o) {
    if (!Array.isArray(lab)) { MC.text(ctx, lab, x, y, Object.assign({ size: 12.5, color: '--ink-2', weight: 500 }, o)); return; }
    const [sym, unit] = lab;
    const sz = 13;
    const ws = MC.textWidth(ctx, sym, { size: sz, math: true });
    const wu = unit ? MC.textWidth(ctx, ' (' + unit + ')', { size: 12, weight: 500 }) : 0;
    let x0 = x;
    const al = o.align || 'left';
    if (al === 'center') x0 = x - (ws + wu) / 2;
    else if (al === 'right') x0 = x - ws - wu;
    MC.text(ctx, sym, x0, y, { size: sz, math: true, color: o.color || '--ink', baseline: o.baseline, vec: o.vec });
    if (unit) MC.text(ctx, ' (' + unit + ')', x0 + ws, y, { size: 12, color: '--ink-2', weight: 500, baseline: o.baseline });
  }
  MC.axisLabel = axisLabel;

  class Plot {
    constructor(ctx, o = {}) {
      this.ctx = ctx;
      this.o = Object.assign({
        x: 0, y: 0, w: 300, h: 200,
        xmin: 0, xmax: 1, ymin: 0, ymax: 1,
        ml: 52, mr: 14, mt: 12, mb: 38,
        xlabel: '', ylabel: '', title: '',
        grid: true, xfmt: null, yfmt: null, xticks: null, yticks: null,
        xpi: false, frame: true, zero: true, bg: null
      }, o);
      if (o.title && o.mt === undefined) this.o.mt = 24;
    }
    set(o) { Object.assign(this.o, o); return this; }
    get ix() { return this.o.x + this.o.ml; }
    get iy() { return this.o.y + this.o.mt; }
    get iw() { return Math.max(10, this.o.w - this.o.ml - this.o.mr); }
    get ih() { return Math.max(10, this.o.h - this.o.mt - this.o.mb); }
    X(v) {
      const o = this.o;
      if (o.xlog) { const a = Math.log10(o.xmin), b = Math.log10(o.xmax); return this.ix + ((Math.log10(v) - a) / (b - a)) * this.iw; }
      return this.ix + ((v - o.xmin) / (o.xmax - o.xmin)) * this.iw;
    }
    Y(v) {
      const o = this.o;
      if (o.ylog) { const a = Math.log10(o.ymin), b = Math.log10(o.ymax); return this.iy + this.ih - ((Math.log10(v) - a) / (b - a)) * this.ih; }
      return this.iy + this.ih - ((v - o.ymin) / (o.ymax - o.ymin)) * this.ih;
    }
    invX(px) {
      const o = this.o, t = (px - this.ix) / this.iw;
      if (o.xlog) { const a = Math.log10(o.xmin), b = Math.log10(o.xmax); return Math.pow(10, a + t * (b - a)); }
      return o.xmin + t * (o.xmax - o.xmin);
    }
    invY(py) {
      const o = this.o, t = (this.iy + this.ih - py) / this.ih;
      if (o.ylog) { const a = Math.log10(o.ymin), b = Math.log10(o.ymax); return Math.pow(10, a + t * (b - a)); }
      return o.ymin + t * (o.ymax - o.ymin);
    }
    inside(px, py) { return px >= this.ix && px <= this.ix + this.iw && py >= this.iy && py <= this.iy + this.ih; }

    frame() {
      const ctx = this.ctx, o = this.o;
      const ix = this.ix, iy = this.iy, iw = this.iw, ih = this.ih;
      ctx.save();
      if (o.bg) { ctx.fillStyle = C(o.bg); ctx.fillRect(o.x, o.y, o.w, o.h); }
      let xt, yt, xf, yf, xm = [], ym = [];
      const logT = (min, max) => {
        const maj = [], mnr = [];
        for (let k = Math.floor(Math.log10(min)) - 1; k <= Math.ceil(Math.log10(max)); k++) {
          const d = Math.pow(10, k);
          if (d >= min * (1 - 1e-9) && d <= max * (1 + 1e-9)) maj.push(d);
          for (let m = 2; m <= 9; m++) { const v = m * d; if (v > min && v < max) mnr.push(v); }
        }
        return [maj, mnr];
      };
      const logF = (v) => (v >= 1e-2 && v < 1e4 ? MC.sci(v, 1).replace(/\.0$/, '') : '10^{' + MC.minus(Math.round(Math.log10(v))) + '}');
      if (o.xlog) {
        [xt, xm] = logT(o.xmin, o.xmax); xf = o.xfmt || logF;
        if (o.xstride) xt = xt.filter((v) => Math.round(Math.log10(v)) % o.xstride === 0);
      }
      else if (o.xticks && Array.isArray(o.xticks)) { xt = o.xticks; xf = o.xfmt || MC.tickFmt(xt.length > 1 ? Math.abs(xt[1] - xt[0]) : 1); }
      else if (o.xpi) {
        const span = (o.xmax - o.xmin) / Math.PI;
        const st = span > 8 ? Math.PI * 2 : span > 3 ? Math.PI : span > 1.5 ? Math.PI / 2 : Math.PI / 4;
        xt = [];
        for (let v = Math.ceil(o.xmin / st - 1e-9) * st; v <= o.xmax + 1e-9; v += st) xt.push(v);
        xf = o.xfmt || MC.piFmt;
      } else { const r = MC.ticks(o.xmin, o.xmax, Math.max(2, Math.round(iw / 72))); xt = r.ticks; xf = o.xfmt || MC.tickFmt(r.step); }
      if (o.ylog) { [yt, ym] = logT(o.ymin, o.ymax); yf = o.yfmt || logF; if (o.ystride) yt = yt.filter((v) => Math.round(Math.log10(v)) % o.ystride === 0); }
      else if (o.yticks && Array.isArray(o.yticks)) { yt = o.yticks; yf = o.yfmt || MC.tickFmt(yt.length > 1 ? Math.abs(yt[1] - yt[0]) : 1); }
      else { const r = MC.ticks(o.ymin, o.ymax, Math.max(2, Math.round(ih / 38))); yt = r.ticks; yf = o.yfmt || MC.tickFmt(r.step); }
      this._xt = xt; this._yt = yt;
      /* cuadrícula: menor + mayor */
      if (o.grid) {
        ctx.lineWidth = 1;
        if (!o.xlog && !o.ylog && o.minor !== false && xt.length > 1 && yt.length > 1) {
          ctx.strokeStyle = C('--grid');
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          const sx = (xt[1] - xt[0]) / 5, sy = (yt[1] - yt[0]) / 5;
          if (iw / ((o.xmax - o.xmin) / sx) > 5) for (let v = Math.ceil(o.xmin / sx) * sx; v <= o.xmax; v += sx) { const px = Math.round(this.X(v)) + 0.5; ctx.moveTo(px, iy); ctx.lineTo(px, iy + ih); }
          if (ih / ((o.ymax - o.ymin) / sy) > 5) for (let v = Math.ceil(o.ymin / sy) * sy; v <= o.ymax; v += sy) { const py = Math.round(this.Y(v)) + 0.5; ctx.moveTo(ix, py); ctx.lineTo(ix + iw, py); }
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        if (xm.length || ym.length) {
          ctx.strokeStyle = C('--grid');
          ctx.beginPath();
          for (const v of xm) { const px = Math.round(this.X(v)) + 0.5; ctx.moveTo(px, iy); ctx.lineTo(px, iy + ih); }
          for (const v of ym) { const py = Math.round(this.Y(v)) + 0.5; ctx.moveTo(ix, py); ctx.lineTo(ix + iw, py); }
          ctx.stroke();
        }
        ctx.strokeStyle = C('--grid-2');
        ctx.beginPath();
        for (const v of xt) { const px = Math.round(this.X(v)) + 0.5; ctx.moveTo(px, iy); ctx.lineTo(px, iy + ih); }
        for (const v of yt) { const py = Math.round(this.Y(v)) + 0.5; ctx.moveTo(ix, py); ctx.lineTo(ix + iw, py); }
        ctx.stroke();
      }
      /* ejes en cero */
      if (o.zero && !o.xlog && !o.ylog) {
        ctx.strokeStyle = C('--axis');
        ctx.globalAlpha = 0.75;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        if (o.ymin < 0 && o.ymax > 0) { const py = Math.round(this.Y(0)) + 0.5; ctx.moveTo(ix, py); ctx.lineTo(ix + iw, py); }
        if (o.xmin < 0 && o.xmax > 0) { const px = Math.round(this.X(0)) + 0.5; ctx.moveTo(px, iy); ctx.lineTo(px, iy + ih); }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      /* marco y marcas */
      if (o.frame) {
        ctx.strokeStyle = C('--axis');
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ix + 0.5, iy);
        ctx.lineTo(ix + 0.5, iy + ih + 0.5);
        ctx.lineTo(ix + iw, iy + ih + 0.5);
        ctx.stroke();
        ctx.beginPath();
        for (const v of xt) { const px = Math.round(this.X(v)) + 0.5; ctx.moveTo(px, iy + ih); ctx.lineTo(px, iy + ih + 4); }
        for (const v of yt) { const py = Math.round(this.Y(v)) + 0.5; ctx.moveTo(ix - 4, py); ctx.lineTo(ix, py); }
        ctx.stroke();
      }
      /* números */
      const tf = `10.5px ${MC.FONT_MONO}`;
      let lastR = -1e9;
      for (const v of xt) {
        const s = xf(v), px = this.X(v);
        const rich = s.indexOf('^{') >= 0 || /[⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(s);
        ctx.font = tf;
        const tw = rich ? MC.textWidth(ctx, s, { size: 10.5, mono: true }) : ctx.measureText(s).width;
        if (px - tw / 2 < lastR + 5) continue;
        if (rich) MC.text(ctx, s, px, iy + ih + 16, { size: 10.5, mono: true, color: '--ink-3', align: 'center' });
        else { ctx.fillStyle = C('--ink-3'); ctx.font = tf; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(s, px, iy + ih + 6); }
        lastR = px + tw / 2;
      }
      let lastY = 1e9;
      for (const v of yt) {
        const s = yf(v), py = this.Y(v);
        if (Math.abs(py - lastY) < 12) continue;
        lastY = py;
        if (s.indexOf('^{') >= 0 || /[⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(s)) MC.text(ctx, s, ix - 7, py, { size: 10.5, mono: true, color: '--ink-3', align: 'right', baseline: 'middle' });
        else { ctx.fillStyle = C('--ink-3'); ctx.font = tf; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(s, ix - 7, py); }
      }
      /* rótulos de ejes */
      if (o.xlabel) axisLabel(ctx, o.xlabel, ix + iw, iy + ih + 32, { align: 'right' });
      if (o.ylabel) {
        ctx.save();
        ctx.translate(o.x + 12, iy + ih / 2);
        ctx.rotate(-Math.PI / 2);
        axisLabel(ctx, o.ylabel, 0, 0, { align: 'center', baseline: 'middle' });
        ctx.restore();
      }
      if (o.title) MC.text(ctx, o.title, ix, iy - 9, { size: 12, color: '--ink-2', weight: 600 });
      ctx.restore();
      return this;
    }
    clip(fn) {
      const ctx = this.ctx;
      ctx.save();
      ctx.beginPath();
      ctx.rect(this.ix, this.iy - 1, this.iw + 1, this.ih + 2);
      ctx.clip();
      fn(ctx);
      ctx.restore();
    }
    _style(st) {
      const ctx = this.ctx;
      ctx.strokeStyle = C(st.color || '--c1');
      ctx.lineWidth = st.width || 2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.setLineDash(st.dash || []);
      ctx.globalAlpha = st.alpha === undefined ? 1 : st.alpha;
    }
    fn(f, st = {}) {
      const o = this.o;
      const a = st.from !== undefined ? Math.max(st.from, o.xmin) : o.xmin;
      const b = st.to !== undefined ? Math.min(st.to, o.xmax) : o.xmax;
      if (!(b > a)) return this;
      const n = st.n || Math.max(80, Math.round(this.iw));
      const xs = new Array(n + 1), ys = new Array(n + 1);
      if (o.xlog) {
        const la = Math.log10(a), lb = Math.log10(b);
        for (let i = 0; i <= n; i++) { xs[i] = Math.pow(10, la + ((lb - la) * i) / n); ys[i] = f(xs[i]); }
      } else for (let i = 0; i <= n; i++) { xs[i] = a + ((b - a) * i) / n; ys[i] = f(xs[i]); }
      return this.xy(xs, ys, st);
    }
    xy(xs, ys, st = {}) {
      const ctx = this.ctx;
      const lim = this.ih * 6;
      const n = Math.min(xs.length, ys.length);
      this.clip(() => {
        if (st.fill) {
          ctx.save();
          ctx.fillStyle = C(st.fill);
          ctx.globalAlpha = st.fillAlpha === undefined ? 0.16 : st.fillAlpha;
          const base = this.Y(st.base === undefined ? Math.max(this.o.ymin, Math.min(0, this.o.ymax)) : st.base);
          let open = false, lastX = null;
          ctx.beginPath();
          for (let i = 0; i < n; i++) {
            const y = ys[i];
            if (!isFinite(y) || (st.fillFrom !== undefined && xs[i] < st.fillFrom) || (st.fillTo !== undefined && xs[i] > st.fillTo)) {
              if (open) { ctx.lineTo(lastX, base); ctx.closePath(); open = false; }
              continue;
            }
            const px = this.X(xs[i]), py = MC.M.clamp(this.Y(y), -lim, lim);
            if (!open) { ctx.moveTo(px, base); ctx.lineTo(px, py); open = true; } else ctx.lineTo(px, py);
            lastX = px;
          }
          if (open) { ctx.lineTo(lastX, base); ctx.closePath(); }
          ctx.fill();
          ctx.restore();
        }
        if (st.width === 0) return;
        this._style(st);
        ctx.beginPath();
        let pen = false, lastPy = null;
        for (let i = 0; i < n; i++) {
          const y = ys[i];
          if (y === null || !isFinite(y) || (this.o.ylog && y <= 0) || (this.o.xlog && xs[i] <= 0)) { pen = false; continue; }
          const px = this.X(xs[i]);
          const py = MC.M.clamp(this.Y(y), -lim, lim);
          if (pen && st.breakJumps && Math.abs(py - lastPy) > this.ih * 0.9) pen = false;
          if (!pen) { ctx.moveTo(px, py); pen = true; } else ctx.lineTo(px, py);
          lastPy = py;
        }
        ctx.stroke();
      });
      this.ctx.globalAlpha = 1;
      this.ctx.setLineDash([]);
      return this;
    }
    path(pts, st = {}) { return this.xy(pts.map((p) => p[0]), pts.map((p) => p[1]), st); }
    /* Puntos de datos (dispersión) */
    scatter(xs, ys, st = {}) {
      const ctx = this.ctx;
      this.clip(() => {
        ctx.fillStyle = C(st.color || '--c1');
        ctx.globalAlpha = st.alpha || 1;
        const r = st.r || 3;
        for (let i = 0; i < xs.length; i++) {
          if (!isFinite(ys[i])) continue;
          ctx.beginPath();
          ctx.arc(this.X(xs[i]), this.Y(ys[i]), r, 0, 2 * Math.PI);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      });
      return this;
    }
    dot(x, y, st = {}) {
      const ctx = this.ctx;
      const px = this.X(x), py = this.Y(y);
      if (!isFinite(px) || !isFinite(py)) return this;
      if (!st.noclip && !this.inside(px, py)) return this;
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, st.r || 4.5, 0, 2 * Math.PI);
      ctx.fillStyle = C(st.color || '--accent');
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = C('--canvas');
      ctx.stroke();
      ctx.restore();
      if (st.label) {
        const o = { size: 11.5, color: st.labelColor || '--ink', halo: true, align: st.align || 'left', mono: st.mono, math: st.math };
        let lx = px + (st.dx === undefined ? 7 : st.dx), ly = py + (st.dy === undefined ? -7 : st.dy);
        const tw = MC.textWidth(ctx, st.label, o);
        if (o.align === 'left' && lx + tw > this.ix + this.iw - 2) { o.align = 'right'; lx = px - (st.dx === undefined ? 7 : st.dx); }
        if (ly < this.iy + 12) ly = py + 16;
        MC.text(ctx, st.label, lx, ly, o);
      }
      return this;
    }
    vline(x, st = {}) {
      const ctx = this.ctx, px = this.X(x);
      if (px < this.ix - 1 || px > this.ix + this.iw + 1) return this;
      ctx.save();
      this._style(Object.assign({ width: 1.2, dash: [5, 4], color: '--ink-3' }, st));
      ctx.beginPath();
      ctx.moveTo(px, st.y1 !== undefined ? this.Y(st.y1) : this.iy);
      ctx.lineTo(px, st.y0 !== undefined ? this.Y(st.y0) : this.iy + this.ih);
      ctx.stroke();
      ctx.restore();
      if (st.label) MC.text(ctx, st.label, px + (st.align === 'right' ? -4 : 4), this.iy + (st.labelY || 12), { size: 11, color: st.color || '--ink-2', halo: true, align: st.align || 'left' });
      return this;
    }
    hline(y, st = {}) {
      const ctx = this.ctx, py = this.Y(y);
      if (py < this.iy - 1 || py > this.iy + this.ih + 1) return this;
      ctx.save();
      this._style(Object.assign({ width: 1.2, dash: [5, 4], color: '--ink-3' }, st));
      ctx.beginPath();
      ctx.moveTo(st.x0 !== undefined ? this.X(st.x0) : this.ix, py);
      ctx.lineTo(st.x1 !== undefined ? this.X(st.x1) : this.ix + this.iw, py);
      ctx.stroke();
      ctx.restore();
      if (st.label) MC.text(ctx, st.label, st.labelRight ? this.ix + this.iw - 4 : this.ix + 6, py + (st.below ? 13 : -5), { size: 11, color: st.color || '--ink-2', halo: true, align: st.labelRight ? 'right' : 'left' });
      return this;
    }
    band(x1, x2, st = {}) {
      const ctx = this.ctx;
      const a = Math.max(this.ix, this.X(Math.min(x1, x2))), b = Math.min(this.ix + this.iw, this.X(Math.max(x1, x2)));
      if (b <= a) return this;
      ctx.save();
      ctx.fillStyle = C(st.color || '--accent');
      ctx.globalAlpha = st.alpha || 0.1;
      ctx.fillRect(a, this.iy, b - a, this.ih);
      ctx.restore();
      return this;
    }
    hband(y1, y2, st = {}) {
      const ctx = this.ctx;
      const a = Math.max(this.iy, this.Y(Math.max(y1, y2))), b = Math.min(this.iy + this.ih, this.Y(Math.min(y1, y2)));
      if (b <= a) return this;
      ctx.save();
      ctx.fillStyle = C(st.color || '--accent');
      ctx.globalAlpha = st.alpha || 0.1;
      ctx.fillRect(this.ix, a, this.iw, b - a);
      ctx.restore();
      return this;
    }
    /* Recta que pasa por (x0,y0) con pendiente m (tangente o secante) */
    line(x0, y0, m, st = {}) {
      const a = st.from !== undefined ? st.from : this.o.xmin, b = st.to !== undefined ? st.to : this.o.xmax;
      return this.xy([a, b], [y0 + m * (a - x0), y0 + m * (b - x0)], Object.assign({ width: 1.6 }, st));
    }
    label(x, y, text, st = {}) {
      MC.text(this.ctx, text, this.X(x) + (st.dx || 0), this.Y(y) + (st.dy || 0), Object.assign({ size: 11.5, color: '--ink-2', halo: true }, st));
      return this;
    }
    arrow(x1, y1, x2, y2, st = {}) {
      MC.draw.arrow(this.ctx, this.X(x1), this.Y(y1), this.X(x2), this.Y(y2), st);
      return this;
    }
    /* Leyenda: items [{label, color, dash, kind}] */
    legend(items, corner = 'tr') {
      const ctx = this.ctx;
      const pad = 7, lh = 16, sw = 18;
      let w = 0;
      for (const it of items) w = Math.max(w, MC.textWidth(ctx, it.label, { size: 11.5, math: it.math }));
      const bw = w + sw + pad * 2 + 6, bh = items.length * lh + pad * 2 - 4;
      const x = corner.includes('l') ? this.ix + 6 : this.ix + this.iw - bw - 6;
      const y = corner.includes('b') ? this.iy + this.ih - bh - 6 : this.iy + 6;
      ctx.save();
      ctx.fillStyle = MC.alpha('--surface', 0.9);
      ctx.strokeStyle = C('--rule');
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(Math.round(x) + 0.5, Math.round(y) + 0.5, bw, bh);
      ctx.fill();
      ctx.stroke();
      items.forEach((it, i) => {
        const yy = y + pad + i * lh + 5;
        ctx.strokeStyle = C(it.color);
        ctx.fillStyle = C(it.color);
        ctx.lineWidth = it.width || 2.2;
        ctx.setLineDash(it.dash || []);
        if (it.kind === 'dot') { ctx.beginPath(); ctx.arc(x + pad + sw / 2, yy, 3.5, 0, 7); ctx.fill(); }
        else if (it.kind === 'sq') { ctx.globalAlpha = 0.6; ctx.fillRect(x + pad + 3, yy - 5, sw - 6, 10); ctx.globalAlpha = 1; }
        else { ctx.beginPath(); ctx.moveTo(x + pad, yy); ctx.lineTo(x + pad + sw, yy); ctx.stroke(); }
        ctx.setLineDash([]);
        MC.text(ctx, it.label, x + pad + sw + 6, yy, { size: 11.5, color: '--ink', baseline: 'middle', math: it.math });
      });
      ctx.restore();
      return this;
    }
    /* Cursor de lectura: línea vertical en xv y recuadro con valores.
       items: [{label, value, unit, color, y(opcional para punto), fmt}] */
    crosshair(xv, items, xitem) {
      const ctx = this.ctx;
      const px = this.X(xv);
      if (!(px >= this.ix && px <= this.ix + this.iw)) return this;
      ctx.save();
      ctx.strokeStyle = C('--ink-2');
      ctx.globalAlpha = 0.6;
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.round(px) + 0.5, this.iy);
      ctx.lineTo(Math.round(px) + 0.5, this.iy + this.ih);
      ctx.stroke();
      ctx.restore();
      for (const it of items) if (it.y !== undefined && isFinite(it.y)) this.dot(xv, it.y, { color: it.color, r: 3.5 });
      const lines = [];
      if (xitem) lines.push({ t: `${xitem.label} = ${(xitem.fmt || ((v) => MC.sci(v, 3)))(xv)}${xitem.unit ? ' ' + xitem.unit : ''}`, c: '--ink-2' });
      for (const it of items) {
        const v = it.value !== undefined ? it.value : it.y;
        lines.push({ t: `${it.label} = ${(it.fmt || ((q) => MC.sci(q, 3)))(v)}${it.unit ? ' ' + it.unit : ''}`, c: it.color || '--ink' });
      }
      if (!lines.length) return this;
      let w = 0;
      for (const l of lines) w = Math.max(w, MC.textWidth(ctx, l.t, { size: 11.5, mono: true }));
      const bw = w + 14, bh = lines.length * 15 + 8;
      let bx = px + 10;
      if (bx + bw > this.ix + this.iw) bx = px - 10 - bw;
      const by = this.iy + 6;
      ctx.save();
      ctx.fillStyle = MC.alpha('--surface', 0.94);
      ctx.strokeStyle = C('--rule-strong');
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(Math.round(bx) + 0.5, Math.round(by) + 0.5, bw, bh);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      lines.forEach((l, i) => MC.text(ctx, l.t, bx + 7, by + 15 + i * 15, { size: 11.5, mono: true, color: l.c }));
      return this;
    }
  }
  MC.Plot = Plot;

  /* ---------- Gráfica temporal alimentada por un historial ----------
     o = {ylabel:[sym, unidad], xlabel, series:[{key,label,color,unit,dash,width,fmt}],
          fns:[{f, color, dash, label, from, to}], tspan, tmax, ymin, ymax, zero, sym,
          minSpan, legend:'tr'|false, title, area:{key, from, to, color}}            */
  class TGraph {
    constructor(o = {}) {
      this.o = Object.assign({ xlabel: ['t', 's'], ylabel: '', series: [], fns: [], tspan: 5, zero: true, minSpan: 1, legend: 'tr' }, o);
      this.plot = null;
      this.hx = null;
    }
    set(o) { Object.assign(this.o, o); return this; }
    draw(ctx, rect, hist, opts = {}) {
      const o = this.o;
      const T = hist ? hist.d.t : [];
      const tNow = opts.t !== undefined ? opts.t : T.length ? T[T.length - 1] : 0;
      let xmax = o.tmax !== undefined && o.tmax !== null ? o.tmax : Math.max(o.tspan, tNow > o.tspan * 0.98 ? MC.niceCeil(tNow * 1.12) : o.tspan);
      const xmin = o.tmin || 0;
      let ymin = o.ymin, ymax = o.ymax;
      if (ymin === undefined || ymax === undefined || ymin === null || ymax === null) {
        let lo = Infinity, hi = -Infinity;
        if (hist) for (const s of o.series) for (const v of hist.d[s.key] || []) if (isFinite(v)) { if (v < lo) lo = v; if (v > hi) hi = v; }
        for (const f of o.fns) {
          if (f.noRange) continue;
          const a = f.from !== undefined ? f.from : xmin, b = Math.min(f.to !== undefined ? f.to : xmax, xmax);
          for (let i = 0; i <= 60; i++) { const v = f.f(a + ((b - a) * i) / 60); if (isFinite(v)) { if (v < lo) lo = v; if (v > hi) hi = v; } }
        }
        if (opts.yExtra) for (const v of opts.yExtra) if (isFinite(v)) { if (v < lo) lo = v; if (v > hi) hi = v; }
        [ymin, ymax] = MC.niceRange(lo, hi, { zero: o.zero, minSpan: o.minSpan, sym: o.sym, def: [0, o.minSpan] });
        if (o.ymin !== undefined && o.ymin !== null) ymin = o.ymin;
        if (o.ymax !== undefined && o.ymax !== null) ymax = o.ymax;
      }
      const P = this.plot || (this.plot = new Plot(ctx));
      P.ctx = ctx;
      P.set({ x: rect.x, y: rect.y, w: rect.w, h: rect.h, xmin, xmax, ymin, ymax, xlabel: o.xlabel, ylabel: o.ylabel, title: o.title || '', mt: o.title ? 22 : 10, mb: rect.mb || 36, ml: rect.ml || 52, mr: rect.mr || 12 });
      P.frame();
      if (opts.before) opts.before(P);
      for (const f of o.fns) P.fn(f.f, { color: f.color || '--ink-3', dash: f.dash || [5, 4], width: f.width || 1.5, from: f.from, to: f.to, alpha: f.alpha === undefined ? 0.9 : f.alpha });
      if (hist) for (const s of o.series) {
        const arr = hist.d[s.key];
        if (!arr) continue;
        P.xy(T, arr, { color: s.color, width: s.width || 2.2, dash: s.dash, fill: s.fill, fillAlpha: s.fillAlpha, base: s.base });
      }
      if (hist && T.length && opts.markers !== false) for (const s of o.series) {
        const arr = hist.d[s.key];
        if (arr && arr.length && isFinite(arr[arr.length - 1])) P.dot(T[T.length - 1], arr[arr.length - 1], { color: s.color, r: 3.6 });
      }
      if (opts.after) opts.after(P);
      const leg = o.series.filter((s) => s.label).concat(o.fns.filter((f) => f.label).map((f) => ({ label: f.label, color: f.color || '--ink-3', dash: f.dash || [5, 4] })));
      if (o.legend && leg.length > 1) P.legend(leg.map((s) => ({ label: s.label, color: s.color, dash: s.dash, math: s.math })), o.legend);
      if (this.hx !== null && hist && T.length) {
        const items = o.series.filter((s) => hist.d[s.key]).map((s) => ({ label: s.label || s.key, unit: s.unit, color: s.color, y: MC.M.interp(T, hist.d[s.key], Math.min(this.hx, T[T.length - 1])), fmt: s.fmt }));
        if (this.hx <= T[T.length - 1] + 1e-9) P.crosshair(this.hx, items, { label: 't', unit: 's', fmt: (v) => MC.fix(v, 2) });
      }
      return P;
    }
  }
  MC.TGraph = TGraph;

  /* Activa lectura con el puntero sobre gráficas (TGraph o objetos con .plot y .hx) */
  MC.hover = function (sim, cv, graphs) {
    const c = cv.el;
    const list = () => (typeof graphs === 'function' ? graphs() : graphs);
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      let any = false;
      for (const g of list()) {
        if (!g || !g.plot) continue;
        if (g.plot.inside(x, y)) { g.hx = g.plot.invX(x); any = true; } else g.hx = null;
      }
      if (any || c._hovered) sim.redraw();
      c._hovered = any;
    });
    c.addEventListener('pointerleave', () => {
      for (const g of list()) if (g) g.hx = null;
      c._hovered = false;
      sim.redraw();
    });
  };
})();
