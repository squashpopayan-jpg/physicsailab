/* ===================================================================
   40-montaje.js — Dibujos de equipo de laboratorio en vista lateral:
   mesa, soporte universal, regla, hilo, polea, carro, rampa, recipiente,
   instrumentos (cronómetro, termómetro, multímetro, celular), elementos
   eléctricos y ópticos, cotas y rótulos. Coordenadas en píxeles.
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM;
  const D = EM.draw;
  const C = (c) => (c && c.startsWith && c.startsWith('--') ? EM.col(c) : c);
  const RR = (ctx, x, y, w, h, r) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); };

  D.line = function (ctx, x1, y1, x2, y2, o = {}) {
    ctx.save();
    ctx.strokeStyle = C(o.color || '--ink');
    ctx.lineWidth = o.width || 1.5;
    ctx.lineCap = o.cap || 'round';
    if (o.dash) ctx.setLineDash(o.dash);
    if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.restore();
  };
  D.rect = function (ctx, x, y, w, h, o = {}) {
    ctx.save();
    if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
    RR(ctx, x, y, w, h, o.r || 0);
    if (o.fill) { ctx.fillStyle = C(o.fill); ctx.fill(); }
    if (o.stroke !== null) { ctx.strokeStyle = C(o.stroke || EM.alpha('#000000', 0.3)); ctx.lineWidth = o.width || 1; ctx.stroke(); }
    ctx.restore();
  };
  D.label = function (ctx, txt, x, y, o = {}) {
    EM.text(ctx, txt, x, y, Object.assign({ size: 11.5, color: '--ink-2', halo: true }, o));
  };
  /* Rótulo con línea guía desde (x, y) hasta el objeto (tx, ty) */
  D.callout = function (ctx, txt, x, y, tx, ty, o = {}) {
    D.line(ctx, x, y, tx, ty, { color: o.color || '--ink-3', width: 1 });
    ctx.save(); ctx.fillStyle = C(o.color || '--ink-3'); ctx.beginPath(); ctx.arc(tx, ty, 2.2, 0, 7); ctx.fill(); ctx.restore();
    D.label(ctx, txt, x + (o.dx === undefined ? (x < tx ? -4 : 4) : o.dx), y + (o.dy || 4), { align: o.align || (x < tx ? 'right' : 'left'), size: o.size || 11.5, color: o.tcolor || '--ink-2' });
  };
  /* Cota: línea con flechas y valor */
  D.cota = function (ctx, x1, y1, x2, y2, txt, o = {}) {
    const off = o.off || 0, dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, px = -dy / L, py = dx / L;
    const a1 = [x1 + px * off, y1 + py * off], a2 = [x2 + px * off, y2 + py * off];
    if (off) { D.line(ctx, x1, y1, a1[0] + px * 3, a1[1] + py * 3, { color: '--ink-3', width: 0.8 }); D.line(ctx, x2, y2, a2[0] + px * 3, a2[1] + py * 3, { color: '--ink-3', width: 0.8 }); }
    D.arrow(ctx, (a1[0] + a2[0]) / 2, (a1[1] + a2[1]) / 2, a1[0], a1[1], { color: o.color || '--ink-3', width: 1, head: 6 });
    D.arrow(ctx, (a1[0] + a2[0]) / 2, (a1[1] + a2[1]) / 2, a2[0], a2[1], { color: o.color || '--ink-3', width: 1, head: 6 });
    if (txt) {
      const mx = (a1[0] + a2[0]) / 2, my = (a1[1] + a2[1]) / 2;
      const s = o.side === undefined ? 1 : o.side;
      D.label(ctx, txt, mx + px * 11 * s, my + py * 11 * s + 4, { align: 'center', size: o.size || 11.5, color: o.color || '--ink-2', mono: o.mono });
    }
  };

  /* Mesa de trabajo: superficie en y, de x0 a x1 */
  D.mesa = function (ctx, x0, x1, y, o = {}) {
    const g = o.grosor || 10;
    ctx.save();
    ctx.fillStyle = C('--wood');
    ctx.fillRect(x0, y, x1 - x0, g);
    ctx.strokeStyle = EM.alpha('#000000', 0.25);
    ctx.strokeRect(x0 + 0.5, y + 0.5, x1 - x0 - 1, g - 1);
    ctx.fillStyle = EM.shade(C('--wood'), 0.8);
    if (o.patas !== false) { ctx.fillRect(x0 + 10, y + g, 8, o.alto || 40); ctx.fillRect(x1 - 18, y + g, 8, o.alto || 40); }
    ctx.restore();
  };
  D.piso = function (ctx, x0, x1, y) {
    D.line(ctx, x0, y, x1, y, { color: '--ink-3', width: 1.2 });
    ctx.save(); ctx.strokeStyle = C('--ink-3'); ctx.lineWidth = 0.8;
    for (let x = x0; x < x1; x += 10) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 6); ctx.stroke(); }
    ctx.restore();
  };
  /* Soporte universal: base en (x, y) (y = superficie), varilla de altura H, brazo horizontal de largo b hacia ±.
     Devuelve el punto de suspensión al final del brazo. */
  D.soporte = function (ctx, x, y, H, o = {}) {
    const b = o.brazo === undefined ? 60 : o.brazo, dir = o.lado === 'izq' ? -1 : 1, hb = o.hBrazo === undefined ? H - 8 : o.hBrazo;
    D.rect(ctx, x - 28, y - 7, 56, 7, { fill: '--metal-dark', r: 2 });
    D.rect(ctx, x - 2.5, y - H, 5, H - 6, { fill: '--metal', stroke: '--metal-dark' });
    if (b) {
      D.rect(ctx, x - 6, y - hb - 6, 12, 12, { fill: '--metal-dark', r: 2 });
      D.rect(ctx, dir > 0 ? x : x - b, y - hb - 2.5, b, 5, { fill: '--metal', stroke: '--metal-dark' });
    }
    return [x + dir * (b - 4), y - hb + 2.5];
  };
  /* Regla graduada vertical u horizontal: de (x, y1) a (x, y2) con pxcm píxeles por centímetro */
  D.regla = function (ctx, x1, y1, x2, y2, pxcm, o = {}) {
    const vert = Math.abs(x2 - x1) < Math.abs(y2 - y1);
    const L = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / L, uy = (y2 - y1) / L, px = -uy, py = ux;
    const w = o.ancho || 16;
    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(Math.atan2(uy, ux));
    ctx.fillStyle = C(o.fill || '--ruler');
    ctx.fillRect(0, -w / 2, L, w);
    ctx.strokeStyle = EM.alpha('#000000', 0.35); ctx.lineWidth = 0.8; ctx.strokeRect(0, -w / 2, L, w);
    ctx.strokeStyle = C('--ink'); ctx.lineWidth = 0.8;
    const n = Math.floor(L / pxcm);
    for (let i = 0; i <= n; i++) {
      const s = i * pxcm, len = i % 10 === 0 ? w * 0.75 : i % 5 === 0 ? w * 0.5 : w * 0.3;
      ctx.beginPath(); ctx.moveTo(s, -w / 2); ctx.lineTo(s, -w / 2 + len); ctx.stroke();
      if (pxcm > 3.5 && i % 10 === 0 && i > 0) { ctx.save(); ctx.translate(s, w / 2 - 2); ctx.rotate(vert ? -Math.atan2(uy, ux) + 0 : 0); EM.text(ctx, String(o.mm ? i * 10 : i), 0, 0, { size: 8, align: 'center', color: '--ink' }); ctx.restore(); }
    }
    ctx.restore();
    return { px, py };
  };
  /* Hilo */
  D.hilo = (ctx, x1, y1, x2, y2, o = {}) => D.line(ctx, x1, y1, x2, y2, { color: o.color || '--thread', width: o.width || 1.2 });
  /* Polea de radio r con soporte */
  D.polea = function (ctx, x, y, r, o = {}) {
    ctx.save();
    ctx.fillStyle = C('--plastic'); ctx.strokeStyle = EM.alpha('#000000', 0.4); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0, 7); ctx.stroke();
    if (o.ang !== undefined) { ctx.strokeStyle = EM.alpha('#000000', 0.35); for (let k = 0; k < 3; k++) { const a = o.ang + (k * 2 * Math.PI) / 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + r * 0.78 * Math.cos(a), y + r * 0.78 * Math.sin(a)); ctx.stroke(); } }
    ctx.fillStyle = C('--metal-dark'); ctx.beginPath(); ctx.arc(x, y, Math.max(2, r * 0.18), 0, 7); ctx.fill();
    ctx.restore();
  };
  /* Carro de laboratorio: base inferior en (x, y), ancho w */
  D.carro = function (ctx, x, y, w, o = {}) {
    const h = o.alto || w * 0.32, rw = Math.max(4, w * 0.11);
    D.rect(ctx, x, y - h - rw * 1.4, w, h, { fill: o.color || '--c1', r: 3 });
    for (const xx of [x + w * 0.2, x + w * 0.8]) { ctx.save(); ctx.fillStyle = C('--rubber'); ctx.beginPath(); ctx.arc(xx, y - rw, rw, 0, 7); ctx.fill(); ctx.fillStyle = C('--metal'); ctx.beginPath(); ctx.arc(xx, y - rw, rw * 0.4, 0, 7); ctx.fill(); ctx.restore(); }
    if (o.label) D.label(ctx, o.label, x + w / 2, y - h / 2 - rw * 1.4 + 4, { align: 'center', color: '#FFFFFF', halo: false, weight: 650 });
    return { top: y - h - rw * 1.4, h };
  };
  /* Riel o tabla inclinada entre (x0, y0) y (x1, y1) */
  D.rampa = function (ctx, x0, y0, x1, y1, o = {}) {
    const g = o.grosor || 8, L = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0);
    ctx.save(); ctx.translate(x0, y0); ctx.rotate(a);
    ctx.fillStyle = C(o.fill || '--rail'); ctx.fillRect(0, 0, L, g);
    ctx.strokeStyle = EM.alpha('#000000', 0.3); ctx.strokeRect(0, 0, L, g);
    if (o.canal) { ctx.strokeStyle = EM.alpha('#000000', 0.25); ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(L, 2); ctx.stroke(); }
    ctx.restore();
  };
  /* Recipiente transparente (vaso, botella) con agua hasta la fracción nivel; base en (x, y) */
  D.recipiente = function (ctx, x, y, w, h, nivel = 0.6, o = {}) {
    ctx.save();
    if (nivel > 0) { ctx.fillStyle = C(o.liquido || '--water'); ctx.globalAlpha = 0.55; ctx.fillRect(x + 2, y - h * nivel, w - 4, h * nivel - 2); ctx.globalAlpha = 1; }
    ctx.strokeStyle = C('--glass'); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y - h); ctx.stroke();
    if (o.marcas) { ctx.strokeStyle = C('--ink-3'); ctx.lineWidth = 0.8; for (let k = 1; k < o.marcas; k++) { const yy = y - (h * k) / o.marcas; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + 7, yy); ctx.stroke(); } }
    ctx.restore();
  };
  /* Cronómetro digital: centro (x, y), tamaño s */
  D.cronometro = function (ctx, x, y, s, txt, o = {}) {
    ctx.save();
    ctx.fillStyle = C('--plastic-dark'); ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill();
    ctx.fillStyle = C('--plastic-dark'); ctx.fillRect(x - s * 0.18, y - s * 1.25, s * 0.36, s * 0.3);
    RR(ctx, x - s * 0.72, y - s * 0.32, s * 1.44, s * 0.64, 3); ctx.fillStyle = C('--lcd'); ctx.fill();
    ctx.restore();
    EM.text(ctx, txt, x, y + s * 0.16, { size: Math.max(9, s * 0.42), align: 'center', mono: true, color: '--lcd-ink', weight: 600 });
    if (o.label) D.label(ctx, o.label, x, y + s + 14, { align: 'center' });
  };
  /* Termómetro digital de punzón: punta en (x, y), cuerpo arriba */
  D.termometro = function (ctx, x, y, L, txt) {
    D.line(ctx, x, y, x, y - L * 0.6, { color: '--metal', width: 3 });
    D.rect(ctx, x - 13, y - L, 26, L * 0.42, { fill: '--plastic-dark', r: 4 });
    D.rect(ctx, x - 10, y - L + 5, 20, 12, { fill: '--lcd', r: 2, stroke: null });
    EM.text(ctx, txt, x, y - L + 14, { size: 8.5, align: 'center', mono: true, color: '--lcd-ink', weight: 600 });
  };
  /* Multímetro digital: esquina superior izquierda (x, y) */
  D.multimetro = function (ctx, x, y, w, txt, o = {}) {
    const h = w * 1.55;
    D.rect(ctx, x, y, w, h, { fill: '--meter', r: 6 });
    D.rect(ctx, x + w * 0.1, y + w * 0.1, w * 0.8, w * 0.42, { fill: '--lcd', r: 3, stroke: null });
    EM.text(ctx, txt, x + w * 0.86, y + w * 0.43, { size: Math.max(9, w * 0.2), align: 'right', mono: true, color: '--lcd-ink', weight: 650 });
    ctx.save(); ctx.fillStyle = C('--plastic-dark'); ctx.beginPath(); ctx.arc(x + w / 2, y + h * 0.58, w * 0.22, 0, 7); ctx.fill(); ctx.restore();
    if (o.modo) D.label(ctx, o.modo, x + w / 2, y + h * 0.58 + 4, { align: 'center', color: '#FFFFFF', halo: false, size: 9.5, weight: 650 });
    const bornes = [[x + w * 0.22, y + h * 0.9], [x + w * 0.5, y + h * 0.9], [x + w * 0.78, y + h * 0.9]];
    ['#C62828', '#111111', '#C62828'].forEach((c, i) => { ctx.save(); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(bornes[i][0], bornes[i][1], w * 0.06, 0, 7); ctx.fill(); ctx.restore(); });
    return { com: bornes[1], v: bornes[2], a: bornes[0], h };
  };
  /* Celular visto de frente; screen(ctx, x, y, w, h) dibuja la pantalla */
  D.celular = function (ctx, cx, cy, w, h, o = {}) {
    ctx.save(); ctx.translate(cx, cy); if (o.ang) ctx.rotate(-o.ang);
    RR(ctx, -w / 2, -h / 2, w, h, Math.min(w, h) * 0.14); ctx.fillStyle = C('--phone'); ctx.fill();
    const bz = Math.max(2.5, w * 0.06), sx = -w / 2 + bz, sy = -h / 2 + bz * 1.6, sw = w - 2 * bz, sh = h - bz * 3.2;
    RR(ctx, sx, sy, sw, sh, 3); ctx.fillStyle = C('--screen'); ctx.fill();
    if (o.screen) { ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip(); o.screen(ctx, sx, sy, sw, sh); ctx.restore(); }
    ctx.restore();
  };
  /* Pila cilíndrica (AA) horizontal: centro (x, y), largo L; positivo a la derecha */
  D.pila = function (ctx, x, y, L, o = {}) {
    const d = L * 0.3;
    D.rect(ctx, x - L / 2, y - d / 2, L * 0.94, d, { fill: o.color || '--c4', r: 3 });
    D.rect(ctx, x - L / 2, y - d / 2, L * 0.25, d, { fill: '--plastic-dark', r: 3, stroke: null });
    D.rect(ctx, x + L * 0.44, y - d * 0.18, L * 0.06, d * 0.36, { fill: '--metal', stroke: null });
    if (o.label) D.label(ctx, o.label, x + L * 0.12, y + 4, { align: 'center', color: '#FFFFFF', halo: false, size: Math.max(8, d * 0.45), weight: 700 });
    return { neg: [x - L / 2, y], pos: [x + L / 2, y] };
  };
  /* Bombillo incandescente pequeño: centro del vidrio (x, y), radio r, brillo 0–1 */
  D.bombillo = function (ctx, x, y, r, brillo = 0, o = {}) {
    ctx.save();
    if (brillo > 0.01) { const g = ctx.createRadialGradient(x, y, 0, x, y, r * (1.6 + 2.2 * brillo)); g.addColorStop(0, `rgba(255,214,90,${0.25 + 0.6 * brillo})`); g.addColorStop(1, 'rgba(255,214,90,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * (1.6 + 2.2 * brillo), 0, 7); ctx.fill(); }
    ctx.fillStyle = brillo > 0.01 ? `rgba(255,236,170,${0.5 + 0.5 * brillo})` : EM.alpha(C('--glass'), 0.25);
    ctx.strokeStyle = C('--glass'); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = brillo > 0.05 ? '#FF9F1C' : C('--ink-3'); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(x - r * 0.35, y + r * 0.6); ctx.lineTo(x - r * 0.25, y); ctx.lineTo(x + r * 0.25, y); ctx.lineTo(x + r * 0.35, y + r * 0.6); ctx.stroke();
    D.rect(ctx, x - r * 0.45, y + r * 0.85, r * 0.9, r * 0.6, { fill: '--metal', stroke: '--metal-dark' });
    ctx.restore();
    if (o.label) D.label(ctx, o.label, x, y - r - 6, { align: 'center', weight: 650 });
    return { a: [x - r * 0.3, y + r * 1.45], b: [x + r * 0.3, y + r * 1.45] };
  };
  /* Cable entre dos puntos (con curva suave o por una ruta) */
  D.cable = function (ctx, a, b, color, o = {}) {
    ctx.save();
    ctx.strokeStyle = C(color || '--wire-r'); ctx.lineWidth = o.width || 2.4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(a[0], a[1]);
    if (o.ruta) { for (const p of o.ruta) ctx.lineTo(p[0], p[1]); ctx.lineTo(b[0], b[1]); }
    else { const sag = o.sag === undefined ? 0.2 : o.sag; ctx.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + Math.abs(b[0] - a[0]) * sag, b[0], b[1]); }
    ctx.stroke(); ctx.restore();
  };
  /* Símbolos esquemáticos */
  D.resistor = function (ctx, x1, y1, x2, y2, o = {}) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, px = -uy, py = ux;
    const body = Math.min(L * 0.6, 44), a = (L - body) / 2, amp = o.amp || 6;
    const pts = [[x1, y1], [x1 + ux * a, y1 + uy * a]];
    for (let i = 0; i < 6; i++) { const s = a + (body * (i + 0.5)) / 6, sg = i % 2 ? -1 : 1; pts.push([x1 + ux * s + px * amp * sg, y1 + uy * s + py * amp * sg]); }
    pts.push([x1 + ux * (a + body), y1 + uy * (a + body)], [x2, y2]);
    D.poly(ctx, pts, { color: o.color || '--ink', width: o.width || 1.8 });
    if (o.label) D.label(ctx, o.label, (x1 + x2) / 2 + px * (amp + 12), (y1 + y2) / 2 + py * (amp + 12) + 4, { align: 'center', mono: o.mono });
  };
  D.capacitor = function (ctx, x1, y1, x2, y2, o = {}) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, px = -uy, py = ux, g = 5, pl = o.plate || 11;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    D.line(ctx, x1, y1, mx - ux * g, my - uy * g, { width: 1.8 }); D.line(ctx, x2, y2, mx + ux * g, my + uy * g, { width: 1.8 });
    D.line(ctx, mx - ux * g + px * pl, my - uy * g + py * pl, mx - ux * g - px * pl, my - uy * g - py * pl, { width: 2.4 });
    D.line(ctx, mx + ux * g + px * pl, my + uy * g + py * pl, mx + ux * g - px * pl, my + uy * g - py * pl, { width: 2.4 });
    if (o.label) D.label(ctx, o.label, mx + px * (pl + 12), my + py * (pl + 12) + 4, { align: 'center', mono: o.mono });
  };
  D.fuente = function (ctx, x1, y1, x2, y2, o = {}) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, px = -uy, py = ux, mx = (x1 + x2) / 2, my = (y1 + y2) / 2, g = 4;
    D.line(ctx, x1, y1, mx - ux * g, my - uy * g, { width: 1.8 }); D.line(ctx, mx + ux * g, my + uy * g, x2, y2, { width: 1.8 });
    D.line(ctx, mx - ux * g + px * 6, my - uy * g + py * 6, mx - ux * g - px * 6, my - uy * g - py * 6, { width: 3 });
    D.line(ctx, mx + ux * g + px * 13, my + uy * g + py * 13, mx + ux * g - px * 13, my + uy * g - py * 13, { width: 1.8 });
    if (o.label) D.label(ctx, o.label, mx + px * 26, my + py * 26 + 4, { align: 'center', mono: true });
  };
  D.diodo = function (ctx, x1, y1, x2, y2, o = {}) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, px = -uy, py = ux, mx = (x1 + x2) / 2, my = (y1 + y2) / 2, s = 8;
    D.line(ctx, x1, y1, mx - ux * s, my - uy * s, { width: 1.8 }); D.line(ctx, mx + ux * s, my + uy * s, x2, y2, { width: 1.8 });
    D.poly(ctx, [[mx - ux * s + px * s, my - uy * s + py * s], [mx + ux * s, my + uy * s], [mx - ux * s - px * s, my - uy * s - py * s]], { width: 1.6, close: true, fill: o.color || null });
    D.line(ctx, mx + ux * s + px * s, my + uy * s + py * s, mx + ux * s - px * s, my + uy * s - py * s, { width: 2 });
    if (o.led) for (const k of [-1, 1]) D.arrow(ctx, mx + px * (s + 3) + ux * k * 4, my + py * (s + 3) + uy * k * 4, mx + px * (s + 13) + ux * (k * 4 + 5), my + py * (s + 13) + uy * (k * 4 + 5), { color: o.color || '--ink', width: 1.2, head: 5 });
    if (o.label) D.label(ctx, o.label, mx - px * (s + 16), my - py * (s + 16) + 4, { align: 'center' });
  };
  /* Imán de barra (N rojo, S azul) centrado en (x, y), ángulo ang con N hacia +ang */
  D.iman = function (ctx, x, y, len, th, ang = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-ang);
    ctx.fillStyle = C('--magN'); ctx.fillRect(0, -th / 2, len / 2, th);
    ctx.fillStyle = C('--magS'); ctx.fillRect(-len / 2, -th / 2, len / 2, th);
    ctx.strokeStyle = EM.alpha('#000000', 0.4); ctx.strokeRect(-len / 2 + 0.5, -th / 2 + 0.5, len - 1, th - 1);
    ctx.restore();
    if (len > 24) {
      const c = Math.cos(ang), s = Math.sin(ang), fs = Math.min(12, th * 0.7);
      EM.text(ctx, 'N', x + (len / 4) * c, y - (len / 4) * s, { size: fs, align: 'center', baseline: 'middle', color: '#FFFFFF', weight: 700 });
      EM.text(ctx, 'S', x - (len / 4) * c, y + (len / 4) * s, { size: fs, align: 'center', baseline: 'middle', color: '#FFFFFF', weight: 700 });
    }
  };
  /* Bobina vista de lado: centro (x, y), ancho w (diámetro), alto h, espiras visibles n, eje vertical */
  D.bobina = function (ctx, x, y, w, h, n = 10, o = {}) {
    ctx.save(); ctx.strokeStyle = C('--copper'); ctx.lineWidth = Math.max(1.4, (h / n) * 0.55);
    for (let i = 0; i < n; i++) { const yy = y - h / 2 + (h * (i + 0.5)) / n; ctx.beginPath(); ctx.ellipse(x, yy, w / 2, Math.max(1.5, (h / n) * 0.42), 0, 0, Math.PI * 2); ctx.stroke(); }
    if (o.tubo) { ctx.strokeStyle = EM.alpha(C('--ink'), 0.25); ctx.lineWidth = 1; ctx.strokeRect(x - w * 0.42, y - h / 2 - 10, w * 0.84, h + 20); }
    ctx.restore();
  };
  /* Brújula: centro (x, y), radio r, aguja apuntando al ángulo ang (rad, 0 = arriba, sentido horario) */
  D.brujula = function (ctx, x, y, r, ang, o = {}) {
    ctx.save();
    ctx.fillStyle = C('--surface'); ctx.strokeStyle = C('--ink-2'); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = C('--ink-3'); ctx.lineWidth = 0.8;
    for (let k = 0; k < 36; k++) { const a = (k * Math.PI) / 18, l = k % 9 === 0 ? 7 : 3; ctx.beginPath(); ctx.moveTo(x + (r - l) * Math.sin(a), y - (r - l) * Math.cos(a)); ctx.lineTo(x + r * Math.sin(a), y - r * Math.cos(a)); ctx.stroke(); }
    ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = C('--magN'); ctx.beginPath(); ctx.moveTo(0, -r * 0.82); ctx.lineTo(r * 0.12, 0); ctx.lineTo(-r * 0.12, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C('--magS'); ctx.beginPath(); ctx.moveTo(0, r * 0.82); ctx.lineTo(r * 0.12, 0); ctx.lineTo(-r * 0.12, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C('--metal-dark'); ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, 7); ctx.fill();
    ctx.restore();
  };
  /* Puntero láser: salida del haz en (x, y), apuntando en la dirección ang (rad, 0 = +x) */
  D.laser = function (ctx, x, y, ang, o = {}) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    D.rect(ctx, -o.largo || -70, -6, o.largo || 70, 12, { fill: '--plastic-dark', r: 5 });
    D.rect(ctx, -10, -4, 10, 8, { fill: '--metal', stroke: null });
    ctx.restore();
  };
  D.haz = function (ctx, pts, o = {}) {
    ctx.save(); ctx.strokeStyle = o.color || '#E53935'; ctx.lineWidth = o.width || 2; ctx.globalAlpha = o.alpha === undefined ? 0.9 : o.alpha;
    ctx.shadowColor = o.color || '#E53935'; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke(); ctx.restore();
  };
  /* Lente delgada vertical en x, centro y, altura h; conv = convergente */
  D.lente = function (ctx, x, y, h, conv = true) {
    ctx.save(); ctx.fillStyle = EM.alpha(C('--glass'), 0.3); ctx.strokeStyle = C('--glass'); ctx.lineWidth = 1.4;
    const b = conv ? 9 : -6;
    ctx.beginPath(); ctx.moveTo(x, y - h / 2); ctx.quadraticCurveTo(x + b, y, x, y + h / 2); ctx.quadraticCurveTo(x - b, y, x, y - h / 2);
    if (!conv) { ctx.rect(x - 7, y - h / 2, 14, 0); }
    ctx.fill(); ctx.stroke(); ctx.restore();
  };
  /* Parlante visto de lado: centro (x, y), tamaño s, cono hacia la derecha */
  D.parlante = function (ctx, x, y, s) {
    D.rect(ctx, x - s * 0.6, y - s * 0.35, s * 0.5, s * 0.7, { fill: '--plastic-dark', r: 2 });
    D.poly(ctx, [[x - s * 0.1, y - s * 0.35], [x + s * 0.4, y - s * 0.8], [x + s * 0.4, y + s * 0.8], [x - s * 0.1, y + s * 0.35]], { close: true, fill: '--metal', color: '--metal-dark' });
  };
  /* Color aproximado de una longitud de onda visible (nm) → [r, g, b] 0–255 (aproximación de Bruton) */
  D.rgbNm = function (nm) {
    let r = 0, g = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; } else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = -(nm - 645) / 65; } else if (nm <= 780) r = 1;
    const f = nm < 380 || nm > 780 ? 0 : nm < 420 ? 0.3 + (0.7 * (nm - 380)) / 40 : nm > 700 ? 0.3 + (0.7 * (780 - nm)) / 80 : 1;
    return [r, g, b].map((v) => Math.round(255 * Math.pow(v * f, 0.8)));
  };
  D.colorNm = (nm, a = 1) => { const c = D.rgbNm(nm); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; };
})();
