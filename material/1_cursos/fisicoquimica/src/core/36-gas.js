/* 36-gas.js — Gas bidimensional de discos duros (unidades reducidas m = kB = 1)
   Caja [0, W] × [0, H] con pared derecha móvil (pistón) y pared izquierda opcionalmente térmica.
   Mide la presión por transferencia de cantidad de movimiento sobre las paredes. */
(function () {
  'use strict';
  const EM = window.EM;
  const gauss = () => { let u = 0, v = 0; while (u === 0) u = Math.random(); while (v === 0) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  EM.gauss = gauss;
  class GasBox {
    constructor(o = {}) {
      this.N = o.N || 120; this.r = o.r || 0.012; this.W = o.W || 1; this.H = o.H || 1; this.T = o.T || 1;
      this.collide = o.collide !== false; this.thermal = o.thermal || null; /* temperatura de la pared izquierda o null */
      this.g = o.g || 0; this.vw = 0; /* velocidad del pistón */
      this.reset();
    }
    reset(T = this.T) {
      this.T = T;
      const n = this.N; this.x = new Float64Array(n); this.y = new Float64Array(n); this.vx = new Float64Array(n); this.vy = new Float64Array(n);
      this.tag = new Uint8Array(n);
      for (let i = 0; i < n; i++) {
        this.x[i] = this.r + Math.random() * (this.W - 2 * this.r); this.y[i] = this.r + Math.random() * (this.H - 2 * this.r);
        this.vx[i] = gauss() * Math.sqrt(T); this.vy[i] = gauss() * Math.sqrt(T);
      }
      this.imp = 0; this.impAll = 0; this.tAcc = 0; this.Pavg = null; this._si = 0; this._st = 0; this.Qin = 0; this.hist = [];
    }
    KE() { let s = 0; for (let i = 0; i < this.N; i++) s += 0.5 * (this.vx[i] ** 2 + this.vy[i] ** 2); return s; }
    Tkin() { return this.KE() / this.N; } /* 2D: <KE> = kB T */
    scale(f) { for (let i = 0; i < this.N; i++) { this.vx[i] *= f; this.vy[i] *= f; } }
    step(dt) {
      const n = this.N, r = this.r, W = this.W, H = this.H;
      for (let i = 0; i < n; i++) {
        this.vy[i] -= this.g * dt;
        this.x[i] += this.vx[i] * dt; this.y[i] += this.vy[i] * dt;
        if (this.x[i] < r) {
          this.x[i] = 2 * r - this.x[i];
          const before = 0.5 * (this.vx[i] ** 2 + this.vy[i] ** 2);
          if (this.thermal) { /* pared térmica: reemisión con la distribución de flujo */
            const s = Math.sqrt(this.thermal); this.vx[i] = s * Math.sqrt(-2 * Math.log(Math.random() || 1e-12)); this.vy[i] = s * gauss();
            this.Qin += 0.5 * (this.vx[i] ** 2 + this.vy[i] ** 2) - before;
          } else this.vx[i] = -this.vx[i];
          this.impAll += 2 * Math.abs(this.vx[i]);
        }
        if (this.x[i] > W - r) {
          const vrel = this.vx[i] - this.vw;
          if (vrel > 0) { this.vx[i] = 2 * this.vw - this.vx[i]; this.imp += 2 * vrel; }
          this.x[i] = 2 * (W - r) - this.x[i];
        }
        if (this.y[i] < r) { this.y[i] = 2 * r - this.y[i]; this.vy[i] = Math.abs(this.vy[i]); this.impAll += 2 * Math.abs(this.vy[i]); }
        if (this.y[i] > H - r) { this.y[i] = 2 * (H - r) - this.y[i]; this.vy[i] = -Math.abs(this.vy[i]); }
      }
      if (this.collide) this._collide();
      this.tAcc += dt;
    }
    _collide() {
      /* rejilla de celdas para buscar pares cercanos */
      const n = this.N, r = this.r, d = 2 * r, cs = Math.max(d, 0.02), nx = Math.ceil(this.W / cs) + 1, ny = Math.ceil(this.H / cs) + 1;
      const head = new Int32Array(nx * ny).fill(-1), next = new Int32Array(n);
      for (let i = 0; i < n; i++) { const cx = Math.min(nx - 1, Math.max(0, (this.x[i] / cs) | 0)), cy = Math.min(ny - 1, Math.max(0, (this.y[i] / cs) | 0)), c = cy * nx + cx; next[i] = head[c]; head[c] = i; }
      for (let i = 0; i < n; i++) {
        const cx = Math.min(nx - 1, Math.max(0, (this.x[i] / cs) | 0)), cy = Math.min(ny - 1, Math.max(0, (this.y[i] / cs) | 0));
        for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
          const X = cx + ox, Y = cy + oy; if (X < 0 || Y < 0 || X >= nx || Y >= ny) continue;
          for (let j = head[Y * nx + X]; j >= 0; j = next[j]) {
            if (j <= i) continue;
            const dx = this.x[j] - this.x[i], dy = this.y[j] - this.y[i], q = dx * dx + dy * dy;
            if (q >= d * d || q === 0) continue;
            const dvx = this.vx[j] - this.vx[i], dvy = this.vy[j] - this.vy[i], dot = dx * dvx + dy * dvy;
            if (dot >= 0) continue;
            const f = dot / q;
            this.vx[i] += f * dx; this.vy[i] += f * dy; this.vx[j] -= f * dx; this.vy[j] -= f * dy;
          }
        }
      }
    }
    /* presión media sobre el pistón (fuerza por unidad de longitud) en una ventana */
    pressure(win = 2) {
      /* promedio exponencial con memoria win: sumas de impulso y de tiempo con el mismo peso */
      if (this.tAcc > 0) {
        const d = Math.exp(-this.tAcc / win);
        this._si = (this._si || 0) * d + this.imp; this._st = (this._st || 0) * d + this.tAcc;
        this.imp = 0; this.impAll = 0; this.tAcc = 0;
        this.Pavg = this._si / (this._st * this.H);
      }
      return this.Pavg;
    }
    draw(ctx, px, py, pw, ph, o = {}) {
      const sx = pw / this.W, sy = ph / this.H, col = o.color || EM.col('--c1'), hot = EM.col('--c2'), cold = EM.col('--c1');
      for (let i = 0; i < this.N; i++) {
        const v2 = this.vx[i] ** 2 + this.vy[i] ** 2;
        ctx.fillStyle = o.speedColor ? EM.mix(cold, hot, Math.min(1, v2 / (4 * (o.Tref || this.T)))) : this.tag[i] ? EM.col('--c4') : col;
        ctx.beginPath(); ctx.arc(px + this.x[i] * sx, py + ph - this.y[i] * sy, Math.max(1.6, this.r * sx), 0, 2 * Math.PI); ctx.fill();
      }
    }
  }
  EM.GasBox = GasBox;
})();
