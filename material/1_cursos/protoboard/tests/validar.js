/* Validación del motor y de las cifras de los capítulos: contra fórmulas exactas, soluciones independientes y
   los ejemplos del texto. Escribe tests/resultados.json (lo lee build.js). node tests/validar.js */
const fs = require('fs'), path = require('path');
const { EM, loadChapter, labOf } = require('./harness');
const rows = [];
const chk = (group, name, got, exp, tol, abs) => {
  const err = abs ? Math.abs(got - exp) : Math.abs(got - exp) / Math.max(1e-12, Math.abs(exp));
  rows.push({ group, name, got, exp, tol: abs ? '± ' + tol : (tol * 100).toFixed(2) + ' %', pass: isFinite(err) && err <= tol });
};
const S = {}; const sims = (f) => (S[f] = S[f] || loadChapter(f));
const lab = (f, id, ctl) => { const c = sims(f)[id].cfgs[0]; const l = labOf(c); l.bench.noBudget = true; (ctl || []).forEach(([i, v]) => c.controls[i].apply(l, v)); return l; };
const G1 = 'Soluciones exactas (fórmulas)', G2 = 'Solución independiente (bisección con el mismo modelo)', G3 = 'Cifras citadas en los capítulos', G4 = 'Dinámica contra la solución analítica';

/* ---- 1. fórmulas exactas ---- */
{ const l = lab('06-divisor.js', 'c6-divisor'); l.run(0.2); chk(G1, 'Divisor 4,7k/10k a 10 V (V en R₂)', l.dmm().value, 10 * 10 / 14.7, 1e-3); }
for (const [rl, nm] of [[1e6, '1 MΩ'], [1e5, '100 kΩ'], [1e4, '10 kΩ'], [1e3, '1 kΩ']]) { const l = lab('06-divisor.js', 'c6-carga', [[0, rl]]); l.run(0.2); const Rp = (1e4 * rl) / (1e4 + rl); chk(G1, 'Divisor 10k/10k con carga ' + nm, l.dmm().value, 10 * Rp / (Rp + 1e4), 2e-3); }
{ const l = lab('02-fuente.js', 'c2-fuente', [[0, 12], [1, 0.5], [2, 22]]); l.run(0.2); chk(G1, 'Fuente en C.C.: 0,5 A × 22 Ω', l.bench.psuOut(1).v, 11, 1e-6); chk(G1, 'Fuente en C.C.: corriente', l.bench.psuOut(1).i, 0.5, 1e-6); }
{ const l = lab('02-fuente.js', 'c2-fuente', [[0, 5], [1, 0.5], [2, 4.7]]); l.run(0.2); chk(G1, 'Fuente C.C. a 5 V con 4,7 Ω: 2,35 V', l.bench.psuOut(1).v, 2.35, 1e-6); }
{ const c = sims('05-resistores.js')['c5-redes'].cfgs[0]; for (const [k, t] of [['serie', 1020], ['paralelo', 103.1], ['mixta', 413.9]]) { const l = labOf(c); c.controls[0].apply(l, k); l.run(0.1); const d = l.dmm(); chk(G1, 'Red ' + k + ' medida con ohmímetro (tol. 1 %)', d.unit === 'kΩ' ? d.value : d.value, t, 0.015); } }
{ const c = sims('07-condensadores.js')['c7-carga'].cfgs[0]; const l = labOf(c); l.bench.noBudget = true; l.run(1.0, 0.01); const t = l.bench.simT; const rl = 1e6, R = 1e4, C = 1e-4, Vinf = 5 * rl / (rl + R), tau = (R * rl / (R + rl)) * C; chk(G4, 'Carga RC con fuga a t = ' + t.toFixed(2) + ' s', l.vp('C1'), Vinf * (1 - Math.exp(-t / tau)), 5e-3); }
for (const f of [100, 1000, 1516, 5000, 20000]) { const c = sims('03-senales.js')['c3-rc'].cfgs[0]; const l = labOf(c); l.bench.noBudget = true; c.controls[0].apply(l, f); l.bench.fastForward(Math.max(0.003, 12 / f)); const a = l.stat('c1'), b = l.stat('c2'); const fc = 1 / (2 * Math.PI * 1000 * 1e-7); chk(G4, 'Filtro RC pasabajos a ' + f + ' Hz: ganancia', b.pp / a.pp, 1 / Math.hypot(1, f / fc), 0.02); }
for (const f of [100, 1000, 1592, 10000]) { const c = sims('07-condensadores.js')['c7-pasaaltos'].cfgs[0]; const l = labOf(c); l.bench.noBudget = true; c.controls[0].apply(l, f); l.bench.fastForward(Math.max(0.003, 12 / f)); const a = l.stat('c1'), b = l.stat('c2'); const fc = 1 / (2 * Math.PI * 1000 * 1e-7); chk(G4, 'Filtro RC pasaaltos a ' + f + ' Hz: ganancia', b.pp / a.pp, 1 / Math.hypot(1, fc / f), 0.02); }
{ const l = lab('03-senales.js', 'c3-scope'); l.bench.setTdiv(5e-4); l.run(0.05, 0.01); const s = l.stat('c1'); chk(G1, 'Generador 2 Vpp sobre 1 kΩ con 50 Ω de salida', s.pp, 2 * 1000 / 1050, 0.02); chk(G1, 'Frecuencia medida por el osciloscopio (1 kHz)', s.f, 1000, 0.01); }
for (const [rf, rin, k, a] of [[10000, 1000, 'inv', 0.5], [10000, 1000, 'noinv', 0.3], [47000, 10000, 'inv', 1]]) { const l = lab('14-opamp.js', 'c14-opamp'); const c = sims('14-opamp.js')['c14-opamp'].cfgs[0]; const L = labOf(c); L.bench.noBudget = true; c.controls[0].apply(L, k); c.controls[1].apply(L, rf); c.controls[2].apply(L, rin); c.controls[3].apply(L, a); L.run(0.6, 0.01); const x = L.stat('c1'), y = L.stat('c2'); chk(G1, 'A.O. ' + k + ' R_f=' + rf + ', R_in=' + rin + ': |ganancia|', y.pp / x.pp, k === 'inv' ? rf / rin : 1 + rf / rin, 0.01); }
{ const c = sims('17-reguladores.js')['c17-lm317'].cfgs[0]; for (const r2 of [240, 720, 1200]) { const l = labOf(c); c.controls[0].apply(l, r2); l.run(0.3, 0.05); chk(G1, 'LM317 con R₂ = ' + r2 + ' Ω', l.dmm().value, 1.25 * (1 + r2 / 240) + 50e-6 * r2, 0.01); } }
{ const c = sims('21-proyectos-energia.js')['p9-pila'].cfgs[0]; for (const [k, rs] of [['alk9', 1.7], ['aa4', 0.6], ['li', 0.08]]) { const l = labOf(c); c.controls[0].apply(l, k); c.controls[1].apply(l, 22); l.run(0.2, 0.05); const E = l.part('B1').p.v, V = l.v('B+5', 'B-5'), I = Math.abs(l.i('B1')); chk(G1, 'Resistencia interna medida (' + k + ')', (E - V) / I, rs, 1e-3); } }
{ const l = lab('04-danos.js', 'c4-resistor', [[0, 5], [1, 0.25], [2, 100]]); l.run(0.2); chk(G1, 'Potencia en 100 Ω a 5 V', l.vp('R1') ** 2 / 100, 0.25, 2e-3); }
{ const l = lab('09-diodos.js', 'c9-zener', [[0, 9], [1, 330], [2, 1000]]); l.run(0.3); chk(G1, 'Zener 5,1 V con 1 kΩ: salida', l.dmm().value, 5.1, 0.03); }

