/* Validación numérica del motor: node test/engine.test.js */
const E = require('../src/engine.js');
const { cabs, cdiv, cmul, cadd, csub } = E.c;
let fails = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok  ' : '  FALLA ') + msg); if (!cond) fails++; };
const near = (a, b, rel, msg) => ok(Math.abs(a - b) <= rel * Math.abs(b) + 1e-12, `${msg}: ${a.toPrecision(6)} vs ${b.toPrecision(6)}`);

function tx({ n1 = 500, n2 = 250, V = 12, RL = 22, yoke = 'apretado', open = false, rs = 1e-6 }) {
  const p = E.coilSpec(n1 === 'X' ? 'cX' : 'c' + n1), s = E.coilSpec('c' + n2), core = E.coreParams(yoke);
  // redes: 1 fuente+, 2 fuente- (=tierra 0 no), usamos 0 como tierra de referencia del primario
  const c = { nNets: 4, f: 60, core, elems: [], windings: [] };
  c.elems.push({ k: 'V', a: 1, b: 0, E: [V, 0], r: rs, l: 0 });
  c.windings.push({ a: 1, b: 0, N: p.N, R: p.R, Ls: p.N * p.N * core.leak });
  c.windings.push({ a: 2, b: 3, N: s.N, R: s.R, Ls: s.N * s.N * core.leak });
  if (!open) c.elems.push({ k: 'R', a: 2, b: 3, R: RL });
  return { c, p, s, core };
}

console.log('1. Circuito lineal frente al modelo T analítico');
{
  const { c, p, s, core } = tx({});
  const r = E.solve(c), w = 2 * Math.PI * 60;
  const P = E.permeanceLin(core), k = s.N / p.N;
  const Ym1 = [r.Gc / p.N ** 2, -1 / (w * P * p.N ** 2)];
  const Z1 = [p.R, w * p.N ** 2 * core.leak], Z2 = [s.R + 22, w * s.N ** 2 * core.leak];
  const YL = cdiv([k * k, 0], Z2), Y = cadd(Ym1, YL);
  const E1 = cdiv([12, 0], cadd([1, 0], cmul(Z1, Y)));
  const I1 = cmul(E1, Y), I2 = cdiv([k * E1[0], k * E1[1]], Z2);
  near(cabs(r.sol[1].Iw[0]), cabs(I1), 1e-6, '|I1| fundamental');
  near(cabs(r.sol[1].Iw[1]), cabs(I2), 1e-6, '|I2| fundamental');
  const V2 = E.vrms(r, 2, 3);
  near(V2, 22 * cabs(I2), 2e-3, 'V2 RMS (incluye armónicos de red)');
  console.log('     V2 =', V2.toFixed(4), 'V  B =', r.B.toFixed(4), 'T  Pfe =', r.Pfe.toFixed(4), 'W  sat =', r.sat.toExponential(2));
  // balance de energía con todos los armónicos
  const H = E.HS, pin = E.power(H.map(h => E.vph(r, 1, 0, h)), H.map(h => E.iW(r, 0, h)));
  const i1 = E.irmsW(r, 0), i2 = E.irmsW(r, 1);
  let pfe = 0; for (const h of H) { const e = r.sol[h].e; pfe += r.Gc * (e[0] ** 2 + e[1] ** 2); }
  const pout = V2 * V2 / 22, losses = i1 * i1 * p.R + i2 * i2 * s.R + pfe;
  near(pin, pout + losses, 1e-6, 'Balance P1 = P2 + PCu + PFe');
  console.log('     P1 =', pin.toFixed(4), ' P2 =', pout.toFixed(4), ' η =', (100 * pout / pin).toFixed(2), '%  Reg aprox.');
}

console.log('2. Límite ideal: R→0, dispersión→0, núcleo sin entrehierro y μ enorme');
{
  const { c } = tx({});
  c.windings.forEach(w => { w.R = 1e-9; w.Ls = 0; });
  c.core = { ...c.core, mur: 1e9, gap: 1e-12, cFe: 1e-12 };
  const r = E.solve(c);
  near(E.vrms(r, 2, 3), 6, 1e-5, 'V2 = V1·N2/N1 (fuente sin armónicos)');
  near(cabs(r.sol[1].Iw[0]), 0.5 * cabs(r.sol[1].Iw[1]), 1e-5, 'I1 = k·I2');
}

console.log('3. Vacío: corriente de excitación y potencia de pérdidas');
{
  const { c, p, core } = tx({ open: true });
  const r = E.solve(c);
  const i0 = E.irmsW(r, 0), w = 2 * Math.PI * 60;
  const Lm = p.N ** 2 * E.permeanceLin(core);
  console.log('     I0 =', (1000 * i0).toFixed(2), 'mA ; Xm =', (w * Lm).toFixed(1), 'Ω ; Pfe =', r.Pfe.toFixed(4), 'W ; V2/V1 =', (E.vrms(r, 2, 3) / 12).toFixed(5));
  ok(i0 > 0.02 && i0 < 0.08, 'I0 entre 20 y 80 mA');
  ok(Math.abs(E.vrms(r, 2, 3) / 12 - 0.5) < 0.01, 'Relación en vacío ≈ 0.5');
}

