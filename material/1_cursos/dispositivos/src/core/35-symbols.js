/* ===================================================================
   35-symbols.js — Símbolos esquemáticos (estilo ANSI/IEEE, como en Sedra/Smith y Boylestad)
   Cada símbolo se dibuja en la cuadrícula local (1 unidad = 1 paso), con el lienzo ya trasladado,
   girado y volteado. «st» lleva el estado en vivo (brillo, abierto/cerrado, daño…).
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM, PT = EM.parts, CAT = PT.CAT;
  const SYM = (EM.sym = {});
  const TAU = Math.PI * 2;

  const path = (ctx, pts, close) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); if (close) ctx.closePath(); };
  const line = (ctx, pts) => { path(ctx, pts); ctx.stroke(); };
  const circ = (ctx, x, y, r, fill) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); if (fill) ctx.fill(); else ctx.stroke(); };
  const arrow = (ctx, x0, y0, x1, y1, s = 0.28) => {
    const a = Math.atan2(y1 - y0, x1 - x0);
    line(ctx, [[x0, y0], [x1, y1]]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 - s * Math.cos(a - 0.45), y1 - s * Math.sin(a - 0.45)); ctx.lineTo(x1 - s * Math.cos(a + 0.45), y1 - s * Math.sin(a + 0.45)); ctx.closePath(); ctx.fill();
  };
  /* texto que no se gira con el símbolo: se dibuja desde el anfitrión; aquí solo texto fijo local */
  const txt = (ctx, s, x, y, size = 0.8, align = 'center') => { ctx.save(); ctx.font = `600 ${size}px ${EM.FONT_UI}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); ctx.restore(); };
  SYM.line = line; SYM.circ = circ; SYM.arrow = arrow; SYM.txt = txt;

  /* conductores desde los pines hasta el cuerpo (los símbolos los dibujan ellos) */
  const lead2 = (ctx, a, b) => { line(ctx, [[-2, 0], [a, 0]]); line(ctx, [[b, 0], [2, 0]]); };
  const diodeTri = (ctx, x0, x1, h, fill) => { path(ctx, [[x0, -h], [x0, h], [x1, 0]], true); if (fill) ctx.fill(); ctx.stroke(); };
  const rays = (ctx, out, x, y, n = 2) => { for (let k = 0; k < n; k++) { const sx = x + k * 0.6, sy = y - k * 0.2; if (out) arrow(ctx, sx, sy, sx + 0.7, sy - 0.7, 0.22); else arrow(ctx, sx + 0.7, sy - 0.7, sx, sy, 0.22); } };

  const D = {
    GND(ctx) { line(ctx, [[0, 0], [0, 0.7]]); line(ctx, [[-0.9, 0.7], [0.9, 0.7]]); line(ctx, [[-0.55, 1.1], [0.55, 1.1]]); line(ctx, [[-0.2, 1.5], [0.2, 1.5]]); },
    LBL(ctx, P) { line(ctx, [[0, 0], [0.5, 0]]); path(ctx, [[0.5, 0], [0.9, -0.6], [3.2, -0.6], [3.2, 0.6], [0.9, 0.6]], true); ctx.save(); ctx.globalAlpha = 0.12; ctx.fill(); ctx.restore(); ctx.stroke(); },
    R(ctx) {
      line(ctx, [[-2, 0], [-1.4, 0]]); line(ctx, [[1.4, 0], [2, 0]]);
      line(ctx, [[-1.4, 0], [-1.05, -0.7], [-0.35, 0.7], [0.35, -0.7], [1.05, 0.7], [1.4, 0]]);
    },
    POT(ctx, P) {
      D.R(ctx);
      arrow(ctx, 0, -2, 0, -0.55, 0.3);
      const w = P.p.taper === 'log' ? (Math.pow(10, 2 * P.p.pos) - 1) / 99 : P.p.pos;
      ctx.save(); ctx.fillStyle = EM.col('--accent'); circ(ctx, -1.4 + 2.8 * w, 0, 0.16, true); ctx.restore();
    },
    C(ctx, P) {
      const polar = (CAT.C && (P.p.kind === 'elec' || P.p.kind === 'tant' || P.p.kind === 'super'));
      line(ctx, [[-2, 0], [-0.32, 0]]); line(ctx, [[0.32, 0], [2, 0]]);
      line(ctx, [[-0.32, -1.0], [-0.32, 1.0]]);
      if (polar) { ctx.beginPath(); ctx.moveTo(0.55, -1.0); ctx.quadraticCurveTo(0.1, 0, 0.55, 1.0); ctx.stroke(); txt(ctx, '+', -1.0, -0.95, 0.9); }
      else line(ctx, [[0.32, -1.0], [0.32, 1.0]]);
    },
    L(ctx, P) {
      line(ctx, [[-2, 0], [-1.6, 0]]); line(ctx, [[1.6, 0], [2, 0]]);
      ctx.beginPath(); ctx.moveTo(-1.6, 0);
      for (let k = 0; k < 4; k++) ctx.arc(-1.2 + 0.8 * k, 0, 0.4, Math.PI, 0, false);
      ctx.stroke();
      if (P.p.kind === 'ferrite' || P.p.kind === 'power') { line(ctx, [[-1.6, -0.75], [1.6, -0.75]]); line(ctx, [[-1.6, -0.9], [1.6, -0.9]]); }
    },
    TR(ctx, P) {
      const coil = (x, dir, y0, y1) => { ctx.beginPath(); ctx.moveTo(x, y0); const n = 4, h = (y1 - y0) / n; for (let k = 0; k < n; k++) ctx.arc(x, y0 + h * (k + 0.5), h / 2, -Math.PI / 2, Math.PI / 2, dir < 0); ctx.stroke(); };
      line(ctx, [[-3, -2], [-1.0, -2]]); line(ctx, [[-3, 2], [-1.0, 2]]);
      line(ctx, [[3, -2], [1.0, -2]]); line(ctx, [[3, 2], [1.0, 2]]);
      coil(-1.0, -1, -2, 2); coil(1.0, 1, -2, 2);
      line(ctx, [[-0.2, -2], [-0.2, 2]]); line(ctx, [[0.2, -2], [0.2, 2]]);
      ctx.save(); ctx.fillStyle = EM.col('--ink'); circ(ctx, -1.9, -1.55, 0.14, true); circ(ctx, 1.9, -1.55, 0.14, true); ctx.restore();
    },
    TRCT(ctx, P) {
      const coil = (x, dir, y0, y1, n) => { ctx.beginPath(); ctx.moveTo(x, y0); const h = (y1 - y0) / n; for (let k = 0; k < n; k++) ctx.arc(x, y0 + h * (k + 0.5), h / 2, -Math.PI / 2, Math.PI / 2, dir < 0); ctx.stroke(); };
      line(ctx, [[-3, -2], [-1.0, -2]]); line(ctx, [[-3, 2], [-1.0, 2]]);
      line(ctx, [[3, -3], [1.0, -3]]); line(ctx, [[3, 3], [1.0, 3]]); line(ctx, [[3, 0], [1.0, 0]]);
      coil(-1.0, -1, -2, 2, 4); coil(1.0, 1, -3, 3, 6);
      line(ctx, [[-0.2, -3], [-0.2, 3]]); line(ctx, [[0.2, -3], [0.2, 3]]);
    },
    VDC(ctx) { line(ctx, [[0, -2], [0, -0.35]]); line(ctx, [[0, 0.35], [0, 2]]); line(ctx, [[-0.9, -0.35], [0.9, -0.35]]); ctx.save(); ctx.lineWidth *= 2.4; line(ctx, [[-0.5, 0.35], [0.5, 0.35]]); ctx.restore(); txt(ctx, '+', 1.25, -0.95, 0.9); txt(ctx, '−', 1.25, 1.0, 0.9); },
    BAT(ctx) { line(ctx, [[0, -2], [0, -0.9]]); line(ctx, [[0, 0.9], [0, 2]]); line(ctx, [[-0.9, -0.9], [0.9, -0.9]]); ctx.save(); ctx.lineWidth *= 2.4; line(ctx, [[-0.5, -0.3], [0.5, -0.3]]); line(ctx, [[-0.5, 0.9], [0.5, 0.9]]); ctx.restore(); line(ctx, [[-0.9, 0.3], [0.9, 0.3]]); line(ctx, [[0, -0.9], [0, -0.3]]); line(ctx, [[0, 0.3], [0, 0.9]]); txt(ctx, '+', 1.25, -1.2, 0.9); },
    VAC(ctx) {
      line(ctx, [[0, -2], [0, -1.25]]); line(ctx, [[0, 1.25], [0, 2]]); circ(ctx, 0, 0, 1.25);
      ctx.beginPath(); ctx.moveTo(-0.7, 0); ctx.bezierCurveTo(-0.45, -0.9, -0.2, -0.9, 0, 0); ctx.bezierCurveTo(0.2, 0.9, 0.45, 0.9, 0.7, 0); ctx.stroke();
    },
    MAINS(ctx) { D.VAC(ctx); },
    IDC(ctx) { line(ctx, [[0, -2], [0, -1.25]]); line(ctx, [[0, 1.25], [0, 2]]); circ(ctx, 0, 0, 1.25); arrow(ctx, 0, 0.8, 0, -0.8, 0.35); },
    D(ctx) { lead2(ctx, -0.7, 0.7); diodeTri(ctx, -0.7, 0.7, 0.85, false); line(ctx, [[0.7, -0.85], [0.7, 0.85]]); },
    LED(ctx, P, st) {
      D.D(ctx);
      rays(ctx, true, -0.1, -1.0, 2);
      if (st && st.bright > 0.02) { const c = (EM.spice.MOD.LED[P.p.color] || {}).hex || '#f44'; ctx.save(); ctx.globalAlpha = Math.min(1, st.bright) * 0.9; ctx.fillStyle = c; path(ctx, [[-0.7, -0.85], [-0.7, 0.85], [0.7, 0]], true); ctx.fill(); ctx.restore(); }
    },
    ZD(ctx) { lead2(ctx, -0.7, 0.7); diodeTri(ctx, -0.7, 0.7, 0.85, false); line(ctx, [[0.35, -0.85], [0.7, -0.85], [0.7, 0.85], [1.05, 0.85]]); },
    TVS(ctx) { D.ZD(ctx); },
    PD(ctx) { D.D(ctx); rays(ctx, false, -0.7, -1.1, 2); },
    SOLAR(ctx) {
      line(ctx, [[0, -2], [0, -0.7]]); line(ctx, [[0, 0.7], [0, 2]]);
      ctx.save(); ctx.translate(0, 0); ctx.rotate(Math.PI / 2); ctx.translate(0, 0);
      ctx.restore();
      line(ctx, [[-0.9, -0.7], [0.9, -0.7]]); line(ctx, [[-0.9, 0.7], [0.9, 0.7]]);
      path(ctx, [[-0.9, 0.7], [0.9, 0.7], [0, -0.7]], true); ctx.stroke();
      rays(ctx, false, -2.6, -1.2, 2);
      txt(ctx, '+', 0.75, -1.2, 0.8);
    },
    VCAP(ctx) { D.D(ctx); line(ctx, [[1.0, -0.85], [1.0, 0.85]]); },
    BR(ctx) {
      line(ctx, [[0, -3], [0, -2]]); line(ctx, [[0, 3], [0, 2]]); line(ctx, [[-3, 0], [-2, 0]]); line(ctx, [[3, 0], [2, 0]]);
      path(ctx, [[-2, 0], [0, -2], [2, 0], [0, 2]], true); ctx.stroke();
      const tri = (cx, cy, ang) => { ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang); path(ctx, [[-0.3, -0.35], [-0.3, 0.35], [0.3, 0]], true); ctx.fill(); line(ctx, [[0.3, -0.35], [0.3, 0.35]]); ctx.restore(); };
      tri(-0.7, -0.7, Math.PI / 4); tri(0.7, -0.7, Math.PI * 3 / 4 + Math.PI); tri(-0.7, 0.7, -Math.PI / 4 + Math.PI); tri(0.7, 0.7, -Math.PI * 3 / 4 + Math.PI);
      txt(ctx, '~', -1.2, 0, 0.8); txt(ctx, '~', 1.2, 0, 0.8); txt(ctx, '+', 0.55, -2.2, 0.8); txt(ctx, '−', 0.55, 2.3, 0.8);
    },
    SCR(ctx, P, st) {
      lead2(ctx, -0.7, 0.7); diodeTri(ctx, -0.7, 0.7, 0.85, false); line(ctx, [[0.7, -0.85], [0.7, 0.85]]); line(ctx, [[0.7, 0.4], [1, 0.8], [1, 2]]);
      if (st && st.on) { ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = EM.col('--accent'); path(ctx, [[-0.7, -0.85], [-0.7, 0.85], [0.7, 0]], true); ctx.fill(); ctx.restore(); }
    },
    TRIAC(ctx, P, st) {
      line(ctx, [[-2, 0], [-1.2, 0]]); line(ctx, [[1.2, 0], [2, 0]]); line(ctx, [[-1.2, -0.85], [-1.2, 0.85]]); line(ctx, [[1.2, -0.85], [1.2, 0.85]]);
      path(ctx, [[-1.2, -0.85], [-1.2, 0.85], [0, 0]], true); ctx.stroke(); path(ctx, [[1.2, -0.85], [1.2, 0.85], [0, 0]], true); ctx.stroke();
      line(ctx, [[0.9, 0.5], [1, 2]]);
      if (st && st.on) { ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = EM.col('--accent'); path(ctx, [[-1.2, -0.85], [-1.2, 0.85], [0, 0]], true); ctx.fill(); path(ctx, [[1.2, -0.85], [1.2, 0.85], [0, 0]], true); ctx.fill(); ctx.restore(); }
    },
    DIAC(ctx) { line(ctx, [[-2, 0], [-1.2, 0]]); line(ctx, [[1.2, 0], [2, 0]]); path(ctx, [[-1.2, -0.85], [-1.2, 0.85], [0, 0]], true); ctx.stroke(); path(ctx, [[1.2, -0.85], [1.2, 0.85], [0, 0]], true); ctx.stroke(); line(ctx, [[-1.2, -0.85], [-1.2, 0.85]]); line(ctx, [[1.2, -0.85], [1.2, 0.85]]); },
    NPN(ctx, P) { bjt(ctx, 1); },
    PNP(ctx, P) { bjt(ctx, -1); },
    DARL(ctx) { bjt(ctx, 1); txt(ctx, 'D', 0.5, 0, 0.6); },
    NMOS(ctx, P) { mos(ctx, 1); },
    PMOS(ctx, P) { mos(ctx, -1); },
    JFN(ctx) { jfet(ctx, 1); },
    JFP(ctx) { jfet(ctx, -1); },
    OPTO(ctx, P, st) {
      ctx.save(); ctx.setLineDash([0.25, 0.2]); ctx.strokeRect(-1.6, -1.8, 3.2, 3.6); ctx.restore();
      line(ctx, [[-3, -1], [-1.6, -1]]); line(ctx, [[-3, 1], [-1.6, 1]]);
      // LED
      ctx.save(); ctx.translate(-0.9, 0); ctx.rotate(Math.PI / 2); path(ctx, [[-0.5, -0.5], [-0.5, 0.5], [0.4, 0]], true); ctx.stroke(); line(ctx, [[0.4, -0.5], [0.4, 0.5]]); ctx.restore();
      line(ctx, [[-1.6, -1], [-0.9, -1], [-0.9, -0.5]]); line(ctx, [[-1.6, 1], [-0.9, 1], [-0.9, 0.5]]);
      arrow(ctx, -0.5, -0.4, 0.3, -0.4, 0.2); arrow(ctx, -0.5, 0.1, 0.3, 0.1, 0.2);
      // fototransistor
      line(ctx, [[0.8, -0.6], [0.8, 0.6]]); line(ctx, [[0.8, -0.2], [1.6, -1]]); arrow(ctx, 0.8, 0.2, 1.6, 1, 0.22);
      line(ctx, [[1.6, -1], [3, -1]]); line(ctx, [[1.6, 1], [3, 1]]);
    },
    OA(ctx, P) {
      line(ctx, [[-3, -1], [-2.5, -1]]); line(ctx, [[-3, 1], [-2.5, 1]]); line(ctx, [[2.9, 0], [3, 0]]);
      path(ctx, [[-2.5, -2.5], [-2.5, 2.5], [3, 0]], true); ctx.stroke();
      txt(ctx, '+', -2.0, -1, 0.9); txt(ctx, '−', -2.0, 1, 0.9);
      line(ctx, [[0, -2], [0, -1.36]]); line(ctx, [[0, 2], [0, 1.36]]);
    },
    CMP(ctx) { D.OA(ctx); txt(ctx, '▭', 0.5, 0, 0.6); },
    REG(ctx, P) {
      ctx.strokeRect(-2.2, -1.2, 4.4, 2.4);
      line(ctx, [[-3, 0], [-2.2, 0]]); line(ctx, [[2.2, 0], [3, 0]]); line(ctx, [[0, 1.2], [0, 2]]);
      txt(ctx, 'IN', -1.45, 0, 0.55); txt(ctx, 'OUT', 1.4, 0, 0.55); txt(ctx, 'COM', 0.0, 0.85, 0.45);
      txt(ctx, (EM.spice.MOD.REG[P.p.model] || {}).name ? (EM.spice.MOD.REG[P.p.model].name.split(' ')[0]) : '', 0, -0.45, 0.7);
    },
    T555(ctx) {
      ctx.strokeRect(-3, -3.6, 6, 7.2);
      const pins = ['RESET', 'TRIG', 'THR', 'CTRL'], right = ['OUT', 'DIS'];
      for (let i = 0; i < 4; i++) { line(ctx, [[-4, -3 + 2 * i], [-3, -3 + 2 * i]]); txt(ctx, pins[i], -2.8, -3 + 2 * i, 0.5, 'left'); }
      for (let i = 0; i < 2; i++) { line(ctx, [[3, -1 + 2 * i], [4, -1 + 2 * i]]); txt(ctx, right[i], 2.8, -1 + 2 * i, 0.5, 'right'); }
      line(ctx, [[0, -5], [0, -3.6]]); line(ctx, [[0, 3.6], [0, 5]]); txt(ctx, 'VCC', 0, -3.2, 0.5); txt(ctx, 'GND', 0, 3.2, 0.5);
      txt(ctx, '555', 0, 0, 1.1);
    },
    NTC(ctx) { D.R(ctx); line(ctx, [[-1.4, 1.1], [-0.4, 1.1], [1.0, -1.2]]); txt(ctx, '−t°', 1.3, -1.35, 0.55); },
    LDR(ctx) { D.R(ctx); circ(ctx, 0, 0, 1.45); arrow(ctx, -2.1, -2.0, -1.0, -1.0, 0.25); arrow(ctx, -1.4, -2.2, -0.4, -1.3, 0.25); },
    VAR(ctx) { D.R(ctx); line(ctx, [[-1.2, 1.2], [-0.4, 1.2], [1.0, -1.1]]); txt(ctx, 'U', 1.4, -1.2, 0.5); },
    LAMP(ctx, P, st) {
      line(ctx, [[-2, 0], [-1.2, 0]]); line(ctx, [[1.2, 0], [2, 0]]);
      if (st && st.glow > 0.02) { ctx.save(); const g = ctx.createRadialGradient(0, 0, 0.3, 0, 0, 2.6); g.addColorStop(0, `rgba(255,220,120,${Math.min(0.9, st.glow)})`); g.addColorStop(1, 'rgba(255,200,80,0)'); ctx.fillStyle = g; circ(ctx, 0, 0, 2.6, true); ctx.restore(); }
      circ(ctx, 0, 0, 1.2); line(ctx, [[-0.85, -0.85], [0.85, 0.85]]); line(ctx, [[-0.85, 0.85], [0.85, -0.85]]);
    },
    FUSE(ctx, P, st) {
      line(ctx, [[-2, 0], [-1.3, 0]]); line(ctx, [[1.3, 0], [2, 0]]);
      ctx.strokeRect(-1.3, -0.5, 2.6, 1);
      if (st && st.blown) { ctx.save(); ctx.lineWidth *= 1; ctx.beginPath(); ctx.moveTo(-1.3, 0); ctx.lineTo(-0.4, 0); ctx.moveTo(0.4, 0); ctx.lineTo(1.3, 0); ctx.stroke(); ctx.restore(); }
      else line(ctx, [[-1.3, 0], [1.3, 0]]);
    },
    SW(ctx, P) {
      line(ctx, [[-2, 0], [-1, 0]]); line(ctx, [[1, 0], [2, 0]]);
      ctx.save(); ctx.fillStyle = EM.col('--ink'); circ(ctx, -1, 0, 0.18, true); circ(ctx, 1, 0, 0.18, true); ctx.restore();
      if (P.p.on) line(ctx, [[-1, 0], [1, 0]]); else line(ctx, [[-1, 0], [0.8, -0.9]]);
      if (P.p.momentary) { line(ctx, [[0, -1.2], [0, -0.85]]); line(ctx, [[-0.5, -1.2], [0.5, -1.2]]); }
    },
    JMP(ctx, P) {
      ctx.save(); ctx.strokeStyle = EM.col('--c2'); ctx.setLineDash(P.p.on ? [] : [0.3, 0.25]); line(ctx, [[-2, 0], [-1.4, 0], [-1.1, -0.8], [-0.5, 0.8], [0.1, -0.8], [0.7, 0.8], [1.1, -0.2], [1.4, 0], [2, 0]]); ctx.restore();
    },
    SPDT(ctx, P) {
      line(ctx, [[-2, 0], [-1, 0]]); line(ctx, [[1, -1], [2, -1]]); line(ctx, [[1, 1], [2, 1]]);
      ctx.save(); ctx.fillStyle = EM.col('--ink'); circ(ctx, -1, 0, 0.18, true); circ(ctx, 1, -1, 0.18, true); circ(ctx, 1, 1, 0.18, true); ctx.restore();
      line(ctx, [[-1, 0], [0.85, +P.p.pos === 0 ? -0.9 : 0.9]]);
    },
    RELAY(ctx, P, st) {
      line(ctx, [[-3, -1], [-1.6, -1]]); line(ctx, [[-3, 1], [-1.6, 1]]);
      ctx.strokeRect(-1.6, -1.4, 1.8, 2.8); line(ctx, [[-0.7, -1.4], [-0.7, -1]]);
      for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(-0.7, -0.95 + 0.5 * k, 0.28, -Math.PI / 2, Math.PI / 2); ctx.stroke(); }
      ctx.save(); ctx.setLineDash([0.18, 0.18]); line(ctx, [[0.2, 0], [1.0, 0]]); ctx.restore();
      line(ctx, [[3, 0], [2, 0]]); line(ctx, [[3, -2], [2, -2]]); line(ctx, [[3, 2], [2, 2]]);
      ctx.save(); ctx.fillStyle = EM.col('--ink'); circ(ctx, 2, 0, 0.16, true); circ(ctx, 2, -2, 0.16, true); circ(ctx, 2, 2, 0.16, true); ctx.restore();
      line(ctx, [[2, 0], [0.6, st && st.on ? -1.6 : 1.6]]);
    },
    MOT(ctx, P, st) {
      line(ctx, [[-2, 0], [-1.4, 0]]); line(ctx, [[1.4, 0], [2, 0]]); circ(ctx, 0, 0, 1.4);
      ctx.save(); ctx.rotate(st && st.ang ? st.ang : 0); txt(ctx, 'M', 0, 0, 1.2); ctx.restore();
    },
    SPK(ctx) { line(ctx, [[-2, 0], [-1.0, 0]]); path(ctx, [[-1, -0.7], [0, -0.7], [0, 0.7], [-1, 0.7]], true); ctx.stroke(); path(ctx, [[0, -0.7], [1.2, -1.6], [1.2, 1.6], [0, 0.7]], true); ctx.stroke(); line(ctx, [[1.2, 0], [2, 0]]); },
    AMM(ctx, P, st) { line(ctx, [[-2, 0], [-1.3, 0]]); line(ctx, [[1.3, 0], [2, 0]]); circ(ctx, 0, 0, 1.3); txt(ctx, 'A', 0, 0.05, 1.4); },
    VM(ctx) { line(ctx, [[-2, 0], [-1.3, 0]]); line(ctx, [[1.3, 0], [2, 0]]); circ(ctx, 0, 0, 1.3); txt(ctx, 'V', 0, 0.05, 1.4); },
    PROBE(ctx) { line(ctx, [[0, 0], [0.5, -0.5]]); path(ctx, [[0.5, -0.5], [0.15, -0.55], [0.5, -0.9]], true); ctx.fill(); ctx.save(); ctx.strokeStyle = EM.col('--c3'); circ(ctx, 0, 0, 0.3); ctx.restore(); },
    /* instrumentos con cara propia */
    DMM(ctx, P, st) { instrument.dmm(ctx, P, st); },
    SCOPE(ctx, P, st) { instrument.scope(ctx, P, st); },
    FG(ctx, P, st) { instrument.fg(ctx, P, st); },
    PSU(ctx, P, st) { instrument.psu(ctx, P, st); }
  };

  function bjt(ctx, pol) {
    line(ctx, [[-2, 0], [-0.55, 0]]); ctx.save(); ctx.lineWidth *= 2.2; line(ctx, [[-0.55, -1.15], [-0.55, 1.15]]); ctx.restore();
    line(ctx, [[-0.55, -0.55], [2, -1.45], [2, -2]]);
    line(ctx, [[-0.55, 0.55], [2, 1.45], [2, 2]]);
    /* flecha del emisor */
    if (pol > 0) arrow(ctx, 0.9, 1.05, 1.55, 1.3, 0.34); else arrow(ctx, 1.55, 1.3, 0.1, 0.77, 0.34);
  }
  function mos(ctx, pol) {
    line(ctx, [[-2, 0], [-0.8, 0]]); line(ctx, [[-0.8, -1.3], [-0.8, 1.3]]);
    for (const [a, b] of [[-1.5, -0.95], [-0.4, 0.4], [0.95, 1.5]]) line(ctx, [[-0.35, a], [-0.35, b]]);
    line(ctx, [[-0.35, -1.25], [2, -1.25], [2, -2]]); line(ctx, [[-0.35, 1.25], [2, 1.25], [2, 2]]); line(ctx, [[-0.35, 0], [0.9, 0], [0.9, 1.25]]);
    if (pol > 0) arrow(ctx, 0.9, 0, -0.3, 0, 0.3); else arrow(ctx, -0.3, 0, 0.9, 0, 0.3);
  }
  function jfet(ctx, pol) {
    line(ctx, [[-2, 0], [-0.9, 0]]);
    line(ctx, [[-0.3, -1.4], [-0.3, 1.4]]);
    line(ctx, [[-0.3, -1.25], [2, -1.25], [2, -2]]); line(ctx, [[-0.3, 1.25], [2, 1.25], [2, 2]]);
    if (pol > 0) arrow(ctx, -1.2, 0, -0.4, 0, 0.3); else arrow(ctx, -0.4, 0, -1.2, 0, 0.3);
  }

  /* ---------- Instrumentos ---------- */
  const rrect = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  const instrument = {
    dmm(ctx, P, st) {
      ctx.save();
      rrect(ctx, -3, -4, 6, 7.4, 0.6); ctx.fillStyle = '#e8b82a'; ctx.fill(); ctx.strokeStyle = '#6b5410'; ctx.lineWidth = 0.12; ctx.stroke();
      rrect(ctx, -2.5, -3.5, 5, 2.3, 0.3); ctx.fillStyle = '#c8d6c0'; ctx.fill(); ctx.strokeStyle = '#46503f'; ctx.stroke();
      ctx.fillStyle = '#1d2a1d';
      const s = st && st.text !== undefined ? st.text : '----';
      ctx.font = `700 1.2px ${EM.FONT_MONO}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(s, 2.3, -2.55);
      ctx.font = `600 0.5px ${EM.FONT_UI}`; ctx.textAlign = 'left'; ctx.fillText(st && st.unit ? st.unit : P.p.mode, -2.35, -3.15);
      ctx.fillStyle = '#2b2b2f'; circ(ctx, 0, 1.05, 1.0, true);
      const modes = ['V=', 'V~', 'A=', 'A~', 'Ω', '→|', '·)))'];
      const ang = (i) => (200 + i * (140 / 6)) * Math.PI / 180;
      const ix = Math.max(0, modes.indexOf(P.p.mode));
      ctx.strokeStyle = '#f2f2f2'; ctx.lineWidth = 0.16; line(ctx, [[0, 1.05], [Math.cos(ang(ix)) * 0.9, 1.05 + Math.sin(ang(ix)) * 0.9]]);
      ctx.fillStyle = '#222'; ctx.font = `700 0.5px ${EM.FONT_UI}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      modes.forEach((m, i) => { ctx.fillStyle = i === ix ? '#7a0f0a' : '#222'; ctx.fillText(m, Math.cos(ang(i)) * 1.72, 1.05 + Math.sin(ang(i)) * 1.72); });
      // bornes
      ctx.fillStyle = '#c1221b'; circ(ctx, -1, 4, 0.34, true); ctx.fillStyle = '#111'; circ(ctx, 1, 4, 0.34, true);
      ctx.strokeStyle = '#c1221b'; ctx.lineWidth = 0.14; line(ctx, [[-1, 3.4], [-1, 4]]); ctx.strokeStyle = '#111'; line(ctx, [[1, 3.4], [1, 4]]);
      ctx.fillStyle = '#222'; ctx.font = `700 0.5px ${EM.FONT_UI}`; ctx.fillText('VΩA', -1, 2.85); ctx.fillText('COM', 1, 2.85);
      ctx.restore();
    },
    scope(ctx, P, st) {
      ctx.save();
      rrect(ctx, -5, -4.5, 10, 9, 0.5); ctx.fillStyle = '#3a4048'; ctx.fill(); ctx.strokeStyle = '#161a1f'; ctx.lineWidth = 0.12; ctx.stroke();
      rrect(ctx, -4.5, -4, 6.4, 5.6, 0.25); ctx.fillStyle = '#071108'; ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.rect(-4.5, -4, 6.4, 5.6); ctx.clip();
      ctx.strokeStyle = 'rgba(80,200,90,.25)'; ctx.lineWidth = 0.04;
      for (let i = 1; i < 8; i++) line(ctx, [[-4.5 + i * 0.8, -4], [-4.5 + i * 0.8, 1.6]]);
      for (let j = 1; j < 6; j++) line(ctx, [[-4.5, -4 + j * 0.933], [1.9, -4 + j * 0.933]]);
      const tr = st && st.trace;
      if (tr) for (const t of tr) { if (!t.y || !t.y.length) continue; ctx.strokeStyle = t.color; ctx.lineWidth = 0.09; ctx.beginPath(); for (let i = 0; i < t.y.length; i++) { const x = -4.5 + (i / (t.y.length - 1)) * 6.4, y = -1.2 - Math.max(-2.7, Math.min(2.7, t.y[i])) * 0.9; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = '#9aa3ad'; circ(ctx, 3.4, -2.8, 0.7, true); circ(ctx, 3.4, -0.7, 0.7, true); ctx.fillStyle = '#222'; circ(ctx, 3.4, -2.8, 0.2, true); circ(ctx, 3.4, -0.7, 0.2, true);
      ctx.fillStyle = '#fff'; ctx.font = `700 0.5px ${EM.FONT_UI}`; ctx.textAlign = 'center'; ctx.fillText('OSCILOSCOPIO', 0, 2.3);
      const cols = ['#ffd84a', '#4ae3ff', '#bbb'];
      [[-3, 'CH1'], [0, 'CH2'], [3, 'GND']].forEach(([x, nm], i) => { ctx.fillStyle = cols[i]; circ(ctx, x, 5, 0.34, true); ctx.fillStyle = '#fff'; ctx.fillText(nm, x, 4.2); });
      ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = 0.1; line(ctx, [[-3, 4.5], [-3, 5]]); ctx.strokeStyle = '#4ae3ff'; line(ctx, [[0, 4.5], [0, 5]]); ctx.strokeStyle = '#bbb'; line(ctx, [[3, 4.5], [3, 5]]);
      ctx.restore();
    },
    fg(ctx, P, st) {
      ctx.save();
      rrect(ctx, -4, -3.2, 7, 6.4, 0.5); ctx.fillStyle = '#5a6b86'; ctx.fill(); ctx.strokeStyle = '#273244'; ctx.lineWidth = 0.12; ctx.stroke();
      rrect(ctx, -3.5, -2.7, 4, 2.4, 0.2); ctx.fillStyle = '#0d1b24'; ctx.fill();
      ctx.strokeStyle = '#6ef0ff'; ctx.lineWidth = 0.1; ctx.beginPath();
      const w = P.p.wave;
      for (let i = 0; i <= 60; i++) { const ph = i / 60 * 2, x = -3.3 + i / 60 * 3.6; let y; const fr = ph % 1;
        if (w === 'sin') y = Math.sin(ph * TAU); else if (w === 'square') y = fr < 0.5 ? 1 : -1; else if (w === 'tri') y = fr < 0.5 ? 4 * fr - 1 : 3 - 4 * fr; else if (w === 'saw') y = 2 * fr - 1; else y = fr < P.p.duty ? 1 : -1;
        i ? ctx.lineTo(x, -1.5 - y * 0.7) : ctx.moveTo(x, -1.5 - y * 0.7); }
      ctx.stroke();
      ctx.fillStyle = '#9fe9ff'; ctx.font = `700 0.6px ${EM.FONT_MONO}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(EM.si(P.p.f, 'Hz', 3), -3.3, -0.55);
      ctx.fillStyle = '#e4e8ee'; circ(ctx, -2.8, 1.5, 0.75, true); circ(ctx, -0.8, 1.5, 0.75, true); ctx.fillStyle = '#222'; line(ctx, [[-2.8, 1.5], [-2.5, 0.95]]); line(ctx, [[-0.8, 1.5], [-1.1, 0.95]]);
      ctx.fillStyle = '#fff'; ctx.font = `700 0.36px ${EM.FONT_UI}`; ctx.textAlign = 'center'; ctx.fillText('FREC.', -2.8, 2.7); ctx.fillText('AMPL.', -0.8, 2.7);
      ctx.fillStyle = '#c1221b'; circ(ctx, 3, -1, 0.34, true); ctx.fillStyle = '#111'; circ(ctx, 3, 1, 0.34, true);
      ctx.strokeStyle = '#999'; line(ctx, [[2.1, -1], [3, -1]]); line(ctx, [[2.1, 1], [3, 1]]);
      ctx.restore();
    },
    psu(ctx, P, st) {
      ctx.save();
      rrect(ctx, -4, -3.2, 7, 6.4, 0.5); ctx.fillStyle = '#2f3b4a'; ctx.fill(); ctx.strokeStyle = '#141b24'; ctx.lineWidth = 0.12; ctx.stroke();
      rrect(ctx, -3.5, -2.7, 3.1, 1.9, 0.2); ctx.fillStyle = '#10190f'; ctx.fill(); rrect(ctx, 0.0, -2.7, 2.2, 1.9, 0.2); ctx.fill();
      ctx.fillStyle = '#7dff82'; ctx.font = `700 0.95px ${EM.FONT_MONO}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(st && st.v !== undefined ? st.v.toFixed(2) : P.p.v.toFixed(2), -0.5, -1.7);
      ctx.fillStyle = '#ffb86b'; ctx.fillText(st && st.i !== undefined ? st.i.toFixed(3) : '0.000', 2.0, -1.7);
      ctx.font = `700 0.5px ${EM.FONT_UI}`; ctx.fillStyle = '#9fb0c3'; ctx.textAlign = 'center'; ctx.fillText('V', -2.7, -0.55); ctx.fillText('A', 1.1, -0.55);
      ctx.fillStyle = st && st.cc ? '#ff4a3d' : '#3dff6e'; circ(ctx, -3.1, 0.4, 0.25, true); ctx.fillStyle = '#cfd8e3'; ctx.textAlign = 'left'; ctx.fillText(st && st.cc ? 'CC' : 'CV', -2.7, 0.4);
      ctx.fillStyle = '#d9dee6'; circ(ctx, -2.2, 1.9, 0.7, true); circ(ctx, -0.2, 1.9, 0.7, true); ctx.strokeStyle = '#222'; ctx.lineWidth = 0.12; line(ctx, [[-2.2, 1.9], [-1.9, 1.4]]); line(ctx, [[-0.2, 1.9], [0.05, 1.4]]);
      ctx.fillStyle = '#cfd8e3'; ctx.font = `700 0.4px ${EM.FONT_UI}`; ctx.textAlign = 'center'; ctx.fillText('TENSIÓN', -2.2, 2.95); ctx.fillText('LÍMITE', -0.2, 2.95);
      ctx.fillStyle = '#c1221b'; circ(ctx, 3, -1, 0.34, true); ctx.fillStyle = '#111'; circ(ctx, 3, 1, 0.34, true);
      ctx.strokeStyle = '#999'; ctx.lineWidth = 0.14; line(ctx, [[2.2, -1], [3, -1]]); line(ctx, [[2.2, 1], [3, 1]]);
      ctx.restore();
    }
  };

  /* Dibuja el símbolo de P con el lienzo ya situado: ctx escala = píxeles por unidad */
  SYM.draw = function (ctx, P, st, unit) {
    const f = D[P.t] || D.R;
    ctx.save();
    ctx.translate(P.x, P.y);
    ctx.rotate(((P.rot || 0) % 4) * Math.PI / 2);
    if (P.flip) ctx.scale(1, -1);
    ctx.lineWidth = Math.max(1.4, unit * 0.075) / unit;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    f(ctx, P, st || {});
    ctx.restore();
  };
  /* Caja envolvente en la cuadrícula global */
  SYM.bbox = function (P) {
    const b = CAT[P.t].bb || [-2, -1, 2, 1];
    const pts = [[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]]].map((q) => PT.xf(P, q));
    const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
    return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  };
})();
