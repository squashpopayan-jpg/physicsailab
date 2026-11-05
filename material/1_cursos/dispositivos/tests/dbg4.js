global.window = global;
global.EM = { si: (x, u) => x.toPrecision(3) + ' ' + (u || '') };
['30-spice', '31-spice-ac', '32-models', '33-parts', '34-net'].forEach((f) => require('../src/core/' + f + '.js'));
const net = new EM.Net();
net.load(EM.Net.fromSpec({
  parts: [['AC', 'VAC', 2, 8, 0, { amp: 17, f: 60 }], ['BR', 'BR', 10, 8, 0], ['C1', 'C', 16, 6, 1, { c: 2200e-6, kind: 'elec', vmax: 35 }], ['RL', 'R', 34, 6, 1, { r: 10 }]],
  wires: [['AC.0', 'BR.0'], ['AC.1', 'BR.1'], ['BR.2', [16, 4], 'C1.0'], ['C1.0', 'RL.0'], ['BR.3', 'gnd'], ['C1.1', 'gnd'], ['RL.1', 'gnd']]
}));
net.rebuild(); net.cir.solveDC();
const c = net.cir;
for (let k = 0; k < 400; k++) { if (!net.step(1e-4)) { console.log('fallo en', k, c._dbg, c.error, c.warn); break; } }
const nn = c.nNodes - 1, N = c.N;
let x = Float64Array.from(c.x);
const S = EM.spice;
const hist = [];
for (let it = 0; it < 12; it++) {
  c.A.fill(0); c.bvec.fill(0);
  c._stamp(c.A, c.bvec, x, 'tran', 1e-4, 'trap', 1);
  const M = Array.from({length:N},(_,i)=>Array.from(c.A.subarray(i*N,(i+1)*N)));
  const sol = S.solveLinear(M, Float64Array.from(c.bvec));
  const d = Array.from(sol).map((v,i)=>v-x[i]);
  console.log(it, 'dx', d.map(v=>v.toExponential(1)).join(' '));
  x = sol;
}
console.log('nodes', c.nodeNames.join(' '));
console.log('x', Array.from(x).map(v=>v.toFixed(5)).join(' '));
console.log(c.els.filter(e=>e.type==='D').map(e=>[e.id,e.na,e.nb,e.vj[0].toFixed(5),(e.gd||0).toExponential(2)].join(' ')).join('\n'));
console.log('--- experimento');
const jo = c._junctionsOk.bind(c);
let calls = 0, falses = 0;
c._junctionsOk = function (x) { const r = jo(x); calls++; if (!r) { falses++; if (falses < 6) { const volt = (n) => (n > 0 ? x[n - 1] : 0); console.log('jok false', this.els.filter(e=>e.type==='D').map(e=>[e.id,(volt(e.na)-volt(e.nb)).toFixed(6), e.vj[0].toFixed(6)].join(':')).join(' ')); } } return r; };
c.t = c.t; 
const save = c._saveState();
const r = c._newton(c.x, 'tran', 1e-4, 'trap');
console.log('res', !!r, 'calls', calls, 'falses', falses, c._dbg);
console.log('--- exacto');
c.t += 1e-4; calls = 0; falses = 0;
const volt2 = (x, n) => (n > 0 ? x[n - 1] : 0);
let x2 = Float64Array.from(c.x);
const nn2 = c.nNodes - 1;
for (let it = 0; it < 14; it++) {
  c.A.fill(0); c.bvec.fill(0);
  c._stamp(c.A, c.bvec, x2, 'tran', 1e-4, 'trap', 1);
  const M = Array.from({length:c.N},(_,i)=>Array.from(c.A.subarray(i*c.N,(i+1)*c.N)));
  const sol = S.solveLinear(M, Float64Array.from(c.bvec));
  console.log(it, 'dx', Array.from(sol).map((v,i)=>(v-x2[i]).toExponential(1)).join(' '), '| vj', c.els.filter(e=>e.type==='D').map(e=>e.vj[0].toFixed(4)).join(','), '| v', c.els.filter(e=>e.type==='D').map(e=>(volt2(sol,e.na)-volt2(sol,e.nb)).toFixed(4)).join(','));
  x2 = sol;
}
