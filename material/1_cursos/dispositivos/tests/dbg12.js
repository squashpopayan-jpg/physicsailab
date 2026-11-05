global.window = global; global.EM = { si: (x, u) => x + (u||''), el: ()=>({}) };
['30-spice','31-spice-ac','32-models','33-parts','34-net'].forEach(f=>require('../src/core/'+f+'.js'));
const net=new EM.Net(); net.load(EM.Net.fromSpec({
 parts: [['V1', 'VDC', 4, 8, 0, { v: 5 }], ['R1', 'R', 10, 6, 0, { r: 4300 }], ['D1', 'D', 14, 8, 1, { model: '1N4148' }], ['C1', 'C', 20, 6, 0, { c: 1e-5, kind: 'elec', vmax: 25 }], ['R2', 'R', 26, 6, 0, { r: 1000 }], ['V2', 'VAC', 30, 8, 0, { amp: 0.01, f: 1000, rs: 0.001 }], ['No', 'LBL', 14, 4, 0, { name: 'out' }], ['Ns', 'LBL', 30, 4, 0, { name: 'sig' }]],
 wires: [['V1.0', 'R1.0'], ['R1.1', 'D1.0'], ['C1.1', [14, 6]], ['C1.0', 'R2.0'], ['R2.1', 'V2.0'], [[4, 10], [30, 10]], ['V1.1', 'gnd'], [[14, 6], [14, 4]], [[30, 6], [30, 4]]] }));
net.rebuild(); net.cir.solveDC();
for (const P of net.doc.parts) console.log(P.id, JSON.stringify(net.netInfo.pinNet[P.id]));
console.log('Vd',net.v(net.netInfo.labelNet.out),'I D1',net.iPart(net.part('D1')),'I R1',net.iPart(net.part('R1')));
