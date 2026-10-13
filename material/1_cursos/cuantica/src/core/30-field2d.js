/* ===================================================================
   30-field2d.js — Vista 2D en coordenadas del mundo, campos vectoriales,
   líneas de campo (RK4), curvas de nivel (marching squares) y mapas de calor
   =================================================================== */
(function () {
  'use strict';
  const CQ = window.CQ;
  const C = (c) => (c && c.startsWith && c.startsWith('--') ? CQ.col(c) : c);

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
        major = CQ.niceStep(this.x1 - this.x0, Math.max(2, w / 95));
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
          ctx.font = `10.5px ${CQ.FONT_MONO}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          const f = CQ.tickFmt(major);
          const yl = CQ.M.clamp(py + 4, 4, h - 16);
          for (let x = Math.ceil(this.x0 / major) * major; x <= this.x1; x += major) {
            if (Math.abs(x) < major * 1e-6) continue;
            ctx.fillText(f(x) + (o.unit ? '' : ''), this.X(x), yl);
          }
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          const xl = CQ.M.clamp(px + 5, 4, w - 30);
          for (let y = Math.ceil(this.y0 / major) * major; y <= this.y1; y += major) {
            if (Math.abs(y) < major * 1e-6) continue;
            ctx.fillText(f(y), xl, this.Y(y));
          }
          if (o.xlabel) CQ.text(ctx, o.xlabel, w - 8, CQ.M.clamp(py - 8, 14, h - 6), { size: 13, italic: true, family: CQ.FONT_MATH, color: '--ink-2', align: 'right' });
          if (o.ylabel) CQ.text(ctx, o.ylabel, CQ.M.clamp(px + 8, 8, w - 20), 16, { size: 13, italic: true, family: CQ.FONT_MATH, color: '--ink-2' });
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
      CQ.text(ctx, label, x + L / 2, y - 7, { size: 11, color: '--ink-2', align: 'center', mono: true, halo: true });
    }
  }
  CQ.View2D = View2D;

  /* ---------- Física 2D auxiliar (unidades arbitrarias, k = 1) ---------- */
  CQ.phys2 = {
    /* Cargas puntuales (campo 3D ∝ 1/r² evaluado en el plano) */
    E(charges, x, y) {
      let ex = 0, ey = 0;
      for (const c of charges) {
        const dx = x - c.x, dy = y - c.y, r2 = dx * dx + dy * dy;
        if (r2 < 1e-12) return [NaN, NaN];
        const r3 = r2 * Math.sqrt(r2);
        ex += (c.q * dx) / r3;
        ey += (c.q * dy) / r3;
      }
      return [ex, ey];
    },
    V(charges, x, y) {
      let v = 0;
      for (const c of charges) {
        const r = Math.hypot(x - c.x, y - c.y);
        v += c.q / Math.max(r, 1e-9);
      }
      return v;
    },
    /* Líneas de carga infinitas perpendiculares al plano (campo ∝ 1/r) */
    Eline(lines, x, y) {
      let ex = 0, ey = 0;
      for (const c of lines) {
        const dx = x - c.x, dy = y - c.y, r2 = dx * dx + dy * dy;
        if (r2 < 1e-12) return [NaN, NaN];
        ex += (c.q * dx) / r2;
        ey += (c.q * dy) / r2;
      }
      return [ex, ey];
    },
    Vline(lines, x, y) {
      let v = 0;
      for (const c of lines) v -= c.q * Math.log(Math.max(Math.hypot(x - c.x, y - c.y), 1e-9));
      return v;
    },
    /* Hilos rectilíneos infinitos con corriente I (+ saliendo del plano): B ∝ I φ̂ / r */
    B(wires, x, y) {
      let bx = 0, by = 0;
      for (const c of wires) {
        const dx = x - c.x, dy = y - c.y, r2 = dx * dx + dy * dy;
        if (r2 < 1e-12) return [NaN, NaN];
        bx += (-c.I * dy) / r2;
        by += (c.I * dx) / r2;
      }
      return [bx, by];
    }
  };

  /* ---------- Integración de líneas de campo ---------- */
  const F = (CQ.field = {});
  /* Integra una línea de campo con RK4 en longitud de arco.
     o: {ds, maxSteps, bounds:[x0,x1,y0,y1], stop(x,y)→valor verdadero para detener} */
  F.trace = function (fn, x0, y0, dir, o = {}) {
    const ds = o.ds || 0.02, maxSteps = o.maxSteps || 2000;
    const b = o.bounds;
    const pts = [[x0, y0]];
    let x = x0, y = y0, end = null;
    const f = (px, py) => {
      const v = fn(px, py);
      const m = Math.hypot(v[0], v[1]);
      if (!(m > 0) || !isFinite(m)) return null;
      return [(dir * v[0]) / m, (dir * v[1]) / m];
    };
    let prevDx = 0, prevDy = 0;
    for (let i = 0; i < maxSteps; i++) {
      const k1 = f(x, y); if (!k1) { end = 'null'; break; }
      const k2 = f(x + 0.5 * ds * k1[0], y + 0.5 * ds * k1[1]); if (!k2) { end = 'null'; break; }
      const k3 = f(x + 0.5 * ds * k2[0], y + 0.5 * ds * k2[1]); if (!k3) { end = 'null'; break; }
      const k4 = f(x + ds * k3[0], y + ds * k3[1]); if (!k4) { end = 'null'; break; }
      const dx = (ds / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
      const dy = (ds / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
      /* Punto de silla / nulo: la dirección se invierte bruscamente */
      if (i > 2 && dx * prevDx + dy * prevDy < -0.5 * ds * ds) { end = 'null'; break; }
      prevDx = dx; prevDy = dy;
      x += dx; y += dy;
      pts.push([x, y]);
      if (b && (x < b[0] || x > b[1] || y < b[2] || y > b[3])) { end = 'out'; break; }
      if (o.stop) { const s = o.stop(x, y); if (s !== null && s !== undefined && s !== false) { end = s; break; } }
      if (o.closeTo && i > 20 && Math.hypot(x - x0, y - y0) < ds * 0.9) { end = 'closed'; pts.push([x0, y0]); break; }
    }
    return { pts, end, dir };
  };

  /* Dibuja una línea trazada (en coords. mundo) con puntas de flecha */
  F.drawLine = function (view, line, o = {}) {
    const ctx = view.cv.ctx;
    const pts = line.pts;
    if (pts.length < 2) return;
    ctx.save();
    ctx.strokeStyle = C(o.color || '--fline');
    ctx.lineWidth = o.width || 1.3;
    ctx.globalAlpha = o.alpha === undefined ? 0.9 : o.alpha;
    ctx.lineJoin = 'round';
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.beginPath();
    ctx.moveTo(view.X(pts[0][0]), view.Y(pts[0][1]));
    for (let i = 1; i < pts.length; i++) ctx.lineTo(view.X(pts[i][0]), view.Y(pts[i][1]));
    ctx.stroke();
    ctx.setLineDash([]);
    if (o.arrows !== false) {
      /* Longitud acumulada en píxeles */
      const gap = o.arrowGap || 120, first = o.arrowFirst || 48;
      let acc = 0, next = first;
      const total = (() => { let t = 0; for (let i = 1; i < pts.length; i++) t += Math.hypot(view.X(pts[i][0]) - view.X(pts[i - 1][0]), view.Y(pts[i][1]) - view.Y(pts[i - 1][1])); return t; })();
      if (total < first * 2) next = total / 2;
      const hs = o.head || 5.5;
      ctx.fillStyle = C(o.color || '--fline');
      for (let i = 1; i < pts.length; i++) {
        const ax = view.X(pts[i - 1][0]), ay = view.Y(pts[i - 1][1]);
        const bx = view.X(pts[i][0]), by = view.Y(pts[i][1]);
        const seg = Math.hypot(bx - ax, by - ay);
        while (acc + seg >= next && seg > 0) {
          const t = (next - acc) / seg;
          const px = ax + (bx - ax) * t, py = ay + (by - ay) * t;
          let ux = (bx - ax) / seg, uy = (by - ay) / seg;
          if (line.dir < 0) { ux = -ux; uy = -uy; }
          if (!(total - next < 25 && line.end !== 'out' && line.end !== 'closed')) {
            ctx.beginPath();
            ctx.moveTo(px + ux * hs, py + uy * hs);
            ctx.lineTo(px - ux * hs - uy * hs * 0.75, py - uy * hs + ux * hs * 0.75);
            ctx.lineTo(px - ux * hs * 0.4, py - uy * hs * 0.4);
            ctx.lineTo(px - ux * hs + uy * hs * 0.75, py - uy * hs - ux * hs * 0.75);
            ctx.closePath();
            ctx.fill();
          }
          next += gap;
        }
        acc += seg;
      }
    }
    ctx.restore();
  };

  /* Líneas de campo de cargas puntuales con densidad proporcional a |q|.
     charges: [{x,y,q}], fn: campo; o: {perUnit, r0, bounds, ds} */
  F.chargeLines = function (view, charges, fn, o = {}) {
    const perUnit = o.perUnit || 12;
    const r0 = o.r0 || 0.06;
    const ext = o.ext || 0.6;
    const W = view.x1 - view.x0, H = view.y1 - view.y0;
    const bounds = o.bounds || [view.x0 - ext * W, view.x1 + ext * W, view.y0 - ext * H, view.y1 + ext * H];
    const ds = o.ds || Math.min(W, H) / 260;
    const maxSteps = o.maxSteps || 3000;
    const hitR = o.hitR || r0 * 0.9;
    const stop = (x, y) => {
      for (let i = 0; i < charges.length; i++) {
        const c = charges[i];
        if (Math.hypot(x - c.x, y - c.y) < hitR) return { i, ang: Math.atan2(y - c.y, x - c.x) };
      }
      return null;
    };
    const lines = [];
    const arrivals = charges.map(() => []);
    const nOf = (q) => Math.max(o.minLines || 4, Math.round(Math.abs(q) * perUnit));
    const pos = charges.map((c, i) => [c, i]).filter(([c]) => c.q > 0);
    const neg = charges.map((c, i) => [c, i]).filter(([c]) => c.q < 0);
    for (const [c, idx] of pos) {
      const n = nOf(c.q);
      const off = (c.phase || 0) + Math.PI / n * 0.5;
      for (let k = 0; k < n; k++) {
        const a = off + (2 * Math.PI * k) / n;
        const L = F.trace(fn, c.x + r0 * Math.cos(a), c.y + r0 * Math.sin(a), +1, { ds, maxSteps, bounds, stop: (x, y) => { const s = stop(x, y); return s && s.i !== idx ? s : null; } });
        if (L.end && typeof L.end === 'object') arrivals[L.end.i].push(L.end.ang);
        lines.push(L);
      }
    }
    for (const [c, idx] of neg) {
      const n = nOf(c.q);
      const off = (c.phase || 0) + Math.PI / n * 0.5;
      let cand = [];
      for (let k = 0; k < n; k++) cand.push(off + (2 * Math.PI * k) / n);
      for (const a of arrivals[idx]) {
        if (!cand.length) break;
        let best = 0, bd = 1e9;
        cand.forEach((b, j) => { let d = Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))); if (d < bd) { bd = d; best = j; } });
        cand.splice(best, 1);
      }
      for (const a of cand) {
        const L = F.trace(fn, c.x + r0 * Math.cos(a), c.y + r0 * Math.sin(a), -1, { ds, maxSteps, bounds, stop: (x, y) => { const s = stop(x, y); return s && s.i !== idx ? s : null; } });
        lines.push(L);
      }
    }
    return lines;
  };

  /* Flechas en cuadrícula. o: {spacing(px), mode:'dir'|'len', color, scale, maxLen, skip(x,y), cmap} */
  F.arrows = function (view, fn, o = {}) {
    const ctx = view.cv.ctx, w = view.cv.w, h = view.cv.h;
    const sp = o.spacing || 30;
    const nx = Math.floor(w / sp), ny = Math.floor(h / sp);
    const ox = (w - (nx - 1) * sp) / 2, oy = (h - (ny - 1) * sp) / 2;
    const samples = [];
    let mmax = 0;
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const px = ox + i * sp, py = oy + j * sp;
      const x = view.wx(px), y = view.wy(py);
      if (o.skip && o.skip(x, y)) continue;
      const v = fn(x, y);
      const m = Math.hypot(v[0], v[1]);
      if (!isFinite(m)) continue;
      samples.push([px, py, v[0], v[1], m]);
      if (m > mmax) mmax = m;
    }
    const ref = o.ref || mmax;
    const maxLen = o.maxLen || sp * 0.86;
    for (const [px, py, vx, vy, m] of samples) {
      if (m < 1e-14 * (ref || 1)) continue;
      let L, alpha = 1, col = o.color || '--efield';
      const t = ref > 0 ? m / ref : 0;
      if (o.mode === 'len') { L = Math.min(maxLen, maxLen * t * (o.gain || 1)); if (L < 2) continue; }
      else {
        L = maxLen * 0.82;
        /* Opacidad logarítmica según magnitud relativa */
        const lt = ref > 0 ? Math.log10(m / ref) : 0;
        alpha = CQ.M.clamp(1 + lt / (o.decades || 2.5), 0.12, 1);
      }
      if (o.cmap) { const c = o.cmap(CQ.M.clamp(o.mode === 'len' ? t : alpha, 0, 1)); col = CQ.rgbStr(c); alpha = 1; }
      const ux = vx / m, uy = -vy / m;
      const x1 = px - (ux * L) / 2, y1 = py - (uy * L) / 2, x2 = px + (ux * L) / 2, y2 = py + (uy * L) / 2;
      CQ.draw.arrow(ctx, x1, y1, x2, y2, { color: col, width: o.width || 1.4, head: o.head || Math.min(7, 3 + L * 0.22), alpha });
    }
    return { mmax };
  };

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
      ctx.fillStyle = CQ.rgbStr(c);
      ctx.fillRect(x, y + i, w, 1.5);
    }
    ctx.strokeStyle = CQ.col('--rule-strong');
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w, h);
    const f = o.fmt || ((v) => CQ.sci(v, 2));
    CQ.text(ctx, f(vmax), x + w + 4, y + 6, { size: 10.5, mono: true, color: '--ink-2', halo: true });
    CQ.text(ctx, f(vmin), x + w + 4, y + h, { size: 10.5, mono: true, color: '--ink-2', halo: true });
    if (o.mid !== undefined) CQ.text(ctx, f(o.mid), x + w + 4, y + h / 2 + 4, { size: 10.5, mono: true, color: '--ink-2', halo: true });
    if (o.label) CQ.text(ctx, o.label, x, y - 6, { size: 11, color: '--ink-2', halo: true });
  };
})();
