/* ===================================================================
   43-fx.js — Efectos visuales (EM.fx): resplandor, humo, chispas y puntos de corriente
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM, DW = EM.dw;
  const FX = (EM.fx = {});
  const TAU = Math.PI * 2;

  /* Resplandores aditivos: lista de {x, y, r, c, a} */
  FX.glows = function (ctx, list) {
    if (!list.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const g of list) {
      const grd = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
      grd.addColorStop(0, DW.rgba(g.c, Math.min(1, g.a)));
      grd.addColorStop(0.35, DW.rgba(g.c, Math.min(1, g.a) * 0.45));
      grd.addColorStop(1, DW.rgba(g.c, 0));
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, TAU); ctx.fill();
    }
    ctx.restore();
  };

  /* Sistema de partículas de humo y chispas */
  class Particles {
    constructor() { this.p = []; this.t = 0; this.acc = {}; }
    clear() { this.p = []; this.acc = {}; }
    smoke(id, x, y, dt, intensity = 1) {
      this.acc[id] = (this.acc[id] || 0) + dt * 22 * intensity;
      while (this.acc[id] >= 1) {
        this.acc[id] -= 1;
        this.p.push({ k: 's', x: x + (Math.random() - 0.5) * 1.6, y, vx: (Math.random() - 0.5) * 1.6 + 1.0, vy: -(5 + Math.random() * 4), r: 1.0 + Math.random() * 0.8, life: 0, max: 2.6 + Math.random() * 1.6, g: 70 + Math.random() * 50 });
      }
    }
    sparks(x, y, n = 8, hot = true) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU, sp = 10 + Math.random() * 28;
        this.p.push({ k: 'f', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 6, r: 0.25 + Math.random() * 0.3, life: 0, max: 0.25 + Math.random() * 0.45, hot });
      }
      this.p.push({ k: 'flash', x, y, r: 3, life: 0, max: 0.18 });
    }
    update(dt) {
      this.t += dt;
      for (const q of this.p) {
        q.life += dt;
        if (q.k === 's') { q.x += q.vx * dt; q.y += q.vy * dt; q.vy *= 0.985; q.r += dt * 2.6; }
        else if (q.k === 'f') { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 60 * dt; }
      }
      this.p = this.p.filter((q) => q.life < q.max);
      if (this.p.length > 400) this.p.splice(0, this.p.length - 400);
    }
    draw(ctx) {
      for (const q of this.p) {
        const u = q.life / q.max;
        if (q.k === 's') {
          ctx.fillStyle = `rgba(${q.g},${q.g},${q.g + 6},${0.5 * (1 - u) * (u < 0.1 ? u * 10 : 1)})`;
          ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.fill();
        }
      }
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const q of this.p) {
        const u = q.life / q.max;
        if (q.k === 'f') { ctx.fillStyle = `rgba(255,${190 - 120 * u},${60 - 40 * u},${1 - u})`; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (1 - u * 0.5), 0, TAU); ctx.fill(); }
        else if (q.k === 'flash') {
          const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r * 5);
          g.addColorStop(0, `rgba(255,245,200,${0.95 * (1 - u)})`); g.addColorStop(1, 'rgba(255,200,80,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * 5, 0, TAU); ctx.fill();
        }
      }
      ctx.restore();
    }
  }
  FX.Particles = Particles;

  /* Puntos de corriente a lo largo de un segmento: polilínea de puntos en mm; I en amperios (signo = sentido) */
  FX.flow = function (ctx, pts, I, t, color) {
    const a = Math.abs(I);
    if (a < 5e-5 || pts.length < 2) return;
    const speed = 4 + 14 * Math.min(1, Math.pow(a / 0.05, 0.5));
    const dir = I >= 0 ? 1 : -1;
    let len = 0;
    const seg = [];
    for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); len += l; }
    if (len < 0.5) return;
    const gap = 3.2;
    const n = Math.max(1, Math.floor(len / gap));
    ctx.save();
    ctx.fillStyle = color || '#ffd23a';
    ctx.strokeStyle = 'rgba(80,50,0,.55)'; ctx.lineWidth = 0.18;
    for (let k = 0; k < n; k++) {
      let d = ((k * gap + dir * t * speed) % len + len) % len;
      let i = 0;
      while (i < seg.length - 1 && d > seg[i]) { d -= seg[i]; i++; }
      const f = seg[i] > 0 ? d / seg[i] : 0;
      const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f;
      ctx.beginPath(); ctx.arc(x, y, 0.62, 0, TAU); ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  };

  /* Mapa de color para potenciales: 0 V azul → Vmax rojo */
  FX.voltColor = function (v, vmax, a = 0.45) {
    const t = Math.max(0, Math.min(1, v / (vmax || 5)));
    const stops = [[0.0, [41, 98, 214]], [0.35, [24, 170, 150]], [0.65, [240, 190, 40]], [1.0, [226, 52, 40]]];
    let i = 0;
    while (i < stops.length - 2 && t > stops[i + 1][0]) i++;
    const f = (t - stops[i][0]) / (stops[i + 1][0] - stops[i][0]);
    const c = stops[i][1].map((x, k) => Math.round(x + (stops[i + 1][1][k] - x) * f));
    return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  };
})();
