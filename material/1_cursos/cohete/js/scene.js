// Demostración: una cancha simulada vista por la cámara del celular, con nubes, árboles, edificios, torres de luz,
// la rampa y un cohete que vuela con la física de physics.js. Entrega cuadros y una orientación con sesgo y ruido
// como la de un sensor real, para practicar el procedimiento completo sin salir al campo.

import * as G from './geom.js';
import { RocketSim, PRESETS } from './physics.js';

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function rotDev(R, ax, ang) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const M = ax === 'x' ? [1, 0, 0, 0, c, -s, 0, s, c] : ax === 'y' ? [c, 0, s, 0, 1, 0, -s, 0, c] : [c, -s, 0, s, c, 0, 0, 0, 1];
  const o = new Array(9);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o[i * 3 + j] = R[i * 3] * M[j] + R[i * 3 + 1] * M[3 + j] + R[i * 3 + 2] * M[6 + j];
  return o;
}

export class SimScene {
  constructor(opts = {}) {
    const o = (this.o = { W: 720, H: 1280, preset: 'agua', d: null, Hobs: 1.5, mode: 'tripod', wind: 3, windDirDeg: 90, fNorm: 0.78, noiseDeg: 0.05, biasDeg: 0.25, seed: 11, ...opts });
    this.p = PRESETS[o.preset];
    if (!o.d) o.d = this.p.dSug;
    this.canvas = document.createElement('canvas');
    this.canvas.width = o.W;
    this.canvas.height = o.H;
    this.ctx = this.canvas.getContext('2d');
    this.cam = G.camFor(o.W, o.H, o.fNorm);
    this.eye = [0, 0, o.Hobs];
    this.pad = [0, o.d, 0];
    const wd = o.windDirDeg * G.DEG;
    this.windV = [o.wind * Math.sin(wd), o.wind * Math.cos(wd)];
    this.rocket = new RocketSim(o.preset, { wind: this.windV, railTiltDeg: 1.5, railAzDeg: 200 });
    this.rand = rng(o.seed);
    this.buildWorld();
    const vf = 2 * Math.atan(0.5 / o.fNorm);
    this.triAxis = G.dirFromElAz(G.elAz(this.dirTo(this.pad)).el + 0.36 * vf, 0.02);
    this.reset();
  }

  reset() {
    this.tL = Infinity;
    this.axis = this.dirTo([0, this.o.d, 0.6]);
    this.lastT = null;
    this.expo = 0;
  }

  dirTo(P) { return G.unit([P[0] - this.eye[0], P[1] - this.eye[1], P[2] - this.eye[2]]); }
  dist(P) { return Math.hypot(P[0] - this.eye[0], P[1] - this.eye[1], P[2] - this.eye[2]); }
  launchAt(t) { this.tL = t; }
  truth() { return { apogee: this.rocket.apo, tApo: this.rocket.tApo }; }
  get launched() { return this.tL !== Infinity; }

  buildWorld() {
    const r = this.rand, d = this.o.d;
    this.clouds = [];
    for (let i = 0; i < 13; i++) {
      const el = (8 + r() * 50) * G.DEG, az = (r() - 0.5) * 2.2, size = (3 + r() * 5) * G.DEG;
      const puffs = [];
      const n = 5 + Math.floor(r() * 5);
      for (let k = 0; k < n; k++) puffs.push({ de: (r() - 0.3) * size * 0.6, da: (r() - 0.5) * size * 2.2, r: size * (0.35 + r() * 0.45) });
      this.clouds.push({ el, az, puffs });
    }
    this.buildings = [];
    for (let i = 0; i < 26; i++) {
      const az = (r() - 0.5) * 2.6, dist = 260 + r() * 260, w = 18 + r() * 40, h = 10 + r() * 32;
      this.buildings.push({ az, dist, w, h, col: ['#b7a691', '#c9c3ba', '#a0503f', '#d6d0c4', '#9aa3ab'][Math.floor(r() * 5)] });
    }
    this.buildings.sort((a, b) => b.dist - a.dist);
    this.trees = [];
    for (let i = 0; i < 70; i++) {
      const az = (r() - 0.5) * 2.4, dist = d + 30 + r() * 55;
      this.trees.push({ x: dist * Math.sin(az), y: dist * Math.cos(az), h: 8 + r() * 9, rc: 2.5 + r() * 3, shade: Math.floor(r() * 3) });
    }
    this.trees.sort((a, b) => Math.hypot(b.x, b.y) - Math.hypot(a.x, a.y));
    this.poles = [[-38, d - 22, 24], [38, d - 22, 24], [-38, d + 28, 24], [38, d + 28, 24], [-16, 14, 30]];
  }

