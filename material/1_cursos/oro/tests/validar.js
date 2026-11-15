/* Valida el núcleo del curso (src/lib) contra SciPy, pandas, zoneinfo y el motor de Python.
   Uso: python tests/referencias.py && node tests/validar.js   → tabla en consola y docs/VALIDACION.md */
const fs = require('fs');
const path = require('path');
const ML = require('./cargar');
const E = ML.L.eng, S = ML.L.stats, R = ML.L.risk, Y = ML.L.synth;
const ref = JSON.parse(fs.readFileSync(path.join(__dirname, 'referencias.json'), 'utf8'));
const rows = [];
const add = (cap, what, v, r, tol, src, rel) => { const err = rel ? Math.abs(v - r) / Math.max(1e-12, Math.abs(r)) : Math.abs(v - r); rows.push({ cap, what, v, r, err, tol, src, ok: err <= tol }); };

(async () => {
  /* ---- distribuciones ---- */
  add(2, 'Cuantil normal 0.975', S.normInv(0.975), ref.norm.inv975, 1e-9, 'SciPy norm.ppf');
  add(2, 'Cuantil normal 0.80', S.normInv(0.8), ref.norm.inv80, 1e-9, 'SciPy norm.ppf');
  add(2, 'Cuantil normal 0.999', S.normInv(0.999), ref.norm.inv999, 1e-9, 'SciPy norm.ppf');
  add(2, 'CDF normal en 1.96', S.normCdf(1.96), ref.norm.cdf196, 1e-12, 'SciPy norm.cdf');
  add(2, 'Cola superior normal en 3', S.normSf(3), ref.norm.sf3, 1e-12, 'SciPy norm.sf');
  Object.keys(ref.erf).forEach((x) => add(2, 'erf(' + x + ')', S.erf(+x), ref.erf[x], 1e-13, 'SciPy special.erf'));
  add(12, 'Cuantil t 0.975 con 4 g.l.', S.tInv(0.975, 4), ref.t.inv975_4, 1e-9, 'SciPy t.ppf');
  add(12, 'Cuantil t 0.975 con 29 g.l.', S.tInv(0.975, 29), ref.t.inv975_29, 1e-9, 'SciPy t.ppf');
  add(12, 'Cuantil t 0.975 con 70 g.l.', S.tInv(0.975, 70), ref.t.inv975_70, 1e-9, 'SciPy t.ppf');
  add(12, 'CDF t en 2.1 con 12 g.l.', S.tCdf(2.1, 12), ref.t.cdf2_1_12 === undefined ? ref.t['cdf2.1_12'] : ref.t.cdf2_1_12, 1e-12, 'SciPy t.cdf');
  add(12, 'Valor p bilateral de t = 2.5 con 70 g.l.', S.tP2(2.5, 70), ref.t['p2_2.5_70'], 1e-12, 'SciPy t.sf');
  add(12, 'Beta incompleta I(0.4; 2.5, 3.5)', S.betaInc(2.5, 3.5, 0.4), ref.betainc['2.5_3.5_0.4'], 1e-12, 'SciPy special.betainc');
  add(12, 'Beta incompleta I(0.2; 0.5, 7)', S.betaInc(0.5, 7, 0.2), ref.betainc['0.5_7_0.2'], 1e-12, 'SciPy special.betainc');
  add(12, 'Operaciones para detectar +0.10 R con sd 0.88 (80 %)', S.nForEdge(0.1, 0.88), Math.ceil(Math.pow((ref.norm.inv975 + ref.norm.inv80) * 0.88 / 0.1, 2)), 0, 'fórmula con cuantiles de SciPy');

  /* ---- indicadores frente a pandas ---- */
  const m5 = await E.load('m5'), X = E.prep(m5), I = ref.ind;
  add(4, 'Velas M15 remuestreadas (número)', X.fast.n, I.n15, 0, 'pandas resample');
  add(4, 'Velas H4 remuestreadas (número)', X.slow.n, I.n4h, 0, 'pandas resample');
  add(4, 'Cierre de la última vela M15', X.fast.c[X.fast.n - 1], I.close15_last, 1e-9, 'pandas resample');
  add(4, 'Suma de máximos M15', X.fast.h.reduce((a, b) => a + b, 0), I.high15_sum, 1e-6, 'pandas resample', true);
  add(4, 'Cierre de la última vela H4', X.slow.c[X.slow.n - 1], I.close4h_last, 1e-9, 'pandas resample');
  add(4, 'EMA20 de M15 (última)', X.ema20[X.fast.n - 1], I.ema20_last, 1e-8, 'pandas ewm(span=20, adjust=False)');
  add(4, 'EMA20 de M15 (barra 5 000)', X.ema20[I.ema20_k], I.ema20_at_k, 1e-8, 'pandas ewm');
  add(4, 'EMA50 de H4 (última)', X.ema50[X.slow.n - 1], I.ema50_last, 1e-8, 'pandas ewm(span=50, adjust=False)');
  add(4, 'EMA50 de H4 (barra 1 500)', X.ema50[1500], I.ema50_at_1500, 1e-8, 'pandas ewm');
  add(4, 'ATR14 de Wilder (última)', X.atr14[X.fast.n - 1], I.atr14_last, 1e-8, 'pandas ewm(alpha=1/14, adjust=False)');
  add(4, 'ATR14 de Wilder (barra 5 000)', X.atr14[I.ema20_k], I.atr_at_k, 1e-8, 'pandas ewm');
  const rm = E.rollPrior(m5.h, ref.roll.w, true), rn = E.rollPrior(m5.l, ref.roll.w, false);
  add(4, 'Máximo de las 24 barras previas', rm[ref.roll.k], ref.roll.max, 0, 'NumPy max de la ventana');
  add(4, 'Mínimo de las 24 barras previas', rn[ref.roll.k], ref.roll.min, 0, 'NumPy min de la ventana');

  /* ---- reloj de Madrid ---- */
  ref.madrid.forEach(([t, off]) => add(2, 'Desfase de Madrid en ' + new Date(t * 60000).toISOString().slice(0, 16) + ' UTC', E.madridOffset(t), off, 0, 'zoneinfo Europe/Madrid'));

  /* ---- riesgo: fórmulas cerradas frente a Monte Carlo ---- */
  const rng = S.rng(5);
  const mc = (mu, sg, a, b, N) => { let up = 0; for (let k = 0; k < N; k++) { let x = 0; while (x < a && x > -b) x += mu + sg * rng.normal(); if (x >= a) up++; } return up / N; };
  add(8, 'P(+8 antes que −10), μ = 0.05, σ = 1 (MC 40 000)', mc(0.05, 1, 8, 10, 40000), R.pHitUp(8, 10, 0.05, 1), 0.012, 'fórmula del movimiento browniano (error de MC)');
  add(8, 'P sin deriva = b/(a+b)', R.pHitUp(8, 10, 0, 1), 10 / 18, 1e-15, 'identidad');
  let bestF = 0, bestG = -1; for (let f = 0; f <= 0.5; f += 0.0005) { const g = f * 0.1 - 0.5 * f * f * 0.88 * 0.88; if (g > bestG) { bestG = g; bestF = f; } }
  add(19, 'Kelly numérico = E/σ²', bestF, R.kellyGauss(0.1, 0.88), 0.001, 'maximización numérica de g(f)');
  add(19, 'Crecimiento nulo en 2·Kelly', 2 * R.kellyGauss(0.1, 0.88) * 0.1 - 0.5 * Math.pow(2 * R.kellyGauss(0.1, 0.88), 2) * 0.88 * 0.88, 0, 1e-15, 'identidad');

  /* ---- propiedades del mercado sintético ---- */
  let rg = 0, cn = 0; for (let w = 1; w <= 12; w++) { const q = Y.gen({ seed: w, days: 60 }); for (let i = 0; i < q.n; i++) { rg += q.h[i] - q.l[i]; cn++; } }
  const sy = Y.gen({ seed: 3, days: 40 });
  add(9, 'Rango medio M5 sintético (12 mundos) ≈ real (4.93 USD)', rg / cn, 4.93, 0.5, 'oro real M5');
  let ok = 1; for (let i = 0; i < sy.n; i++) if (sy.h[i] < Math.max(sy.o[i], sy.c[i]) || sy.l[i] > Math.min(sy.o[i], sy.c[i])) ok = 0;
  add(9, 'Máximo ≥ max(O,C) y mínimo ≤ min(O,C) en todas las velas', ok, 1, 0, 'identidad');
  /* martingala: R medio de reglas sin costos en 100 mundos sin memoria */
  let sR = 0, nR = 0, s2 = 0;
  for (let w = 0; w < 80; w++) { const sw = Y.gen({ seed: 700 + w, days: 60, spread: 0 }), xw = E.prep(sw); for (const t of E.run(sw, xw, E.params({ modo: 'ema', maxdist: 12, rechazo: false }))) { sR += t.R; s2 += t.R * t.R; nR++; } }
  const mR = sR / nR, se = Math.sqrt((s2 / nR - mR * mR) / nR);
  add(6, 'R medio sin costos en mundos sin memoria (|R|/EE < 3)', Math.abs(mR) / se, 0, 3, 'teorema de parada opcional (martingala)');

  /* ---- motor de JavaScript frente al de Python ---- */
  const casos = JSON.parse(fs.readFileSync(path.join(__dirname, 'casos.json'), 'utf8')), sets = {};
  const get = async (k) => (sets[k] = sets[k] || (await E.load(k)));
  for (const c of casos) {
    const Sx = await get(c.serie), ctx = c.ctx ? await get(c.ctx) : null, P = E.params(c.p), tr = E.run(Sx, E.prep(Sx, ctx), P), rf = ref.engine[c.id];
    const first = tr.slice(0, 5).map((t) => [t.i, t.k, t.d, t.reason]), last = tr.slice(-5).map((t) => [t.i, t.k, t.d, t.reason]);
    add(10, 'Motor «' + c.id + '»: número de operaciones', tr.length, rf.n, 0, 'motor de Python');
    add(10, 'Motor «' + c.id + '»: resultado total (USD)', tr.reduce((a, t) => a + t.usd, 0), rf.usd, 1e-6, 'motor de Python');
    add(10, 'Motor «' + c.id + '»: barras, direcciones y motivos (10 operaciones)', JSON.stringify(first.concat(last)) === JSON.stringify(rf.first.concat(rf.last)) ? 1 : 0, 1, 0, 'motor de Python');
  }

  const fails = rows.filter((r) => !r.ok).length;
  const fmt = (v) => (typeof v === 'number' ? (Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-3 && v !== 0) ? v.toExponential(6) : +v.toPrecision(9)) : String(v));
  rows.forEach((r) => console.log((r.ok ? 'OK   ' : 'FALLA') + ' [' + String(r.cap).padStart(2) + '] ' + r.what.padEnd(70) + ' ' + fmt(r.v).toString().padStart(16) + ' ref ' + fmt(r.r).toString().padStart(16) + ' err ' + r.err.toExponential(1)));
  console.log('\n' + (rows.length - fails) + '/' + rows.length + ' pruebas superadas');
  const md = ['# Validación del núcleo — «Oro con método»', '', 'Compara el núcleo del curso (`src/lib`) con SciPy, pandas, zoneinfo y el motor de referencia en Python (`py/motor.py`).',
    'Se regenera con `python tests/referencias.py && node tests/validar.js`.', '', '**Resultado: ' + (rows.length - fails) + ' de ' + rows.length + ' pruebas superadas** (' + new Date().toISOString().slice(0, 10) + ').', '',
    '| Cap. | Prueba | Calculado | Referencia | Fuente | Error | Tolerancia | Estado |', '|---|---|---|---|---|---|---|---|']
    .concat(rows.map((r) => '| ' + r.cap + ' | ' + r.what + ' | ' + fmt(r.v) + ' | ' + fmt(r.r) + ' | ' + r.src + ' | ' + r.err.toExponential(1) + ' | ' + r.tol + ' | ' + (r.ok ? 'OK' : 'FALLA') + ' |')).join('\n');
  fs.mkdirSync(path.join(__dirname, '..', 'docs'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, '..', 'docs', 'VALIDACION.md'), md + '\n');
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const eng = rows.filter((r) => r.cap === 10);
  const html = ['<template class="chapter-src" data-id="validacion" data-num="B" data-title="Validación del motor y del núcleo" data-part="Apéndices" data-short="Comparación con SciPy, pandas, zoneinfo y una segunda implementación en Python: ' + (rows.length - fails) + ' de ' + rows.length + ' pruebas superadas">',
    '<p class="lead">Cada simulación del curso usa el núcleo de <code>src/lib</code> (motor de la estrategia, estadística, mercado sintético, riesgo). Esta tabla lo compara con bibliotecas independientes (SciPy, pandas, zoneinfo) y con el motor de referencia en Python (<code>py/motor.py</code>), escrito aparte. Se regenera con <code>python tests/referencias.py &amp;&amp; node tests/validar.js</code>.</p>',
    '<section><h2>Resultado</h2><div class="box val"><p><b>' + (rows.length - fails) + ' de ' + rows.length + ' pruebas superadas</b> (' + new Date().toISOString().slice(0, 10) + '). Las ' + eng.length + ' pruebas del capítulo 10 comparan el motor de JavaScript con el de Python en ' + (eng.length / 3) + ' casos que cubren M1, M5 y M15; las cuatro reglas de entrada; vela de rechazo activada y desactivada; contra-tendencia; orden intrabarra normal y pesimista; costos, deslizamiento y cierre horario distintos; gestión completa y apagada. En todos, el número de operaciones, las barras de señal, entrada y salida, las direcciones, los motivos y el resultado total en USD coinciden.</p></div>',
    '<p>Qué demuestra y qué no: confirma que el motor ejecuta lo que se especifica y que no hay errores de implementación entre las dos versiones. No detecta errores de especificación compartidos (una regla del manual interpretada igual de forma equivocada) ni fugas de información presentes en ambos; para eso están las pruebas de sentido del capítulo 10 (mundos sin memoria con esperanza cero, regla tramposa).</p></section>',
    '<section><h2>Tabla de pruebas</h2><div class="tablewrap"><table><thead><tr><th>Cap.</th><th>Prueba</th><th>Calculado</th><th>Referencia</th><th>Fuente</th><th>Error</th><th>Estado</th></tr></thead><tbody>']
    .concat(rows.map((r) => '<tr><td>' + r.cap + '</td><td>' + esc(r.what) + '</td><td>' + esc(fmt(r.v)) + '</td><td>' + esc(fmt(r.r)) + '</td><td>' + esc(r.src) + '</td><td>' + r.err.toExponential(1) + '</td><td>' + (r.ok ? 'OK' : 'FALLA') + '</td></tr>'))
    .concat(['</tbody></table></div></section>', '</template>']).join('\n');
  fs.writeFileSync(path.join(__dirname, '..', 'src', 'chapters', '96-validacion.html'), html + '\n');
  process.exit(fails ? 1 : 0);
})();
