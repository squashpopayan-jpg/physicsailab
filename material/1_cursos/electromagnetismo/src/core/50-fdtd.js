/* ===================================================================
   50-fdtd.js — Diferencias finitas en el dominio del tiempo (Yee), 2D, modo TMz
   Campos Ez, Hx, Hy en unidades normalizadas (c = 1, Z0 absorbido en H).
     ∂Hx/∂t = −∂Ez/∂y,  ∂Hy/∂t = ∂Ez/∂x,
     εr ∂Ez/∂t + σ Ez = ∂Hy/∂x − ∂Hx/∂y
   Bordes absorbentes: capa con conductividad eléctrica y magnética graduada.
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM;

  class FDTD2D {
    constructor(nx, ny, o = {}) {
      this.nx = nx; this.ny = ny;
      const n = nx * ny;
      this.Ez = new Float32Array(n);
      this.Hx = new Float32Array(n);
      this.Hy = new Float32Array(n);
      this.eps = new Float32Array(n).fill(1);
      this.sig = new Float32Array(n);
      this.pec = new Uint8Array(n);
      this.dt = o.courant || 0.5; /* dt/dx (Courant ≤ 1/√2) */
      this.pml = o.pml === undefined ? 18 : o.pml;
      this.sigM = new Float32Array(n);
      this.t = 0;
      this.setupBoundary();
      this.build();
    }
    setupBoundary() {
      const { nx, ny, pml } = this;
      const smax = 0.8;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const d = Math.min(i, j, nx - 1 - i, ny - 1 - j);
        const k = j * nx + i;
        if (d < pml) { const x = (pml - d) / pml; this.sigM[k] = smax * x * x * x; } else this.sigM[k] = 0;
      }
    }
    /* Precalcula coeficientes; llamar tras cambiar eps, sig o pec */
    build() {
      const n = this.nx * this.ny, dt = this.dt;
      this.ca = new Float32Array(n);
      this.cb = new Float32Array(n);
      this.da = new Float32Array(n);
      this.db = new Float32Array(n);
      for (let k = 0; k < n; k++) {
        const e = this.eps[k], s = this.sig[k] + this.sigM[k] * e;
        const f = (s * dt) / (2 * e);
        this.ca[k] = this.pec[k] ? 0 : (1 - f) / (1 + f);
        this.cb[k] = this.pec[k] ? 0 : dt / e / (1 + f);
        const g = (this.sigM[k] * dt) / 2;
        this.da[k] = (1 - g) / (1 + g);
        this.db[k] = dt / (1 + g);
      }
    }
    reset() { this.Ez.fill(0); this.Hx.fill(0); this.Hy.fill(0); this.t = 0; }
    step() {
      const { nx, ny, Ez, Hx, Hy, ca, cb, da, db } = this;
      for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx; i++) { const k = j * nx + i; Hx[k] = da[k] * Hx[k] - db[k] * (Ez[k + nx] - Ez[k]); }
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx - 1; i++) { const k = j * nx + i; Hy[k] = da[k] * Hy[k] + db[k] * (Ez[k + 1] - Ez[k]); }
      for (let j = 1; j < ny; j++) for (let i = 1; i < nx; i++) { const k = j * nx + i; Ez[k] = ca[k] * Ez[k] + cb[k] * (Hy[k] - Hy[k - 1] - Hx[k] + Hx[k - nx]); }
      this.t += this.dt;
    }
    /* Fuente blanda */
    add(i, j, v) { if (i > 0 && j > 0 && i < this.nx && j < this.ny) this.Ez[j * this.nx + i] += v; }
    /* Imagen de Ez con mapa divergente */
    render(cv, o = {}) {
      const { nx, ny, Ez } = this;
      if (!this._off || this._off.width !== nx) { this._off = document.createElement('canvas'); this._off.width = nx; this._off.height = ny; }
      const ctx = this._off.getContext('2d'), img = ctx.createImageData(nx, ny), d = img.data;
      const sc = o.scale || 1;
      const matC = EM.rgb('--c3'), pecC = EM.rgb('--ink-3');
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const k = j * nx + i, q = ((ny - 1 - j) * nx + i) * 4;
        let c;
        if (this.pec[k]) c = pecC;
        else {
          const v = Math.max(-1, Math.min(1, (o.energy ? Ez[k] * Ez[k] * sc : Ez[k] * sc)));
          c = o.energy ? EM.cmap.inferno(Math.sqrt(Math.abs(v))) : EM.cmap.diverging(v);
          if (this.eps[k] > 1.001 && !o.energy) { const a = Math.min(0.32, 0.08 + 0.06 * (this.eps[k] - 1)); c = [c[0] * (1 - a) + matC[0] * a, c[1] * (1 - a) + matC[1] * a, c[2] * (1 - a) + matC[2] * a]; }
        }
        d[q] = c[0]; d[q + 1] = c[1]; d[q + 2] = c[2]; d[q + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      const c2 = cv.ctx;
      const s = Math.min(cv.w / nx, cv.h / ny);
      const ox = (cv.w - nx * s) / 2, oy = (cv.h - ny * s) / 2;
      c2.imageSmoothingEnabled = true;
      c2.drawImage(this._off, ox, oy, nx * s, ny * s);
      return { s, ox, oy };
    }
  }
  EM.FDTD2D = FDTD2D;
})();
