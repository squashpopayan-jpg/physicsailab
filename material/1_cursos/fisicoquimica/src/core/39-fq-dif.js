/* ===================================================================
   39-fq-dif.js — Difusión: segunda ley de Fick (Crank–Nicolson), soluciones analíticas, camino aleatorio y movimiento browniano,
   relación de Stokes–Einstein y reacción–difusión estacionaria.
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const FQ = EM.fq || (typeof require !== 'undefined' ? require('./31-fq.js') : null);
  const F = (FQ.dif = {});
  const kB = 1.380649e-23;
  /* erf: serie de Maclaurin para |x| < 3 y fracción continua de Lentz para erfc en la cola */
  const erf = (x) => { const a = Math.abs(x); let r; if (a < 3) { let s = a, t = a; for (let n = 1; n < 80; n++) { t *= (-a * a) / n; const d = t / (2 * n + 1); s += d; if (Math.abs(d) < 1e-17) break; } r = (2 / Math.sqrt(Math.PI)) * s; } else { let f = a; for (let k = 80; k >= 1; k--) f = a + k / 2 / f; r = 1 - Math.exp(-a * a) / (Math.sqrt(Math.PI) * f); } return x < 0 ? -r : r; };
  F.erf = erf; F.erfc = (x) => 1 - erf(x);
  /* Soluciones analíticas en 1D (dominio infinito) */
  F.step = (x, t, D, c0) => (c0 / 2) * (1 - erf(x / (2 * Math.sqrt(D * t)))); /* c(x < 0) = c₀, c(x > 0) = 0 */
  F.pulse = (x, t, D, n0) => (n0 / Math.sqrt(4 * Math.PI * D * t)) * Math.exp((-x * x) / (4 * D * t)); /* n₀ por unidad de área */
  /* lámina finita [0, L] con paredes reflectantes y perfil inicial c₀ en [0, L/2]: serie de cosenos */
  F.slab = (x, t, D, L, c0, nterm) => { let s = c0 / 2; for (let n = 1; n <= (nterm || 200); n++) { const a = (n * Math.PI) / L; s += (2 * c0 / (n * Math.PI)) * Math.sin((n * Math.PI) / 2) * Math.cos(a * x) * Math.exp(-D * a * a * t); } return s; };
  /* Crank–Nicolson para c_t = D c_xx con flujo cero en los extremos; tridiagonal resuelta con el algoritmo de Thomas */
  F.cn = function (c0, D, dx, dt, nsteps) {
    const n = c0.length, r = (D * dt) / (dx * dx); let c = Float64Array.from(c0);
    const a = new Float64Array(n).fill(-r / 2), b = new Float64Array(n).fill(1 + r), cc = new Float64Array(n).fill(-r / 2); b[0] = 1 + r; cc[0] = -r; a[n - 1] = -r; b[n - 1] = 1 + r;
    for (let s = 0; s < nsteps; s++) {
      const d = new Float64Array(n); for (let i = 0; i < n; i++) { const l = i === 0 ? c[1] : c[i - 1], rr = i === n - 1 ? c[n - 2] : c[i + 1]; d[i] = c[i] + (r / 2) * (l - 2 * c[i] + rr); }
      const cp = new Float64Array(n), dp = new Float64Array(n); cp[0] = cc[0] / b[0]; dp[0] = d[0] / b[0]; for (let i = 1; i < n; i++) { const m = b[i] - a[i] * cp[i - 1]; cp[i] = cc[i] / m; dp[i] = (d[i] - a[i] * dp[i - 1]) / m; }
      c[n - 1] = dp[n - 1]; for (let i = n - 2; i >= 0; i--) c[i] = dp[i] - cp[i] * c[i + 1];
    }
    return c;
  };
  /* Stokes–Einstein: D = k_BT/(6πηr); radio hidrodinámico desde D */
  F.DSE = (T, eta, r) => (kB * T) / (6 * Math.PI * eta * r);
  F.rH = (T, eta, D) => (kB * T) / (6 * Math.PI * eta * D);
  /* Camino aleatorio con pasos gaussianos de varianza 2D dt por coordenada, en d dimensiones; devuelve el desplazamiento cuadrático medio para n partículas */
  F.walk = function (d, D, dt, nsteps, npart, seed) {
    let st = seed >>> 0; const rnd = () => ((st = (Math.imul(st, 1664525) + 1013904223) >>> 0) / 4294967296), gauss = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd()), sd = Math.sqrt(2 * D * dt), x = new Float64Array(npart * d), msd = new Float64Array(nsteps + 1);
    for (let s = 1; s <= nsteps; s++) { let sum = 0; for (let i = 0; i < npart; i++) { let r2 = 0; for (let k = 0; k < d; k++) { x[i * d + k] += sd * gauss(); r2 += x[i * d + k] ** 2; } sum += r2; } msd[s] = sum / npart; }
    return msd;
  };
  /* Reacción–difusión estacionaria D c'' − k c = 0 con c(0) = c₀ y c(∞) = 0 (o c'(L) = 0): c = c₀ exp(−x/λ), λ = √(D/k); con pared en L: cosh[(L − x)/λ]/cosh(L/λ) */
  F.rd = (x, D, k, c0, L) => (L ? (c0 * Math.cosh((L - x) / Math.sqrt(D / k))) / Math.cosh(L / Math.sqrt(D / k)) : c0 * Math.exp(-x / Math.sqrt(D / k)));
  /* Resuelve D c'' − k c = 0 con c(0) = c₀, c'(L) = 0 por diferencias finitas (n puntos) */
  F.rdFD = function (D, k, c0, L, n) {
    const h = L / (n - 1), A = Array.from({ length: n }, () => new Array(n).fill(0)), bb = new Array(n).fill(0); A[0][0] = 1; bb[0] = c0;
    for (let i = 1; i < n - 1; i++) { A[i][i - 1] = D / (h * h); A[i][i] = -2 * D / (h * h) - k; A[i][i + 1] = D / (h * h); }
    A[n - 1][n - 1] = -2 * D / (h * h) - k; A[n - 1][n - 2] = 2 * D / (h * h); return FQ.solve(A, bb);
  };

  /* Crank–Nicolson con condiciones de Dirichlet: c(0) = cL, c(L) = cR (membrana); c0 incluye los extremos */
  F.cnD = function (c0, D, dx, dt, nsteps, cL, cR) {
    const n = c0.length, r = (D * dt) / (dx * dx); let c = Float64Array.from(c0); c[0] = cL; c[n - 1] = cR;
    for (let s = 0; s < nsteps; s++) {
      const m = n - 2, d = new Float64Array(m), cp = new Float64Array(m), dp = new Float64Array(m);
      for (let i = 1; i <= m; i++) d[i - 1] = c[i] + (r / 2) * (c[i - 1] - 2 * c[i] + c[i + 1]) + (i === 1 ? (r / 2) * cL : 0) + (i === m ? (r / 2) * cR : 0);
      const A = -r / 2, B = 1 + r; cp[0] = A / B; dp[0] = d[0] / B;
      for (let i = 1; i < m; i++) { const w = B - A * cp[i - 1]; cp[i] = A / w; dp[i] = (d[i] - A * dp[i - 1]) / w; }
      c[m] = dp[m - 1]; for (let i = m - 1; i >= 1; i--) c[i] = dp[i - 1] - cp[i - 1] * c[i + 1];
      c[0] = cL; c[n - 1] = cR;
    }
    return c;
  };
  /* Permeación a través de una membrana de espesor L (Daynes–Barrer): c(0) = c1, c(L) = 0 y membrana inicialmente vacía.
     Cantidad acumulada por unidad de área: Q(t) = L c1 [D t/L² − 1/6 − (2/π²) Σ (−1)ⁿ/n² exp(−D n²π² t/L²)]; tiempo de retardo θ = L²/6D */
  F.Qperm = (t, D, L, c1, nterm) => { let s = 0; for (let n = 1; n <= (nterm || 200); n++) s += (Math.pow(-1, n) / (n * n)) * Math.exp((-D * n * n * Math.PI * Math.PI * t) / (L * L)); return L * c1 * ((D * t) / (L * L) - 1 / 6 - (2 / (Math.PI * Math.PI)) * s); };
  F.flux = (t, D, L, c1, nterm) => { let s = 0; for (let n = 1; n <= (nterm || 200); n++) s += Math.pow(-1, n) * Math.exp((-D * n * n * Math.PI * Math.PI * t) / (L * L)); return (D * c1 / L) * (1 + 2 * s); }; /* flujo en x = L */
  F.lag = (D, L) => (L * L) / (6 * D);
  /* Factor de efectividad de una lámina porosa (módulo de Thiele φ = L√(k/D)): η = tanh φ/φ */
  F.thiele = (L, D, k) => L * Math.sqrt(k / D);
  F.eta = (phi) => (phi < 1e-8 ? 1 : Math.tanh(phi) / phi);
  /* Caja reflectante 1D de ancho L: posiciones iniciales uniformes; MSD → L²/6 */
  F.walkBox = function (D, dt, nsteps, npart, L, seed) {
    let st = seed >>> 0; const rnd = () => ((st = (Math.imul(st, 1664525) + 1013904223) >>> 0) / 4294967296), gauss = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd()), sd = Math.sqrt(2 * D * dt), x0 = new Float64Array(npart), x = new Float64Array(npart), msd = new Float64Array(nsteps + 1);
    for (let i = 0; i < npart; i++) x0[i] = x[i] = rnd() * L;
    const ref = (v) => { v = ((v % (2 * L)) + 2 * L) % (2 * L); return v > L ? 2 * L - v : v; };
    for (let s = 1; s <= nsteps; s++) { let sum = 0; for (let i = 0; i < npart; i++) { x[i] = ref(x[i] + sd * gauss()); sum += (x[i] - x0[i]) ** 2; } msd[s] = sum / npart; }
    return msd;
  };
  /* Viscosidad del agua líquida (Pa·s), forma de Vogel: η = A exp(B/(T − C)); válida 0–100 °C a ~2 % */
  F.etaW = (T) => 0.02939e-3 * Math.exp(507.88 / (T - 149.3));
  /* Conductividades molares iónicas límite a 25 °C (S·cm²/mol, valores de la especie completa) y carga */
  F.ions = { 'H⁺': { z: 1, l: 349.8 }, 'Li⁺': { z: 1, l: 38.69 }, 'Na⁺': { z: 1, l: 50.11 }, 'K⁺': { z: 1, l: 73.5 }, 'Mg²⁺': { z: 2, l: 106.12 }, 'Ca²⁺': { z: 2, l: 119.0 }, 'OH⁻': { z: 1, l: 198.0 }, 'F⁻': { z: 1, l: 55.4 }, 'Cl⁻': { z: 1, l: 76.35 }, 'Br⁻': { z: 1, l: 78.1 }, 'I⁻': { z: 1, l: 76.8 }, 'NO₃⁻': { z: 1, l: 71.46 }, 'SO₄²⁻': { z: 2, l: 160.0 }, 'AcO⁻': { z: 1, l: 40.9 } };
  const Fa = 96485.33212, Rg = 8.314462618;
  F.Dion = (l, z, T) => (Rg * T * l * 1e-4) / (z * z * Fa * Fa); /* Nernst–Einstein: D = RTλ/(z²F²) en m²/s */
  /* Difusión de una sal binaria a dilución infinita (campo eléctrico ambipolar): D = (|z₊|+|z₋|) D₊D₋/(|z₊|D₊ + |z₋|D₋) */
  F.Dsalt = (Dp, zp, Dm, zm) => ((Math.abs(zp) + Math.abs(zm)) * Dp * Dm) / (Math.abs(zp) * Dp + Math.abs(zm) * Dm);
  F.lamIon = (D, z, T) => (D * z * z * Fa * Fa) / (Rg * T) * 1e4;
  /* Tiempo característico de difusión a distancia x en d dimensiones: t = x²/2dD */
  F.tdiff = (x, D, d) => (x * x) / (2 * (d || 1) * D);

  if (typeof module !== 'undefined' && module.exports) module.exports = FQ;
})();
