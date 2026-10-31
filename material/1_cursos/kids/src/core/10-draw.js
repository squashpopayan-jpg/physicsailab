/* ===================================================================
   10-draw.js — ayudas de dibujo para los lienzos (coordenadas lógicas: ancho 800)
   =================================================================== */
(function () {
  'use strict';
  const FK = window.FK, M = FK.M;
  const FONT = '"Fredoka","Baloo 2","Nunito","Segoe UI",system-ui,sans-serif';
  const EMO = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
  const D = (FK.d = {});
  D.FONT = FONT;
  D.INK = '#2B2350';

  D.rr = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };
  D.box = function (ctx, x, y, w, h, fill, o = {}) {
    D.rr(ctx, x, y, w, h, o.r === undefined ? 10 : o.r);
    ctx.fillStyle = fill; ctx.fill();
    if (o.stroke !== false) { ctx.lineWidth = o.lw || 3; ctx.strokeStyle = o.stroke || D.INK; ctx.stroke(); }
  };
  D.circle = function (ctx, x, y, r, fill, stroke, lw = 3) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, M.TAU);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); }
  };
  D.line = function (ctx, x1, y1, x2, y2, color = D.INK, w = 3, dash) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
    if (dash) ctx.setLineDash(dash);
    ctx.stroke(); ctx.setLineDash([]);
  };
  D.poly = function (ctx, pts, fill, stroke, lw = 3) {
    ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.stroke(); }
  };
  D.text = function (ctx, str, x, y, o = {}) {
    ctx.save();
    ctx.font = `${o.weight || 600} ${o.size || 18}px ${FONT}`;
    ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'middle';
    if (o.stroke) { ctx.lineWidth = o.slw || 5; ctx.strokeStyle = o.stroke; ctx.lineJoin = 'round'; ctx.strokeText(str, x, y); }
    ctx.fillStyle = o.color || D.INK; ctx.fillText(str, x, y);
    ctx.restore();
  };
  D.emoji = function (ctx, ch, x, y, size = 40, rot = 0, flip = false) {
    ctx.save();
    ctx.translate(x, y); if (rot) ctx.rotate(rot); if (flip) ctx.scale(-1, 1);
    ctx.font = `${size}px ${EMO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(ch, 0, size * 0.04);
    ctx.restore();
  };
  /* Etiqueta redondeada con texto */
  D.tag = function (ctx, str, x, y, color = '#fff', o = {}) {
    ctx.save();
    ctx.font = `${o.weight || 600} ${o.size || 16}px ${FONT}`;
    const w = ctx.measureText(str).width + 18, h = (o.size || 16) + 12;
    const bx = o.align === 'left' ? x : o.align === 'right' ? x - w : x - w / 2;
    ctx.restore();
    D.box(ctx, bx, y - h / 2, w, h, color, { r: h / 2, lw: o.lw || 2.5 });
    D.text(ctx, str, bx + w / 2, y + 1, { size: o.size || 16, align: 'center', color: o.ink || D.INK, weight: o.weight });
  };
  D.bar = function (ctx, x, y, w, h, frac, color, label, o = {}) {
    D.box(ctx, x, y, w, h, '#fff', { r: h / 2, lw: 2.5 });
    const fw = Math.max(0, Math.min(1, frac)) * (w - 4);
    if (fw > 1) { D.rr(ctx, x + 2, y + 2, Math.max(fw, h - 4), h - 4, (h - 4) / 2); ctx.fillStyle = color; ctx.fill(); }
    if (label) D.text(ctx, label, x + w / 2, y + h / 2 + 1, { size: o.size || Math.min(15, h - 6), align: 'center', color: o.ink || D.INK });
  };
  /* Flecha gruesa (fuerzas, velocidades) */
  D.arrow = function (ctx, x1, y1, x2, y2, color = '#FF4757', w = 6) {
    const L = Math.hypot(x2 - x1, y2 - y1);
    if (L < 2) return;
    const a = Math.atan2(y2 - y1, x2 - x1), hl = Math.min(L * 0.6, w * 2.6);
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = color; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * hl * 0.6, y2 - Math.sin(a) * hl * 0.6); ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(a - 0.45) * hl, y2 - Math.sin(a - 0.45) * hl);
    ctx.lineTo(x2 - Math.cos(a + 0.45) * hl, y2 - Math.sin(a + 0.45) * hl); ctx.closePath(); ctx.fill();
    ctx.restore();
  };
  /* Resorte */
  D.spring = function (ctx, x1, y1, x2, y2, coils = 10, amp = 10, color = '#7B7A99', w = 4) {
    const L = Math.hypot(x2 - x1, y2 - y1), a = Math.atan2(y2 - y1, x2 - x1);
    ctx.save(); ctx.translate(x1, y1); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(0, 0);
    const lead = Math.min(14, L * 0.15);
    ctx.lineTo(lead, 0);
    const n = coils * 2;
    for (let i = 1; i <= n; i++) ctx.lineTo(lead + ((L - 2 * lead) * i) / n, i % 2 ? -amp : amp);
    ctx.lineTo(L, 0);
    ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
    ctx.restore();
  };
  /* Cielo con degradado */
  D.sky = function (ctx, W, H, top = '#8FD3FF', bottom = '#E3F6FF') {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  };
  D.night = function (ctx, W, H, seed = 1, n = 60) {
    D.sky(ctx, W, H, '#14123F', '#3A2E8C');
    let s = seed * 9301 + 49297;
    const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < n; i++) { const x = rnd() * W, y = rnd() * H, r = 0.6 + rnd() * 1.6; D.circle(ctx, x, y, r, `rgba(255,255,255,${0.4 + rnd() * 0.6})`); }
  };
  D.cloud = function (ctx, x, y, s = 1, a = 0.95) {
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x, y, 18 * s, 0, M.TAU); ctx.arc(x + 20 * s, y - 10 * s, 22 * s, 0, M.TAU); ctx.arc(x + 44 * s, y, 18 * s, 0, M.TAU); ctx.rect(x, y - 2 * s, 44 * s, 18 * s); ctx.fill();
    ctx.restore();
  };
  D.sun = function (ctx, x, y, r = 26, t = 0) {
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = '#FFC21A'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 12; i++) { const a = (i / 12) * M.TAU + t * 0.3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * (r + 6), Math.sin(a) * (r + 6)); ctx.lineTo(Math.cos(a) * (r + 14), Math.sin(a) * (r + 14)); ctx.stroke(); }
    D.circle(ctx, 0, 0, r, '#FFD84D', '#E8A100', 3);
    ctx.restore();
  };
  D.ground = function (ctx, W, y, H, top = '#7ED957', side = '#B9824A') {
    ctx.fillStyle = side; ctx.fillRect(0, y, W, H - y);
    ctx.fillStyle = top; ctx.fillRect(0, y, W, 10);
    ctx.strokeStyle = D.INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  };
  D.grid = function (ctx, W, H, step = 50, color = 'rgba(43,35,80,.10)') {
    ctx.strokeStyle = color; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= W; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 0; y <= H; y += step) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
  };
  D.water = function (ctx, x, y, w, h, t = 0, color = 'rgba(30,136,255,.55)') {
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3; ctx.beginPath();
    for (let i = 0; i <= w; i += 8) { const yy = y + 3 + Math.sin((i + t * 60) / 14) * 2.5; i ? ctx.lineTo(x + i, yy) : ctx.moveTo(x + i, yy); }
    ctx.stroke(); ctx.restore();
  };
  /* Personaje en el lienzo */
  D.char = function (ctx, id, x, y, size = 80, mood = 'happy', flip = false) {
    const img = FK.charImg(id, mood);
    if (!img.complete || !img.naturalWidth) return false;
    ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
    ctx.drawImage(img, -size / 2, -size / 2, size, size); ctx.restore();
    return true;
  };
  D.shadow = function (ctx, x, y, rx, ry = rx * 0.25) {
    ctx.save(); ctx.fillStyle = 'rgba(43,35,80,.22)'; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, M.TAU); ctx.fill(); ctx.restore();
  };
  /* Escala de colores cálido/frío para temperaturas 0..1 */
  D.heat = function (t) {
    t = M.clamp(t, 0, 1);
    const stops = [[0, [60, 90, 255]], [0.3, [40, 200, 230]], [0.5, [120, 220, 90]], [0.7, [255, 210, 40]], [1, [255, 60, 50]]];
    for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1], [t1, c1] = stops[i], k = (t - t0) / (t1 - t0);
      return `rgb(${Math.round(c0[0] + (c1[0] - c0[0]) * k)},${Math.round(c0[1] + (c1[1] - c0[1]) * k)},${Math.round(c0[2] + (c1[2] - c0[2]) * k)})`;
    }
    return 'rgb(255,60,50)';
  };
  /* Color de una longitud de onda visible (nm) → rgb */
  D.wave = function (nm) {
    let r = 0, g = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; }
    else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
    else if (nm <= 750) { r = 1; }
    let f = 1;
    if (nm < 420) f = 0.3 + (0.7 * (nm - 380)) / 40; else if (nm > 700) f = 0.3 + (0.7 * (750 - nm)) / 50;
    const c = (x) => Math.round(255 * Math.pow(Math.max(0, x) * f, 0.8));
    return `rgb(${c(r)},${c(g)},${c(b)})`;
  };
})();
