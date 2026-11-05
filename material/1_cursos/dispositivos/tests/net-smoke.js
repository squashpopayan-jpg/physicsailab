global.window = global;
global.EM = { si: (x, u) => x.toPrecision(3) + ' ' + (u || '') };
['30-spice', '31-spice-ac', '32-models', '33-parts', '34-net'].forEach((f) => require('../src/core/' + f + '.js'));
const S = EM.spice;
const near = (a, b, tol, name) => { const ok = Math.abs(a - b) <= tol * Math.max(1e-9, Math.abs(b)) || Math.abs(a - b) < 1e-9; console.log((ok ? 'OK  ' : 'FAIL') + ' ' + name + ' got=' + a + ' exp=' + b); return ok; };

/* 1) LED + resistor */
{
  const net = new EM.Net();
  net.load(EM.Net.fromSpec({
    parts: [['V1', 'VDC', 4, 8, 0, { v: 5 }], ['R1', 'R', 10, 4, 0, { r: 330 }], ['D1', 'LED', 16, 8, 1, { color: 'rojo' }]],
    wires: [['V1.0', [4, 4], 'R1.0'], ['R1.1', [16, 4], 'D1.0'], ['D1.1', [16, 12], [4, 12], 'V1.1'], ['V1.1', 'gnd']]
  }));
  net.solveOP();
  console.log('LED I(mA)=', net.iPart(net.part('D1')) * 1000, 'Vd=', net.vDiff(net.part('D1'), 0, 1));
}
/* 2) RC transitorio */
{
  const net = new EM.Net();
  net.load(EM.Net.fromSpec({
    parts: [['V1', 'VDC', 4, 8, 0, { v: 5 }], ['R1', 'R', 10, 4, 0, { r: 1000 }], ['C1', 'C', 16, 8, 1, { c: 1e-6 }]],
    wires: [['V1.0', [4, 4], 'R1.0'], ['R1.1', [16, 4], 'C1.0'], ['C1.1', [16, 12], [4, 12], 'V1.1'], ['V1.1', 'gnd']]
  }));
  net.rebuild(); net.cir.solveDC();
  net.cir.els.find((e) => e.id === 'C1:c').vprev = 0;
  net.cir.x.fill(0);
  net.cir.find('V1:e0').v = 5;
  net.cir.restart = true;
  for (let i = 0; i < 300; i++) net.step(1e-5);
  const vc = net.vPin(net.part('C1'), 0);
  near(vc, 5 * (1 - Math.exp(-3)), 5e-3, 'RC 3tau (Net)');
  console.log('pin ok; dyn=', net.dyn);
}
/* 3) amplificador EC */
{
  const net = new EM.Net();
  net.load(EM.Net.fromSpec({
    parts: [['VCC', 'VDC', 2, 6, 0, { v: 12 }], ['R1', 'R', 10, 6, 1, { r: 47000 }], ['R2', 'R', 10, 14, 1, { r: 10000 }], ['RC', 'R', 18, 6, 1, { r: 4700 }], ['RE', 'R', 18, 14, 1, { r: 1000 }], ['Q1', 'NPN', 16, 10, 0, { model: '2N3904' }]],
    wires: [['VCC.0', '@vcc:u'], ['R1.0', '@vcc:u'], ['RC.0', '@vcc:u'], ['R1.1', 'R2.0'], ['R1.1', 'Q1.1'], ['RC.1', 'Q1.0'], ['Q1.2', 'RE.0'], ['VCC.1', 'gnd'], ['R2.1', 'gnd'], ['RE.1', 'gnd']]
  }));
  net.solveOP();
  const q = net.part('Q1');
  console.log('EC: Vb=', net.vPin(q, 1), 'Vc=', net.vPin(q, 0), 'Ve=', net.vPin(q, 2), 'Ic(mA)=', net.rt.Q1.ref.main.ic * 1000);
  /* AC */
  net.cir.find('VCC:e0');
}
/* 4) 555 astable */
{
  const net = new EM.Net();
  net.load(EM.Net.fromSpec({
    parts: [['VCC', 'VDC', 2, 8, 0, { v: 9 }], ['U1', 'T555', 14, 8, 0], ['RA', 'R', 22, 3, 1, { r: 1000 }], ['RB', 'R', 22, 9, 1, { r: 47000 }], ['C1', 'C', 22, 15, 1, { c: 1e-6 }], ['C2', 'C', 8, 14, 1, { c: 1e-8 }]],
    wires: [['VCC.0', '@vcc:u'], ['U1.VCC', '@vcc:u'], ['U1.RESET', '@vcc:l'], ['RA.0', '@vcc:u'], ['RA.1', 'RB.0'], ['RA.1', 'U1.DIS'], ['RB.1', 'C1.0'], ['RB.1', 'U1.THR'], ['U1.THR', 'U1.TRIG'], ['C1.1', 'gnd'], ['U1.GND', 'gnd'], ['VCC.1', 'gnd'], ['U1.CTRL', 'C2.0'], ['C2.1', 'gnd']]
  }));
  net.rebuild(); net.cir.solveDC();
  const out = net.netInfo.pinNet.U1[4];
  const res = S.tran ? null : null;
  let t = 0, edges = [], last = net.v(out);
  const dt = 2e-5;
  for (let i = 0; i < 100000; i++) {
    net.step(dt);
    const v = net.v(out);
    if (last < 4 && v >= 4) edges.push(net.cir.t);
    last = v;
    if (edges.length >= 6) break;
  }
  const per = (edges[edges.length - 1] - edges[1]) / (edges.length - 2);
  console.log('555: edges', edges.length, 'T=', per, 'esperado', 0.693 * (1000 + 2 * 47000) * 1e-6);
}
/* 5) regulador 7805 con puente */
{
  const net = new EM.Net();
  net.load(EM.Net.fromSpec({
    parts: [['AC', 'VAC', 2, 8, 0, { amp: 17, f: 60 }], ['BR', 'BR', 10, 8, 0], ['C1', 'C', 16, 6, 1, { c: 2200e-6, kind: 'elec', vmax: 35 }], ['U1', 'REG', 24, 4, 0, { model: '7805' }], ['C2', 'C', 30, 6, 1, { c: 100e-6, kind: 'elec' }], ['RL', 'R', 34, 6, 1, { r: 10 }]],
    wires: [['AC.0', 'BR.0'], ['AC.1', 'BR.1'], ['BR.2', [16, 4], 'C1.0'], ['C1.0', 'U1.IN'], ['U1.OUT', 'C2.0'], ['C2.0', 'RL.0'], ['BR.3', 'gnd'], ['C1.1', 'gnd'], ['C2.1', 'gnd'], ['RL.1', 'gnd'], ['U1.COM', 'gnd']]
  }));
  net.rebuild(); net.cir.solveDC();
  const outn = net.netInfo.pinNet.RL[0], inn = net.netInfo.pinNet.C1[0];
  let vmin = 1e9, vmax = -1e9, vi_min = 1e9, vi_max = -1e9;
  const dt = 1e-4;
  const t0 = Date.now();
  for (let i = 0; i < 6000; i++) {
    net.step(dt); net.accumulate(dt);
    if (i > 4000) { const v = net.v(outn), vi = net.v(inn); vmin = Math.min(vmin, v); vmax = Math.max(vmax, v); vi_min = Math.min(vi_min, vi); vi_max = Math.max(vi_max, vi); }
  }
  console.log('fuente 5V: Vout', vmin, vmax, ' Vin(rizado)', vi_min, vi_max, 'ms', Date.now() - t0);
  const f = net.tick(1); console.log('fallos', f.map((p) => p.id), net.alerts.map((a) => a.text));
}
console.log('fin');
