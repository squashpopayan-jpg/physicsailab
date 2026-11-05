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
// reproduce _newton con trazas
const orig = c._newton.bind(c);
let count = 0;
c._newton = function (x0, mode, dt, method, gmin, ss) {
  const nn = this.nNodes - 1, N = this.N;
  let x = Float64Array.from(x0 && x0.length === N ? x0 : new Float64Array(N));
  const lim = Math.max(2, 0.15 * this.vmax);
  for (let it = 0; it < 40; it++) {
    this.A.fill(0); this.bvec.fill(0);
    this._stamp(this.A, this.bvec, x, mode, dt, method, ss);
    const xn = Float64Array.from(this.bvec);
    const S = EM.spice;
    const M = Array.from({length:N},(_,i)=>Array.from(this.A.subarray(i*N,(i+1)*N)));
    const sol = S.solveLinear(M, xn);
    let mx = 0, mxi = -1; for (let i=0;i<nn;i++){ const d=Math.abs(sol[i]-x[i]); if(d>mx){mx=d;mxi=i;} }
    const jok = this._junctionsOk(sol);
    if (count < 1) console.log(it, 'mx', mx.toExponential(2), 'node', mxi, 'jok', jok, 'vj', this.els.filter(e=>e.type==='D').map(e=>e.vj[0].toFixed(4)).join(','), 'vab', Array.from(sol).slice(0,6).map(v=>v.toFixed(4)).join(' '));
    x = sol;
  }
  count++;
  return orig(x0, mode, dt, method, gmin, ss);
};

c._newton = orig;
let first=-1;
for (let k=0;k<400;k++){ if(!net.step(1e-4)){ first=k; break; } }
console.log('primer fallo en paso', first, 't', c.t, 'v(src)', c.vNamed(c.names.keys().next().value));
// trazar ese paso
c._newton = function (x0, mode, dt, method, gmin, ss) {
  const nn = this.nNodes - 1, N = this.N;
  let x = Float64Array.from(x0 && x0.length === N ? x0 : new Float64Array(N));
  for (let it = 0; it < 25; it++) {
    this.A.fill(0); this.bvec.fill(0);
    this._stamp(this.A, this.bvec, x, mode, dt, method, ss);
    const xn = Float64Array.from(this.bvec);
    const M = Array.from({length:N},(_,i)=>Array.from(this.A.subarray(i*N,(i+1)*N)));
    const sol = EM.spice.solveLinear(M, xn);
    let mx = 0; for (let i=0;i<nn;i++){ mx=Math.max(mx, Math.abs(sol[i]-x[i])); }
    console.log(it, 'mx', mx.toExponential(2), 'jok', this._junctionsOk(sol), 'vj', this.els.filter(e=>e.type==='D').map(e=>e.vj[0].toFixed(4)).join(','), 'x', Array.from(sol).slice(0,9).map(v=>v.toFixed(3)).join(' '));
    x = sol;
  }
  return null;
};
c.t -= 0; net.step(1e-4);
