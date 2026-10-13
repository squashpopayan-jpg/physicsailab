/* ===================================================================
   lib/75-fraude.js — Dinámica de un esquema Ponzi y de una pirámide.
   =================================================================== */
(function (root) {
  'use strict';
  const CC = (root.CC = root.CC || {});
  const L = (CC.L = CC.L || {});
  const F = (L.fraude = {});

  /* Esquema Ponzi mes a mes.
     o = {r (rendimiento mensual prometido), E0 (aportes nuevos el primer mes), g (crecimiento mensual de los aportes),
          frena (mes desde el que los aportes caen), caida (caída mensual de los aportes después), q (fracción de los
          rendimientos que los participantes retiran en efectivo; el resto queda «reinvertido» en papel),
          f (fracción de cada aporte que se apropian los organizadores), M (meses máximos)}
     Devuelve la serie de caja real, deuda prometida («saldos en papel») y el mes del colapso. */
  F.ponzi = function (o) {
    let caja = 0, papel = 0, aporte = o.E0, totalIn = 0, totalOut = 0, robado = 0, colapso = -1;
    const S = [];
    for (let m = 1; m <= o.M; m++) {
      if (m > 1) aporte *= m > o.frena ? 1 - o.caida : 1 + o.g;
      totalIn += aporte;
      const roba = o.f * aporte;
      robado += roba;
      caja += aporte - roba;
      papel += aporte;
      const rend = papel * o.r;
      const pago = o.q * rend;
      papel += rend - pago;
      /* después del freno, la desconfianza hace que algunos pidan su capital */
      const retiroCapital = m > o.frena ? papel * (o.retiroPanico || 0.05) : 0;
      papel -= retiroCapital;
      caja -= pago + retiroCapital;
      totalOut += pago + retiroCapital;
      S.push({ m, caja: Math.max(0, caja), papel, aporte, deficit: Math.max(0, papel - caja) });
      if (caja < 0 && colapso < 0) { colapso = m; break; }
    }
    const fin = S[S.length - 1];
    return { serie: S, colapso, totalIn, totalOut, robado, perdida: fin.papel - Math.max(0, fin.caja) };
  };

  /* Pirámide: cada participante debe reclutar k personas. Personas en el nivel n: k^n (nivel 0 = fundador).
     Devuelve niveles hasta superar una población y la fracción de participantes del último nivel (los que pierden). */
  F.piramide = function (k, poblacion) {
    const niveles = [];
    let total = 0, n = 0;
    while (total < poblacion && n < 60) { const v = Math.pow(k, n); niveles.push(v); total += v; n++; }
    const ultimo = niveles[niveles.length - 1];
    return { niveles, total, nivelesN: niveles.length, fraccionUltimo: ultimo / total };
  };
})(typeof window !== 'undefined' ? window : globalThis);
