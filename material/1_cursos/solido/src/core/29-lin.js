/* ===================================================================
   29-lin.js — Álgebra lineal y análisis numérico del curso (EM.lin)
   Autovalores de matrices simétricas reales (Householder + QL, como
   JAMA/EISPACK tred2–tql2) y hermíticas (inmersión real 2n × 2n),
   cuadraturas de Gauss–Legendre y adaptativa, raíces de Brent,
   sistemas tridiagonales, generador aleatorio reproducible y
   funciones especiales (zeta, integrales elípticas, gamma).
   Funciona en Node para las pruebas de tests/validar.js.
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const L = (EM.lin = {});

  /* ---------- Autovalores de una matriz simétrica real ----------
     A: arreglo plano n×n (fila mayor) o arreglo de filas. Devuelve {val, vec}
     con val ascendentes y vec[k] = autovector k (si wantVec). */
  L.symEig = function (A, n, wantVec = false) {
    const V = new Array(n);
    for (let i = 0; i < n; i++) {
      V[i] = new Float64Array(n);
      for (let j = 0; j < n; j++) V[i][j] = Array.isArray(A[0]) || ArrayBuffer.isView(A[0]) ? A[i][j] : A[i * n + j];
    }
    const d = new Float64Array(n), e = new Float64Array(n);
    /* tred2: reducción de Householder a forma tridiagonal */
    for (let j = 0; j < n; j++) d[j] = V[n - 1][j];
    for (let i = n - 1; i > 0; i--) {
      let scale = 0, h = 0;
      for (let k = 0; k < i; k++) scale += Math.abs(d[k]);
      if (scale === 0) {
        e[i] = d[i - 1];
        for (let j = 0; j < i; j++) { d[j] = V[i - 1][j]; V[i][j] = 0; V[j][i] = 0; }
      } else {
        for (let k = 0; k < i; k++) { d[k] /= scale; h += d[k] * d[k]; }
        let f = d[i - 1], g = Math.sqrt(h);
        if (f > 0) g = -g;
        e[i] = scale * g;
        h -= f * g;
        d[i - 1] = f - g;
        for (let j = 0; j < i; j++) e[j] = 0;
        for (let j = 0; j < i; j++) {
          f = d[j];
          V[j][i] = f;
          g = e[j] + V[j][j] * f;
          for (let k = j + 1; k <= i - 1; k++) { g += V[k][j] * d[k]; e[k] += V[k][j] * f; }
          e[j] = g;
        }
        f = 0;
        for (let j = 0; j < i; j++) { e[j] /= h; f += e[j] * d[j]; }
        const hh = f / (h + h);
        for (let j = 0; j < i; j++) e[j] -= hh * d[j];
        for (let j = 0; j < i; j++) {
          f = d[j]; g = e[j];
          for (let k = j; k <= i - 1; k++) V[k][j] -= f * e[k] + g * d[k];
          d[j] = V[i - 1][j];
          V[i][j] = 0;
        }
      }
      d[i] = h;
    }
    for (let i = 0; i < n - 1; i++) {
      V[n - 1][i] = V[i][i];
      V[i][i] = 1;
      const h = d[i + 1];
      if (h !== 0) {
        for (let k = 0; k <= i; k++) d[k] = V[k][i + 1] / h;
        for (let j = 0; j <= i; j++) {
          let g = 0;
          for (let k = 0; k <= i; k++) g += V[k][i + 1] * V[k][j];
          for (let k = 0; k <= i; k++) V[k][j] -= g * d[k];
        }
      }
      for (let k = 0; k <= i; k++) V[k][i + 1] = 0;
    }
    for (let j = 0; j < n; j++) { d[j] = V[n - 1][j]; V[n - 1][j] = 0; }
    V[n - 1][n - 1] = 1;
    e[0] = 0;
    /* tql2: QL implícito con desplazamientos */
    for (let i = 1; i < n; i++) e[i - 1] = e[i];
    e[n - 1] = 0;
    let f = 0, tst1 = 0;
    const eps = Math.pow(2, -52);
    for (let l = 0; l < n; l++) {
      tst1 = Math.max(tst1, Math.abs(d[l]) + Math.abs(e[l]));
      let m = l;
      while (m < n) { if (Math.abs(e[m]) <= eps * tst1) break; m++; }
      if (m > l) {
        let iter = 0;
        do {
          iter++;
          let g = d[l];
          let p = (d[l + 1] - g) / (2 * e[l]);
          let r = Math.hypot(p, 1);
          if (p < 0) r = -r;
          d[l] = e[l] / (p + r);
          d[l + 1] = e[l] * (p + r);
          const dl1 = d[l + 1];
          let h = g - d[l];
          for (let i = l + 2; i < n; i++) d[i] -= h;
          f += h;
          p = d[m];
          let c = 1, c2 = c, c3 = c, el1 = e[l + 1], s = 0, s2 = 0;
          for (let i = m - 1; i >= l; i--) {
            c3 = c2; c2 = c; s2 = s;
            g = c * e[i];
            h = c * p;
            r = Math.hypot(p, e[i]);
            e[i + 1] = s * r;
            s = e[i] / r;
            c = p / r;
            p = c * d[i] - s * g;
            d[i + 1] = h + s * (c * g + s * d[i]);
            if (wantVec) for (let k = 0; k < n; k++) {
              h = V[k][i + 1];
              V[k][i + 1] = s * V[k][i] + c * h;
              V[k][i] = c * V[k][i] - s * h;
            }
          }
          p = (-s * s2 * c3 * el1 * e[l]) / dl1;
          e[l] = s * p;
          d[l] = c * p;
        } while (Math.abs(e[l]) > eps * tst1 && iter < 60);
      }
      d[l] = d[l] + f;
      e[l] = 0;
    }
    /* Orden ascendente */
    const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => d[a] - d[b]);
    const val = idx.map((i) => d[i]);
    if (!wantVec) return { val };
    const vec = idx.map((j) => { const v = new Float64Array(n); for (let k = 0; k < n; k++) v[k] = V[k][j]; return v; });
    return { val, vec };
  };

  /* Autovalores de una matriz hermítica H = Re + i·Im (arreglos planos n×n).
     La matriz real [[Re, −Im], [Im, Re]] tiene cada autovalor duplicado. */
  L.hermEig = function (Re, Im, n, wantVec = false) {
    const m = 2 * n, B = new Float64Array(m * m);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const a = Re[i * n + j], b = Im[i * n + j];
      B[i * m + j] = a; B[(i + n) * m + j + n] = a;
      B[i * m + j + n] = -b; B[(i + n) * m + j] = b;
    }
    const r = L.symEig(B, m, wantVec);
    const val = [];
    for (let k = 0; k < m; k += 2) val.push(0.5 * (r.val[k] + r.val[k + 1]));
    if (!wantVec) return { val };
    /* Autovector complejo: u = x + i y con el vector real [x; y] */
    const vec = [];
    for (let k = 0; k < m; k += 2) {
      const v = r.vec[k];
      vec.push({ re: Float64Array.from(v.slice(0, n)), im: Float64Array.from(v.slice(n)) });
    }
    return { val, vec };
  };

  /* Autovalores de una matriz tridiagonal simétrica (diagonal a, subdiagonal b) */
  L.triEig = function (a, b) {
    const n = a.length, A = new Float64Array(n * n);
    for (let i = 0; i < n; i++) { A[i * n + i] = a[i]; if (i < n - 1) { A[i * n + i + 1] = b[i]; A[(i + 1) * n + i] = b[i]; } }
    return L.symEig(A, n).val;
  };
  /* Número de autovalores de la tridiagonal (a, b) menores que x (secuencia de Sturm) */
  L.sturmCount = function (a, b, x) {
    let q = a[0] - x, c = q < 0 ? 1 : 0;
    for (let i = 1; i < a.length; i++) {
      q = a[i] - x - (b[i - 1] * b[i - 1]) / (q === 0 ? 1e-300 : q);
      if (q < 0) c++;
    }
    return c;
  };

  /* Resolución de un sistema tridiagonal (Thomas): sub l, diag d, sobre u, lado derecho r */
  L.thomas = function (l, d, u, r) {
    const n = d.length, c = new Float64Array(n), x = new Float64Array(n);
    let den = d[0];
    c[0] = u[0] / den; x[0] = r[0] / den;
    for (let i = 1; i < n; i++) {
      den = d[i] - l[i] * c[i - 1];
      c[i] = i < n - 1 ? u[i] / den : 0;
      x[i] = (r[i] - l[i] * x[i - 1]) / den;
    }
    for (let i = n - 2; i >= 0; i--) x[i] -= c[i] * x[i + 1];
    return x;
  };

  /* Resolución de A x = b por eliminación gaussiana con pivoteo parcial (A n×n en filas) */
  L.solve = function (A, b) {
    const n = b.length, M = A.map((r) => Array.from(r)), x = Array.from(b);
    for (let k = 0; k < n; k++) {
      let p = k;
      for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
      [M[k], M[p]] = [M[p], M[k]]; [x[k], x[p]] = [x[p], x[k]];
      for (let i = k + 1; i < n; i++) {
        const f = M[i][k] / M[k][k];
        for (let j = k; j < n; j++) M[i][j] -= f * M[k][j];
        x[i] -= f * x[k];
      }
    }
    for (let i = n - 1; i >= 0; i--) {
      let s = x[i];
      for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j];
      x[i] = s / M[i][i];
    }
    return x;
  };
  L.det3 = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);

  /* ---------- Cuadraturas ---------- */
  const glCache = new Map();
  L.glNodes = function (n) {
    if (glCache.has(n)) return glCache.get(n);
    const x = new Float64Array(n), w = new Float64Array(n);
    for (let i = 0; i < Math.ceil(n / 2); i++) {
      let z = Math.cos((Math.PI * (i + 0.75)) / (n + 0.5)), pp = 0;
      for (let it = 0; it < 100; it++) {
        let p1 = 1, p2 = 0;
        for (let j = 1; j <= n; j++) { const p3 = p2; p2 = p1; p1 = ((2 * j - 1) * z * p2 - (j - 1) * p3) / j; }
        pp = (n * (z * p1 - p2)) / (z * z - 1);
        const z1 = z;
        z = z1 - p1 / pp;
        if (Math.abs(z - z1) < 1e-15) break;
      }
      x[i] = -z; x[n - 1 - i] = z;
      w[i] = w[n - 1 - i] = 2 / ((1 - z * z) * pp * pp);
    }
    const r = { x, w };
    glCache.set(n, r);
    return r;
  };
  /* Gauss–Legendre de n puntos en [a, b], repetida en m subintervalos */
  L.gl = function (f, a, b, n = 48, m = 1) {
    const { x, w } = L.glNodes(n);
    const H = (b - a) / m;
    let tot = 0;
    for (let k = 0; k < m; k++) {
      const a0 = a + k * H, h = H / 2, c = a0 + h;
      let sk = 0;
      for (let i = 0; i < n; i++) sk += w[i] * f(c + h * x[i]);
      tot += sk * h;
    }
    return tot;
  };
  /* Simpson adaptativa con tolerancia absoluta */
  L.quad = function (f, a, b, tol = 1e-10, depth = 40) {
    const simp = (a, b, fa, fm, fb) => ((b - a) / 6) * (fa + 4 * fm + fb);
    const rec = (a, b, fa, fm, fb, whole, tol, d) => {
      const m = 0.5 * (a + b), lm = 0.5 * (a + m), rm = 0.5 * (m + b);
      const flm = f(lm), frm = f(rm);
      const left = simp(a, m, fa, flm, fm), right = simp(m, b, fm, frm, fb);
      if (d <= 0 || Math.abs(left + right - whole) <= 15 * tol) return left + right + (left + right - whole) / 15;
      return rec(a, m, fa, flm, fm, left, tol / 2, d - 1) + rec(m, b, fm, frm, fb, right, tol / 2, d - 1);
    };
    const fa = f(a), fb = f(b), fm = f(0.5 * (a + b));
    return rec(a, b, fa, fm, fb, simp(a, b, fa, fm, fb), tol, depth);
  };
  /* Integral de 0 a ∞ por cambio x = t/(1−t) con Gauss–Legendre en tramos */
  L.quadInf = function (f, a = 0, n = 64, m = 16) {
    return L.gl((t) => { const u = t / (1 - t); return f(a + u) / ((1 - t) * (1 - t)); }, 0, 1 - 1e-12, n, m);
  };

  /* ---------- Raíces ---------- */
  L.brent = function (f, a, b, tol = 1e-14, maxIt = 200) {
    let fa = f(a), fb = f(b);
    if (fa === 0) return a;
    if (fb === 0) return b;
    if (fa * fb > 0) return NaN;
    let c = a, fc = fa, d = b - a, e = d;
    for (let it = 0; it < maxIt; it++) {
      if (fb * fc > 0) { c = a; fc = fa; d = e = b - a; }
      if (Math.abs(fc) < Math.abs(fb)) { a = b; b = c; c = a; fa = fb; fb = fc; fc = fa; }
      const tol1 = 2 * 2.2e-16 * Math.abs(b) + 0.5 * tol, xm = 0.5 * (c - b);
      if (Math.abs(xm) <= tol1 || fb === 0) return b;
      if (Math.abs(e) >= tol1 && Math.abs(fa) > Math.abs(fb)) {
        let s = fb / fa, p, q;
        if (a === c) { p = 2 * xm * s; q = 1 - s; }
        else {
          const qq = fa / fc, r = fb / fc;
          p = s * (2 * xm * qq * (qq - r) - (b - a) * (r - 1));
          q = (qq - 1) * (r - 1) * (s - 1);
        }
        if (p > 0) q = -q; else p = -p;
        if (2 * p < Math.min(3 * xm * q - Math.abs(tol1 * q), Math.abs(e * q))) { e = d; d = p / q; }
        else { d = xm; e = d; }
      } else { d = xm; e = d; }
      a = b; fa = fb;
      b += Math.abs(d) > tol1 ? d : xm > 0 ? tol1 : -tol1;
      fb = f(b);
    }
    return b;
  };
  /* Todas las raíces de f en [a, b] por barrido en n tramos + Brent */
  L.roots = function (f, a, b, n = 400) {
    const out = [];
    let x0 = a, f0 = f(a);
    for (let i = 1; i <= n; i++) {
      const x1 = a + ((b - a) * i) / n, f1 = f(x1);
      if (f0 === 0) out.push(x0);
      else if (f0 * f1 < 0) { const r = L.brent(f, x0, x1); if (isFinite(r)) out.push(r); }
      x0 = x1; f0 = f1;
    }
    return out;
  };
  /* Mínimo de una función unimodal por sección áurea */
  L.golden = function (f, a, b, tol = 1e-12) {
    const g = (Math.sqrt(5) - 1) / 2;
    let c = b - g * (b - a), d = a + g * (b - a), fc = f(c), fd = f(d);
    for (let i = 0; i < 300 && Math.abs(b - a) > tol * (1 + Math.abs(c)); i++) {
      if (fc < fd) { b = d; d = c; fd = fc; c = b - g * (b - a); fc = f(c); }
      else { a = c; c = d; fc = fd; d = a + g * (b - a); fd = f(d); }
    }
    return 0.5 * (a + b);
  };

  /* ---------- Aleatorios reproducibles (mulberry32) ---------- */
  L.rng = function (seed = 1) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  L.gauss = function (rng) {
    let u = 0, v = 0;
    while (u === 0) u = rng();
    v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  /* ---------- Funciones especiales ---------- */
  /* Gamma (Lanczos, g = 7) */
  const LG = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  L.gamma = function (z) {
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * L.gamma(1 - z));
    z -= 1;
    let x = LG[0];
    for (let i = 1; i < 9; i++) x += LG[i] / (z + i);
    const t = z + 7.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
  };
  /* Zeta de Riemann para s > 1 (Euler–Maclaurin) */
  L.zeta = function (s) {
    const N = 20;
    let sum = 0;
    for (let k = 1; k < N; k++) sum += Math.pow(k, -s);
    sum += Math.pow(N, 1 - s) / (s - 1) + 0.5 * Math.pow(N, -s);
    /* términos de Bernoulli B2, B4, B6, B8 */
    const B = [1 / 6, -1 / 30, 1 / 42, -1 / 30];
    let fact = 1, prod = s;
    for (let j = 1; j <= 4; j++) {
      fact *= (2 * j - 1) * (2 * j);
      sum += (B[j - 1] / fact) * prod * Math.pow(N, -s - 2 * j + 1);
      prod *= (s + 2 * j - 1) * (s + 2 * j);
    }
    return sum;
  };
  /* Integrales elípticas completas K(m), E(m) con parámetro m = k² (media aritmético-geométrica) */
  L.ellipK = function (m) {
    if (m >= 1) return Infinity;
    let a = 1, b = Math.sqrt(1 - m);
    for (let i = 0; i < 40 && Math.abs(a - b) > 1e-16 * a; i++) { const t = 0.5 * (a + b); b = Math.sqrt(a * b); a = t; }
    return Math.PI / (2 * a);
  };
  L.ellipE = function (m) {
    if (m >= 1) return 1;
    let a = 1, b = Math.sqrt(1 - m), c = Math.sqrt(m), sum = 0.5 * m, pow = 0.5;
    for (let i = 0; i < 40 && Math.abs(c) > 1e-16; i++) {
      const an = 0.5 * (a + b), bn = Math.sqrt(a * b);
      c = 0.5 * (a - b); pow *= 2; sum += pow * c * c; a = an; b = bn;
    }
    return (Math.PI / (2 * a)) * (1 - sum);
  };
  /* Función error (Abramowitz–Stegun 7.1.26 mejorada por serie/fracción continua) */
  L.erf = function (x) {
    const s = x < 0 ? -1 : 1;
    x = Math.abs(x);
    if (x < 2.5) {
      let sum = x, term = x, k = 0;
      while (Math.abs(term) > 1e-17 * Math.abs(sum) && k < 200) { k++; term *= (-x * x) / k; sum += term / (2 * k + 1); }
      return (s * 2 * sum) / Math.sqrt(Math.PI);
    }
    return s * (1 - L.erfc(x));
  };
  L.erfc = function (x) {
    if (x < 2.5) return 1 - L.erf(x);
    /* fracción continua evaluada desde el fondo */
    let f = x;
    for (let n = 80; n >= 1; n--) f = x + n / 2 / f;
    return Math.exp(-x * x) / (f * Math.sqrt(Math.PI));
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = L;
})();
