/* ===================================================================
   35-laplace.js — Solucionador 2D de Laplace/Poisson por sobrerrelajación
   sucesiva (SOR, rojo-negro) en una malla cuadrada.
   ∇²V = −f   con f = ρ/ε₀ (en las unidades que elija el usuario)
   =================================================================== */
(function () {
  'use strict';
  const EM = window.EM;

  class Laplace {
    /* Región [x0,x1]×[y0,y1] con celdas cuadradas de lado h */
    constructor(x0, x1, y0, y1, h) {
      this.x0 = x0; this.y0 = y0; this.h = h;
      this.nx = Math.round((x1 - x0) / h) + 1;
      this.ny = Math.round((y1 - y0) / h) + 1;
      this.x1 = x0 + (this.nx - 1) * h;
      this.y1 = y0 + (this.ny - 1) * h;
      const n = this.nx * this.ny;
      this.V = new Float64Array(n);
      this.fixed = new Uint8Array(n);
      this.tag = new Int16Array(n).fill(-1);
      this.src = new Float64Array(n);
      this.iters = 0;
      /* borde exterior a potencial 0 */
      for (let i = 0; i < this.nx; i++) { this.fix(i, 0, 0); this.fix(i, this.ny - 1, 0); }
      for (let j = 0; j < this.ny; j++) { this.fix(0, j, 0); this.fix(this.nx - 1, j, 0); }
    }
    id(i, j) { return j * this.nx + i; }
    xOf(i) { return this.x0 + i * this.h; }
    yOf(j) { return this.y0 + j * this.h; }
    fix(i, j, v, tag = -1) { const k = this.id(i, j); this.fixed[k] = 1; this.V[k] = v; this.tag[k] = tag; }
    /* Fija todas las celdas donde inside(x,y) sea verdadero */
    fixRegion(inside, v, tag = -1) {
      for (let j = 1; j < this.ny - 1; j++) for (let i = 1; i < this.nx - 1; i++) {
        if (inside(this.xOf(i), this.yOf(j))) this.fix(i, j, v, tag);
      }
    }
    /* Carga (fuente) en la celda más cercana: f = q/h² */
    addSource(x, y, q) {
      const i = Math.round((x - this.x0) / this.h), j = Math.round((y - this.y0) / this.h);
      if (i > 0 && j > 0 && i < this.nx - 1 && j < this.ny - 1) this.src[this.id(i, j)] += q / (this.h * this.h);
    }
    /* Iteraciones SOR rojo-negro; devuelve el cambio máximo */
    solve(iters = 200, omega = 1.9) {
      const { nx, ny, V, fixed, src } = this;
      const h2 = this.h * this.h;
      let maxd = 0;
      for (let it = 0; it < iters; it++) {
        maxd = 0;
        for (let color = 0; color < 2; color++) {
          for (let j = 1; j < ny - 1; j++) {
            let i0 = 1 + ((j + color) & 1);
            for (let i = i0; i < nx - 1; i += 2) {
              const k = j * nx + i;
              if (fixed[k]) continue;
              const nv = 0.25 * (V[k - 1] + V[k + 1] + V[k - nx] + V[k + nx] + h2 * src[k]);
              const d = nv - V[k];
              V[k] += omega * d;
              const ad = d < 0 ? -d : d;
              if (ad > maxd) maxd = ad;
            }
          }
        }
        this.iters++;
      }
      return maxd;
    }
    /* Potencial por interpolación bilineal */
    at(x, y) {
      const fx = (x - this.x0) / this.h, fy = (y - this.y0) / this.h;
      const i = Math.floor(fx), j = Math.floor(fy);
      if (i < 0 || j < 0 || i >= this.nx - 1 || j >= this.ny - 1) return 0;
      const tx = fx - i, ty = fy - j, k = j * this.nx + i, V = this.V, nx = this.nx;
      return (V[k] * (1 - tx) + V[k + 1] * tx) * (1 - ty) + (V[k + nx] * (1 - tx) + V[k + nx + 1] * tx) * ty;
    }
    /* Campo E = −∇V por diferencias centradas (interpolado) */
    E(x, y) {
      const d = this.h * 0.5;
      return [-(this.at(x + d, y) - this.at(x - d, y)) / (2 * d), -(this.at(x, y + d) - this.at(x, y - d)) / (2 * d)];
    }
    /* ¿El punto está en una celda fija interior (conductor)? */
    isFixedAt(x, y) {
      const i = Math.round((x - this.x0) / this.h), j = Math.round((y - this.y0) / this.h);
      if (i <= 0 || j <= 0 || i >= this.nx - 1 || j >= this.ny - 1) return true;
      return !!this.fixed[this.id(i, j)];
    }
    /* Celdas de frontera de un conductor (tag) con su flujo saliente ∝ σ */
    boundary(tag) {
      const out = [];
      const { nx, ny, V, fixed } = this;
      for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
        const k = j * nx + i;
        if (this.tag[k] !== tag) continue;
        let flux = 0, nfree = 0;
        const nb = [[k - 1, -1, 0], [k + 1, 1, 0], [k - nx, 0, -1], [k + nx, 0, 1]];
        let dx = 0, dy = 0;
        for (const [kk, ox, oy] of nb) if (!fixed[kk]) { flux += (V[k] - V[kk]) / this.h; nfree++; dx += ox; dy += oy; }
        if (nfree) out.push({ i, j, x: this.xOf(i), y: this.yOf(j), s: flux, nx: dx, ny: dy });
      }
      return out;
    }
  }
  EM.Laplace = Laplace;
})();