  cameraR(t) {
    if (this.o.mode === 'tripod') return G.lookR(this.triAxis, 0.012);
    const dt = this.lastT == null ? 0 : Math.min(0.1, Math.max(0, t - this.lastT));
    this.lastT = t;
    const target = this.dirTo(t - 0.12 >= this.tL ? this.rocketAt(t - 0.12).P : [0, this.o.d, 0.6]);
    const a = 1 - Math.exp(-dt / 0.13);
    const ax = this.axis;
    this.axis = G.unit([ax[0] + (target[0] - ax[0]) * a, ax[1] + (target[1] - ax[1]) * a, ax[2] + (target[2] - ax[2]) * a]);
    const ea = G.elAz(this.axis);
    const tremor = G.dirFromElAz(ea.el + 0.25 * G.DEG * Math.sin(27 * t) + 0.15 * G.DEG * Math.sin(44.6 * t + 1), ea.az + 0.2 * G.DEG * Math.sin(23.2 * t + 2));
    return G.lookR(tremor, 0.05 * Math.sin(0.3 * t));
  }

  /** Orientación que "mide" el sensor: con sesgo fijo de inclinación y ruido. */
  sensorR(R) {
    const n = this.o.noiseDeg * G.DEG, r = this.rand;
    let S = rotDev(R, 'x', this.o.biasDeg * G.DEG + (r() - 0.5) * 2 * n);
    S = rotDev(S, 'y', (r() - 0.5) * 2 * n);
    const e = G.rToEuler(S);
    return G.eulerToR(e.alpha, e.beta, e.gamma);
  }

  rocketAt(t) {
    const tr = t - this.tL;
    const st = this.rocket.at(tr);
    return { P: [this.pad[0] + st.p[0], this.pad[1] + st.p[1], this.pad[2] + st.p[2]], st, tr };
  }

  /** Pixel de la base de la rampa (para preparar la demostración sola). */
  padPixel(R) { return G.worldToPixel(R, this.cam, this.dirTo(this.pad)); }