/* ---- 2. solución independiente del LED con resistor (bisección con el mismo modelo del diodo) ---- */
{ const M = EM.spice.MOD.LED.rojo, VT = EM.spice.VT, rb = 1.7; const f = (I, R) => 9 - I * (rb + R) - I * M.rs - M.n * VT * Math.log(I / M.Is + 1);
  for (const R of [330, 1000, 4700]) { let a = 1e-9, b = 0.05; for (let k = 0; k < 200; k++) { const m = (a + b) / 2; if (f(m, R) > 0) a = m; else b = m; } const l = lab('01-banco.js', 'c1-errores'); l.load({ parts: [['B1', 'BATP', { kind: 'alk9' }, 'B+1', 'B-1'], ['R1', 'R', { r: R }, 'e5', 'e9'], ['D1', 'LED', { color: 'rojo' }, 'd9', 'd12']], wires: [['a5', 'B+2'], ['a12', 'B-2']] }); chk(G2, 'LED rojo con ' + R + ' Ω y batería de 9 V', l.i('D1'), (a + b) / 2, 5e-3); } }

/* ---- 3. cifras citadas ---- */
{ const l = lab('11-bjt.js', 'c11-led', [[1, 10000], [0, 5]]); l.run(0.3, 0.05); chk(G3, 'BC547 saturado: I_C = 9,05 mA', l.i('R1'), 9.05e-3, 0.03); chk(G3, 'BC547 saturado: V_CE < 0,1 V', Math.abs(l.vp('Q1', 0, 2)), 0.05, 0.05, true); }
{ const c = sims('11-bjt.js')['c11-led'].cfgs[0]; const l = labOf(c); c.controls[1].apply(l, 470000); c.controls[0].apply(l, 5); l.run(0.3, 0.05); chk(G3, 'BC547 en región activa (470 kΩ): β medida', Math.abs(l.i('R1')) / Math.abs(l.i('R2')), 306, 0.05); }
{ const c = sims('12-amplificador.js')['c12-amp'].cfgs[0]; let l = labOf(c); l.bench.noBudget = true; l.run(0.3, 0.01); const b = l.bench; const VB = 12 * 10 / 57; chk(G3, 'Polarización: V_B del divisor 47k/10k', b.vRef('a11'), VB, 0.03); chk(G3, 'Polarización: V_E = V_B − 0,65 V', b.vRef('a12'), VB - 0.65, 0.07); chk(G3, 'Polarización: V_C', b.vRef('a10'), 12 - (VB - 0.65) * 4.7, 0.08); chk(G3, 'Ganancia con desacople (teoría −173)', l.stat('c2').pp / l.stat('c1').pp, 173, 0.12); c.controls[0].apply(l, false); l.run(0.3, 0.01); chk(G3, 'Ganancia sin desacople (teoría −3,1)', l.stat('c2').pp / l.stat('c1').pp, 3.14, 0.06); }
{ const c = sims('16-555.js')['c16-astable'].cfgs[0]; const l = labOf(c); l.bench.noBudget = true; l.run(8, 0.05); const s = l.stat('c2'); chk(G3, '555 astable: frecuencia (1,44/((R₁+2R₂)C))', s.f, 1.44 / (95000 * 1e-5), 0.03); chk(G3, '555 astable: ciclo de trabajo', s.duty, 48000 / 95000, 0.04); }
{ const c = sims('16-555.js')['c16-mono'].cfgs[0]; const l = labOf(c); l.bench.noBudget = true; l.run(0.5, 0.05); l.press('S1', true); l.run(0.1, 0.05); l.press('S1', false); let t0 = null, t1 = null; for (let k = 0; k < 400; k++) { l.run(0.01, 0.01); const on = l.i('D1') > 0.001; if (on && t0 === null) t0 = l.bench.simT; if (!on && t0 !== null && t1 === null) t1 = l.bench.simT; } chk(G3, '555 monoestable: duración del pulso 1,1·R·C', t1 - t0 + 0.1, 1.1, 0.12); }
{ const c = sims('10-rectificacion.js')['c10-puente'].cfgs[0]; const l = labOf(c); l.bench.noBudget = true; l.run(0.5, 0.0073); const s0 = l.stat('c1'); chk(G3, 'Puente sin filtro: pico = √2·12 − 1,4 V', s0.mx, 12 * Math.SQRT2 - 1.4, 0.03); c.controls[0].apply(l, 4.7e-4); l.run(0.8, 0.0073); const s = l.stat('c1'); chk(G3, 'Rizado con 470 µF (ΔV ≈ I/(2fC))', s.pp, (s.mean / 470) / (2 * 60 * 4.7e-4), 0.35); }
{ const c = sims('10-rectificacion.js')['c10-fuente'].cfgs[0]; const l = labOf(c); l.bench.noBudget = true; l.run(1.2, 0.0073); chk(G3, 'Fuente lineal: salida del 7805', l.stat('c2').mean, 5, 0.01); }
{ const c = sims('17-reguladores.js')['c17-7805'].cfgs[0]; const l = labOf(c); c.controls[0].apply(l, 6); l.run(0.3, 0.05); chk(G3, '7805 bajo dropout (6 V → 3,99 V)', l.dmm().value, 3.99, 0.02); }
{ const c = sims('15-comparador.js')['c15-crepuscular'].cfgs[0]; const l = labOf(c); c.controls[0].apply(l, 1); l.run(0.3, 0.01); const RL = 20000 * Math.pow(10, 0.7); chk(G3, 'Comparador: LDR a 1 lux (IN−), con la entrada de 1 MΩ del A.O.', l.v('a11', 'B-8'), (5 / RL + 2.5 / 1e6) / (1 / RL + 1 / 10000 + 1 / 1e6), 0.02); }
{ const c = sims('13-mosfet.js')['c13-motor'].cfgs[0]; const l = labOf(c); l.bench.noBudget = true; c.controls[0].apply(l, 0.5); l.run(2, 0.02); const w = l.bench.net.rt.M1.motor.w / 600; chk(G3, 'Motor con PWM al 50 %: velocidad relativa', w, 0.37, 0.12); }

const ok = rows.filter((r) => r.pass).length, bad = rows.length - ok;
const out = { fecha: new Date().toLocaleDateString('es-CO'), ok, bad, rows };
fs.writeFileSync(path.join(__dirname, 'resultados.json'), JSON.stringify(out, null, 1));
console.log(ok + ' de ' + rows.length + ' pruebas superadas');
rows.filter((r) => !r.pass).forEach((r) => console.log('✗', r.group, '|', r.name, '| got', r.got, 'exp', r.exp, r.tol));
