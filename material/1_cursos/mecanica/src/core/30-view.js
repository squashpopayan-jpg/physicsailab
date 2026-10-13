/* ===================================================================
   30-view.js — Vista mundo↔píxeles y primitivas de dibujo mecánico:
   vectores rotulados, suelo rayado, bloques, esferas, resortes,
   poleas, cuerdas, autos, personas, cotas, ángulos, diagramas de
   cuerpo libre (DCL) y barras de energía.
   =================================================================== */
(function () {
  'use strict';
  const MC = window.MC;
  const M = MC.M;
  const C = (c) => MC.col(c);

  /* ---------- Vista 2D: coordenadas del mundo (m) → píxeles ---------- */
  class View2D {
    constructor(cv, o = {}) {
      this.cv = cv;
      this.o = Object.assign({ xmin: -5, xmax: 5, ymin: -3, ymax: 3, pad: 0, align: 'center' }, o);
      this.update();
    }
    setRange(r) { Object.assign(this.o, r); this.update(); return this; }
    update() {
      const o = this.o, w = this.cv.w || 1, h = this.cv.h || 1;
      const pl = o.padL !== undefined ? o.padL : o.pad, pr = o.padR !== undefined ? o.padR : o.pad;
      const pt = o.padT !== undefined ? o.padT : o.pad, pb = o.padB !== undefined ? o.padB : o.pad;
      const sx = (w - pl - pr) / (o.xmax - o.xmin), sy = (h - pt - pb) / (o.ymax - o.ymin);
      this.s = Math.min(sx, sy);
      this.xc = (o.xmin + o.xmax) / 2;
      this.yc = (o.ymin + o.ymax) / 2;
      this.cx = pl + (w - pl - pr) / 2;
      this.cy = pt + (h - pt - pb) / 2;
      /* Alineación: 'bottom' pega ymin al borde inferior; 'left' pega xmin a la izquierda */
      if (o.align.includes('bottom')) this.cy = h - pb - (this.yc - o.ymin) * this.s;
      if (o.align.includes('top')) this.cy = pt + (o.ymax - this.yc) * this.s;
      if (o.align.includes('left')) this.cx = pl + (this.xc - o.xmin) * this.s;
      if (o.align.includes('right')) this.cx = w - pr - (o.xmax - this.xc) * this.s;
      this.x0 = this.wx(0); this.x1 = this.wx(w);
      this.y0 = this.wy(h); this.y1 = this.wy(0);
      return this;
    }
    X(x) { return this.cx + (x - this.xc) * this.s; }
    Y(y) { return this.cy - (y - this.yc) * this.s; }
    P(p) { return [this.X(p[0]), this.Y(p[1])]; }
    wx(px) { return this.xc + (px - this.cx) / this.s; }
    wy(py) { return this.yc - (py - this.cy) / this.s; }
    L(len) { return len * this.s; }
    /* Papel milimetrado con números en metros */
    grid(o = {}) {
      const ctx = this.cv.ctx, w = this.cv.w, h = this.cv.h;
      let major = o.major, minor = o.minor;
      if (!major) {
        major = MC.niceStep(this.x1 - this.x0, Math.max(2, w / 90));
        const lead = Math.round(major / Math.pow(10, Math.floor(Math.log10(major) + 1e-9)));
        minor = minor || (lead === 2 ? major / 4 : major / 5);
      } else if (!minor) minor = major / 5;
      ctx.save();
      ctx.lineWidth = 1;
      const lines = (step, col, alpha) => {
        if (step * this.s < 4) return;
        ctx.strokeStyle = C(col);
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        for (let x = Math.ceil(this.x0 / step) * step; x <= this.x1; x += step) { const px = Math.round(this.X(x)) + 0.5; ctx.moveTo(px, 0); ctx.lineTo(px, h); }
        for (let y = Math.ceil(this.y0 / step) * step; y <= this.y1; y += step) { const py = Math.round(this.Y(y)) + 0.5; ctx.moveTo(0, py); ctx.lineTo(w, py); }
        ctx.stroke();
      };
      if (o.minorLines !== false) lines(minor, '--grid', 0.8);
      lines(major, '--grid-2', 0.9);
      ctx.globalAlpha = 1;
      if (o.axes) {
        ctx.strokeStyle = C('--axis');
        ctx.globalAlpha = 0.6;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        const px = Math.round(this.X(0)) + 0.5, py = Math.round(this.Y(0)) + 0.5;
        if (px > 0 && px < w) { ctx.moveTo(px, 0); ctx.lineTo(px, h); }
        if (py > 0 && py < h) { ctx.moveTo(0, py); ctx.lineTo(w, py); }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (o.labels) {
        ctx.fillStyle = C('--ink-3');
        ctx.font = `10px ${MC.FONT_MONO}`;
        const f = MC.tickFmt(major);
        const py = o.axes ? M.clamp(Math.round(this.Y(0)) + 4, 4, h - 14) : h - 13;
        const px = o.axes ? M.clamp(Math.round(this.X(0)) + 4, 4, w - 34) : 4;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        if (o.labels !== 'y') for (let x = Math.ceil(this.x0 / major) * major; x <= this.x1; x += major) {
          if (o.axes && Math.abs(x) < major * 1e-6) continue;
          const X = this.X(x);
          if (X < 12 || X > w - 12) continue;
          ctx.fillText(f(x), X, py);
        }
        ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        if (o.labels !== 'x') for (let y = Math.ceil(this.y0 / major) * major; y <= this.y1; y += major) {
          if (Math.abs(y) < major * 1e-6 && o.axes) continue;
          const Y = this.Y(y);
          if (Y < 10 || Y > h - 16) continue;
          ctx.fillText(f(y), px, Y);
        }
        if (o.unit) MC.text(ctx, o.unit, w - 6, py + 11, { size: 10, mono: true, color: '--ink-3', align: 'right', baseline: 'top' });
      }
      ctx.restore();
      return { minor, major };
    }
    /* Barra de escala */
    scaleBar(len, label, o = {}) {
      const ctx = this.cv.ctx;
      const L = len * this.s;
      const x = o.x !== undefined ? o.x : this.cv.w - L - 16, y = o.y !== undefined ? o.y : this.cv.h - 12;
      ctx.save();
      ctx.strokeStyle = C('--ink-2');
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y - 4); ctx.lineTo(x, y); ctx.lineTo(x + L, y); ctx.lineTo(x + L, y - 4);
      ctx.stroke();
      ctx.restore();
      MC.text(ctx, label, x + L / 2, y - 7, { size: 10.5, color: '--ink-2', align: 'center', mono: true, halo: true });
    }
  }
  MC.View2D = View2D;

  /* ---------- Primitivas ---------- */
  const D = (MC.draw = {});
  D.clear = function (cv, color) {
    const ctx = cv.ctx;
    ctx.save();
    ctx.setTransform(cv.dpr, 0, 0, cv.dpr, 0, 0);
    ctx.fillStyle = C(color || '--canvas');
    ctx.fillRect(0, 0, cv.w, cv.h);
    ctx.restore();
  };
  /* Flecha de (x1,y1) a (x2,y2) en píxeles */
  D.arrow = function (ctx, x1, y1, x2, y2, o = {}) {
    const col = C(o.color || '--ink');
    const lw = o.width || 1.6;
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    if (L < 0.5) return;
    const hl = Math.min(o.head || 5 + lw * 2.6, L * 0.6), hw = hl * (o.headW || 0.5);
    const ux = dx / L, uy = dy / L;
    ctx.save();
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    if (o.halo) {
      ctx.save();
      ctx.strokeStyle = C('--canvas');
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = lw + 3;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2 - ux * hl * 0.8, y2 - uy * hl * 0.8);
      ctx.stroke();
      ctx.restore();
    }
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
  /* Vector rotulado desde (x,y) con componentes (dx,dy) en píxeles (y hacia abajo).
     o = {color, width, label, sub, vec(true), dash, labelSide, size, minLen} */
  D.vec = function (ctx, x, y, dx, dy, o = {}) {
    const L = Math.hypot(dx, dy);
    if (L < (o.minLen || 1.5)) return;
    D.arrow(ctx, x, y, x + dx, y + dy, { color: o.color, width: o.width || 2.4, dash: o.dash, alpha: o.alpha, halo: o.halo !== false, head: o.head });
    if (o.label) {
      const ux = dx / L, uy = dy / L;
      const size = o.size || 14;
      /* rótulo junto a la punta, desplazado hacia un lado de la flecha */
      const side = o.labelSide || 1;
      const off = o.labelOff || 12;
      let lx = x + dx + ux * 7 - uy * off * side * 0.6, ly = y + dy + uy * 7 + ux * off * side * 0.6;
      if (o.labelAt === 'mid') { lx = x + dx * 0.55 - uy * off * side; ly = y + dy * 0.55 + ux * off * side; }
      const w = MC.textWidth(ctx, o.label, { size, math: o.math !== false });
      lx -= w / 2 * (1 - ux);
      ly += size * 0.35 * (1 + uy);
      /* flecha de vector sólo en símbolos simples (no en expresiones como "mg sen θ" o "v²/r") */
      const simple = !/[\s=/²³·]/.test(o.label);
      MC.text(ctx, o.label, lx, ly, { size, math: o.math !== false, color: o.color, halo: true, vec: o.vec === undefined ? simple : o.vec, weight: 500 });
    }
  };
  D.poly = function (ctx, pts, o = {}) {
    if (pts.length < 2) return;
    ctx.save();
    ctx.strokeStyle = C(o.color || '--ink');
    ctx.lineWidth = o.width || 1.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (o.dash) ctx.setLineDash(o.dash);
    if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    if (o.close) ctx.closePath();
    if (o.fill) { ctx.fillStyle = C(o.fill); if (o.fillAlpha !== undefined) ctx.globalAlpha = o.fillAlpha; ctx.fill(); if (o.alpha !== undefined) ctx.globalAlpha = o.alpha; else ctx.globalAlpha = 1; }
    if (o.color !== 'none') ctx.stroke();
    ctx.restore();
  };
  D.line = function (ctx, x1, y1, x2, y2, o = {}) { D.poly(ctx, [[x1, y1], [x2, y2]], o); };
  D.circle = function (ctx, x, y, r, o = {}) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.1, r), 0, 2 * Math.PI);
    if (o.fill) { ctx.fillStyle = C(o.fill); ctx.globalAlpha = o.fillAlpha === undefined ? 1 : o.fillAlpha; ctx.fill(); ctx.globalAlpha = 1; }
    if (o.color !== 'none' && (o.color || !o.fill)) {
      ctx.strokeStyle = C(o.color || '--ink');
      ctx.lineWidth = o.width || 1.5;
      if (o.dash) ctx.setLineDash(o.dash);
      if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
      ctx.stroke();
    }
    ctx.restore();
  };
  /* Resorte helicoidal visto de lado entre dos puntos */
  D.spring = function (ctx, x1, y1, x2, y2, o = {}) {
    const n = o.n || 10, amp = o.amp || 8;
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    if (L < 1) return;
    const ux = dx / L, uy = dy / L, px = -uy, py = ux;
    const lead = o.lead === undefined ? Math.min(12, L * 0.12) : o.lead;
    ctx.save();
    ctx.strokeStyle = C(o.color || '--ink-2');
    ctx.lineWidth = o.width || 1.8;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + ux * lead, y1 + uy * lead);
    const body = L - 2 * lead;
    const seg = body / (2 * n);
    for (let i = 0; i < 2 * n; i++) {
      const s = lead + seg * (i + 0.5), sg = i % 2 ? -1 : 1;
      ctx.lineTo(x1 + ux * s + px * amp * sg, y1 + uy * s + py * amp * sg);
    }
    ctx.lineTo(x1 + ux * (L - lead), y1 + uy * (L - lead));
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  };
  D.zigzag = D.spring;
  /* Suelo (línea con rayado inferior) entre x1 y x2 a la altura y (px) */
  D.ground = function (ctx, x1, y, x2, o = {}) {
    ctx.save();
    if (o.fill !== false) {
      ctx.fillStyle = C(o.fill || '--ground-fill');
      ctx.fillRect(x1, y, x2 - x1, o.depth || 14);
    }
    ctx.strokeStyle = C(o.color || '--ink-2');
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x1, y + 0.5);
    ctx.lineTo(x2, y + 0.5);
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    const d = o.depth || 10;
    for (let x = x1 + 4; x < x2; x += o.step || 9) { ctx.moveTo(x, y + 1); ctx.lineTo(x - d * 0.8, y + d); }
    ctx.stroke();
    ctx.restore();
  };
  /* Pared vertical con rayado: lado 'left' (rayado a la izquierda) o 'right' */
  D.wall = function (ctx, x, y1, y2, side = 'left', o = {}) {
    const s = side === 'left' ? -1 : 1;
    ctx.save();
    ctx.fillStyle = C(o.fill || '--ground-fill');
    ctx.fillRect(side === 'left' ? x - 12 : x, Math.min(y1, y2), 12, Math.abs(y2 - y1));
    ctx.strokeStyle = C('--ink-2');
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x + 0.5, y1); ctx.lineTo(x + 0.5, y2); ctx.stroke();
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    for (let y = Math.min(y1, y2) + 4; y < Math.max(y1, y2); y += 9) { ctx.moveTo(x, y); ctx.lineTo(x + s * 9, y + 8); }
    ctx.stroke();
    ctx.restore();
  };
  /* Techo/soporte horizontal con rayado superior */
  D.ceiling = function (ctx, x1, y, x2) {
    ctx.save();
    ctx.fillStyle = C('--ground-fill');
    ctx.fillRect(x1, y - 10, x2 - x1, 10);
    ctx.strokeStyle = C('--ink-2');
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x1, y - 0.5); ctx.lineTo(x2, y - 0.5); ctx.stroke();
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    for (let x = x1 + 4; x < x2; x += 9) { ctx.moveTo(x, y - 1); ctx.lineTo(x + 8, y - 10); }
    ctx.stroke();
    ctx.restore();
  };
  /* Bloque centrado en (x,y) px, ancho w, alto h, girado 'ang' (rad, antihorario en pantalla) */
  D.block = function (ctx, x, y, w, h, o = {}) {
    ctx.save();
    ctx.translate(x, y);
    if (o.ang) ctx.rotate(-o.ang);
    const r = o.r === undefined ? Math.min(4, w * 0.12, h * 0.12) : o.r;
    const fill = C(o.fill || '--body-a');
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(-w / 2, -h / 2, w, h, r); else ctx.rect(-w / 2, -h / 2, w, h);
    const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    g.addColorStop(0, MC.shade(fill, 1.12));
    g.addColorStop(1, MC.shade(fill, 0.9));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = o.sel ? 2.5 : 1.3;
    ctx.strokeStyle = o.sel ? C('--accent') : MC.shade(fill, 0.55);
    ctx.stroke();
    if (o.label) {
      ctx.rotate(o.upright && o.ang ? o.ang : 0);
      MC.text(ctx, o.label, 0, 0, { size: o.size || Math.min(15, h * 0.42), align: 'center', baseline: 'middle', color: o.labelColor || '--body-ink', weight: 600, math: o.math });
    }
    ctx.restore();
  };
  /* Esfera sombreada; o.mark dibuja una marca para ver la rotación (ángulo o.ang) */
  D.ball = function (ctx, x, y, r, o = {}) {
    if (r <= 0) return;
    const fill = C(o.fill || '--body-b');
    ctx.save();
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
    g.addColorStop(0, MC.shade(fill, 1.35));
    g.addColorStop(0.6, fill);
    g.addColorStop(1, MC.shade(fill, 0.7));
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = g;
    ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    ctx.fill();
    ctx.lineWidth = o.sel ? 2.5 : 1;
    ctx.strokeStyle = o.sel ? C('--accent') : MC.shade(fill, 0.5);
    ctx.stroke();
    if (o.mark !== undefined && o.mark !== false) {
      const a = typeof o.mark === 'number' ? o.mark : 0;
      ctx.strokeStyle = MC.shade(fill, 0.45);
      ctx.lineWidth = Math.max(1.2, r * 0.12);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + r * 0.85 * Math.cos(a), y - r * 0.85 * Math.sin(a));
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + r * 0.62 * Math.cos(a), y - r * 0.62 * Math.sin(a), Math.max(1.6, r * 0.13), 0, 2 * Math.PI);
      ctx.fillStyle = MC.shade(fill, 0.45);
      ctx.fill();
    }
    if (o.label) MC.text(ctx, o.label, x, y, { size: o.size || Math.max(10, Math.min(14, r * 0.8)), align: 'center', baseline: 'middle', color: '--body-ink', weight: 600 });
    ctx.restore();
  };
  /* Polea: disco con radios; 'ang' gira los radios */
  D.pulley = function (ctx, x, y, r, o = {}) {
    ctx.save();
    const fill = C(o.fill || '--metal');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, MC.shade(fill, 1.25));
    g.addColorStop(1, MC.shade(fill, 0.8));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = MC.shade(fill, 0.5);
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.8, 0, 2 * Math.PI);
    ctx.stroke();
    const a = o.ang || 0;
    ctx.beginPath();
    for (let k = 0; k < 3; k++) {
      const t = a + (k * 2 * Math.PI) / 3;
      ctx.moveTo(x + r * 0.18 * Math.cos(t), y - r * 0.18 * Math.sin(t));
      ctx.lineTo(x + r * 0.8 * Math.cos(t), y - r * 0.8 * Math.sin(t));
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, Math.max(2, r * 0.15), 0, 2 * Math.PI);
    ctx.fillStyle = MC.shade(fill, 0.5);
    ctx.fill();
    ctx.restore();
  };
  D.rope = function (ctx, pts, o = {}) { D.poly(ctx, pts, { color: o.color || '--rope', width: o.width || 2 }); };
  /* Auto visto de lado: (x, y) = punto medio en el suelo; len = largo en px; dir = +1 derecha */
  D.car = function (ctx, x, y, len, o = {}) {
    const dir = o.dir || 1;
    const col = C(o.color || '--body-c');
    const h = len * 0.34, wr = len * 0.11;
    ctx.save();
    ctx.translate(x, y);
    if (o.ang) ctx.rotate(-o.ang);
    ctx.scale(dir, 1);
    /* carrocería */
    ctx.beginPath();
    ctx.moveTo(-len / 2, -wr * 0.9);
    ctx.lineTo(-len / 2, -h * 0.62);
    ctx.quadraticCurveTo(-len / 2 + len * 0.02, -h * 0.72, -len * 0.3, -h * 0.72);
    ctx.lineTo(-len * 0.2, -h * 1.12);
    ctx.lineTo(len * 0.14, -h * 1.12);
    ctx.lineTo(len * 0.3, -h * 0.72);
    ctx.lineTo(len * 0.44, -h * 0.66);
    ctx.quadraticCurveTo(len / 2, -h * 0.6, len / 2, -h * 0.4);
    ctx.lineTo(len / 2, -wr * 0.9);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, -h * 1.1, 0, 0);
    g.addColorStop(0, MC.shade(col, 1.15));
    g.addColorStop(1, MC.shade(col, 0.85));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = MC.shade(col, 0.55);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    /* ventanas */
    ctx.beginPath();
    ctx.moveTo(-len * 0.17, -h * 1.04);
    ctx.lineTo(-len * 0.26, -h * 0.76);
    ctx.lineTo(-len * 0.04, -h * 0.76);
    ctx.lineTo(-len * 0.04, -h * 1.04);
    ctx.closePath();
    ctx.moveTo(len * 0.0, -h * 1.04);
    ctx.lineTo(len * 0.0, -h * 0.76);
    ctx.lineTo(len * 0.25, -h * 0.76);
    ctx.lineTo(len * 0.12, -h * 1.04);
    ctx.closePath();
    ctx.fillStyle = C('--glass');
    ctx.fill();
    /* ruedas */
    for (const wx of [-len * 0.3, len * 0.3]) {
      ctx.beginPath();
      ctx.arc(wx, -wr, wr, 0, 2 * Math.PI);
      ctx.fillStyle = C('--tire');
      ctx.fill();
      ctx.beginPath();
      ctx.arc(wx, -wr, wr * 0.5, 0, 2 * Math.PI);
      ctx.fillStyle = C('--metal');
      ctx.fill();
      if (o.wheel !== undefined) {
        ctx.strokeStyle = C('--tire');
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let k = 0; k < 2; k++) {
          const t = -o.wheel * dir + (k * Math.PI) / 2;
          ctx.moveTo(wx - wr * 0.5 * Math.cos(t), -wr - wr * 0.5 * Math.sin(t));
          ctx.lineTo(wx + wr * 0.5 * Math.cos(t), -wr + wr * 0.5 * Math.sin(t));
        }
        ctx.stroke();
      }
    }
    if (o.label) { ctx.scale(dir, 1); MC.text(ctx, o.label, 0, -h * 0.4, { size: 12, align: 'center', baseline: 'middle', color: '--body-ink', weight: 600 }); }
    ctx.restore();
  };
  /* Persona esquemática de pie: (x,y) = pies; h = estatura en px */
  D.person = function (ctx, x, y, h, o = {}) {
    const col = C(o.color || '--ink');
    ctx.save();
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = Math.max(1.8, h * 0.05);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const hr = h * 0.085;
    const neck = y - h + 2 * hr, hip = y - h * 0.48;
    ctx.beginPath();
    ctx.arc(x, y - h + hr, hr, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, neck);
    ctx.lineTo(x, hip);
    const legSpread = o.squat ? h * 0.16 : h * 0.1;
    ctx.moveTo(x, hip);
    ctx.lineTo(x - legSpread, y);
    ctx.moveTo(x, hip);
    ctx.lineTo(x + legSpread, y);
    const sh = neck + h * 0.06;
    const arms = o.arms === undefined ? 0.35 : o.arms; /* 0: abajo, 1: horizontal */
    const al = h * 0.33;
    const a = -Math.PI / 2 + arms * (Math.PI / 2);
    ctx.moveTo(x, sh);
    ctx.lineTo(x + al * Math.cos(a), sh - al * Math.sin(a));
    ctx.moveTo(x, sh);
    ctx.lineTo(x - al * Math.cos(a), sh - al * Math.sin(a));
    ctx.stroke();
    ctx.restore();
  };
  /* Arco de ángulo en (cx,cy) px entre ángulos matemáticos a0→a1 (rad, antihorario) */
  D.angle = function (ctx, cx, cy, r, a0, a1, o = {}) {
    ctx.save();
    ctx.strokeStyle = C(o.color || '--ink-2');
    ctx.lineWidth = o.width || 1.3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -a0, -a1, a1 > a0);
    ctx.stroke();
    ctx.restore();
    if (o.label) {
      const am = (a0 + a1) / 2, rr = r + (o.labelR || 10);
      MC.text(ctx, o.label, cx + rr * Math.cos(am), cy - rr * Math.sin(am), { size: o.size || 13, align: 'center', baseline: 'middle', math: o.math !== false, color: o.color || '--ink-2', halo: true });
    }
  };
  /* Cota de dimensión entre dos puntos, desplazada 'off' px (dibujo técnico) */
  D.dim = function (ctx, x1, y1, x2, y2, label, o = {}) {
    const off = o.off || 0;
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    if (L < 4) return;
    const ux = dx / L, uy = dy / L, px = -uy * off, py = ux * off;
    const col = o.color || '--ink-3';
    ctx.save();
    ctx.strokeStyle = C(col);
    ctx.lineWidth = 1;
    if (off) {
      ctx.globalAlpha = 0.6;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(x1, y1); ctx.lineTo(x1 + px * 1.15, y1 + py * 1.15);
      ctx.moveTo(x2, y2); ctx.lineTo(x2 + px * 1.15, y2 + py * 1.15);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
    const ax = x1 + px, ay = y1 + py, bx = x2 + px, by = y2 + py;
    D.arrow(ctx, (ax + bx) / 2, (ay + by) / 2, ax, ay, { color: col, width: 1, head: 6, headW: 0.45 });
    D.arrow(ctx, (ax + bx) / 2, (ay + by) / 2, bx, by, { color: col, width: 1, head: 6, headW: 0.45 });
    if (label) {
      const mx = (ax + bx) / 2, my = (ay + by) / 2;
      const lo = o.labelOff === undefined ? 10 : o.labelOff;
      const s = off >= 0 ? 1 : -1;
      MC.text(ctx, label, mx - uy * lo * s + (o.dx || 0), my + ux * lo * s + (o.dy || 0), { size: o.size || 12, align: 'center', baseline: 'middle', color: o.labelColor || '--ink-2', halo: true, math: o.math, mono: !o.math });
    }
  };
  /* Rótulo con halo */
  D.label = function (ctx, text, x, y, o = {}) { return MC.text(ctx, text, x, y, Object.assign({ size: 12, halo: true, color: '--ink-2' }, o)); };
  /* Recuadro-panel sobre el lienzo */
  D.panel = function (ctx, x, y, w, h, o = {}) {
    ctx.save();
    ctx.fillStyle = MC.alpha('--surface', o.alpha === undefined ? 0.92 : o.alpha);
    ctx.strokeStyle = C('--rule-strong');
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(Math.round(x) + 0.5, Math.round(y) + 0.5, w, h, 4); else ctx.rect(Math.round(x) + 0.5, Math.round(y) + 0.5, w, h);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    if (o.title) MC.text(ctx, o.title, x + 8, y + 15, { size: 10.5, weight: 700, color: '--ink-3' });
  };
  /* Diagrama de cuerpo libre en un recuadro.
     forces: [{fx, fy (en N, y hacia arriba), color, label}]; o = {x,y,w,h,title,shape:'dot'|'block', ang, scale, maxLen} */
  D.fbd = function (ctx, forces, o = {}) {
    const x = o.x, y = o.y, w = o.w || 160, h = o.h || 160;
    D.panel(ctx, x, y, w, h, { title: o.title === undefined ? 'DIAGRAMA DE CUERPO LIBRE' : o.title });
    const cx = x + w / 2 + (o.cdx || 0), cy = y + h / 2 + 8 + (o.cdy || 0);
    let maxF = 0;
    for (const f of forces) maxF = Math.max(maxF, Math.hypot(f.fx, f.fy));
    const maxLen = o.maxLen || Math.min(w, h) * 0.34;
    const sc = o.scale || (maxF > 0 ? maxLen / maxF : 1);
    if (o.axes) {
      const ang = o.axesAng || 0;
      ctx.save();
      ctx.strokeStyle = C('--ink-3');
      ctx.globalAlpha = 0.5;
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;
      const R = Math.min(w, h) * 0.42;
      ctx.beginPath();
      ctx.moveTo(cx - R * Math.cos(ang), cy + R * Math.sin(ang)); ctx.lineTo(cx + R * Math.cos(ang), cy - R * Math.sin(ang));
      ctx.moveTo(cx + R * Math.sin(ang), cy + R * Math.cos(ang)); ctx.lineTo(cx - R * Math.sin(ang), cy - R * Math.cos(ang));
      ctx.stroke();
      ctx.restore();
    }
    if (o.shape === 'block') D.block(ctx, cx, cy, 26, 20, { fill: o.fill || '--body-a', ang: o.ang || 0 });
    else D.circle(ctx, cx, cy, 4.5, { fill: '--ink' });
    for (const f of forces) {
      const L = Math.hypot(f.fx, f.fy) * sc;
      if (L < 2) continue;
      D.vec(ctx, cx + (f.ox || 0), cy - (f.oy || 0), f.fx * sc, -f.fy * sc, { color: f.color, label: f.label, width: f.width || 2.2, size: 13, dash: f.dash, labelSide: f.side || 1 });
    }
    return sc;
  };
  /* Diagrama de barras (energías, momentos…). items: [{label, value, color}]
     o = {x, y, w, h, max, min, title, unit, fmt, total:{label,value,color}} */
  D.bars = function (ctx, items, o = {}) {
    const x = o.x, y = o.y, w = o.w, h = o.h;
    if (o.panel !== false) D.panel(ctx, x, y, w, h, { title: o.title });
    const top = y + (o.title ? 26 : 10), bottom = y + h - 30;
    let vmax = o.max, vmin = o.min;
    if (vmax === undefined) { vmax = 0; for (const it of items) vmax = Math.max(vmax, it.value); if (o.total) vmax = Math.max(vmax, o.total.value); vmax = vmax > 0 ? MC.niceCeil(vmax * 1.05) : 1; }
    if (vmin === undefined) { vmin = 0; for (const it of items) vmin = Math.min(vmin, it.value); if (o.total) vmin = Math.min(vmin, o.total.value); vmin = vmin < 0 ? -MC.niceCeil(-vmin * 1.05) : 0; }
    const Yv = (v) => bottom - ((v - vmin) / (vmax - vmin)) * (bottom - top);
    const all = o.total ? items.concat([o.total]) : items;
    const n = all.length;
    const gap = 8, bw = Math.min(46, (w - 20 - gap * (n - 1)) / n);
    const x0 = x + (w - (n * bw + (n - 1) * gap)) / 2;
    const y0 = Yv(0);
    ctx.save();
    ctx.strokeStyle = C('--axis');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 8, Math.round(y0) + 0.5);
    ctx.lineTo(x + w - 8, Math.round(y0) + 0.5);
    ctx.stroke();
    ctx.restore();
    const fmt = o.fmt || ((v) => MC.sci(v, 3));
    all.forEach((it, i) => {
      const bx = x0 + i * (bw + gap);
      const yv = Yv(M.clamp(it.value, vmin, vmax));
      const isT = o.total && i === n - 1;
      ctx.save();
      ctx.fillStyle = C(it.color);
      ctx.globalAlpha = isT ? 0.35 : 0.88;
      ctx.fillRect(bx, Math.min(yv, y0), bw, Math.abs(y0 - yv));
      if (isT) { ctx.globalAlpha = 1; ctx.strokeStyle = C(it.color); ctx.lineWidth = 1.5; ctx.strokeRect(bx + 0.5, Math.min(yv, y0) + 0.5, bw - 1, Math.abs(y0 - yv)); }
      ctx.restore();
      if (it.value > vmax * 1.001 || it.value < vmin * 1.001 - 1e-12) MC.text(ctx, '▲', bx + bw / 2, top + 2, { size: 9, align: 'center', color: it.color });
      MC.text(ctx, it.label, bx + bw / 2, bottom + 14, { size: 12.5, align: 'center', math: it.math !== false, color: '--ink', weight: 500 });
      MC.text(ctx, fmt(it.value), bx + bw / 2, bottom + 26, { size: 9.5, align: 'center', mono: true, color: '--ink-3' });
    });
    if (o.unit) MC.text(ctx, o.unit, x + w - 8, y + 15, { size: 10, mono: true, align: 'right', color: '--ink-3' });
    return { Yv, top, bottom };
  };
  /* Agua/fluido: rectángulo con superficie ondulada ligera */
  D.fluid = function (ctx, x, y, w, h, o = {}) {
    ctx.save();
    const col = C(o.color || '--water');
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, MC.alpha(col, o.alpha0 || 0.35));
    g.addColorStop(1, MC.alpha(col, o.alpha1 || 0.6));
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = MC.alpha(col, 0.9);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y + 0.5);
    ctx.lineTo(x + w, y + 0.5);
    ctx.stroke();
    ctx.restore();
  };
  /* Cronómetro/indicador circular (velocímetro): value en [0, max] */
  D.gauge = function (ctx, cx, cy, r, value, max, o = {}) {
    ctx.save();
    const a0 = Math.PI * 1.25, a1 = -Math.PI * 0.25;
    ctx.lineWidth = 6;
    ctx.strokeStyle = C('--surface-3');
    ctx.beginPath();
    ctx.arc(cx, cy, r, -a0, -a1);
    ctx.stroke();
    const f = M.clamp(value / max, 0, 1);
    ctx.strokeStyle = C(o.color || '--vel');
    ctx.beginPath();
    ctx.arc(cx, cy, r, -a0, -(a0 + (a1 - a0) * f));
    ctx.stroke();
    ctx.restore();
    if (o.label) MC.text(ctx, o.label, cx, cy + 4, { size: 12, align: 'center', mono: true, color: '--ink' });
    if (o.title) MC.text(ctx, o.title, cx, cy + r * 0.75, { size: 10, align: 'center', color: '--ink-3' });
  };
})();
