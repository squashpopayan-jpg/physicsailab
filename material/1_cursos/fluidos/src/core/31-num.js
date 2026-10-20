/* ===================================================================
   31-num.js — Solucionadores numéricos del curso (amplía EM.fl)
   Capa límite (Falkner–Skan por disparo), convección de Rayleigh–Bénard
   (curva neutra), cavidad con tapa móvil (corriente–vorticidad), Lattice
   Boltzmann D2Q9, golpe de ariete (características), aguas someras (HLL),
   ecuaciones de Euler (solución exacta de Riemann y HLLC), difusión
   (Crank–Nicolson), lubricación, vórtices puntuales, longitud de mezcla,
   redes de tuberías (Hardy Cross) y esquemas de advección.
   Todo funciona en Node para las pruebas de tests/validar.js.
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const FL = EM.fl || (typeof require !== 'undefined' ? require('./30-fluid.js') : null);
  const g = FL.g;

  /* Sistema tridiagonal: a (sub), b (diag), c (super), d → x (algoritmo de Thomas) */
  FL.tridiag = function (a, b, c, d) {
    const n = b.length, cp = new Float64Array(n), dp = new Float64Array(n), x = new Float64Array(n);
    cp[0] = c[0] / b[0]; dp[0] = d[0] / b[0];
    for (let i = 1; i < n; i++) { const m = b[i] - a[i] * cp[i - 1]; cp[i] = c[i] / m; dp[i] = (d[i] - a[i] * dp[i - 1]) / m; }
    x[n - 1] = dp[n - 1];
    for (let i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1];
    return x;
  };

  /* ================= Capa límite: Falkner–Skan ================= */
  /* f''' + a f f'' + β(1 − f'²) = 0, f(0) = f'(0) = 0, f'(∞) = 1.
     a = 1/2, β = 0: Blasius con η = y√(U/νx); a = 1: forma de Falkner–Skan. */
  FL.fs = function (beta, o = {}) {
    const a = o.a === undefined ? 1 : o.a, etaMax = o.etaMax || (a < 1 ? 12 : 9), h = o.h || 0.005;
    const n = Math.round(etaMax / h);
    const rhs = (t, y) => [y[1], y[2], -a * y[0] * y[2] - beta * (1 - y[1] * y[1])];
    const shoot = (s) => {
      let y = [0, 0, s];
      for (let i = 0; i < n; i++) {
        y = FL.rk4(rhs, i * h, y, h);
        if (y[1] > 2) return 1;
        if (y[1] < -1 || (i * h > 1 && y[2] < 0 && y[1] < 0.9)) return -1;
      }
      return y[1] - 1;
    };
    let lo = o.lo === undefined ? 0 : o.lo, hi = 3;
    const s = FL.bisect(shoot, lo, hi, 1e-14, 200);
    const eta = [0], f = [0], fp = [0], fpp = [s];
    let y = [0, 0, s];
    for (let i = 0; i < n; i++) {
      y = FL.rk4(rhs, i * h, y, h);
      if (i % 4 === 3) { eta.push((i + 1) * h); f.push(y[0]); fp.push(y[1]); fpp.push(y[2]); }
    }
    let dstar = 0, theta = 0, d99 = null;
    for (let i = 1; i < eta.length; i++) {
      const dh = eta[i] - eta[i - 1];
      dstar += 0.5 * dh * (1 - fp[i] + 1 - fp[i - 1]);
      theta += 0.5 * dh * (fp[i] * (1 - fp[i]) + fp[i - 1] * (1 - fp[i - 1]));
      if (d99 === null && fp[i] >= 0.99) d99 = eta[i - 1] + (dh * (0.99 - fp[i - 1])) / (fp[i] - fp[i - 1]);
    }
    return { fpp0: s, eta, f, fp, fpp, dstar, theta, d99, H: dstar / theta };
  };
  FL.blasius = (o = {}) => FL.fs(0, Object.assign({ a: 0.5 }, o));

  /* ================= Rayleigh–Bénard: curva neutra por disparo ================= */
  /* (D² − k²)³W = −Ra k² W en 0 ≤ z ≤ 1; bordes 'rigid' (W = DW = 0) o 'free' (W = D²W = 0);
     en ambos casos (D² − k²)²W = 0 (temperatura fija). */
  function rbDet(k, Ra, bot, top, n = 300) {
    const k2 = k * k, k4 = k2 * k2, k6 = k4 * k2;
    const rhs = (t, y) => [y[1], y[2], y[3], y[4], y[5], 3 * k2 * y[4] - 3 * k4 * y[2] + (k6 - Ra * k2) * y[0]];
    const init = bot === 'rigid' ? [[0, 0, 1, 0, 2 * k2, 0], [0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 1]] : [[0, 1, 0, 0, 0, 0], [0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 1]];
    const h = 1 / n, rows = [];
    for (const v of init) {
      let y = v.slice();
      for (let i = 0; i < n; i++) y = FL.rk4(rhs, i * h, y, h);
      const th = y[4] - 2 * k2 * y[2] + k4 * y[0];
      rows.push(top === 'rigid' ? [y[0], y[1], th] : [y[0], y[2], th]);
    }
    const [a, b, c] = rows;
    return a[0] * (b[1] * c[2] - b[2] * c[1]) - a[1] * (b[0] * c[2] - b[2] * c[0]) + a[2] * (b[0] * c[1] - b[1] * c[0]);
  }
  FL.rbRa = function (k, bot = 'rigid', top = 'rigid') {
    let R0 = 50, d0 = rbDet(k, R0, bot, top);
    for (let R = R0 * 1.05; R < 2e6; R *= 1.05) {
      const d = rbDet(k, R, bot, top);
      if (d0 * d <= 0) return FL.bisect((x) => rbDet(k, x, bot, top), R / 1.05, R, 1e-12, 100);
      d0 = d;
    }
    return NaN;
  };
  FL.rbCritical = function (bot = 'rigid', top = 'rigid') {
    let lo = 1, hi = 5;
    for (let i = 0; i < 60; i++) { const m1 = lo + (hi - lo) * 0.382, m2 = lo + (hi - lo) * 0.618; if (FL.rbRa(m1, bot, top) < FL.rbRa(m2, bot, top)) hi = m2; else lo = m1; }
    const k = (lo + hi) / 2;
    return { k, Ra: FL.rbRa(k, bot, top) };
  };

  /* ================= Cavidad con tapa móvil (corriente–vorticidad) ================= */
  class Cavity {
    constructor(N, Re, U = 1) {
      this.N = N; this.Re = Re; this.U = U; this.h = 1 / (N - 1);
      this.psi = new Float64Array(N * N); this.w = new Float64Array(N * N); this.wn = new Float64Array(N * N);
      this.t = 0; this.res = 1;
    }
    dtMax() { const h = this.h, nu = 1 / this.Re; return 0.9 * Math.min((h * h) / (4 * nu), (2 * nu) / (this.U * this.U), h / this.U); }
    walls() {
      const { N, h, psi, w, U } = this, h2 = h * h;
      for (let i = 0; i < N; i++) {
        w[i] = (-2 * psi[N + i]) / h2;
        w[(N - 1) * N + i] = (-2 * psi[(N - 2) * N + i]) / h2 - (2 * U) / h;
      }
      for (let j = 1; j < N - 1; j++) { w[j * N] = (-2 * psi[j * N + 1]) / h2; w[j * N + N - 1] = (-2 * psi[j * N + N - 2]) / h2; }
    }
    poisson(tol = 1e-7, maxIt = 400) {
      const { N, h, psi, w } = this, h2 = h * h, om = 2 / (1 + Math.sin(Math.PI * h));
      let it = 0;
      for (; it < maxIt; it++) {
        let mx = 0;
        for (let j = 1; j < N - 1; j++) for (let i = 1, k = j * N + 1; i < N - 1; i++, k++) {
          const nv = 0.25 * (psi[k + 1] + psi[k - 1] + psi[k + N] + psi[k - N] + h2 * w[k]);
          const d = om * (nv - psi[k]);
          psi[k] += d;
          if (Math.abs(d) > mx) mx = Math.abs(d);
        }
        if (mx < tol) break;
      }
      return it;
    }
    step(dt) {
      const { N, h, psi, w, wn } = this, nu = 1 / this.Re, i2h = 1 / (2 * h), ih2 = 1 / (h * h);
      this.walls();
      let mx = 0;
      for (let j = 1; j < N - 1; j++) for (let i = 1, k = j * N + 1; i < N - 1; i++, k++) {
        const u = (psi[k + N] - psi[k - N]) * i2h, v = -(psi[k + 1] - psi[k - 1]) * i2h;
        const lap = (w[k + 1] + w[k - 1] + w[k + N] + w[k - N] - 4 * w[k]) * ih2;
        const dw = -u * (w[k + 1] - w[k - 1]) * i2h - v * (w[k + N] - w[k - N]) * i2h + nu * lap;
        wn[k] = w[k] + dt * dw;
        if (Math.abs(dw) > mx) mx = Math.abs(dw);
      }
      for (let j = 1; j < N - 1; j++) for (let i = 1, k = j * N + 1; i < N - 1; i++, k++) w[k] = wn[k];
      this.poisson();
      this.t += dt; this.res = mx;
      return mx;
    }
    solve(tol = 1e-4, tmax = 200) { const dt = this.dtMax(); while (this.t < tmax) { if (this.step(dt) < tol && this.t > 1) break; } return this; }
    /* u(y) en x = 0.5 y v(x) en y = 0.5 (interpolación lineal) */
    field(kind, x, y) {
      const { N, h, psi, U } = this;
      const val = (i, j) => {
        if (kind === 'psi') return psi[j * N + i];
        if (kind === 'w') return this.w[j * N + i];
        if (kind === 'u') { if (j === N - 1) return U; if (j === 0) return 0; return (psi[(j + 1) * N + i] - psi[(j - 1) * N + i]) / (2 * h); }
        if (i === 0 || i === N - 1) return 0; return -(psi[j * N + i + 1] - psi[j * N + i - 1]) / (2 * h);
      };
      const fx = Math.min(N - 1 - 1e-9, Math.max(0, x / h)), fy = Math.min(N - 1 - 1e-9, Math.max(0, y / h));
      const i = Math.floor(fx), j = Math.floor(fy), tx = fx - i, ty = fy - j;
      return (1 - tx) * (1 - ty) * val(i, j) + tx * (1 - ty) * val(i + 1, j) + (1 - tx) * ty * val(i, j + 1) + tx * ty * val(i + 1, j + 1);
    }
    psiMin() { let m = 0, at = 0; for (let k = 0; k < this.psi.length; k++) if (this.psi[k] < m) { m = this.psi[k]; at = k; } return { psi: m, x: (at % this.N) * this.h, y: Math.floor(at / this.N) * this.h }; }
  }
  FL.Cavity = Cavity;
  /* Datos de referencia de Ghia, Ghia y Shin (1982): u en x = 0.5 */
  FL.GHIA = {
    y: [1, 0.9766, 0.9688, 0.9609, 0.9531, 0.8516, 0.7344, 0.6172, 0.5, 0.4531, 0.2813, 0.1719, 0.1016, 0.0703, 0.0625, 0.0547, 0],
    u100: [1, 0.84123, 0.78871, 0.73722, 0.68717, 0.23151, 0.00332, -0.13641, -0.20581, -0.2109, -0.15662, -0.1015, -0.06434, -0.04775, -0.04192, -0.03717, 0],
    u400: [1, 0.75837, 0.68439, 0.61756, 0.55892, 0.29093, 0.16256, 0.02135, -0.11477, -0.17119, -0.32726, -0.24299, -0.14612, -0.10338, -0.09266, -0.08186, 0],
    u1000: [1, 0.65928, 0.57492, 0.51117, 0.46604, 0.33304, 0.18719, 0.05702, -0.0608, -0.10648, -0.27805, -0.38289, -0.2973, -0.2222, -0.20196, -0.18109, 0],
    psiMin: { 100: -0.103423, 400: -0.113909, 1000: -0.117929 }
  };

  /* ================= Lattice Boltzmann D2Q9 (BGK, Smagorinsky opcional) ================= */
  const EX = [0, 1, 0, -1, 0, 1, -1, -1, 1], EY = [0, 0, 1, 0, -1, 1, 1, -1, -1];
  const WQ = [4 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 36, 1 / 36, 1 / 36, 1 / 36], OPP = [0, 3, 4, 1, 2, 7, 8, 5, 6];
  class LBM {
    /* o.mode: 'tunnel' (entrada con U a la izquierda, salida libre, bordes periódicos) o 'periodic';
       o.walls: paredes sólidas arriba y abajo; o.tau o o.nu; o.Fx fuerza volumétrica; o.Cs Smagorinsky */
    constructor(nx, ny, o = {}) {
      this.nx = nx; this.ny = ny; const N = nx * ny;
      this.tau = o.tau || 3 * (o.nu || 0.02) + 0.5;
      this.mode = o.mode || 'tunnel'; this.U = o.U || 0.08; this.Fx = o.Fx || 0; this.Fy = 0; this.Cs = o.Cs || 0;
      this.f = new Float32Array(9 * N); this.ft = new Float32Array(9 * N);
      this.rho = new Float32Array(N).fill(1); this.ux = new Float32Array(N); this.uy = new Float32Array(N);
      this.solid = new Uint8Array(N);
      if (o.walls) for (let i = 0; i < nx; i++) { this.solid[i] = 1; this.solid[(ny - 1) * nx + i] = 1; }
      this.steps = 0;
      this.init(this.mode === 'tunnel' ? this.U : 0, 0);
    }
    get nu() { return (this.tau - 0.5) / 3; }
    set nu(v) { this.tau = 3 * v + 0.5; }
    init(ux, uy, fn) {
      const { nx, ny, f } = this;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const k = j * nx + i;
        let u = ux, v = uy;
        if (fn) [u, v] = fn(i, j);
        if (this.solid[k]) { u = 0; v = 0; }
        this.ux[k] = u; this.uy[k] = v; this.rho[k] = 1;
        for (let q = 0; q < 9; q++) f[q * nx * ny + k] = this.feq(q, 1, u, v);
      }
    }
    feq(q, r, u, v) { const eu = EX[q] * u + EY[q] * v; return WQ[q] * r * (1 + 3 * eu + 4.5 * eu * eu - 1.5 * (u * u + v * v)); }
    step() {
      const { nx, ny, f, ft, solid, rho, ux, uy } = this, N = nx * ny, tau0 = this.tau, Fx = this.Fx, Fy = this.Fy, Cs2 = this.Cs * this.Cs;
      const fe = this._fe || (this._fe = new Float64Array(9));
      /* momentos y colisión */
      for (let k = 0; k < N; k++) {
        if (solid[k]) continue;
        let r = 0, mx = 0, my = 0;
        for (let q = 0; q < 9; q++) { const v = f[q * N + k]; r += v; mx += EX[q] * v; my += EY[q] * v; }
        const u = (mx + 0.5 * Fx) / r, v = (my + 0.5 * Fy) / r;
        rho[k] = r; ux[k] = u; uy[k] = v;
        let tau = tau0;
        const usq = 1.5 * (u * u + v * v);
        for (let q = 0; q < 9; q++) { const eu = EX[q] * u + EY[q] * v; fe[q] = WQ[q] * r * (1 + 3 * eu + 4.5 * eu * eu - usq); }
        if (Cs2 > 0) {
          /* tensor de esfuerzos de no equilibrio: Π = Σ e e (f − f_eq) */
          const d1 = f[N + k] - fe[1], d2 = f[2 * N + k] - fe[2], d3 = f[3 * N + k] - fe[3], d4 = f[4 * N + k] - fe[4];
          const d5 = f[5 * N + k] - fe[5], d6 = f[6 * N + k] - fe[6], d7 = f[7 * N + k] - fe[7], d8 = f[8 * N + k] - fe[8];
          const c4 = d5 + d6 + d7 + d8, pxx = d1 + d3 + c4, pyy = d2 + d4 + c4, pxy = d5 - d6 + d7 - d8;
          const Pi = Math.sqrt(pxx * pxx + pyy * pyy + 2 * pxy * pxy);
          tau = 0.5 * (tau0 + Math.sqrt(tau0 * tau0 + (18 * Math.SQRT2 * Cs2 * Pi) / r));
        }
        const om = 1 / tau, fpre = 1 - 0.5 * om;
        if (Fx || Fy) for (let q = 0; q < 9; q++) {
          const eu = EX[q] * u + EY[q] * v, Fi = fpre * WQ[q] * (3 * ((EX[q] - u) * Fx + (EY[q] - v) * Fy) + 9 * eu * (EX[q] * Fx + EY[q] * Fy));
          f[q * N + k] += -om * (f[q * N + k] - fe[q]) + Fi;
        }
        else for (let q = 0; q < 9; q++) f[q * N + k] += -om * (f[q * N + k] - fe[q]);
      }
      /* propagación con rebote a mitad de enlace */
      const per = this.mode === 'periodic', off = this._off || (this._off = EX.map((e, q) => e + EY[q] * nx));
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const k = j * nx + i;
        if (solid[k]) continue;
        const inner = i > 0 && i < nx - 1 && j > 0 && j < ny - 1;
        for (let q = 0; q < 9; q++) {
          let kk;
          if (inner) kk = k + off[q];
          else {
            let ii = i + EX[q], jj = j + EY[q];
            if (jj < 0) jj += ny; else if (jj >= ny) jj -= ny;
            if (ii < 0 || ii >= nx) { if (per) ii = (ii + nx) % nx; else continue; }
            kk = jj * nx + ii;
          }
          if (solid[kk]) ft[OPP[q] * N + k] = f[q * N + k];
          else ft[q * N + kk] = f[q * N + k];
        }
      }
      if (!per) {
        /* entrada en equilibrio con U, salida con gradiente nulo */
        const U = this.U;
        for (let j = 0; j < ny; j++) {
          const k0 = j * nx, k1 = j * nx + nx - 1, k2 = j * nx + nx - 2;
          if (!solid[k0]) for (let q = 0; q < 9; q++) ft[q * N + k0] = this.feq(q, 1, U, 0);
          if (!solid[k1]) for (let q = 0; q < 9; q++) ft[q * N + k1] = ft[q * N + k2];
        }
      }
      this.f = ft; this.ft = f;
      this.steps++;
    }
    /* vorticidad ω = ∂v/∂x − ∂u/∂y (unidades de red) */
    curl(out) {
      const { nx, ny, ux, uy, solid } = this;
      out = out || new Float32Array(nx * ny);
      for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
        const k = j * nx + i;
        out[k] = solid[k] ? 0 : 0.5 * (uy[k + 1] - uy[k - 1]) - 0.5 * (ux[k + nx] - ux[k - nx]);
      }
      return out;
    }
    /* velocidad interpolada en (x, y) en unidades de red */
    vel(x, y) {
      const { nx, ny, ux, uy } = this;
      if (x < 0 || y < 0 || x > nx - 1.001 || y > ny - 1.001) return [this.U, 0];
      const i = Math.floor(x), j = Math.floor(y), tx = x - i, ty = y - j, k = j * nx + i;
      const a = (1 - tx) * (1 - ty), b = tx * (1 - ty), c = (1 - tx) * ty, d = tx * ty;
      return [a * ux[k] + b * ux[k + 1] + c * ux[k + nx] + d * ux[k + nx + 1], a * uy[k] + b * uy[k + 1] + c * uy[k + nx] + d * uy[k + nx + 1]];
    }
    addDisk(cx, cy, r) { const { nx, ny } = this; for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if ((i - cx) * (i - cx) + (j - cy) * (j - cy) <= r * r) this.solid[j * nx + i] = 1; }
    /* fuerza sobre el sólido por intercambio de momento: 2 f_reflejada · e por enlace */
    force() {
      const { nx, ny, solid } = this, N = nx * ny, f = this.f;
      let Fx = 0, Fy = 0;
      for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
        const k = j * nx + i;
        if (solid[k]) continue;
        for (let q = 1; q < 9; q++) {
          const kk = (j + EY[q]) * nx + i + EX[q];
          if (solid[kk]) { const fb = f[OPP[q] * N + k]; Fx += EX[q] * 2 * fb; Fy += EY[q] * 2 * fb; }
        }
      }
      return [Fx, Fy];
    }
  }
  FL.LBM = LBM;

  /* ================= Golpe de ariete: método de las características ================= */
  /* o = {L, a, D, f, V0, H0, N, tc (cierre lineal), tmax}. Reservorio aguas arriba, válvula aguas abajo. */
  FL.hammer = function (o) {
    const N = o.N || 40, L = o.L, a = o.a, D = o.D, A = (Math.PI * D * D) / 4, f = o.f || 0;
    const dx = L / N, dt = dx / a, B = a / (g * A), Rr = (f * dx) / (2 * g * D * A * A), Q0 = o.V0 * A;
    const H = new Float64Array(N + 1), Q = new Float64Array(N + 1);
    for (let i = 0; i <= N; i++) { Q[i] = Q0; H[i] = o.H0 - ((f * (i * dx)) / D) * ((o.V0 * o.V0) / (2 * g)); }
    const Hv0 = H[N];
    const tauV = (t) => (o.tc > 0 ? Math.max(0, 1 - t / o.tc) : 0);
    const Hn = new Float64Array(N + 1), Qn = new Float64Array(N + 1);
    const out = { t: [0], Hv: [H[N]], Hm: [H[N >> 1]], Qv: [Q[N]], dt, H0: o.H0, snaps: [] };
    const steps = Math.ceil((o.tmax || (8 * L) / a) / dt);
    for (let s = 1; s <= steps; s++) {
      const t = s * dt;
      for (let i = 1; i < N; i++) {
        const CP = H[i - 1] + B * Q[i - 1] - Rr * Q[i - 1] * Math.abs(Q[i - 1]), CM = H[i + 1] - B * Q[i + 1] + Rr * Q[i + 1] * Math.abs(Q[i + 1]);
        Hn[i] = 0.5 * (CP + CM); Qn[i] = (CP - CM) / (2 * B);
      }
      const CM0 = H[1] - B * Q[1] + Rr * Q[1] * Math.abs(Q[1]);
      Hn[0] = o.H0; Qn[0] = (o.H0 - CM0) / B;
      const CPN = H[N - 1] + B * Q[N - 1] - Rr * Q[N - 1] * Math.abs(Q[N - 1]), tv = tauV(t);
      if (tv <= 0) { Qn[N] = 0; Hn[N] = CPN; }
      else { const Cv = Math.pow(tv * Q0, 2) / (2 * Hv0); Qn[N] = -B * Cv + Math.sqrt(B * B * Cv * Cv + 2 * Cv * CPN); Hn[N] = CPN - B * Qn[N]; }
      H.set(Hn); Q.set(Qn);
      out.t.push(t); out.Hv.push(H[N]); out.Hm.push(H[N >> 1]); out.Qv.push(Q[N]);
      if (o.snapEvery && s % o.snapEvery === 0) out.snaps.push({ t, H: Array.from(H) });
    }
    return out;
  };

  /* ================= Aguas someras 1D: volúmenes finitos HLL ================= */
  class SW1D {
    constructor(nx, L, o = {}) {
      this.nx = nx; this.L = L; this.dx = L / nx;
      this.h = new Float64Array(nx); this.hu = new Float64Array(nx); this.b = new Float64Array(nx);
      this.bc = o.bc || 'wall'; this.hmin = o.hmin || 1e-8; this.t = 0; this.cfl = o.cfl || 0.45; this.n = o.n || 0;
    }
    flux(hL, uL, hR, uR) {
      const cL = Math.sqrt(g * hL), cR = Math.sqrt(g * hR);
      const sL = Math.min(uL - cL, uR - cR), sR = Math.max(uL + cL, uR + cR);
      const FL1 = hL * uL, FL2 = hL * uL * uL + 0.5 * g * hL * hL, FR1 = hR * uR, FR2 = hR * uR * uR + 0.5 * g * hR * hR;
      if (sL >= 0) return [FL1, FL2];
      if (sR <= 0) return [FR1, FR2];
      return [(sR * FL1 - sL * FR1 + sL * sR * (hR - hL)) / (sR - sL), (sR * FL2 - sL * FR2 + sL * sR * (hR * uR - hL * uL)) / (sR - sL)];
    }
    step(dtMax) {
      const { nx, h, hu, b, hmin, dx } = this;
      let smax = 1e-9;
      for (let i = 0; i < nx; i++) if (h[i] > hmin) smax = Math.max(smax, Math.abs(hu[i] / h[i]) + Math.sqrt(g * h[i]));
      const dt = Math.min(dtMax || Infinity, (this.cfl * dx) / smax);
      const F1 = new Float64Array(nx + 1), F2 = new Float64Array(nx + 1), SL = new Float64Array(nx + 1), SR = new Float64Array(nx + 1);
      const U = (i) => (h[i] > hmin ? hu[i] / h[i] : 0);
      for (let f = 0; f <= nx; f++) {
        let iL = f - 1, iR = f, hL, uL, hR, uR, bL, bR;
        if (iL < 0) { hL = h[0]; uL = this.bc === 'wall' ? -U(0) : U(0); bL = b[0]; } else { hL = h[iL]; uL = U(iL); bL = b[iL]; }
        if (iR >= nx) { hR = h[nx - 1]; uR = this.bc === 'wall' ? -U(nx - 1) : U(nx - 1); bR = b[nx - 1]; } else { hR = h[iR]; uR = U(iR); bR = b[iR]; }
        /* reconstrucción hidrostática (Audusse et al. 2004) */
        const bm = Math.max(bL, bR), hLs = Math.max(0, hL + bL - bm), hRs = Math.max(0, hR + bR - bm);
        const fl = this.flux(hLs, uL, hRs, uR);
        F1[f] = fl[0]; F2[f] = fl[1];
        SL[f] = 0.5 * g * (hL * hL - hLs * hLs); SR[f] = 0.5 * g * (hR * hR - hRs * hRs);
      }
      for (let i = 0; i < nx; i++) {
        h[i] -= (dt / dx) * (F1[i + 1] - F1[i]);
        hu[i] -= (dt / dx) * (F2[i + 1] + SL[i + 1] - F2[i] - SR[i]);
        if (h[i] < hmin) { h[i] = Math.max(0, h[i]); hu[i] = 0; }
        /* fricción de Manning implícita */
        if (this.n > 0 && h[i] > hmin) { const u = hu[i] / h[i]; hu[i] /= 1 + (dt * g * this.n * this.n * Math.abs(u)) / Math.pow(h[i], 4 / 3); }
      }
      this.t += dt;
      return dt;
    }
  }
  FL.SW1D = SW1D;
  /* Ondas largas lineales con fondo variable (malla escalonada, salto de rana) */
  class LinSW {
    constructor(nx, L, depth) {
      this.nx = nx; this.dx = L / nx; this.eta = new Float64Array(nx); this.q = new Float64Array(nx + 1);
      this.hc = new Float64Array(nx); this.hf = new Float64Array(nx + 1); this.t = 0;
      for (let i = 0; i < nx; i++) this.hc[i] = depth((i + 0.5) * this.dx);
      for (let i = 0; i <= nx; i++) this.hf[i] = depth(i * this.dx);
      this.cmax = Math.sqrt(g * Math.max(...this.hc));
      this.sponge = 0;
    }
    step(dt) {
      const { nx, dx, eta, q, hf } = this;
      for (let i = 1; i < nx; i++) q[i] -= dt * g * hf[i] * (eta[i] - eta[i - 1]) / dx;
      q[0] = 0; q[nx] = 0;
      if (this.sponge > 0) for (let i = 0; i < this.sponge; i++) { const s = 1 - 0.08 * Math.pow((this.sponge - i) / this.sponge, 2); q[i] *= s; }
      for (let i = 0; i < nx; i++) eta[i] -= (dt * (q[i + 1] - q[i])) / dx;
      if (this.sponge > 0) for (let i = 0; i < this.sponge; i++) { const s = 1 - 0.08 * Math.pow((this.sponge - i) / this.sponge, 2); eta[i] *= s; }
      this.t += dt;
    }
  }
  FL.LinSW = LinSW;

  /* ================= Ecuaciones de Euler 1D ================= */
  /* Solución exacta del problema de Riemann (Toro, 2009, cap. 4). W = [ρ, u, p] */
  FL.riemann = function (WL, WR, k = 1.4) {
    const [rL, uL, pL] = WL, [rR, uR, pR] = WR, cL = Math.sqrt((k * pL) / rL), cR = Math.sqrt((k * pR) / rR);
    const fK = (p, r, pk, ck) => {
      if (p > pk) { const A = 2 / ((k + 1) * r), Bk = ((k - 1) / (k + 1)) * pk, s = Math.sqrt(A / (p + Bk)); return [(p - pk) * s, s * (1 - (p - pk) / (2 * (Bk + p)))]; }
      const e = (k - 1) / (2 * k), pr = p / pk; return [((2 * ck) / (k - 1)) * (Math.pow(pr, e) - 1), (1 / (r * ck)) * Math.pow(pr, -(k + 1) / (2 * k))];
    };
    let p = Math.max(1e-8, 0.5 * (pL + pR) - 0.125 * (uR - uL) * (rL + rR) * (cL + cR));
    for (let i = 0; i < 100; i++) {
      const a = fK(p, rL, pL, cL), b = fK(p, rR, pR, cR), F = a[0] + b[0] + uR - uL, dF = a[1] + b[1];
      let pn = p - F / dF; if (pn < 1e-10) pn = 1e-10;
      if (Math.abs(pn - p) < 1e-14 * (pn + p)) { p = pn; break; }
      p = pn;
    }
    const u = 0.5 * (uL + uR) + 0.5 * (fK(p, rR, pR, cR)[0] - fK(p, rL, pL, cL)[0]);
    const gm = (k - 1) / (k + 1);
    const rsL = p > pL ? rL * ((p / pL + gm) / (gm * (p / pL) + 1)) : rL * Math.pow(p / pL, 1 / k);
    const rsR = p > pR ? rR * ((p / pR + gm) / (gm * (p / pR) + 1)) : rR * Math.pow(p / pR, 1 / k);
    /* muestreo en S = x/t */
    const sample = (S) => {
      if (S <= u) {
        if (p > pL) { const SLs = uL - cL * Math.sqrt(((k + 1) / (2 * k)) * (p / pL) + (k - 1) / (2 * k)); return S <= SLs ? [rL, uL, pL] : [rsL, u, p]; }
        const SHL = uL - cL, csL = cL * Math.pow(p / pL, (k - 1) / (2 * k)), STL = u - csL;
        if (S <= SHL) return [rL, uL, pL];
        if (S >= STL) return [rsL, u, p];
        const uu = (2 / (k + 1)) * (cL + ((k - 1) / 2) * uL + S), c = (2 / (k + 1)) * (cL + ((k - 1) / 2) * (uL - S));
        return [rL * Math.pow(c / cL, 2 / (k - 1)), uu, pL * Math.pow(c / cL, (2 * k) / (k - 1))];
      }
      if (p > pR) { const SRs = uR + cR * Math.sqrt(((k + 1) / (2 * k)) * (p / pR) + (k - 1) / (2 * k)); return S >= SRs ? [rR, uR, pR] : [rsR, u, p]; }
      const SHR = uR + cR, csR = cR * Math.pow(p / pR, (k - 1) / (2 * k)), STR = u + csR;
      if (S >= SHR) return [rR, uR, pR];
      if (S <= STR) return [rsR, u, p];
      const uu = (2 / (k + 1)) * (-cR + ((k - 1) / 2) * uR + S), c = (2 / (k + 1)) * (cR - ((k - 1) / 2) * (uR - S));
      return [rR * Math.pow(c / cR, 2 / (k - 1)), uu, pR * Math.pow(c / cR, (2 * k) / (k - 1))];
    };
    return { p, u, rsL, rsR, sample };
  };
  /* Volúmenes finitos: HLLC con reconstrucción MUSCL (minmod) y Runge–Kutta de 2.º orden */
  class Euler1D {
    constructor(nx, L = 1, k = 1.4) { this.nx = nx; this.dx = L / nx; this.k = k; this.U = [new Float64Array(nx), new Float64Array(nx), new Float64Array(nx)]; this.t = 0; this.cfl = 0.5; this.order = 2; }
    setPrim(fn) { const { nx, dx, k, U } = this; for (let i = 0; i < nx; i++) { const [r, u, p] = fn((i + 0.5) * dx); U[0][i] = r; U[1][i] = r * u; U[2][i] = p / (k - 1) + 0.5 * r * u * u; } }
    prim(i, U = this.U) { const r = U[0][i], u = U[1][i] / r, p = (this.k - 1) * (U[2][i] - 0.5 * r * u * u); return [r, u, p]; }
    hllc(WL, WR) {
      const k = this.k, [rL, uL, pL] = WL, [rR, uR, pR] = WR, cL = Math.sqrt((k * pL) / rL), cR = Math.sqrt((k * pR) / rR);
      const EL = pL / (k - 1) + 0.5 * rL * uL * uL, ER = pR / (k - 1) + 0.5 * rR * uR * uR;
      const SL = Math.min(uL - cL, uR - cR), SR = Math.max(uL + cL, uR + cR);
      const Ss = (pR - pL + rL * uL * (SL - uL) - rR * uR * (SR - uR)) / (rL * (SL - uL) - rR * (SR - uR));
      const FLx = [rL * uL, rL * uL * uL + pL, uL * (EL + pL)], FRx = [rR * uR, rR * uR * uR + pR, uR * (ER + pR)];
      if (SL >= 0) return FLx;
      if (SR <= 0) return FRx;
      const star = (r, u, p, E, S) => { const f = (r * (S - u)) / (S - Ss); return [f, f * Ss, f * (E / r + (Ss - u) * (Ss + p / (r * (S - u))))]; };
      if (Ss >= 0) { const Us = star(rL, uL, pL, EL, SL), UL = [rL, rL * uL, EL]; return FLx.map((v, j) => v + SL * (Us[j] - UL[j])); }
      const Us = star(rR, uR, pR, ER, SR), UR = [rR, rR * uR, ER]; return FRx.map((v, j) => v + SR * (Us[j] - UR[j]));
    }
    rhs(U) {
      const { nx, dx } = this, W = [], dW = [];
      for (let i = 0; i < nx; i++) W.push(this.prim(i, U));
      const mm = (a, b) => (a * b <= 0 ? 0 : Math.abs(a) < Math.abs(b) ? a : b);
      for (let i = 0; i < nx; i++) {
        const a = W[Math.max(0, i - 1)], b = W[i], c = W[Math.min(nx - 1, i + 1)];
        dW.push(this.order === 2 ? [mm(b[0] - a[0], c[0] - b[0]), mm(b[1] - a[1], c[1] - b[1]), mm(b[2] - a[2], c[2] - b[2])] : [0, 0, 0]);
      }
      const F = [];
      for (let f = 0; f <= nx; f++) {
        const iL = Math.max(0, f - 1), iR = Math.min(nx - 1, f);
        const WL = W[iL].map((v, j) => v + (f - 1 >= 0 ? 0.5 * dW[iL][j] : 0)), WR = W[iR].map((v, j) => v - (f < nx ? 0.5 * dW[iR][j] : 0));
        F.push(this.hllc(WL, WR));
      }
      const R = [new Float64Array(nx), new Float64Array(nx), new Float64Array(nx)];
      for (let i = 0; i < nx; i++) for (let j = 0; j < 3; j++) R[j][i] = -(F[i + 1][j] - F[i][j]) / dx;
      return R;
    }
    step(dtMax) {
      const { nx, k, U } = this;
      let smax = 1e-12;
      for (let i = 0; i < nx; i++) { const [r, u, p] = this.prim(i); smax = Math.max(smax, Math.abs(u) + Math.sqrt((k * p) / r)); }
      const dt = Math.min(dtMax || Infinity, (this.cfl * this.dx) / smax);
      const R1 = this.rhs(U), U1 = U.map((a, j) => a.map((v, i) => v + dt * R1[j][i]));
      const R2 = this.rhs(U1);
      for (let j = 0; j < 3; j++) for (let i = 0; i < nx; i++) U[j][i] = 0.5 * (U[j][i] + U1[j][i] + dt * R2[j][i]);
      this.t += dt;
      return dt;
    }
  }
  FL.Euler1D = Euler1D;

  /* ================= Difusión 1D (Crank–Nicolson) ================= */
  /* u_t = ν u_yy + S(t) en 0 ≤ y ≤ Y; cartesiano o cilíndrico (r, con simetría en r = 0) */
  class Diffusion1D {
    constructor(n, Y, nu, o = {}) {
      this.n = n; this.Y = Y; this.nu = nu; this.dy = Y / (n - 1); this.u = new Float64Array(n); this.t = 0;
      this.cyl = !!o.cyl; this.bc0 = o.bc0 || ((t) => 0); this.bc1 = o.bc1 || ((t) => 0); this.src = o.src || ((t) => 0);
      this.y = Array.from({ length: n }, (_, i) => i * this.dy);
    }
    step(dt) {
      const { n, dy, nu, u, cyl } = this, r = (nu * dt) / (dy * dy), t1 = this.t + dt;
      const a = new Float64Array(n), b = new Float64Array(n), c = new Float64Array(n), d = new Float64Array(n);
      const S = 0.5 * (this.src(this.t) + this.src(t1)) * dt;
      for (let i = 1; i < n - 1; i++) {
        let am = 1, ap = 1;
        if (cyl) { const ri = i * dy; am = 1 - dy / (2 * ri); ap = 1 + dy / (2 * ri); }
        a[i] = -0.5 * r * am; c[i] = -0.5 * r * ap; b[i] = 1 + r;
        d[i] = u[i] + 0.5 * r * (am * u[i - 1] - 2 * u[i] + ap * u[i + 1]) + S;
      }
      if (cyl) {
        /* r = 0: u_t = 2ν u_rr (simetría) */
        b[0] = 1 + 2 * r; c[0] = -2 * r; d[0] = u[0] + 2 * r * (u[1] - u[0]) + S;
      } else { b[0] = 1; c[0] = 0; d[0] = this.bc0(t1); }
      b[n - 1] = 1; a[n - 1] = 0; d[n - 1] = this.bc1(t1);
      this.u = FL.tridiag(a, b, c, d);
      this.t = t1;
    }
  }
  FL.Diffusion1D = Diffusion1D;

  /* ================= Lubricación: ecuación de Reynolds en diferencias finitas ================= */
  FL.reynoldsFD = function (hfun, L, U, mu, N = 400) {
    const dx = L / N, n = N + 1, a = new Float64Array(n), b = new Float64Array(n), c = new Float64Array(n), d = new Float64Array(n);
    b[0] = 1; b[N] = 1;
    for (let i = 1; i < N; i++) {
      const hm = hfun((i - 0.5) * dx), hp = hfun((i + 0.5) * dx);
      a[i] = (hm * hm * hm) / (dx * dx); c[i] = (hp * hp * hp) / (dx * dx); b[i] = -(a[i] + c[i]);
      d[i] = (6 * mu * U * (hp - hm)) / dx;
    }
    const p = FL.tridiag(a, b, c, d);
    let W = 0; for (let i = 0; i < N; i++) W += 0.5 * dx * (p[i] + p[i + 1]);
    return { p, W, x: Array.from({ length: n }, (_, i) => i * dx) };
  };

  /* ================= Vórtices puntuales ================= */
  /* velocidad inducida; delta = suavizado de Krasny; Lp = periodo en x (calle o lámina periódica) */
  FL.vortexVel = function (X, Y, G, delta = 0, Lp = 0) {
    const n = X.length, U = new Float64Array(n), V = new Float64Array(n), d2 = delta * delta;
    for (let i = 0; i < n; i++) {
      let u = 0, v = 0;
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const dx = X[i] - X[j], dy = Y[i] - Y[j];
        if (Lp > 0) {
          const kx = (2 * Math.PI) / Lp, den = Math.cosh(kx * dy) - Math.cos(kx * dx) + d2 * kx * kx * 0.5;
          u += (-G[j] / (2 * Lp)) * Math.sinh(kx * dy) / den; v += (G[j] / (2 * Lp)) * Math.sin(kx * dx) / den;
        } else { const r2 = dx * dx + dy * dy + d2; u += (-G[j] * dy) / (2 * Math.PI * r2); v += (G[j] * dx) / (2 * Math.PI * r2); }
      }
      U[i] = u; V[i] = v;
    }
    return [U, V];
  };
  FL.vortexStep = function (X, Y, G, dt, delta = 0, Lp = 0) {
    const n = X.length, vel = (x, y) => FL.vortexVel(x, y, G, delta, Lp);
    const [u1, v1] = vel(X, Y);
    const X2 = X.map((x, i) => x + 0.5 * dt * u1[i]), Y2 = Y.map((y, i) => y + 0.5 * dt * v1[i]);
    const [u2, v2] = vel(X2, Y2);
    const X3 = X.map((x, i) => x + 0.5 * dt * u2[i]), Y3 = Y.map((y, i) => y + 0.5 * dt * v2[i]);
    const [u3, v3] = vel(X3, Y3);
    const X4 = X.map((x, i) => x + dt * u3[i]), Y4 = Y.map((y, i) => y + dt * v3[i]);
    const [u4, v4] = vel(X4, Y4);
    for (let i = 0; i < n; i++) { X[i] += (dt / 6) * (u1[i] + 2 * u2[i] + 2 * u3[i] + u4[i]); Y[i] += (dt / 6) * (v1[i] + 2 * v2[i] + 2 * v3[i] + v4[i]); }
  };
  /* Invariantes: hamiltoniano (energía de interacción) e impulso */
  FL.vortexH = function (X, Y, G) { let H = 0; for (let i = 0; i < X.length; i++) for (let j = i + 1; j < X.length; j++) H -= (G[i] * G[j] * Math.log(Math.hypot(X[i] - X[j], Y[i] - Y[j]))) / (2 * Math.PI); return H; };
  FL.vortexImpulse = (X, Y, G) => { let px = 0, py = 0; for (let i = 0; i < X.length; i++) { px += G[i] * X[i]; py += G[i] * Y[i]; } return [px, py]; };
  /* Relación de estabilidad de la calle de Kármán: b/a = arccosh(√2)/π */
  FL.karmanRatio = Math.acosh(Math.SQRT2) / Math.PI;

  /* ================= Canal turbulento con longitud de mezcla (van Driest) ================= */
  FL.mixingChannel = function (Ret, o = {}) {
    const k = o.kappa || 0.4, Ap = o.A || 26, n = o.n || 4000, nik = o.model !== 'vd';
    const yp = [0], up = [0];
    let u = 0, Ub = 0;
    /* malla estirada hacia la pared */
    const Y = (s) => Ret * (1 - Math.cos((Math.PI / 2) * s));
    /* longitud de mezcla: Nikuradse en la región externa (o κy) con amortiguamiento de van Driest */
    const lm = (y) => { const e = 1 - y / Ret, l0 = nik ? Ret * (0.14 - 0.08 * e * e - 0.06 * e * e * e * e) : k * y; return l0 * (1 - Math.exp(-y / Ap)); };
    const du = (y) => { const tau = 1 - y / Ret, l = lm(y); return (2 * tau) / (1 + Math.sqrt(1 + 4 * l * l * tau)); };
    for (let i = 1; i <= n; i++) {
      const y0 = Y((i - 1) / n), y1 = Y(i / n), ym = 0.5 * (y0 + y1);
      const d = (y1 - y0) * (du(y0) + 4 * du(ym) + du(y1)) / 6;
      const u0 = u; u += d;
      Ub += 0.5 * (u0 + u) * (y1 - y0);
      yp.push(y1); up.push(u);
    }
    Ub /= Ret;
    const Reb = 2 * Ub * Ret; /* Re basado en U_b y 2h */
    return { yp, up, Ub, Uc: u, Reb, Cf: 2 / (Ub * Ub), lm };
  };

  /* ================= Redes de tuberías: Hardy Cross ================= */
  /* pipes: [{r, Q}] con h = r Q|Q|^{n−1}; loops: [[índice, signo], ...]; n = 2 (Darcy) o 1.852 (Hazen–Williams) */
  FL.hardyCross = function (pipes, loops, n = 2, iters = 50, hist) {
    const Q = pipes.map((p) => p.Q);
    for (let it = 0; it < iters; it++) {
      let maxc = 0;
      for (const lp of loops) {
        let num = 0, den = 0;
        for (const [i, s] of lp) { const q = s * Q[i]; num += pipes[i].r * q * Math.pow(Math.abs(q), n - 1); den += n * pipes[i].r * Math.pow(Math.abs(q), n - 1); }
        const dQ = -num / den;
        for (const [i, s] of lp) Q[i] += s * dQ;
        maxc = Math.max(maxc, Math.abs(dQ));
      }
      if (hist) hist.push(Q.slice());
      if (maxc < 1e-12) break;
    }
    return Q;
  };

  /* ================= Advección 1D: u_t + c u_x = 0 periódica ================= */
  FL.advectStep = function (u, C, scheme) {
    const n = u.length, out = new Float64Array(n), at = (i) => u[(i + n) % n];
    for (let i = 0; i < n; i++) {
      const um = at(i - 1), u0 = u[i], up = at(i + 1);
      if (scheme === 'upwind') out[i] = C >= 0 ? u0 - C * (u0 - um) : u0 - C * (up - u0);
      else if (scheme === 'central') out[i] = u0 - 0.5 * C * (up - um);
      else if (scheme === 'lf') out[i] = 0.5 * (up + um) - 0.5 * C * (up - um);
      else if (scheme === 'lw') out[i] = u0 - 0.5 * C * (up - um) + 0.5 * C * C * (up - 2 * u0 + um);
      else if (scheme === 'minmod') {
        const umm = at(i - 2), mm = (a, b) => (a * b <= 0 ? 0 : Math.abs(a) < Math.abs(b) ? a : b);
        const sL = mm(um - umm, u0 - um), s0 = mm(u0 - um, up - u0);
        const fR = u0 + 0.5 * (1 - C) * s0, fL = um + 0.5 * (1 - C) * sL;
        out[i] = u0 - C * (fR - fL);
      }
    }
    return out;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = FL;
})();