  render(t) {
    const R = this.cameraR(t);
    this.R = R;
    const { ctx, cam } = this;
    const { W, H } = this.o;
    const proj = (P) => G.worldToPixel(R, cam, this.dirTo(P));
    const pdir = (el, az) => G.worldToPixel(R, cam, G.dirFromElAz(el, az));
    const az0 = G.elAz(G.opticalAxis(R)).az;

    // Cielo.
    const h0 = pdir(0, az0), h1 = pdir(55 * G.DEG, az0);
    if (h0 && h1) {
      const g = ctx.createLinearGradient(h0.u, h0.v, h1.u, h1.v);
      g.addColorStop(0, '#dde6ec'); g.addColorStop(0.45, '#adc4d9'); g.addColorStop(1, '#7c9dc2');
      ctx.fillStyle = g;
    } else ctx.fillStyle = '#9fb9d2';
    ctx.fillRect(0, 0, W, H);

    // Nubes (derivan despacio).
    for (const c of this.clouds) {
      const caz = c.az + 0.0025 * t;
      for (const layer of [0, 1]) {
        for (const p of c.puffs) {
          const q = pdir(c.el + p.de - (layer ? 0 : p.r * 0.25), caz + p.da / Math.cos(c.el));
          if (!q) continue;
          const rp = p.r * cam.f;
          if (q.u < -rp || q.u > W + rp || q.v < -rp || q.v > H + rp) continue;
          const g = ctx.createRadialGradient(q.u, q.v, 0, q.u, q.v, rp);
          if (layer === 0) { g.addColorStop(0, 'rgba(140,152,166,0.35)'); g.addColorStop(1, 'rgba(140,152,166,0)'); }
          else { g.addColorStop(0, 'rgba(250,251,252,0.95)'); g.addColorStop(0.6, 'rgba(244,246,248,0.7)'); g.addColorStop(1, 'rgba(244,246,248,0)'); }
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(q.u, q.v, rp, 0, 2 * Math.PI); ctx.fill();
        }
      }
    }

    // Edificios lejanos.
    for (const b of this.buildings) {
      const da = b.w / 2 / b.dist;
      const c = [[b.az - da, 0], [b.az + da, 0], [b.az + da, b.h], [b.az - da, b.h]].map(([a, z]) => proj([b.dist * Math.sin(a), b.dist * Math.cos(a), z]));
      if (c.some((q) => !q)) continue;
      ctx.fillStyle = b.col;
      ctx.beginPath(); c.forEach((q, i) => (i ? ctx.lineTo(q.u, q.v) : ctx.moveTo(q.u, q.v))); ctx.closePath(); ctx.fill();
    }

    // Suelo hasta el horizonte.
    const g1 = pdir(-0.1 * G.DEG, az0 - 0.9), g2 = pdir(-0.1 * G.DEG, az0 + 0.9), gd = pdir(-8 * G.DEG, az0);
    if (g1 && g2) {
      const ex = g2.u - g1.u, ey = g2.v - g1.v, L = Math.hypot(ex, ey) || 1;
      let nx = -ey / L, ny = ex / L;
      if (gd && (gd.u - g1.u) * nx + (gd.v - g1.v) * ny < 0) { nx = -nx; ny = -ny; }
      const F = 5000;
      const grd = ctx.createLinearGradient(g1.u, g1.v, g1.u + nx * 600, g1.v + ny * 600);
      grd.addColorStop(0, '#4b6f3f'); grd.addColorStop(1, '#6e9f57');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.moveTo(g1.u - (ex / L) * F, g1.v - (ey / L) * F);
      ctx.lineTo(g2.u + (ex / L) * F, g2.v + (ey / L) * F);
      ctx.lineTo(g2.u + (ex / L) * F + nx * F, g2.v + (ey / L) * F + ny * F);
      ctx.lineTo(g1.u - (ex / L) * F + nx * F, g1.v - (ey / L) * F + ny * F);
      ctx.closePath();
      ctx.fill();
    }

    // Árboles detrás de la cancha.
    const greens = ['#2c4a2a', '#365a31', '#243f22'];
    for (const tr of this.trees) {
      const dd = Math.hypot(tr.x, tr.y);
      const base = proj([tr.x, tr.y, 0]), crown = proj([tr.x, tr.y, tr.h - tr.rc]);
      if (!base || !crown) continue;
      ctx.strokeStyle = '#3d3226';
      ctx.lineWidth = Math.max(1, (0.5 * cam.f) / dd);
      ctx.beginPath(); ctx.moveTo(base.u, base.v); ctx.lineTo(crown.u, crown.v); ctx.stroke();
      const rp = (tr.rc * cam.f) / dd;
      ctx.fillStyle = greens[tr.shade];
      ctx.beginPath();
      ctx.arc(crown.u, crown.v, rp, 0, 2 * Math.PI);
      ctx.arc(crown.u - rp * 0.6, crown.v + rp * 0.25, rp * 0.75, 0, 2 * Math.PI);
      ctx.arc(crown.u + rp * 0.6, crown.v + rp * 0.2, rp * 0.7, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Torres de luz.
    for (const [x, y, h] of this.poles) {
      const a = proj([x, y, 0]), b = proj([x, y, h]);
      if (!a || !b) continue;
      const dd = Math.hypot(x, y);
      ctx.strokeStyle = '#8d959c';
      ctx.lineWidth = Math.max(1, (0.45 * cam.f) / dd);
      ctx.beginPath(); ctx.moveTo(a.u, a.v); ctx.lineTo(b.u, b.v); ctx.stroke();
      const hw = (1.6 * cam.f) / dd, hh = (1.2 * cam.f) / dd;
      ctx.fillStyle = '#5d666e';
      ctx.fillRect(b.u - hw, b.v - hh, 2 * hw, 1.6 * hh);
    }

    // Rampa.
    const r0 = proj(this.pad), r1 = proj([this.pad[0], this.pad[1], 1.1]);
    if (r0 && r1) {
      const dd = this.dist(this.pad);
      ctx.strokeStyle = '#3a3f44';
      ctx.lineWidth = Math.max(1.2, (0.03 * cam.f) / dd);
      ctx.beginPath(); ctx.moveTo(r0.u, r0.v); ctx.lineTo(r1.u, r1.v); ctx.stroke();
      const leg = (0.45 * cam.f) / dd;
      ctx.lineWidth = Math.max(1.2, (0.04 * cam.f) / dd);
      ctx.beginPath(); ctx.moveTo(r0.u - leg, r0.v + leg * 0.15); ctx.lineTo(r0.u, r0.v - leg * 0.5); ctx.lineTo(r0.u + leg, r0.v + leg * 0.15); ctx.stroke();
    }

    this.drawExhaust(ctx, proj, t);
    this.drawRocket(ctx, proj, t);

    // Pequeñas variaciones de exposición automática.
    this.expo = Math.max(-0.02, Math.min(0.02, this.expo + (this.rand() - 0.5) * 0.004));
    ctx.fillStyle = this.expo > 0 ? `rgba(255,255,255,${this.expo})` : `rgba(0,0,0,${-this.expo})`;
    ctx.fillRect(0, 0, W, H);
    return R;
  }

  drawExhaust(ctx, proj, t) {
    if (!this.launched || t < this.tL) return;
    const p = this.p, f = this.cam.f, tr = t - this.tL, rk = this.rocket;
    const tailAt = (te, drift) => {
      const st = rk.at(te);
      return [this.pad[0] + st.p[0] - (st.axis[0] * p.len) / 2 + drift[0], this.pad[1] + st.p[1] - (st.axis[1] * p.len) / 2 + drift[1], this.pad[2] + st.p[2] - (st.axis[2] * p.len) / 2 + drift[2]];
    };
    if (this.o.preset === 'agua') {
      for (let tau = 0.34; tau >= 0; tau -= 0.012) {
        const te = tr - tau;
        if (te < 0 || te > 0.2) continue;
        const P = tailAt(te, [0, 0, -3 * tau - 4.9 * tau * tau]);
        const q = proj(P);
        if (!q) continue;
        const rp = Math.max(1.2, ((0.08 + 0.6 * tau) * f) / this.dist(P));
        ctx.fillStyle = `rgba(236,240,244,${0.55 * (1 - tau / 0.35)})`;
        ctx.beginPath(); ctx.arc(q.u, q.v, rp, 0, 2 * Math.PI); ctx.fill();
      }
    } else {
      const smokeEnd = rk.tBurn + (p.chute ? p.chute.delay : 0);
      for (let tau = 3; tau >= 0; tau -= 0.05) {
        const te = tr - tau;
        if (te < 0 || te > smokeEnd) continue;
        const P = tailAt(te, [this.windV[0] * tau, this.windV[1] * tau, 0.2 * tau]);
        const q = proj(P);
        if (!q) continue;
        const rp = Math.max(1, ((0.06 + 0.3 * tau) * f) / this.dist(P));
        const a = (te < rk.tBurn ? 0.5 : 0.2) * Math.exp(-tau / 1.4);
        ctx.fillStyle = `rgba(200,202,205,${a})`;
        ctx.beginPath(); ctx.arc(q.u, q.v, rp, 0, 2 * Math.PI); ctx.fill();
      }
      if (tr < rk.tBurn) {
        const q = proj(tailAt(tr, [0, 0, 0]));
        if (q) { ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.arc(q.u, q.v, 2.2, 0, 2 * Math.PI); ctx.fill(); }
      }
    }
  }

  drawRocket(ctx, proj, t) {
    const p = this.p, f = this.cam.f;
    let P, ax, phase = 'rampa';
    if (t < this.tL) { P = [this.pad[0], this.pad[1], p.len / 2 + 0.05]; ax = [0, 0, 1]; }
    else {
      const r = this.rocketAt(t);
      P = r.P; ax = r.st.axis; phase = r.st.phase;
      if (phase === 'suelo') ax = G.unit([ax[0], ax[1], 0.05]);
    }
    const half = p.len / 2;
    const nose = [P[0] + ax[0] * half, P[1] + ax[1] * half, P[2] + ax[2] * half];
    const tail = [P[0] - ax[0] * half, P[1] - ax[1] * half, P[2] - ax[2] * half];
    const a = proj(tail), b = proj(nose);
    if (!a || !b) return;
    const dd = this.dist(P);
    const wpx = Math.max(1.4, (p.diam * f) / dd);
    const lenPx = Math.hypot(b.u - a.u, b.v - a.v);
    // Paracaídas (modelismo) después de la carga de eyección.
    if (p.chute && t >= this.tL && t - this.tL > this.rocket.tBurn + p.chute.delay && phase !== 'suelo') {
      const c = proj([P[0], P[1], P[2] + 1.4]);
      if (c) {
        const rc = Math.max(2, (0.35 * f) / dd);
        ctx.fillStyle = '#e8473a';
        ctx.beginPath(); ctx.arc(c.u, c.v, rc, Math.PI, 2 * Math.PI); ctx.fill();
        ctx.strokeStyle = 'rgba(40,40,40,0.6)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(c.u - rc, c.v); ctx.lineTo(b.u, b.v); ctx.moveTo(c.u + rc, c.v); ctx.lineTo(b.u, b.v); ctx.stroke();
      }
    }
    ctx.lineCap = 'round';
    if (lenPx < 3) {
      ctx.fillStyle = p.body === '#e7e2d6' ? '#b84a3a' : p.body;
      ctx.beginPath(); ctx.arc((a.u + b.u) / 2, (a.v + b.v) / 2, Math.max(1.1, wpx / 2), 0, 2 * Math.PI); ctx.fill();
      return;
    }
    const m = { u: a.u + (b.u - a.u) * 0.72, v: a.v + (b.v - a.v) * 0.72 };
    ctx.strokeStyle = p.body;
    ctx.lineWidth = wpx;
    ctx.beginPath(); ctx.moveTo(a.u, a.v); ctx.lineTo(m.u, m.v); ctx.stroke();
    ctx.strokeStyle = p.nose;
    ctx.beginPath(); ctx.moveTo(m.u, m.v); ctx.lineTo(b.u, b.v); ctx.stroke();
    // Aletas.
    const nx = -(b.v - a.v) / lenPx, ny = (b.u - a.u) / lenPx;
    ctx.strokeStyle = p.nose;
    ctx.lineWidth = Math.max(1, wpx * 0.5);
    ctx.beginPath();
    ctx.moveTo(a.u + nx * wpx * 1.3, a.v + ny * wpx * 1.3); ctx.lineTo(a.u - nx * wpx * 1.3, a.v - ny * wpx * 1.3);
    ctx.stroke();
  }
}
