/* ===================================================================
   31-ss2.js — Biblioteca científica del curso (EM.ss), parte 2
   Semiconductores (portadores, dopaje, transporte), unión p–n con
   solución numérica de Poisson, celdas solares y dispositivos,
   nanoestructuras, respuesta dieléctrica y óptica, magnetismo
   (Brillouin, Hund, campo medio, Ising, magnones, Stoner–Wohlfarth),
   superconductividad (London, BCS, Ginzburg–Landau, Josephson) y
   defectos y desorden (difusión, Anderson, cuasicristales).
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const req = (n) => (typeof require !== 'undefined' ? require(n) : null);
  const L = EM.lin || req('./29-lin.js');
  const DATA = EM.data || req('./29-data.js');
  const SS = EM.ss && EM.ss.fdInt ? EM.ss : req('./30-ss.js');
  const PI = Math.PI, TAU = 2 * PI;
  const q = SS.e, kB = SS.kB;
  const Vt = (T) => (kB * T) / q;
  SS.Vt = Vt;

  /* ================= Semiconductores ================= */
  /* Brecha de Varshni Eg(T) = Eg0 − αT²/(T + β) (eV) */
  SS.varshni = function (mat, T) {
    const v = DATA.semi[mat].v;
    return v[0] - (v[1] * T * T) / (T + v[2]);
  };
  /* Densidades efectivas de estados (cm⁻³) escaladas desde 300 K */
  SS.NcT = (mat, T) => DATA.semi[mat].Nc * Math.pow(T / 300, 1.5);
  SS.NvT = (mat, T) => DATA.semi[mat].Nv * Math.pow(T / 300, 1.5);
  SS.NcFromMass = (m, T) => 2 * Math.pow((m * SS.me * kB * T) / (TAU * SS.hbar * SS.hbar), 1.5) * 1e-6; /* cm⁻³ */
  /* Concentración intrínseca (cm⁻³) */
  SS.ni = function (mat, T, Eg) {
    const g = Eg === undefined ? SS.varshni(mat, T) : Eg;
    return Math.sqrt(SS.NcT(mat, T) * SS.NvT(mat, T)) * Math.exp(-g / (2 * Vt(T)));
  };
  /* Nivel intrínseco respecto del centro de la brecha (eV) */
  SS.Ei = (mat, T) => (Vt(T) / 2) * Math.log(SS.NvT(mat, T) / SS.NcT(mat, T));
  /* Neutralidad de carga con estadística de Fermi–Dirac e ionización incompleta.
     o = {Nd, Na (cm⁻³), Ed, Ea (meV desde la banda), gd = 2, ga = 4, Eg}
     Energías relativas a Ev = 0. Devuelve {EF, n, p, NdI, NaI} */
  SS.neutral = function (mat, T, o = {}) {
    const Eg = o.Eg === undefined ? SS.varshni(mat, T) : o.Eg;
    const Nc = SS.NcT(mat, T), Nv = SS.NvT(mat, T), kT = Vt(T);
    const Nd = o.Nd || 0, Na = o.Na || 0, Ed = Eg - (o.Ed || 45) / 1000, Ea = (o.Ea || 45) / 1000;
    const gd = o.gd || 2, ga = o.ga || 4;
    const parts = (EF) => {
      const n = Nc * SS.fdInt(0.5, (EF - Eg) / kT), p = Nv * SS.fdInt(0.5, -EF / kT);
      const NdI = Nd / (1 + gd * Math.exp((EF - Ed) / kT)), NaI = Na / (1 + ga * Math.exp((Ea - EF) / kT));
      return { n, p, NdI, NaI };
    };
    const f = (EF) => { const r = parts(EF); return (r.p + r.NdI - r.n - r.NaI) / (r.p + r.NdI + r.n + r.NaI + 1); };
    const EF = L.brent(f, -0.5 - 20 * kT, Eg + 0.5 + 20 * kT, 1e-14);
    return Object.assign({ EF, Eg }, parts(EF));
  };
  /* Radio y energía del donador hidrogenoide */
  SS.hydrogenic = (mr, eps) => ({ E: (SS.Ry * mr) / (eps * eps) * 1000, a: (SS.a0 * eps) / mr }); /* meV, m */
  /* Movilidad de Caughey–Thomas (cm²/V s) en Si a 300 K */
  SS.mobility = function (N, carrier = 'n', model = 'caughey') {
    const [mn, mx, Nr, al] = DATA[model][carrier];
    return mn + (mx - mn) / (1 + Math.pow(N / Nr, al));
  };
  /* Movilidad con dependencia de la temperatura: red ∝ T^−p, impurezas ∝ T^{3/2}/N (regla de Matthiessen) */
  SS.mobilityT = function (N, T, carrier = 'n') {
    const muL = (carrier === 'n' ? 1417 : 471) * Math.pow(T / 300, carrier === 'n' ? -2.42 : -2.2);
    const mu300 = SS.mobility(N, carrier);
    const muI300 = 1 / Math.max(1e-12, 1 / mu300 - 1 / (carrier === 'n' ? 1417 : 471));
    const muI = N > 0 ? muI300 * Math.pow(T / 300, 1.5) : Infinity;
    return 1 / (1 / muL + 1 / muI);
  };
  SS.resistivity = (n, p, mun, mup) => 1 / (q * (n * mun + p * mup)); /* Ω·cm con n, p en cm⁻³ */
  SS.einsteinD = (mu, T) => mu * Vt(T);
  SS.hallTwo = (n, p, mun, mup) => (p * mup * mup - n * mun * mun) / (q * Math.pow(p * mup + n * mun, 2)); /* cm³/C */
  /* Recombinación Shockley–Read–Hall */
  SS.srh = (n, p, ni, taun, taup, n1 = ni, p1 = ni) => (n * p - ni * ni) / (taup * (n + n1) + taun * (p + p1));
  /* Experimento de Haynes–Shockley: densidad del pulso (normalizada) */
  SS.haynes = (x, t, D, mu, E, tau, N0 = 1) => (t <= 0 ? 0 : (N0 / Math.sqrt(4 * PI * D * t)) * Math.exp(-Math.pow(x - mu * E * t, 2) / (4 * D * t)) * Math.exp(-t / tau));

  /* ================= Unión p–n ================= */
  /* Aproximación de agotamiento. Na, Nd en cm⁻³, eps relativa, V aplicado (V). Longitudes en cm */
  SS.pnDepletion = function (Na, Nd, ni, T, epsr, V = 0) {
    const Vbi = Vt(T) * Math.log((Na * Nd) / (ni * ni));
    const eps = epsr * SS.eps0 * 1e-2; /* F/cm */
    const Vj = Math.max(1e-9, Vbi - V);
    const W = Math.sqrt(((2 * eps * Vj) / q) * ((Na + Nd) / (Na * Nd)));
    const xn = (W * Na) / (Na + Nd), xp = (W * Nd) / (Na + Nd);
    const Emax = (q * Nd * xn) / eps;
    return { Vbi, W, xn, xp, Emax, C: eps / W };
  };
  /* Corriente de saturación de Shockley (A/cm²) */
  SS.shockleyJ0 = (ni, Na, Nd, Dn, Dp, Ln, Lp) => q * ni * ni * (Dn / (Ln * Na) + Dp / (Lp * Nd));
  SS.diodeI = (V, I0, T, n = 1) => I0 * Math.expm1(V / (n * Vt(T)));
  /* Solución numérica de Poisson–Boltzmann 1D para la unión abrupta (Newton + Thomas).
     x en cm de −Lp a Ln; Va: polarización (cuasi-niveles planos en la zona de carga).
     Devuelve {x, psi, n, p, rho, E} (psi en V respecto del nivel intrínseco) */
  SS.pnPoisson = function (Na, Nd, ni, T, epsr, Va = 0, o = {}) {
    const vt = Vt(T), eps = epsr * SS.eps0 * 1e-2;
    const dep = SS.pnDepletion(Na, Nd, ni, T, epsr, Va);
    const Lx = o.L || 4 * dep.W + 20 * Math.sqrt((eps * vt) / (q * Math.min(Na, Nd)));
    /* malla no uniforme x = Lx senh(A s)/senh(A), densa cerca de la unión metalúrgica */
    const N = o.N || 1601, A = o.A === undefined ? 5 : o.A;
    const x = new Float64Array(N), C = new Float64Array(N), psi = new Float64Array(N);
    const phip = Va, phin = 0; /* cuasi-niveles: huecos en Va, electrones en 0 */
    for (let i = 0; i < N; i++) {
      const sv = -1 + (2 * i) / (N - 1);
      x[i] = A > 0 ? (Lx * Math.sinh(A * sv)) / Math.sinh(A) : Lx * sv;
      C[i] = x[i] < 0 ? -Na : x[i] > 0 ? Nd : (Nd - Na) / 2;
      /* semilla: neutralidad local */
      psi[i] = x[i] < 0 ? phip - vt * Math.log(Na / ni) : phin + vt * Math.log(Nd / ni);
    }
    const nOf = (ps) => ni * Math.exp((ps - phin) / vt), pOf = (ps) => ni * Math.exp((phip - ps) / vt);
    const a = new Float64Array(N), b = new Float64Array(N), c = new Float64Array(N), r = new Float64Array(N);
    const k = q / eps;
    for (let it = 0; it < 300; it++) {
      for (let i = 0; i < N; i++) {
        if (i === 0 || i === N - 1) { a[i] = 0; c[i] = 0; b[i] = 1; r[i] = 0; continue; }
        const h1 = x[i] - x[i - 1], h2 = x[i + 1] - x[i], w = 2 / (h1 + h2);
        const n = nOf(psi[i]), p = pOf(psi[i]);
        /* F = w[(ψ₊ − ψ)/h2 − (ψ − ψ₋)/h1] + (q/ε)(p − n + C) = 0 */
        const F = w * ((psi[i + 1] - psi[i]) / h2 - (psi[i] - psi[i - 1]) / h1) + k * (p - n + C[i]);
        a[i] = w / h1; c[i] = w / h2; b[i] = -w / h1 - w / h2 - (k * (p + n)) / vt; r[i] = -F;
      }
      const d = L.thomas(a, b, c, r);
      let mx = 0;
      for (let i = 0; i < N; i++) { const st = Math.max(-1, Math.min(1, d[i])); psi[i] += st; mx = Math.max(mx, Math.abs(st)); }
      if (mx < 1e-13) break;
    }
    const n = Array.from(psi, nOf), p = Array.from(psi, pOf);
    const rho = Array.from(psi, (ps, i) => q * (p[i] - n[i] + C[i]));
    /* campo: derivada de segundo orden en malla no uniforme */
    const E = Array.from(psi, (ps, i) => {
      if (i === 0 || i === N - 1) return 0;
      const h1 = x[i] - x[i - 1], h2 = x[i + 1] - x[i];
      if (x[i] === 0 && i >= 2) {
        /* en la unión ψ'' salta: derivada lateral de tres puntos (lado p) */
        const g1 = x[i] - x[i - 1], g2 = x[i - 1] - x[i - 2];
        return -(((2 * g1 + g2) / (g1 * (g1 + g2))) * psi[i] - ((g1 + g2) / (g1 * g2)) * psi[i - 1] + (g1 / (g2 * (g1 + g2))) * psi[i - 2]);
      }
      return -((psi[i + 1] - psi[i]) * h1 * h1 + (psi[i] - psi[i - 1]) * h2 * h2) / (h1 * h2 * (h1 + h2));
    });
    return { x: Array.from(x), psi: Array.from(psi), n, p, rho, E, Vbi: psi[N - 1] - psi[0], dep };
  };

  /* ================= Celdas solares ================= */
  /* Flujo de fotones de cuerpo negro hemisférico con E > Eg (m⁻² s⁻¹), E en eV */
  SS.photonFlux = function (Eg, T) {
    const kT = SS.kBeV * T, pref = (TAU / (Math.pow(SS.h, 3) * SS.c * SS.c)) * Math.pow(q, 3);
    const x0 = Eg / kT;
    const f = (x) => (x * x) / Math.expm1(x);
    const I = L.gl(f, x0, x0 + 60, 48, 30);
    return pref * Math.pow(kT, 3) * I;
  };
  /* Límite de Shockley–Queisser (balance detallado, Sol de cuerpo negro a Ts, celda a Tc) */
  SS.sq = function (Eg, Ts = 5778, Tc = 300, conc = 1) {
    const f = conc * Math.pow(6.957e8 / 1.495978707e11, 2);
    const sigma = (2 * Math.pow(PI, 5) * Math.pow(kB, 4)) / (15 * Math.pow(SS.h, 3) * SS.c * SS.c);
    const Pin = f * sigma * Math.pow(Ts, 4);
    const Jsc = q * f * SS.photonFlux(Eg, Ts), J0 = q * SS.photonFlux(Eg, Tc);
    const vt = Vt(Tc);
    const P = (V) => V * (Jsc - J0 * Math.expm1(V / vt));
    const Voc = vt * Math.log1p(Jsc / J0);
    const Vm = L.golden((V) => -P(V), 0, Voc);
    return { eta: P(Vm) / Pin, Jsc, J0, Voc, Vm, Pin, FF: P(Vm) / (Voc * Jsc) };
  };
  /* MOSFET: tensión umbral y corriente cuadrática (canal n) */
  SS.mosVt = function (Na, tox, T = 300, VFB = -0.9, epsr = 11.7) {
    const ni = 1.0e10, phiF = Vt(T) * Math.log(Na / ni);
    const Cox = (3.9 * SS.eps0 * 1e-2) / tox; /* F/cm² */
    const Qd = Math.sqrt(2 * epsr * SS.eps0 * 1e-2 * q * Na * 2 * phiF);
    return { Vt: VFB + 2 * phiF + Qd / Cox, phiF, Cox };
  };
  SS.mosId = (Vgs, Vds, Vth, k) => (Vgs <= Vth ? 0 : Vds < Vgs - Vth ? k * ((Vgs - Vth) * Vds - (Vds * Vds) / 2) : (k / 2) * Math.pow(Vgs - Vth, 2));

  /* ================= Nanoestructuras ================= */
  /* Pozo infinito: E_n (eV), L en nm */
  SS.wellInf = (n, Lnm, mr = 1) => (SS.HB2M / mr) * Math.pow((n * PI) / Lnm, 2);
  /* Pozo finito de ancho L (nm) y profundidad V0 (eV): niveles ligados (misma masa) */
  SS.wellFinite = function (V0, Lnm, mr = 1) {
    const c2 = SS.HB2M / mr, u0 = (Lnm / 2) * Math.sqrt(V0 / c2), out = [];
    /* par: v = u tan u; impar: v = −u cot u; u² + v² = u0² */
    const fe = (u) => u * Math.tan(u) - Math.sqrt(Math.max(0, u0 * u0 - u * u));
    const fo = (u) => -u / Math.tan(u) - Math.sqrt(Math.max(0, u0 * u0 - u * u));
    for (let m = 0; m * (PI / 2) < u0; m++) {
      const lo = (m * PI) / 2 + 1e-12, hi = Math.min(((m + 1) * PI) / 2 - 1e-12, u0);
      const f = m % 2 === 0 ? fe : fo;
      if (f(lo) * f(hi) <= 0) { const u = L.brent(f, lo, hi, 1e-15); out.push({ E: c2 * Math.pow((2 * u) / Lnm, 2), parity: m % 2 ? 'impar' : 'par', u }); }
    }
    return out;
  };
  /* Densidad de estados por dimensión (unidades naturales, para gráficas) */
  SS.dosDim = function (E, dim, levels = [1, 4, 9]) {
    if (dim === 3) return E > 0 ? Math.sqrt(E) : 0;
    if (dim === 2) return levels.reduce((s, e) => s + (E >= e ? 1 : 0), 0);
    if (dim === 1) return levels.reduce((s, e) => s + (E > e ? 1 / Math.sqrt(E - e) : 0), 0);
    return 0;
  };
  /* Ecuación de Brus para un punto cuántico esférico de radio R (nm) */
  SS.brus = (Eg, Rnm, me, mh, epsr) => Eg + (SS.HB2M * PI * PI) / (Rnm * Rnm) * (1 / me + 1 / mh) - (1.786 * SS.COUL) / (epsr * Rnm * 10);

  /* ================= Respuesta dieléctrica ================= */
  SS.clausius = (Nalpha) => (1 + (2 * Nalpha) / 3) / (1 - Nalpha / 3); /* Nα/ε₀ → ε_r */
  /* Oscilador de Lorentz con fonón óptico: ε(ω) = ε∞ + (ε0 − ε∞) ω_T²/(ω_T² − ω² − iγω) */
  SS.lorentzEps = function (w, wT, eps0r, epsInf, g) {
    const dr = wT * wT - w * w, di = -g * w, den = dr * dr + di * di, A = (eps0r - epsInf) * wT * wT;
    return { re: epsInf + (A * dr) / den, im: (-A * di) / den };
  };
  SS.lstWL = (wT, eps0r, epsInf) => wT * Math.sqrt(eps0r / epsInf);
  /* Polaritón de fonón: ramas ω(k) de c²k² = ω² ε(ω) sin amortiguamiento */
  SS.polariton = function (ck, wT, eps0r, epsInf) {
    const wL2 = (wT * wT * eps0r) / epsInf;
    const B = wL2 + (ck * ck) / epsInf, Cc = (ck * ck * wT * wT) / epsInf;
    const d = Math.sqrt(B * B - 4 * Cc);
    return [Math.sqrt((B - d) / 2), Math.sqrt((B + d) / 2)];
  };
  /* Teoría de Landau de un ferroeléctrico: F = ½a(T−T0)P² + ¼bP⁴ + ⅙cP⁶; P de equilibrio */
  SS.landauP = function (T, T0, a, b, c) {
    const A = a * (T - T0);
    if (c === 0 || c === undefined) return A < 0 && b > 0 ? Math.sqrt(-A / b) : 0;
    /* raíces de A + b x + c x² = 0 con x = P² */
    const cand = [0];
    const disc = b * b - 4 * A * c;
    if (disc >= 0) for (const s of [1, -1]) { const x = (-b + s * Math.sqrt(disc)) / (2 * c); if (x > 0) cand.push(Math.sqrt(x)); }
    const F = (P) => 0.5 * A * P * P + 0.25 * b * Math.pow(P, 4) + (c / 6) * Math.pow(P, 6);
    return cand.reduce((best, P) => (F(P) < F(best) - 1e-15 ? P : best), 0);
  };
  /* Kramers–Kronig: ε₁(ω) − ε∞ = (2/π) P∫ ω' ε₂(ω')/(ω'² − ω²) dω' por cuadratura sustrayendo la singularidad */
  SS.kkRe = function (w, eps2, wmax, n = 4000, epsInf = 1) {
    const h = wmax / n, e2w = eps2(w);
    let s = 0;
    for (let i = 0; i < n; i++) {
      const wp = (i + 0.5) * h;
      s += ((wp * eps2(wp) - w * e2w) / (wp * wp - w * w)) * h;
    }
    /* término analítico de la parte sustraída: w e2(w) P∫₀^{wmax} dω'/(ω'² − ω²) */
    s += w * e2w * (Math.log(Math.abs((wmax - w) / (wmax + w))) / (2 * w));
    return epsInf + (2 / PI) * s;
  };

  /* ================= Óptica de sólidos ================= */
  SS.absDirect = (E, Eg, A = 1) => (E > Eg ? (A * Math.sqrt(E - Eg)) / E : 0);
  SS.absIndirect = (E, Eg, Eph, T, A = 1) => {
    const nph = 1 / Math.expm1(Eph / (SS.kBeV * T));
    const ab = E > Eg - Eph ? (nph * Math.pow(E - Eg + Eph, 2)) : 0;
    const em = E > Eg + Eph ? ((nph + 1) * Math.pow(E - Eg - Eph, 2)) : 0;
    return (A * (ab + em)) / E;
  };
  SS.excitonRy = (mu, epsr) => (SS.Ry * mu) / (epsr * epsr) * 1000; /* meV */
  SS.excitonA = (mu, epsr) => (SS.a0 * epsr) / mu * 1e9; /* nm */

  /* ================= Magnetismo ================= */
  SS.brillouin = function (J, x) {
    if (Math.abs(x) < 1e-6) return ((J + 1) / (3 * J)) * x;
    const a = (2 * J + 1) / (2 * J), b = 1 / (2 * J);
    return a / Math.tanh(a * x) - b / Math.tanh(b * x);
  };
  SS.langevin = (x) => (Math.abs(x) < 1e-4 ? x / 3 - (x * x * x) / 45 : 1 / Math.tanh(x) - 1 / x);
  /* Reglas de Hund para n electrones en una capa de momento angular l */
  SS.hund = function (n, l) {
    const N = 2 * (2 * l + 1);
    if (n <= 0 || n >= N) return { S: 0, L: 0, J: 0, g: 0, p: 0, term: '¹S₀' };
    const half = 2 * l + 1;
    const m = n <= half ? n : n - half;
    const S = n <= half ? n / 2 : (N - n) / 2;
    let Lq = 0;
    for (let i = 0; i < m; i++) Lq += l - i;
    if (n === half) Lq = 0;
    const J = n < half ? Math.abs(Lq - S) : Lq + S;
    const g = J === 0 ? 0 : 1 + (J * (J + 1) + S * (S + 1) - Lq * (Lq + 1)) / (2 * J * (J + 1));
    const Ls = 'SPDFGHIKLMN'[Lq];
    const sub = (x) => String(x).split('').map((c) => '₀₁₂₃₄₅₆₇₈₉'[+c] || c).join('');
    const sup = (x) => String(x).split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c] || c).join('');
    const Jtxt = Number.isInteger(J) ? sub(J) : sub(2 * J) + '/₂';
    return { S, L: Lq, J, g, p: J ? g * Math.sqrt(J * (J + 1)) : 0, pSpin: 2 * Math.sqrt(S * (S + 1)), term: sup(2 * S + 1) + Ls + Jtxt };
  };
  /* Magnetización de un paramagneto de N momentos por volumen (A/m) */
  SS.paraM = (N, g, J, B, T) => N * g * J * SS.muB * SS.brillouin(J, (g * J * SS.muB * B) / (kB * T));
  /* Constante de Curie C = µ0 N p² µB²/(3kB) (K, susceptibilidad del SI adimensional) */
  SS.curieC = (N, p) => (SS.mu0 * N * p * p * SS.muB * SS.muB) / (3 * kB);
  /* Entropía molar de un paramagneto de espín J en x = gµB B/(kB T) (unidades de R) */
  SS.paraS = function (J, y) {
    /* y = gµB B/(kT): Z = sinh((2J+1)y/2)/sinh(y/2) */
    if (Math.abs(y) < 1e-8) return Math.log(2 * J + 1);
    const ay = Math.abs(y), lnZ = J * ay + Math.log(-Math.expm1(-(2 * J + 1) * ay) / -Math.expm1(-ay)); /* estable para y grande */
    const mean = J * SS.brillouin(J, J * y); /* ⟨m⟩ */
    return lnZ - y * mean;
  };
  /* Pauli y Landau */
  SS.pauliChi = (gEF) => SS.mu0 * SS.muB * SS.muB * gEF;
  /* Campo medio de Weiss: m = B_J(3J/(J+1) · m/t + h), t = T/Tc, h = gJµB B/(kB T) */
  SS.weiss = function (J, t, h = 0) {
    const f = (m) => m - SS.brillouin(J, ((3 * J) / (J + 1)) * (m / t) + h / t);
    if (t >= 1 && h === 0) return 0;
    const lo = h >= 0 ? 1e-14 : -1, hi = h >= 0 ? 1 : -1e-14;
    if (f(lo) * f(hi) > 0) return 0;
    return L.brent(f, lo, hi, 1e-15);
  };
  /* Ising 2D: solución de Onsager */
  SS.onsagerTc = 2 / Math.log(1 + Math.SQRT2);
  SS.onsagerM = (T, J = 1) => (T >= SS.onsagerTc * J ? 0 : Math.pow(1 - Math.pow(Math.sinh((2 * J) / T), -4), 1 / 8));
  /* Barrido de Metropolis sobre una red L×L (Int8Array de ±1), con β = 1/T y campo h */
  SS.isingSweep = function (s, Lsz, beta, h, rng) {
    const n = Lsz * Lsz, w4 = Math.exp(-8 * beta), w2 = Math.exp(-4 * beta);
    let acc = 0;
    for (let k = 0; k < n; k++) {
      const i = Math.floor(rng() * n), x = i % Lsz, y = (i - x) / Lsz;
      const nb = s[((x + 1) % Lsz) + y * Lsz] + s[((x - 1 + Lsz) % Lsz) + y * Lsz] + s[x + ((y + 1) % Lsz) * Lsz] + s[x + ((y - 1 + Lsz) % Lsz) * Lsz];
      const dE = 2 * s[i] * (nb + h);
      if (dE <= 0 || rng() < (h === 0 ? (dE === 8 ? w4 : dE === 4 ? w2 : Math.exp(-beta * dE)) : Math.exp(-beta * dE))) { s[i] = -s[i]; acc++; }
    }
    return acc / n;
  };
  /* Magnones del ferromagneto de Heisenberg (H = −2J Σ Sᵢ·Sⱼ): ħω = 2JS Σ_δ (1 − cos k·δ) */
  SS.magnon = (k, J, S, deltas) => 2 * J * S * deltas.reduce((s, d) => s + 1 - Math.cos(k[0] * d[0] + k[1] * d[1] + k[2] * d[2]), 0);
  /* Ley T^{3/2} de Bloch: ΔM/M₀ = (ζ(3/2)/(S Q)) (kT/(8πJS))^{3/2}, Q = átomos por celda cúbica */
  SS.blochCoef = L.zeta(1.5) / Math.pow(4 * PI, 1.5);
  SS.blochDM = (tred, S, Q = 1) => (SS.blochCoef / (S * Q)) * Math.pow(tred, 1.5); /* tred = kT/(2JS) */
  /* Stoner–Wohlfarth: energía e(θ) = ½ sen²θ − h cos(θ − ψ); rama siguiendo el mínimo local */
  SS.swEnergy = (th, h, psi) => 0.5 * Math.sin(th) * Math.sin(th) - h * Math.cos(th - psi);
  SS.swRelax = function (th, h, psi) {
    for (let it = 0; it < 200; it++) {
      const d1 = 0.5 * Math.sin(2 * th) + h * Math.sin(th - psi), d2 = Math.cos(2 * th) + h * Math.cos(th - psi);
      const st = d2 > 1e-6 ? -d1 / d2 : -0.2 * Math.sign(d1);
      th += Math.max(-0.3, Math.min(0.3, st));
      if (Math.abs(st) < 1e-13) break;
    }
    return th;
  };
  /* Ciclo de histéresis: devuelve [{h, m}] para h de hmax a −hmax y regreso */
  SS.swLoop = function (psi, hmax = 1.5, n = 600) {
    const out = [];
    let th = psi + 1e-3;
    const path = [];
    for (let i = 0; i <= n; i++) path.push(hmax - (2 * hmax * i) / n);
    for (let i = 1; i <= n; i++) path.push(-hmax + (2 * hmax * i) / n);
    for (const h of path) { th = SS.swRelax(th, h, psi); out.push({ h, m: Math.cos(th - psi) }); }
    return out;
  };
  SS.swSwitch = (psi) => Math.pow(Math.pow(Math.abs(Math.cos(psi)), 2 / 3) + Math.pow(Math.abs(Math.sin(psi)), 2 / 3), -1.5);
  /* Campo de inversión numérico: primer salto de m en la rama descendente */
  SS.swSwitchNum = function (psi, n = 20000) {
    let th = psi + 1e-6, last = null;
    for (let i = 0; i <= n; i++) {
      const h = 1.2 - (2.4 * i) / n;
      th = SS.swRelax(th, h, psi);
      const m = Math.cos(th - psi);
      /* salto irreversible: cambio brusco de m entre dos campos vecinos */
      if (last !== null && Math.abs(m - last) > 0.05 && h < 0) return -h;
      last = m;
    }
    return NaN;
  };
  /* Pared de Bloch: anchura π√(A/K) y energía 4√(AK) */
  SS.wall = (A, K) => ({ delta: PI * Math.sqrt(A / K), sigma: 4 * Math.sqrt(A * K) });

  /* ================= Superconductividad ================= */
  SS.londonL = (ns, m = SS.me) => Math.sqrt(m / (SS.mu0 * ns * q * q));
  SS.Bc = (T, Tc, Bc0) => (T >= Tc ? 0 : Bc0 * (1 - Math.pow(T / Tc, 2)));
  SS.lambdaT = (T, Tc, l0) => (T >= Tc ? Infinity : l0 / Math.sqrt(1 - Math.pow(T / Tc, 4)));
  SS.BCS_D0 = PI * Math.exp(-0.5772156649015329); /* Δ(0)/kTc = π e^{−γ} = 1.764 */
  /* Brecha BCS reducida δ = Δ(T)/Δ(0) en t = T/Tc (forma de Mühlschlegel, independiente del corte):
     ln(1/δ) = 2 ∫₀^∞ f(E)/E dξ, E = √(ξ² + Δ²) */
  SS.bcsGap = function (t) {
    if (t >= 1) return 0;
    if (t <= 0) return 1;
    const D0 = SS.BCS_D0; /* en unidades de kTc */
    const F = (d) => {
      const D = d * D0;
      /* ξ = D senh u → dξ/E = du */
      const I = L.gl((u) => { const E = D * Math.cosh(u); return 1 / (Math.exp(E / t) + 1); }, 0, Math.acosh(Math.max(2, (70 * t) / D)) + 1, 48, 16);
      return Math.log(1 / d) - 2 * I;
    };
    return L.brent(F, 1e-12, 1, 1e-14);
  };
  /* Salto del calor específico ΔC/(γTc) = 12/(7ζ(3)) */
  SS.bcsJump = 12 / (7 * L.zeta(3));
  /* Brecha BCS a T = 0 con corte de Debye: Δ0 = ħωD / senh(1/(N0V)) */
  SS.bcsD0cut = (wD, lam) => wD / Math.sinh(1 / lam);
  /* Tc con corte: 1/λ = ∫₀^{ħωD} tanh(ξ/2kTc)/ξ dξ */
  SS.bcsTc = function (wD, lam) {
    const g = (kT) => L.gl((x) => (x < 1e-12 ? 1 / (2 * kT) : Math.tanh(x / (2 * kT)) / x), 0, wD, 64, 40) - 1 / lam;
    return L.brent(g, 1e-6 * wD, wD, 1e-15);
  };
  /* Ginzburg–Landau */
  SS.glFields = function (lam, xi) {
    const kappa = lam / xi;
    return { kappa, Bc2: SS.PHI0 / (TAU * xi * xi), Bc1: (SS.PHI0 / (4 * PI * lam * lam)) * Math.log(kappa), Bc: SS.PHI0 / (2 * Math.SQRT2 * PI * lam * xi), type: kappa > 1 / Math.SQRT2 ? 2 : 1 };
  };
  /* Bessel modificada K0 y K1 (Abramowitz–Stegun 9.8) para el perfil del vórtice */
  SS.besselK0 = function (x) {
    if (x <= 2) {
      const t = (x / 3.75) * (x / 3.75), y = (x * x) / 4;
      const I0 = 1 + 3.5156229 * t + 3.0899424 * t * t + 1.2067492 * t ** 3 + 0.2659732 * t ** 4 + 0.0360768 * t ** 5 + 0.0045813 * t ** 6;
      return -Math.log(x / 2) * I0 - 0.57721566 + 0.4227842 * y + 0.23069756 * y * y + 0.0348859 * y ** 3 + 0.00262698 * y ** 4 + 0.0001075 * y ** 5 + 0.0000074 * y ** 6;
    }
    const y = 2 / x;
    return (Math.exp(-x) / Math.sqrt(x)) * (1.25331414 - 0.07832358 * y + 0.02189568 * y * y - 0.01062446 * y ** 3 + 0.00587872 * y ** 4 - 0.0025154 * y ** 5 + 0.00053208 * y ** 6);
  };
  /* Josephson: Ambegaokar–Baratoff Ic·Rn = (πΔ/2e) tanh(Δ/2kT) */
  SS.abIcRn = (DeltaEV, T) => ((PI * DeltaEV) / 2) * Math.tanh(DeltaEV / (2 * SS.kBeV * Math.max(T, 1e-9)));
  /* Modelo RCSJ sobreamortiguado: φ' = (2eR/ħ)(I − Ic sen φ); devuelve ⟨V⟩/(IcR) para i = I/Ic */
  SS.rsjV = (i) => (Math.abs(i) <= 1 ? 0 : Math.sign(i) * Math.sqrt(i * i - 1));
  /* Integra el RSJ con corriente i0 + i1 sen(Ωτ) (τ en unidades de ħ/(2eRIc)); ⟨φ'⟩ = ⟨V⟩/(IcR) */
  SS.rsjAC = function (i0, i1, Om, T = 400, dt = 0.01) {
    let ph = 0, t = 0;
    const n = Math.round(T / dt), n0 = Math.round(n / 4);
    let ph0 = 0;
    for (let s = 0; s < n; s++) {
      const f = (p, tt) => i0 + i1 * Math.sin(Om * tt) - Math.sin(p);
      const k1 = f(ph, t), k2 = f(ph + (dt / 2) * k1, t + dt / 2), k3 = f(ph + (dt / 2) * k2, t + dt / 2), k4 = f(ph + dt * k3, t + dt);
      ph += (dt / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
      t += dt;
      if (s === n0) ph0 = ph;
    }
    return (ph - ph0) / (dt * (n - n0 - 1));
  };

  /* ================= Defectos y desorden ================= */
  SS.vacancyFrac = (Ev, T, Sk = 0) => Math.exp(Sk) * Math.exp(-Ev / (SS.kBeV * T));
  SS.diffD = (D0, Q, T) => D0 * Math.exp(-(Q * 1000) / (SS.R * T)); /* Q en kJ/mol */
  SS.fick = (x, t, D, Cs = 1, C0 = 0) => C0 + (Cs - C0) * L.erfc(x / (2 * Math.sqrt(D * t)));
  /* Exponente de Lyapunov de la cadena de Anderson (t = 1, desorden uniforme de ancho W) */
  SS.andersonLyap = function (E, W, N, rng) {
    let a = 1, b = 0, lg = 0; /* ψ_{n+1} = (E − ε_n) ψ_n − ψ_{n−1} */
    for (let i = 0; i < N; i++) {
      const eps = W * (rng() - 0.5);
      const c = (E - eps) * a - b;
      b = a; a = c;
      if (Math.abs(a) > 1e8) { lg += Math.log(Math.abs(a)); b /= Math.abs(a); a /= Math.abs(a); }
    }
    lg += Math.log(Math.abs(a));
    return lg / N;
  };
  /* Longitud de localización perturbativa (Thouless): ξ = 24(4 − E²)/W² */
  SS.thoulessXi = (E, W) => (24 * (4 - E * E)) / (W * W);
  /* Cadena de Fibonacci: saltos tA, tB según la sucesión de Fibonacci de n generaciones */
  SS.fibonacci = function (gen) {
    let a = 'A', b = 'AB';
    for (let i = 0; i < gen; i++) { const c = b + a; a = b; b = c; }
    return b;
  };
  SS.fibSpectrum = function (seq, tA = 1, tB = 0.5) {
    const n = seq.length + 1, d = new Float64Array(n), o = new Float64Array(n - 1);
    for (let i = 0; i < n - 1; i++) o[i] = -(seq[i] === 'A' ? tA : tB);
    return L.triEig(d, o);
  };
  /* Desorden en la cadena de enlace fuerte: participación inversa de los autoestados */
  SS.andersonStates = function (N, W, rng) {
    const A = new Float64Array(N * N);
    for (let i = 0; i < N; i++) { A[i * N + i] = W * (rng() - 0.5); if (i < N - 1) { A[i * N + i + 1] = -1; A[(i + 1) * N + i] = -1; } }
    return L.symEig(A, N, true);
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = SS;
})();
