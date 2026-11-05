global.window = global; global.EM = { si: (x, u) => x + (u||'') };
['30-spice','31-spice-ac','32-models','33-parts','34-net'].forEach(f=>require('../src/core/'+f+'.js'));
const mk=(mis)=>{ const net=new EM.Net(); net.load(EM.Net.fromSpec({
 parts: [['V1', 'VAC', 2, 8, 0, { amp: 1, f: 1590 }], ['R1', 'R', 10, 6, 0, { r: 10000 }], ['R2', 'R', 18, 6, 0, { r: 10000 }], ['C3', 'C', 14, 8, 1, { c: 20e-9 }], ['C1', 'C', 10, 14, 0, { c: 10e-9 }], ['C2', 'C', 18, 14, 0, { c: 10e-9 }], ['R3', 'R', 14, 16, 1, { r: 5000*mis }], ['No', 'LBL', 24, 4, 0, { name: 'out' }]],
 wires: [['V1.0', 'R1.0'], [[6, 6], [6, 14], [8, 14]], ['R1.1', 'R2.0'], ['C1.1', 'C2.0'], [[20, 6], [26, 6], [26, 14], [20, 14]], [[24, 6], [24, 4]], [[14, 10], [30, 10], [30, 20]], [[14, 18], [30, 18]], [[2, 10], [2, 20], [30, 20]], [[30, 20], [30, 21]], ['gndat', 30, 21]] }));
 net.rebuild(); net.cir.solveDC(); return net; };
for (const m of [1,1.05,1.2,0.8]) { const n=mk(m); const sw=n.cir.acSweep(1000,2500,400,n.netInfo.labelNet.out); console.log(m,'min dB',Math.min(...sw.mag).toFixed(1)); }
