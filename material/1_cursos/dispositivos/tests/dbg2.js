global.window = global;
global.EM = { si: (x, u) => x.toPrecision(3) + ' ' + (u || '') };
['30-spice', '31-spice-ac', '32-models', '33-parts', '34-net'].forEach((f) => require('../src/core/' + f + '.js'));
const mk = (withReg, withBR) => EM.Net.fromSpec({
  parts: [['AC', 'VAC', 2, 8, 0, { amp: 17, f: 60 }], ['BR', 'BR', 10, 8, 0], ['C1', 'C', 16, 6, 1, { c: 2200e-6, kind: 'elec', vmax: 35 }], ['RL', 'R', 34, 6, 1, { r: 10 }]],
  wires: [['AC.0', 'BR.0'], ['AC.1', 'BR.1'], ['BR.2', [16, 4], 'C1.0'], ['C1.0', 'RL.0'], ['BR.3', 'gnd'], ['C1.1', 'gnd'], ['RL.1', 'gnd']]
});
const net = new EM.Net(); net.load(mk());
net.rebuild(); console.log('solveDC', net.cir.solveDC(), net.cir.error);
const inn = net.netInfo.pinNet.C1[0];
let bad = 0, t0 = Date.now(), vmin = 1e9, vmax = -1e9;
for (let i = 0; i < 3000; i++) {
  const ok = net.step(1e-4);
  if (!ok) bad++;
  if (i > 2000) { const v = net.v(inn); vmin = Math.min(vmin, v); vmax = Math.max(vmax, v); }
}
console.log('bad steps', bad, 'ms', Date.now() - t0, 'v', vmin, vmax, 'N', net.cir.N, 'nodes', net.cir.nNodes);
// traza de una iteración fallida
const c = net.cir;
c.t = 0.0123; 
const save = c.x.slice();
let x = save.slice();
const N = c.N;
for (let it = 0; it < 12; it++) {
  c.A.fill(0); c.bvec.fill(0);
  c._stamp(c.A, c.bvec, x, 'tran', 1e-4, 'trap', 1);
  const xn = Float64Array.from(c.bvec);
  // copia de LU
  const S = EM.spice; const ok = S.solveLinear(Array.from({length:N},(_,i)=>Array.from(c.A.subarray(i*N,(i+1)*N))), c.bvec);
  let mx = 0; for (let i=0;i<N;i++) mx=Math.max(mx, Math.abs(ok[i]-x[i]));
  console.log(it, 'maxdelta', mx.toFixed(4), Array.from(ok).slice(0,9).map(v=>v.toFixed(3)).join(' '));
  x = Float64Array.from(ok);
}
console.log(c.els.filter(e=>e.type==='D').map(e=>[e.id,e.vj[0].toFixed(3),e.IsT.toExponential(2),e.vz,e.n]).join('\n'));
