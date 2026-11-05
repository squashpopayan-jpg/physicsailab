global.window = global;
global.EM = { si: (x, u) => x.toPrecision(3) + ' ' + (u || '') };
['30-spice', '31-spice-ac', '32-models', '33-parts', '34-net'].forEach((f) => require('../src/core/' + f + '.js'));
const net = new EM.Net();
net.load(EM.Net.fromSpec({
    parts: [['AC', 'VAC', 2, 8, 0, { amp: 17, f: 60 }], ['BR', 'BR', 10, 8, 0], ['C1', 'C', 16, 6, 1, { c: 2200e-6, kind: 'elec', vmax: 35 }], ['U1', 'REG', 24, 4, 0, { model: '7805' }], ['C2', 'C', 30, 6, 1, { c: 100e-6, kind: 'elec' }], ['RL', 'R', 34, 6, 1, { r: 10 }]],
    wires: [['AC.0', 'BR.0'], ['AC.1', 'BR.1'], ['BR.2', [16, 4], 'C1.0'], ['C1.0', 'U1.IN'], ['U1.OUT', 'C2.0'], ['C2.0', 'RL.0'], ['BR.3', 'gnd'], ['C1.1', 'gnd'], ['C2.1', 'gnd'], ['RL.1', 'gnd'], ['U1.COM', 'gnd']]
}));
net.rebuild(); console.log('dc', net.cir.solveDC());
const c = net.cir; let bad = 0;
for (let k = 0; k < 600; k++) { if (!net.step(1e-4)) { bad++; if (bad === 1) console.log('fallo', k, c._dbg, c.els.filter(e=>e.type==='REG').map(e=>e.mode)); } }
console.log('bad', bad);
