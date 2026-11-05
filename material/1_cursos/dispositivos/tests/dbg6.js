global.window = global;
global.EM = { si: (x, u) => x.toPrecision(3) + ' ' + (u || '') };
['30-spice', '31-spice-ac', '32-models', '33-parts', '34-net'].forEach((f) => require('../src/core/' + f + '.js'));
const net = new EM.Net();
net.load(EM.Net.fromSpec({
    parts: [['VCC', 'VDC', 2, 8, 0, { v: 9 }], ['U1', 'T555', 14, 8, 0], ['RA', 'R', 24, 3, 1, { r: 1000 }], ['RB', 'R', 24, 10, 1, { r: 47000 }], ['C1', 'C', 24, 17, 1, { c: 1e-6 }], ['C2', 'C', 8, 14, 1, { c: 1e-8 }]],
    wires: [['VCC.0', '@vcc:u'], ['U1.VCC', '@vcc:u'], ['U1.RESET', '@vcc:l'], ['RA.0', '@vcc:u'], ['RA.1', '@dis:r'], ['RB.0', '@dis:r'], ['U1.DIS', '@dis:r'], ['RB.1', '@thr:r'], ['C1.0', '@thr:r'], ['U1.THR', '@thr:l'], ['U1.TRIG', '@thr:l'], ['C1.1', 'gnd'], ['U1.GND', 'gnd'], ['VCC.1', 'gnd'], ['U1.CTRL', '@ctl:l'], ['C2.0', '@ctl:u'], ['C2.1', 'gnd']]
}));
net.rebuild(); console.log('dc', net.cir.solveDC());
const info = net.netInfo;
console.log(JSON.stringify(info.pinNet.U1), JSON.stringify(info.pinNet.VCC));
const c = net.cir;
const out = info.pinNet.U1[4], thr = info.pinNet.U1[2];
let last = net.v(out), edges = [];
for (let k = 0; k < 40000; k++) {
  net.step(2e-5);
  const v = net.v(out);
  if (last < 4 && v >= 4) edges.push(c.t);
  last = v;
}
const per = (edges[edges.length - 1] - edges[1]) / (edges.length - 2);
console.log('edges', edges.length, 'T(ms)=', per * 1000, 'esperado', 0.693 * (1000 + 2 * 47000) * 1e-6 * 1000);
