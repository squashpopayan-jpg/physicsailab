/* ===================================================================
   lib/30-hogar.js — Finanzas del hogar: indicadores de diagnóstico,
   fondo de emergencia (simulación de choques) y seguros (utilidad).
   =================================================================== */
(function (root) {
  'use strict';
  const CC = (root.CC = root.CC || {});
  const L = (CC.L = CC.L || {});
  const H = (L.hogar = {});

  /* Indicadores a partir de un resumen mensual y del balance.
     o = {ingreso, gastos, cuotas, liquidos, activos, pasivos, edad, ingresoAnual} */
  H.indicadores = function (o) {
    const ahorro = o.ingreso - o.gastos - o.cuotas;
    return {
      ahorro,
      tasaAhorro: o.ingreso > 0 ? ahorro / o.ingreso : NaN,
      cargaDeuda: o.ingreso > 0 ? o.cuotas / o.ingreso : NaN,
      mesesColchon: o.gastos + o.cuotas > 0 ? o.liquidos / (o.gastos + o.cuotas) : NaN,
      patrimonio: o.activos - o.pasivos,
      endeudamiento: o.activos > 0 ? o.pasivos / o.activos : NaN,
      /* Referencia de Stanley y Danko: patrimonio esperado = edad × ingreso anual / 10 */
      stanleyDanko: o.edad && o.ingresoAnual ? (o.edad * o.ingresoAnual) / 10 : NaN
    };
  };

  /* Simulación del fondo de emergencia mes a mes durante A años.
     o = {gasto (mensual), fondo (meses de gasto), pDesempleo (probabilidad mensual de perder el ingreso),
          durMedia (meses promedio sin ingreso), pImprevisto (prob. mensual de un gasto inesperado),
          imprevisto (tamaño en meses de gasto), recarga (fracción del gasto que se ahorra al mes para reponer),
          tasaDeuda (mensual), anos, N, seed}
     Devuelve la fracción de vidas que necesitaron deuda, la deuda máxima típica y el costo en intereses. */
  H.emergencia = function (o) {
    const rng = L.rng(o.seed || 3), M = Math.round(o.anos * 12);
    let conDeuda = 0, intereses = [], maxDeudas = [];
    for (let i = 0; i < o.N; i++) {
      let caja = o.fondo * o.gasto, deuda = 0, sinIngreso = 0, interes = 0, maxD = 0;
      const meta = o.fondo * o.gasto;
      for (let m = 0; m < M; m++) {
        if (sinIngreso === 0 && rng() < o.pDesempleo) {
          /* duración geométrica con media durMedia */
          const q = 1 / Math.max(1, o.durMedia);
          sinIngreso = 1; while (rng() > q && sinIngreso < 36) sinIngreso++;
        }
        let salida = 0;
        if (sinIngreso > 0) { salida += o.gasto; sinIngreso--; }
        if (rng() < o.pImprevisto) salida += o.imprevisto * o.gasto;
        /* intereses de la deuda */
        if (deuda > 0) { const it = deuda * o.tasaDeuda; deuda += it; interes += it; }
        /* cubrir con caja, si no alcanza con deuda */
        const usa = Math.min(caja, salida);
        caja -= usa;
        deuda += salida - usa;
        /* con ingreso: el ahorro mensual paga deuda primero y luego recarga el fondo */
        if (sinIngreso === 0) {
          let ah = o.recarga * o.gasto;
          const pd = Math.min(deuda, ah); deuda -= pd; ah -= pd;
          caja = Math.min(meta, caja + ah);
        }
        maxD = Math.max(maxD, deuda);
      }
      if (maxD > 0.5) conDeuda++;
      intereses.push(interes); maxDeudas.push(maxD);
    }
    const pos = maxDeudas.filter((d) => d > 0.5).sort((a, b) => a - b);
    return {
      pDeuda: conDeuda / o.N,
      interesMedio: L.stat.mean(intereses),
      deudaMediana: pos.length ? pos[Math.floor(pos.length / 2)] : 0,
      maxDeudas
    };
  };

  /* Seguro con utilidad logarítmica.
     Riqueza W, pérdida X con probabilidad p, prima π. Devuelve valor esperado de cada opción,
     utilidad esperada y el equivalente cierto; la prima máxima que vale la pena pagar es la que iguala utilidades. */
  H.seguro = function (W, X, p, prima, deducible = 0) {
    const sin = { esperado: W - p * X, U: p * Math.log(Math.max(1e-9, W - X)) + (1 - p) * Math.log(W) };
    const con = { esperado: W - prima - p * deducible, U: p * Math.log(Math.max(1e-9, W - prima - deducible)) + (1 - p) * Math.log(W - prima) };
    sin.EC = Math.exp(sin.U); con.EC = Math.exp(con.U);
    /* prima máxima: (W−π−D)^p (W−π)^(1−p) = EC_sin */
    const f = (pi) => p * Math.log(Math.max(1e-12, W - pi - deducible)) + (1 - p) * Math.log(Math.max(1e-12, W - pi)) - sin.U;
    const primaMax = f(0) <= 0 ? 0 : L.util.bisect(f, 0, W - deducible - 1e-6);
    return { sin, con, primaJusta: p * (X - deducible), primaMax };
  };
})(typeof window !== 'undefined' ? window : globalThis);
