module.exports = function (T, C, R) {
  const H = 'Histórico', S = 'SciPy', N = 'Numérico';
  T.rel(S, 'segunda ley: área del sector en el perihelio (quad sobre r²/2 dθ)', C.sweptArea(0.5, 0, Math.PI / 3), R.area_peri, 1e-9);
  T.rel(S, 'segunda ley: área del sector en el afelio', C.sweptArea(0.5, Math.PI, Math.PI + Math.PI / 3), R.area_af, 1e-9);
  T.rel(H, 'segunda ley: sectores iguales en tiempos iguales (perihelio frente a afelio)', C.sweptArea(0.5, 0, Math.PI / 3), C.sweptArea(0.5, Math.PI, Math.PI + Math.PI / 3), 1e-12);
  T.rel(H, 'segunda ley: área total πab con b = a√(1−e²)', 6 * C.sweptArea(0.5, 0, Math.PI / 3), 6 * R.area_total, 1e-12);
  const pl = ['mercurio', 'venus', 'tierra', 'marte', 'jupiter', 'saturno'].map((k) => C.ELEM[k]);
  const xs = pl.map((p) => Math.log10(p.a)), ys = pl.map((p) => Math.log10(p.P));
  const n = xs.length, sx = xs.reduce((a, b) => a + b), sy = ys.reduce((a, b) => a + b), sxx = xs.reduce((a, b) => a + b * b, 0), sxy = xs.reduce((a, b, i) => a + b * ys[i], 0);
  T.abs(S, 'tercera ley: pendiente log–log de los seis planetas (polyfit)', (n * sxy - sx * sy) / (n * sxx - sx * sx), R.slope, 1e-3);
  T.abs(H, 'tercera ley: pendiente 3/2', R.slope, 1.5, 0.002);
  T.rel(S, 'tercera ley: T²/a³ medio de los planetas (d²/UA³)', pl.reduce((s, p) => s + (p.P * p.P) / Math.pow(p.a, 3), 0) / pl.length, R.k_planets, 2e-3);
  T.rel(H, 'Newton: masa del Sol desde Marte (kg)', C.centralGM(1.52371034 * 1.495978707e11, 686.98 * 86400) / 6.6743e-11, 1.98847e30, 3e-3);
  T.rel(S, 'masa de Júpiter desde Ío', C.centralGM(421.77e6, 1.769138 * 86400) / 6.6743e-11, R.M_jup_io, 1e-12);
  T.rel(H, 'masa de Júpiter: 1.898×10²⁷ kg', R.M_jup_io, 1.898e27, 5e-3);
  T.rel(H, 'masa de Marte desde Fobos: 6.417×10²³ kg', R.M_mars_phobos, 6.417e23, 2e-3);
  T.abs(H, 'Halley: semieje 17.9 UA y cociente de velocidades 59.6', R.halley.a, 17.94, 0.02);
  T.abs(H, 'Halley: cociente de velocidades perihelio/afelio', R.halley.v, 59.6, 0.1);
  /* ajuste focal y triangulación */
  const pts = R.focal_fit.ths.map((th, i) => ({ r: R.focal_fit.r[i], lam: th, x: R.focal_fit.r[i] * Math.cos(th), y: R.focal_fit.r[i] * Math.sin(th) }));
  const ef = C.fitFocalConic(pts);
  T.abs(S, 'ajuste de cónica focal (lstsq): excentricidad', ef.e, R.focal_fit.e, 1e-12);
  T.abs(S, 'ajuste de cónica focal: semieje', ef.a, R.focal_fit.a, 1e-12);
  T.abs(N, 'el ajuste recupera e = 0.0934', ef.e, 0.0934, 1e-12);
  const clean = []; for (let i = 0; i < 60; i++) { const f = C.marsFix(30000 + (i * C.ELEM.marte.P) / 60, 0, null); if (f) clean.push(f); }
  const ec = C.fitFocalConic(clean), cc = C.fitCircle(clean);
  T.abs(N, 'triangulación sin ruido: la elipse ajusta la órbita de Marte (residuo)', ec.rms, 0, 1e-9);
  T.abs(N, 'triangulación sin ruido: e = 0.0934 y a = 1.5237', ec.e, C.ELEM.marte.e, 2e-5);
  T.ok(H, 'el mejor círculo deja un residuo > 1e-3 UA (Kepler: «8 minutos»)', cc.rms > 1e-3);
  T.abs(H, 'triangulación: el centro del círculo ajustado queda desplazado ≈ ae', Math.hypot(cc.cx, cc.cy), C.ELEM.marte.a * C.ELEM.marte.e, 0.01);
  const delta = (N, sg, seed) => { const rng = C.rng(seed), q = []; for (let i = 0; i < N; i++) { const f = C.marsFix(30000 + (i * C.ELEM.marte.P) / N, ((sg / 60) * Math.PI) / 180, rng); if (f && f.r > 1.1 && f.r < 2.0) q.push(f); } const c = C.fitCircle(q), e = C.fitFocalConic(q); return (q.length * (c.rms ** 2 - e.rms ** 2)) / e.rms ** 2; };
  T.ok(H, 'con 1′ de error y 300 posiciones, Δχ² (círculo − elipse) supera 100 (3 tandas)', [100, 101, 102].every((s) => delta(300, 1, s) > 100));
  T.ok(H, 'con 2′ de error y 60 posiciones el círculo no se descarta (Δχ² < 25 en 3 tandas)', [100, 101, 102].every((s) => delta(60, 2, s) < 25));
  T.ok(H, 'con 2′ de error y 400 posiciones la elipse gana (Δχ² > 15 en 3 tandas)', [100, 101, 102].every((s) => delta(400, 2, s) > 15));
};
