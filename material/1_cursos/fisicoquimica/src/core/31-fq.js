/* ===================================================================
   31-fq.js — Biblioteca científica de Fisicoquímica (EM.fq), parte 1
   Álgebra lineal, integradores de EDO, termodinámica de gases (NASA-7 de
   GRI-Mech 3.0 vía Cantera) y equilibrio por minimización de la energía de Gibbs.
   Funciones puras sin DOM: se validan en Node con tests/validar.js.
   Unidades SI salvo aviso: T en K, P en Pa, energías molares en J/mol.
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const DAT = EM.dat || (typeof require !== 'undefined' ? require('./29-datos.js') : null);
  const FQ = (EM.fq = EM.fq || {});
  const R = 8.314462618, kB = 1.380649e-23, NA = 6.02214076e23, h = 6.62607015e-34, c0 = 299792458;
  const F = 96485.33212, e = 1.602176634e-19, me = 9.1093837015e-31, eps0 = 8.8541878128e-12, amu = 1.66053906660e-27;
  Object.assign(FQ, { R, kB, NA, hPlanck: h, hbar: h / (2 * Math.PI), c0, F, e, me, eps0, amu, P0: 1e5, Patm: 101325, T0: 298.15 });

  /* ------------------ Álgebra lineal ------------------ */
  /* Resuelve A x = b (A: arreglo de filas) por eliminación gaussiana con pivoteo parcial */
  FQ.solve = function (A, b) {
    const n = b.length, M = A.map((r, i) => r.slice().concat([b[i]]));
    for (let i = 0; i < n; i++) {
      let p = i;
      for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[p][i])) p = r;
      if (Math.abs(M[p][i]) < 1e-300) return null;
      if (p !== i) { const t = M[i]; M[i] = M[p]; M[p] = t; }
      for (let r = i + 1; r < n; r++) {
        const f = M[r][i] / M[i][i];
        if (f !== 0) for (let c = i; c <= n; c++) M[r][c] -= f * M[i][c];
      }
    }
    const x = new Array(n);
    for (let i = n - 1; i >= 0; i--) {
      let s = M[i][n];
      for (let c = i + 1; c < n; c++) s -= M[i][c] * x[c];
      x[i] = s / M[i][i];
    }
    return x;
  };
  /* Autovalores y autovectores de una matriz simétrica (Jacobi cíclico). Devuelve {val, vec} con vec[k] = k-ésimo autovector, ordenados por valor creciente */
  FQ.eigSym = function (S) {
    const n = S.length, A = S.map((r) => r.slice()), V = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
    for (let sweep = 0; sweep < 100; sweep++) {
      let off = 0;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] * A[i][j];
      if (off < 1e-26) break;
      for (let p = 0; p < n - 1; p++) for (let q = p + 1; q < n; q++) {
        if (Math.abs(A[p][q]) < 1e-300) continue;
        const th = (A[q][q] - A[p][p]) / (2 * A[p][q]);
        const t = Math.sign(th || 1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
        for (let k = 0; k < n; k++) { const akp = A[k][p], akq = A[k][q]; A[k][p] = c * akp - s * akq; A[k][q] = s * akp + c * akq; }
        for (let k = 0; k < n; k++) { const apk = A[p][k], aqk = A[q][k]; A[p][k] = c * apk - s * aqk; A[q][k] = s * apk + c * aqk; }
        for (let k = 0; k < n; k++) { const vkp = V[k][p], vkq = V[k][q]; V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq; }
      }
    }
    const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => A[a][a] - A[b][b]);
    return { val: idx.map((i) => A[i][i]), vec: idx.map((i) => V.map((r) => r[i])) };
  };
  FQ.bisect = function (f, a, b, tol = 1e-12, it = 300) {
    let fa = f(a), fb = f(b);
    if (fa === 0) return a; if (fb === 0) return b;
    if (fa * fb > 0) return NaN;
    for (let i = 0; i < it; i++) {
      const m = 0.5 * (a + b), fm = f(m);
      if (fm === 0 || Math.abs(b - a) < tol * Math.max(1, Math.abs(m))) return m;
      if (fa * fm < 0) { b = m; fb = fm; } else { a = m; fa = fm; }
    }
    return 0.5 * (a + b);
  };
  /* Búsqueda de mínimo de f en [a,b] (sección áurea) */
  FQ.minimize = function (f, a, b, tol = 1e-10) {
    const g = (Math.sqrt(5) - 1) / 2;
    let c = b - g * (b - a), d = a + g * (b - a), fc = f(c), fd = f(d);
    while (Math.abs(b - a) > tol * (1 + Math.abs(a) + Math.abs(b))) {
      if (fc < fd) { b = d; d = c; fd = fc; c = b - g * (b - a); fc = f(c); } else { a = c; c = d; fc = fd; d = a + g * (b - a); fd = f(d); }
    }
    return 0.5 * (a + b);
  };
  /* Integral de Simpson */
  FQ.simpson = function (f, a, b, n = 400) {
    if (n % 2) n++;
    const hh = (b - a) / n; let s = f(a) + f(b);
    for (let i = 1; i < n; i++) s += f(a + i * hh) * (i % 2 ? 4 : 2);
    return (s * hh) / 3;
  };
  /* Mínimos cuadrados lineales y = a + b x. Devuelve {a, b, r2, sa, sb} */
  FQ.linfit = function (x, y) {
    const n = x.length, mx = x.reduce((s, v) => s + v, 0) / n, my = y.reduce((s, v) => s + v, 0) / n;
    let sxx = 0, sxy = 0, syy = 0;
    for (let i = 0; i < n; i++) { sxx += (x[i] - mx) ** 2; sxy += (x[i] - mx) * (y[i] - my); syy += (y[i] - my) ** 2; }
    const b = sxy / sxx, a = my - b * mx;
    let rss = 0; for (let i = 0; i < n; i++) rss += (y[i] - a - b * x[i]) ** 2;
    const s2 = n > 2 ? rss / (n - 2) : 0;
    return { a, b, r2: syy > 0 ? 1 - rss / syy : 1, sb: Math.sqrt(s2 / sxx), sa: Math.sqrt(s2 * (1 / n + (mx * mx) / sxx)) };
  };
  /* Ajuste polinómico por mínimos cuadrados. Devuelve los coeficientes c[0..deg] de y = Σ c_k x^k */
  FQ.polyfit = function (x, y, deg) {
    const m = deg + 1, A = Array.from({ length: m }, () => new Array(m).fill(0)), b = new Array(m).fill(0);
    for (let i = 0; i < x.length; i++) {
      const p = [1]; for (let k = 1; k < 2 * m; k++) p.push(p[k - 1] * x[i]);
      for (let r = 0; r < m; r++) { b[r] += y[i] * p[r]; for (let c = 0; c < m; c++) A[r][c] += p[r + c]; }
    }
    return FQ.solve(A, b);
  };
  FQ.polyval = (c, x) => { let s = 0; for (let k = c.length - 1; k >= 0; k--) s = s * x + c[k]; return s; };
  FQ.polyder = (c) => c.slice(1).map((v, k) => v * (k + 1));
  /* Gaussiana estándar (Box–Muller) */
  FQ.gauss = function () { let u = 0, v = 0; while (u === 0) u = Math.random(); while (v === 0) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  FQ.erf = function (x) {
    const s = x < 0 ? -1 : 1; x = Math.abs(x);
    if (x < 2.5) { let sum = x, term = x; for (let n = 1; n < 60; n++) { term *= (-x * x) / n; sum += term / (2 * n + 1); } return (s * 2 * sum) / Math.sqrt(Math.PI); }
    const t = 1 / (1 + 0.5 * x);
    const y = 1 - t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return s * y;
  };
  FQ.erfc = (x) => 1 - FQ.erf(x);

  /* ------------------ Integradores de EDO ------------------ */
  /* Dormand–Prince 5(4) adaptativo. f(t, y) → dy/dt (arreglo). Devuelve {t:[], y:[[]]} en los instantes pedidos (ts) */
  FQ.ode = function (f, y0, ts, o = {}) {
    const rtol = o.rtol || 1e-8, atol = o.atol || 1e-10, n = y0.length;
    const c = [0, 1 / 5, 3 / 10, 4 / 5, 8 / 9, 1, 1];
    const a = [[], [1 / 5], [3 / 40, 9 / 40], [44 / 45, -56 / 15, 32 / 9], [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729], [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656], [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84]];
    const b5 = [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84, 0], b4 = [5179 / 57600, 0, 7571 / 16695, 393 / 640, -92097 / 339200, 187 / 2100, 1 / 40];
    let t = ts[0], y = y0.slice(), hh = o.h0 || (ts[ts.length - 1] - ts[0]) / 1000;
    const out = [y.slice()];
    for (let k = 1; k < ts.length; k++) {
      const tEnd = ts[k];
      let guard = 0;
      while (t < tEnd - 1e-15 * Math.abs(tEnd)) {
        if (++guard > 2e6) throw new Error('ode: demasiados pasos');
        if (t + hh > tEnd) hh = tEnd - t;
        const K = [];
        for (let s = 0; s < 7; s++) {
          const yy = y.slice();
          for (let j = 0; j < s; j++) { const aj = a[s][j]; if (aj) for (let i = 0; i < n; i++) yy[i] += hh * aj * K[j][i]; }
          K.push(f(t + c[s] * hh, yy));
        }
        let err = 0; const yn = y.slice();
        for (let i = 0; i < n; i++) {
          let d5 = 0, d4 = 0;
          for (let s = 0; s < 7; s++) { d5 += b5[s] * K[s][i]; d4 += b4[s] * K[s][i]; }
          yn[i] = y[i] + hh * d5;
          const sc = atol + rtol * Math.max(Math.abs(y[i]), Math.abs(yn[i]));
          err = Math.max(err, Math.abs(hh * (d5 - d4)) / sc);
        }
        if (err <= 1) { t += hh; y = yn; }
        hh *= Math.min(5, Math.max(0.2, 0.9 * Math.pow(err || 1e-10, -0.2)));
        if (o.hmax && hh > o.hmax) hh = o.hmax;
      }
      out.push(y.slice());
    }
    return { t: ts.slice(), y: out };
  };
  /* Método de Rosenbrock 2(3) (ode23s de Shampine y Reichelt) para sistemas rígidos. Jacobiano por diferencias finitas */
  FQ.odeStiff = function (f, y0, ts, o = {}) {
    const rtol = o.rtol || 1e-6, atol = o.atol || 1e-10, n = y0.length;
    const d = 1 / (2 + Math.SQRT2), e32 = 6 + Math.SQRT2;
    const jac = (t, y, f0) => {
      const J = Array.from({ length: n }, () => new Array(n).fill(0));
      for (let j = 0; j < n; j++) {
        const dy = 1e-7 * Math.max(Math.abs(y[j]), 1e-6), yp = y.slice(); yp[j] += dy;
        const fp = f(t, yp);
        for (let i = 0; i < n; i++) J[i][j] = (fp[i] - f0[i]) / dy;
      }
      return J;
    };
    let t = ts[0], y = y0.slice(), hh = o.h0 || (ts[ts.length - 1] - ts[0]) * 1e-6;
    const out = [y.slice()];
    for (let k = 1; k < ts.length; k++) {
      const tEnd = ts[k]; let guard = 0;
      while (t < tEnd - 1e-15 * Math.abs(tEnd)) {
        if (++guard > 5e5) throw new Error('odeStiff: demasiados pasos');
        if (t + hh > tEnd) hh = tEnd - t;
        const f0 = f(t, y), J = jac(t, y, f0);
        const W = J.map((r, i) => r.map((v, j) => (i === j ? 1 : 0) - hh * d * v));
        const solveW = (rhs) => FQ.solve(W, rhs);
        const k1 = solveW(f0);
        if (!k1) { hh *= 0.5; continue; }
        const y1 = y.map((v, i) => v + 0.5 * hh * k1[i]), f1 = f(t + 0.5 * hh, y1);
        const k2s = solveW(f1.map((v, i) => v - k1[i])), k2 = k2s.map((v, i) => v + k1[i]);
        const yn = y.map((v, i) => v + hh * k2[i]), f2 = f(t + hh, yn);
        const k3 = solveW(f2.map((v, i) => v - e32 * (k2[i] - f1[i]) - 2 * (k1[i] - f0[i])));
        let err = 0;
        for (let i = 0; i < n; i++) err = Math.max(err, Math.abs((hh / 6) * (k1[i] - 2 * k2[i] + k3[i])) / (atol + rtol * Math.max(Math.abs(y[i]), Math.abs(yn[i]))));
        if (err <= 1 || hh < 1e-14) { t += hh; y = yn; }
        hh *= Math.min(5, Math.max(0.2, 0.9 * Math.pow(err || 1e-10, -1 / 3)));
      }
      out.push(y.slice());
    }
    return { t: ts.slice(), y: out };
  };
  /* RK4 de paso fijo, un paso. f(t, y) */
  FQ.rk4 = function (f, t, y, dt) {
    const add = (a, b, s) => a.map((v, i) => v + s * b[i]);
    const k1 = f(t, y), k2 = f(t + dt / 2, add(y, k1, dt / 2)), k3 = f(t + dt / 2, add(y, k2, dt / 2)), k4 = f(t + dt, add(y, k3, dt));
    return y.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  };

  /* ------------------ Termodinámica de gases (NASA-7) ------------------ */
  const NA7 = DAT.nasa;
  FQ.species = Object.keys(NA7);
  FQ.M = (sp) => NA7[sp].M; /* g/mol */
  const coef = (sp, T) => { const s = NA7[sp]; return T < s.T[1] ? s.a[0] : s.a[1]; };
  /* cp° (J/mol·K), h° (J/mol, incluye entalpía de formación), s° (J/mol·K a 1 bar) */
  FQ.cp = function (sp, T) { const a = coef(sp, T); return R * (a[0] + T * (a[1] + T * (a[2] + T * (a[3] + T * a[4])))); };
  FQ.h = function (sp, T) { const a = coef(sp, T); return R * T * (a[0] + T * (a[1] / 2 + T * (a[2] / 3 + T * (a[3] / 4 + (T * a[4]) / 5))) + a[5] / T); };
  /* GRI-Mech tabula s° referida a 1 atm; se convierte a la presión estándar de 1 bar */
  const DS_ATM_BAR = R * Math.log(101325 / 1e5);
  FQ.s = function (sp, T) { const a = coef(sp, T); return R * (a[0] * Math.log(T) + T * (a[1] + T * (a[2] / 2 + T * (a[3] / 3 + (T * a[4]) / 4))) + a[6]) + DS_ATM_BAR; };
  FQ.g = (sp, T) => FQ.h(sp, T) - T * FQ.s(sp, T);
  /* Propiedades de una reacción dada como {especie: coef. estequiométrico} (productos +, reactivos −) */
  const sumNu = (nu, fn, T) => { let s = 0; for (const k in nu) s += nu[k] * fn(k, T); return s; };
  FQ.dH = (nu, T) => sumNu(nu, FQ.h, T);
  FQ.dS = (nu, T) => sumNu(nu, FQ.s, T);
  FQ.dG = (nu, T) => sumNu(nu, FQ.g, T);
  FQ.dCp = (nu, T) => sumNu(nu, FQ.cp, T);
  FQ.lnK = (nu, T) => -FQ.dG(nu, T) / (R * T);
  FQ.dn = (nu) => { let s = 0; for (const k in nu) s += nu[k]; return s; };

  /* Equilibrio de una mezcla de gases ideales a T y P por minimización de G (método de Gordon–McBride).
     sp: lista de especies, b: moles iniciales por especie (con los que se calculan las moles de cada elemento). Devuelve {n:{sp:moles}, x:{sp:fracción}, ntot, it} */
  FQ.equil = function (sp, n0, T, P) {
    const els = []; sp.forEach((s) => { for (const el in NA7[s].comp) if (!els.includes(el)) els.push(el); });
    const A = sp.map((s) => els.map((el) => NA7[s].comp[el] || 0)), L = els.length;
    const b = els.map((_, j) => sp.reduce((acc, s, i) => acc + A[i][j] * (n0[s] || 0), 0));
    const c = sp.map((s) => FQ.g(s, T) / (R * T) + Math.log(P / FQ.P0));
    const tot0 = sp.reduce((s, k) => s + (n0[k] || 0), 0) || 1;
    const scale = tot0;
    let n = sp.map(() => scale / sp.length);
    let it = 0;
    for (; it < 400; it++) {
      const N = n.reduce((s, v) => s + v, 0), mu = n.map((v, i) => c[i] + Math.log(v / N));
      const M = Array.from({ length: L + 1 }, () => new Array(L + 1).fill(0)), rhs = new Array(L + 1).fill(0);
      for (let j = 0; j < L; j++) {
        for (let k = 0; k < L; k++) for (let i = 0; i < sp.length; i++) M[j][k] += A[i][j] * A[i][k] * n[i];
        for (let i = 0; i < sp.length; i++) { M[j][L] += A[i][j] * n[i]; M[L][j] += A[i][j] * n[i]; rhs[j] += A[i][j] * n[i] * mu[i]; }
        rhs[j] += b[j] - n.reduce((s, v, i) => s + A[i][j] * v, 0);
      }
      for (let i = 0; i < sp.length; i++) rhs[L] += n[i] * mu[i];
      const sol = FQ.solve(M, rhs);
      if (!sol) break;
      const pi = sol.slice(0, L), u = sol[L];
      const dln = n.map((v, i) => pi.reduce((s, p, j) => s + p * A[i][j], 0) - mu[i] + u);
      let lam = 1;
      for (let i = 0; i < sp.length; i++) if (dln[i] > 2) lam = Math.min(lam, 2 / dln[i]);
      for (let i = 0; i < sp.length; i++) if (dln[i] < -9.2) lam = Math.min(lam, 9.2 / -dln[i]);
      let maxd = 0;
      n = n.map((v, i) => { const nv = v * (1 + lam * dln[i] > 1e-30 ? 1 + lam * dln[i] : 0.01); maxd = Math.max(maxd, Math.abs(nv - v) / (Math.abs(nv) + 1e-12 * scale)); return nv; });
      if (lam === 1 && maxd < 1e-12) break;
    }
    const N = n.reduce((s, v) => s + v, 0), res = { n: {}, x: {}, ntot: N, it };
    sp.forEach((s, i) => { res.n[s] = n[i]; res.x[s] = n[i] / N; });
    return res;
  };

  /* ------------------ Etanol–agua a 20 °C: volumen molar parcial ------------------ */
  (function () {
    const D = DAT.etoh, M1 = D.M1, M2 = D.M2; /* 1 = etanol, 2 = agua */
    const rho = D.rel.map((r) => r * D.rho_w20);
    const x = [], V = [];
    D.w.forEach((w, i) => { const n1 = w / M1, n2 = (100 - w) / M2; x.push(n1 / (n1 + n2)); V.push(100 / rho[i] / (n1 + n2)); });
    const V1 = V[V.length - 1], V2 = V[0];
    const VE = V.map((v, i) => v - x[i] * V1 - (1 - x[i]) * V2);
    const idx = x.map((_, i) => i).filter((i) => x[i] > 0 && x[i] < 1);
    const coef = FQ.polyfit(idx.map((i) => 2 * x[i] - 1), idx.map((i) => VE[i] / (x[i] * (1 - x[i]))), 6);
    const dcoef = FQ.polyder(coef);
    const VEf = (xx) => xx * (1 - xx) * FQ.polyval(coef, 2 * xx - 1);
    const dVE = (xx) => (1 - 2 * xx) * FQ.polyval(coef, 2 * xx - 1) + 2 * xx * (1 - xx) * FQ.polyval(dcoef, 2 * xx - 1);
    const E = (FQ.etoh = { x, V, VE, w: D.w, rho, V1, V2, M1, M2, coef });
    E.VmFit = (xx) => xx * V1 + (1 - xx) * V2 + VEf(xx);
    E.VEfit = VEf;
    E.dVm = (xx) => V1 - V2 + dVE(xx);
    /* volúmenes molares parciales de etanol (1) y agua (2), cm³/mol, a fracción molar de etanol xx */
    E.Vbar = (xx) => { const v = E.VmFit(xx), d = E.dVm(xx); return [v + (1 - xx) * d, v - xx * d]; };
    /* fracción molar de etanol a partir del % en masa */
    E.xOfW = (w) => { const n1 = w / M1, n2 = (100 - w) / M2; return n1 / (n1 + n2); };
    E.wOfX = (xx) => (100 * xx * M1) / (xx * M1 + (1 - xx) * M2);
  })();

  /* ------------------ Tabla termodinámica a 298.15 K (NBS/CODATA/CRC, tools/datos_termo.py) ------------------ */
  FQ.tt = DAT.tt;
  /* Propiedades estándar de una reacción {especie: ν} a 298.15 K: H, G (kJ/mol), S (J/mol·K), K (adimensional, aᵢ = 1 en el estado estándar) */
  FQ.rxn = function (nu) {
    let H = 0, G = 0, S = 0;
    for (const k in nu) { const t = FQ.tt[k]; if (!t) throw new Error('especie desconocida: ' + k); H += nu[k] * t.H; G += nu[k] * t.G; S += nu[k] * t.S; }
    return { H, G, S, lnK: (-G * 1000) / (R * 298.15), K: Math.exp((-G * 1000) / (R * 298.15)) };
  };
  /* Ciclo de Born–Haber de MX (sal de estructura NaCl): energía reticular experimental y estimada con Born–Mayer */
  FQ.born = function (M, X) {
    const m = DAT.born.M[M], x = DAT.born.X[X], Hf = DAT.born.Hf[M + X];
    const U = Hf - m.sub - m.IE - x.atom - x.EA; /* ΔH del paso M⁺(g) + X⁻(g) → MX(s) */
    const r0 = m.r + x.r, A = 1.7476, K0 = (FQ.NA * FQ.e * FQ.e) / (4 * Math.PI * FQ.eps0) * 1e12 / 1e3; /* kJ·pm/mol */
    const rho = 34.5, UBM = -(K0 * A / r0) * (1 - rho / r0);
    return { Hf, sub: m.sub, IE: m.IE, atom: x.atom, EA: x.EA, U, UBM, r0 };
  };

  /* ------------------ Tercera ley: entropía de Debye y de redes metálicas ------------------ */
  /* Función de Debye D3(x) = (3/x³)∫₀ˣ t³/(eᵗ−1) dt */
  FQ.debyeD3 = function (x) {
    if (x < 1e-8) return 1;
    const n = 300, hh = x / n, f = (t) => (t === 0 ? 0 : (t * t * t) / Math.expm1(t));
    let sum = 0;
    for (let i = 0; i <= n; i++) sum += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * f(i * hh);
    return ((3 / (x * x * x)) * sum * hh) / 3;
  };
  /* Entropía molar de la red de Debye (J/mol·K) y capacidad calorífica C_V */
  FQ.debyeS = (T, th) => { const x = th / T; return R * (4 * FQ.debyeD3(x) - 3 * Math.log1p(-Math.exp(-x))); };
  FQ.debyeCv = (T, th) => { const x = th / T; return 3 * R * (4 * FQ.debyeD3(x) - (3 * x) / Math.expm1(x)); };
  /* θ de Debye (Kittel, 8.ª ed., tabla 5.1, K) y coeficiente electrónico γ (mJ/mol·K², tabla 6.1) de metales */
  FQ.METAL = { Cu: { th: 343, g: 0.695 }, Ag: { th: 225, g: 0.646 }, Al: { th: 428, g: 1.35 }, Pb: { th: 105, g: 2.98 }, Zn: { th: 327, g: 0.64 }, Fe: { th: 470, g: 4.98 }, Ni: { th: 450, g: 7.02 }, Mg: { th: 400, g: 1.3 }, Ca: { th: 230, g: 2.9 }, Ti: { th: 420, g: 3.35 }, Si: { th: 645, g: 0 } };

  /* ------------------ Diagrama de Ellingham ------------------ */
  /* Datos de transición de los metales (CRC): [T_fus K, ΔH_fus kJ/mol], [T_eb K, ΔH_vap kJ/mol] */
  FQ.TRANS = { Mg: { fus: [923, 8.48], vap: [1363, 127.4] }, Al: { fus: [933.5, 10.71] }, Zn: { fus: [692.7, 7.07], vap: [1180, 115.3] }, Cu: { fus: [1357.8, 13.26] }, Fe: { fus: [1811, 13.81] }, Ni: { fus: [1728, 17.48] }, Ti: { fus: [1941, 14.15] }, Si: { fus: [1687, 50.21] }, Ca: { fus: [1115, 8.54], vap: [1757, 154.7] } };
  /* Reacciones normalizadas a 1 mol de O₂ */
  FQ.ELL = {
    Mg: { n: '2 Mg + O₂ → 2 MgO', nu: { 'Mg(s)': -2, 'O2(g)': -1, 'MgO(s)': 2 }, metal: 'Mg', nM: 2 },
    Ca: { n: '2 Ca + O₂ → 2 CaO', nu: { 'Ca(s)': -2, 'O2(g)': -1, 'CaO(s)': 2 }, metal: 'Ca', nM: 2 },
    Al: { n: '4/3 Al + O₂ → 2/3 Al₂O₃', nu: { 'Al(s)': -4 / 3, 'O2(g)': -1, 'Al2O3(s)': 2 / 3 }, metal: 'Al', nM: 4 / 3 },
    Ti: { n: 'Ti + O₂ → TiO₂', nu: { 'Ti(s)': -1, 'O2(g)': -1, 'TiO2(s)': 1 }, metal: 'Ti', nM: 1 },
    Si: { n: 'Si + O₂ → SiO₂', nu: { 'Si(s)': -1, 'O2(g)': -1, 'SiO2(s)': 1 }, metal: 'Si', nM: 1 },
    Zn: { n: '2 Zn + O₂ → 2 ZnO', nu: { 'Zn(s)': -2, 'O2(g)': -1, 'ZnO(s)': 2 }, metal: 'Zn', nM: 2 },
    Fe: { n: '2 Fe + O₂ → 2 FeO', nu: { 'Fe(s)': -2, 'O2(g)': -1, 'FeO(s)': 2 }, metal: 'Fe', nM: 2 },
    Ni: { n: '2 Ni + O₂ → 2 NiO', nu: { 'Ni(s)': -2, 'O2(g)': -1, 'NiO(s)': 2 }, metal: 'Ni', nM: 2 },
    Cu: { n: '4 Cu + O₂ → 2 Cu₂O', nu: { 'Cu(s)': -4, 'O2(g)': -1, 'Cu2O(s)': 2 }, metal: 'Cu', nM: 4 },
    CO: { n: '2 C + O₂ → 2 CO', nu: { 'C(gr)': -2, 'O2(g)': -1, 'CO(g)': 2 } },
    CO2: { n: 'C + O₂ → CO₂', nu: { 'C(gr)': -1, 'O2(g)': -1, 'CO2(g)': 1 } },
    CO_CO2: { n: '2 CO + O₂ → 2 CO₂', gas: { CO: -2, O2: -1, CO2: 2 } },
    H2O: { n: '2 H₂ + O₂ → 2 H₂O(g)', gas: { H2: -2, O2: -1, H2O: 2 } }
  };
  /* ΔG° (kJ por mol de O₂) a T. Metales: ΔH° y ΔS° a 298 K constantes, más las correcciones por fusión y ebullición del metal reactivo */
  FQ.ellG = function (key, T) {
    const e = FQ.ELL[key];
    if (e.gas) return FQ.dG(e.gas, T) / 1e3;
    const r = FQ.rxn(e.nu);
    let G = r.H - (T * r.S) / 1e3;
    if (e.metal) {
      const tr = FQ.TRANS[e.metal];
      if (tr.fus && T > tr.fus[0]) G -= e.nM * tr.fus[1] * (1 - T / tr.fus[0]);
      if (tr.vap && T > tr.vap[0]) G -= e.nM * tr.vap[1] * (1 - T / tr.vap[0]);
    }
    return G;
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = FQ;
})();
