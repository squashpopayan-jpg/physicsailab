/* ===================================================================
   41-draw-parts.js — Dibujo realista de los componentes y módulos (EM.dw.part)
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM, DW = EM.dw, sp = EM.spice, PT = EM.parts;
  const TAU = Math.PI * 2;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

  /* marco local: origen en el punto medio, eje x de A hacia B */
  function frame(ctx, A, B, fn) {
    const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, L = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const th = Math.atan2(B[1] - A[1], B[0] - A[0]);
    ctx.save(); ctx.translate(mx, my); ctx.rotate(th);
    fn(L);
    ctx.restore();
    return { mx, my, th, L };
  }
  const charred = (p) => (p.dead ? 1 : clamp((p.dmg || 0), 0, 1) * 0.6);
  /* aplica ennegrecimiento a un color */
  const burn = (p, c) => (p.dead ? DW.mixc(c, '#1a1410', 0.8) : (p.dmg > 0.15 ? DW.mixc(c, '#2a1d12', clamp(p.dmg, 0, 1) * 0.55) : c));
  /* resplandor por calor */
  const heatGlow = (ctx, p, x, y, r, v) => {
    const h = clamp(((p.stress || 0) - 1) / 2, 0, 1);
    if (h <= 0.02 || p.dead) return;
    v.glows.push({ x, y, r: r * (1.6 + h), c: '#ff7a1a', a: 0.35 * h });
  };

  /* ---------- patas de un componente axial ---------- */
  function axial(ctx, A, B, bodyLen) {
    const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, L = Math.hypot(B[0] - A[0], B[1] - A[1]);
    const ux = (B[0] - A[0]) / (L || 1), uy = (B[1] - A[1]) / (L || 1);
    const h = Math.min(bodyLen, Math.max(L, bodyLen)) / 2;
    DW.lead(ctx, A[0], A[1], mx - ux * h, my - uy * h);
    DW.lead(ctx, B[0], B[1], mx + ux * h, my + uy * h);
  }

  const DRAW = {};

  /* ---------- Resistencia ---------- */
  DRAW.R = function (ctx, p, pins, v) {
    const [A, B] = pins;
    axial(ctx, A, B, 6.4);
    frame(ctx, A, B, () => {
      const R = PT.val(p, 'value'), bands = sp.bands(R, 4, PT.val(p, 'tol'));
      ctx.save(); DW.shadow(ctx, 0.8, 0.2, 0.5, 0.35);
      const base = burn(p, '#e0c28a');
      ctx.beginPath(); ctx.moveTo(-2.3, -1.15); ctx.quadraticCurveTo(-3.3, -1.7, -3.1, 0); ctx.quadraticCurveTo(-3.3, 1.7, -2.3, 1.15); ctx.lineTo(2.3, 1.15); ctx.quadraticCurveTo(3.3, 1.7, 3.1, 0); ctx.quadraticCurveTo(3.3, -1.7, 2.3, -1.15); ctx.closePath();
      ctx.fillStyle = DW.lin(ctx, 0, -1.7, 0, 1.7, [[0, DW.mixc(base, '#ffffff', 0.35)], [0.5, base], [1, DW.mixc(base, '#6a4a1a', 0.45)]]);
      ctx.fill(); DW.noShadow(ctx); ctx.restore();
      const xs = [-1.9, -1.0, -0.1, 2.0];
      bands.forEach((ci, k) => {
        ctx.fillStyle = burn(p, sp.COLORS[ci].hex);
        ctx.fillRect(xs[k] - 0.28, -1.12, 0.56, 2.24);
      });
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-2.5, -1.0, 5.0, 0.35);
      if (p.dead) { ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(-0.6, -1.2, 1.4, 2.4); }
    });
    const mid = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
    heatGlow(ctx, p, mid[0], mid[1], 3.2, v);
  };
  /* ---------- Diodo ---------- */
  DRAW.D = function (ctx, p, pins, v) {
    const [A, B] = pins; /* ánodo, cátodo */
    axial(ctx, A, B, 5.4);
    frame(ctx, A, B, () => {
      const glass = PT.val(p, 'model') === '1N4148';
      ctx.save(); DW.shadow(ctx, 0.8, 0.2, 0.5, 0.35);
      DW.rr(ctx, -2.7, -1.2, 5.4, 2.4, 0.7);
      ctx.fillStyle = glass ? DW.lin(ctx, 0, -1.2, 0, 1.2, [[0, '#f0b968'], [1, '#a9672a']]) : DW.lin(ctx, 0, -1.2, 0, 1.2, [[0, '#3a3c42'], [0.5, '#1d1e22'], [1, '#0e0f12']]);
      ctx.fillStyle = burn(p, ctx.fillStyle); ctx.fill(); DW.noShadow(ctx); ctx.restore();
      ctx.fillStyle = glass ? '#17171a' : '#cfd2d8'; ctx.fillRect(1.55, -1.2, 0.75, 2.4);
      ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(-2.5, -1.0, 4.6, 0.3);
      if (!glass) DW.text(ctx, '4007', -0.6, 0.1, 0.85, 'rgba(235,235,235,.8)', { weight: 700 });
    });
    heatGlow(ctx, p, (A[0] + B[0]) / 2, (A[1] + B[1]) / 2, 3, v);
  };
  DRAW.ZENER = function (ctx, p, pins, v) {
    const [A, B] = pins;
    axial(ctx, A, B, 5.0);
    frame(ctx, A, B, () => {
      ctx.save(); DW.shadow(ctx, 0.8, 0.2, 0.5, 0.35);
      DW.rr(ctx, -2.5, -1.15, 5, 2.3, 0.9); ctx.fillStyle = burn(p, DW.lin(ctx, 0, -1.2, 0, 1.2, [[0, '#f3d79a'], [0.5, '#c79a46'], [1, '#6a4a1c']])); ctx.fill(); DW.noShadow(ctx); ctx.restore();
      ctx.fillStyle = '#1a1a1d'; ctx.fillRect(1.5, -1.15, 0.7, 2.3);
      DW.text(ctx, PT.val(p, 'vz') + 'V', -0.5, 0.05, 0.85, '#2a2012', { weight: 700 });
    });
  };
  DRAW.FUSE = function (ctx, p, pins, v) {
    const [A, B] = pins;
    axial(ctx, A, B, 7.0);
    frame(ctx, A, B, () => {
      ctx.save(); DW.shadow(ctx, 0.8, 0.2, 0.5, 0.3);
      DW.rr(ctx, -3.5, -1.5, 7, 3, 0.9); ctx.fillStyle = 'rgba(210,235,245,.55)'; ctx.fill(); DW.noShadow(ctx);
      ctx.strokeStyle = 'rgba(80,100,110,.8)'; ctx.lineWidth = 0.2; ctx.stroke(); ctx.restore();
      ctx.fillStyle = DW.METAL; ctx.fillRect(-3.8, -1.5, 1.2, 3); ctx.fillRect(2.6, -1.5, 1.2, 3);
      ctx.strokeStyle = p.blown ? '#444' : '#d8d8d8'; ctx.lineWidth = 0.18;
      ctx.beginPath(); if (p.blown) { ctx.moveTo(-2.6, 0); ctx.lineTo(-0.9, 0.1); ctx.moveTo(0.9, -0.1); ctx.lineTo(2.6, 0); ctx.fillStyle = 'rgba(30,20,10,.5)'; ctx.fillRect(-1.5, -1.3, 3, 2.6); } else { ctx.moveTo(-2.6, 0); ctx.lineTo(2.6, 0); } ctx.stroke();
      DW.text(ctx, (PT.val(p, 'rating') * 1000).toFixed(0) + 'mA', 0, 2.25, 0.85, '#556', { weight: 700 });
    });
  };
  DRAW.JUMPER = function (ctx, p, pins, v) {
    const [A, B] = pins;
    const w = DW.wire(ctx, A, B, '#8a8f98', { lift: 0.4 });
    void w;
  };
  /* ---------- LED ---------- */
  DRAW.LED = function (ctx, p, pins, v) {
    const [A, K] = pins;
    const col = (sp.LEDS[PT.val(p, 'color')] || sp.LEDS.rojo).hex;
    const I = p.dead ? 0 : (v.bench.partCurrent(p) || 0);
    const br = p.dead ? 0 : clamp(Math.pow(Math.max(0, I) / 0.02, 0.62), 0, 1.5);
    const mx = (A[0] + K[0]) / 2, my = (A[1] + K[1]) / 2;
    /* patas */
    const dx = K[0] - A[0], dy = K[1] - A[1], L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L;
    DW.lead(ctx, A[0], A[1], mx - ux * 0.9, my - uy * 0.9, 0.5);
    DW.lead(ctx, K[0], K[1], mx + ux * 0.9, my + uy * 0.9, 0.5);
    ctx.save(); ctx.translate(mx, my); ctx.rotate(Math.atan2(dy, dx));
    /* base con borde plano en el cátodo */
    ctx.save(); DW.shadow(ctx, 1.0, 0.3, 0.6, 0.35);
    ctx.beginPath(); ctx.arc(0, 0, 2.9, 0, TAU);
    ctx.fillStyle = p.dead ? '#3a332c' : DW.mixc(col, '#ffffff', 0.35 - clamp(br, 0, 1) * 0.1); ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1; ctx.restore();
    /* cuerpo de epoxi translúcido */
    const g = ctx.createRadialGradient(-0.7, -0.9, 0.2, 0, 0, 2.7);
    const base = p.dead ? '#2c2723' : col;
    const on = br > 0.02;
    g.addColorStop(0, on ? DW.mixc(base, '#ffffff', 0.78) : DW.mixc(base, '#ffffff', 0.4));
    g.addColorStop(0.55, on ? DW.mixc(base, '#ffffff', 0.25 * (1.2 - clamp(br, 0, 1))) : DW.mixc(base, '#2a2a2a', 0.18));
    g.addColorStop(1, on ? DW.mixc(base, '#000000', 0.15) : DW.mixc(base, '#1a1a1a', 0.45));
    ctx.beginPath(); ctx.arc(0, 0, 2.55, 0, TAU); ctx.fillStyle = g; ctx.globalAlpha = on ? 1 : 0.88; ctx.fill(); ctx.globalAlpha = 1;
    /* yunque y cátodo plano */
    ctx.fillStyle = 'rgba(120,120,120,.45)'; ctx.fillRect(-0.55, -1.2, 0.5, 2.0); ctx.fillRect(0.3, -0.7, 0.5, 1.4);
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(2.35, -2.4, 0.45, 4.8);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 0.18; ctx.beginPath(); ctx.arc(0, 0, 2.55, 3.6, 4.9); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(-0.9, -1.1, 0.65, 0.4, -0.7, 0, TAU); ctx.fill();
    ctx.restore();
    if (br > 0.02) v.glows.push({ x: mx, y: my, r: 5 + br * 6, c: col, a: clamp(0.35 + br * 0.45, 0, 1) });
    heatGlow(ctx, p, mx, my, 3, v);
  };
  /* ---------- Condensadores ---------- */
  DRAW.ECAP = function (ctx, p, pins, v) {
    const [A, B] = pins;
    const C = PT.val(p, 'value'), r = clamp(2.2 + Math.sqrt(C * 1e6) * 0.12, 2.6, 6.0), h = r * 2.0;
    const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, ang = Math.atan2(B[1] - A[1], B[0] - A[0]);
    DW.lead(ctx, A[0], A[1], mx - Math.cos(ang) * r * 0.6, my - Math.sin(ang) * r * 0.6, 0.5);
    DW.lead(ctx, B[0], B[1], mx + Math.cos(ang) * r * 0.6, my + Math.sin(ang) * r * 0.6, 0.5);
    ctx.save(); ctx.translate(mx, my); ctx.rotate(ang);
    ctx.save(); DW.shadow(ctx, 1.4, 0.4, 0.8, 0.4);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = burn(p, '#1b3fa8'); ctx.fill(); ctx.restore();
    const body = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
    body.addColorStop(0, burn(p, '#3a62d4')); body.addColorStop(0.7, burn(p, '#21429f')); body.addColorStop(1, burn(p, '#142b73'));
    ctx.beginPath(); ctx.arc(0, 0, r - 0.15, 0, TAU); ctx.fillStyle = body; ctx.fill();
    /* franja del negativo */
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r - 0.15, 0, TAU); ctx.clip();
    ctx.fillStyle = burn(p, '#d9dde3'); ctx.fillRect(r * 0.42, -r, r, 2 * r);
    ctx.fillStyle = burn(p, '#2a2c33');
    for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.arc(r * 0.82, k * r * 0.34, r * 0.11, 0, TAU); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 0.2; ctx.beginPath(); ctx.arc(0, 0, r - 0.4, 3.6, 5.2); ctx.stroke();
    DW.text(ctx, (C >= 1e-6 ? (C * 1e6) + 'µF' : C * 1e9 + 'nF'), -r * 0.25, -0.35, Math.min(1.5, r * 0.34), '#e8edf9', { weight: 800 });
    DW.text(ctx, PT.val(p, 'vmax') + 'V', -r * 0.25, r * 0.38, Math.min(1.4, r * 0.3), '#cbd4ee', { weight: 700 });
    if (p.dead) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.arc(0, 0, r - 0.2, 0, TAU); ctx.fill(); DW.text(ctx, '✕', 0, 0, r * 0.9, '#c9a064', { weight: 800 }); }
    ctx.restore();
    /* indicador de carga: borde brillante */
    heatGlow(ctx, p, mx, my, r, v);
  };
  DRAW.C = function (ctx, p, pins, v) {
    const [A, B] = pins;
    const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, ang = Math.atan2(B[1] - A[1], B[0] - A[0]);
    DW.lead(ctx, A[0], A[1], mx - Math.cos(ang) * 1.6, my - Math.sin(ang) * 1.6, 0.5);
    DW.lead(ctx, B[0], B[1], mx + Math.cos(ang) * 1.6, my + Math.sin(ang) * 1.6, 0.5);
    ctx.save(); ctx.translate(mx, my); ctx.rotate(ang);
    ctx.save(); DW.shadow(ctx, 1.0, 0.3, 0.7, 0.35);
    ctx.beginPath(); ctx.moveTo(-2.4, 1.5); ctx.bezierCurveTo(-3.0, -1.8, -1.6, -3.0, 0, -3.0); ctx.bezierCurveTo(1.6, -3.0, 3.0, -1.8, 2.4, 1.5); ctx.closePath();
    ctx.fillStyle = DW.lin(ctx, 0, -3, 0, 1.5, [[0, burn(p, '#f2b24d')], [1, burn(p, '#c8801f')]]); ctx.fill(); DW.noShadow(ctx); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(-0.8, -1.9, 0.9, 0.5, -0.5, 0, TAU); ctx.fill();
    const C = PT.val(p, 'value'); const code = (() => { const pf = C * 1e12; const e = Math.floor(Math.log10(pf)); const m = Math.round(pf / Math.pow(10, e - 1)); return String(m) + (e - 1); })();
    DW.text(ctx, code, 0, -0.9, 1.35, '#4a2f08', { weight: 800 });
    ctx.restore();
  };
  /* ---------- Pulsador, interruptor ---------- */
  DRAW.BTN = function (ctx, p, pins, v) {
    const cx = (pins[0][0] + pins[1][0] + pins[2][0] + pins[3][0]) / 4, cy = (pins[0][1] + pins[1][1] + pins[2][1] + pins[3][1]) / 4;
    for (const q of pins) {
      const dx = q[0] - cx, dy = q[1] - cy, L = Math.hypot(dx, dy) || 1;
      DW.lead(ctx, q[0], q[1], cx + dx / L * 2.3, cy + dy / L * 2.3, 0.55);
    }
    ctx.save(); ctx.translate(cx, cy);
    ctx.save(); DW.shadow(ctx, 1.4, 0.4, 0.8, 0.4);
    DW.rr(ctx, -3.1, -3.1, 6.2, 6.2, 0.6); ctx.fillStyle = DW.lin(ctx, -3, -3, 3, 3, [[0, '#4b4e55'], [1, '#232529']]); ctx.fill(); ctx.restore();
    ctx.fillStyle = DW.lin(ctx, -3, -3, 3, 3, [[0, '#dfe2e7'], [1, '#9a9fa8']]); DW.rr(ctx, -2.65, -2.65, 5.3, 5.3, 0.4); ctx.fill();
    for (const [x, y] of [[-2.0, -2.0], [2.0, -2.0], [-2.0, 2.0], [2.0, 2.0]]) { ctx.fillStyle = '#666a72'; ctx.beginPath(); ctx.arc(x, y, 0.3, 0, TAU); ctx.fill(); }
    const pr = !!p.pressed, rr = pr ? 1.55 : 1.85;
    const col = p.cap || '#1f232b';
    ctx.save(); if (!pr) DW.shadow(ctx, 0.9, 0.2, 0.5, 0.45);
    ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.fillStyle = DW.rad(ctx, -0.5, -0.6, 0.1, rr, [[0, pr ? DW.mixc(col, '#000', 0.2) : DW.mixc(col, '#fff', 0.35)], [1, DW.mixc(col, '#000', pr ? 0.3 : 0.1)]]); ctx.fill(); ctx.restore();
    ctx.restore();
    if (v.hover === p.id) { ctx.save(); ctx.strokeStyle = 'rgba(255,200,40,.9)'; ctx.lineWidth = 0.35; ctx.beginPath(); ctx.arc(cx, cy, 4.6, 0, TAU); ctx.stroke(); ctx.restore(); }
    v.hit.push({ id: p.id, kind: 'btn', x: cx, y: cy, r: 4.2 });
  };
  DRAW.SW = function (ctx, p, pins, v) {
    const [A, B] = pins;
    const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, ang = Math.atan2(B[1] - A[1], B[0] - A[0]);
    axial(ctx, A, B, 8);
    ctx.save(); ctx.translate(mx, my); ctx.rotate(ang);
    ctx.save(); DW.shadow(ctx, 1.2, 0.3, 0.7, 0.4);
    DW.rr(ctx, -4.2, -2.2, 8.4, 4.4, 0.5); ctx.fillStyle = DW.lin(ctx, 0, -2.2, 0, 2.2, [[0, '#3b3e45'], [1, '#1a1b1f']]); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#0c0d10'; DW.rr(ctx, -2.6, -0.9, 5.2, 1.8, 0.5); ctx.fill();
    const x = p.closed ? 1.1 : -1.1;
    ctx.fillStyle = DW.lin(ctx, 0, -2, 0, 2, [[0, '#f2f3f5'], [1, '#aeb2ba']]); DW.rr(ctx, x - 1.1, -1.35, 2.2, 2.7, 0.4); ctx.fill();
    ctx.restore();
    v.hit.push({ id: p.id, kind: 'sw', x: mx, y: my, r: 5 });
  };
  /* ---------- Potenciómetro (trimmer) ---------- */
  DRAW.POT = function (ctx, p, pins, v) {
    const cx = pins.reduce((s, q) => s + q[0], 0) / 3, cy = pins.reduce((s, q) => s + q[1], 0) / 3 - 1.2;
    pins.forEach((q) => DW.lead(ctx, q[0], q[1], cx + (q[0] - cx) * 0.75, cy + 3.0, 0.55));
    ctx.save(); ctx.translate(cx, cy);
    ctx.save(); DW.shadow(ctx, 1.4, 0.4, 0.8, 0.4);
    DW.rr(ctx, -4.6, -4.6, 9.2, 9.2, 0.7); ctx.fillStyle = DW.lin(ctx, -4, -4, 4, 4, [[0, '#2f6fd1'], [1, '#17409a']]); ctx.fill(); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(-4.2, -4.2, 8.4, 0.5);
    ctx.fillStyle = '#d8d9dd'; ctx.beginPath(); ctx.arc(0, 0, 2.9, 0, TAU); ctx.fill();
    ctx.fillStyle = DW.rad(ctx, -0.8, -0.9, 0.2, 2.8, [[0, '#f8e7a8'], [1, '#a8863a']]); ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, TAU); ctx.fill();
    const a = -2.35 + PT.val(p, 'pos') * 4.7;
    ctx.save(); ctx.rotate(a);
    ctx.fillStyle = '#5a4814'; ctx.fillRect(-2.2, -0.3, 4.4, 0.6);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-2.2, -0.3, 4.4, 0.15);
    ctx.restore();
    DW.text(ctx, sp.fmtR(PT.val(p, 'value')).replace(' ', ''), 0, 6.2, 1.3, '#556', { weight: 700 });
    ctx.restore();
    v.hit.push({ id: p.id, kind: 'pot', x: cx, y: cy, r: 4.8 });
  };
  /* ---------- LDR y NTC ---------- */
  DRAW.LDR = function (ctx, p, pins, v) {
    const [A, B] = pins;
    const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
    DW.lead(ctx, A[0], A[1], mx - 1.2, my, 0.5); DW.lead(ctx, B[0], B[1], mx + 1.2, my, 0.5);
    ctx.save(); ctx.translate(mx, my);
    ctx.save(); DW.shadow(ctx, 1, 0.3, 0.6, 0.35);
    ctx.beginPath(); ctx.arc(0, 0, 2.7, 0, TAU); ctx.fillStyle = '#b89155'; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(0, 0, 2.4, 0, TAU); ctx.fillStyle = DW.rad(ctx, -0.5, -0.5, 0.2, 2.5, [[0, '#f0d9a6'], [1, '#c4a062']]); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 2.3, 0, TAU); ctx.clip();
    ctx.strokeStyle = '#3a2b12'; ctx.lineWidth = 0.28; ctx.beginPath();
    for (let k = -4; k <= 4; k++) { const y = k * 0.52; if (k % 2 === 0) { ctx.moveTo(-2.4, y); ctx.lineTo(2.4, y); } else { ctx.moveTo(2.4, y); ctx.lineTo(-2.4, y); } }
    ctx.stroke(); ctx.restore();
    ctx.restore();
  };
  DRAW.NTC = function (ctx, p, pins, v) {
    const [A, B] = pins;
    const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
    DW.lead(ctx, A[0], A[1], mx - 0.8, my + 0.6, 0.45); DW.lead(ctx, B[0], B[1], mx + 0.8, my + 0.6, 0.45);
    ctx.save(); ctx.translate(mx, my);
    ctx.save(); DW.shadow(ctx, 0.9, 0.3, 0.5, 0.35);
    ctx.beginPath(); ctx.moveTo(-1.6, 1.0); ctx.bezierCurveTo(-2.2, -2.2, 2.2, -2.2, 1.6, 1.0); ctx.closePath(); ctx.fillStyle = DW.lin(ctx, 0, -2, 0, 1.2, [[0, '#2f78d6'], [1, '#14408f']]); ctx.fill(); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(-0.5, -0.9, 0.55, 0.3, -0.5, 0, TAU); ctx.fill();
    DW.text(ctx, 'NTC', 0, 4.3, 1.1, '#667', { weight: 700 });
    ctx.restore();
  };
  /* ---------- Transistores ---------- */
  DRAW.BJT = function (ctx, p, pins, v) {
    const cx = pins[1][0], cy = pins[1][1];
    pins.forEach((q) => DW.lead(ctx, q[0], q[1], q[0] + (cx - q[0]) * 0.1, cy - 2.2, 0.5));
    ctx.save(); ctx.translate(cx, cy - 3.0);
    ctx.save(); DW.shadow(ctx, 1.1, 0.3, 0.7, 0.4);
    ctx.beginPath(); ctx.moveTo(-2.7, 1.6); ctx.lineTo(-2.7, -0.5); ctx.arc(0, -0.5, 2.7, Math.PI, 0); ctx.lineTo(2.7, 1.6); ctx.closePath();
    ctx.fillStyle = burn(p, DW.lin(ctx, -2.7, 0, 2.7, 0, [[0, '#4a4c52'], [0.35, '#232428'], [1, '#101114']])); ctx.fill(); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(-2.5, -1.2, 5.0, 0.35);
    DW.text(ctx, PT.val(p, 'model'), 0, 0.55, 1.0, 'rgba(240,240,240,.85)', { weight: 700 });
    if (p.dead) { ctx.fillStyle = 'rgba(255,120,30,.55)'; ctx.beginPath(); ctx.arc(0.8, -1.8, 0.8, 0, TAU); ctx.fill(); }
    ctx.restore();
    heatGlow(ctx, p, cx, cy - 3, 3, v);
  };
  DRAW.NMOS = function (ctx, p, pins, v) {
    const cx = pins[1][0], cy = pins[1][1];
    pins.forEach((q) => DW.lead(ctx, q[0], q[1], q[0], cy - 3.0, 0.7));
    ctx.save(); ctx.translate(cx, cy - 7.6);
    ctx.save(); DW.shadow(ctx, 1.4, 0.4, 0.9, 0.4);
    DW.rr(ctx, -5.0, -1.5, 10, 9.3, 0.5); ctx.fillStyle = burn(p, DW.lin(ctx, 0, -1, 0, 9, [[0, '#2c2d31'], [1, '#121316']])); ctx.fill(); ctx.restore();
    ctx.fillStyle = DW.lin(ctx, 0, -9, 0, -1, [[0, '#e5e7ea'], [1, '#a9aeb5']]); DW.rr(ctx, -5.0, -9.4, 10, 8.3, 0.4); ctx.fill();
    ctx.fillStyle = '#4c5057'; ctx.beginPath(); ctx.arc(0, -6.8, 1.45, 0, TAU); ctx.fill();
    DW.text(ctx, PT.val(p, 'model'), 0, 3.4, 1.55, 'rgba(240,240,240,.85)', { weight: 700 });
    ctx.restore();
    heatGlow(ctx, p, cx, cy - 7, 5, v);
  };
  /* ---------- Cargas ---------- */
  DRAW.BUZ = function (ctx, p, pins, v) {
    const [A, B] = pins;
    const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
    DW.lead(ctx, A[0], A[1], mx - 3.0, my, 0.5); DW.lead(ctx, B[0], B[1], mx + 3.0, my, 0.5);
    ctx.save(); ctx.translate(mx, my);
    ctx.save(); DW.shadow(ctx, 1.4, 0.4, 0.8, 0.4);
    ctx.beginPath(); ctx.arc(0, 0, 6.0, 0, TAU); ctx.fillStyle = DW.rad(ctx, -1.5, -1.8, 0.5, 6, [[0, '#4a4b50'], [1, '#17181b']]); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#08090b'; ctx.beginPath(); ctx.arc(0, 0, 1.0, 0, TAU); ctx.fill();
    DW.text(ctx, '+', -3.7, -3.3, 1.9, '#e6e6e6', { weight: 800 });
    const on = Math.abs(v.bench.partCurrent(p) || 0) > 0.004 && !p.dead;
    if (on) for (let k = 1; k <= 3; k++) { ctx.strokeStyle = `rgba(120,160,255,${0.5 - k * 0.12})`; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.arc(0, 0, 6.4 + k * 1.5 + ((v.t * 6) % 1.5), -0.7, 0.7); ctx.stroke(); }
    ctx.restore();
  };
  DRAW.PIEZO = function (ctx, p, pins, v) {
    const [A, B] = pins;
    const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
    DW.lead(ctx, A[0], A[1], mx - 2.6, my, 0.5); DW.lead(ctx, B[0], B[1], mx + 2.6, my, 0.5);
    ctx.save(); ctx.translate(mx, my);
    ctx.save(); DW.shadow(ctx, 1.2, 0.3, 0.7, 0.4);
    ctx.beginPath(); ctx.arc(0, 0, 5.0, 0, TAU); ctx.fillStyle = DW.rad(ctx, -1.5, -1.5, 0.5, 5, [[0, '#f0d58a'], [1, '#b08a2a']]); ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(0, 0, 3.4, 0, TAU); ctx.fillStyle = '#c9cdd3'; ctx.fill();
    ctx.restore();
  };
  DRAW.SPEAKER = function (ctx, p, pins, v) { DRAW.BUZ(ctx, p, pins, v); };
  DRAW.LAMP = function (ctx, p, pins, v) {
    const [A, B] = pins;
    const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
    DW.lead(ctx, A[0], A[1], mx - 1.4, my, 0.5); DW.lead(ctx, B[0], B[1], mx + 1.4, my, 0.5);
    const h = p.dead ? 0 : (p.heat || 0);
    ctx.save(); ctx.translate(mx, my);
    ctx.beginPath(); ctx.arc(0, 0, 4.2, 0, TAU); ctx.fillStyle = `rgba(255,${200 + 40 * h},${150 + 80 * h},${0.25 + 0.5 * h})`; ctx.fill();
    ctx.strokeStyle = 'rgba(180,190,200,.8)'; ctx.lineWidth = 0.3; ctx.stroke();
    ctx.strokeStyle = p.dead ? '#444' : DW.mixc('#6b4a2a', '#fff4b0', h); ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(-1.2, 1.6); ctx.lineTo(-0.8, -0.4); ctx.lineTo(0, 0.4); ctx.lineTo(0.8, -0.4); ctx.lineTo(1.2, 1.6); ctx.stroke();
    ctx.restore();
    if (h > 0.05) v.glows.push({ x: mx, y: my, r: 7 + 7 * h, c: '#ffd37a', a: 0.7 * h });
  };
  DRAW.RELAY = function (ctx, p, pins, v) {
    const cx = pins.reduce((s, q) => s + q[0], 0) / pins.length, cy = pins.reduce((s, q) => s + q[1], 0) / pins.length;
    pins.forEach((q) => DW.lead(ctx, q[0], q[1], cx + (q[0] - cx) * 0.4, cy, 0.5));
    ctx.save(); ctx.translate(cx, cy);
    DW.rr(ctx, -7.5, -5.5, 15, 11, 0.6); ctx.fillStyle = DW.lin(ctx, 0, -5, 0, 5, [[0, '#2a5fc2'], [1, '#183d86']]); ctx.fill();
    DW.text(ctx, 'RELÉ', 0, -1.4, 1.8, '#dfe7fb', { weight: 800 });
    DW.text(ctx, p.on ? 'ON' : 'OFF', 0, 2.2, 1.5, p.on ? '#9dffa6' : '#c3cbe0', { weight: 800 });
    ctx.restore();
  };
  DRAW.MOTOR = function (ctx, p, pins, v) {
    const at = p.at || [(pins[0][0] + pins[1][0]) / 2, (pins[0][1] + pins[1][1]) / 2 - 24];
    const rot = p.rot || 0;
    ctx.save(); ctx.translate(at[0], at[1]); ctx.rotate(rot);
    /* terminales del motor */
    const t1 = [-4, 10.5], t2 = [4, 10.5];
    ctx.save(); DW.shadow(ctx, 2, 0.6, 1.2, 0.4);
    DW.rr(ctx, -10, -12, 20, 24, 3); ctx.fillStyle = DW.lin(ctx, -10, 0, 10, 0, [[0, '#9aa0a8'], [0.25, '#dfe2e6'], [0.6, '#aeb3ba'], [1, '#7c828b']]); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#2b2d31'; DW.rr(ctx, -10, 8, 20, 4, 0); ctx.fill();
    ctx.fillStyle = '#c9ccd2'; ctx.fillRect(-1, -17, 2, 6);
    /* disco giratorio */
    const a = p.angle || 0;
    ctx.save(); ctx.translate(0, -17); ctx.rotate(a);
    ctx.fillStyle = '#e7552b'; ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(-0.7, -6, 1.4, 6);
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(-0.7, 0, 1.4, 6);
    ctx.restore();
    DW.text(ctx, 'M', 0, 0, 6, 'rgba(40,40,45,.55)', { weight: 800 });
    ctx.restore();
    /* cables del motor */
    const cosr = Math.cos(rot), sinr = Math.sin(rot);
    const tw = (t) => [at[0] + t[0] * cosr - t[1] * sinr, at[1] + t[0] * sinr + t[1] * cosr];
    DW.wire(ctx, tw(t1), pins[0], '#d73a31', { lift: 0.5 }); DW.wire(ctx, tw(t2), pins[1], '#1e1e22', { lift: 0.5 });
    p._pos = at;
  };

  /* ---------- Fuentes de energía fuera de la placa ---------- */
  DRAW.BAT = function (ctx, p, pins, v) {
    const at = p.at || [pins[0][0] - 14, pins[0][1] - 34];
    const V = PT.val(p, 'v');
    ctx.save(); ctx.translate(at[0], at[1]);
    if (V >= 8) { /* pila de 9 V */
      ctx.save(); DW.shadow(ctx, 2, 0.6, 1.2, 0.4);
      DW.rr(ctx, -13, -8, 26, 40, 2); ctx.fillStyle = DW.lin(ctx, -13, 0, 13, 0, [[0, '#1a1b1f'], [0.5, '#2a2c32'], [1, '#17181b']]); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#c8a84a'; DW.rr(ctx, -13, -2, 26, 14, 0); ctx.fill();
      ctx.fillStyle = DW.lin(ctx, 0, -8, 0, -2, [[0, '#d3d6db'], [1, '#9ea3ab']]); DW.rr(ctx, -13, -8, 26, 6, 2); ctx.fill();
      ctx.fillStyle = '#b8bcc3'; ctx.beginPath(); ctx.arc(-6, -9, 2.8, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(6, -9, 2.8, 0, TAU); ctx.fill();
      DW.text(ctx, '9V', 0, 4.5, 6, '#2a2418', { weight: 800 });
      DW.text(ctx, 'ALKALINE', 0, 15, 2.2, 'rgba(240,240,240,.6)', { weight: 700 });
    } else { /* portapilas */
      ctx.save(); DW.shadow(ctx, 2, 0.6, 1.2, 0.4);
      DW.rr(ctx, -20, -8, 40, 16, 2); ctx.fillStyle = DW.lin(ctx, 0, -8, 0, 8, [[0, '#2b2d33'], [1, '#141518']]); ctx.fill(); ctx.restore();
      for (let k = -1; k <= 1; k++) { ctx.fillStyle = DW.lin(ctx, 0, -3, 0, 3, [[0, '#d2a93b'], [1, '#8a6a1e']]); DW.rr(ctx, -17 + (k + 1) * 11.5, -5.2, 10.5, 10.4, 1.6); ctx.fill(); }
      DW.text(ctx, PT.val(p, 'name') || V + ' V', 0, 0, 3.2, '#111', { weight: 800 });
    }
    ctx.restore();
    if (p.dead) { ctx.save(); ctx.translate(at[0], at[1]); ctx.fillStyle = 'rgba(20,12,6,.55)'; DW.rr(ctx, V >= 8 ? -13 : -20, V >= 8 ? -8 : -8, V >= 8 ? 26 : 40, V >= 8 ? 40 : 16, 2); ctx.fill(); ctx.restore(); }
    const e = v.bench.c.find(p.id + ':src');
    const t1 = V >= 8 ? [at[0] - 6, at[1] - 11] : [at[0] - 17, at[1] - 10], t2 = V >= 8 ? [at[0] + 6, at[1] - 11] : [at[0] + 17, at[1] - 10];
    DW.wire(ctx, t1, pins[0], '#d73a31', { lift: 0.9 }); DW.wire(ctx, t2, pins[1], '#1e1e22', { lift: 0.9 });
    p._pos = at;
    if (e && Math.abs(e.i) > 0.8) v.glows.push({ x: at[0], y: at[1], r: 14, c: '#ff6a2a', a: clamp(Math.abs(e.i) / 5, 0.15, 0.7) });
  };
  DRAW.USB = function (ctx, p, pins, v) {
    const at = p.at || [pins[0][0] - 10, pins[0][1] - 32];
    ctx.save(); ctx.translate(at[0], at[1]);
    ctx.save(); DW.shadow(ctx, 2, 0.6, 1.2, 0.4);
    DW.rr(ctx, -12, -9, 24, 18, 2.5); ctx.fillStyle = DW.lin(ctx, 0, -9, 0, 9, [[0, '#f4f5f7'], [1, '#c9ccd2']]); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#2d3036'; DW.rr(ctx, -6, 5, 12, 5, 1); ctx.fill();
    DW.text(ctx, '5 V', 0, -1.4, 6.5, '#2a2d33', { weight: 800 });
    DW.text(ctx, p.tripped ? 'PTC disparado' : 'USB · 500 mA máx.', 0, 3.4, 1.9, p.tripped ? '#c33' : '#667', { weight: 700 });
    ctx.restore();
    DW.wire(ctx, [at[0] - 5, at[1] + 10], pins[0], '#d73a31', { lift: 0.8 }); DW.wire(ctx, [at[0] + 5, at[1] + 10], pins[1], '#1e1e22', { lift: 0.8 });
    p._pos = at;
  };
  DRAW.LAB = function (ctx, p, pins, v) {
    const at = p.at || [pins[0][0] - 16, pins[0][1] - 38];
    const e = v.bench.c.find(p.id + ':src');
    ctx.save(); ctx.translate(at[0], at[1]);
    ctx.save(); DW.shadow(ctx, 2.4, 0.7, 1.4, 0.42);
    DW.rr(ctx, -26, -14, 52, 30, 2); ctx.fillStyle = DW.lin(ctx, 0, -14, 0, 16, [[0, '#4a4e57'], [1, '#2a2d33']]); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#0a1612'; DW.rr(ctx, -22, -10, 28, 12, 1.2); ctx.fill();
    const vt = e ? e.vab : 0, ii = e ? (Math.abs(e.i) < 5e-4 ? 0 : -e.i) : 0;
    DW.text(ctx, vt.toFixed(2) + ' V', -8, -5.6, 5, '#7dffa1', { weight: 700, mono: true });
    DW.text(ctx, ii.toFixed(3) + ' A', -8, -0.2, 3.4, e && e.cc ? '#ff8d6e' : '#7dffa1', { weight: 700, mono: true });
    if (e && e.cc) DW.text(ctx, 'C.C.', 11, -6, 2.6, '#ff6e4d', { weight: 800, mono: true });
    else DW.text(ctx, 'C.V.', 11, -6, 2.6, '#7dffa1', { weight: 800, mono: true });
    for (const [x, c] of [[12, '#d73a31'], [20, '#222']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, 8, 2.8, 0, TAU); ctx.fill(); ctx.fillStyle = '#d9dde2'; ctx.beginPath(); ctx.arc(x, 8, 1.4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#c9ccd2'; ctx.beginPath(); ctx.arc(-14, 9, 3.2, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a2d33'; ctx.beginPath(); ctx.arc(-14, 9, 2.1, 0, TAU); ctx.fill(); ctx.fillStyle = '#e8e8ea'; ctx.fillRect(-14.3, 6.8, 0.6, 2.2);
    DW.text(ctx, 'FUENTE', -4, 11.5, 2, 'rgba(255,255,255,.55)', { weight: 700 });
    ctx.restore();
    DW.wire(ctx, [at[0] + 12, at[1] + 8], pins[0], '#d73a31', { lift: 0.8 }); DW.wire(ctx, [at[0] + 20, at[1] + 8], pins[1], '#1e1e22', { lift: 0.8 });
    p._pos = at;
    v.hit.push({ id: p.id, kind: 'lab', x: at[0], y: at[1], r: 18 });
  };
  DRAW.SIGGEN = function (ctx, p, pins, v) {
    const at = p.at || [pins[0][0] - 16, pins[0][1] - 38];
    ctx.save(); ctx.translate(at[0], at[1]);
    ctx.save(); DW.shadow(ctx, 2.4, 0.7, 1.4, 0.42);
    DW.rr(ctx, -24, -13, 48, 26, 2); ctx.fillStyle = DW.lin(ctx, 0, -13, 0, 13, [[0, '#33557a'], [1, '#1e3552']]); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#0a1612'; DW.rr(ctx, -20, -9, 26, 12, 1.2); ctx.fill();
    ctx.strokeStyle = '#7dffa1'; ctx.lineWidth = 0.5; ctx.beginPath();
    const f = PT.val(p, 'freq'), kind = PT.val(p, 'kind');
    for (let k = 0; k <= 60; k++) { const ph = (k / 60) * 2; const t = ph % 1; const y = kind === 'sin' ? Math.sin(ph * TAU) : kind === 'tri' ? (t < 0.5 ? 4 * t - 1 : 3 - 4 * t) : (t < PT.val(p, 'duty') ? 1 : -1); const X = -19 + k * 0.4, Y = -3 - y * 3.2; k ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
    ctx.stroke();
    DW.text(ctx, f >= 1000 ? (f / 1000) + ' kHz' : f + ' Hz', 12, -5, 3, '#7dffa1', { weight: 700, mono: true });
    DW.text(ctx, 'GEN.', 12, 4, 2.4, 'rgba(255,255,255,.7)', { weight: 800 });
    ctx.restore();
    DW.wire(ctx, [at[0] + 8, at[1] + 11], pins[0], '#e8b50f', { lift: 0.8 }); DW.wire(ctx, [at[0] + 15, at[1] + 11], pins[1], '#1e1e22', { lift: 0.8 });
    p._pos = at;
  };

  /* ---------- Módulos: disposición y dibujo ---------- */
  /* Cada módulo se dibuja con el eje de pines en y = 0 (hacia abajo) y el cuerpo sobre él (y < 0).
     off: posiciones de los pines respecto del primero. */
  const MOD = {};
  const pcb = (ctx, x, y, w, h, c1, c2, r = 1.2) => {
    ctx.save(); DW.shadow(ctx, 1.8, 0.5, 1.0, 0.4);
    DW.rr(ctx, x, y, w, h, r); ctx.fillStyle = DW.lin(ctx, x, y, x + w, y + h, [[0, c1], [1, c2]]); ctx.fill(); ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 0.2; DW.rr(ctx, x, y, w, h, r); ctx.stroke();
  };
  const pinsRow = (ctx, n, x0 = 0, y = 0) => { for (let i = 0; i < n; i++) { ctx.fillStyle = '#16171a'; ctx.fillRect(x0 + i * 2.54 - 1.27, y - 2.2, 2.54, 2.54); ctx.fillStyle = '#d6ae42'; ctx.fillRect(x0 + i * 2.54 - 0.3, y - 0.4, 0.6, 3.2); } };
  const labels = (ctx, names, x0, y, color = 'rgba(255,255,255,.95)') => names.forEach((s, i) => DW.text(ctx, s, x0 + i * 2.54, y, 0.98, color, { weight: 700 }));

  MOD.HCSR04 = {
    w: 45, h: 21, n: 4,
    draw(ctx, p, v) {
      pcb(ctx, -3.5, -22, 45, 20, '#2f6fd6', '#1a47a3');
      for (const cx of [6.5, 29.2]) {
        ctx.save(); DW.shadow(ctx, 1.4, 0.3, 0.7, 0.4);
        ctx.beginPath(); ctx.arc(cx, -12.2, 8.0, 0, TAU); ctx.fillStyle = DW.lin(ctx, cx - 8, -20, cx + 8, -4, [[0, '#d9dde2'], [1, '#8f949c']]); ctx.fill(); ctx.restore();
        ctx.beginPath(); ctx.arc(cx, -12.2, 6.4, 0, TAU); ctx.fillStyle = '#17181b'; ctx.fill();
        ctx.strokeStyle = '#3a3c42'; ctx.lineWidth = 0.28;
        for (let r = 1; r <= 4; r++) { ctx.beginPath(); ctx.arc(cx, -12.2, r * 1.5, 0, TAU); ctx.stroke(); }
        ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.ellipse(cx - 2, -15, 2.4, 1.2, -0.6, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = '#d4d7dc'; DW.rr(ctx, 14.5, -9.2, 6.2, 2.4, 1); ctx.fill();
      ctx.fillStyle = '#111'; ctx.fillRect(21, -10, 3.2, 3.6);
      DW.text(ctx, 'HC-SR04', 17.8, -17.3, 2.3, 'rgba(255,255,255,.9)', { weight: 800 });
      pinsRow(ctx, 4); labels(ctx, ['VCC', 'TRIG', 'ECHO', 'GND'], 0, -3.6);
      const pw = v.bench.modPower(p);
      if (pw.ok && p.distance !== undefined) { /* ondas */
        ctx.strokeStyle = 'rgba(80,140,255,.55)'; ctx.lineWidth = 0.3;
        const ph = (v.t * 2.2) % 1;
        for (let k = 0; k < 3; k++) { const rr = 10 + (k + ph) * 5; ctx.globalAlpha = 1 - (k + ph) / 3; ctx.beginPath(); ctx.arc(6.5, -12.2, rr, -2.2, -0.9); ctx.stroke(); ctx.beginPath(); ctx.arc(29.2, -12.2, rr, -2.2, -0.9); ctx.stroke(); }
        ctx.globalAlpha = 1;
      }
    }
  };
  MOD.DHT11 = {
    w: 16, h: 24, n: 3,
    draw(ctx, p, v) {
      const isD22 = p.type === 'DHT22';
      ctx.save(); DW.shadow(ctx, 1.6, 0.4, 0.9, 0.4);
      DW.rr(ctx, -5.2, -22, 12.4, 18, 1.0); ctx.fillStyle = isD22 ? DW.lin(ctx, 0, -22, 0, -4, [[0, '#f0f1f3'], [1, '#c9ccd2']]) : DW.lin(ctx, 0, -22, 0, -4, [[0, '#3a82e0'], [1, '#1d54ad']]); ctx.fill(); ctx.restore();
      ctx.fillStyle = 'rgba(0,0,0,.28)';
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { ctx.beginPath(); ctx.arc(-3 + c * 2.6, -19.5 + r * 2.6, 0.7, 0, TAU); ctx.fill(); }
      DW.text(ctx, isD22 ? 'DHT22' : 'DHT11', 1, -8.3, 1.7, isD22 ? '#333' : '#e6efff', { weight: 800 });
      pinsRow(ctx, 3, 0, 0); labels(ctx, ['VCC', 'DAT', 'GND'], 0, -3.0, isD22 ? '#333' : '#fff');
    }
  };
  MOD.PIR = {
    w: 33, h: 28, n: 3,
    draw(ctx, p, v) {
      pcb(ctx, -4, -30, 33, 27, '#2d8a4a', '#1b6633');
      ctx.save(); DW.shadow(ctx, 1.6, 0.4, 0.8, 0.4);
      ctx.beginPath(); ctx.arc(12.5, -17, 11, 0, TAU); ctx.fillStyle = DW.rad(ctx, 9, -21, 1, 11, [[0, '#ffffff'], [1, '#dfe2e6']]); ctx.fill(); ctx.restore();
      ctx.strokeStyle = 'rgba(160,165,175,.8)'; ctx.lineWidth = 0.25; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; ctx.beginPath(); ctx.moveTo(12.5, -17); ctx.lineTo(12.5 + Math.cos(a) * 11, -17 + Math.sin(a) * 11); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(12.5, -17, 4.5, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#d5a73a'; ctx.beginPath(); ctx.arc(-1.5, -26.5, 1.9, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(26, -26.5, 1.9, 0, TAU); ctx.fill();
      pinsRow(ctx, 3); labels(ctx, ['VCC', 'OUT', 'GND'], 0, -3.6);
      DW.text(ctx, 'HC-SR501', 12.5, -4.6, 1.5, 'rgba(255,255,255,.7)', { weight: 700 });
      if (p.motion) { v.glows.push({ x: v.cur[0] + 12.5, y: v.cur[1] - 17, r: 16, c: '#ff3b3b', a: 0.3 }); }
    }
  };
  MOD.LM35 = {
    w: 12, h: 14, n: 3,
    draw(ctx, p, v) {
      ctx.save(); DW.shadow(ctx, 1.2, 0.3, 0.7, 0.4);
      ctx.beginPath(); ctx.moveTo(-2.9, -3.2); ctx.lineTo(-2.9, -7); ctx.arc(2.54, -7, 5.4, Math.PI, 0); ctx.lineTo(8, -3.2); ctx.closePath(); ctx.fillStyle = DW.lin(ctx, -3, 0, 8, 0, [[0, '#4a4c52'], [0.4, '#232428'], [1, '#101114']]); ctx.fill(); ctx.restore();
      DW.text(ctx, 'LM35', 2.54, -6, 1.6, 'rgba(240,240,240,.9)', { weight: 800 });
      pinsRow(ctx, 3, 0, 0);
    }
  };
  MOD.SERVO = {
    w: 24, h: 40, n: 3, off: [[0, 0], [2.54, 0], [5.08, 0]],
    draw(ctx, p, v) {
      /* cuerpo del servo: sobre el eje de pines */
      ctx.save(); DW.shadow(ctx, 1.8, 0.5, 1, 0.4);
      DW.rr(ctx, -9, -40, 23, 12.4, 0.8); ctx.fillStyle = DW.lin(ctx, 0, -40, 0, -27, [[0, '#3a7be0'], [1, '#1d4fa8']]); ctx.fill();
      DW.rr(ctx, -13.5, -35, 32, 2.4, 0.3); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#2a63c2'; ctx.fillRect(-13.5, -34.5, 32, 1.7);
      ctx.fillStyle = '#16181c'; ctx.beginPath(); ctx.arc(-13.2, -33.8, 0.9, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(18.8, -33.8, 0.9, 0, TAU); ctx.fill();
      ctx.fillStyle = '#e8eaee'; ctx.beginPath(); ctx.arc(6.5, -41, 5.2, 0, TAU); ctx.fill();
      DW.text(ctx, 'SG90', 8, -30, 2.4, 'rgba(255,255,255,.85)', { weight: 800 });
      /* brazo (horn) */
      const ang = (p.angleNow !== undefined ? p.angleNow : 90) * Math.PI / 180;
      ctx.save(); ctx.translate(6.5, -41); ctx.rotate(Math.PI - ang);
      ctx.fillStyle = '#f7f8fa'; DW.rr(ctx, -2.2, -2.2, 22, 4.4, 2.2); ctx.fill();
      ctx.fillStyle = '#c3c7cd'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(5 + k * 4, 0, 0.7, 0, TAU); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = '#9ca1a9'; ctx.beginPath(); ctx.arc(6.5, -41, 1.5, 0, TAU); ctx.fill();
      /* cable de 3 hilos */
      const cols = ['#7a4a21', '#d73a31', '#e9772a'];
      cols.forEach((c, i) => { ctx.strokeStyle = c; ctx.lineWidth = 1.1; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(i * 2.54, 0); ctx.lineTo(i * 2.54, -4); ctx.lineTo(4 + i * 0.6, -27.6); ctx.stroke(); });
      pinsRow(ctx, 3);
    }
  };
  MOD.LCDI2C = {
    w: 80, h: 38, n: 4,
    draw(ctx, p, v) {
      const on = p.light !== false && v.bench.modPower(p).ok;
      pcb(ctx, -6, -39, 80, 36, '#1f8a4f', '#146b3a');
      ctx.fillStyle = '#c6cbd1'; DW.rr(ctx, -2.2, -35.5, 72.4, 29, 1.2); ctx.fill();
      ctx.fillStyle = on ? DW.lin(ctx, 0, -33, 0, -9, [[0, '#2ccf6c'], [1, '#1fb457']]) : '#6f8a73'; DW.rr(ctx, 1.6, -31.5, 64.8, 22, 0.6); ctx.fill();
      /* celdas de caracteres */
      const scr = p.screen || [' '.repeat(16), ' '.repeat(16)];
      const cw = 3.78, chh = 7.6;
      for (let r = 0; r < 2; r++) for (let c = 0; c < 16; c++) {
        const x = 2.8 + c * (cw + 0.28), y = -30.2 + r * (chh + 1.8);
        ctx.fillStyle = on ? 'rgba(16,110,50,.35)' : 'rgba(40,60,45,.2)'; ctx.fillRect(x, y, cw, chh);
        const ch = (scr[r] || '')[c];
        if (ch && ch !== ' ' && on) DW.text(ctx, ch, x + cw / 2, y + chh / 2 + 0.1, 6.2, '#0c3a1c', { weight: 700, mono: true });
      }
      /* módulo I2C trasero visible */
      ctx.fillStyle = '#0f4f8f'; DW.rr(ctx, 4, -8.2, 23, 5.6, 0.6); ctx.fill();
      DW.text(ctx, 'PCF8574', 15.5, -5.4, 1.5, '#cfe', { weight: 700 });
      pinsRow(ctx, 4); labels(ctx, ['GND', 'VCC', 'SDA', 'SCL'], 0, -3.6, '#fff');
      if (on) v.glows.push({ x: v.cur[0] + 34, y: v.cur[1] - 20, r: 40, c: '#33ff88', a: 0.12 });
    }
  };
  MOD.OLED = {
    w: 28, h: 28, n: 4,
    draw(ctx, p, v) {
      pcb(ctx, -3, -29, 28, 27, '#17181c', '#0b0c0e');
      const on = v.bench.modPower(p).ok;
      ctx.fillStyle = on ? '#02050a' : '#0c0f13'; DW.rr(ctx, -1.2, -27.4, 24.4, 14.6, 0.5); ctx.fill();
      if (on && p.lines) p.lines.forEach((s, i) => DW.text(ctx, s, 0, -24.5 + i * 3.4, 2.7, '#7fe4ff', { weight: 700, mono: true, align: 'left' }));
      pinsRow(ctx, 4); labels(ctx, ['GND', 'VCC', 'SCL', 'SDA'], 0, -3.6, '#cfd6e0');
    }
  };
  MOD.MPU6050 = {
    w: 22, h: 17, n: 4,
    draw(ctx, p, v) {
      pcb(ctx, -3, -18, 21, 15.5, '#5a3fa8', '#3b2679');
      ctx.fillStyle = '#16171a'; DW.rr(ctx, 4, -14, 5.5, 5.5, 0.4); ctx.fill();
      DW.text(ctx, 'MPU6050', 7, -4.2, 1.5, 'rgba(255,255,255,.85)', { weight: 700 });
      pinsRow(ctx, 4); labels(ctx, ['VCC', 'GND', 'SCL', 'SDA'], 0, -1.6, '#fff');
    }
  };
  MOD.IRSENS = {
    w: 31, h: 14, n: 3,
    draw(ctx, p, v) {
      pcb(ctx, -3, -15, 31, 13, '#c6372e', '#8e2018');
      ctx.fillStyle = '#e6e8ec'; ctx.beginPath(); ctx.arc(2, -11, 2.2, 0, TAU); ctx.fill(); ctx.fillStyle = '#151618'; ctx.beginPath(); ctx.arc(8.5, -11, 2.2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3a82e0'; ctx.fillRect(17, -12, 3, 3);
      DW.text(ctx, 'IR', 14, -6.6, 1.6, 'rgba(255,255,255,.85)', { weight: 800 });
      pinsRow(ctx, 3); labels(ctx, ['VCC', 'OUT', 'GND'], 0, -3.4);
    }
  };
  MOD.FOTOGATE = {
    w: 26, h: 16, n: 3,
    draw(ctx, p, v) {
      pcb(ctx, -3, -17, 26, 15, '#c6372e', '#8e2018');
      ctx.fillStyle = '#1a1b1e'; DW.rr(ctx, 0.5, -17.5, 6, 11, 0.5); ctx.fill(); DW.rr(ctx, 12.5, -17.5, 6, 11, 0.5); ctx.fill();
      ctx.fillStyle = p.blocked ? 'rgba(255,60,60,.3)' : 'rgba(255,255,255,.12)'; ctx.fillRect(6.5, -17.5, 6, 10);
      if (p.blocked) { ctx.fillStyle = '#ff5a3a'; ctx.fillRect(6.8, -17, 5.4, 9.6); }
      pinsRow(ctx, 3); labels(ctx, ['VCC', 'OUT', 'GND'], 0, -3.6);
    }
  };
  MOD.SOIL = {
    w: 20, h: 34, n: 3,
    draw(ctx, p, v) {
      pcb(ctx, -3, -34, 16, 30, '#1b1d22', '#0c0d10');
      ctx.fillStyle = '#d6b157'; for (let k = 0; k < 2; k++) ctx.fillRect(-0.5 + k * 6.5, -33, 2.4, 25);
      DW.text(ctx, 'SOIL', 5, -3.0, 1.5, '#ddd', { weight: 700 });
      pinsRow(ctx, 3);
    }
  };
  MOD.HX711 = {
    w: 30, h: 22, n: 4,
    draw(ctx, p, v) {
      pcb(ctx, -3, -22, 30, 20, '#c6372e', '#8e2018');
      ctx.fillStyle = '#16171a'; DW.rr(ctx, 6, -16, 9, 6, 0.4); ctx.fill(); DW.text(ctx, 'HX711', 10.5, -13, 1.5, '#ddd', { weight: 700 });
      pinsRow(ctx, 4); labels(ctx, ['VCC', 'DT', 'SCK', 'GND'], 0, -3.4);
    }
  };
  MOD.RELAYMOD = {
    w: 36, h: 28, n: 3,
    draw(ctx, p, v) {
      pcb(ctx, -3, -29, 36, 27, '#1f6bd1', '#1646a0');
      ctx.fillStyle = '#2d58b8'; DW.rr(ctx, 3, -27, 18, 17, 0.8); ctx.fill(); DW.text(ctx, 'SRD-05VDC', 12, -20, 1.6, '#e6efff', { weight: 800 });
      ctx.fillStyle = p.on ? '#ff3a3a' : '#4a2a2a'; ctx.beginPath(); ctx.arc(26, -22, 1.2, 0, TAU); ctx.fill();
      if (p.on) v.glows.push({ x: v.cur[0] + 26, y: v.cur[1] - 22, r: 5, c: '#ff3a3a', a: 0.7 });
      ctx.fillStyle = '#18c25a'; ctx.fillRect(24, -17, 6, 6);
      pinsRow(ctx, 3); labels(ctx, ['VCC', 'GND', 'IN'], 0, -3.4);
    }
  };
  MOD.L298N = {
    w: 43, h: 43, n: 7,
    draw(ctx, p, v) {
      pcb(ctx, -3, -44, 43, 42, '#c6372e', '#8e2018');
      ctx.fillStyle = '#17181b'; DW.rr(ctx, 7, -38, 14, 13, 0.6); ctx.fill(); ctx.fillStyle = '#9ca1a9'; ctx.fillRect(7, -41, 14, 3.5);
      DW.text(ctx, 'L298N', 14, -31, 2.4, '#ddd', { weight: 800 });
      ctx.fillStyle = '#1f9d4e'; DW.rr(ctx, 26, -40, 10, 8, 0.5); ctx.fill(); DW.rr(ctx, 26, -29, 10, 8, 0.5); ctx.fill();
      pinsRow(ctx, 7); labels(ctx, ['IN1', 'IN2', 'IN3', 'IN4', 'ENA', 'ENB', 'GND'], 0, -3.6);
    }
  };
  MOD.NRF24 = { w: 18, h: 36, n: 8, draw(ctx, p, v) { pcb(ctx, -3, -36, 25, 34, '#1b1d22', '#0c0d10'); DW.text(ctx, 'nRF24L01+', 9.5, -15, 2.0, '#8fd', { weight: 700 }); pinsRow(ctx, 8); } };
  MOD.LORA = { w: 18, h: 36, n: 8, draw(ctx, p, v) { pcb(ctx, -3, -36, 25, 34, '#2a62d4', '#1646a0'); DW.text(ctx, 'LoRa', 9.5, -15, 2.4, '#fff', { weight: 800 }); pinsRow(ctx, 8); } };
  MOD.RC522 = { w: 40, h: 60, n: 8, draw(ctx, p, v) { pcb(ctx, -3, -60, 40, 58, '#1f6bd1', '#1646a0'); ctx.strokeStyle = '#d6d9de'; ctx.lineWidth = 0.9; ctx.strokeRect(1, -52, 30, 30); DW.text(ctx, 'RC522', 16, -12, 2.4, '#fff', { weight: 800 }); pinsRow(ctx, 8); } };
  MOD.HC05 = { w: 28, h: 40, n: 6, draw(ctx, p, v) { pcb(ctx, -3, -40, 28, 38, '#1c3a6e', '#0f2347'); ctx.fillStyle = '#9ca1a9'; DW.rr(ctx, 1, -36, 17, 14, 0.5); ctx.fill(); DW.text(ctx, 'HC-05', 9.5, -29, 2.2, '#222', { weight: 800 }); pinsRow(ctx, 6); } };
  MOD.SEG7 = {
    w: 22, h: 30, n: 9,
    draw(ctx, p, v) {
      ctx.save(); DW.shadow(ctx, 1.4, 0.4, 0.8, 0.4);
      DW.rr(ctx, -2, -31, 22, 28, 1); ctx.fillStyle = '#1b1c20'; ctx.fill(); ctx.restore();
      const segs = [[3, -27, 9, 0], [12.4, -26.4, 0, 9], [12.4, -16.4, 0, 9], [3, -8.4, 9, 0], [2.4, -16.4, 0, 9], [2.4, -26.4, 0, 9], [3, -17.4, 9, 0]];
      const names = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
      names.forEach((nm, i) => {
        const e = v.bench.c.find(p.id + ':seg' + i);
        const on = e && e.i > 0.0005;
        const s = segs[i];
        ctx.strokeStyle = on ? '#ff4a3a' : '#3a1f1f'; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s[0] + 2, s[1]); ctx.lineTo(s[0] + s[2] + 2, s[1] + s[3]); ctx.stroke();
        if (on) v.glows.push({ x: v.cur[0] + s[0] + s[2] / 2 + 2, y: v.cur[1] + s[1] + s[3] / 2, r: 4, c: '#ff3b2b', a: 0.5 });
      });
      pinsRow(ctx, 9, 0, 0);
    }
  };
  MOD.GENERIC = { w: 30, h: 20, n: 4, draw(ctx, p, v) { pcb(ctx, -3, -20, 30, 18, '#2a8a6a', '#1b6650'); DW.text(ctx, EM.parts[p.type].label.slice(0, 14), 12, -11, 2, '#fff', { weight: 700 }); pinsRow(ctx, p.pins.length); } };
  MOD.DHT22 = MOD.DHT11;

  /* Dibuja un módulo cuyos pines coinciden con los agujeros dados (enchufado) o, si p.at existe, fuera de la placa con cables */
  function drawModule(ctx, p, pins, v) {
    const lay = MOD[p.type] || MOD.GENERIC;
    const n = pins.length;
    const down = p.dir === 'down';
    if (p.at) { /* fuera de la placa: se dibuja en `at` y se conectan los pines con cables */
      const at = p.at;
      const off = lay.off || Array.from({ length: n }, (_, i) => [i * 2.54, 0]);
      ctx.save(); ctx.translate(at[0], at[1]); if (p.rot) ctx.rotate(p.rot);
      v.cur = [at[0], at[1]];
      lay.draw(ctx, p, v);
      ctx.restore();
      const colors = p.wireColors || ['#d73a31', '#e8b50f', '#2a8f3d', '#1e1e22', '#2a62d4', '#e9772a', '#8d45c8', '#f1f1ee'];
      const cn = EM.parts[p.type].pinNames;
      pins.forEach((hp, i) => {
        if (!hp) return;
        const c = cn[i] === 'GND' ? '#1e1e22' : (cn[i] === 'VCC' || cn[i] === '3V3') ? '#d73a31' : colors[(i + 1) % colors.length];
        const o = off[i] || [i * 2.54, 0];
        const cs = Math.cos(p.rot || 0), sn = Math.sin(p.rot || 0);
        DW.wire(ctx, [at[0] + o[0] * cs - o[1] * sn, at[1] + o[0] * sn + o[1] * cs], hp, c, { lift: 0.8 });
      });
      return;
    }
    const x0 = pins[0][0], y0 = pins[0][1];
    ctx.save(); ctx.translate(x0, y0);
    if (down) { const lastx = pins[n - 1][0] - x0; ctx.translate(lastx, 0); ctx.rotate(Math.PI); }
    v.cur = [x0, y0];
    lay.draw(ctx, p, v);
    ctx.restore();
  }

  /* ---------- Punto de entrada ---------- */
  DW.part = function (ctx, p, pins, v) {
    const def = PT[p.type];
    ctx.save();
    if (def.module) drawModule(ctx, p, pins, v);
    else if (DRAW[p.type]) DRAW[p.type](ctx, p, pins, v);
    ctx.restore();
    /* marca de pieza dañada */
    if (p.dead) {
      const c = p._pos ? p._pos : pins.reduce((s, q) => [s[0] + q[0] / pins.length, s[1] + q[1] / pins.length], [0, 0]);
      v.smoke.push({ x: c[0], y: c[1], id: p.id });
    }
  };
  DW.MOD = MOD;
})();
