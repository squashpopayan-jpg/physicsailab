module.exports = function (T, C, R) {
  const H = 'Histórico', S = 'SciPy', N = 'Numérico';
  for (const [t, ne, r] of R.saha) T.rel(S, `Saha: n_II/n_I del hidrógeno a ${t} K con n_e = ${ne} m⁻³ (scipy.constants)`, C.sahaRatio(t, ne), r, 1e-6);
  T.abs(S, 'Saha: temperatura del máximo de las líneas de Balmer (rejilla de 10 K)', C.balmerPeakT(1e20), R.balmer_peak, 20);
  T.abs(H, 'Payne (1925): las líneas de Balmer son máximas en las estrellas A0 (≈ 9500 K)', C.balmerPeakT(1e20), 9500, 1500);
  T.ok(N, 'a 5000 K (tipo K) el hidrógeno está casi todo neutro pero con el nivel n = 2 vacío: no hay Balmer', C.ionFraction(5000, 1e20) < 1e-3 && C.balmerStrength(5000, 1e20) < 0.01 * C.balmerStrength(9500, 1e20));
  T.ok(N, 'a 20 000 K el hidrógeno está ionizado: las líneas de Balmer se debilitan otra vez', C.ionFraction(20000, 1e20) > 0.9 && C.balmerStrength(20000, 1e20) < 0.1 * C.balmerStrength(9500, 1e20));
  for (const [eps, tmax, E, L] of R.noether) { const o = C.noetherOrbit(eps, Math.round(tmax / 0.0005), 0.0005); T.abs(S, `Noether (ε = ${eps}): energía final tras t = ${tmax} frente a DOP853`, o.E[o.E.length - 1], E, 1e-6); T.abs(S, `Noether (ε = ${eps}): momento angular final frente a DOP853`, o.L[o.L.length - 1], L, 5e-4); }
  const o0 = C.noetherOrbit(0, 20000, 0.0005), o1 = C.noetherOrbit(0.05, 20000, 0.0005);
  T.abs(N, 'simetría rotacional ⇒ el momento angular se conserva (variación < 10⁻⁷)', Math.max(...o0.L) - Math.min(...o0.L), 0, 1e-7);
  T.ok(N, 'rotura de la simetría rotacional ⇒ el momento angular deja de conservarse (variación > 0.1)', Math.max(...o1.L) - Math.min(...o1.L) > 0.1);
  T.abs(N, 'simetría temporal ⇒ la energía se conserva aunque se rompa la rotacional (variación < 10⁻⁶)', Math.max(...o1.E) - Math.min(...o1.E), 0, 1e-6);
  T.abs(S, 'Price: tiempo de duplicación de la literatura científica (numpy.polyfit)', C.priceDoubling(), R.price_T2, 1e-9);
  T.abs(H, 'Price (1963): la ciencia duplica su tamaño cada 15 años', C.priceDoubling(), 15, 2);
  T.abs(H, 'solo 5 de los ≈ 225 laureados del Nobel de Física hasta 2023 son mujeres', C.NOBEL.women / C.NOBEL.total, 0.0222, 0.002);
  T.eq(H, 'las cinco laureadas del Nobel de Física hasta 2023', C.NOBEL.names.length, 5);
};
