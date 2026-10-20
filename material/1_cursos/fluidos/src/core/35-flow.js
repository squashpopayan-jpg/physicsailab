/* ===================================================================
   35-flow.js — Dibujo de flujos: campos escalares, líneas de corriente,
   contornos (cuadrados marchantes), partículas trazadoras, agua y sólidos
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM;
  const C = (c) => (c && c.startsWith && c.startsWith('--') ? EM.col(c) : c);
  const F = (EM.flow = {});

  /* ---------- Campo escalar en rejilla nx × ny → imagen en el rectángulo r ----------
     vals[j*nx+i], fila j = 0 abajo si o.flip (convención física) */
  let off = null, offCtx = null, img = null;
  F.paint = function (ctx, vals, nx, ny, r, map, o = {}) {
    if (!off || off.width !== nx || off.height !== ny) {
      off = document.createElement('canvas'); off.width = nx; off.height = ny;
      offCtx = off.getContext('2d'); img = offCtx.createImageData(nx, ny);
    }
    const d = img.data, mask = o.mask, solid = o.solid ? EM.rgb(o.solid) : EM.rgb('--solid');
    const flip = o.flip !== false;
    for (let j = 0; j < ny; j++) {
      const row = flip ? ny - 1 - j : j;
      for (let i = 0; i < nx; i++) {
        const k = j * nx + i, p = 4 * (row * nx + i);
        const c = mask && mask[k] ? solid : map(vals[k]);
        d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2]; d[p + 3] = c.length > 3 ? c[3] : 255;
      }
    }
    offCtx.putImageData(img, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = o.smooth !== false;
    ctx.drawImage(off, 0, 0, nx, ny, r.x, r.y, r.w, r.h);
    ctx.restore();
  };

  /* ---------- Línea de corriente por integración del campo de direcciones ----------
     vel(x, y) → [u, v]; o = {ds, n, box:[x0,x1,y0,y1], stop(x,y), both, minSpeed} */
  F.trace = function (vel, x0, y0, o = {}) {
    const ds = o.ds || 0.01, n = o.n || 600, box = o.box, minS = o.minSpeed || 1e-9;
    const run = (sgn) => {
      const pts = [];
      let x = x0, y = y0;
      const dir = (x, y) => { const [u, v] = vel(x, y), s = Math.hypot(u, v); return s < minS || !isFinite(s) ? null : [(sgn * u) / s, (sgn * v) / s]; };
      for (let i = 0; i < n; i++) {
        const a = dir(x, y); if (!a) break;
        const b = dir(x + 0.5 * ds * a[0], y + 0.5 * ds * a[1]); if (!b) break;
        x += ds * b[0]; y += ds * b[1];
        if (box && (x < box[0] || x > box[1] || y < box[2] || y > box[3])) { pts.push([x, y]); break; }
        if (o.stop && o.stop(x, y)) break;
        pts.push([x, y]);
      }
      return pts;
    };
    const fw = run(1);
    if (!o.both) return [[x0, y0]].concat(fw);
    return run(-1).reverse().concat([[x0, y0]], fw);
  };
  /* Dibuja una polilínea en coordenadas del mundo con un mapeo map([x,y]) → [px,py] */
  F.drawPath = function (ctx, pts, map, st = {}) {
    if (pts.length < 2) return;
    ctx.save();
    ctx.strokeStyle = C(st.color || '--c1'); ctx.lineWidth = st.width || 1.4; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (st.alpha !== undefined) ctx.globalAlpha = st.alpha;
    if (st.dash) ctx.setLineDash(st.dash);
    ctx.beginPath();
    let p = map(pts[0]); ctx.moveTo(p[0], p[1]);
    for (let i = 1; i < pts.length; i++) { p = map(pts[i]); ctx.lineTo(p[0], p[1]); }
    ctx.stroke();
    if (st.arrow && pts.length > 8) {
      const m = Math.floor(pts.length * (st.arrowAt || 0.5)), a = map(pts[m - 2]), b = map(pts[m]);
      EM.draw.arrow(ctx, a[0], a[1], b[0], b[1], { color: st.color || '--c1', width: st.width || 1.4, head: 7 });
    }
    ctx.restore();
  };

  /* ---------- Contornos por cuadrados marchantes ----------
     vals en rejilla nx × ny (j = 0 abajo); devuelve segmentos [[i1,j1,i2,j2], ...] en índices fraccionarios */
  F.contour = function (vals, nx, ny, level, mask) {
    const seg = [];
    const V = (i, j) => vals[j * nx + i];
    const lerp = (a, b) => (level - a) / (b - a);
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      if (mask && (mask[j * nx + i] || mask[j * nx + i + 1] || mask[(j + 1) * nx + i] || mask[(j + 1) * nx + i + 1])) continue;
      const a = V(i, j), b = V(i + 1, j), c = V(i + 1, j + 1), d = V(i, j + 1);
      if (!(isFinite(a) && isFinite(b) && isFinite(c) && isFinite(d))) continue;
      let idx = 0;
      if (a > level) idx |= 1; if (b > level) idx |= 2; if (c > level) idx |= 4; if (d > level) idx |= 8;
      if (idx === 0 || idx === 15) continue;
      const e = [];
      const B = () => [i + lerp(a, b), j], R = () => [i + 1, j + lerp(b, c)], T = () => [i + lerp(d, c), j + 1], L = () => [i, j + lerp(a, d)];
      switch (idx) {
        case 1: case 14: e.push([L(), B()]); break;
        case 2: case 13: e.push([B(), R()]); break;
        case 3: case 12: e.push([L(), R()]); break;
        case 4: case 11: e.push([R(), T()]); break;
        case 5: e.push([L(), T()], [B(), R()]); break;
        case 6: case 9: e.push([B(), T()]); break;
        case 7: case 8: e.push([L(), T()]); break;
        case 10: e.push([L(), B()], [R(), T()]); break;
      }
      for (const [p, q] of e) seg.push([p[0], p[1], q[0], q[1]]);
    }
    return seg;
  };
  F.drawSegs = function (ctx, segs, map, st = {}) {
    ctx.save();
    ctx.strokeStyle = C(st.color || '--ink-2'); ctx.lineWidth = st.width || 1.1; ctx.lineCap = 'round';
    if (st.alpha !== undefined) ctx.globalAlpha = st.alpha;
    if (st.dash) ctx.setLineDash(st.dash);
    ctx.beginPath();
    for (const s of segs) { const p = map(s[0], s[1]), q = map(s[2], s[3]); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); }
    ctx.stroke();
    ctx.restore();
  };

  /* ---------- Partículas trazadoras con estela corta ---------- */
  class Tracers {
    constructor(n, spawn, o = {}) {
      this.n = n; this.spawn = spawn; this.life = o.life || 6; this.trail = o.trail || 8;
      this.x = new Float64Array(n); this.y = new Float64Array(n); this.age = new Float64Array(n);
      this.hx = []; this.hy = [];
      for (let i = 0; i < n; i++) { this.reset(i, true); }
    }
    reset(i, init) {
      const [x, y] = this.spawn(i, init);
      this.x[i] = x; this.y[i] = y; this.age[i] = init ? Math.random() * this.life : 0;
      this.hx[i] = [x]; this.hy[i] = [y];
    }
    step(vel, dt, alive) {
      for (let i = 0; i < this.n; i++) {
        const x = this.x[i], y = this.y[i];
        const [u1, v1] = vel(x, y), [u2, v2] = vel(x + 0.5 * dt * u1, y + 0.5 * dt * v1);
        const nx = x + dt * u2, ny = y + dt * v2;
        this.age[i] += dt;
        if (!isFinite(nx) || !isFinite(ny) || (alive && !alive(nx, ny)) || this.age[i] > this.life) { this.reset(i); continue; }
        this.x[i] = nx; this.y[i] = ny;
        const hx = this.hx[i], hy = this.hy[i];
        hx.push(nx); hy.push(ny);
        if (hx.length > this.trail) { hx.shift(); hy.shift(); }
      }
    }
    draw(ctx, map, st = {}) {
      ctx.save();
      ctx.strokeStyle = C(st.color || '--ink'); ctx.fillStyle = C(st.color || '--ink');
      ctx.lineWidth = st.width || 1.3; ctx.lineCap = 'round';
      ctx.globalAlpha = st.alpha === undefined ? 0.75 : st.alpha;
      ctx.beginPath();
      for (let i = 0; i < this.n; i++) {
        const hx = this.hx[i], hy = this.hy[i];
        if (hx.length < 2) continue;
        let p = map(hx[0], hy[0]); ctx.moveTo(p[0], p[1]);
        for (let k = 1; k < hx.length; k++) { p = map(hx[k], hy[k]); ctx.lineTo(p[0], p[1]); }
      }
      ctx.stroke();
      if (st.dots !== false) {
        for (let i = 0; i < this.n; i++) { const p = map(this.x[i], this.y[i]); ctx.fillRect(p[0] - 1, p[1] - 1, 2, 2); }
      }
      ctx.restore();
    }
  }
  F.Tracers = Tracers;

  /* ---------- Campo de flechas ---------- */
  F.arrows = function (ctx, vel, xs, ys, map, scale, st = {}) {
    for (const x of xs) for (const y of ys) {
      const [u, v] = vel(x, y);
      if (!isFinite(u) || !isFinite(v)) continue;
      const p = map([x, y]), L = Math.hypot(u, v) * scale;
      if (L < 0.5) continue;
      const cl = Math.min(L, st.max || 40) / L;
      EM.draw.arrow(ctx, p[0], p[1], p[0] + u * scale * cl, p[1] - v * scale * cl, { color: st.color || '--ink-3', width: st.width || 1.1, head: st.head || 5, alpha: st.alpha });
    }
  };

  /* ---------- Agua, sólidos y recipientes ---------- */
  F.waterFill = function (ctx, pts, o = {}) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fillStyle = EM.alpha(o.color || '--water', o.alpha === undefined ? 0.32 : o.alpha);
    ctx.fill();
    ctx.restore();
  };
  F.waterRect = function (ctx, x, y, w, h, o = {}) {
    if (h <= 0 || w <= 0) return;
    ctx.save();
    ctx.fillStyle = EM.alpha(o.color || '--water', o.alpha === undefined ? 0.32 : o.alpha);
    ctx.fillRect(x, y, w, h);
    if (o.surface !== false) { ctx.strokeStyle = C(o.color || '--water'); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x, y + 0.5); ctx.lineTo(x + w, y + 0.5); ctx.stroke(); }
    ctx.restore();
  };
  /* recipiente abierto (paredes y fondo) */
  F.tank = function (ctx, x, y, w, h, o = {}) {
    ctx.save();
    ctx.strokeStyle = C(o.color || '--ink-2'); ctx.lineWidth = o.width || 2.2; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y); ctx.stroke();
    ctx.restore();
  };
  F.solidPoly = function (ctx, pts, o = {}) {
    ctx.save();
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fillStyle = C(o.fill || '--solid'); ctx.fill();
    ctx.strokeStyle = C(o.color || '--ink-2'); ctx.lineWidth = o.width || 1.2; ctx.stroke();
    ctx.restore();
  };
  /* Mapeo mundo → píxeles para una caja [x0,x1]×[y0,y1] dentro del rectángulo r, con aspecto 1:1 opcional */
  F.view = function (r, x0, x1, y0, y1, equal = true) {
    let sx = r.w / (x1 - x0), sy = r.h / (y1 - y0);
    let ox = r.x, oy = r.y;
    if (equal) { const s = Math.min(sx, sy); ox += (r.w - s * (x1 - x0)) / 2; oy += (r.h - s * (y1 - y0)) / 2; sx = sy = s; }
    const v = {
      sx, sy, x0, x1, y0, y1,
      X: (x) => ox + (x - x0) * sx, Y: (y) => oy + (y1 - y) * sy,
      inv: (px, py) => [x0 + (px - ox) / sx, y1 - (py - oy) / sy]
    };
    v.map = (p, q) => (Array.isArray(p) ? [v.X(p[0]), v.Y(p[1])] : [v.X(p), v.Y(q)]);
    return v;
  };
  /* Mapa de color de rapidez (secuencial desde el lienzo) y de vorticidad (divergente) */
  F.speedMap = (smax) => (s) => EM.cmap.viridis(Math.min(1, s / smax));
  F.vortMap = (wmax) => (w) => EM.cmap.diverging(w / wmax);
})();
