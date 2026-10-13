/* ===================================================================
   lib/90-checks.js — Catálogo de validaciones del núcleo de cálculo.
   Cada prueba compara un cálculo en JavaScript con numpy-financial,
   SciPy, la hoja original de Damodaran (valores en 85-ref.js, generados
   por tests/referencias.py) o con una identidad matemática exacta.
   Formato: {cap, id, what, ref, src, tol, rel, fn() → valor}.
   =================================================================== */
(function (root) {
  'use strict';
  const CC = (root.CC = root.CC || {});
  const L = (CC.L = CC.L || {});
  const C = [];
  const add = (cap, id, what, ref, src, tol, fn, o = {}) => C.push(Object.assign({ cap, id, what, ref, src, tol, fn }, o));
  L.CHECKS = C;
  const R = () => L.REF.ref;
  const NPF = () => 'numpy-financial ' + L.REF.versions.numpy_financial;
  const T = () => L.tvm, K = () => L.cred, I = () => L.inv;

  /* ---------- 3 · Sesgos ---------- */
  add(3, 'w01', 'Ponderación de probabilidad w(0,01) con γ = 0,61', () => R().w01, 'fórmula de Tversky y Kahneman (Python)', 1e-12, () => L.beh.weight(0.01, 0.61));
  add(3, 'mingain', 'Ganancia mínima para aceptar una moneda en la que se pierden 100 (λ = 2,25)', () => R().mingain, 'SciPy optimize.brentq', 1e-6, () => L.beh.minGain(100));
  add(3, 'disc', 'Inversión de preferencias: con descuento hiperbólico se elige 100 hoy frente a 120 en 7 días, pero 120 si ambas fechas se corren 30 días', 1, 'propiedad del descuento hiperbólico', 0, () => (L.beh.choose(100, 120, 0, 7, (t) => L.beh.discHyp(t, 0.05)) === 'A' && L.beh.choose(100, 120, 30, 7, (t) => L.beh.discHyp(t, 0.05)) === 'B' ? 1 : 0));
  add(3, 'discx', 'Sin inversión con descuento exponencial (misma elección con y sin espera)', 1, 'consistencia temporal', 0, () => (L.beh.choose(100, 120, 0, 7, (t) => L.beh.discExp(t, 0.97)) === L.beh.choose(100, 120, 30, 7, (t) => L.beh.discExp(t, 0.97)) ? 1 : 0));

  /* ---------- 6 · Interés compuesto ---------- */
  add(6, 'fv1', 'VF de 1 millón más 100.000 mensuales, 120 meses al 1 % (vencido)', () => R().fv1, NPF() + ' fv', 1e-6, () => T().fv(0.01, 120, -100000, -1e6), { rel: true });
  add(6, 'fv1b', 'Ídem con pagos anticipados (tipo 1)', () => R().fv1b, NPF() + ' fv (when="begin")', 1e-6, () => T().fv(0.01, 120, -100000, -1e6, 1), { rel: true });
  add(6, 'dup', 'Tiempo exacto de duplicación al 8 %', () => R().dup8, 'ln 2 / ln 1,08 (Python)', 1e-12, () => T().doubling(0.08));
  add(6, 'path', 'Trayectoria mes a mes = fórmula cerrada de VF (diferencia)', 0, 'identidad', 1e-6, () => { const p = T().savingsPath({ p0: 1e6, aporte: 1e5, im: 0.01, meses: 120 }); return Math.abs(p.saldo[120] - R().fv1) / R().fv1; });

  /* ---------- 7 · Tasas ---------- */
  add(7, 'usura', 'Tasa de usura de octubre de 2026 (28,59 % EA) expresada mes vencido', () => R().usura_mv, '(1,2859)^(1/12) − 1 (Python)', 1e-14, () => T().eaToPeriodic(0.2859, 12));
  add(7, 'nom', '24 % nominal mes vencido → efectiva anual', () => R().nom24, '1,02¹² − 1 (Python)', 1e-14, () => T().nominalToEa(0.24, 12));
  add(7, 'ant', 'Anticipada → vencida → anticipada (ida y vuelta)', 0.02, 'identidad', 1e-15, () => T().vencToAnt(T().antToVenc(0.02)));
  add(7, 'real', 'Tasa real exacta: 10 % nominal con inflación 5,1 %', () => R().real10, 'Fisher (Python)', 1e-15, () => T().real(0.10, 0.051));
  add(7, 'costo', 'Costo efectivo mensual de un crédito con comisión, seguro y cuota de manejo (TIR)', () => R().costo_tir, NPF() + ' irr', 1e-10, () => K().costoTotal({ P: 1e7, im: 0.018, n: 36, comisionInicial: 2e5, seguroTasa: 0.001, cuotaManejo: 15000 }).tirMensual);

  /* ---------- 8 · Inflación ---------- */
  add(8, 'ipcco', 'Inflación de Colombia 2025 (Banco Mundial, promedio anual) leída del archivo de datos', 5.1422, 'API del Banco Mundial', 1e-4, () => L.DATA.co.infl[L.DATA.co.years.indexOf(2025)]);

  /* ---------- 9 · Valor del dinero en el tiempo ---------- */
  add(9, 'pv', 'VA de 60 cuotas de 450.000 al 0,8 % mensual', () => R().pv1, NPF() + ' pv', 1e-8, () => T().pv(0.008, 60, -450000), { rel: true });
  add(9, 'pmt', 'Cuota de 25 millones a 48 meses al 1,2 %', () => R().pmt1, NPF() + ' pmt', 1e-10, () => T().pmt(0.012, 48, 25e6), { rel: true });
  add(9, 'nper', 'Meses para pagar 5 millones con 300.000 al 1,5 %', () => R().nper1, NPF() + ' nper', 1e-10, () => T().nper(0.015, -300000, 5e6));
  add(9, 'rate', 'Tasa implícita: recibir 10 millones y pagar 24 cuotas de 520.000', () => R().rate1, NPF() + ' rate', 1e-10, () => T().rate(24, -520000, 1e7));
  add(9, 'rate2', 'Tasa para llegar a 15 millones ahorrando 200.000 durante 60 meses', () => R().rate2, NPF() + ' rate', 1e-10, () => T().rate(60, -200000, 0, 15e6));
  add(9, 'npv', 'VPN al 11 % de un proyecto de 30 millones (primer flujo en t = 0)', () => R().npv1, NPF() + ' npv', 1e-8, () => T().npv(0.11, [-30e6, 6e6, 8e6, 9e6, 10e6, 12e6]), { rel: true });
  add(9, 'irr', 'TIR del mismo proyecto', () => R().irr1, NPF() + ' irr', 1e-10, () => T().irr([-30e6, 6e6, 8e6, 9e6, 10e6, 12e6]));
  add(9, 'vna', 'VNA de Excel (primer flujo descontado un periodo)', () => R().npvx, 'definición (Python)', 1e-8, () => T().npvExcel(0.11, [-30e6, 6e6, 8e6, 9e6, 10e6, 12e6]), { rel: true });

  /* ---------- 10 · Créditos ---------- */
  add(10, 'frint', 'Cuota fija: intereses totales de 80 millones a 180 meses al 1,1 %', () => R().fr_int, NPF() + ' ipmt', 1e-9, () => K().french(80e6, 0.011, 180).totalInteres, { rel: true });
  add(10, 'fri12', 'Cuota fija: interés de la cuota 12', () => R().fr_i12, NPF() + ' ipmt', 1e-9, () => K().french(80e6, 0.011, 180).rows[11].interes, { rel: true });
  add(10, 'frc12', 'Cuota fija: abono a capital de la cuota 12', () => R().fr_c12, NPF() + ' ppmt', 1e-9, () => K().french(80e6, 0.011, 180).rows[11].capital, { rel: true });
  add(10, 'deint', 'Abono constante a capital: intereses totales', () => R().de_int, 'i·P·(n+1)/2', 1e-9, () => K().german(80e6, 0.011, 180).totalInteres, { rel: true });
  add(10, 'prep0', 'Abonos extraordinarios nulos = crédito de cuota fija (diferencia de intereses)', 0, 'identidad', 1e-6, () => Math.abs(K().prepay(80e6, 0.011, 180, () => 0).totalInteres - K().french(80e6, 0.011, 180).totalInteres));
  add(10, 'uvr0', 'UVR con inflación 0 y tasa real = tasa en pesos: misma cuota', 0, 'identidad', 1e-6, () => { const u = K().uvrVsPesos({ P: 1e8, realEA: 0.1, inflEA: 0, pesosEA: 0.1, anos: 15 }); return Math.abs(u.rows[0].cuotaUVR - u.cuotaPesos); });

  /* ---------- 13 · Seguros ---------- */
  add(13, 'ec', 'Equivalente cierto sin seguro (utilidad logarítmica)', () => R().ec_sin, 'Python', 1e-9, () => L.hogar.seguro(20e6, 15e6, 0.02, 0).sin.EC, { rel: true });
  add(13, 'pmax', 'Prima máxima que conviene pagar', () => R().prima_max, 'SciPy optimize.brentq', 1e-7, () => L.hogar.seguro(20e6, 15e6, 0.02, 0).primaMax, { rel: true });

  /* ---------- 14 · Deudas ---------- */
  add(14, 'pm', 'Pago mínimo del 5 % (piso 50.000): meses para pagar 3 millones al 2,1 %', () => R().pm_meses, 'simulación independiente (Python)', 0, () => K().minPayment(3e6, 0.021, 0.05, 50000).meses);
  add(14, 'pmi', 'Ídem: intereses totales', () => R().pm_int, 'simulación independiente (Python)', 1e-9, () => K().minPayment(3e6, 0.021, 0.05, 50000).totalInteres, { rel: true });
  const DEU = [{ nombre: 'Tarjeta A', saldo: 4.5e6, im: 0.026, minimo: 180000 }, { nombre: 'Tarjeta B', saldo: 1.2e6, im: 0.019, minimo: 60000 }, { nombre: 'Libranza', saldo: 9e6, im: 0.014, minimo: 310000 }, { nombre: 'Almacén', saldo: 6e5, im: 0.03, minimo: 40000 }];
  add(14, 'ava', 'Avalancha con 1 millón al mes: intereses totales', () => R().av_int, 'simulación independiente (Python)', 1e-9, () => K().debtPlan(DEU, 1e6, 'avalancha').totalInteres, { rel: true });
  add(14, 'bol', 'Bola de nieve con 1 millón al mes: intereses totales', () => R().bo_int, 'simulación independiente (Python)', 1e-9, () => K().debtPlan(DEU, 1e6, 'bola').totalInteres, { rel: true });
  add(14, 'gota', 'Gota a gota (20 % en 30 cuotas diarias): tasa efectiva anual', () => R().gota_ea, NPF() + ' irr', 1e-8, () => K().gotaAGota(1e6, 0.2, 30).ea, { rel: true });

  /* ---------- 15 · Impuestos ---------- */
  add(15, 'renta', 'Impuesto (UVT) para bases de 1.000 a 40.000 UVT (máx |Δ|)', 0, 'tabla del art. 241 E.T. (Python)', 1e-9, () => Math.max(...[1000, 1500, 2000, 5000, 10000, 20000, 40000].map((b, k) => Math.abs(L.tax.renta(b) - R().renta[k]))));
  add(15, 'cont', 'Continuidad de la tabla en sus límites (máx salto, en UVT; la ley redondea las sumas fijas a la unidad)', 0, 'identidad', 0.1 + 1e-9, () => Math.max(...L.tax.TABLA.slice(1).map((r) => Math.abs(L.tax.renta(r[0] + 1e-9) - L.tax.renta(r[0] - 1e-9)))));

  /* ---------- 16 · Riesgo y rentabilidad ---------- */
  const sp = () => I().series('sp500');
  add(16, 'arit', 'S&P 500 1928-2025: media aritmética', () => R().dam_sp_arit, 'hoja de Damodaran (2026)', 1e-6, () => L.stat.mean(sp()));
  add(16, 'geo', 'S&P 500 1928-2025: media geométrica', () => R().dam_sp_geo, 'hoja de Damodaran (2026)', 1e-6, () => L.stat.geoMean(sp()));
  add(16, 'tbg', 'Letras del Tesoro: media geométrica', () => R().dam_tb_geo, 'hoja de Damodaran (2026)', 1e-6, () => L.stat.geoMean(I().series('tbill')));
  add(16, 'bog', 'Bonos a 10 años: media geométrica', () => R().dam_bo_geo, 'hoja de Damodaran (2026)', 1e-6, () => L.stat.geoMean(I().series('tbond')));
  add(16, 'real', 'S&P 500: media geométrica real', () => R().dam_sp_real_geo, 'hoja de Damodaran (2026)', 1e-6, () => L.stat.geoMean(I().series('sp500', 1928, 2025, true)));
  add(16, 'sd', 'S&P 500: desviación estándar anual', () => R().sp_sd, 'NumPy std (ddof = 1)', 1e-6, () => L.stat.sd(sp()));
  add(16, 'mdd', 'S&P 500: caída máxima con datos anuales', () => R().sp_mdd, 'NumPy', 1e-6, () => I().maxDrawdown(I().growth(sp())).dd);
  add(16, 'logn', 'Lognormal ajustada: E[1+R] = 1+μ (diferencia)', 0, 'identidad', 1e-12, () => { const p = I().lognormParams(0.08, 0.18); return Math.exp(p.m + (p.s * p.s) / 2) - 1.08; });
  add(16, 'z', 'Cuantil normal 0,975', () => R().z975, 'SciPy stats.norm.ppf', 1e-7, () => L.stat.normQuantile(0.975));
  add(16, 'phi', 'Distribución normal en 1', () => R().Phi1, 'SciPy stats.norm.cdf', 1e-7, () => L.stat.normCDF(1));

  /* ---------- 17 · Diversificación ---------- */
  add(17, 'sig10', 'Volatilidad de 10 activos (σ = 30 %, ρ = 0,25) en partes iguales', () => R().sigma10, 'NumPy √(wᵀΣw)', 1e-12, () => I().sigmaN(0.3, 0.25, 10));
  add(17, 'wmin', 'Peso de mínima varianza (σ 20 % y 7 %, ρ = 0,1)', () => R().wmin, 'SciPy minimize_scalar', 1e-7, () => I().minVarW(0.2, 0.07, 0.1));
  add(17, 'corr', 'Correlación S&P 500 – bonos a 10 años, 1928-2025', () => R().corr_sp_bo, 'NumPy corrcoef', 1e-6, () => L.stat.corr(sp(), I().series('tbond')));

  /* ---------- 18 · Instrumentos ---------- */
  add(18, 'bono', 'Precio de un bono semestral (cupón 9 %, rendimiento 11 %, 10 años)', () => R().bono_p, NPF() + ' pv', 1e-9, () => I().bondPrice(1000, 0.09, 0.11, 10, 2), { rel: true });
  add(18, 'mac', 'Duración de Macaulay del mismo bono (años)', () => R().bono_mac, 'NumPy', 1e-9, () => I().duration(1000, 0.09, 0.11, 10, 2).macaulay);
  add(18, 'par', 'Bono con rendimiento igual al cupón vale su nominal', 1000, 'identidad', 1e-9, () => I().bondPrice(1000, 0.08, 0.08, 7, 2));

  /* ---------- 19 · Costos ---------- */
  add(19, 'fee', 'Comisión sin aportes: (1+r)ⁿ(1−f)ⁿ', () => Math.pow(1.07 * 0.985, 30), 'fórmula cerrada', 1e-12, () => I().feeFinal(1, 0, 0.07, 0.015, 30), { rel: true });

  /* ---------- 20 · Especulación ---------- */
  add(20, 'kelly', 'Fracción de Kelly (p = 0,55; pago 1,5 a 1)', () => R().kelly, 'SciPy minimize_scalar', 1e-7, () => I().kellyOpt(0.55, 1.5));

  /* ---------- 21 · Vivienda ---------- */
  add(21, 'viv0', 'Comprar o arrendar sin diferencias de pago: quien arrienda solo capitaliza la cuota inicial', () => 100 * Math.pow(1.09, 20), 'fórmula cerrada', 1e-9, () => L.viv.comparar({ precio: 100, inicial: 1, tasaEA: 0.1, plazo: 20, valorizacion: 0, canon: 0.001, aumentoArriendo: 0, poseer: 0.012, compra: 0, venta: 0, rInv: 0.09, anos: 20 }).arrienda, { rel: true });
  add(21, 'viv1', 'Mismo caso: el patrimonio de quien compra es el precio (sin valorización ni costos)', 100, 'identidad', 1e-9, () => L.viv.comparar({ precio: 100, inicial: 1, tasaEA: 0.1, plazo: 20, valorizacion: 0, canon: 0.001, aumentoArriendo: 0, poseer: 0.012, compra: 0, venta: 0, rInv: 0.09, anos: 20 }).compra);
  add(21, 'renta', 'Rentabilidad bruta de un inmueble de 300 millones arrendado en 1.350.000', 0.054, '12 × canon / precio', 1e-12, () => L.viv.rentaInmueble(300e6, 1.35e6, 0, 0, 0).bruta);

  /* ---------- 25 · Fraudes ---------- */
  add(25, 'pir', 'Pirámide con k = 6 hasta superar 53 millones: participantes totales', (Math.pow(6, 11) - 1) / 5, 'serie geométrica', 0, () => L.fraude.piramide(6, 53e6).total);
  add(25, 'pirf', 'Fracción en el último nivel con k = 6 (tiende a 5/6)', () => Math.pow(6, 10) / ((Math.pow(6, 11) - 1) / 5), 'serie geométrica', 1e-12, () => L.fraude.piramide(6, 53e6).fraccionUltimo);
  add(25, 'ponzi', 'Contabilidad del Ponzi: caja = aportes − apropiado − pagado', 0, 'identidad', 1e-3, () => { const r = L.fraude.ponzi({ r: 0.03, E0: 1e8, g: 0.05, frena: 999, caida: 0.2, q: 0.3, f: 0.1, M: 24 }); const s = r.serie[r.serie.length - 1]; return Math.abs(s.caja - (r.totalIn - r.robado - r.totalOut)); });

  /* ---------- 23 · Retiro ---------- */
  const tri = (w, ws) => { const h = L.ret.historico(w, ws, 30); return h.filter((x) => x.ok).length / h.length; };
  add(23, 'tri1', 'Regla del 4 %, 50/50, 30 años: tasa de éxito histórica', () => R().tri_4_50, 'pandas sobre la hoja de Damodaran', 1e-12, () => tri(0.04, 0.5));
  add(23, 'tri2', 'Regla del 4 %, 75/25, 30 años', () => R().tri_4_75, 'pandas sobre la hoja de Damodaran', 1e-12, () => tri(0.04, 0.75));
  add(23, 'tri3', 'Retiro del 5 %, 50/50, 30 años', () => R().tri_5_50, 'pandas sobre la hoja de Damodaran', 1e-12, () => tri(0.05, 0.5));

  /* ---------- 24 · Independencia financiera ---------- */
  add(24, 'fi', 'Años hasta la independencia con 50 % de ahorro (5 % real, retiro 4 %)', () => R().fi50, 'SciPy optimize.brentq', 1e-9, () => L.ret.fiYears(0.5, 0.05, 0.04));
  add(24, 'fisim', 'Fórmula cerrada = acumulación año a año (diferencia en años)', 0, 'simulación', 0.06, () => { let W = 0, n = 0; while (W < 0.5 / 0.04) { W = W * 1.05 + 0.5; n++; } const f = L.ret.fiYears(0.5, 0.05, 0.04); return n - 1 < f && f <= n ? 0 : 1; });

  /* Ejecuta una prueba y devuelve {ok, v, ref, err} */
  L.runCheck = function (c) {
    let v, ref, msg = '';
    try { v = c.fn(); } catch (e) { v = NaN; msg = e.message; }
    try { ref = typeof c.ref === 'function' ? c.ref() : c.ref; } catch (e) { ref = NaN; msg = msg || e.message; }
    const err = c.rel ? Math.abs(v - ref) / Math.max(1e-300, Math.abs(ref)) : Math.abs(v - ref);
    return { ok: isFinite(err) && err <= c.tol, v, ref, err, msg };
  };
})(typeof window !== 'undefined' ? window : globalThis);
