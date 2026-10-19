/* 35-draw.js — Dibujos auxiliares (resortes, bloques, átomos, probetas) */
(function () {
  'use strict';
  const EM = window.EM;
  const D = EM.draw;
  const C = (c) => (c && c.startsWith && c.startsWith('--') ? EM.col(c) : c);
  /* Resorte helicoidal visto de lado entre dos puntos */
  D.spring = function (ctx, x1, y1, x2, y2, o = {}) {
    const n = o.coils || 10, R = o.r || 8;
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    if (L < 1) return;
    const ux = dx / L, uy = dy / L, px = -uy, py = ux;
    const lead = Math.min(o.lead === undefined ? 10 : o.lead, L * 0.2);
    const Lc = L - 2 * lead;
    ctx.save();
    ctx.strokeStyle = C(o.color || '--ink-2');
    ctx.lineWidth = o.width || 1.6;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 + ux * lead, y1 + uy * lead);
    const N = n * 24;
    for (let i = 0; i <= N; i++) {
      const s = i / N, a = 2 * Math.PI * n * s;
      const along = lead + Lc * s;
      ctx.lineTo(x1 + ux * along + px * R * Math.sin(a), y1 + uy * along + py * R * Math.sin(a));
    }
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  };
  /* Bloque rectangular centrado */
  D.block = function (ctx, cx, cy, w, h, o = {}) {
    ctx.save();
    ctx.fillStyle = C(o.fill || '--c1');
    ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(cx - w / 2, cy - h / 2, w, h, 4); else ctx.rect(cx - w / 2, cy - h / 2, w, h);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = EM.alpha('#000000', 0.25);
    ctx.lineWidth = 1;
    ctx.stroke();
    if (o.label) EM.text(ctx, o.label, cx, cy, { size: o.size || 13, color: '#FFFFFF', align: 'center', baseline: 'middle', weight: 600, italic: o.italic, family: o.italic ? EM.FONT_MATH : undefined });
    ctx.restore();
  };
  /* Masa esférica (lenteja de péndulo) */
  D.bob = function (ctx, x, y, r, o = {}) {
    ctx.save();
    const col = C(o.color || '--c1');
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, EM.shade(col, 1.45));
    g.addColorStop(1, col);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = EM.alpha('#000000', 0.3);
    ctx.lineWidth = 1;
    ctx.stroke();
    if (o.label) EM.text(ctx, o.label, x, y, { size: o.size || 12, color: '#FFFFFF', align: 'center', baseline: 'middle', weight: 600 });
    ctx.restore();
  };
  /* Soporte rayado: dir = 'down' (techo), 'up' (suelo), 'right' (pared izquierda), 'left' (pared derecha) */
  D.support = function (ctx, x, y, len, dir = 'down', o = {}) {
    ctx.save();
    ctx.strokeStyle = C(o.color || '--ink-2');
    ctx.lineWidth = 2;
    ctx.beginPath();
    const horiz = dir === 'down' || dir === 'up';
    if (horiz) { ctx.moveTo(x - len / 2, y); ctx.lineTo(x + len / 2, y); }
    else { ctx.moveTo(x, y - len / 2); ctx.lineTo(x, y + len / 2); }
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.beginPath();
    const s = 7, k = Math.floor(len / s);
    for (let i = 0; i <= k; i++) {
      const t = -len / 2 + i * s;
      if (dir === 'down') { ctx.moveTo(x + t, y); ctx.lineTo(x + t + 6, y - 7); }
      else if (dir === 'up') { ctx.moveTo(x + t, y); ctx.lineTo(x + t - 6, y + 7); }
      else if (dir === 'right') { ctx.moveTo(x, y + t); ctx.lineTo(x - 7, y + t + 6); }
      else { ctx.moveTo(x, y + t); ctx.lineTo(x + 7, y + t + 6); }
    }
    ctx.stroke();
    ctx.restore();
  };
  /* Amortiguador (pistón) entre dos puntos horizontales/verticales */
  D.damper = function (ctx, x1, y1, x2, y2, o = {}) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    if (L < 4) return;
    const ux = dx / L, uy = dy / L, px = -uy, py = ux, w = o.w || 9;
    const a = L * 0.35, b = L * 0.62;
    ctx.save();
    ctx.strokeStyle = C(o.color || '--ink-2');
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x1 + ux * a, y1 + uy * a);
    /* cilindro */
    const c0 = [x1 + ux * a, y1 + uy * a], c1 = [x1 + ux * (a + L * 0.32), y1 + uy * (a + L * 0.32)];
    ctx.moveTo(c0[0] + px * w, c0[1] + py * w); ctx.lineTo(c0[0] - px * w, c0[1] - py * w);
    ctx.moveTo(c0[0] + px * w, c0[1] + py * w); ctx.lineTo(c1[0] + px * w, c1[1] + py * w);
    ctx.moveTo(c0[0] - px * w, c0[1] - py * w); ctx.lineTo(c1[0] - px * w, c1[1] - py * w);
    /* pistón */
    const pp = [x1 + ux * b * 0.85, y1 + uy * b * 0.85];
    ctx.moveTo(pp[0] + px * w * 0.7, pp[1] + py * w * 0.7); ctx.lineTo(pp[0] - px * w * 0.7, pp[1] - py * w * 0.7);
    ctx.moveTo(pp[0], pp[1]); ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  };
  /* Flecha de vector en el plano con etiqueta */
  D.vec = function (ctx, x, y, vx, vy, o = {}) {
    D.arrow(ctx, x, y, x + vx, y + vy, o);
    if (o.label) EM.text(ctx, o.label, x + vx + (o.lx || 4), y + vy + (o.ly || -4), { size: 13, weight: 700, color: o.color || '--ink', halo: true, family: EM.FONT_MATH, italic: o.italic !== false });
  };

  /* Átomo sombreado (esfera) */
  D.atom = function (ctx, x, y, r, col, o = {}) { D.bob(ctx, x, y, r, Object.assign({ color: col }, o)); };
  /* Colores por especie química en las celdas */
  EM.SPECIES = ['--c1', '--c2', '--c3', '--c4', '--c5'];
  /* Probeta de tracción vista de frente, con estricción opcional */
  D.specimen = function (ctx, cx, cy, L, w, o = {}) {
    const neck = o.neck || 0, grip = o.grip || w * 1.7, gl = o.gripLen || L * 0.18;
    ctx.save();
    ctx.fillStyle = C(o.fill || '--grid-2');
    ctx.strokeStyle = C(o.color || '--ink-2');
    ctx.lineWidth = 1.4;
    const top = cy - L / 2, bot = cy + L / 2;
    const pts = [];
    const N = 60;
    for (let i = 0; i <= N; i++) {
      const y = top + gl + ((L - 2 * gl) * i) / N, s = (y - cy) / ((L - 2 * gl) / 2);
      const half = (w / 2) * (1 - neck * Math.exp(-s * s * 18));
      pts.push([cx + half, y]);
    }
    ctx.beginPath();
    ctx.moveTo(cx - grip / 2, top); ctx.lineTo(cx + grip / 2, top); ctx.lineTo(cx + grip / 2, top + gl * 0.7);
    ctx.lineTo(cx + w / 2, top + gl);
    for (const p of pts) ctx.lineTo(p[0], p[1]);
    ctx.lineTo(cx + grip / 2, bot - gl * 0.7); ctx.lineTo(cx + grip / 2, bot); ctx.lineTo(cx - grip / 2, bot); ctx.lineTo(cx - grip / 2, bot - gl * 0.7);
    for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(2 * cx - pts[i][0], pts[i][1]);
    ctx.lineTo(cx - grip / 2, top + gl * 0.7);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    if (o.broken) {
      ctx.fillStyle = C('--bg');
      ctx.fillRect(cx - grip, cy - 2, grip * 2, 4);
    }
    ctx.restore();
  };
})();
