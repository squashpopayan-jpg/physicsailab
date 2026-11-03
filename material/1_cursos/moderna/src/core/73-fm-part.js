/* ===================================================================
   73-fm-part.js — Partículas elementales (EM.fm.pa): leyes de conservación (carga, número bariónico, números leptónicos, extrañeza),
   modelo de quarks, cinemática de desintegraciones de dos cuerpos, vida media del muón, supresión de helicidad del pión, la anchura del Z y el
   número de neutrinos, la masa de W en el nivel árbol, matrices CKM y PMNS, oscilaciones de neutrinos, fórmula de masas de Gell-Mann–Okubo.
   Sin DOM; natural units con ħ = c = 1 salvo indicación (MeV, GeV).
   =================================================================== */
(function (root) {
  'use strict';
  const EM = (root.EM = root.EM || {});
  const K = ((EM.qm = EM.qm || {}).K = EM.qm.K || {});
  const fm = (EM.fm = EM.fm || {});
  const P = (fm.pa = {});
  const HBAR_GEVS = 6.582119569e-25, HBARC_MEVFM = 197.3269804, HBARC2_NB = 0.3893793721e6;      /* (ħc)² = 0.38938 GeV² mb = 3.8938×10⁵ GeV² nb */
  P.HBAR_GEVS = HBAR_GEVS;
  const idx = new Map(); for (const r of fm.pdg) idx.set(r.id, r);
  P.get = (id) => idx.get(id);
  /* ---- modelo de quarks ---- */
  const QQ3 = { u: 2, d: -1, s: -1, c: 2, b: -1, t: 2 };
  P.quarkList = (str) => { const out = []; for (const ch of str) { const lo = ch.toLowerCase(); if (QQ3[lo] !== undefined) out.push({ f: lo, anti: ch !== lo }); } return out; };
  P.chargeFromQuarks = (str) => P.quarkList(str).reduce((s, q) => s + (q.anti ? -QQ3[q.f] : QQ3[q.f]), 0);              /* en tercios de e */
  P.baryonFromQuarks = (str) => P.quarkList(str).reduce((s, q) => s + (q.anti ? -1 : 1), 0);                              /* en tercios */
  P.strangeness = (str) => 0 - P.quarkList(str).reduce((s, q) => s + (q.f === 's' ? (q.anti ? -1 : 1) : 0), 0);
  /* ---- números cuánticos de las partículas de las reacciones (anti: prefijo ~) ---- */
  const BASE = {
    'e-': [-3, 0, 1, 0, 0, 0], 'mu-': [-3, 0, 0, 1, 0, 0], 'tau-': [-3, 0, 0, 0, 1, 0], 'nu_e': [0, 0, 1, 0, 0, 0], 'nu_mu': [0, 0, 0, 1, 0, 0], 'nu_tau': [0, 0, 0, 0, 1, 0], 'gamma': [0, 0, 0, 0, 0, 0],
    'p': [3, 3, 0, 0, 0, 0], 'n': [0, 3, 0, 0, 0, 0], 'pi+': [3, 0, 0, 0, 0, 0], 'pi0': [0, 0, 0, 0, 0, 0], 'pi-': [-3, 0, 0, 0, 0, 0], 'K+': [3, 0, 0, 0, 0, 1], 'K-': [-3, 0, 0, 0, 0, -1], 'K0': [0, 0, 0, 0, 0, 1], '~K0': [0, 0, 0, 0, 0, -1],
    'Lambda': [0, 3, 0, 0, 0, -1], 'Sigma+': [3, 3, 0, 0, 0, -1], 'Sigma0': [0, 3, 0, 0, 0, -1], 'Sigma-': [-3, 3, 0, 0, 0, -1], 'Xi0': [0, 3, 0, 0, 0, -2], 'Xi-': [-3, 3, 0, 0, 0, -2], 'Omega-': [-3, 3, 0, 0, 0, -3], 'eta': [0, 0, 0, 0, 0, 0], 'rho0': [0, 0, 0, 0, 0, 0], 'Delta++': [6, 3, 0, 0, 0, 0],
  };
  /* orden: [carga×3, bariónico×3, L_e, L_μ, L_τ, S]; positrón y antipartículas por reflexión de signos */
  P.qn = function (name) {
    if (BASE[name]) return BASE[name];
    if (name === 'e+') return BASE['e-'].map((x) => -x); if (name === 'mu+') return BASE['mu-'].map((x) => -x); if (name === 'tau+') return BASE['tau-'].map((x) => -x);
    if (name.startsWith('~')) { const b = P.qn(name.slice(1)); return b.map((x) => -x); }
    throw new Error('partícula desconocida: ' + name);
  };
  const NAMES = ['carga', 'número bariónico', 'L_e', 'L_μ', 'L_τ', 'extrañeza'];
  P.check = function (inn, out) {
    const sum = (list) => list.reduce((s, n) => { const q = P.qn(n); return s.map((x, i) => x + q[i]); }, [0, 0, 0, 0, 0, 0]), a = sum(inn), b = sum(out);
    const ok = a.map((x, i) => x === b[i]); return { ok, strongAllowed: ok.every(Boolean), weakAllowed: ok.slice(0, 5).every(Boolean), violated: NAMES.filter((n, i) => !ok[i]) };
  };
  /* ---- cinemática de la desintegración de dos cuerpos: p* = √[(M² − (m₁ + m₂)²)(M² − (m₁ − m₂)²)]/2M ---- */
  P.pStar = (M, m1, m2) => Math.sqrt(Math.max(0, (M * M - (m1 + m2) ** 2) * (M * M - (m1 - m2) ** 2))) / (2 * M);
  P.T1 = (M, m1, m2) => Math.sqrt(P.pStar(M, m1, m2) ** 2 + m1 * m1) - m1;
  /* ---- interacción débil ---- */
  P.GF = 1.1663788e-5;                                                                     /* GeV⁻² */
  P.muonLifetime = (GF, mmu_GeV) => (192 * Math.PI ** 3 * HBAR_GEVS) / (GF * GF * Math.pow(mmu_GeV, 5));        /* s, sin correcciones radiativas */
  P.pionRatio = (mpi, me, mmu) => Math.pow(me / mmu, 2) * Math.pow((mpi * mpi - me * me) / (mpi * mpi - mmu * mmu), 2);
  P.GammaZnunu = (GF, MZ) => (GF * Math.pow(MZ, 3)) / (12 * Math.SQRT2 * Math.PI);                              /* GeV, nivel árbol por familia */
  P.MWtree = (GF, sin2) => Math.sqrt((Math.PI / 137.035999084) / (Math.SQRT2 * GF)) / Math.sqrt(sin2);
  /* línea de forma del Z (σ hadrónica, nb); s en GeV²; anchuras en GeV */
  P.sigmaZ = (rs, MZ, GZ, Gee, Ghad) => { const s = rs * rs; return ((12 * Math.PI * Gee * Ghad) / (MZ * MZ)) * (s / ((s - MZ * MZ) ** 2 + (s * s * GZ * GZ) / (MZ * MZ))) * HBARC2_NB; };
  P.sigmaPeak = (MZ, GZ, Gee, Ghad) => ((12 * Math.PI * Gee * Ghad) / (MZ * MZ * GZ * GZ)) * HBARC2_NB;          /* nb */
  /* ---- oscilaciones de neutrinos (dos sabores): P = sin²2θ sen²(1.26693 Δm²[eV²] L[km]/E[GeV]) ---- */
  P.osc2 = (theta, dm2, L, E) => Math.pow(Math.sin(2 * theta), 2) * Math.pow(Math.sin(1.26693 * dm2 * L / E), 2);
  P.oscLength = (dm2, E) => Math.PI * E / (2 * 1.26693 * dm2);                              /* L del primer máximo (km) */
  /* ---- matrices de mezcla CKM/PMNS en la parametrización estándar: devuelve [[re, im]] 3×3 ---- */
  P.mixing = function (t12, t23, t13, dl) {
    const c12 = Math.cos(t12), s12 = Math.sin(t12), c23 = Math.cos(t23), s23 = Math.sin(t23), c13 = Math.cos(t13), s13 = Math.sin(t13), ce = [Math.cos(dl), Math.sin(dl)], cn = [Math.cos(dl), -Math.sin(dl)];
    const cm = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]], sc = (k, a) => [k * a[0], k * a[1]], ad = (a, b) => [a[0] + b[0], a[1] + b[1]];
    return [
      [[c12 * c13, 0], [s12 * c13, 0], sc(s13, cn)],
      [ad(sc(-s12 * c23, [1, 0]), sc(-c12 * s23 * s13, ce)), ad(sc(c12 * c23, [1, 0]), sc(-s12 * s23 * s13, ce)), [s23 * c13, 0]],
      [ad(sc(s12 * s23, [1, 0]), sc(-c12 * c23 * s13, ce)), ad(sc(-c12 * s23, [1, 0]), sc(-s12 * c23 * s13, ce)), [c23 * c13, 0]],
    ];
  };
  P.unitarityDev = function (U) {
    let m = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { let re = 0, im = 0; for (let k = 0; k < 3; k++) { const a = U[k][i], b = U[k][j]; re += a[0] * b[0] + a[1] * b[1]; im += a[0] * b[1] - a[1] * b[0]; } m = Math.max(m, Math.abs(re - (i === j ? 1 : 0)), Math.abs(im)); } return m;
  };
  P.absMatrix = (U) => U.map((r) => r.map((z) => Math.hypot(z[0], z[1])));
  /* ---- fórmula de Gell-Mann–Okubo del octete bariónico: (m_N + m_Ξ)/2 = (3m_Λ + m_Σ)/4 ---- */
  P.avg = (ids) => ids.reduce((s, i) => s + P.get(i).m, 0) / ids.length;
  P.gmo = () => ({ left: (P.avg([2212, 2112]) + P.avg([3322, 3312])) / 2, right: (3 * P.get(3122).m + P.avg([3222, 3212, 3112])) / 4 });
  P.decupletMasses = () => [P.avg([2224, 2214, 1114]), P.avg([3224, 3214, 3114]), P.avg([3324, 3314]), P.get(3334).m];
})(typeof window !== 'undefined' ? window : globalThis);
