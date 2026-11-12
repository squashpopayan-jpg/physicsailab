/* ===================================================================
   40-draw.js — Dibujo realista (EM.dw): protoboard, cables, tomas, puntas y utilidades.
   Todo se dibuja en milímetros con una transformación de lienzo (escala px/mm).
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM;
  const BB = EM.bb;
  const DW = (EM.dw = {});
  const TAU = Math.PI * 2;

  /* ---------- utilidades ---------- */
  DW.rr = function (ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  DW.lin = function (ctx, x0, y0, x1, y1, stops) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    return g;
  };
  DW.rad = function (ctx, x, y, r0, r1, stops) {
    const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
    stops.forEach(([o, c]) => g.addColorStop(o, c));
    return g;
  };
  DW.shadow = function (ctx, blur = 1.2, dx = 0.4, dy = 0.7, a = 0.28) {
    ctx.shadowColor = `rgba(20,16,10,${a})`; ctx.shadowBlur = blur; ctx.shadowOffsetX = dx; ctx.shadowOffsetY = dy;
  };
  DW.noShadow = function (ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; };
  DW.text = function (ctx, s, x, y, size, color, o = {}) {
    ctx.save();
    ctx.font = `${o.weight || 600} ${size}px ${o.mono ? EM.FONT_MONO : EM.FONT_UI}`;
    ctx.fillStyle = color; ctx.textAlign = o.align || 'center'; ctx.textBaseline = o.base || 'middle';
    if (o.rot) { ctx.translate(x, y); ctx.rotate(o.rot); ctx.fillText(s, 0, 0); } else ctx.fillText(s, x, y);
    ctx.restore();
  };
  DW.hex2rgb = function (h) {
    if (h.startsWith('rgb')) { const m = h.match(/\d+/g); return [+m[0], +m[1], +m[2]]; }
    if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
    const v = parseInt(h.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  };
  DW.mixc = function (a, b, t) { const A = DW.hex2rgb(a), B = DW.hex2rgb(b); return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)})`; };
  DW.rgba = function (h, a) { const c = DW.hex2rgb(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
  DW.METAL = '#b9bdc4';

  /* pata de metal */
  DW.lead = function (ctx, x0, y0, x1, y1, w = 0.5) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(30,25,15,.35)'; ctx.lineWidth = w + 0.35;
    ctx.beginPath(); ctx.moveTo(x0 + 0.2, y0 + 0.3); ctx.lineTo(x1 + 0.2, y1 + 0.3); ctx.stroke();
    ctx.strokeStyle = '#a7abb3'; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = '#e4e7ec'; ctx.lineWidth = w * 0.35;
    ctx.beginPath(); ctx.moveTo(x0 - w * 0.12, y0 - w * 0.12); ctx.lineTo(x1 - w * 0.12, y1 - w * 0.12); ctx.stroke();
    ctx.restore();
  };

  /* ---------- Protoboard ---------- */
  const boardCache = new Map();
  DW.boardBitmap = function (kind, scale, dpr) {
    const key = kind + '|' + scale.toFixed(2) + '|' + dpr + '|' + (EM.isDark ? EM.isDark() : 0);
    if (boardCache.has(key)) return boardCache.get(key);
    const k = BB.KINDS[kind], pad = 3;
    const W = Math.ceil((k.w + pad * 2) * scale * dpr), H = Math.ceil((k.h + pad * 2) * scale * dpr);
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    ctx.scale(scale * dpr, scale * dpr); ctx.translate(pad, pad);
    drawBoardBase(ctx, kind);
    const o = { cv, pad, w: k.w + pad * 2, h: k.h + pad * 2 };
    if (boardCache.size > 12) boardCache.clear();
    boardCache.set(key, o);
    return o;
  };
  function drawBoardBase(ctx, kind) {
    const k = BB.KINDS[kind], Y = BB.ROW_Y;
    ctx.save();
    DW.shadow(ctx, 2.2, 0.5, 1.1, 0.34);
    DW.rr(ctx, 0, 0, k.w, k.h, 1.6);
    ctx.fillStyle = DW.lin(ctx, 0, 0, k.w, k.h, [[0, '#f7f4ea'], [1, '#e6e1d1']]);
    ctx.fill();
    DW.noShadow(ctx);
    ctx.lineWidth = 0.25; ctx.strokeStyle = '#bfb9a6'; ctx.stroke();
    const cy0 = Y.f + 1.55, cy1 = Y.e - 1.55;
    ctx.fillStyle = DW.lin(ctx, 0, cy0, 0, cy1, [[0, '#cfc9b6'], [0.5, '#dbd6c5'], [1, '#cdc7b4']]);
    ctx.fillRect(1.6, cy0, k.w - 3.2, cy1 - cy0);
    ctx.fillStyle = 'rgba(80,70,50,.18)'; ctx.fillRect(1.6, cy0, k.w - 3.2, 0.35); ctx.fillRect(1.6, cy1 - 0.3, k.w - 3.2, 0.3);
    if (k.rail) {
      const x0 = BB.holePos(kind, 'T+1')[0] - 2, x1 = BB.holePos(kind, 'T+' + k.rail)[0] + 2;
      ctx.lineWidth = 0.34; ctx.lineCap = 'round';
      const ln = (y, c) => { ctx.strokeStyle = c; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); };
      ln(Y['T+'] - 1.7, '#d63a30'); ln(Y['T-'] + 1.7, '#2a61c9'); ln(Y['B-'] - 1.7, '#2a61c9'); ln(Y['B+'] + 1.7, '#d63a30');
      const sg = (s, x, y, c) => DW.text(ctx, s, x, y, 2.2, c, { weight: 800 });
      for (const [xx, off] of [[x0, -1.2], [x1, 1.2]]) { sg('+', xx + off, Y['T+'], '#d63a30'); sg('−', xx + off, Y['T-'], '#2a61c9'); sg('−', xx + off, Y['B-'], '#2a61c9'); sg('+', xx + off, Y['B+'], '#d63a30'); }
    }
    const hole = (x, y) => {
      ctx.fillStyle = '#6d6a5b'; DW.rr(ctx, x - 0.62, y - 0.62, 1.24, 1.24, 0.22); ctx.fill();
      ctx.fillStyle = '#1d1c19'; DW.rr(ctx, x - 0.5, y - 0.5, 1.0, 1.0, 0.18); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(x - 0.45, y + 0.28, 0.9, 0.12);
    };
    for (const h of BB.allHoles(kind)) { const [x, y] = BB.holePos(kind, h); hole(x, y); }
    const gray = '#8f897a';
    for (let c = 1; c <= k.cols; c++) if (c === 1 || c % 5 === 0) {
      const [x] = BB.holePos(kind, 'a' + c);
      DW.text(ctx, String(c), x, Y.j - 2.45, 1.75, gray, { weight: 700 });
      DW.text(ctx, String(c), x, Y.a + 2.45, 1.75, gray, { weight: 700 });
    }
    for (const r of ['j', 'i', 'h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']) {
      const [x] = BB.holePos(kind, r + '1');
      DW.text(ctx, r, x - 3.0, Y[r], 1.75, gray, { weight: 700 });
      const [x2] = BB.holePos(kind, r + k.cols);
      DW.text(ctx, r, x2 + 3.0, Y[r], 1.75, gray, { weight: 700 });
    }
    ctx.restore();
  }
  DW.board = function (ctx, b, view) {
    const bm = DW.boardBitmap(b.kind, view.scale, view.dpr);
    ctx.drawImage(bm.cv, b.x - bm.pad, b.y - bm.pad, bm.w, bm.h);
  };
  /* Rectángulo de una tira (columna o riel) en coordenadas locales de la placa */
  DW.stripRect = function (kind, hole) {
    const p = BB.parse(hole), k = BB.KINDS[kind], Y = BB.ROW_Y;
    if (p.kind === 'main') {
      const [x] = BB.holePos(kind, 'a' + p.col);
      const top = ['j', 'i', 'h', 'g', 'f'].includes(p.row);
      const yj = BB.holePos(kind, 'j' + p.col)[1], yf = BB.holePos(kind, 'f' + p.col)[1], ye = BB.holePos(kind, 'e' + p.col)[1], ya = BB.holePos(kind, 'a' + p.col)[1];
      const y0 = top ? yj - 1.4 : ye - 1.4, y1 = top ? yf + 1.4 : ya + 1.4;
      return [x - 1.3, y0, 2.6, y1 - y0];
    }
    const x0 = BB.holePos(kind, p.side + p.pol + '1')[0], x1 = BB.holePos(kind, p.side + p.pol + k.rail)[0], y = Y[p.side + p.pol];
    return [x0 - 1.4, y - 1.3, x1 - x0 + 2.8, 2.6];
  };
  DW.hiliteStrip = function (ctx, b, hole, color = 'rgba(255,170,0,.35)') {
    const r = DW.stripRect(b.kind, hole);
    ctx.save(); ctx.translate(b.x, b.y);
    ctx.fillStyle = color; DW.rr(ctx, r[0], r[1], r[2], r[3], 0.8); ctx.fill();
    ctx.restore();
  };

  /* ---------- Cable (jumper) ---------- */
  DW.WIRE_COLORS = { red: '#d73a31', black: '#1e1e22', yellow: '#e8b50f', green: '#2a8f3d', blue: '#2a62d4', orange: '#e9772a', purple: '#8d45c8', white: '#f1f1ee', brown: '#7a4a21', gray: '#8a8f98' };
  DW.wire = function (ctx, a, b, color, o = {}) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
    const lift = Math.min(10, 2 + L * 0.28) * (o.lift === undefined ? 1 : o.lift) * (o.flat ? 0.15 : 1);
    const dir = o.dir === undefined ? -1 : o.dir;
    const c1x = a[0] + dx * 0.15, c1y = a[1] + dir * lift * 1.1, c2x = b[0] - dx * 0.15, c2y = b[1] + dir * lift * 1.1;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const path = () => { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.bezierCurveTo(c1x, c1y, c2x, c2y, b[0], b[1]); };
    const lw = o.w || 1.5;
    if (!o.noShadow) { ctx.strokeStyle = 'rgba(25,20,10,.28)'; ctx.lineWidth = lw; ctx.translate(0.5, 0.9); path(); ctx.stroke(); ctx.translate(-0.5, -0.9); }
    ctx.strokeStyle = DW.mixc(color, '#000000', 0.38); ctx.lineWidth = lw; path(); ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = lw * 0.77; path(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.42)'; ctx.lineWidth = 0.32; ctx.translate(-0.2, -0.28); path(); ctx.stroke(); ctx.translate(0.2, 0.28);
    if (!o.noPlug) for (const p of [a, b]) {
      ctx.fillStyle = DW.mixc(color, '#000000', 0.2); ctx.beginPath(); ctx.arc(p[0], p[1], 0.95, 0, TAU); ctx.fill();
      ctx.fillStyle = '#c9cdd3'; ctx.beginPath(); ctx.arc(p[0], p[1], 0.52, 0, TAU); ctx.fill();
    }
    ctx.restore();
    return { path, a, b, c1: [c1x, c1y], c2: [c2x, c2y] };
  };
  DW.bez = function (w, t) {
    const u = 1 - t;
    return [u * u * u * w.a[0] + 3 * u * u * t * w.c1[0] + 3 * u * t * t * w.c2[0] + t * t * t * w.b[0], u * u * u * w.a[1] + 3 * u * u * t * w.c1[1] + 3 * u * t * t * w.c2[1] + t * t * t * w.b[1]];
  };
  /* punto del cable más cercano a (x,y) para seleccionarlo: devuelve distancia */
  DW.wireDist = function (w, x, y) {
    let best = 1e9;
    for (let t = 0; t <= 1.0001; t += 0.05) { const q = DW.bez(w, t); const d = Math.hypot(q[0] - x, q[1] - y); if (d < best) best = d; }
    return best;
  };

  /* ---------- Tomas de los instrumentos (bananas / BNC) ---------- */
  DW.jack = function (ctx, x, y, color, label, o = {}) {
    ctx.save();
    ctx.translate(x, y);
    ctx.save(); DW.shadow(ctx, 1.2, 0.3, 0.6, 0.4);
    ctx.beginPath(); ctx.arc(0, 0, 3.6, 0, TAU); ctx.fillStyle = DW.rad(ctx, -1, -1, 0.4, 3.8, [[0, '#7a7f89'], [1, '#2b2e34']]); ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(0, 0, 2.9, 0, TAU); ctx.fillStyle = color; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, 2.9, 0, TAU); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 0.3; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 1.25, 0, TAU); ctx.fillStyle = '#0b0c0e'; ctx.fill();
    ctx.beginPath(); ctx.arc(-0.35, -0.35, 0.5, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fill();
    if (o.hot) { ctx.beginPath(); ctx.arc(0, 0, 4.6, 0, TAU); ctx.strokeStyle = 'rgba(255,200,40,.95)'; ctx.lineWidth = 0.5; ctx.stroke(); }
    ctx.restore();
    if (label) DW.text(ctx, label, x + (o.lx || 0), y + (o.ly === undefined ? 6.2 : o.ly), 2.3, o.labelColor || 'rgba(255,255,255,.85)', { weight: 800 });
  };
  /* Placa frontal de un instrumento en el banco (solo las tomas, el aparato está en el panel) */
  DW.plate = function (ctx, x, y, w, h, title) {
    ctx.save();
    ctx.save(); DW.shadow(ctx, 1.6, 0.4, 0.9, 0.3);
    DW.rr(ctx, x, y, w, h, 2); ctx.fillStyle = DW.lin(ctx, 0, y, 0, y + h, [[0, '#5a606b'], [1, '#3a3e47']]); ctx.fill(); ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 0.25; DW.rr(ctx, x + 0.4, y + 0.4, w - 0.8, h - 0.8, 1.7); ctx.stroke();
    if (title) DW.text(ctx, title, x + w / 2, y + 3.2, 2.4, 'rgba(255,255,255,.8)', { weight: 800 });
    ctx.restore();
  };

  /* ---------- Puntas de medida ----------
     cable desde la toma (jack) hasta el mango; la punta apunta al punto (x,y). kind: 'tip' | 'clip' */
  DW.probeGeom = function (jack, tip, kind) {
    const len = kind === 'clip' ? 12 : 17;
    let ang = Math.atan2(jack[1] - tip[1], jack[0] - tip[0]);
    if (Math.hypot(jack[0] - tip[0], jack[1] - tip[1]) < 2) ang = -0.5;
    return { len, ang, back: [tip[0] + Math.cos(ang) * len, tip[1] + Math.sin(ang) * len] };
  };
  DW.probe = function (ctx, jack, tip, color, kind, o = {}) {
    const g = DW.probeGeom(jack, tip, kind), len = g.len, ang = g.ang, back = g.back;
    /* cable */
    DW.wire(ctx, jack, back, o.cable || '#222428', { lift: 0.45, noPlug: true, w: 1.1, dir: 1 });
    ctx.save(); ctx.translate(tip[0], tip[1]); ctx.rotate(ang);
    if (kind === 'clip') {
      /* pinza de cocodrilo */
      ctx.save(); DW.shadow(ctx, 1.2, 0.4, 0.7, 0.35);
      ctx.fillStyle = DW.lin(ctx, 0, -1.6, 0, 1.6, [[0, '#2a2d33'], [1, '#101114']]);
      ctx.beginPath(); ctx.moveTo(0, -0.4); ctx.lineTo(6, -2.0); ctx.lineTo(12, -1.8); ctx.lineTo(12, 1.8); ctx.lineTo(6, 2.0); ctx.lineTo(0, 0.4); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.fillStyle = color; DW.rr(ctx, 6, -2.1, 6, 4.2, 0.8); ctx.fill();
      ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.moveTo(-0.2, -0.45); ctx.lineTo(3, -1.1); ctx.lineTo(3, 1.1); ctx.lineTo(-0.2, 0.45); ctx.closePath(); ctx.fill();
    } else {
      ctx.save(); DW.shadow(ctx, 1.2, 0.4, 0.7, 0.35);
      ctx.fillStyle = DW.lin(ctx, 0, -1.4, 0, 1.4, [[0, DW.mixc(color, '#ffffff', 0.25)], [0.5, color], [1, DW.mixc(color, '#000000', 0.45)]]);
      ctx.beginPath(); ctx.moveTo(4, -0.7); ctx.lineTo(10, -1.35); ctx.lineTo(len, -1.5); ctx.lineTo(len, 1.5); ctx.lineTo(10, 1.35); ctx.lineTo(4, 0.7); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.moveTo(0, -0.18); ctx.lineTo(4.2, -0.65); ctx.lineTo(4.2, 0.65); ctx.lineTo(0, 0.18); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(5, -1.1, len - 6, 0.35);
    }
    ctx.restore();
    if (o.hot) { ctx.save(); ctx.strokeStyle = 'rgba(255,200,40,.95)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(tip[0], tip[1], 2.6, 0, TAU); ctx.stroke(); ctx.restore(); }
    return back;
  };
})();
