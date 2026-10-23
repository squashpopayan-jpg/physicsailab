/* ===================================================================
   31-num.js — Métodos numéricos del curso (amplía EM.op)
   Transformada rápida de Fourier 1D y 2D, propagación por espectro
   angular, trazado exacto de rayos por superficies esféricas (3D),
   rayos en medios de índice gradual, difracción de Fresnel con
   simetría circular, relaciones de Kramers–Kronig, MTF por
   autocorrelación, ecuaciones de tasa del láser, modo propio de una
   cavidad y generadores aleatorios reproducibles.
   Todo funciona en Node para las pruebas de tests/validar.js.
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const OP = EM.op || (typeof require !== 'undefined' ? require('./30-optics.js') : null);
  const PI = Math.PI;

  /* ================= FFT ================= */
  /* FFT compleja in situ (radix 2). re, im: Float64Array de longitud potencia de 2. inv: inversa normalizada */
  OP.fft = function (re, im, inv = false) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
    }
    for (let len = 2; len <= n; len <<= 1) {
      const ang = ((inv ? 2 : -2) * PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < len / 2; k++) {
          const a = i + k, b = a + len / 2;
          const xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
          re[b] = re[a] - xr; im[b] = im[a] - xi;
          re[a] += xr; im[a] += xi;
          const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
        }
      }
    }
    if (inv) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
  };
  /* FFT 2D de una matriz N×N almacenada por filas */
  OP.fft2 = function (re, im, N, inv = false) {
    const r = new Float64Array(N), m = new Float64Array(N);
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) { r[x] = re[y * N + x]; m[x] = im[y * N + x]; }
      OP.fft(r, m, inv);
      for (let x = 0; x < N; x++) { re[y * N + x] = r[x]; im[y * N + x] = m[x]; }
    }
    for (let x = 0; x < N; x++) {
      for (let y = 0; y < N; y++) { r[y] = re[y * N + x]; m[y] = im[y * N + x]; }
      OP.fft(r, m, inv);
      for (let y = 0; y < N; y++) { re[y * N + x] = r[y]; im[y * N + x] = m[y]; }
    }
  };
  /* Intercambio de cuadrantes (frecuencia cero al centro) */
  OP.fftshift2 = function (a, N) {
    const h = N >> 1, out = new a.constructor(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) out[((y + h) % N) * N + ((x + h) % N)] = a[y * N + x];
    return out;
  };

  /* ================= Propagación por espectro angular ================= */
  /* Campo 1D (N muestras, paso dx) propagado una distancia z en un medio de índice n: H = exp(i z √(k² − kx²)) */
  OP.angSpec1D = function (re, im, dx, lam, z) {
    const N = re.length, k = (2 * PI) / lam;
    const R = Float64Array.from(re), I = Float64Array.from(im);
    OP.fft(R, I);
    for (let i = 0; i < N; i++) {
      const f = (i < N / 2 ? i : i - N) / (N * dx), kx = 2 * PI * f, s = k * k - kx * kx;
      let hr, hi;
      if (s >= 0) { const ph = z * Math.sqrt(s); hr = Math.cos(ph); hi = Math.sin(ph); }
      else { hr = Math.exp(-z * Math.sqrt(-s)); hi = 0; }
      const a = R[i] * hr - I[i] * hi, b = R[i] * hi + I[i] * hr;
      R[i] = a; I[i] = b;
    }
    OP.fft(R, I, true);
    return [R, I];
  };
  OP.angSpec2D = function (re, im, N, dx, lam, z) {
    const k = (2 * PI) / lam;
    const R = Float64Array.from(re), I = Float64Array.from(im);
    OP.fft2(R, I, N);
    for (let y = 0; y < N; y++) {
      const fy = (y < N / 2 ? y : y - N) / (N * dx);
      for (let x = 0; x < N; x++) {
        const fx = (x < N / 2 ? x : x - N) / (N * dx);
        const s = k * k - 4 * PI * PI * (fx * fx + fy * fy), i = y * N + x;
        let hr, hi;
        if (s >= 0) { const ph = z * Math.sqrt(s); hr = Math.cos(ph); hi = Math.sin(ph); } else { hr = Math.exp(-z * Math.sqrt(-s)); hi = 0; }
        const a = R[i] * hr - I[i] * hi, b = R[i] * hi + I[i] * hr;
        R[i] = a; I[i] = b;
      }
    }
    OP.fft2(R, I, N, true);
    return [R, I];
  };

  /* ================= Difracción de Fresnel con simetría circular ================= */
  /* Campo (normalizado a la onda incidente) a distancia z detrás de una abertura circular de radio a, a la distancia r del eje:
     U(r) = −i (k/z) e^{ikr²/2z} ∫₀ᵃ J₀(krρ/z) e^{ikρ²/2z} ρ dρ   (fase global e^{ikz} omitida) */
  OP.circField = function (r, a, lam, z, n = 600) {
    const k = (2 * PI) / lam;
    let sr = 0, si = 0;
    const h = a / n;
    for (let i = 0; i <= n; i++) {
      const rho = i * h, w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2;
      const j = r === 0 ? 1 : OP.besselJ(0, (k * r * rho) / z), ph = (k * rho * rho) / (2 * z);
      sr += w * j * Math.cos(ph) * rho; si += w * j * Math.sin(ph) * rho;
    }
    sr *= h / 3; si *= h / 3;
    const ph0 = (k * r * r) / (2 * z), cr = Math.cos(ph0), ci = Math.sin(ph0);
    /* −i(k/z)(sr + i si)(cr + i ci) */
    const ar = sr * cr - si * ci, ai = sr * ci + si * cr;
    return [(k / z) * ai, (-k / z) * ar];
  };
  /* Disco opaco (principio de Babinet): U_disco = 1 − U_abertura */
  OP.diskField = function (r, a, lam, z, n) {
    const u = OP.circField(r, a, lam, z, n);
    return [1 - u[0], -u[1]];
  };

  /* ================= Trazado exacto de rayos ================= */
  /* Sistema: lista de superficies {z (vértice), c (curvatura 1/R), n (índice después: número o función de λ nm), ap (semiabertura), mirror}.
     Rayo: {p:[x,y,z], d:[L,M,N] unitario, n}. Devuelve la trayectoria o null si se pierde. */
  const idx = (n, lam) => (typeof n === 'function' ? n(lam) : n);
  OP.traceRay = function (sys, p, d, lam = 587.56, n0 = 1) {
    let P = p.slice(), D = d.slice(), n = idx(n0, lam);
    const path = [P.slice()];
    for (const S of sys) {
      /* coordenadas relativas al vértice */
      const x = P[0], y = P[1], z = P[2] - S.z, L = D[0], M = D[1], N = D[2], c = S.c || 0;
      let t;
      if (c === 0) { if (Math.abs(N) < 1e-15) return { path, lost: true }; t = -z / N; }
      else {
        const F = c * (x * x + y * y + z * z) - 2 * z, G = N - c * (x * L + y * M + z * N), disc = G * G - c * F;
        if (disc < 0) return { path, lost: true };
        t = F / (G + Math.sign(G || 1) * Math.sqrt(disc));
      }
      const X = x + t * L, Y = y + t * M, Z = z + t * N;
      P = [X, Y, Z + S.z];
      path.push(P.slice());
      if (S.ap && Math.hypot(X, Y) > S.ap) return { path, lost: true, vignetted: true };
      if (S.dummy) continue;
      /* normal unitaria orientada hacia +z */
      const nr = [-c * X, -c * Y, 1 - c * Z];
      const cosI = D[0] * nr[0] + D[1] * nr[1] + D[2] * nr[2];
      if (S.mirror) {
        D = [D[0] - 2 * cosI * nr[0], D[1] - 2 * cosI * nr[1], D[2] - 2 * cosI * nr[2]];
        continue;
      }
      const n2 = idx(S.n, lam), s = n2 * n2 - n * n * (1 - cosI * cosI);
      if (s < 0) return { path, lost: true, tir: true };
      const cosT = Math.sign(cosI) * Math.sqrt(s), g = cosT - n * cosI;
      D = [(n * D[0] + g * nr[0]) / n2, (n * D[1] + g * nr[1]) / n2, (n * D[2] + g * nr[2]) / n2];
      n = n2;
    }
    return { path, p: P, d: D, n };
  };
  /* Corte de un rayo con el plano z = zi */
  OP.rayAt = function (r, zi) { const t = (zi - r.p[2]) / r.d[2]; return [r.p[0] + t * r.d[0], r.p[1] + t * r.d[1]]; };
  /* Matriz ABCD paraxial del sistema (del plano z = z0 al plano z = z1) */
  OP.sysMatrix = function (sys, lam = 587.56, n0 = 1, z0, z1) {
    const M = OP.M;
    let n = idx(n0, lam), z = z0 === undefined ? sys[0].z : z0;
    const list = [];
    for (const S of sys) {
      if (S.dummy) continue;
      list.push(M.free(S.z - z));
      if (S.mirror) list.push(M.mirror(S.c ? 1 / S.c : Infinity));
      else {
        const n2 = idx(S.n, lam);
        list.push(S.c ? M.curved(1 / S.c, n, n2) : M.flat(n, n2));
        n = n2;
      }
      z = S.z;
    }
    if (z1 !== undefined) list.push(M.free(z1 - z));
    return M.chain(list);
  };
  /* Foco paraxial imagen (posición z de F') de un sistema para luz que llega paralela */
  OP.paraxialFocus = function (sys, lam) {
    const last = sys[sys.length - 1].z, M = OP.sysMatrix(sys, lam, 1, sys[0].z, last);
    return last - M[0][0] / M[1][0];
  };
  /* Lente simple (singlete) como sistema: radios R1, R2, espesor t, vidrio n (número o función) */
  OP.singlet = (R1, R2, t, n, ap) => [{ z: 0, c: isFinite(R1) ? 1 / R1 : 0, n, ap }, { z: t, c: isFinite(R2) ? 1 / R2 : 0, n: 1, ap }];
  /* Diagrama de manchas: rayos en una pupila circular (anillos), haz a un ángulo de campo w (rad) */
  OP.spot = function (sys, zImg, w, lam, rings = 8, apR) {
    const pts = [];
    const z0 = sys[0].z - 1;
    const R = apR || sys[0].ap * 0.999;
    for (let i = 0; i <= rings; i++) {
      const rr = (R * i) / rings, nk = i === 0 ? 1 : 6 * i;
      for (let k = 0; k < nk; k++) {
        const a = (2 * PI * k) / nk, xs = rr * Math.cos(a), ys = rr * Math.sin(a);
        const d = [0, Math.sin(w), Math.cos(w)];
        const p = [xs, ys - Math.tan(w) * (sys[0].z - z0), z0];
        const r = OP.traceRay(sys, p, d, lam);
        if (!r.lost) pts.push(OP.rayAt(r, zImg));
      }
    }
    return pts;
  };
  OP.rms = function (pts) {
    if (!pts.length) return NaN;
    let mx = 0, my = 0;
    for (const p of pts) { mx += p[0]; my += p[1]; }
    mx /= pts.length; my /= pts.length;
    let s = 0;
    for (const p of pts) s += (p[0] - mx) * (p[0] - mx) + (p[1] - my) * (p[1] - my);
    return Math.sqrt(s / pts.length);
  };

  /* ================= Rayos en un medio de índice gradual n(x, y) ================= */
  /* Ecuación del rayo d/ds(n dr/ds) = ∇n, escrita para r y T = n dr/ds (RK4 en la longitud de arco) */
  OP.gradRay = function (nf, gradf, p0, dir0, ds, steps, stop) {
    let n0 = nf(p0[0], p0[1]);
    let y = [p0[0], p0[1], n0 * dir0[0], n0 * dir0[1]];
    const pts = [[y[0], y[1]]];
    const f = (s, v) => { const n = nf(v[0], v[1]), g = gradf(v[0], v[1]); return [v[2] / n, v[3] / n, g[0], g[1]]; };
    for (let i = 0; i < steps; i++) {
      y = OP.rk4(f, 0, y, ds);
      pts.push([y[0], y[1]]);
      if (stop && stop(y[0], y[1])) break;
    }
    return { pts, T: [y[2], y[3]] };
  };

  /* ================= Kramers–Kronig ================= */
  /* Re χ(ω) = (2/π) P∫₀^∞ ω' Im χ(ω')/(ω'² − ω²) dω'  (muestras uniformes ws, valor principal por sustracción) */
  OP.kkReal = function (ws, imchi, w) {
    const n = ws.length, h = ws[1] - ws[0];
    /* interpola Im χ en w para la sustracción del polo */
    let k = Math.min(n - 2, Math.max(0, Math.floor((w - ws[0]) / h)));
    const f = (w - ws[k]) / h, iw = imchi[k] + f * (imchi[k + 1] - imchi[k]);
    let s = 0;
    for (let i = 0; i < n; i++) {
      const wp = ws[i], wt = i === 0 || i === n - 1 ? 0.5 : 1;
      const den = wp * wp - w * w;
      if (Math.abs(den) < 1e-12 * w * w) {
        /* el integrando es finito en ω' = ω: su límite es (d(ω'Im χ)/dω')/(2ω) */
        if (i > 0 && i < n - 1) s += wt * ((ws[i + 1] * imchi[i + 1] - ws[i - 1] * imchi[i - 1]) / (2 * h) / (2 * w));
        continue;
      }
      s += wt * ((wp * imchi[i] - w * iw) / den);
    }
    s *= h;
    /* término analítico de la sustracción: w·iw·P∫_{a}^{b} dω'/(ω'² − ω²) */
    const a = ws[0], b = ws[n - 1];
    const Pint = (1 / (2 * w)) * Math.log(Math.abs(((b - w) * (a + w)) / ((b + w) * (a - w))));
    return (2 / PI) * (s + w * iw * Pint);
  };

  /* ================= Función de transferencia ================= */
  /* MTF por autocorrelación numérica de una pupila circular (N×N, radio en píxeles) a lo largo del eje x */
  OP.mtfNumeric = function (N, rad, shifts) {
    const pup = new Uint8Array(N * N), c = (N - 1) / 2;
    let area = 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if ((x - c) * (x - c) + (y - c) * (y - c) <= rad * rad) { pup[y * N + x] = 1; area++; }
    return shifts.map((s) => {
      let ov = 0;
      for (let y = 0; y < N; y++) for (let x = 0; x + s < N; x++) if (pup[y * N + x] && pup[y * N + x + s]) ov++;
      return ov / area;
    });
  };
  /* PSF y OTF de una pupila circular con desenfoque W020 (en ondas) por FFT; devuelve la MTF radial */
  OP.mtfDefocus = function (N, radPx, W020) {
    const re = new Float64Array(N * N), im = new Float64Array(N * N), c = N / 2;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const r2 = ((x - c) * (x - c) + (y - c) * (y - c)) / (radPx * radPx);
      if (r2 <= 1) { const ph = 2 * PI * W020 * r2; re[y * N + x] = Math.cos(ph); im[y * N + x] = Math.sin(ph); }
    }
    OP.fft2(re, im, N);
    for (let i = 0; i < N * N; i++) { re[i] = re[i] * re[i] + im[i] * im[i]; im[i] = 0; } /* PSF */
    OP.fft2(re, im, N); /* OTF */
    const m0 = Math.hypot(re[0], im[0]), out = [];
    for (let k = 0; k <= 2 * radPx && k < N / 2; k++) out.push(Math.hypot(re[k], im[k]) / m0);
    return out; /* índice k ↔ frecuencia k/(2·radPx) del corte */
  };

  /* ================= Láser ================= */
  /* Integra las ecuaciones de tasa adimensionales hasta t (en τ₂) con paso h */
  OP.rateRun = function (r, tau, beta, tEnd, h, y0) {
    const f = OP.rateRHS(r, tau, beta);
    let y = y0 ? y0.slice() : [0, 1e-6], t = 0;
    const out = [[0, y[0], y[1]]];
    const n = Math.round(tEnd / h);
    for (let i = 0; i < n; i++) { y = OP.rk4(f, t, y, h); t += h; if (i % Math.max(1, Math.round(n / 4000)) === 0) out.push([t, y[0], y[1]]); }
    return { y, out };
  };
  /* Modo propio de una cavidad: q autoconsistente de la matriz de ida y vuelta (A − D)/2C ± … */
  OP.cavityQ = function (Mrt) {
    const A = Mrt[0][0], B = Mrt[0][1], Cc = Mrt[1][0], D = Mrt[1][1];
    const m = (A + D) / 2;
    if (Math.abs(m) >= 1) return null;
    /* 1/q = (D − A)/(2B) − i √(1 − m²)/|B| */
    const inv = [(D - A) / (2 * B), -Math.sqrt(1 - m * m) / Math.abs(B)];
    void Cc;
    return OP.C.inv(inv);
  };

  /* ================= Aleatorios reproducibles ================= */
  OP.rng = function (seed = 12345) {
    let a = seed >>> 0;
    const u = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    u.normal = () => { let x = 0; while (x === 0) x = u(); return Math.sqrt(-2 * Math.log(x)) * Math.cos(2 * PI * u()); };
    /* muestreo por inversión de una densidad tabulada (cdf creciente) */
    u.pick = (cdf) => { const v = u() * cdf[cdf.length - 1]; let lo = 0, hi = cdf.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cdf[m] < v) lo = m + 1; else hi = m; } return lo; };
    u.poisson = (m) => { if (m > 60) return Math.max(0, Math.round(m + Math.sqrt(m) * u.normal())); const L = Math.exp(-m); let k = 0, p = 1; do { k++; p *= u(); } while (p > L); return k - 1; };
    u.geometric = (m) => { const p = 1 / (1 + m); return Math.floor(Math.log(1 - u()) / Math.log(1 - p)); };
    return u;
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = OP;
})();
