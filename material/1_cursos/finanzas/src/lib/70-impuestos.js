/* ===================================================================
   lib/70-impuestos.js — Referencias colombianas 2026 e impuesto de renta
   de personas naturales residentes (tabla del artículo 241 del Estatuto
   Tributario, en UVT). La estimación desde el salario es simplificada y
   solo sirve para aprender la diferencia entre tarifa marginal y media.
   =================================================================== */
(function (root) {
  'use strict';
  const CC = (root.CC = root.CC || {});
  const L = (CC.L = CC.L || {});
  const X = (L.tax = {});

  /* Valores de referencia (verificados en octubre de 2026) */
  X.CO = {
    anio: 2026,
    smmlv: 1750905,          /* Decreto 1469 de 2025 */
    auxTransporte: 249095,   /* Decreto 1470 de 2025 */
    uvt: 52374,              /* Resolución DIAN 000238 de 2025 */
    usuraOct2026: 0.2859,    /* consumo y ordinario, octubre de 2026 (Superfinanciera) */
    ibcOct2026: 0.1906,      /* interés bancario corriente, octubre de 2026 */
    fogafin: 50000000,       /* cobertura del seguro de depósitos por persona y entidad */
    inflacion: { 2022: 0.1312, 2023: 0.0928, 2024: 0.052, 2025: 0.051 } /* DANE, variación anual a diciembre */
  };

  /* Tabla del art. 241 E.T.: [desde UVT, hasta UVT, tarifa marginal, impuesto acumulado en UVT al inicio] */
  X.TABLA = [[0, 1090, 0, 0], [1090, 1700, 0.19, 0], [1700, 4100, 0.28, 116], [4100, 8670, 0.33, 788], [8670, 18970, 0.35, 2296], [18970, 31000, 0.37, 5901], [31000, Infinity, 0.39, 10352]];
  X.renta = function (baseUVT) {
    for (const [a, b, t, c] of X.TABLA) if (baseUVT > a && baseUVT <= b) return c + (baseUVT - a) * t;
    return 0;
  };
  X.marginal = function (baseUVT) {
    for (const [a, b, t] of X.TABLA) if (baseUVT > a && baseUVT <= b) return t;
    return 0;
  };
  /* Estimación simplificada de la base gravable de un asalariado (cédula general, rentas de trabajo).
     o = {salarioMensual, dependiente (bool), voluntarios (aportes anuales a pensión voluntaria o AFC),
          interesesVivienda (anuales), uvt, smmlv}. Supuestos: 12 salarios al año; aportes obligatorios
     de salud 4 % y pensión 4 % más 1 % al Fondo de Solidaridad desde 4 salarios mínimos; deducción por
     dependiente 10 % hasta 384 UVT; voluntarios hasta 30 % del ingreso y 3.800 UVT; intereses de vivienda
     hasta 1.200 UVT; renta exenta del 25 % hasta 790 UVT; tope conjunto de deducciones y exentas:
     40 % del ingreso neto y 1.340 UVT. */
  X.estimar = function (o) {
    const uvt = o.uvt || X.CO.uvt, smm = o.smmlv || X.CO.smmlv;
    const bruto = 12 * o.salarioMensual;
    const fsp = o.salarioMensual >= 4 * smm ? 0.01 : 0;
    const neto = bruto * (1 - 0.08 - fsp);
    const dep = o.dependiente ? Math.min(0.1 * bruto, 384 * uvt) : 0;
    const vol = Math.min(o.voluntarios || 0, 0.3 * bruto, 3800 * uvt);
    const viv = Math.min(o.interesesVivienda || 0, 1200 * uvt);
    const exenta25 = Math.min(0.25 * Math.max(0, neto - dep - vol - viv), 790 * uvt);
    const beneficios = Math.min(dep + vol + viv + exenta25, 0.4 * neto, 1340 * uvt);
    const base = Math.max(0, neto - beneficios);
    const imp = X.renta(base / uvt) * uvt;
    return { bruto, neto, dep, vol, viv, exenta25, beneficios, base, baseUVT: base / uvt, impuesto: imp, media: bruto > 0 ? imp / bruto : 0, marginal: X.marginal(base / uvt) };
  };
})(typeof window !== 'undefined' ? window : globalThis);
