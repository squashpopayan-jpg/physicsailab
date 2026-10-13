/* ===================================================================
   30-view2d.js — Vista 2D en coordenadas del mundo, campos vectoriales,
   líneas de campo (RK4), curvas de nivel (marching squares) y mapas de calor
   =================================================================== */
(function () {
  'use strict';
  const RT = window.RT;
  const C = (c) => (c && c.startsWith && c.startsWith('--') ? RT.col(c) : c);

  /* ---------- Vista 2D con relación de aspecto 1:1 ---------- */
  class View2D {
    constructor(cv, o = {}) {
      this.cv = cv;
      this.o = Object.assign({ xmin: -5, xmax: 5, ymin: -3, ymax: 3, pad: 0 }, o);
      this.update();
    }
    setRange(r) { Object.assign(this.o, r); this.update(); return this; }
    update() {
      const o = this.o, w = this.cv.w || 1, h = this.cv.h || 1;
      const pad = o.pad;
      const sx = (w - 2 * pad) / (o.xmax - o.xmin), sy = (h - 2 * pad) / (o.ymax - o.ymin);
      this.s = Math.min(sx, sy);
      this.xc = (o.xmin + o.xmax) / 2;
      this.yc = (o.ymin + o.ymax) / 2;
      this.cx = w / 2 + (o.offX || 0);
      this.cy = h / 2 + (o.offY || 0);
      this.x0 = this.wx(0); this.x1 = this.wx(w);
      this.y0 = this.wy(h); this.y1 = this.wy(0);
      return this;
    }
    X(x) { return this.cx + (x - this.xc) * this.s; }
    Y(y) { return this.cy - (y - this.yc) * this.s; }
    wx(px) { return this.xc + (px - this.cx) / this.s; }
    wy(py) { return this.yc - (py - this.cy) / this.s; }
    /* Papel milimetrado + ejes */
    grid(o = {}) {
      const ctx = this.cv.ctx, w = this.cv.w, h = this.cv.h;
      let major = o.major, minor = o.minor;
      if (!major) {
        major = RT.niceStep(this.x1 - this.x0, Math.max(2, w / 95));
        const lead = Math.round(major / Math.pow(10, Math.floor(Math.log10(major) + 1e-9)));
        minor = minor || (lead === 2 ? major / 4 : major / 5);
      } else if (!minor) minor = major / 5;
      ctx.save();
      ctx.lineWidth = 1;
      const lines = (step, col) => {
        ctx.strokeStyle = C(col);
        ctx.beginPath();
        for (let x = Math.ceil(this.x0 / step) * step; x <= this.x1; x += step) { const px = Math.round(this.X(x)) + 0.5; ctx.moveTo(px, 0); ctx.lineTo(px, h); }
        for (let y = Math.ceil(this.y0 / step) * step; y <= this.y1; y += step) { const py = Math.round(this.Y(y)) + 0.5; ctx.moveTo(0, py); ctx.lineTo(w, py); }
        ctx.stroke();
      };
      if (o.minorLines !== false) lines(minor, '--grid');
      lines(major, '--grid-2');
      if (o.axes !== false) {
        ctx.strokeStyle = C('--axis');
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        const px = Math.round(this.X(0)) + 0.5, py = Math.round(this.Y(0)) + 0.5;
        if (px > 0 && px < w) { ctx.moveTo(px, 0); ctx.lineTo(px, h); }
        if (py > 0 && py < h) { ctx.moveTo(0, py); ctx.lineTo(w, py); }
        ctx.stroke();
        ctx.globalAlpha = 1;
        if (o.labels !== false) {
          ctx.fillStyle = C('--ink-3');
          ctx.font = `10.5px ${RT.FONT_MONO}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          const f = RT.tickFmt(major);
          const yl = RT.M.clamp(py + 4, 4, h - 16);
          for (let x = Math.ceil(this.x0 / major) * major; x <= this.x1; x += major) {
            if (Math.abs(x) < major * 1e-6) continue;
            ctx.fillText(f(x) + (o.unit ? '' : ''), this.X(x), yl);
          }
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          const xl = RT.M.clamp(px + 5, 4, w - 30);
          for (let y = Math.ceil(this.y0 / major) * major; y <= this.y1; y += major) {
            if (Math.abs(y) < major * 1e-6) continue;
            ctx.fillText(f(y), xl, this.Y(y));
          }
          if (o.xlabel) RT.text(ctx, o.xlabel, w - 8, RT.M.clamp(py - 8, 14, h - 6), { size: 13, italic: true, family: RT.FONT_MATH, color: '--ink-2', align: 'right' });
          if (o.ylabel) RT.text(ctx, o.ylabel, RT.M.clamp(px + 8, 8, w - 20), 16, { size: 13, italic: true, family: RT.FONT_MATH, color: '--ink-2' });
        }
      }
      ctx.restore();
      return { minor, major };
    }
    /* Barra de escala */
    scaleBar(len, label) {
      const ctx = this.cv.ctx;
      const x = 14, y = this.cv.h - 14, L = len * this.s;
      ctx.save();
      ctx.strokeStyle = C('--ink-2');
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y - 4); ctx.lineTo(x, y); ctx.lineTo(x + L, y); ctx.lineTo(x + L, y - 4);
      ctx.stroke();
      ctx.restore();
      RT.text(ctx, label, x + L / 2, y - 7, { size: 11, color: '--ink-2', align: 'center', mono: true, halo: true });
    }
  }
  RT.View2D = View2D;

  /* ---------- Campos escalares sobre la vista: muestreo, curvas de nivel, mapas de calor ---------- */
  const F = (RT.field = {});

  /* Muestreo en cuadrícula de píxeles para contornos */
  F.sample = function (view, fn, res) {
    const w = view.cv.w, h = view.cv.h;
    const nx = Math.ceil(w / res) + 1, ny = Math.ceil(h / res) + 1;
    const vals = new Float64Array(nx * ny);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const v = fn(view.wx(i * res), view.wy(j * res));
      vals[j * nx + i] = v;
    }
    return { nx, ny, res, vals };
  };
  /* Curvas de nivel (marching squares). levels: arreglo de valores. */
  F.contours = function (view, fn, levels, o = {}) {
    const ctx = view.cv.ctx;
    const g = o.grid || F.sample(view, fn, o.res || 4);
    const { nx, ny, res, vals } = g;
    ctx.save();
    ctx.lineWidth = o.width || 1.2;
    ctx.lineJoin = 'round';
    if (o.dash) ctx.setLineDash(o.dash);
    for (let li = 0; li < levels.length; li++) {
      const L = levels[li];
      ctx.strokeStyle = typeof o.color === 'function' ? o.color(L, li) : C(o.color || '--equip');
      ctx.globalAlpha = o.alpha === undefined ? 0.9 : o.alpha;
      ctx.beginPath();
      for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
        const a = vals[j * nx + i], b = vals[j * nx + i + 1], c = vals[(j + 1) * nx + i + 1], d = vals[(j + 1) * nx + i];
        if (!(isFinite(a) && isFinite(b) && isFinite(c) && isFinite(d))) continue;
        /* Evita líneas espurias en singularidades: celdas con variación enorme */
        if (o.maxJump && Math.max(a, b, c, d) - Math.min(a, b, c, d) > o.maxJump) continue;
        let idx = 0;
        if (a > L) idx |= 8;
        if (b > L) idx |= 4;
        if (c > L) idx |= 2;
        if (d > L) idx |= 1;
        if (idx === 0 || idx === 15) continue;
        const x = i * res, y = j * res;
        const top = () => [x + (res * (L - a)) / (b - a), y];
        const right = () => [x + res, y + (res * (L - b)) / (c - b)];
        const bottom = () => [x + (res * (L - d)) / (c - d), y + res];
        const left = () => [x, y + (res * (L - a)) / (d - a)];
        const seg = (p, q) => { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };
        switch (idx) {
          case 1: case 14: seg(left(), bottom()); break;
          case 2: case 13: seg(bottom(), right()); break;
          case 3: case 12: seg(left(), right()); break;
          case 4: case 11: seg(top(), right()); break;
          case 6: case 9: seg(top(), bottom()); break;
          case 7: case 8: seg(left(), top()); break;
          case 5: case 10: {
            const ctr = (a + b + c + d) / 4;
            if ((idx === 5) === (ctr > L)) { seg(left(), top()); seg(bottom(), right()); }
            else { seg(left(), bottom()); seg(top(), right()); }
            break;
          }
        }
      }
      ctx.stroke();
    }
    ctx.restore();
    return g;
  };

  /* Mapa de calor: colorFn(valor) → [r,g,b] */
  F.heat = function (view, fn, colorFn, o = {}) {
    const res = o.res || 3;
    const cv = view.cv, w = cv.w, h = cv.h;
    const nx = Math.ceil(w / res), ny = Math.ceil(h / res);
    if (!view._off || view._off.width !== nx || view._off.height !== ny) {
      view._off = document.createElement('canvas');
      view._off.width = nx;
      view._off.height = ny;
    }
    const octx = view._off.getContext('2d');
    const img = octx.createImageData(nx, ny);
    const d = img.data;
    const a = Math.round(255 * (o.alpha === undefined ? 1 : o.alpha));
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const v = fn(view.wx((i + 0.5) * res), view.wy((j + 0.5) * res));
      const c = colorFn(v);
      const k = (j * nx + i) * 4;
      d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = isFinite(v) ? a : 0;
    }
    octx.putImageData(img, 0, 0);
    const ctx = cv.ctx;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(view._off, 0, 0, nx * res, ny * res);
    ctx.restore();
  };

  /* Niveles simétricos para potenciales */
  F.levels = function (vmax, n, o = {}) {
    const out = [];
    if (o.log) {
      for (let k = 1; k <= n; k++) { const v = vmax * Math.pow(o.ratio || 0.6, n - k); out.push(v, -v); }
      if (o.zero !== false) out.push(0);
      return out;
    }
    for (let k = -n; k <= n; k++) if (k !== 0 || o.zero !== false) out.push((vmax * k) / n);
    return out;
  };

  /* Barra de colores vertical */
  F.colorbar = function (ctx, x, y, w, h, cmapFn, vmin, vmax, o = {}) {
    for (let i = 0; i < h; i++) {
      const t = 1 - i / (h - 1);
      const c = cmapFn(vmin + (vmax - vmin) * t);
      ctx.fillStyle = RT.rgbStr(c);
      ctx.fillRect(x, y + i, w, 1.5);
    }
    ctx.strokeStyle = RT.col('--rule-strong');
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    const f = o.fmt || ((v) => RT.sci(v, 2));
    RT.text(ctx, f(vmax), x + w + 4, y + 6, { size: 10.5, mono: true, color: '--ink-2', halo: true });
    RT.text(ctx, f(vmin), x + w + 4, y + h, { size: 10.5, mono: true, color: '--ink-2', halo: true });
    if (o.mid !== undefined) RT.text(ctx, f(o.mid), x + w + 4, y + h / 2 + 4, { size: 10.5, mono: true, color: '--ink-2', halo: true });
    if (o.label) RT.text(ctx, o.label, x, y - 6, { size: 11, color: '--ink-2', halo: true });
  };
})();
