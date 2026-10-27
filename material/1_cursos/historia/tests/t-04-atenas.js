module.exports = function (T, C, R) {
  const H = 'Histórico', S = 'SciPy';
  const args = { plomo_aire: [11340, 1.2, 0.05, 10], madera_aire: [500, 1.2, 0.05, 10], plomo_agua: [11340, 1000, 0.05, 10], piedra_agua: [2600, 1000, 0.05, 10], piedra_aire_1m: [2600, 1.2, 0.1, 1] };
  const g = (n) => C.fallSphere(...args[n]).t;
  for (const k of Object.keys(R.fall)) T.rel(S, `caída con resistencia cuadrática (solve_ivp): ${k}`, g(k), R.fall[k], 1e-7);
  T.rel('Numérico', 'caída: fórmula cerrada frente a RK4 (plomo en aire)', g('plomo_aire'), C.fallSphereRK4(11340, 1.2, 0.05, 10, 0.47, 1e-4), 1e-4);
  T.abs(H, 'sin resistencia (vacío) el tiempo es √(2h/g)', C.fallSphere(11340, 0, 0.05, 10).t, R.free_fall, 1e-9);
  T.ok(H, 'en el aire la madera tarda más que el plomo', g('madera_aire') > g('plomo_aire'));
  T.ok(H, 'la regla de Aristóteles (10× más rápido) no se cumple en aire: cociente de tiempos > 0.95', g('plomo_aire') / g('madera_aire') > 0.95);
  for (const [n, [v, e, f]] of Object.entries({ tetraedro: [4, 6, 4], cubo: [8, 12, 6], octaedro: [6, 12, 8], icosaedro: [12, 30, 20], dodecaedro: [20, 30, 12] })) {
    const P = C.platonic(n);
    T.eq(H, `${n}: vértices, aristas, caras`, [P.V.length, P.E.length, P.F], [v, e, f]);
    T.eq(H, `${n}: Euler V−A+C = 2`, P.V.length - P.E.length + P.F, 2);
  }
  R.eudoxus.forEach(([a, S1, P, t, lon, lat]) => { const q = C.eudoxus(a, S1, P, t); T.abs(S, `Eudoxo (rotaciones SciPy), α=${a} t=${t}: longitud`, q.lon, lon, 1e-9); T.abs(S, `Eudoxo, α=${a} t=${t}: latitud`, q.lat, lat, 1e-9); });
  const sat = C.PLANETS.saturno, st = C.eudoxusStats(0.108, sat.S, sat.P);
  T.ok(H, 'Eudoxo: Saturno se ajusta con α ≈ 6° y latitud < 1°', st.arc > 5.5 && st.arc < 8 && st.lat < 1);
  T.eq(H, 'Eudoxo: Marte no alcanza el arco observado ni con α = 89°', C.eudoxusStats(89 * Math.PI / 180, C.PLANETS.marte.S, C.PLANETS.marte.P).arc < C.PLANETS.marte.arc, true);
  T.eq(H, 'Eudoxo: Venus no retrograda con ningún α', C.eudoxusStats(89 * Math.PI / 180, C.PLANETS.venus.S, C.PLANETS.venus.P).arc, 0);
};
