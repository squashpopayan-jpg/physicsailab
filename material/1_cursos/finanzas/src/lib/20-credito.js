/* ===================================================================
   lib/20-credito.js — Créditos: tablas de amortización, abonos,
   tarjetas, créditos en UVR, planes para salir de deudas y préstamos
   informales. Montos en pesos; tasas periódicas como fracción.
   =================================================================== */
(function (root) {
  'use strict';
  const CC = (root.CC = root.CC || {});
  const L = (CC.L = CC.L || {});
  const C = (L.cred = {});
  const T = () => L.tvm;

  /* Cuota fija (sistema francés). Filas: {k, cuota, interes, capital, saldo} */
  C.french = function (P, im, n) {
    const cuota = -T().pmt(im, n, P);
    const rows = [];
    let saldo = P;
    for (let k = 1; k <= n; k++) {
      const interes = saldo * im;
      let capital = cuota - interes;
      if (k === n) capital = saldo;
      saldo -= capital;
      rows.push({ k, cuota: interes + capital, interes, capital, saldo: Math.abs(saldo) < 1e-6 ? 0 : saldo });
    }
    return C._tot(rows);
  };
  /* Abono constante a capital (sistema alemán; así difieren las compras muchas tarjetas en Colombia) */
  C.german = function (P, im, n) {
    const capital = P / n, rows = [];
    let saldo = P;
    for (let k = 1; k <= n; k++) {
      const interes = saldo * im;
      saldo -= capital;
      rows.push({ k, cuota: capital + interes, interes, capital, saldo: Math.abs(saldo) < 1e-6 ? 0 : saldo });
    }
    return C._tot(rows);
  };
  C._tot = function (rows) {
    let ti = 0, tp = 0;
    for (const r of rows) { ti += r.interes; tp += r.cuota; }
    return { rows, totalInteres: ti, totalPagado: tp, meses: rows.length };
  };

  /* Crédito de cuota fija con abonos extraordinarios.
     extra(k) → abono adicional al final del mes k; modo 'plazo' conserva la cuota y acorta el crédito,
     modo 'cuota' conserva el plazo original y recalcula una cuota menor. */
  C.prepay = function (P, im, n, extra, modo = 'plazo') {
    let cuota = -T().pmt(im, n, P), saldo = P;
    const rows = [];
    for (let k = 1; k <= 1200 && saldo > 0.005; k++) {
      const interes = saldo * im;
      let capital = Math.min(cuota - interes, saldo);
      saldo -= capital;
      let ab = Math.min(Math.max(0, extra ? extra(k) : 0), saldo);
      saldo -= ab;
      if (saldo < 0.005) saldo = 0;
      rows.push({ k, cuota: interes + capital, interes, capital, abono: ab, saldo });
      if (modo === 'cuota' && ab > 0 && saldo > 0 && k < n) cuota = -T().pmt(im, n - k, saldo);
    }
    const t = C._tot(rows);
    t.totalAbonos = rows.reduce((s, r) => s + r.abono, 0);
    t.totalPagado += t.totalAbonos;
    return t;
  };

  /* Tarjeta con pago mínimo porcentual: mínimo = max(piso, pct·saldo), sin compras nuevas.
     Devuelve meses hasta pagar (o Infinity si el mínimo no cubre el interés), total pagado e intereses. */
  C.minPayment = function (saldo0, im, pct, piso = 0, maxMeses = 1200) {
    let saldo = saldo0, pagado = 0, interes = 0;
    const serie = [saldo];
    for (let k = 1; k <= maxMeses; k++) {
      const i = saldo * im;
      saldo += i; interes += i;
      const pago = Math.min(saldo, Math.max(piso, pct * saldo));
      if (pago <= i + 1e-9 && saldo > 1) return { meses: Infinity, totalPagado: pagado, totalInteres: interes, serie };
      saldo -= pago; pagado += pago;
      serie.push(saldo);
      if (saldo < 0.5) return { meses: k, totalPagado: pagado, totalInteres: interes, serie };
    }
    return { meses: Infinity, totalPagado: pagado, totalInteres: interes, serie };
  };

  /* Crédito en UVR frente a crédito en pesos.
     La cuota en UVR es fija (sistema francés a la tasa real); en pesos crece con la UVR,
     que se ajusta mes a mes con la inflación. o = {P, realEA, inflEA, pesosEA, anos} */
  C.uvrVsPesos = function (o) {
    const n = Math.round(o.anos * 12);
    const ir = T().eaToPeriodic(o.realEA, 12), ip = T().eaToPeriodic(o.pesosEA, 12), g = T().eaToPeriodic(o.inflEA, 12);
    const cuotaU = -T().pmt(ir, n, o.P); /* en «UVR» con UVR inicial = 1 peso por unidad */
    const cuotaP = -T().pmt(ip, n, o.P);
    let sU = o.P, sP = o.P, uvr = 1, pagU = 0, pagP = 0;
    const rows = [];
    for (let k = 1; k <= n; k++) {
      uvr *= 1 + g;
      sU = sU * (1 + ir) - cuotaU;
      sP = sP * (1 + ip) - cuotaP;
      pagU += cuotaU * uvr; pagP += cuotaP;
      rows.push({ k, cuotaUVR: cuotaU * uvr, saldoUVR: Math.max(0, sU) * uvr, cuotaPesos: cuotaP, saldoPesos: Math.max(0, sP), uvr });
    }
    return { rows, cuotaInicialUVR: cuotaU * (1 + g), cuotaPesos: cuotaP, totalUVR: pagU, totalPesos: pagP };
  };

  /* Plan para salir de varias deudas con un presupuesto mensual fijo.
     deudas = [{nombre, saldo, im, minimo}]; estrategia 'avalancha' (mayor tasa primero),
     'bola' (menor saldo primero) o 'minimos' (solo pagos mínimos, sin excedente). */
  C.debtPlan = function (deudas, presupuesto, estrategia = 'avalancha', maxMeses = 600) {
    const ds = deudas.map((d, j) => ({ j, nombre: d.nombre, saldo: d.saldo, im: d.im, minimo: d.minimo, fin: null, interes: 0 }));
    let totalInteres = 0, mes = 0, sube = 0;
    const serie = [ds.reduce((s, d) => s + d.saldo, 0)];
    const orden = [];
    while (ds.some((d) => d.saldo > 0.5) && mes < maxMeses) {
      mes++;
      for (const d of ds) if (d.saldo > 0) { const i = d.saldo * d.im; d.saldo += i; d.interes += i; totalInteres += i; }
      let caja = presupuesto;
      for (const d of ds) if (d.saldo > 0) { const p = Math.min(d.saldo, d.minimo, caja); d.saldo -= p; caja -= p; }
      if (estrategia !== 'minimos') {
        const vivos = ds.filter((d) => d.saldo > 0.5);
        vivos.sort(estrategia === 'bola' ? (a, b) => a.saldo - b.saldo || b.im - a.im : (a, b) => b.im - a.im || a.saldo - b.saldo);
        for (const d of vivos) { if (caja <= 0) break; const p = Math.min(d.saldo, caja); d.saldo -= p; caja -= p; }
      }
      for (const d of ds) if (d.saldo <= 0.5 && d.fin === null) { d.saldo = 0; d.fin = mes; orden.push(d.nombre); }
      serie.push(ds.reduce((s, d) => s + d.saldo, 0));
      /* Si el saldo total no baja durante dos años seguidos, el presupuesto no alcanza ni para los intereses */
      sube = serie[mes] >= serie[mes - 1] - 1e-6 ? sube + 1 : 0;
      if (sube >= 24) return { meses: Infinity, totalInteres, serie, orden, deudas: ds };
    }
    return { meses: ds.some((d) => d.saldo > 0.5) ? Infinity : mes, totalInteres, serie, orden, deudas: ds };
  };

  /* Préstamo «gota a gota»: se recibe P y se paga P·(1 + recargo) en N cuotas diarias iguales.
     Devuelve la tasa diaria implícita (TIR) y su equivalente efectivo anual (365 días). */
  C.gotaAGota = function (P, recargo, dias) {
    const cuota = (P * (1 + recargo)) / dias;
    const flujos = [-P];
    for (let k = 0; k < dias; k++) flujos.push(cuota);
    const id = T().irr(flujos);
    return { cuota, tasaDiaria: id, ea: Math.pow(1 + id, 365) - 1, mensual: Math.pow(1 + id, 30) - 1 };
  };

  /* Costo efectivo de un crédito con cobros adicionales: TIR mensual de los flujos reales del deudor.
     o = {P, im, n, comisionInicial, seguroTasa (mensual sobre el saldo), seguroFijo, cuotaManejo} */
  C.costoTotal = function (o) {
    const cuota = -T().pmt(o.im, o.n, o.P);
    const flujos = [o.P - (o.comisionInicial || 0)];
    let saldo = o.P;
    for (let k = 1; k <= o.n; k++) {
      const seg = (o.seguroTasa || 0) * saldo + (o.seguroFijo || 0);
      const interes = saldo * o.im;
      saldo -= cuota - interes;
      flujos.push(-(cuota + seg + (o.cuotaManejo || 0)));
    }
    const irm = T().irr(flujos);
    return { cuota, flujos, tirMensual: irm, ea: Math.pow(1 + irm, 12) - 1, eaAnunciada: Math.pow(1 + o.im, 12) - 1, totalPagado: -flujos.slice(1).reduce((s, v) => s + v, 0) };
  };
})(typeof window !== 'undefined' ? window : globalThis);
