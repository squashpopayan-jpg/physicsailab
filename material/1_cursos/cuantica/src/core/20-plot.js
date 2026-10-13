/* ===================================================================
   20-plot.js — Gráficas 2D (ejes, marcas, curvas, leyendas) y gráficas polares
   =================================================================== */
(function () {
  'use strict';
  const CQ = window.CQ;
  const C = (c) => (c && c.startsWith && c.startsWith('--') ? CQ.col(c) : c);

  CQ.niceStep = function (range, target) {
    if (!(range > 0)) return 1;
    const raw = range / Math.max(1, target);
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / p;
    const nf = f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10;
    return nf * p;
  };
  CQ.ticks = function (min, max, target = 6) {
    const step = CQ.niceStep(max - min, target);
    const out = [];
    const start = Math.ceil(min / step - 1e-9) * step;
    for (let v = start, i = 0; v <= max + step * 1e-9 && i < 200; v += step, i++) {
      out.push(Math.abs(v) < step * 1e-9 ? 0 : +v.toPrecision(12));
    }
    return { ticks: out, step };
  };
  CQ.tickFmt = function (step) {
    const st = Math.abs(+(+step).toPrecision(6));
    let dec = Math.max(0, -Math.floor(Math.log10(st) + 1e-9));
    while (dec < 8 && Math.abs(Math.round(st * Math.pow(10, dec)) - st * Math.pow(10, dec)) > 1e-6 * Math.pow(10, dec)) dec++;
    return (v) => {
      if (Math.abs(v) >= 1e5 || (Math.abs(v) > 0 && Math.abs(v) < 1e-4)) return CQ.sci(v, 2);
      return CQ.fix(v, Math.min(dec, 6));
    };
  };
  /* Etiquetas de múltiplos de π */
  CQ.piFmt = function (v) {
    const k = Math.round((v / Math.PI) * 4);
    if (Math.abs(v - (k * Math.PI) / 4) > 1e-6) return CQ.fix(v, 2);
    if (k === 0) return '0';
    const g = (a, b) => (b ? g(b, a % b) : Math.abs(a));
    const d = g(k, 4), num = k / d, den = 4 / d;
    const ns = num === 1 ? '' : num === -1 ? '−' : CQ.minus(String(num));
    return den === 1 ? ns + 'π' : ns + 'π/' + den;
  };

  class Plot {
    constructor(ctx, o = {}) {
      this.ctx = ctx;
      this.o = Object.assign({
        x: 0, y: 0, w: 300, h: 200,
        xmin: 0, xmax: 1, ymin: 0, ymax: 1,
        ml: 54, mr: 16, mt: 14, mb: 40,
        xlabel: '', ylabel: '', title: '',
        grid: true, xfmt: null, yfmt: null, xticks: null, yticks: null,
        xpi: false, frame: true, zero: true, bg: null
      }, o);
      if (o.title && o.mt === undefined) this.o.mt = 26;
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
      /* Marcas */
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
      const logF = (v) => (v >= 1e-3 && v < 1e4 ? CQ.sci(v, 1) : '10^{' + CQ.minus(Math.round(Math.log10(v))) + '}');
      if (o.xlog) { [xt, xm] = logT(o.xmin, o.xmax); xf = o.xfmt || logF; }
      else if (o.xticks && Array.isArray(o.xticks)) { xt = o.xticks; xf = o.xfmt || CQ.tickFmt(xt.length > 1 ? Math.abs(xt[1] - xt[0]) : 1); }
      else if (o.xpi) {
        const span = (o.xmax - o.xmin) / Math.PI;
        const st = span > 8 ? Math.PI * 2 : span > 3 ? Math.PI : span > 1.5 ? Math.PI / 2 : Math.PI / 4;
        xt = [];
        for (let v = Math.ceil(o.xmin / st - 1e-9) * st; v <= o.xmax + 1e-9; v += st) xt.push(v);
        xf = o.xfmt || CQ.piFmt;
      } else { const r = CQ.ticks(o.xmin, o.xmax, Math.max(2, Math.round(iw / 78))); xt = r.ticks; xf = o.xfmt || CQ.tickFmt(r.step); }
      if (o.ylog) { [yt, ym] = logT(o.ymin, o.ymax); yf = o.yfmt || logF; }
      else if (o.yticks && Array.isArray(o.yticks)) { yt = o.yticks; yf = o.yfmt || CQ.tickFmt(yt.length > 1 ? Math.abs(yt[1] - yt[0]) : 1); }
      else { const r = CQ.ticks(o.ymin, o.ymax, Math.max(2, Math.round(ih / 42))); yt = r.ticks; yf = o.yfmt || CQ.tickFmt(r.step); }
      this._xt = xt; this._yt = yt;
      /* Cuadrícula */
      if (o.grid) {
        ctx.strokeStyle = CQ.col('--grid');
        ctx.lineWidth = 1;
        if (xm.length || ym.length) {
          ctx.globalAlpha = 0.55;
          ctx.beginPath();
          for (const v of xm) { const px = Math.round(this.X(v)) + 0.5; ctx.moveTo(px, iy); ctx.lineTo(px, iy + ih); }
          for (const v of ym) { const py = Math.round(this.Y(v)) + 0.5; ctx.moveTo(ix, py); ctx.lineTo(ix + iw, py); }
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        ctx.beginPath();
        for (const v of xt) { const px = Math.round(this.X(v)) + 0.5; ctx.moveTo(px, iy); ctx.lineTo(px, iy + ih); }
        for (const v of yt) { const py = Math.round(this.Y(v)) + 0.5; ctx.moveTo(ix, py); ctx.lineTo(ix + iw, py); }
        ctx.stroke();
      }
      /* Líneas de cero */
      if (o.zero && !o.xlog && !o.ylog) {
        ctx.strokeStyle = CQ.col('--grid-2');
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        if (o.ymin < 0 && o.ymax > 0) { const py = Math.round(this.Y(0)) + 0.5; ctx.moveTo(ix, py); ctx.lineTo(ix + iw, py); }
        if (o.xmin < 0 && o.xmax > 0) { const px = Math.round(this.X(0)) + 0.5; ctx.moveTo(px, iy); ctx.lineTo(px, iy + ih); }
        ctx.stroke();
      }
      /* Marco */
      if (o.frame) {
        ctx.strokeStyle = CQ.col('--axis');
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
      /* Números */
      ctx.fillStyle = CQ.col('--ink-3');
      ctx.font = `11px ${CQ.FONT_MONO}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      let lastR = -1e9;
      for (const v of xt) {
        const s = xf(v), px = this.X(v);
        const rich = s.indexOf('^{') >= 0 || s.indexOf('_{') >= 0;
        const tw = rich ? CQ.textWidth(ctx, s, { size: 11, mono: true }) : ctx.measureText(s).width;
        if (px - tw / 2 < lastR + 4) continue;
        if (rich) CQ.text(ctx, s, px, iy + ih + 16, { size: 11, mono: true, color: '--ink-3', align: 'center' });
        else { ctx.fillStyle = CQ.col('--ink-3'); ctx.font = `11px ${CQ.FONT_MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(s, px, iy + ih + 7); }
        lastR = px + tw / 2;
      }
      for (const v of yt) {
        const s = yf(v);
        if (s.indexOf('^{') >= 0 || s.indexOf('_{') >= 0) CQ.text(ctx, s, ix - 7, this.Y(v), { size: 11, mono: true, color: '--ink-3', align: 'right', baseline: 'middle' });
        else { ctx.fillStyle = CQ.col('--ink-3'); ctx.font = `11px ${CQ.FONT_MONO}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(s, ix - 7, this.Y(v)); }
      }
      /* Etiquetas de ejes */
      if (o.xlabel) CQ.text(ctx, o.xlabel, ix + iw / 2, iy + ih + 32, { size: 12.5, color: '--ink-2', align: 'center', weight: 500 });
      if (o.ylabel) {
        ctx.save();
        ctx.translate(o.x + 13, iy + ih / 2);
        ctx.rotate(-Math.PI / 2);
        CQ.text(ctx, o.ylabel, 0, 0, { size: 12.5, color: '--ink-2', align: 'center', baseline: 'middle', weight: 500 });
        ctx.restore();
      }
      if (o.title) CQ.text(ctx, o.title, ix, iy - 10, { size: 12, color: '--ink-2', weight: 650 });
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
    /* Curva de una función y = f(x) */
    fn(f, st = {}) {
      const o = this.o;
      const a = st.from !== undefined ? Math.max(st.from, o.xmin) : o.xmin;
      const b = st.to !== undefined ? Math.min(st.to, o.xmax) : o.xmax;
      const n = st.n || Math.max(60, Math.round(this.iw));
      const xs = new Array(n + 1), ys = new Array(n + 1);
      if (o.xlog) {
        const la = Math.log10(a), lb = Math.log10(b);
        for (let i = 0; i <= n; i++) { xs[i] = Math.pow(10, la + ((lb - la) * i) / n); ys[i] = f(xs[i]); }
      } else for (let i = 0; i <= n; i++) { xs[i] = a + ((b - a) * i) / n; ys[i] = f(xs[i]); }
      return this.xy(xs, ys, st);
    }
    /* Curva paramétrica/datos */
    xy(xs, ys, st = {}) {
      const ctx = this.ctx;
      const lim = this.ih * 6;
      this.clip(() => {
        if (st.fill) {
          ctx.save();
          ctx.fillStyle = C(st.fill);
          ctx.globalAlpha = st.fillAlpha === undefined ? 0.16 : st.fillAlpha;
          const base = this.Y(st.base === undefined ? Math.max(this.o.ymin, Math.min(0, this.o.ymax)) : st.base);
          let open = false;
          ctx.beginPath();
          let lastX = null;
          for (let i = 0; i < xs.length; i++) {
            const y = ys[i];
            if (!isFinite(y) || (this.o.ylog && y <= 0)) {
              if (open) { ctx.lineTo(lastX, base); ctx.closePath(); open = false; }
              continue;
            }
            const px = this.X(xs[i]), py = CQ.M.clamp(this.Y(y), -lim, lim);
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
        for (let i = 0; i < xs.length; i++) {
          const y = ys[i];
          if (!isFinite(y) || y === null || (this.o.ylog && y <= 0) || (this.o.xlog && xs[i] <= 0)) { pen = false; continue; }
          const px = this.X(xs[i]);
          const py = CQ.M.clamp(this.Y(y), -lim, lim);
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
    /* Puntos (x,y) en arreglos de pares */
    path(pts, st = {}) {
      return this.xy(pts.map((p) => p[0]), pts.map((p) => p[1]), st);
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
      ctx.strokeStyle = CQ.col('--canvas');
      ctx.stroke();
      ctx.restore();
      if (st.label) CQ.text(ctx, st.label, px + (st.dx === undefined ? 7 : st.dx), py + (st.dy === undefined ? -7 : st.dy), { size: 11.5, color: st.labelColor || '--ink', halo: true, align: st.align || 'left', mono: st.mono });
      return this;
    }
    vline(x, st = {}) {
      const ctx = this.ctx, px = this.X(x);
      if (px < this.ix - 1 || px > this.ix + this.iw + 1) return this;
      ctx.save();
      this._style(Object.assign({ width: 1.2, dash: [5, 4], color: '--ink-3' }, st));
      ctx.beginPath();
      ctx.moveTo(px, this.iy);
      ctx.lineTo(px, this.iy + this.ih);
      ctx.stroke();
      ctx.restore();
      if (st.label) CQ.text(ctx, st.label, px + 4, this.iy + (st.labelY || 12), { size: 11.5, color: st.color || '--ink-2', halo: true, align: st.align || 'left' });
      return this;
    }
    hline(y, st = {}) {
      const ctx = this.ctx, py = this.Y(y);
      if (py < this.iy - 1 || py > this.iy + this.ih + 1) return this;
      ctx.save();
      this._style(Object.assign({ width: 1.2, dash: [5, 4], color: '--ink-3' }, st));
      ctx.beginPath();
      ctx.moveTo(this.ix, py);
      ctx.lineTo(this.ix + this.iw, py);
      ctx.stroke();
      ctx.restore();
      if (st.label) CQ.text(ctx, st.label, st.labelRight ? this.ix + this.iw - 4 : this.ix + 6, py - 5, { size: 11.5, color: st.color || '--ink-2', halo: true, align: st.labelRight ? 'right' : 'left' });
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
    label(x, y, text, st = {}) {
      CQ.text(this.ctx, text, this.X(x) + (st.dx || 0), this.Y(y) + (st.dy || 0), Object.assign({ size: 11.5, color: '--ink-2', halo: true }, st));
      return this;
    }
    arrow(x1, y1, x2, y2, st = {}) {
      CQ.draw.arrow(this.ctx, this.X(x1), this.Y(y1), this.X(x2), this.Y(y2), st);
      return this;
    }
    /* Leyenda dentro del área: items [{label, color, dash, kind}] */
    legend(items, corner = 'tr') {
      const ctx = this.ctx;
      const pad = 8, lh = 17, sw = 20;
      let w = 0;
      for (const it of items) w = Math.max(w, CQ.textWidth(ctx, it.label, { size: 11.5 }));
      const bw = w + sw + pad * 2 + 6, bh = items.length * lh + pad * 2 - 4;
      const x = corner.includes('l') ? this.ix + 8 : this.ix + this.iw - bw - 8;
      const y = corner.includes('b') ? this.iy + this.ih - bh - 8 : this.iy + 8;
      ctx.save();
      ctx.fillStyle = CQ.alpha('--surface', 0.9);
      ctx.strokeStyle = CQ.col('--rule');
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.rect(x + 0.5, y + 0.5, bw, bh);
      ctx.fill();
      ctx.stroke();
      items.forEach((it, i) => {
        const yy = y + pad + i * lh + 5;
        ctx.strokeStyle = C(it.color);
        ctx.fillStyle = C(it.color);
        ctx.lineWidth = it.width || 2.2;
        ctx.setLineDash(it.dash || []);
        if (it.kind === 'dot') { ctx.beginPath(); ctx.arc(x + pad + sw / 2, yy, 4, 0, 7); ctx.fill(); }
        else if (it.kind === 'sq') { ctx.globalAlpha = 0.6; ctx.fillRect(x + pad + 3, yy - 5, sw - 6, 10); ctx.globalAlpha = 1; }
        else { ctx.beginPath(); ctx.moveTo(x + pad, yy); ctx.lineTo(x + pad + sw, yy); ctx.stroke(); }
        ctx.setLineDash([]);
        CQ.text(ctx, it.label, x + pad + sw + 6, yy, { size: 11.5, color: '--ink', baseline: 'middle' });
      });
      ctx.restore();
      return this;
    }
  }
  CQ.Plot = Plot;

  /* ---------- Gráfica polar ----------
     zero: 'top'  → ángulo θ medido desde el eje vertical (z) en sentido horario (plano E de antenas)
     zero: 'right'→ ángulo φ medido desde +x en sentido antihorario (plano H)            */
  class Polar {
    constructor(ctx, o = {}) {
      this.ctx = ctx;
      this.o = Object.assign({ cx: 100, cy: 100, R: 90, zero: 'top', rings: [0.25, 0.5, 0.75, 1], spokes: 30, db: false, dbMin: -30, labels: true, axisNames: null }, o);
    }
    set(o) { Object.assign(this.o, o); return this; }
    xy(ang, r) {
      const o = this.o;
      if (o.zero === 'top') return [o.cx + r * o.R * Math.sin(ang), o.cy - r * o.R * Math.cos(ang)];
      return [o.cx + r * o.R * Math.cos(ang), o.cy - r * o.R * Math.sin(ang)];
    }
    /* Convierte valor normalizado (0..1 de potencia o campo) a radio de dibujo */
    rad(v) {
      const o = this.o;
      if (!o.db) return CQ.M.clamp(v, 0, 1.2);
      if (v <= 0) return 0;
      const d = 10 * Math.log10(v);
      return CQ.M.clamp((d - o.dbMin) / -o.dbMin, 0, 1);
    }
    frame() {
      const ctx = this.ctx, o = this.o;
      ctx.save();
      ctx.strokeStyle = CQ.col('--grid-2');
      ctx.lineWidth = 1;
      const rings = o.db ? [0, 0.25, 0.5, 0.75, 1] : o.rings;
      for (const r of rings) {
        if (r <= 0) continue;
        ctx.beginPath();
        ctx.arc(o.cx, o.cy, r * o.R, 0, 2 * Math.PI);
        ctx.stroke();
      }
      ctx.strokeStyle = CQ.col('--grid');
      for (let a = 0; a < 360; a += o.spokes) {
        const [x, y] = this.xy(CQ.M.rad(a), 1);
        ctx.beginPath();
        ctx.moveTo(o.cx, o.cy);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      if (o.labels) {
        ctx.fillStyle = CQ.col('--ink-3');
        ctx.font = `10.5px ${CQ.FONT_MONO}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (let a = 0; a < 360; a += o.spokes) {
          const [x, y] = this.xy(CQ.M.rad(a), 1.1);
          let lab = a + '°';
          if (o.zero === 'top' && a > 180) lab = (360 - a) + '°';
          ctx.fillText(lab, x, y);
        }
        /* Anillos */
        ctx.textAlign = 'left';
        for (const r of rings) {
          if (r <= 0 || r >= 1) continue;
          const lab = o.db ? CQ.minus(Math.round(o.dbMin * (1 - r))) + ' dB' : String(r);
          const [x, y] = o.zero === 'top' ? [o.cx + 3, o.cy - r * o.R - 6] : [o.cx + r * o.R * Math.cos(0.26) + 2, o.cy - r * o.R * Math.sin(0.26) - 5];
          ctx.fillText(lab, x, y);
        }
      }
      if (o.axisNames) {
        for (const [ang, name] of o.axisNames) {
          const [x, y] = this.xy(CQ.M.rad(ang), 1.23);
          CQ.text(ctx, name, x, y, { size: 12.5, color: '--ink-2', align: 'center', baseline: 'middle', italic: true, family: CQ.FONT_MATH });
        }
      }
      ctx.restore();
      return this;
    }
    /* Traza r = f(ang) (valor normalizado); symmetric: refleja para zero:'top' (θ∈[0,π] → ambos lados) */
    curve(f, st = {}) {
      const ctx = this.ctx, o = this.o;
      const n = st.n || 720;
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const ang = (2 * Math.PI * i) / n;
        let a = ang;
        if (o.zero === 'top' && st.symmetric !== false && ang > Math.PI) a = 2 * Math.PI - ang;
        const [x, y] = this.xy(ang, this.rad(f(a)));
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      if (st.fill !== false) {
        ctx.fillStyle = C(st.color || '--c1');
        ctx.globalAlpha = st.fillAlpha || 0.14;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = C(st.color || '--c1');
      ctx.lineWidth = st.width || 2;
      ctx.setLineDash(st.dash || []);
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
      return this;
    }
  }
  CQ.Polar = Polar;
})();
