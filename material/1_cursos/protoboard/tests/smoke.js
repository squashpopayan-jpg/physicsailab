global.window = global;
global.EM = { si: (x, u) => Number(x).toPrecision(3) + ' ' + (u || '') };
['30-spice', '31-spice-ac', '32-models', '33-parts', '34-net', '35-labparts', '36-bb', '37-bench'].forEach((f) => require('../src/core/' + f + '.js'));
const near = (a, b, tol, name) => { const ok = Math.abs(a - b) <= tol * Math.max(1e-9, Math.abs(b)) || Math.abs(a - b) < 1e-9; console.log((ok ? 'OK  ' : 'FAIL') + ' ' + name + ' got=' + a + ' exp=' + b); return ok; };

/* 1) LED + resistor con batería de 9 V */
{
  const b = new EM.Bench({ boards: ['half'] });
  b.loadSpec({
    parts: [['B1', 'BATP', { kind: 'alk9' }, 'B+1', 'B-1'], ['R1', 'R', { r: 330 }, 'e5', 'e9'], ['D1', 'LED', { color: 'rojo' }, 'd9', 'd12']],
    wires: [['a5', 'B+2'], ['a12', 'B-2']],
    probes: { dmmR: 'e9', dmmB: 'B-2' }, dmm: { mode: 'V=' }
  });
  b.rebuild();
  console.log('issues', b.issues);
  const i = b.iPart('D1');
  near(i, (9 - 1.95) / (330 + 1.7 + 6), 0.06, 'LED corriente');
  console.log('I(mA)=', i * 1000, 'check', JSON.stringify(b.check()));
  console.log('DMM', JSON.stringify(b.readDMM()));
  b.inst.dmm.mode = 'A=';
  console.log('DMM(A mode, jack v)', JSON.stringify(b.readDMM()));
}
/* 2) Amperímetro en serie */
{
  const b = new EM.Bench({ boards: ['half'] });
  b.loadSpec({
    parts: [['B1', 'BATP', { kind: 'alk9' }, 'B+1', 'B-1'], ['R1', 'R', { r: 1000 }, 'e5', 'e9']],
    wires: [['a5', 'B+2'], ['a9', 'B-2']],
    probes: { dmmR: 'd5', dmmB: 'd9' }, dmm: { mode: 'V=' }
  });
  b.rebuild();
  console.log('V sobre R1:', JSON.stringify(b.readDMM()));
  // ahora en serie: quitar el cable a5, poner el amperímetro entre B+2 y a5
  b.scene.wires = b.scene.wires.filter((w) => w.a !== 'bb:a5');
  b.scene.probes.dmmR = b.refPos('bb:b5'); // en la tira de R1
  b.scene.probes.dmmB = b.refPos('bb:B+3');
  b.inst.dmm.mode = 'A='; b.inst.dmm.jack = 'ma';
  b.invalidate(); b.rebuild();
  console.log('Amperimetro en serie (ma):', JSON.stringify(b.readDMM()));
  // medir voltaje con la punta en la toma mA -> cortocircuito de la bateria => fusible
  b.inst.dmm.mode = 'V=';
  b.scene.probes.dmmR = b.refPos('bb:B+3'); b.scene.probes.dmmB = b.refPos('bb:B-3');
  b.invalidate(); b.rebuild();
  for (let k = 0; k < 5; k++) b.frame(0.05);
  console.log('eventos', JSON.stringify(b.events.map((e) => e.kind + ':' + (e.desc || e.why))));
  console.log('Fusible:', JSON.stringify(b.inst.dmm.blown));
}
/* 3) Fuente de laboratorio + resistor (1/4 W) a sobrecarga: debe quemarse */
{
  const b = new EM.Bench({ boards: ['half'] });
  b.loadSpec({
    parts: [['R1', 'R', { r: 10 }, 'e5', 'e9']],
    wires: [['@ps1+', 'a5'], ['@ps1-', 'a9']],
    psu: { 1: { v: 12, ilim: 2, on: true } }
  });
  b.rebuild();
  console.log('R1 I=', b.iPart('R1'), 'V=', b.vPart('R1'));
  let t = 0;
  for (let k = 0; k < 400 && !b.part('R1').dead; k++) { b.frame(0.05); t += 0.05; }
  console.log('R1 dead?', JSON.stringify(b.part('R1').dead), 'after', t.toFixed(2), 's  T=', b.net.rt.R1.T.toFixed(0));
}
/* 4) Generador de funciones + RC + osciloscopio */
{
  const b = new EM.Bench({ boards: ['half'], tdiv: 2e-4 });
  b.loadSpec({
    parts: [['R1', 'R', { r: 1000 }, 'e5', 'e9'], ['C1', 'C', { c: 1e-7 }, 'd9', 'B-5']],
    wires: [['@fgo', 'a5'], ['@fgg', 'B-5'], ['a9', 'B+5']],
    fg: { wave: 'sin', f: 1000, amp: 2, on: true },
    probes: { s1: 'c5', s2: 'c9', s1g: 'B-6', s2g: 'B-6' }
  });
  b.rebuild();
  console.log('dyn', b.net.dyn);
  for (let k = 0; k < 60; k++) b.frame(0.05);
  const a1 = b.rings.c1.last(1000), a2 = b.rings.c2.last(1000);
  const s1 = EM.sigStats(a1, b.dt), s2 = EM.sigStats(a2, b.dt);
  console.log('CH1 pp=', s1.pp.toFixed(3), 'f=', s1.f && s1.f.toFixed(1), 'CH2 pp=', s2.pp.toFixed(3));
  // RC: f=1k, R=1k, C=100n -> |H| = 1/sqrt(1+(2*pi*f*RC)^2) =
  const w = 2 * Math.PI * 1000 * 1000 * 1e-7;
  console.log('esperado |H|=', 1 / Math.hypot(1, w), ' obtenido', s2.pp / s1.pp);
}
/* 5) 555 astable */
{
  const b = new EM.Bench({ boards: ['half'], tdiv: 0.05 });
  b.loadSpec({
    parts: [['U1', 'T555', {}, 'e10'], ['R1', 'R', { r: 1000 }, 'a14', 'a18'], ['R2', 'R', { r: 47000 }, 'b14', 'b19'], ['C1', 'CE', { c: 1e-5 }, 'c10', 'B-10']],
    wires: [], psu: { 1: { v: 9, on: true } }
  });
  b.rebuild();
  console.log('555 issues', b.issues, 'plugged', b.part('U1')._plugged);
}
