/* ===================================================================
   41-draw-parts.js — Dibujo realista de las piezas (EM.dw.part)
   DRAW[clave](ctx, pieza, W, v): W = patas en el mundo (Pp._w), v = contexto de la vista
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM, DW = EM.dw, S = EM.spice, MOD = S.MOD, BB = EM.bb;
  const TAU = Math.PI * 2;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const DRAW = (DW.PARTS = {});

  const burn = (p, c) => (p.dead ? DW.mixc(c, '#1a1410', 0.8) : (p._dm > 0.12 ? DW.mixc(c, '#2a1d12', clamp(p._dm, 0, 1) * 0.55) : c));
  const heat = (ctx, p, x, y, r, v) => {
    const T = p._T || 25;
    const h = clamp((T - 70) / 160, 0, 1);
    if (h > 0.03 && !p.dead) v.glows.push({ x, y, r: r * (1.5 + h), c: '#ff7a1a', a: 0.4 * h });
    if (T > 150 && !p.dead) v.smokeAt(p.id, x, y - 1, clamp((T - 150) / 80, 0.15, 1));
    if (p.dead) v.smokeAt(p.id, x, y - 1, 0.35);
  };
  const hitC = (v, p, x, y, r) => v.hit.push({ id: p.id, kind: 'part', x, y, r });
  const hitR = (v, p, pts) => v.hit.push({ id: p.id, kind: 'part', poly: pts });
  const norm = (a, b) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / L, (b[1] - a[1]) / L, L]; };
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

  /* patas de una pieza axial con cuerpo de longitud bl centrado entre A y B */
  function axial(ctx, A, B, bl) {
    const m = mid(A, B), [ux, uy, L] = norm(A, B), h = Math.min(bl, Math.max(L, bl)) / 2;
    DW.lead(ctx, A[0], A[1], m[0] - ux * h, m[1] - uy * h);
    DW.lead(ctx, B[0], B[1], m[0] + ux * h, m[1] + uy * h);
    return m;
  }
  function frame(ctx, A, B, fn) {
    const m = mid(A, B), th = Math.atan2(B[1] - A[1], B[0] - A[0]);
    ctx.save(); ctx.translate(m[0], m[1]); ctx.rotate(th); fn(Math.hypot(B[0] - A[0], B[1] - A[1])); ctx.restore();
    return m;
  }
  /* marco de piezas rígidas: origen en la pata 1, giro rot·90° */
  function rigid(ctx, p, fn) { ctx.save(); ctx.translate(p.at[0], p.at[1]); ctx.rotate((p.rot || 0) * Math.PI / 2); fn(); ctx.restore(); }
  const rigidBox = (p, x0, y0, x1, y1) => {
    const pts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(([x, y]) => { const [dx, dy] = BB.rot(x, y, p.rot || 0); return [p.at[0] + dx, p.at[1] + dy]; });
    return pts;
  };
  const rigidPt = (p, x, y) => { const [dx, dy] = BB.rot(x, y, p.rot || 0); return [p.at[0] + dx, p.at[1] + dy]; };
  const stub = (ctx, W, ox, oy, rot, p, len) => W.pkg.forEach((q) => { /* patas cortas bajo el cuerpo */ });

  /* ---------- Resistor ---------- */
  DRAW.R = (ctx, p, W, v) => {
    const [A, B] = W.cat; const m = axial(ctx, A, B, 6.4);
    frame(ctx, A, B, () => {
      const R = p.p.r, bands = S.bands(R, 4, p.p.tol);
      ctx.save(); DW.shadow(ctx, 0.8, 0.2, 0.5, 0.35);
      const base = burn(p, '#e0c28a');
      ctx.beginPath(); ctx.moveTo(-2.3, -1.15); ctx.quadraticCurveTo(-3.3, -1.7, -3.1, 0); ctx.quadraticCurveTo(-3.3, 1.7, -2.3, 1.15); ctx.lineTo(2.3, 1.15); ctx.quadraticCurveTo(3.3, 1.7, 3.1, 0); ctx.quadraticCurveTo(3.3, -1.7, 2.3, -1.15); ctx.closePath();
      ctx.fillStyle = DW.lin(ctx, 0, -1.7, 0, 1.7, [[0, DW.mixc(base, '#ffffff', 0.35)], [0.5, base], [1, DW.mixc(base, '#6a4a1a', 0.45)]]);
      ctx.fill(); DW.noShadow(ctx); ctx.restore();
      const xs = [-1.9, -1.0, -0.1, 2.0];
      bands.forEach((ci, k) => { ctx.fillStyle = burn(p, S.COLORS[ci].hex); ctx.fillRect(xs[k] - 0.28, -1.12, 0.56, 2.24); });
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-2.5, -1.0, 5.0, 0.35);
      if (p.dead) { ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(-0.9, -1.2, 1.8, 2.4); }
      const T = p._T || 25; if (T > 90 && !p.dead) { ctx.fillStyle = `rgba(255,${Math.round(150 - clamp((T - 90) / 140, 0, 1) * 110)},40,${clamp((T - 90) / 200, 0, 0.6)})`; ctx.fillRect(-3, -1.2, 6, 2.4); }
    });
    hitC(v, p, m[0], m[1], 3.6); heat(ctx, p, m[0], m[1], 3.4, v);
    v.label(p, m[0], m[1] - 3.2);
  };
  /* ---------- Diodo, Zener ---------- */
  DRAW.D = (ctx, p, W, v) => {
    const [A, B] = W.cat; const m = axial(ctx, A, B, 5.6);
    frame(ctx, A, B, () => {
      const glass = p.p.model === '1N4148', schottky = p.p.model === '1N5819';
      ctx.save(); DW.shadow(ctx, 0.8, 0.2, 0.5, 0.35);
      DW.rr(ctx, -2.8, -1.25, 5.6, 2.5, 0.7);
      let fill = glass ? DW.lin(ctx, 0, -1.2, 0, 1.2, [[0, '#f0b968'], [1, '#a9672a']]) : DW.lin(ctx, 0, -1.2, 0, 1.2, [[0, '#3a3c42'], [0.5, '#1d1e22'], [1, '#0e0f12']]);
      ctx.fillStyle = p.dead ? '#1c1410' : fill; ctx.fill(); DW.noShadow(ctx); ctx.restore();
      ctx.fillStyle = glass ? '#17171a' : '#cfd2d8'; ctx.fillRect(1.6, -1.25, 0.8, 2.5);
      ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(-2.6, -1.05, 4.6, 0.3);
      if (!glass) DW.text(ctx, schottky ? '5819' : (p.p.model || '').replace('1N', ''), -0.6, 0.1, 0.85, 'rgba(235,235,235,.8)', { weight: 700 });
    });
    hitC(v, p, m[0], m[1], 3.4); heat(ctx, p, m[0], m[1], 3, v); v.label(p, m[0], m[1] - 3);
  };
  DRAW.ZD = (ctx, p, W, v) => {
    const [A, B] = W.cat; const m = axial(ctx, A, B, 5.2);
    frame(ctx, A, B, () => {
      ctx.save(); DW.shadow(ctx, 0.8, 0.2, 0.5, 0.35);
      DW.rr(ctx, -2.6, -1.2, 5.2, 2.4, 0.9); ctx.fillStyle = p.dead ? '#2a1d12' : DW.lin(ctx, 0, -1.2, 0, 1.2, [[0, '#f3d79a'], [0.5, '#c79a46'], [1, '#6a4a1c']]); ctx.fill(); DW.noShadow(ctx); ctx.restore();
      ctx.fillStyle = '#1a1a1d'; ctx.fillRect(1.6, -1.2, 0.7, 2.4);
      DW.text(ctx, p.p.vz + 'V', -0.5, 0.05, 0.85, '#2a2012', { weight: 700 });
    });
    hitC(v, p, m[0], m[1], 3.4); heat(ctx, p, m[0], m[1], 3, v); v.label(p, m[0], m[1] - 3);
  };
  DRAW.FUSE = (ctx, p, W, v) => {
    const [A, B] = W.cat; const m = axial(ctx, A, B, 7.0);
    frame(ctx, A, B, () => {
      ctx.save(); DW.shadow(ctx, 0.8, 0.2, 0.5, 0.3);
      DW.rr(ctx, -3.5, -1.5, 7, 3, 0.9); ctx.fillStyle = 'rgba(210,235,245,.55)'; ctx.fill(); DW.noShadow(ctx);
      ctx.strokeStyle = 'rgba(80,100,110,.8)'; ctx.lineWidth = 0.2; ctx.stroke(); ctx.restore();
      ctx.fillStyle = DW.METAL; ctx.fillRect(-3.8, -1.5, 1.2, 3); ctx.fillRect(2.6, -1.5, 1.2, 3);
      ctx.strokeStyle = p.dead ? '#444' : '#d8d8d8'; ctx.lineWidth = 0.18; ctx.beginPath();
      if (p.dead) { ctx.moveTo(-2.6, 0); ctx.lineTo(-0.9, 0.1); ctx.moveTo(0.9, -0.1); ctx.lineTo(2.6, 0); ctx.stroke(); ctx.fillStyle = 'rgba(30,20,10,.5)'; ctx.fillRect(-1.5, -1.3, 3, 2.6); } else { ctx.moveTo(-2.6, 0); ctx.lineTo(2.6, 0); ctx.stroke(); }
      DW.text(ctx, (p.p.ir * 1000).toFixed(0) + 'mA', 0, 2.25, 0.85, '#556', { weight: 700 });
    });
    hitC(v, p, m[0], m[1], 3.8); heat(ctx, p, m[0], m[1], 3, v);
  };
  /* ---------- LED ---------- */
  DRAW.LED = (ctx, p, W, v) => {
    const [A, K] = W.cat; const col = (MOD.LED[p.p.color] || MOD.LED.rojo).hex;
    const I = p.dead ? 0 : Math.max(0, p._I || 0);
    const br = clamp(Math.pow(I / 0.02, 0.62), 0, 1.5);
    const m = mid(A, K), [ux, uy] = norm(A, K), L = Math.hypot(K[0] - A[0], K[1] - A[1]);
    /* patas: el ánodo (A) es más largo */
    DW.lead(ctx, A[0], A[1], m[0] - ux * 0.9, m[1] - uy * 0.9, 0.5);
    DW.lead(ctx, K[0], K[1], m[0] + ux * 0.9, m[1] + uy * 0.9, 0.5);
    ctx.save(); ctx.translate(m[0], m[1]); ctx.rotate(Math.atan2(K[1] - A[1], K[0] - A[0]));
    ctx.save(); DW.shadow(ctx, 1.0, 0.3, 0.6, 0.35);
    ctx.beginPath(); ctx.arc(0, 0, 2.9, 0, TAU); ctx.fillStyle = p.dead ? '#3a332c' : DW.mixc(col, '#ffffff', 0.35); ctx.globalAlpha = 0.35; ctx.fill(); ctx.globalAlpha = 1; ctx.restore();
    const g = ctx.createRadialGradient(-0.7, -0.9, 0.2, 0, 0, 2.7);
    const base = p.dead ? '#2c2723' : col, on = br > 0.02;
    g.addColorStop(0, on ? DW.mixc(base, '#ffffff', 0.78) : DW.mixc(base, '#ffffff', 0.4));
    g.addColorStop(0.55, on ? DW.mixc(base, '#ffffff', 0.25 * (1.2 - clamp(br, 0, 1))) : DW.mixc(base, '#2a2a2a', 0.18));
    g.addColorStop(1, on ? DW.mixc(base, '#000000', 0.15) : DW.mixc(base, '#1a1a1a', 0.45));
    ctx.beginPath(); ctx.arc(0, 0, 2.55, 0, TAU); ctx.fillStyle = g; ctx.globalAlpha = on ? 1 : 0.88; ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(120,120,120,.45)'; ctx.fillRect(-0.55, -1.2, 0.5, 2.0); ctx.fillRect(0.3, -0.7, 0.5, 1.4);
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(2.35, -2.4, 0.45, 4.8);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(-0.9, -1.1, 0.65, 0.4, -0.7, 0, TAU); ctx.fill();
    if (p.dead) { ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, TAU); ctx.fill(); }
    ctx.restore();
    if (br > 0.02) v.glows.push({ x: m[0], y: m[1], r: 5 + br * 6, c: col, a: clamp(0.35 + br * 0.45, 0, 1) });
    hitC(v, p, m[0], m[1], 3.4); heat(ctx, p, m[0], m[1], 3, v); v.label(p, m[0], m[1] - 4);
  };
  /* ---------- Condensadores ---------- */
  DRAW.CE = (ctx, p, W, v) => {
    const [A, B] = W.cat; const C = p.p.c;
    const r = clamp(2.2 + Math.sqrt(C * 1e6) * 0.12, 2.6, 6.0);
    const m = mid(A, B), ang = Math.atan2(B[1] - A[1], B[0] - A[0]);
    /* radial: vista superior → cilindro visto «desde arriba»; se dibuja de lado para que se lea el valor */
    const [ux, uy] = norm(A, B);
    DW.lead(ctx, A[0], A[1], m[0] - ux * r * 0.3, m[1] - uy * r * 0.3, 0.5);
    DW.lead(ctx, B[0], B[1], m[0] + ux * r * 0.3, m[1] + uy * r * 0.3, 0.5);
    const cx = m[0], cy = m[1] - r * 0.25;
    ctx.save(); ctx.translate(cx, cy);
    ctx.save(); DW.shadow(ctx, 1.4, 0.4, 0.8, 0.4);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fillStyle = burn(p, '#1b3fa8'); ctx.fill(); ctx.restore();
    const body = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
    body.addColorStop(0, burn(p, '#3a62d4')); body.addColorStop(0.7, burn(p, '#21429f')); body.addColorStop(1, burn(p, '#142b73'));
    ctx.beginPath(); ctx.arc(0, 0, r - 0.15, 0, TAU); ctx.fillStyle = body; ctx.fill();
    /* franja del terminal negativo, del lado de B (patas: A = +, B = −) */
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r - 0.15, 0, TAU); ctx.clip(); ctx.rotate(ang);
    ctx.fillStyle = burn(p, '#d9dde3'); ctx.fillRect(r * 0.5, -r, r, 2 * r);
    ctx.fillStyle = burn(p, '#2a2c33'); for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.arc(r * 0.82, k * r * 0.34, r * 0.11, 0, TAU); ctx.fill(); }
    ctx.restore();
    ctx.save(); ctx.rotate(0);
    DW.text(ctx, C >= 1e-6 ? Math.round(C * 1e6) + 'µF' : Math.round(C * 1e9) + 'nF', -r * 0.2, -r * 0.18, Math.min(1.6, r * 0.34), '#e8edf9', { weight: 800 });
    DW.text(ctx, p.p.vmax + 'V', -r * 0.2, r * 0.32, Math.min(1.4, r * 0.3), '#cbd4ee', { weight: 700 });
    DW.text(ctx, '+', -r * 0.78 * Math.cos(ang), -r * 0.78 * Math.sin(ang), 1.6, '#ffffff', { weight: 900 });
    ctx.restore();
    if (p.dead) {
      ctx.fillStyle = 'rgba(30,20,10,.65)'; ctx.beginPath(); ctx.arc(0, 0, r - 0.2, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#c9a064'; ctx.lineWidth = 0.35; ctx.beginPath(); ctx.moveTo(-r * 0.6, -r * 0.1); ctx.lineTo(r * 0.5, r * 0.15); ctx.moveTo(-r * 0.1, -r * 0.6); ctx.lineTo(r * 0.1, r * 0.5); ctx.stroke();
      ctx.fillStyle = 'rgba(190,150,70,.55)'; ctx.beginPath(); ctx.ellipse(r * 0.9, r * 0.6, r * 0.5, r * 0.25, 0.4, 0, TAU); ctx.fill();
    }
    ctx.restore();
    hitC(v, p, cx, cy, r + 0.6); heat(ctx, p, cx, cy, r, v); v.label(p, cx, cy - r - 1.5);
    /* hinchazón antes de reventar */
    if (!p.dead && p._dm > 0.5) v.glows.push({ x: cx, y: cy, r: r * 1.8, c: '#ffb04a', a: (p._dm - 0.5) * 0.7 });
  };
  DRAW.C = (ctx, p, W, v) => {
    const [A, B] = W.cat; const m = mid(A, B), [ux, uy] = norm(A, B);
    DW.lead(ctx, A[0], A[1], m[0] - ux * 1.2, m[1] - uy * 1.2, 0.5); DW.lead(ctx, B[0], B[1], m[0] + ux * 1.2, m[1] + uy * 1.2, 0.5);
    ctx.save(); ctx.translate(m[0], m[1] - 1.2);
    ctx.save(); DW.shadow(ctx, 1.0, 0.3, 0.7, 0.35);
    ctx.beginPath(); ctx.moveTo(-2.4, 2.2); ctx.bezierCurveTo(-3.0, -1.2, -1.6, -2.6, 0, -2.6); ctx.bezierCurveTo(1.6, -2.6, 3.0, -1.2, 2.4, 2.2); ctx.closePath();
    ctx.fillStyle = DW.lin(ctx, 0, -3, 0, 2, [[0, burn(p, '#f2b24d')], [1, burn(p, '#c8801f')]]); ctx.fill(); DW.noShadow(ctx); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(-0.8, -1.5, 0.9, 0.5, -0.5, 0, TAU); ctx.fill();
    const pf = p.p.c * 1e12, e = Math.floor(Math.log10(pf)), mm = Math.round(pf / Math.pow(10, e - 1));
    DW.text(ctx, String(mm) + (e - 1), 0, -0.2, 1.3, '#4a2f08', { weight: 800 });
    ctx.restore(); hitC(v, p, m[0], m[1] - 1, 3.2); heat(ctx, p, m[0], m[1], 2.6, v);
  };
  DRAW.CF = (ctx, p, W, v) => {
    const [A, B] = W.cat; const m = mid(A, B), [ux, uy] = norm(A, B);
    DW.lead(ctx, A[0], A[1], m[0] - ux * 2.4, m[1] - uy * 2.4, 0.5); DW.lead(ctx, B[0], B[1], m[0] + ux * 2.4, m[1] + uy * 2.4, 0.5);
    ctx.save(); ctx.translate(m[0], m[1] - 1.5);
    ctx.save(); DW.shadow(ctx, 1.0, 0.3, 0.7, 0.35);
    DW.rr(ctx, -3.6, -2.6, 7.2, 5.2, 0.8); ctx.fillStyle = burn(p, DW.lin(ctx, 0, -2.6, 0, 2.6, [[0, '#d83a3a'], [1, '#9c1f1f']])); ctx.fill(); DW.noShadow(ctx); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(-3.3, -2.3, 6.6, 0.5);
    DW.text(ctx, p.p.c >= 1e-6 ? (p.p.c * 1e6) + 'µ' : (p.p.c * 1e9) + 'n', 0, 0.1, 1.7, '#fbe9e9', { weight: 800 });
    DW.text(ctx, '100V', 0, 1.9, 1.0, '#f5cfcf', { weight: 700 });
    ctx.restore(); hitC(v, p, m[0], m[1] - 1.5, 4.2);
  };
  /* ---------- Inductor ---------- */
  DRAW.L = (ctx, p, W, v) => {
    const [A, B] = W.cat; const m = axial(ctx, A, B, 7.0);
    frame(ctx, A, B, () => {
      ctx.save(); DW.shadow(ctx, 0.8, 0.2, 0.5, 0.35);
      DW.rr(ctx, -3.5, -1.5, 7, 3, 1.2); ctx.fillStyle = burn(p, DW.lin(ctx, 0, -1.5, 0, 1.5, [[0, '#6f8f5a'], [1, '#3f5a33']])); ctx.fill(); DW.noShadow(ctx); ctx.restore();
      ctx.strokeStyle = burn(p, '#c9a35a'); ctx.lineWidth = 0.35;
      for (let k = -2.6; k <= 2.7; k += 0.9) { ctx.beginPath(); ctx.moveTo(k, -1.5); ctx.lineTo(k + 0.35, 1.5); ctx.stroke(); }
    });
    hitC(v, p, m[0], m[1], 3.8); heat(ctx, p, m[0], m[1], 3, v); v.label(p, m[0], m[1] - 3);
  };
  /* ---------- NTC, LDR, fotodiodo ---------- */
  DRAW.NTC = (ctx, p, W, v) => {
    const [A, B] = W.cat; const m = mid(A, B), [ux, uy] = norm(A, B);
    DW.lead(ctx, A[0], A[1], m[0] - ux * 0.9, m[1] - uy * 0.9, 0.45); DW.lead(ctx, B[0], B[1], m[0] + ux * 0.9, m[1] + uy * 0.9, 0.45);
    ctx.save(); ctx.translate(m[0], m[1] - 1);
    ctx.save(); DW.shadow(ctx, 0.9, 0.3, 0.5, 0.35);
    ctx.beginPath(); ctx.moveTo(-1.6, 1.4); ctx.bezierCurveTo(-2.4, -2.4, 2.4, -2.4, 1.6, 1.4); ctx.closePath(); ctx.fillStyle = burn(p, DW.lin(ctx, 0, -2, 0, 1.4, [[0, '#2f78d6'], [1, '#14408f']])); ctx.fill(); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(-0.5, -0.9, 0.55, 0.3, -0.5, 0, TAU); ctx.fill();
    ctx.restore(); DW.text(ctx, 'NTC', m[0], m[1] + 3.6, 1.1, '#667', { weight: 700 }); hitC(v, p, m[0], m[1] - 1, 3);
  };
  DRAW.LDR = (ctx, p, W, v) => {
    const [A, B] = W.cat; const m = mid(A, B), [ux, uy] = norm(A, B);
    DW.lead(ctx, A[0], A[1], m[0] - ux * 1.5, m[1] - uy * 1.5, 0.5); DW.lead(ctx, B[0], B[1], m[0] + ux * 1.5, m[1] + uy * 1.5, 0.5);
    ctx.save(); ctx.translate(m[0], m[1] - 1.6);
    ctx.save(); DW.shadow(ctx, 1, 0.3, 0.6, 0.35); ctx.beginPath(); ctx.arc(0, 0, 2.9, 0, TAU); ctx.fillStyle = '#b89155'; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(0, 0, 2.6, 0, TAU); ctx.fillStyle = DW.rad(ctx, -0.5, -0.5, 0.2, 2.7, [[0, '#f0d9a6'], [1, '#c4a062']]); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, TAU); ctx.clip(); ctx.strokeStyle = '#3a2b12'; ctx.lineWidth = 0.28; ctx.beginPath();
    for (let k = -5; k <= 5; k++) { const y = k * 0.52; if (k % 2 === 0) { ctx.moveTo(-2.6, y); ctx.lineTo(2.6, y); } else { ctx.moveTo(2.6, y); ctx.lineTo(-2.6, y); } } ctx.stroke(); ctx.restore();
    ctx.restore(); hitC(v, p, m[0], m[1] - 1.6, 3.2);
  };
  DRAW.PD = (ctx, p, W, v) => {
    const [A, B] = W.cat; const m = mid(A, B), [ux, uy] = norm(A, B);
    DW.lead(ctx, A[0], A[1], m[0] - ux * 1.2, m[1] - uy * 1.2, 0.5); DW.lead(ctx, B[0], B[1], m[0] + ux * 1.2, m[1] + uy * 1.2, 0.5);
    ctx.save(); ctx.translate(m[0], m[1] - 1.6); ctx.save(); DW.shadow(ctx, 1, 0.3, 0.6, 0.35);
    DW.rr(ctx, -3, -2.6, 6, 5.2, 0.6); ctx.fillStyle = '#1f2a3d'; ctx.fill(); ctx.restore();
    ctx.fillStyle = 'rgba(120,170,230,.55)'; DW.rr(ctx, -2.3, -1.9, 4.6, 3.8, 0.4); ctx.fill();
    ctx.restore(); hitC(v, p, m[0], m[1] - 1.6, 3.4);
  };
  DRAW.SOLAR = (ctx, p, W, v) => {
    const b = p.body || [W.cat[0][0], W.cat[0][1] - 12]; const irr = p.p.irr === undefined ? 1000 : p.p.irr;
    ctx.save(); ctx.translate(b[0], b[1]);
    ctx.save(); DW.shadow(ctx, 1.6, 0.5, 1.0, 0.35);
    DW.rr(ctx, -9, -6, 18, 12, 1); ctx.fillStyle = DW.lin(ctx, -9, -6, 9, 6, [[0, '#1d3a78'], [1, '#0f2252']]); ctx.fill(); ctx.restore();
    ctx.strokeStyle = 'rgba(200,215,240,.55)'; ctx.lineWidth = 0.25;
    for (let k = -6; k <= 6; k += 3) { ctx.beginPath(); ctx.moveTo(k, -6); ctx.lineTo(k, 6); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.stroke();
    ctx.restore(); v.tether(p, b, [-3, 6], [3, 6], W);
    hitR(v, p, [[b[0] - 9, b[1] - 6], [b[0] + 9, b[1] - 6], [b[0] + 9, b[1] + 6], [b[0] - 9, b[1] + 6]]); void irr;
  };
  /* ---------- Pulsador, interruptor, potenciómetro ---------- */
  DRAW.BTN = (ctx, p, W, v) => {
    rigid(ctx, p, () => {
      const cx = P2(1), cy = -P2(1.5);
      [[0, 0], [2, 0], [0, -3], [2, -3]].forEach(([i, j]) => { DW.lead(ctx, i * 2.54, j * 2.54, i * 2.54 + (i ? -1.2 : 1.2), j * 2.54 + (j ? 1.2 : -1.2), 0.55); });
      ctx.save(); ctx.translate(cx, cy);
      ctx.save(); DW.shadow(ctx, 1.4, 0.4, 0.8, 0.4);
      DW.rr(ctx, -3.3, -3.3, 6.6, 6.6, 0.6); ctx.fillStyle = burn(p, DW.lin(ctx, -3, -3, 3, 3, [[0, '#4b4e55'], [1, '#232529']])); ctx.fill(); ctx.restore();
      ctx.fillStyle = DW.lin(ctx, -3, -3, 3, 3, [[0, '#dfe2e7'], [1, '#9a9fa8']]); DW.rr(ctx, -2.9, -2.9, 5.8, 5.8, 0.4); ctx.fill();
      const pr = !!p.p.on, rr = pr ? 1.75 : 2.05, col = '#1f232b';
      ctx.save(); if (!pr) DW.shadow(ctx, 0.9, 0.2, 0.5, 0.45);
      ctx.beginPath(); ctx.arc(0, 0, rr, 0, TAU); ctx.fillStyle = DW.rad(ctx, -0.5, -0.6, 0.1, rr, [[0, pr ? '#161a20' : '#5b6370'], [1, pr ? '#0b0d10' : '#171a20']]); ctx.fill(); ctx.restore();
      ctx.restore();
    });
    const c = rigidPt(p, 2.54, -3.81); hitC(v, p, c[0], c[1], 3.6);
  };
  const P2 = (n) => n * 2.54;
  DRAW.SW = (ctx, p, W, v) => {
    rigid(ctx, p, () => {
      for (let i = 0; i < 3; i++) DW.lead(ctx, i * 2.54, 0, i * 2.54, -1.8, 0.55);
      ctx.save(); DW.shadow(ctx, 1.2, 0.3, 0.7, 0.4);
      DW.rr(ctx, -1.9, -6.2, 9.0, 4.4, 0.5); ctx.fillStyle = DW.lin(ctx, 0, -6, 0, -2, [[0, '#9aa0a8'], [1, '#6f757d']]); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#0c0d10'; DW.rr(ctx, -0.6, -5.4, 6.4, 2.2, 0.4); ctx.fill();
      const x = p.p.pos ? 3.9 : 1.3;
      ctx.fillStyle = DW.lin(ctx, 0, -6, 0, -2, [[0, '#f2f3f5'], [1, '#aeb2ba']]); DW.rr(ctx, x - 1.1, -5.9, 2.8, 3.2, 0.4); ctx.fill();
    });
    const c = rigidPt(p, 2.54, -4); hitC(v, p, c[0], c[1], 4.6);
  };
  DRAW.POT = (ctx, p, W, v) => {
    rigid(ctx, p, () => {
      for (let i = 0; i < 3; i++) DW.lead(ctx, i * 2.54, 0, i * 2.54, -2.2, 0.55);
      ctx.save(); ctx.translate(2.54, -7.2);
      ctx.save(); DW.shadow(ctx, 1.4, 0.4, 0.8, 0.4);
      DW.rr(ctx, -4.8, -4.8, 9.6, 9.6, 0.7); ctx.fillStyle = burn(p, DW.lin(ctx, -4, -4, 4, 4, [[0, '#2f6fd1'], [1, '#17409a']])); ctx.fill(); ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(-4.4, -4.4, 8.8, 0.5);
      ctx.fillStyle = '#d8d9dd'; ctx.beginPath(); ctx.arc(0, 0, 3.0, 0, TAU); ctx.fill();
      ctx.fillStyle = DW.rad(ctx, -0.8, -0.9, 0.2, 2.8, [[0, '#f8e7a8'], [1, '#a8863a']]); ctx.beginPath(); ctx.arc(0, 0, 2.6, 0, TAU); ctx.fill();
      ctx.save(); ctx.rotate(-2.35 + p.p.pos * 4.7 - (p.rot || 0) * Math.PI / 2); ctx.fillStyle = '#5a4814'; ctx.fillRect(-2.3, -0.3, 4.6, 0.6); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-2.3, -0.3, 4.6, 0.15); ctx.restore();
      ctx.restore();
    });
    const c = rigidPt(p, 2.54, -7.2); hitC(v, p, c[0], c[1], 5); v.label(p, c[0], c[1] + 6.4, S.fmtR(p.p.r).replace(' ', ''));
  };
  /* ---------- Transistores ---------- */
  function to92(ctx, p, W, v, txt, mark) {
    rigid(ctx, p, () => {
      for (let i = 0; i < 3; i++) DW.lead(ctx, i * 2.54, 0, i * 2.54, -2.4, 0.5);
      ctx.save(); ctx.translate(2.54, -3.2);
      ctx.save(); DW.shadow(ctx, 1.1, 0.3, 0.7, 0.4);
      ctx.beginPath(); ctx.moveTo(-2.7, 1.2); ctx.lineTo(-2.7, -2.4); ctx.arc(0, -2.4, 2.7, Math.PI, 0); ctx.lineTo(2.7, 1.2); ctx.closePath();
      ctx.fillStyle = burn(p, DW.lin(ctx, -2.7, 0, 2.7, 0, [[0, '#4a4c52'], [0.35, '#232428'], [1, '#101114']])); ctx.fill(); ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(-2.5, -3.2, 5.0, 0.35);
      DW.text(ctx, txt, 0, -0.7, txt.length > 6 ? 0.85 : 1.05, 'rgba(240,240,240,.85)', { weight: 700 });
      if (mark) DW.text(ctx, mark, 0, 0.5, 0.8, 'rgba(200,200,210,.6)', { weight: 700 });
      if (p.dead) { ctx.fillStyle = 'rgba(255,120,30,.55)'; ctx.beginPath(); ctx.arc(0.8, -2.5, 0.8, 0, TAU); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 0.2; ctx.beginPath(); ctx.moveTo(-1.5, -4.5); ctx.lineTo(0.5, -2.5); ctx.lineTo(-0.3, -1); ctx.stroke(); }
      ctx.restore();
    });
    const c = rigidPt(p, 2.54, -4.5); hitC(v, p, c[0], c[1], 3.6); heat(ctx, p, c[0], c[1], 3.2, v);
    v.label(p, c[0], c[1] - 4.6);
  }
  function to220(ctx, p, W, v, txt) {
    rigid(ctx, p, () => {
      for (let i = 0; i < 3; i++) DW.lead(ctx, i * 2.54, 0, i * 2.54, -3.2, 0.7);
      ctx.save(); ctx.translate(2.54, -10.5);
      ctx.save(); DW.shadow(ctx, 1.4, 0.4, 0.9, 0.4);
      DW.rr(ctx, -5.0, -1.5, 10, 9.3, 0.5); ctx.fillStyle = burn(p, DW.lin(ctx, 0, -1, 0, 9, [[0, '#2c2d31'], [1, '#121316']])); ctx.fill(); ctx.restore();
      ctx.fillStyle = DW.lin(ctx, 0, -9, 0, -1, [[0, '#e5e7ea'], [1, '#a9aeb5']]); DW.rr(ctx, -5.0, -9.4, 10, 8.3, 0.4); ctx.fill();
      ctx.fillStyle = '#4c5057'; ctx.beginPath(); ctx.arc(0, -6.8, 1.45, 0, TAU); ctx.fill();
      DW.text(ctx, txt, 0, 3.4, 1.5, 'rgba(240,240,240,.85)', { weight: 700 });
      if (p.dead) { ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(-5, -1.5, 10, 9.3); }
      ctx.restore();
    });
    const c = rigidPt(p, 2.54, -11.5); hitC(v, p, c[0], c[1], 5.6); heat(ctx, p, c[0], c[1], 5, v); v.label(p, c[0], c[1] - 7.6);
  }
  const bjtTxt = (p) => (p.p.model || '').replace('2N', '2N').replace('TIP', 'TIP');
  DRAW.NPN = (ctx, p, W, v) => (BB.PINOUT[p.p.model] || ['to92'])[0] === 'to220' ? to220(ctx, p, W, v, bjtTxt(p)) : to92(ctx, p, W, v, bjtTxt(p));
  DRAW.PNP = DRAW.NPN; DRAW.DARL = (ctx, p, W, v) => to220(ctx, p, W, v, 'TIP120');
  DRAW.NMOS = (ctx, p, W, v) => (BB.PINOUT[p.p.model] || ['to92'])[0] === 'to220' ? to220(ctx, p, W, v, bjtTxt(p)) : to92(ctx, p, W, v, bjtTxt(p));
  DRAW.PMOS = DRAW.NMOS; DRAW.JFN = (ctx, p, W, v) => to92(ctx, p, W, v, p.p.model); DRAW.SCR = (ctx, p, W, v) => to92(ctx, p, W, v, '2N5060');
  DRAW.REG = (ctx, p, W, v) => to220(ctx, p, W, v, p.p.model === 'LM317' ? 'LM317' : p.p.model);
  /* ---------- Circuitos integrados DIP ---------- */
  function dip(ctx, p, W, v, n, txt, sub, o = {}) {
    const w = (n / 2 - 1) * 2.54;
    rigid(ctx, p, () => {
      W.pkg.forEach((q, j) => { const lx = j < n / 2 ? j * 2.54 : (n - 1 - j) * 2.54, top = j >= n / 2; const ly = top ? -(o.rows || 7.62) : 0; DW.lead(ctx, lx, ly, lx, ly + (top ? 1.4 : -1.4), 0.6); });
      const h = o.rows || 7.62;
      ctx.save(); ctx.translate(0, 0);
      ctx.save(); DW.shadow(ctx, 1.4, 0.4, 0.9, 0.4);
      DW.rr(ctx, -1.2, -h + 1.0, w + 2.4, h - 2.0, 0.6);
      ctx.fillStyle = burn(p, DW.lin(ctx, 0, -h, 0, 0, [[0, '#2e3036'], [0.5, '#1c1d21'], [1, '#101114']])); ctx.fill(); ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(-1.0, -h + 1.2, w + 2.0, 0.4);
      ctx.fillStyle = '#0a0a0c'; ctx.beginPath(); ctx.arc(-1.2, -h / 2, 1.0, -Math.PI / 2, Math.PI / 2); ctx.fill();
      ctx.fillStyle = 'rgba(210,210,215,.5)'; ctx.beginPath(); ctx.arc(0.1, -1.3, 0.38, 0, TAU); ctx.fill();
      DW.text(ctx, txt, w / 2 + 0.5, -h / 2 - 0.4, Math.min(1.9, (w + 2) / (txt.length * 0.62)), 'rgba(238,238,240,.88)', { weight: 800 });
      if (sub) DW.text(ctx, sub, w / 2 + 0.5, -h / 2 + 1.4, 0.95, 'rgba(200,200,205,.55)', { weight: 600 });
      if (p.dead) { ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(-1.2, -h + 1, w + 2.4, h - 2); ctx.strokeStyle = '#9a7a4a'; ctx.lineWidth = 0.3; ctx.beginPath(); ctx.moveTo(w * 0.2, -h + 1.4); ctx.lineTo(w * 0.45, -h / 2); ctx.lineTo(w * 0.35, -1.4); ctx.stroke(); }
      ctx.restore();
    });
    const c0 = rigidPt(p, -1.2, -(o.rows || 7.62) + 1), c1 = rigidPt(p, w + 1.2, -1);
    v.hit.push({ id: p.id, kind: 'part', poly: [c0, [c1[0], c0[1]], c1, [c0[0], c1[1]]] });
    const c = rigidPt(p, w / 2, -(o.rows || 7.62) / 2); heat(ctx, p, c[0], c[1], 4, v);
    if (p.dead) v.smokeAt(p.id + 'ic', c[0], c[1], 0.5);
    return c;
  }
  DRAW.T555 = (ctx, p, W, v) => dip(ctx, p, W, v, 8, 'NE555', 'TEXAS');
  DRAW.OA = (ctx, p, W, v) => dip(ctx, p, W, v, 8, p.p.model === 'TL081' ? 'TL081' : p.p.model, 'op-amp');
  DRAW.LM358 = (ctx, p, W, v) => dip(ctx, p, W, v, 8, 'LM358', 'doble A.O.');
  DRAW.LM393 = (ctx, p, W, v) => dip(ctx, p, W, v, 8, 'LM393', 'doble comp.');
  DRAW.OPTO = (ctx, p, W, v) => dip(ctx, p, W, v, 4, 'PC817', '');

  DRAW.BR = (ctx, p, W, v) => {
    rigid(ctx, p, () => {
      for (let i = 0; i < 4; i++) DW.lead(ctx, i * 2.54, 0, i * 2.54, -2.2, 0.6);
      ctx.save(); DW.shadow(ctx, 1.4, 0.4, 0.9, 0.4);
      DW.rr(ctx, -1.4, -9.2, 10.6, 7.4, 0.8); ctx.fillStyle = burn(p, DW.lin(ctx, 0, -9, 0, -2, [[0, '#33363c'], [1, '#17181c']])); ctx.fill(); ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(-1.2, -9.0, 10.2, 0.4);
      DW.text(ctx, 'DB107', 3.8, -6.8, 1.5, 'rgba(238,238,240,.88)', { weight: 800 });
      ['~', '+', '~', '−'].forEach((t, i) => DW.text(ctx, t, i * 2.54, -3.4, 1.7, i === 1 ? '#ff8a7a' : 'rgba(235,235,240,.85)', { weight: 800 }));
      if (p.dead) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(-1.4, -9.2, 10.6, 7.4); }
    });
    const c = rigidPt(p, 3.8, -5.5); v.hit.push({ id: p.id, kind: 'part', poly: rigidBox(p, -1.4, -9.2, 9.2, -1.8) }); heat(ctx, p, c[0], c[1], 5, v);
  };
  DRAW.SEG7 = (ctx, p, W, v) => {
    rigid(ctx, p, () => {
      for (let j = 0; j < 10; j++) { const lx = j < 5 ? j * 2.54 : (9 - j) * 2.54, top = j >= 5; DW.lead(ctx, lx, top ? -15.24 : 0, lx, top ? -14 : -1.2, 0.5); }
      ctx.save(); DW.shadow(ctx, 1.4, 0.4, 0.9, 0.4);
      DW.rr(ctx, -1.6, -17.6, 13.4, 19.6 - 0.6, 0.6); ctx.fillStyle = '#16171a'; ctx.fill(); ctx.restore();
      ctx.fillStyle = '#0b0b0d'; DW.rr(ctx, -0.6, -16.4, 11.4, 17.2 - 0.6, 0.4); ctx.fill();
      const col = (MOD.LED[p.p.color] || MOD.LED.rojo).hex;
      const net = v.bench.net, r = net.rt[p.id];
      const on = (nm) => { if (p.dead || !r) return 0; const e = (r.els || []).find((q) => q.id === p.id + ':s' + nm); return e ? clamp(Math.pow(Math.max(0, e.i || 0) / 0.01, 0.6), 0, 1.2) : 0; };
      const seg = (nm, x, y, w, h) => { const b = on(nm); ctx.fillStyle = b > 0.03 ? DW.mixc(DW.mixc(col, '#000', 0.25), '#fff', Math.min(0.55, b * 0.35)) : '#2a1014'; ctx.globalAlpha = b > 0.03 ? Math.min(1, 0.55 + b * 0.5) : 0.55; ctx.beginPath();
        if (w > h) { ctx.moveTo(x, y); ctx.lineTo(x + h / 2, y - h / 2); ctx.lineTo(x + w - h / 2, y - h / 2); ctx.lineTo(x + w, y); ctx.lineTo(x + w - h / 2, y + h / 2); ctx.lineTo(x + h / 2, y + h / 2); } else { ctx.moveTo(x, y); ctx.lineTo(x + w / 2, y + w / 2); ctx.lineTo(x + w / 2, y + h - w / 2); ctx.lineTo(x, y + h); ctx.lineTo(x - w / 2, y + h - w / 2); ctx.lineTo(x - w / 2, y + w / 2); }
        ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; if (b > 0.1) v.glows.push({ x: 0, y: 0, local: true, _x: x, _y: y }); };
      void seg;
      const X0 = 2.2, Y0 = -14.4;
      const segs = [['a', X0 + 0.6, Y0, 5.6, 1.5], ['g', X0 + 0.6, Y0 + 6.6, 5.6, 1.5], ['d', X0 + 0.6, Y0 + 13.2, 5.6, 1.5], ['f', X0 - 0.3, Y0 + 0.6, 1.5, 6.0], ['b', X0 + 6.7, Y0 + 0.6, 1.5, 6.0], ['e', X0 - 0.3, Y0 + 7.2, 1.5, 6.0], ['c', X0 + 6.7, Y0 + 7.2, 1.5, 6.0]];
      for (const [nm, x, y, w, h] of segs) {
        const b = on(nm); ctx.fillStyle = b > 0.03 ? DW.mixc(col, '#ffffff', Math.min(0.5, b * 0.3)) : '#2c1216'; ctx.globalAlpha = b > 0.03 ? Math.min(1, 0.6 + b * 0.5) : 0.7;
        if (w > h) DW.rr(ctx, x, y, w, h, 0.7); else DW.rr(ctx, x, y, w, h, 0.7);
        ctx.fill(); ctx.globalAlpha = 1;
      }
      const bdp = on('DP'); ctx.fillStyle = bdp > 0.03 ? col : '#2c1216'; ctx.beginPath(); ctx.arc(X0 + 9.2, Y0 + 14.3, 0.8, 0, TAU); ctx.fill();
    });
    const c = rigidPt(p, 5.1, -8); v.hit.push({ id: p.id, kind: 'part', poly: rigidBox(p, -1.6, -17.6, 11.8, 1.4) });
    v.glows = v.glows.filter((g) => !g.local);
    const col = (MOD.LED[p.p.color] || MOD.LED.rojo).hex, r = v.bench.net.rt[p.id];
    if (r && !p.dead) { let tot = 0; for (const e of r.els || []) if (/:s/.test(e.id)) tot += Math.max(0, e.i || 0); if (tot > 0.002) v.glows.push({ x: c[0], y: c[1], r: 11, c: col, a: clamp(tot / 0.03, 0.1, 0.55) }); }
  };
  /* ---------- Relé, cargas y fuentes ---------- */
  DRAW.RELAY = (ctx, p, W, v) => {
    rigid(ctx, p, () => {
      W.pkg.forEach((q, j) => { const o = BB.TYPES.RELAY.geo(p).offs[j]; DW.lead(ctx, o[0], o[1], o[0], o[1] + (o[1] ? 1.4 : -1.4), 0.6); });
      ctx.save(); DW.shadow(ctx, 1.6, 0.5, 1.0, 0.4);
      DW.rr(ctx, -3.2, -11.2, 20.4, 13.6, 0.8); ctx.fillStyle = burn(p, DW.lin(ctx, 0, -11, 0, 2, [[0, '#2a5fc2'], [1, '#183d86']])); ctx.fill(); ctx.restore();
      DW.text(ctx, 'SRD-05VDC', 7, -6.2, 1.5, '#dfe7fb', { weight: 800 });
      DW.text(ctx, v.bench.net.rt[p.id] && v.bench.net.rt[p.id].ref && v.bench.net.rt[p.id].ref.relay && v.bench.net.rt[p.id].ref.relay.on ? 'CONECTADO' : 'reposo', 7, -3.2, 1.3, '#cfe0ff', { weight: 700 });
    });
    const c = rigidPt(p, 7, -5); v.hit.push({ id: p.id, kind: 'part', poly: rigidBox(p, -3.2, -11.2, 17.2, 2.4) }); heat(ctx, p, c[0], c[1], 6, v);
  };
  /* piezas con cuerpo suelto: cables desde el cuerpo hasta las patas */
  function bodyPos(p, W) { return p.body || [W.cat[0][0], W.cat[0][1] - 12]; }
  DRAW.LAMP = (ctx, p, W, v) => {
    const b = bodyPos(p, W);
    const r = v.bench.net.rt[p.id], th = r && r.lamp ? r.lamp.th : 0.11;
    const h = p.dead ? 0 : clamp((th - 0.2) / 0.8, 0, 1.2);
    ctx.save(); ctx.translate(b[0], b[1]);
    ctx.save(); DW.shadow(ctx, 1.4, 0.4, 0.8, 0.35);
    ctx.fillStyle = DW.lin(ctx, -3, 0, 3, 0, [[0, '#9aa0a8'], [0.5, '#dfe2e6'], [1, '#8a9099']]); DW.rr(ctx, -2.8, 3, 5.6, 4, 0.6); ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.arc(0, -1, 5.2, 0, TAU); ctx.fillStyle = `rgba(${230 + 25 * h},${236 + 15 * h},${245 - 40 * h},${0.28 + 0.4 * Math.min(h, 1)})`; ctx.fill();
    ctx.strokeStyle = 'rgba(180,190,200,.9)'; ctx.lineWidth = 0.3; ctx.stroke();
    ctx.strokeStyle = p.dead ? '#555' : DW.mixc('#6b4a2a', '#fff6c0', Math.min(1, h)); ctx.lineWidth = 0.45; ctx.beginPath(); ctx.moveTo(-1.2, 3); ctx.lineTo(-0.8, -0.2); ctx.lineTo(0, 0.8); ctx.lineTo(0.8, -0.2); ctx.lineTo(1.2, 3); ctx.stroke();
    if (p.dead) { ctx.strokeStyle = '#222'; ctx.beginPath(); ctx.moveTo(-0.8, -0.2); ctx.lineTo(-0.2, 1.4); ctx.stroke(); }
    ctx.restore();
    if (h > 0.05) v.glows.push({ x: b[0], y: b[1] - 1, r: 8 + 9 * Math.min(h, 1), c: '#ffd37a', a: 0.75 * Math.min(h, 1) });
    v.tether(p, b, [-1.8, 7], [1.8, 7], W);
    hitC(v, p, b[0], b[1], 6.4);
  };
  DRAW.MOT = (ctx, p, W, v) => {
    const b = bodyPos(p, W);
    const r = v.bench.net.rt[p.id], w = r && r.motor ? r.motor.w : 0;
    p._ang = (p._ang || 0) + (w || 0) * v.dt * 0.06;
    ctx.save(); ctx.translate(b[0], b[1]);
    ctx.save(); DW.shadow(ctx, 2, 0.6, 1.2, 0.4);
    DW.rr(ctx, -6, -8, 12, 16, 3); ctx.fillStyle = burn(p, DW.lin(ctx, -6, 0, 6, 0, [[0, '#9aa0a8'], [0.25, '#dfe2e6'], [0.6, '#aeb3ba'], [1, '#7c828b']])); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#2b2d31'; ctx.fillRect(-6, 5, 12, 3);
    ctx.fillStyle = '#c9ccd2'; ctx.fillRect(-0.6, -12, 1.2, 4);
    ctx.save(); ctx.translate(0, -12); ctx.rotate(p._ang);
    ctx.fillStyle = '#e7552b'; ctx.beginPath(); ctx.arc(0, 0, 4.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(-0.5, -4.4, 1, 4.4); ctx.restore();
    DW.text(ctx, 'M', 0, 0, 5, 'rgba(40,40,45,.55)', { weight: 800 });
    ctx.restore(); v.tether(p, b, [-2.5, 8], [2.5, 8], W); hitC(v, p, b[0], b[1], 8.5); heat(ctx, p, b[0], b[1], 7, v);
  };
  const spk = (ctx, p, W, v, active) => {
    const b = bodyPos(p, W);
    const r = v.bench.net.rt[p.id], e = r && r.ref && r.ref.main; const on = !p.dead && e && Math.abs(e.i || 0) > (active ? 0.006 : 0.0005);
    ctx.save(); ctx.translate(b[0], b[1]);
    ctx.save(); DW.shadow(ctx, 1.4, 0.4, 0.8, 0.4);
    ctx.beginPath(); ctx.arc(0, 0, active ? 6.0 : 7, 0, TAU); ctx.fillStyle = DW.rad(ctx, -1.5, -1.8, 0.5, 7, [[0, '#4a4b50'], [1, '#17181b']]); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#08090b'; ctx.beginPath(); ctx.arc(0, 0, active ? 1.0 : 2.2, 0, TAU); ctx.fill();
    if (!active) { ctx.strokeStyle = '#2b2c31'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.arc(0, 0, 4.4, 0, TAU); ctx.stroke(); }
    DW.text(ctx, '+', -3.7, -3.3, 1.9, '#e6e6e6', { weight: 800 });
    if (on) for (let k = 1; k <= 3; k++) { ctx.strokeStyle = `rgba(120,160,255,${0.55 - k * 0.12})`; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.arc(0, 0, 7.4 + k * 1.5 + ((v.t * 6) % 1.5), -0.7, 0.7); ctx.stroke(); }
    ctx.restore(); v.tether(p, b, [-2, 6.5], [2, 6.5], W); hitC(v, p, b[0], b[1], 7.4); heat(ctx, p, b[0], b[1], 6, v);
  };
  DRAW.SPK = (ctx, p, W, v) => spk(ctx, p, W, v, false);
  DRAW.BUZA = (ctx, p, W, v) => spk(ctx, p, W, v, true);
  DRAW.BATP = (ctx, p, W, v) => {
    const b = bodyPos(p, W), V = p.p.v;
    ctx.save(); ctx.translate(b[0], b[1]);
    if (p.p.kind === 'alk9') {
      ctx.save(); DW.shadow(ctx, 2, 0.6, 1.2, 0.4);
      DW.rr(ctx, -7.5, -10, 15, 22, 1.6); ctx.fillStyle = DW.lin(ctx, -7, 0, 7, 0, [[0, '#1a1b1f'], [0.5, '#2a2c32'], [1, '#17181b']]); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#c8a84a'; ctx.fillRect(-7.5, -4, 15, 9);
      ctx.fillStyle = '#b8bcc3'; ctx.beginPath(); ctx.arc(-3.2, -11, 1.9, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(3.2, -11, 1.9, 0, TAU); ctx.fill();
      DW.text(ctx, '9V', 0, 0.5, 4.4, '#2a2418', { weight: 800 });
    } else if (p.p.kind === 'usb') {
      ctx.save(); DW.shadow(ctx, 2, 0.6, 1.2, 0.4);
      DW.rr(ctx, -9, -7, 18, 14, 2.5); ctx.fillStyle = DW.lin(ctx, 0, -7, 0, 7, [[0, '#f4f5f7'], [1, '#c9ccd2']]); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#2d3036'; DW.rr(ctx, -4.5, 3, 9, 3.4, 0.8); ctx.fill();
      DW.text(ctx, '5 V', 0, -1.6, 4.4, '#2a2d33', { weight: 800 }); DW.text(ctx, 'USB · 1 A', 0, 1.3, 1.6, '#667', { weight: 700 });
    } else if (p.p.kind === 'li') {
      ctx.save(); DW.shadow(ctx, 2, 0.6, 1.2, 0.4);
      DW.rr(ctx, -9, -4.5, 18, 9, 4); ctx.fillStyle = DW.lin(ctx, 0, -4.5, 0, 4.5, [[0, '#4aa3d6'], [1, '#1e5f8a']]); ctx.fill(); ctx.restore();
      DW.text(ctx, '18650 3,7 V', 0, 0, 1.8, '#e8f4ff', { weight: 800 });
    } else {
      const n = p.p.kind === 'aa4' ? 4 : 2, w = n * 5.6 + 3;
      ctx.save(); DW.shadow(ctx, 2, 0.6, 1.2, 0.4);
      DW.rr(ctx, -w / 2, -5, w, 10, 1.6); ctx.fillStyle = DW.lin(ctx, 0, -5, 0, 5, [[0, '#2b2d33'], [1, '#141518']]); ctx.fill(); ctx.restore();
      for (let k = 0; k < n; k++) { ctx.fillStyle = DW.lin(ctx, 0, -3.4, 0, 3.4, [[0, '#d2a93b'], [1, '#8a6a1e']]); DW.rr(ctx, -w / 2 + 1.5 + k * 5.6, -3.4, 5.0, 6.8, 1.2); ctx.fill(); }
      DW.text(ctx, V + ' V', 0, 0, 2.6, '#111', { weight: 800 });
    }
    if (p.dead) { ctx.fillStyle = 'rgba(20,12,6,.55)'; ctx.fillRect(-8, -6, 16, 12); }
    ctx.restore();
    v.tether(p, b, [p.p.kind === 'alk9' ? -3.2 : -4, -11], [p.p.kind === 'alk9' ? 3.2 : 4, -11], W, ['#d73a31', '#1e1e22']);
    const e = v.bench.net.rt[p.id] && v.bench.net.rt[p.id].ref && v.bench.net.rt[p.id].ref.main;
    if (e && Math.abs(e.i) > 0.8) v.glows.push({ x: b[0], y: b[1], r: 14, c: '#ff6a2a', a: clamp(Math.abs(e.i) / 5, 0.15, 0.7) });
    hitC(v, p, b[0], b[1], 11); heat(ctx, p, b[0], b[1], 8, v);
  };

  /* ---------- Despachador ---------- */
  DW.part = function (ctx, p, v) {
    const f = DRAW[p.k];
    if (!f) return;
    /* salvaguarda: cada pieza deja el estado del lienzo como lo encontró, aunque su dibujo desequilibre save/restore */
    let depth = 0;
    const sv = CanvasRenderingContext2D.prototype.save, rs = CanvasRenderingContext2D.prototype.restore;
    ctx.save = function () { depth++; sv.call(ctx); };
    ctx.restore = function () { if (depth > 0) { depth--; rs.call(ctx); } };
    try { f(ctx, p, p._w, v); } finally { while (depth > 0) { depth--; rs.call(ctx); } delete ctx.save; delete ctx.restore; }
    /* patas sin insertar: punto rojo */
    if (v.showPins) {
      const W = p._w;
      const loose = (q, h) => { if (!h) { ctx.fillStyle = 'rgba(230,60,40,.85)'; ctx.beginPath(); ctx.arc(q[0], q[1], 0.7, 0, TAU); ctx.fill(); } };
      if (BB.TYPES[p.k].flex) W.cat.forEach((q, i) => loose(q, p._h[i])); else if (!p._hp) W.pkg.forEach((q) => loose([q.x, q.y], false));
    }
  };
})();