console.log('4. Yugo flojo y retirado aumentan I0 y reducen V2');
{
  const res = ['apretado', 'flojo', 'retirado'].map(y => { const { c } = tx({ open: true, yoke: y }); const r = E.solve(c); return { y, i0: E.irmsW(r, 0), v2: E.vrms(r, 2, 3) }; });
  res.forEach(x => console.log(`     ${x.y.padEnd(9)} I0 = ${(1000 * x.i0).toFixed(1)} mA  V2 = ${x.v2.toFixed(3)} V`));
  ok(res[0].i0 < res[1].i0 && res[1].i0 < res[2].i0, 'I0 crece al abrir el circuito magnético');
  ok(res[0].v2 > res[1].v2 && res[1].v2 > res[2].v2, 'V2 cae al aumentar la dispersión');
}

console.log('5. Saturación con bobina de 100 espiras en el primario (vacío)');
{
  let prev = 0;
  for (const V of [4, 8, 12, 14, 16, 18]) {
    const { c } = tx({ n1: 100, n2: 250, V, open: true, rs: 0.25 });
    const r = E.solve(c);
    const i0 = E.irmsW(r, 0), h3 = cabs(r.sol[3].Iw[0]) / cabs(r.sol[1].Iw[0]);
    console.log(`     V1 = ${String(V).padStart(2)} V  B = ${r.B.toFixed(3)} T  I0 = ${i0.toFixed(3)} A  I0/V = ${(i0 / V).toFixed(4)}  3.er arm. = ${(100 * h3).toFixed(1)} %`);
    ok(i0 / V >= prev * 0.98, 'I0/V no decrece con V (salvo el término de pérdidas)');
    prev = i0 / V;
  }
}

console.log('6. Ensayo de cortocircuito a tensión reducida');
{
  const { c, p, s } = tx({ V: 5, RL: 1e-4 });
  const r = E.solve(c);
  const i1 = E.irmsW(r, 0), w = 2 * Math.PI * 60;
  const Req = p.R + s.R * 4, Xeq = w * (p.N ** 2 + 4 * s.N ** 2) * c.core.leak;
  console.log('     I1cc =', i1.toFixed(4), 'A ; Zeq teórica =', Math.hypot(Req, Xeq).toFixed(3), 'Ω ; V/I =', (5 / i1).toFixed(3), 'Ω');
  near(5 / i1, Math.hypot(Req, Xeq), 0.01, 'Zcc ≈ Req + jXeq (rama de excitación despreciable)');
}

console.log('7. Medición DC de resistencia de devanado');
{
  const p = E.coilSpec('c500');
  const c = { nNets: 3, f: 60, core: E.coreParams('apretado'), elems: [{ k: 'I', a: 1, b: 2, I: 1e-3 }], windings: [{ a: 1, b: 2, N: 500, R: p.R, Ls: 1e-3 }] };
  const x = E.solveDC(c);
  near((x.V[1][0] - x.V[2][0]) / 1e-3, p.R, 1e-6, 'R medida = R del devanado');
}

console.log('8. Lectura de multímetro');
{
  const rnd = E.mulberry32(1);
  const rd = E.dmmRead('V~', 5.6821, null, rnd), t = E.dmmText(rd);
  console.log('     5.6821 V →', t.txt, t.unit, ' u =', rd.u.toFixed(4));
  ok(t.txt.length === 5 && rd.range[0] === 6, 'rango 6 V con 3 decimales');
  const r2 = E.dmmText(E.dmmRead('mA~', 0.04052, null, rnd)); console.log('     40.52 mA →', r2.txt, r2.unit);
  ok(r2.unit === 'mA', 'rango mA');
  ok(E.dmmRead('A~', 12, null, rnd).ol, '12 A → OL');
}

console.log('9. Variación por banco');
{
  const a = E.benchVariant(3), b = E.benchVariant(3), d = E.benchVariant(4);
  ok(a.Nx === b.Nx && a.dialErr === b.dialErr, 'misma semilla, mismo equipo');
  ok(a.dialErr !== d.dialErr, 'bancos distintos difieren');
  const ns = new Set(); for (let i = 1; i <= 24; i++) ns.add(E.benchVariant(i).Nx); console.log('     N_X distintos en 24 bancos:', [...ns].join(', '));
}
console.log(fails ? `\n${fails} FALLAS` : '\nTodo correcto');
process.exit(fails ? 1 : 0);
