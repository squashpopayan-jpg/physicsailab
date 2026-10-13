/* ===================================================================
   30-waves.js — Herramientas del curso de Vibraciones y Ondas:
   integradores, dibujos mecánicos (resortes, bloques, soportes),
   FFT, sonido con Web Audio y solucionadores de la ecuación de onda 1D/2D
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM;
  const M = EM.M;

  /* ---------- Integración numérica ---------- */
  /* Un paso RK4 de y' = f(t, y) con y como arreglo */
  EM.rk4 = function (f, t, y, h) {
    const n = y.length;
    const k1 = f(t, y);
    const y2 = new Array(n);
    for (let i = 0; i < n; i++) y2[i] = y[i] + 0.5 * h * k1[i];
    const k2 = f(t + 0.5 * h, y2);
    for (let i = 0; i < n; i++) y2[i] = y[i] + 0.5 * h * k2[i];
    const k3 = f(t + 0.5 * h, y2);
    for (let i = 0; i < n; i++) y2[i] = y[i] + h * k3[i];
    const k4 = f(t + h, y2);
    const out = new Array(n);
    for (let i = 0; i < n; i++) out[i] = y[i] + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
    return out;
  };
  /* Integra de t0 a t1 con nsub pasos RK4; devuelve el estado final */
  EM.integrate = function (f, t0, y, t1, nsub = 20) {
    const h = (t1 - t0) / nsub;
    let t = t0;
    for (let i = 0; i < nsub; i++) { y = EM.rk4(f, t, y, h); t += h; }
    return y;
  };
  /* Historial circular de muestras para trazar señales en el tiempo */
  EM.Trace = class {
    constructor(n = 600) { this.n = n; this.t = []; this.v = []; }
    push(t, ...vals) { this.t.push(t); this.v.push(vals); if (this.t.length > this.n) { this.t.shift(); this.v.shift(); } }
    clear() { this.t = []; this.v = []; }
    col(j) { return this.v.map((r) => r[j]); }
  };

  /* ---------- Dibujos mecánicos ---------- */
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

  /* ---------- FFT radix-2 en sitio ---------- */
  EM.fft = function (re, im, inv = false) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = ((inv ? 2 : -2) * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < len / 2; k++) {
          const a = i + k, b = a + len / 2;
          const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
          re[b] = re[a] - tr; im[b] = im[a] - ti;
          re[a] += tr; im[a] += ti;
          const nr = cr * wr - ci * wi;
          ci = cr * wi + ci * wr; cr = nr;
        }
      }
    }
    if (inv) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
  };

  /* ---------- Funciones especiales ---------- */
  /* Bessel J_n de orden entero por recurrencia de Miller (precisa para todo x ≥ 0) */
  EM.besselJn = function (n, x) {
    if (x === 0) return n === 0 ? 1 : 0;
    const ax = Math.abs(x);
    if (ax < 8 || n > ax) {
      /* serie de potencias (converge bien para x moderado) */
      let sum = 0, term = Math.pow(ax / 2, n);
      for (let k = 1; k <= n; k++) term /= k;
      for (let k = 0; k < 80; k++) { sum += term; term *= -(ax * ax) / 4 / ((k + 1) * (k + 1 + n)); if (Math.abs(term) < 1e-17 * Math.abs(sum)) break; }
      return x < 0 && n % 2 ? -sum : sum;
    }
    /* recurrencia hacia atrás con normalización J0 + 2ΣJ2k = 1 */
    const N = 2 * Math.floor((Math.max(n, ax) + 15 + Math.sqrt(40 * Math.max(n, ax))) / 2);
    let jp = 0, j = 1e-30, norm = 0, res = 0;
    for (let k = N; k > 0; k--) {
      const jm = (2 * k / ax) * j - jp;
      jp = j; j = jm;
      if (Math.abs(j) > 1e250) { j *= 1e-250; jp *= 1e-250; res *= 1e-250; norm *= 1e-250; }
      if (k - 1 === n) res = j;
      if ((k - 1) % 2 === 0 && k - 1 > 0) norm += 2 * j;
    }
    norm += j;
    const r = res / norm;
    return x < 0 && n % 2 ? -r : r;
  };
  /* Ceros de J_n: devuelve los primeros m */
  const zcache = {};
  EM.besselZeros = function (n, m) {
    const key = n + ':' + m;
    if (zcache[key]) return zcache[key];
    const out = [];
    let x = 0.5, f0 = EM.besselJn(n, x);
    while (out.length < m && x < 200) {
      const x1 = x + 0.05, f1 = EM.besselJn(n, x1);
      if (f0 * f1 < 0 && x > 0.6) out.push(M.bisect((t) => EM.besselJn(n, t), x, x1, 1e-12));
      x = x1; f0 = f1;
    }
    zcache[key] = out;
    return out;
  };
  /* sinc(x) = sen x / x */
  EM.sinc = (x) => (Math.abs(x) < 1e-8 ? 1 : Math.sin(x) / x);

  /* ---------- Sonido (Web Audio) ---------- */
  let actx = null, current = null;
  EM.audio = {
    ok: () => !!(window.AudioContext || window.webkitAudioContext),
    ctx() {
      if (!actx) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; actx = new A(); }
      if (actx.state === 'suspended') actx.resume();
      return actx;
    },
    stop() { if (current) { try { current.stop(); } catch (e) { /* */ } current = null; } },
    /* Reproduce una señal generada por fn(t) en [-1,1] durante dur segundos */
    play(fn, dur = 1.5, gain = 0.25, norm = true) {
      const ac = this.ctx();
      if (!ac) return false;
      this.stop();
      const sr = ac.sampleRate, n = Math.floor(sr * dur);
      const buf = ac.createBuffer(1, n, sr), d = buf.getChannelData(0);
      let peak = 1e-9;
      for (let i = 0; i < n; i++) { d[i] = fn(i / sr); peak = Math.max(peak, Math.abs(d[i])); }
      const fade = Math.floor(sr * 0.02);
      for (let i = 0; i < n; i++) {
        let g = norm ? d[i] / peak : Math.max(-1, Math.min(1, d[i]));
        if (i < fade) g *= i / fade;
        if (i > n - fade) g *= (n - i) / fade;
        d[i] = g;
      }
      const src = ac.createBufferSource();
      src.buffer = buf;
      const gn = ac.createGain();
      gn.gain.value = gain;
      src.connect(gn).connect(ac.destination);
      src.start();
      current = src;
      src.onended = () => { if (current === src) current = null; };
      return true;
    }
  };
  /* Agrega a una simulación un botón «Escuchar» que reproduce fn(t) */
  EM.listenButton = function (sim, getFn, o = {}) {
    if (!EM.audio.ok()) return null;
    return sim.button(o.label || '♪ Escuchar', () => { const r = getFn(); if (r) EM.audio.play(r.fn || r, r.dur || o.dur || 1.6, o.gain || 0.25); }, { where: o.where || 'ctrl', newRow: o.newRow });
  };

  /* ---------- Cuerda 1D por diferencias finitas ----------
     y_tt = c(x)² y_xx − γ y_t ; extremos 'fixed' | 'free' | 'open' (absorbente) | 'driven' */
  class String1D {
    constructor(n, o = {}) {
      this.n = n;
      this.y = new Float64Array(n);
      this.yp = new Float64Array(n);
      this.c2 = new Float64Array(n).fill(1);
      this.gamma = o.gamma || 0;
      this.left = o.left || 'fixed';
      this.right = o.right || 'fixed';
      this.courant = o.courant || 0.9;
      this.t = 0;
    }
    setSpeed(fn) { for (let i = 0; i < this.n; i++) { const c = fn(i / (this.n - 1)); this.c2[i] = c * c; } }
    maxC() { let m = 0; for (let i = 0; i < this.n; i++) m = Math.max(m, this.c2[i]); return Math.sqrt(m); }
    reset(f, v) {
      for (let i = 0; i < this.n; i++) { const x = i / (this.n - 1); this.y[i] = f ? f(x) : 0; }
      /* paso previo consistente con velocidad inicial v(x) */
      const dt = this.dt();
      for (let i = 0; i < this.n; i++) this.yp[i] = this.y[i] - (v ? v(i / (this.n - 1)) * dt : 0);
      this.t = 0;
    }
    dt() { const dx = 1 / (this.n - 1); return (this.courant * dx) / this.maxC(); }
    /* Avanza un paso; drive(t) fija el desplazamiento del extremo izquierdo si left='driven' */
    step(drive) {
      const n = this.n, y = this.y, yp = this.yp, dx = 1 / (n - 1), dt = this.dt();
      const yn = new Float64Array(n);
      const g = this.gamma * dt * 0.5;
      for (let i = 1; i < n - 1; i++) {
        const r = (this.c2[i] * dt * dt) / (dx * dx);
        yn[i] = (2 * y[i] - (1 - g) * yp[i] + r * (y[i + 1] - 2 * y[i] + y[i - 1])) / (1 + g);
      }
      const bc = (side, i0, i1) => {
        const mode = side === 'L' ? this.left : this.right;
        if (mode === 'fixed') yn[i0] = 0;
        else if (mode === 'free') yn[i0] = yn[i1];
        else if (mode === 'open') { const c = Math.sqrt(this.c2[i0]), k = (c * dt - dx) / (c * dt + dx); yn[i0] = y[i1] + k * (yn[i1] - y[i0]); }
        else if (mode === 'driven') yn[i0] = drive ? drive(this.t + dt) : 0;
        else if (mode === 'damper') {
          /* T ∂y/∂x = ∓ b ∂y/∂t con b = rb · Z (μ = 1 → Z = c); implícito en y_new */
          const c2 = this.c2[i0], b = (this.rb === undefined ? 1 : this.rb) * Math.sqrt(c2);
          yn[i0] = ((c2 / dx) * yn[i1] + (b / dt) * y[i0]) / (c2 / dx + b / dt);
        }
      };
      bc('L', 0, 1);
      bc('R', n - 1, n - 2);
      this.yp = y;
      this.y = yn;
      this.t += dt;
      return dt;
    }
    /* Energía (cinética + potencial) en unidades relativas con densidad unitaria */
    energy() {
      const n = this.n, dx = 1 / (n - 1), dt = this.dt();
      let K = 0, U = 0;
      for (let i = 0; i < n; i++) { const v = (this.y[i] - this.yp[i]) / dt; K += 0.5 * v * v * dx; }
      for (let i = 0; i < n - 1; i++) { const s = (this.y[i + 1] - this.y[i]) / dx; U += 0.5 * this.c2[i] * s * s * dx; }
      return [K, U];
    }
  }
  EM.String1D = String1D;

  /* ---------- Ecuación de onda 2D (cubeta de ondas) ----------
     u_tt = c² ∇²u, malla nx × ny, obstáculos (mask=1 → u=0), borde absorbente */
  class Wave2D {
    constructor(nx, ny, o = {}) {
      this.nx = nx; this.ny = ny;
      const N = nx * ny;
      this.u = new Float32Array(N);
      this.up = new Float32Array(N);
      this.mask = new Uint8Array(N);
      this.c2 = new Float32Array(N).fill(1);
      this.damp = new Float32Array(N);
      this.border = o.border === undefined ? 18 : o.border;
      this.courant = o.courant || 0.5;
      this.t = 0;
      this.setBorder();
      this._img = null;
    }
    setBorder() {
      const { nx, ny, border: b } = this;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const d = Math.min(i, j, nx - 1 - i, ny - 1 - j);
        this.damp[j * nx + i] = d < b ? 0.35 * Math.pow((b - d) / b, 2) : 0;
      }
    }
    clear() { this.u.fill(0); this.up.fill(0); this.t = 0; }
    step() {
      const { nx, ny, u, up, mask, c2, damp } = this;
      const r = this.courant * this.courant;
      const un = this.up; /* reutiliza el arreglo anterior */
      for (let j = 1; j < ny - 1; j++) {
        let k = j * nx + 1;
        for (let i = 1; i < nx - 1; i++, k++) {
          if (mask[k]) { un[k] = 0; continue; }
          const lap = u[k + 1] + u[k - 1] + u[k + nx] + u[k - nx] - 4 * u[k];
          const g = damp[k];
          un[k] = (2 * u[k] - (1 - g) * up[k] + r * c2[k] * lap) / (1 + g);
        }
      }
      this.up = u;
      this.u = un;
      this.t += this.courant;
    }
    add(i, j, v) { if (i > 0 && j > 0 && i < this.nx - 1 && j < this.ny - 1) this.u[j * this.nx + i] = v; }
    /* Pinta en un lienzo con mapa divergente; o.scale amplitud de saturación, o.energy usa u² acumulado */
    render(cv, o = {}) {
      const { nx, ny } = this;
      if (!this._img || this._img.width !== nx) {
        this._off = document.createElement('canvas');
        this._off.width = nx; this._off.height = ny;
        this._octx = this._off.getContext('2d');
        this._img = this._octx.createImageData(nx, ny);
      }
      const d = this._img.data, data = o.data || this.u, s = o.scale || 1;
      const wall = EM.rgb('--ink-2');
      for (let k = 0; k < nx * ny; k++) {
        let c;
        if (this.mask[k]) c = wall;
        else if (o.energy) c = EM.cmap.seq(Math.sqrt(Math.max(0, data[k]) * s), '--c1');
        else c = EM.cmap.diverging(data[k] * s);
        d[4 * k] = c[0]; d[4 * k + 1] = c[1]; d[4 * k + 2] = c[2]; d[4 * k + 3] = 255;
      }
      this._octx.putImageData(this._img, 0, 0);
      const ctx = cv.ctx;
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      const b = o.crop === false ? 0 : this.border;
      ctx.drawImage(this._off, b, b, nx - 2 * b, ny - 2 * b, 0, 0, cv.w, cv.h);
      ctx.restore();
    }
  }
  EM.Wave2D = Wave2D;
})();
