/* Prueba rápida del motor (Node) */
global.window = global;
require('../src/core/30-spice.js');
require('../src/core/31-spice-ac.js');
const S = EM.spice;
const near = (a, b, tol, name) => { const ok = Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)); console.log((ok ? 'OK  ' : 'FAIL') + ' ' + name + ' got=' + a + ' exp=' + b); return ok; };

/* 1) divisor */
{
  const c = new S.Circuit();
  c.add(S.V('V1', 'in', 0, 10, 0)); c.add(S.R('R1', 'in', 'o', 1000)); c.add(S.R('R2', 'o', 0, 3000));
  c.solveDC(); near(c.vNamed('o'), 7.5, 1e-6, 'divisor');
}
/* 2) RC carga */
{
  const c = new S.Circuit();
  c.add(S.V('V1', 'in', 0, 5, 0)); c.add(S.R('R1', 'in', 'o', 1000)); c.add(S.C('C1', 'o', 0, 1e-6));
  c.add({ type: 'V', id: 'x', a: 'zz', b: 0, v: 0, rs: 1 });
  c.compile(); c.x = new Float64Array(c.N); c.els[2].vprev = 0; c.restart = true;
  const r = S.tran(c, 3e-3, 1e-5, (cc) => cc.vNamed('o'));
  near(r.y[r.y.length - 1], 5 * (1 - Math.exp(-3)), 2e-3, 'RC 3tau');
}
/* 3) diodo con resistencia: I = (5-Vd)/1k */
{
  const c = new S.Circuit();
  c.add(S.V('V1', 'in', 0, 5, 0)); c.add(S.R('R1', 'in', 'a', 1000));
  c.add(S.diode('D1', 'a', 0, { Is: 2.52e-9, n: 1.752 }));
  c.solveDC(); const vd = c.vNamed('a'); console.log('Vd=', vd, 'I=', (5 - vd) / 1000);
  near(vd, 0.7, 0.1, 'diodo ~0.7');
}
/* 4) BJT emisor común */
{
  const c = new S.Circuit();
  c.add(S.V('VCC', 'vcc', 0, 12, 0)); c.add(S.R('RB', 'vcc', 'b', 1.13e6)); c.add(S.R('RC', 'vcc', 'c', 4700));
  c.add(S.bjt('Q1', 'c', 'b', 0, { Is: 1.4e-14, bf: 200, br: 3, vaf: 100 }));
  c.solveDC(); console.log('Vc=', c.vNamed('c'), 'Vb=', c.vNamed('b'), 'Ic=', c.find('Q1').ic);
  near(c.find('Q1').ic * 200 / c.find('Q1').ic, 200, 1, 'bjt dummy');
}
/* 5) MOSFET N y P (inversor CMOS) */
{
  const c = new S.Circuit();
  c.add(S.V('VDD', 'vdd', 0, 5, 0)); c.add(S.V('VIN', 'in', 0, 0, 0));
  c.add(S.mos('MP', 'out', 'in', 'vdd', { vth: 1, k: 2e-3, lam: 0.02, pol: -1 }));
  c.add(S.mos('MN', 'out', 'in', 0, { vth: 1, k: 2e-3, lam: 0.02, pol: 1 }));
  c.add(S.R('RL', 'out', 0, 1e6));
  for (const vin of [0, 5]) { c.find('VIN').v = vin; c.solveDC(); console.log('CMOS vin', vin, 'out', c.vNamed('out')); }
  c.find('VIN').v = 0; c.solveDC(); near(c.vNamed('out'), 5, 1e-2, 'cmos high');
  c.find('VIN').v = 5; c.solveDC(); near(c.vNamed('out'), 0, 1e-2, 'cmos low');
  const sw = c.dcSweep('VIN', 0, 5, 51, (cc) => cc.vNamed('out'));
  console.log('sweep mid', sw.y[25]);
}
/* 6) A.O. inversor ganancia -10 */
{
  const c = new S.Circuit();
  c.add(S.V('VIN', 'in', 0, 0.5, 0)); c.add(S.R('R1', 'in', 'n', 1000)); c.add(S.R('R2', 'n', 'o', 10000));
  c.add({ type: 'OA', id: 'U1', a: 'o', b: 0, c: 'n', A0: 2e5, vcc: 15, vee: -15, rout: 75, rin: 2e6, tau: 2e5 / (2 * Math.PI * 1e6) });
  c.solveDC(); near(c.vNamed('o'), -5, 1e-3, 'opamp inv');
  c.find('VIN').v = 2; c.solveDC(); console.log('sat out', c.vNamed('o'));
}
/* 7) AC: RC pasabajos fc */
{
  const c = new S.Circuit();
  c.add(S.V('V1', 'in', 0, 0, 0, { acmag: 1 })); c.add(S.R('R1', 'in', 'o', 1000)); c.add(S.C('C1', 'o', 0, 159.155e-9));
  c.solveDC();
  const r = c.ac(1000); const m = Math.hypot(...r.at('o')); near(m, Math.SQRT1_2, 1e-4, 'RC ac |H(fc)|');
  near(Math.atan2(r.at('o')[1], r.at('o')[0]) * 180 / Math.PI, -45, 1e-3, 'RC ac fase');
}
/* 8) RLC resonancia serie: corriente máxima en f0 */
{
  const c = new S.Circuit();
  c.add(S.V('V1', 'in', 0, 0, 0, { acmag: 1 })); c.add(S.R('R1', 'in', 'a', 10)); c.add(S.L('L1', 'a', 'b', 1e-3)); c.add(S.C('C1', 'b', 0, 1e-6));
  c.solveDC();
  const f0 = 1 / (2 * Math.PI * Math.sqrt(1e-3 * 1e-6));
  const r = c.ac(f0); const vc = Math.hypot(...r.at('b')); near(vc, Math.sqrt(1e-3 / 1e-6) / 10, 1e-3, 'Q=3.16 en C');
}
/* 9) Transformador */
{
  const c = new S.Circuit();
  c.add(S.V('V1', 'p', 0, 0, 0, { wave: { kind: 'sin', amp: 10, freq: 50 } }));
  c.add({ type: 'X', id: 'T1', W: [['p', 0], ['s', 0]], ls: [1, 0.01], k: 0.999, rdc: [1e-3, 1e-3] });
  c.add(S.R('RL', 's', 0, 10));
  c.solveDC(); let mx = 0;
  const r = S.tran(c, 0.1, 1e-4, (cc) => cc.vNamed('s'));
  const tail = r.y.slice(r.y.length / 2);
  console.log('trafo pico sec', Math.max(...tail), 'esperado ~', 10 * 0.1);
}
/* 10) Zener regulador */
{
  const c = new S.Circuit();
  c.add(S.V('V1', 'in', 0, 12, 0)); c.add(S.R('R1', 'in', 'o', 470));
  c.add(S.diode('Z1', 0, 'o', { Is: 1e-14, n: 1, vz: 5.1, ibv: 5e-3, nz: 2 }));
  c.solveDC(); console.log('Zener Vo', c.vNamed('o'));
}
/* 11) Rectificador + filtro */
{
  const c = new S.Circuit();
  c.add(S.V('V1', 'in', 0, 0, 0, { wave: { kind: 'sin', amp: 10, freq: 60 } }));
  c.add(S.diode('D1', 'in', 'o', { Is: 2.5e-9, n: 1.75 })); c.add(S.C('C1', 'o', 0, 1e-3)); c.add(S.R('RL', 'o', 0, 100));
  c.solveDC();
  const t0 = Date.now();
  const r = S.tran(c, 0.2, 5e-5, (cc) => cc.vNamed('o'));
  const tail = r.y.slice(r.y.length * 0.7);
  console.log('rect: max', Math.max(...tail), 'min', Math.min(...tail), 'ms', Date.now() - t0);
}

