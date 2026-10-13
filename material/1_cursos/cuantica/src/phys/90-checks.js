/* ===================================================================
   phys/90-checks.js — Catálogo de validaciones del núcleo físico.
   Cada prueba compara un cálculo del curso con un resultado exacto,
   una referencia publicada o una identidad matemática. La ejecutan
   tests/validar.js (Node) y el apéndice «Validación» (navegador).
   Formato: {cap, id, what, ref, src, tol, rel, unit, fn() → valor}
   (rel = true: tolerancia relativa; si no, absoluta).
   =================================================================== */
(function (root) {
  'use strict';
  const CQ = (root.CQ = root.CQ || {});
  const P = (CQ.P = CQ.P || {});
  const C = [];
  const add = (cap, id, what, ref, src, tol, fn, o = {}) => C.push(Object.assign({ cap, id, what, ref, src, tol, fn }, o));
  P.CHECKS = C;
  const K = () => P.K;

  /* ---------- 1 · Crisis de la física clásica ---------- */
  add(1, 'wien', 'Ley de Wien: λ_max·T del máximo numérico de Planck', 2.897771955e-3, 'CODATA 2018 (b)', 1e-6, () => {
    const T = 5000, h = K().h, c = K().c, k = K().kB;
    const B = (l) => (2 * h * c * c) / l ** 5 / (Math.exp((h * c) / (l * k * T)) - 1);
    return P.util.golden((l) => -B(l), 100e-9, 3000e-9, 1e-14).x * T;
  }, { rel: true, unit: 'm·K' });
  add(1, 'stefan', 'Stefan–Boltzmann: σ al integrar la ley de Planck', 5.670374419e-8, 'CODATA 2018 (σ)', 1e-6, () => {
    /* ∫ x³/(eˣ−1) dx = π⁴/15 → σ = 2π⁵k⁴/(15h³c²); aquí se integra numéricamente */
    const J = P.integ.fn((x) => (x < 1e-9 ? x * x : (x ** 3) / (Math.exp(x) - 1)), 0, 60, 6000);
    const { h, c, kB } = K();
    return (2 * Math.PI * kB ** 4 * J) / (h ** 3 * c * c);
  }, { rel: true, unit: 'W/(m²K⁴)' });
  add(1, 'balmer', 'Hα de Balmer con la constante de Rydberg del hidrógeno', 656.47, 'NIST (vacío)', 2e-4, () => 1e9 * 36 / (5 * 1.09677583e7), { rel: true, unit: 'nm' });

  /* ---------- 2 · Función de onda ---------- */
  const cnRun = () => {
    const Q = P.q1d;
    const x = P.util.linspace(-60, 60, 4801);
    let [re, im] = Q.gaussPacket(x, -20, 1, 2);
    const cn = new Q.CrankNicolson(x, () => 0, 0.005);
    for (let s = 0; s < 1000; s++) [re, im] = cn.step(re, im);
    return Q.moments(x, re, im);
  };
  add(2, 'cn-norm', 'Crank–Nicolson conserva la norma (1000 pasos)', 1, 'unitariedad', 1e-10, () => cnRun().norm);
  add(2, 'cn-width', 'Anchura del paquete libre en t = 5: σ₀√(1+(t/2σ₀²)²)', Math.sqrt(7.25), 'solución exacta', 2e-3, () => cnRun().sigma, { rel: true });
  add(2, 'minunc', 'Paquete gaussiano: Δx·Δp = ħ/2', 0.5, 'desigualdad de Heisenberg (igualdad)', 2e-4, () => {
    const Q = P.q1d, x = P.util.linspace(-20, 20, 8001);
    const [re, im] = Q.gaussPacket(x, 0, 1.3, 0);
    return Q.moments(x, re, im).sigma * Q.momentumStats(x, re, im).sigma;
  }, { rel: true });

  /* ---------- 3 · Formalismo ---------- */
  add(3, 'twolevel', 'Dos niveles: autovalor inferior (Jacobi) = ε̄ − √(Δ²/4 + t²)', -1.4142135624, 'fórmula cerrada (ε = ±1, t = 1)', 1e-10, () => P.la.jacobi([[1, -1], [-1, -1]]).values[0]);
  add(3, 'herm', 'Matriz hermítica 3×3: autovalores reales por inmersión 2n', 3.0, 'traza = Σ autovalores', 1e-10, () => {
    const Re = [[1, 0.5, 0], [0.5, 2, 0.3], [0, 0.3, 0]], Im = [[0, 0.2, -0.1], [-0.2, 0, 0.4], [0.1, -0.4, 0]];
    return P.util.sum(P.la.eighC(Re, Im).values);
  });

  /* ---------- 4 · Pozos y barreras ---------- */
  add(4, 'box1', 'Pozo infinito (L = 2): E₁ por diferencias finitas', Math.PI ** 2 / 8, 'π²ħ²/(2mL²)', 1e-5, () => P.q1d.fdEigen(() => 0, -1, 1, 2000, 1).E[0], { rel: true });
  add(4, 'finwell', 'Pozo finito (V₀ = 10, L = 2): E₀ con malla alineada', -9.1802603, 'raíz de tan z = √(z₀²−z²)/z', 2e-4, () => {
    const V = (x) => (Math.abs(x) < 1 - 1e-12 ? -10 : Math.abs(Math.abs(x) - 1) < 1e-9 ? -5 : 0);
    return P.q1d.fdEigen(V, -6, 6, 4799, 1).E[0];
  }, { rel: true });
  add(4, 'barrier', 'Barrera rectangular: T(E) por matriz de transferencia', P.q1d ? P.q1d.exact.barrierT(0.5, 1, 1.5) : 0, 'fórmula analítica', 1e-10, () => P.q1d.transfer(0.5, [{ x0: 0, x1: 1.5, V: 1 }]).T);

  /* ---------- 5 · Oscilador y métodos numéricos ---------- */
  add(5, 'ho3', 'Oscilador armónico: E₃ numérico', 3.5, 'ħω(n + ½)', 3e-5, () => P.q1d.fdEigen((x) => 0.5 * x * x, -9, 9, 3000, 4).E[3], { rel: true });
  add(5, 'morse0', 'Morse (Dₑ = 10, a = 0.7): E₀ numérico', P.q1d ? P.q1d.exact.morseE(0, 10, 0.7) : 0, 'fórmula exacta de Morse', 5e-5, () => P.q1d.fdEigen((x) => 10 * (1 - Math.exp(-0.7 * x)) ** 2, -2.5, 14, 3000, 1).E[0], { rel: true });
  add(5, 'pt', 'Pöschl–Teller (λ = 4): E₁ numérico', -4.5, '−(λ−n)²/2', 5e-5, () => P.q1d.fdEigen((x) => -10 / Math.cosh(x) ** 2, -9, 9, 3000, 2).E[1], { rel: true });

  /* ---------- 6 · Hidrógeno ---------- */
  const hgrid = () => { const g = P.atom.grid({ rmax: 120, N: 3001 }); const V = new Float64Array(g.N); for (let i = 0; i < g.N; i++) V[i] = -1 / g.r[i]; return { g, V }; };
  add(6, 'h1s', 'Hidrógeno 1s (Numerov en malla logarítmica)', -0.5, '−1/(2n²) Ha', 1e-9, () => { const { g, V } = hgrid(); return P.atom.solveRadial(g, V, 0, 0).E; });
  add(6, 'h3d', 'Hidrógeno 3d', -1 / 18, '−1/(2n²) Ha', 1e-9, () => { const { g, V } = hgrid(); return P.atom.solveRadial(g, V, 2, 0).E; });
  add(6, 'h4f', 'Hidrógeno 4f (l = 3)', -1 / 32, '−1/(2n²) Ha', 1e-8, () => { const { g, V } = hgrid(); return P.atom.solveRadial(g, V, 3, 0).E; });
  add(6, 'rmean', '⟨r⟩ del estado 2p por integración de R₂₁', 5, '[3n² − l(l+1)]/2 a₀', 1e-8, () => P.integ.fn((r) => r ** 3 * P.atom.hR(2, 1, r) ** 2, 0, 80, 8000), { rel: true });
  add(6, 'norm32', 'Normalización ∫ r² R₃₂² dr', 1, 'ortonormalidad', 1e-9, () => P.integ.fn((r) => r * r * P.atom.hR(3, 2, r) ** 2, 0, 120, 12000));
  add(6, 'rmp', 'Radio más probable del 1s', 1, 'a₀ (radio de Bohr)', 1e-6, () => P.atom.hRmostProbable(1, 0));

  /* ---------- 8 · Átomos ---------- */
  add(7, 'cr', 'Configuración del cromo termina en 3d⁵ 4s¹ (1 = sí)', 1, 'NIST: [Ar] 3d⁵ 4s¹', 0, () => (P.atom.configStr(P.atom.config(24)).endsWith('3d⁵ 4s¹') ? 1 : 0));
  add(7, 'cu', 'Configuración del cobre termina en 3d¹⁰ 4s¹ (1 = sí)', 1, 'NIST: [Ar] 3d¹⁰ 4s¹', 0, () => (P.atom.configStr(P.atom.config(29)).endsWith('3d¹⁰ 4s¹') ? 1 : 0));
  add(7, 'nel', 'Configuraciones de Z = 1 a 36 con exactamente Z electrones', 36, 'conteo', 0, () => { let ok = 0; for (let Z = 1; Z <= 36; Z++) if (P.atom.config(Z).reduce((s, o) => s + o.f, 0) === Z) ok++; return ok; });
  add(8, 'hevar','Helio variacional: E(ζ) mínimo con ζ = 27/16', -2.84765625, '−(27/16)² Ha', 1e-9, () => P.util.golden((z) => P.atom.heliumVar(z), 1, 2.5, 1e-12).f);
  add(8, 'slaterC', 'Reglas de Slater: Z_eff del 2p del carbono', 3.25, 'Slater (1930)', 1e-12, () => P.atom.slaterZeff(6, 2, 1));
  add(8, 'slaterN', 'Reglas de Slater: Z_eff del 2p del nitrógeno', 3.90, 'Slater (1930)', 1e-12, () => P.atom.slaterZeff(7, 2, 1));

  /* ---------- 9 · Métodos aproximados ---------- */
  add(9, 'gauss1', 'Una gaussiana para el hidrógeno: E mínima', -4 / (3 * Math.PI), '−4/(3π) Ha', 1e-9, () => P.util.golden((a) => P.atom.gauss1(a), 0.05, 1, 1e-12).f);
  add(9, 'gauss10', 'Diez gaussianas en progresión geométrica (Rayleigh–Ritz)', -0.5, 'energía exacta', 1e-4, () => {
    const al = Array.from({ length: 10 }, (_, k) => 0.02 * Math.pow(3.2, k));
    return P.atom.gaussH(al).E;
  });
  add(9, 'pert', 'Oscilador anarmónico (λ = 0.01): E₀ ≈ ½ + ¾λ − (21/8)λ²', 0.5 + 0.0075 - (21 / 8) * 1e-4, 'perturbaciones a 2.º orden', 3e-5, () => P.q1d.fdEigen((x) => 0.5 * x * x + 0.01 * x ** 4, -8, 8, 3000, 1).E[0]);

  /* ---------- 10 · Enlace químico ---------- */
  add(10, 'h2pR', 'H₂⁺ LCAO (ζ = 1): distancia de equilibrio', 2.4928, 'Pauling (1928); textos de química cuántica', 2e-4, () => P.mol.h2pMin(false, 1).R, { rel: true, unit: 'a₀' });
  add(10, 'h2pE', 'H₂⁺ LCAO (ζ = 1): energía mínima', -0.56483, 'LCAO clásica', 2e-5, () => P.mol.h2pMin(false, 1).E, { unit: 'Ha' });
  add(10, 'h2pZ', 'H₂⁺ con ζ optimizado (Finkelstein–Horowitz): energía', -0.58651, 'Finkelstein y Horowitz (1928)', 2e-5, () => P.mol.h2pMin(true).E, { unit: 'Ha' });

  /* ---------- 11 · Hückel ---------- */
  add(11, 'benz', 'Benceno: nivel más bajo α + 2β (β = −1)', -2, 'Hückel (1931)', 1e-10, () => P.mol.huckel(P.mol.LIBRARY.benceno.make(), { alpha: { C: 0 }, beta: { default: -1 } }).E[0]);
  add(11, 'boraz', 'Borazina (α = ±1, β = −1): brecha HOMO–LUMO = 2√2', 2 * Math.SQRT2, '±√(Δ² + |β|²|1 + e^{±2πi/3}|²)', 1e-10, () => { const E = P.mol.huckel(P.mol.LIBRARY.borazina.make(), { alpha: { B: 1, N: -1 }, beta: { default: -1 } }).E; return E[3] - E[2]; });
  add(11, 'chain', 'Cadena de 10 sitios: nivel más bajo = α + 2β cos(π/11)', -2 * Math.cos(Math.PI / 11), 'solución analítica', 1e-10, () => P.tb.ringTB(new Array(10).fill(0), 1, true).values[0]);

  /* ---------- 12–14 · Cristales, bandas, grafeno y h-BN ---------- */
  add(12, 'aBN', 'Parámetro de red de h-BN: a = √3·d (d = 1.446 Å)', 2.504, 'experimento (2.504 Å)', 1e-3, () => P.tb.honeycomb(1.446).a, { rel: true, unit: 'Å' });
  add(12, 'recip', 'Red recíproca: a₁·b₁ = 2π', 2 * Math.PI, 'definición', 1e-12, () => { const l = P.tb.honeycomb(1.42); return l.a1[0] * l.b1[0] + l.a1[1] * l.b1[1]; });
  add(13, 'ring', 'Anillo de 12 sitios: autovalores = −2t cos(2πm/N)', -2, 'teorema de Bloch', 1e-10, () => P.tb.ringTB(new Array(12).fill(0), 1).values[0]);
  add(13, 'dimgap', 'Cadena diatómica (t₁ = t₂): brecha en k = π/a = |ε_A − ε_B|', 1.2, 'fórmula cerrada', 1e-12, () => { const e = P.tb.chain2(Math.PI, 1, 0.6, -0.6, 1, 1); return e[1] - e[0]; });
  add(14, 'fK', 'Grafeno: |f(K)| = 0 (cono de Dirac)', 0, 'simetría', 1e-12, () => { const l = P.tb.honeycomb(1.42); return Math.hypot(...P.tb.fk(l.K[0], l.K[1], l)); });
  add(14, 'gapBN', 'h-BN: brecha en K = ε_B − ε_N', 4.6, 'modelo π de dos sitios', 1e-12, () => { const l = P.tb.honeycomb(1.446); const b = P.tb.bands2(l.K[0], l.K[1], l, 2.3, -2.3, 2.3); return b[1] - b[0]; }, { unit: 'eV' });
  add(14, 'vF', 'Grafeno: velocidad de Fermi numérica = 3td/(2ħ)', (3 * 2.7 * 1.42e-10) / (2 * 6.582119569e-16), 'desarrollo cerca de K', 2e-3, () => {
    /* pendiente dE/dk a 10⁻⁴ Å⁻¹ del punto K: (eV·Å) → (eV·m) / ħ(eV·s) */
    const l = P.tb.honeycomb(1.42), q = 1e-4;
    const E = P.tb.bands2(l.K[0] + q, l.K[1], l, 0, 0, 2.7)[1];
    return ((E / q) * 1e-10) / 6.582119569e-16;
  }, { rel: true, unit: 'm/s' });
  add(14, 'lieb', 'Copo triangular zigzag de orden 4: modos de energía cero', 3, 'teorema de Lieb |N_A − N_B|', 0, () => {
    const fl = P.tb.flake('tri', 4, 1.42); fl.sites.forEach((s) => { s.s = 'C'; });
    return Array.from(P.la.eigh(P.tb.flakeHamiltonian(fl, () => 0, () => 2.7), { vectors: false }).values).filter((v) => Math.abs(v) < 1e-7).length;
  });
  add(14, 'zzedge', 'Nanocinta zigzag de grafeno: estados de borde en k = π', 2, 'Fujita et al. (1996)', 0, () => {
    const r = P.tb.ribbonBands(P.tb.zigzagRibbon(8, 1.42), () => 0, () => 2.7, 20);
    return r.E[r.E.length - 1].filter((e) => Math.abs(e) < 1e-6).length;
  });

  /* ---------- 15–17 · Hartree–Fock y DFT ---------- */
  add(16, 'uH', 'Energía de Hartree de la densidad 1s del hidrógeno', 0.3125, '5/16 Ha (analítica)', 1e-7, () => {
    const g = P.atom.grid(), n = Float64Array.from(g.r, (r) => Math.exp(-2 * r) / Math.PI);
    const { VH } = P.atom.hartree(g, n);
    return 0.5 * P.atom.int3(g, n.map((v, i) => v * VH[i]));
  }, { unit: 'Ha' });
  add(15, 'hfHe', 'Helio Hartree–Fock: energía total', -2.861680, 'Clementi y Roetti (1974)', 2e-6, () => P.atom.solve({ Z: 2, method: 'hf' }).Etot, { unit: 'Ha' });
  add(15, 'hfHeE', 'Helio Hartree–Fock: autovalor 1s', -0.917956, 'Clementi y Roetti (1974)', 2e-6, () => P.atom.solve({ Z: 2, method: 'hf' }).eig[0].E, { unit: 'Ha' });
  add(15, 'hfH', 'Hidrógeno con Hartree–Fock: sin autointeracción', -0.5, 'exacto', 1e-8, () => P.atom.solve({ Z: 1, method: 'hf' }).Etot, { unit: 'Ha' });
  for (const Z of [1, 2, 4, 6, 7, 8, 10, 18]) {
    const ref = P.atom ? P.atom.NIST_LDA[Z].E : 0;
    add(17, 'lda' + Z, `LDA sin espín, ${P.atom ? P.atom.SYM[Z] : Z}: energía total`, ref, 'NIST (Kotochigova et al. 1997)', 2e-6, () => P.atom.solve({ Z, method: 'lda' }).Etot, { unit: 'Ha' });
  }
  add(17, 'ldaN2p', 'LDA del nitrógeno: autovalor 2p', -0.266297, 'NIST', 2e-6, () => P.atom.solve({ Z: 7, method: 'lda' }).eig[2].E, { unit: 'Ha' });
  add(17, 'ldaNe1s', 'LDA del neón: autovalor 1s', -30.305855, 'NIST', 3e-6, () => P.atom.solve({ Z: 10, method: 'lda' }).eig[0].E, { unit: 'Ha' });
  add(17, 'virial', 'Virial con intercambio LDA (neón, funcional homogéneo): E + T_s = 0', 0, 'virial (2T + V = 0)', 2e-5, () => { const r = P.atom.solve({ Z: 10, method: 'x' }); return r.Etot + r.Ts; });
  add(15, 'virialHF', 'Virial en Hartree–Fock del helio: E + T = 0', 0, 'virial (2T + V = 0)', 2e-6, () => { const r = P.atom.solve({ Z: 2, method: 'hf' }); return r.Etot + r.Ts; });
  add(17, 'exgas', 'Intercambio del gas homogéneo: ε_x·r_s', -0.4581653, '−(3/4)(9/4π²)^{1/3} Ha', 1e-7, () => { const n = 0.01; return P.atom.xc.ex(n) * P.atom.xc.rs(n); });
  add(17, 'ecHe', 'Correlación LDA (VWN) del helio con su densidad LDA', -0.1115, 'valor de la literatura ≈ −0.112 Ha', 2e-3, () => P.atom.solve({ Z: 2, method: 'lda' }).Ec, { unit: 'Ha' });
  const psN = () => { const s = new P.atom.AtomSCF({ Z: 7, method: 'lda' }); s.run(); const k = 2; const ps = P.atom.kerker(s.g, s.orbs[k].u, s.Vin, s.orbs[k].E, 1, 1.5); return { s, k, ps }; };
  add(18, 'psNorm', 'Pseudopotencial de Kerker (N 2p, r_c = 1.5 a₀): conservación de la norma', 0, 'condición de norma', 1e-8, () => { const { ps } = psN(); return ps.qPS - ps.qAE; });
  add(18, 'psEig', 'Pseudopotencial de Kerker (N 2p): autovalor del pseudoorbital sin nodos', -0.2662968, 'autovalor todo-electrón LDA', 2e-5, () => { const { s, k, ps } = psN(); return P.atom.solveRadial(s.g, ps.Vps, 1, 0, { E: s.orbs[k].E }).E; }, { unit: 'Ha' });

  /* ---------- 19–23 · Estadística y mecánica estadística ---------- */
  add(19, 't4', 'Cuantil 97.5 % de la t de Student con 4 g.l.', 2.776445, 'tablas', 1e-6, () => P.stat.tQuantile(0.975, 4));
  add(19, 't19', 'Cuantil 97.5 % de la t de Student con 19 g.l.', 2.093024, 'tablas', 1e-6, () => P.stat.tQuantile(0.975, 19));
  add(19, 'z196', 'Normal estándar: Φ(1.96)', 0.9750021, 'tablas', 1e-7, () => P.stat.normCDF(1.96));
  add(20, 'stirling', 'ln C(1000, 300) = N·s(x) − ½ ln(2πN x(1−x)) (Stirling refinada)', 1000 * (-0.3 * Math.log(0.3) - 0.7 * Math.log(0.7)) - 0.5 * Math.log(2 * Math.PI * 1000 * 0.21), 'aproximación de Stirling con corrección', 5e-4, () => P.sf.logBinom(1000, 300));
  add(21, 'schottky', 'Pico de Schottky en k_BT/Δ', 0.41678, 'dos niveles', 1e-4, () => P.util.golden((x) => -P.sm.schottky(1 / x), 0.1, 2).x, { rel: true });
  add(21, 'dulong', 'Einstein a alta T (T = 50 θ_E): C → 3Nk (Dulong–Petit)', 1, 'equipartición', 1e-4, () => P.sm.einsteinC(0.02));
  add(21, 'debye', 'Debye a baja T: C/(3Nk) = (4π⁴/5)(T/θ)³', (4 * Math.PI ** 4) / 5 * 1e-6, 'ley T³', 2e-3, () => P.sm.debyeC(0.01), { rel: true });
  add(21, 'fluct', 'Tres niveles: C por fluctuaciones = dU/dT numérica', 0, 'Var(E) = k_BT² C', 1e-7, () => {
    const E = [0, 0.3, 1.1], kT = 0.4, h = 1e-5;
    const c1 = P.sm.levels(E, null, kT).C, du = (P.sm.levels(E, null, kT + h).U - P.sm.levels(E, null, kT - h).U) / (2 * h);
    return c1 - du;
  });
  add(21, 'acc5000', 'Aceptación del intercambio B↔N (6.24 eV) a 5000 K', 5.1e-7, 'docs/INFORME_CIENTIFICO.md §2', 0.03, () => Math.exp(-P.hbn.swapBN() / (P.hbn.KB * 5000)), { rel: true });
  add(21, 'acc20000', 'Aceptación del intercambio B↔N a 20 000 K', 2.7e-2, 'docs/INFORME_CIENTIFICO.md §2', 0.03, () => Math.exp(-P.hbn.swapBN() / (P.hbn.KB * 20000)), { rel: true });
  add(22, 'sH2', 'Entropía estándar del H₂ a 298.15 K', 130.68, 'NIST-JANAF', 2e-3, () => P.sm.h2Thermo(298.15, 1e5).S, { rel: true, unit: 'J/(mol·K)' });
  add(22, 'langmuir', 'Langmuir: cobertura ½ cuando μ = ε', 0.5, 'definición', 1e-14, () => P.sm.langmuir(-1.3, -1.3, 0.1));
  add(23, 'tc', 'Ising cuadrado: T_c de Onsager', 2.269185, '2/ln(1+√2)', 1e-6, () => P.sm.onsager.Tc);
  add(23, 'uc', 'Ising cuadrado: energía por espín en T_c', -Math.SQRT2, 'Onsager (1944)', 1e-5, () => P.sm.onsager.u(P.sm.onsager.Tc));
  add(23, 'tchc', 'Ising en el panal: T_c exacta', 1.518651, 'tanh(J/kT_c) = 1/√3', 1e-6, () => P.sm.TcHoneycomb);

  /* ---------- 24–26 · Monte Carlo ---------- */
  add(24, 'markov', 'Cadena de Markov de Metropolis → población de Boltzmann', 0, 'balance detallado', 1e-10, () => {
    const E = [0, 0.5, 1.2], kT = 0.6, T = P.sm.markov3(E, kT);
    let p = [1, 0, 0];
    for (let s = 0; s < 3000; s++) p = P.sm.markovStep(p, T);
    const b = P.sm.levels(E, null, kT).p;
    return Math.max(...p.map((v, i) => Math.abs(v - b[i])));
  });
  add(24, 'metro1d', 'Metropolis en V = x²/2 con T = 0.7: ⟨x²⟩ = T', 0.7, 'equipartición', 0.03, () => {
    const r = P.sm.metro1D((x) => 0.5 * x * x, 0, 0.7, 1.8, 400000, P.rng(11));
    let s = 0; for (let i = 20000; i < r.xs.length; i++) s += r.xs[i] ** 2;
    return s / (r.xs.length - 20000);
  }, { rel: true });
  add(25, 'ising4', 'Ising 4×4 por Metropolis (T = 2): energía por espín', P.sm ? P.sm.isingExact(4, 2).e : 0, 'enumeración exacta de 2¹⁶ estados', 4e-3, () => {
    const is = new P.sm.Ising(4, P.rng(5), { start: 'up' });
    let e = 0, n = 0;
    for (let s = 0; s < 120000; s++) { is.sweep(2); if (s > 2000) { e += is.energy().E; n++; } }
    return e / n / 16;
  }, { rel: true });
  add(26, 'pt', 'Intercambio de réplicas en un doble pozo: fracción en x > 0', 0.5, 'simetría del paisaje', 0.03, () => {
    const V = (x) => ((x * x - 4) ** 2) / 2 + 0.3 * Math.cos(6 * x);
    const pt = new P.sm.PT1D(V, [0.25, 0.45, 0.8, 1.4, 2.5], 0.4, P.rng(21), -2);
    let right = 0, n = 0;
    for (let s = 0; s < 200000; s++) { pt.sweep(4); if (s > 2000) { n++; if (pt.x[0] > 0) right++; } }
    return right / n;
  });

  /* ---------- 27–29 · El modelo de hBN-MC ---------- */
  const fit = () => P.hbn.fit(P.hbn.MAZZONI);
  const T58 = { NN: -185.29, NB: -128.1626, BB: -67.9148, CC: -107.32, CN: -147.02, CB: -88.01 };
  for (const k of Object.keys(T58)) add(27, 'fit' + k, `Reajuste de Mazzoni: ε_${k}`, T58[k], 'Tesis 2019, Tabla 5.8', 0.006, () => fit().params[k], { unit: 'eV' });
  add(27, 'fitRMS', 'Reajuste de Mazzoni: RMS por celda', 0.630, 'docs/INFORME_CIENTIFICO.md §1', 5e-4, () => fit().rms, { unit: 'eV' });
  add(27, 'fitR2', 'Reajuste de Mazzoni: R²', 0.99996, 'docs/INFORME_CIENTIFICO.md §1', 2e-6, () => fit().R2);
  add(27, 'fitLOO', 'Reajuste de Mazzoni: RMS de validación cruzada', 0.904, 'docs/INFORME_CIENTIFICO.md §1', 5e-4, () => fit().looRms, { unit: 'eV' });
  add(27, 'swap', 'Intercambio B↔N: 2(ε_NN + ε_BB) − 4ε_NB', 6.24, 'docs/INFORME_CIENTIFICO.md §2', 0.001, () => P.hbn.swapBN(), { unit: 'eV' });
  add(27, 'mix', 'Energía de mezcla BN–C por par de enlaces mixtos', 0.45, 'docs/REVISION_ARTICULO.md §B', 0.003, () => P.hbn.mixBNC(), { unit: 'eV' });
  add(27, 'singular', 'Sin la familia B₂C₄N₂ el ajuste no es identificable (1 = singular)', 1, 'dependencia lineal de las composiciones', 0, () => {
    const rows = P.hbn.MAZZONI.filter((r) => { const a = P.hbn.atomsFromBonds(r.n); return !(a.B === 2 && a.C === 4 && a.N === 2); });
    return P.hbn.fit(rows).ok ? 0 : 1;
  });
  add(28, 'eHt', 'Energía de borde por H, reservorio de la tesis', -8.4586, '−(ε_NB − ε_XN − ε_XB)/2 − ε_XX/2 (informe: −8.46)', 1e-6, () => P.hbn.edgePerH('tesis', 0), { unit: 'eV' });
  add(28, 'eH0', 'Energía de borde por H, gran canónico H₂ con Δμ_H = 0', -0.94, 'docs/INFORME_CIENTIFICO.md §3.1', 0.004, () => P.hbn.edgePerH('H2', 0), { unit: 'eV' });
  add(28, 'eH15', 'Energía de borde por H, gran canónico H₂ con Δμ_H = −1.5 eV', 0.56, 'docs/INFORME_CIENTIFICO.md §3.1', 0.004, () => P.hbn.edgePerH('H2', -1.5), { unit: 'eV' });
  add(28, 'winD', 'Ventana química (μ_BN = E(BN)): se abre para Δμ_H ≤', -0.224, 'docs/INFORME_CIENTIFICO.md §4.1', 0.001, () => P.hbn.window(0, 'dft').dmuHOpen, { unit: 'eV' });
  add(28, 'winM', 'Ventana química (μ_BN = 3ε_NB): se abre para Δμ_H ≤', -0.596, 'docs/INFORME_CIENTIFICO.md §4.1', 0.001, () => P.hbn.window(0, 'model').dmuHOpen, { unit: 'eV' });
  add(28, 'vb', 'E_form de V_B + 3H en ambiente rico en N (red completa)', -1.026, 'docs/INFORME_CIENTIFICO.md §4.2', 0.001, () => { const L = new P.hbn.Lattice(12); L.s[L.nearest(5, 5, 0)] = 0; return L.formation('Nrich', 0).Eform; }, { unit: 'eV' });
  add(28, 'vn', 'E_form de V_N + 3H en ambiente rico en B (red completa)', -1.056, 'docs/INFORME_CIENTIFICO.md §4.2', 0.001, () => { const L = new P.hbn.Lattice(12); L.s[L.nearest(5, 5, 1)] = 0; return L.formation('Brich', 0).Eform; }, { unit: 'eV' });
  add(28, 'perfect', 'Lámina perfecta: E_form = 0', 0, 'definición de μ_BN = 3ε_NB', 1e-8, () => new P.hbn.Lattice(12).formation('Nrich', 0).Eform);
  add(28, 'edgeId', 'E(fragmentado) − E(triángulo) = ΔN_H·e_H (25 vacancias)', 0, 'identidad de la energía de borde', 1e-7, () => {
    const L = new P.hbn.Lattice(24, { rng: P.rng(3) });
    L.triangle(5, 'N'); const Ec = L.energy(), nc = L.nH();
    L.perfect(); L.monovacancies(15, 2); L.monovacancies(10, 1); const Ef = L.energy(), nf = L.nH();
    return (Ef - Ec) - (nf - nc) * P.hbn.edgePerH('tesis', 0);
  });
  add(28, 'triVB', 'E_form(triángulo n = 4, borde N) − 4·E_form(V_B + 3H), rico en N', 0, 'E_form proporcional a N_H', 1e-8, () => {
    const L = new P.hbn.Lattice(30); L.triangle(4, 'N');
    const mu = P.hbn.envPotentials('Nrich', -1);
    return L.formation('Nrich', -1).Eform - 4 * P.hbn.EformVB3H(mu.muN, mu.muH);
  });
  add(28, 'frag', 'Fragmentar un triángulo de 25 vacancias (reservorio de la tesis)', -507, 'docs/INFORME_CIENTIFICO.md §3.2', 1, () => {
    const a = new P.hbn.Lattice(24); a.triangle(5, 'N');
    const b = new P.hbn.Lattice(24, { rng: P.rng(7) }); b.monovacancies(15, 2); b.monovacancies(10, 1);
    return b.energy() - a.energy();
  }, { unit: 'eV' });
  add(29, 'inf5000', 'Experimento del informe: H₂, Δμ_H = −1.5 eV, 5000 K, 60 000 pasos locales → mayor poro', 24, 'docs/INFORME_CIENTIFICO.md §3.2 (triángulo 24 + 1)', 1, () => {
    const L = new P.hbn.Lattice(24, { rng: P.rng(7), res: 'H2', dmu: -1.5 }); L.triangle(5, 'N'); L.E = L.energy();
    for (let s = 0; s < 60000; s += L.N) L.sweep(5000, Math.min(L.N, 60000 - s), 0);
    return L.pores()[0].n;
  });
  add(29, 'tri','Poro triangular de orden 6 con borde N: vacancias y H', 36 * 1000 + 18, 'n² vacancias, 3n enlaces N–H', 0, () => { const L = new P.hbn.Lattice(30); L.triangle(6, 'N'); const p = L.pores()[0]; return p.n * 1000 + p.eN; });
  add(29, 'dE', 'ΔE local = recálculo completo (200 intercambios con C y vacancias)', 0, 'coherencia del motor', 1e-8, () => {
    const L = new P.hbn.Lattice(12, { rng: P.rng(9), res: 'H2', dmu: -0.7 });
    L.carbonRandom(0.2); L.monovacancies(4, 2); L.monovacancies(3, 1);
    let err = 0;
    for (let q = 0; q < 200; q++) {
      const k = (L.rng() * L.N) | 0, m = q % 2 ? (L.rng() * L.N) | 0 : L.g.nb[3 * k + (q % 3)];
      if (k === m) continue;
      const E0 = L.energy(), d = L.dE(k, m);
      const t = L.s[k]; L.s[k] = L.s[m]; L.s[m] = t;
      err = Math.max(err, Math.abs(L.energy() - E0 - d));
    }
    return err;
  });

  /* Ejecuta una prueba y devuelve {ok, v, err} */
  P.runCheck = function (c) {
    let v;
    try { v = c.fn(); } catch (e) { return { ok: false, v: NaN, err: NaN, msg: String(e && e.message || e) }; }
    const err = c.rel ? Math.abs(v - c.ref) / Math.abs(c.ref) : Math.abs(v - c.ref);
    return { ok: err <= c.tol, v, err };
  };
})(typeof window !== 'undefined' ? window : globalThis);
