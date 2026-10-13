/* ===================================================================
   lib/65-vivienda.js — Comprar o arrendar: comparación mes a mes del
   patrimonio de quien compra con crédito y de quien arrienda e invierte
   la diferencia. Todo en pesos corrientes.
   =================================================================== */
(function (root) {
  'use strict';
  const CC = (root.CC = root.CC || {});
  const L = (CC.L = CC.L || {});
  const V = (L.viv = {});

  /* o = {precio, inicial (fracción), tasaEA, plazo (años), valorizacion (anual), canon (fracción mensual del precio),
          aumentoArriendo (anual), poseer (costos anuales de poseer como fracción del valor), compra (fracción),
          venta (fracción), rInv (rentabilidad anual de las inversiones), anos (horizonte)} */
  V.comparar = function (o) {
    const T = L.tvm, M = Math.round(o.anos * 12), n = Math.round(o.plazo * 12);
    const im = T.eaToPeriodic(o.tasaEA, 12), gv = T.eaToPeriodic(o.valorizacion, 12), ri = T.eaToPeriodic(o.rInv, 12);
    const deuda0 = o.precio * (1 - o.inicial), cuota = n > 0 && deuda0 > 0 ? -T.pmt(im, n, deuda0) : 0;
    let valor = o.precio, saldo = deuda0, canon = o.canon * o.precio;
    let invC = 0; /* inversiones de quien compra (si en algún mes le sale más barato que arrendar) */
    let invA = o.precio * o.inicial + o.precio * o.compra; /* quien arrienda invierte lo que el otro usó para comprar */
    const serie = [{ m: 0, compra: o.precio * (1 - o.venta) - deuda0, arrienda: invA, valor, saldo, canon, costoC: 0 }];
    let pagadoIntereses = 0, pagadoPoseer = 0, pagadoArriendo = 0;
    for (let k = 1; k <= M; k++) {
      const interes = saldo > 0 ? saldo * im : 0;
      const pagoCredito = saldo > 0 ? Math.min(cuota, saldo + interes) : 0;
      saldo = Math.max(0, saldo + interes - pagoCredito);
      const poseer = (o.poseer * valor) / 12;
      const salidaC = pagoCredito + poseer, salidaA = canon;
      pagadoIntereses += interes; pagadoPoseer += poseer; pagadoArriendo += canon;
      invC *= 1 + ri; invA *= 1 + ri;
      /* el que paga menos este mes invierte la diferencia */
      if (salidaC > salidaA) invA += salidaC - salidaA; else invC += salidaA - salidaC;
      valor *= 1 + gv;
      if (k % 12 === 0) canon *= 1 + o.aumentoArriendo;
      serie.push({ m: k, compra: valor * (1 - o.venta) - saldo + invC, arrienda: invA, valor, saldo, canon, costoC: salidaC });
    }
    const fin = serie[serie.length - 1];
    return { serie, cuota, compra: fin.compra, arrienda: fin.arrienda, pagadoIntereses, pagadoPoseer, pagadoArriendo };
  };
  /* Rentabilidad de un inmueble para arrendar: bruta, neta y total (con valorización) */
  V.rentaInmueble = function (precio, canonMensual, costosAnuales, vacanciaMeses, valorizacion) {
    const bruta = (12 * canonMensual) / precio;
    const neta = ((12 - vacanciaMeses) * canonMensual - costosAnuales) / precio;
    return { bruta, neta, total: (1 + neta) * (1 + valorizacion) - 1, anosArriendo: precio / (12 * canonMensual) };
  };
})(typeof window !== 'undefined' ? window : globalThis);