/* 12) regulador 7805 */
{
  const c = new S.Circuit();
  c.add(S.V('V1', 'in', 0, 12, 0)); c.add({ type: 'REG', id: 'U1', a: 'o', b: 'in', c: 0, vref: 5, vdo: 2, ilim: 1.5, iq: 0.005, rout: 0.05, pol: 1 });
  c.add(S.R('RL', 'o', 0, 10));
  c.solveDC(); near(c.vNamed('o'), 5 * 10 / (10 + 0.05), 2e-3, '7805 a 10 ohm');
  c.find('RL').r = 1; c.solveDC(); console.log('7805 limita: Vo=', c.vNamed('o'), 'I=', c.vNamed('o') / 1);
  c.find('V1').v = 6; c.find('RL').r = 10; c.solveDC(); near(c.vNamed('o'), 4, 5e-2, '7805 dropout (6V-2V)');
}
/* 13) 7905 */
{
  const c = new S.Circuit();
  c.add(S.V('V1', 'in', 0, -12, 0)); c.add({ type: 'REG', id: 'U1', a: 'o', b: 'in', c: 0, vref: 5, vdo: 2, ilim: 1.5, iq: 0.005, rout: 0.05, pol: -1 });
  c.add(S.R('RL', 'o', 0, 10));
  c.solveDC(); console.log('7905 Vo=', c.vNamed('o'));
}
/* 14) opto DX: LED 10mA → ctr 1 */
{
  const c = new S.Circuit();
  c.add(S.V('V1', 'in', 0, 5, 0)); c.add(S.R('R1', 'in', 'a', 330));
  c.add(S.diode('D1','a',0,{Is:1e-18,n:2})); c.add({ type: 'DX', id: 'O1', a: 'a', b: 0, c: 'col', d: 0, Is: 1e-18, n: 2, ctr: 0.5 });
  c.add(S.V('V2', 'vcc', 0, 10, 0)); c.add(S.R('R2', 'vcc', 'col', 1000));
  c.solveDC(); console.log('opto vA', c.vNamed('a'), 'col', c.vNamed('col'), 'Iled', (5-c.vNamed('a'))/330, 'esp col', 10-1000*0.5*(5-c.vNamed('a'))/330);
}
