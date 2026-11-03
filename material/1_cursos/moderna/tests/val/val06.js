/* Cap. 6 — Relatividad general */
module.exports = function ({ chk, ref, EM, S, Y, L, M_ }) {
  const G = EM.fm.gr, c = EM.qm.K.c, a = ref.astropy_const;
  chk(S, 'G (CODATA 2018) frente a astropy.constants', G.G, a.G, 1e-12); chk(S, 'GM del Sol (IAU 2015) frente a astropy', G.GMsun, a.GMsun, 1e-12); chk(S, 'R del Sol (IAU 2015) frente a astropy', G.Rsun, a.Rsun, 1e-12);
  chk(S, 'GM de la Tierra (IERS) frente al valor nominal IAU 2015 de astropy (3.986004×10¹⁴)', G.GMearth, a.GMearth, 2e-7); chk(S, 'Unidad astronómica frente a astropy', G.AU, a.AU, 1e-12); chk(S, 'Parsec frente a astropy', G.pc, a.pc, 1e-12);
  chk(S, 'M_sol = GM/G frente a astropy.constants.M_sun (IAU 2015)', G.Msun, a.Msun, 1e-4);
  /* GPS */
  for (const r of ref.gps) chk(M_, `Reloj de un satélite en órbita circular (a = ${(r.a / 1e3).toFixed(2)} km): tasa relativa al geoide, aproximación lineal frente a la métrica de Schwarzschild exacta (mpmath, 40 dígitos)`, G.gps(r.a).net, r.rate, 1e-8);
  chk(L, 'Desplazamiento de frecuencia nominal de los relojes GPS: 4.4647×10⁻¹⁰ (IS-GPS-200: 10.23 MHz → 10.22999999543 MHz)', G.gps(26561750).net, 4.4647e-10, 1e-4);
  chk(L, 'GPS: efecto gravitatorio +45.8 µs/día', G.gps(26561750).perDay.gr, 45.78, 2e-3); chk(L, 'GPS: efecto de velocidad −7.2 µs/día', G.gps(26561750).perDay.sr, -7.21, 2e-3);
  chk(L, 'GPS: neto +38.6 µs/día → 11.6 km/día de error de posición si no se corrigiera', (G.gps(26561750).net * 86400 * c) / 1e3, 11.57, 2e-3);
  chk(L, 'Pound–Rebka: Δf/f = gh/c² para h = 22.5 m: 2.457×10⁻¹⁵', G.poundRebka(22.5), 2.45506e-15, 1e-5);
  /* Deflexión */
  for (const r of ref.deflection) chk(S, `Deflexión de la luz en Schwarzschild (b = ${r.B} m): integral frente a la integración de la geodésica nula (DOP853)`, G.deflectionExact(c * c, r.B), r.alpha, 1e-7);
  chk(L, 'Deflexión solar 4GM/(c²R) = 1.751″ (Eddington 1919: 1.61″ ± 0.30 y 1.98″ ± 0.12)', (G.deflectionWeak(G.GMsun, G.Rsun) * 206264.806), 1.7512, 1e-3);
  chk(L, 'Deflexión exacta en el límite de campo débil (b = 10⁴ m, en unidades de m): 4/B', G.deflectionExact(c * c, 1e4) / (4 / 1e4), 1 + (15 * Math.PI) / 16 / 1e4 * 1 + 0, 2e-3);
  /* Precesión */
  for (const r of ref.precession) chk(S, `Precesión por órbita (periastro ${r.rp} m, apoastro ${r.ra} m): cuadratura frente a la integración numérica de u″ + u = 1/ℓ² + 3u² (DOP853)`, G.schwDeltaPhi(r.rp, r.ra), r.dphi, 1e-9);
  { const p = (2 * 40 * 10) / (10 + 40), e = (40 - 10) / (40 + 10); chk(L, 'Precesión en campo débil: Δφ ≈ 6π/p con p = a(1 − e²) en unidades de m (periastro 400, apoastro 1600)', G.schwPrecession(400, 1600), 6 * Math.PI / ((2 * 400 * 1600) / (400 + 1600)), 2e-2); void p; void e; }
  { const m = ref.mercury, per = G.periPrecessionWeak(G.GMsun, m.a, m.e), orb = 36525 / m.P; chk(L, 'Perihelio de Mercurio: 42.98″ por siglo (observado: 42.98 ± 0.04″)', per * orb * 206264.806, 42.98, 2e-3); }
  chk(L, 'ISCO: r = 6m (periastro y apoastro coinciden): la órbita circular marginalmente estable tiene u₃ = u₁', G.schwOrbit(6, 6).u3 - G.schwOrbit(6, 6).u1, 0, 1e-12, false);
  chk(L, 'Órbita circular en r = 10 m: ℓ² = r²/(r − 3) = 100/7 (unidades de m)', G.schwOrbit(10, 10.000001).l2, 100 / 7, 1e-6);
  /* Agujeros negros */
  chk(L, 'Radio de Schwarzschild del Sol: 2.953 km', G.rs(G.GMsun) / 1e3, 2.9534, 1e-4); chk(L, 'Radio de Schwarzschild de la Tierra: 8.87 mm', G.rs(G.GMearth) * 1e3, 8.870, 1e-3);
  chk(S, 'Temperatura de Hawking de 1 M_sol frente a astropy: 6.17×10⁻⁸ K', G.hawkingT(G.Msun), ref.hawking.T, 1e-4);
  chk(S, 'Tiempo de evaporación de 1 M_sol frente a astropy: 2.1×10⁶⁷ años', G.evapTime(G.Msun) / G.yr, ref.hawking.tev, 1e-4);
  chk(S, 'Sombra de M87* (6.5×10⁹ M_sol, 16.8 Mpc): 39.7 µas frente a astropy', (G.shadowAngle(6.5e9 * G.Msun, 16.8 * G.Mpc) * 180 / Math.PI) * 3600e6, ref.shadow, 1e-4);
  /* Ondas gravitacionales */
  for (const r of ref.coal) {
    const k = (64 / 5) * G.G ** 3 * r.m1 * r.m2 * (r.m1 + r.m2) / c ** 5;
    chk(S, `Coalescencia (a₀ = ${r.a0.toExponential(1)} m, ${(r.m1 / G.Msun).toFixed(1)} + ${(r.m2 / G.Msun).toFixed(1)} M_sol): tiempo de a₀ a 10⁻³a₀ = (a₀⁴ − a₁⁴)/(4k) frente a la integración de da/dt (DOP853)`, (r.a0 ** 4 - r.a1 ** 4) / (4 * k), r.t, 1e-9);
    chk(L, `Coalescencia: el tiempo total (a → 0) de la fórmula de Peters (a₀ = ${r.a0.toExponential(1)} m) es a₀⁴/(4k)`, G.coalescence(r.a0, r.m1, r.m2), r.a0 ** 4 / (4 * k), 1e-12);
    /* f_GW(τ) de la masa de chirp frente a Kepler: f = (1/π)√(GM/a³) con a(τ) de Peters */
    const M = r.m1 + r.m2, tau = 0.37, aK = Math.pow(4 * k * tau, 0.25), fK = (1 / Math.PI) * Math.sqrt((G.G * M) / aK ** 3), Mc = Math.pow(r.m1 * r.m2, 0.6) / Math.pow(M, 0.2);
    chk(L, `Frecuencia de la onda a τ = 0.37 s de la fusión: fórmula de la masa de chirp frente a la tercera ley de Kepler con a(τ) de Peters (m₁ = ${(r.m1 / G.Msun).toFixed(1)} M_sol)`, G.fOfTau(tau, Mc), fK, 1e-12);
  }
  { const Mc = G.chirpMass(36 * G.Msun, 29 * G.Msun), f = 35, h = 1e-5, dfdt = (G.fOfTau(G.timeToMerger(f, Mc) - h, Mc) - G.fOfTau(G.timeToMerger(f, Mc) + h, Mc)) / (2 * h);
    chk(L, 'Frecuencia de la onda: f′ = (96/5)π^{8/3}(GMc/c³)^{5/3}f^{11/3} frente a la derivada numérica de f(τ) (36 + 29 M_sol, f = 35 Hz)', G.fdot(f, Mc), dfdt, 1e-7);
    chk(L, 'Masa de chirp de GW150914 (36 + 29 M_sol): 28.1 M_sol', Mc / G.Msun, 28.1, 5e-3);
    chk(L, 'ISCO de una masa total de 65 M_sol: f_GW = 67.7 Hz', G.fISCO(65 * G.Msun), 67.7, 3e-3); }
};
