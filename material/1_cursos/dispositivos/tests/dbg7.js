global.window = global; global.EM = { si: (x, u) => x + (u||'') };
['30-spice','31-spice-ac','32-models','33-parts','34-net'].forEach(f=>require('../src/core/'+f+'.js'));
const net = new EM.Net();
net.load(EM.Net.fromSpec({
        parts: [['G1', 'FG', 4, 12, 0, { wave: 'square', amp: 1, off: 0, f: 100 }], ['R1', 'R', 12, 11, 0, { r: 950 }], ['C1', 'C', 18, 13, 1, { c: 1e-6 }], ['OSC', 'SCOPE', 12, 2, 0, { probe: 10 }], ['N1', 'LBL', 9, 13, 0, { name: 'in' }], ['N2', 'LBL', 16, 15, 0, { name: 'out' }]],
        wires: [['G1.0', 'R1.0'], ['R1.1', 'C1.0'], ['G1.1', [7, 15], [21, 15]], [[7, 15], [7, 16]], ['gndat', 7, 16], [[15, 7], [21, 7], [21, 15]],
          [[9, 7], [9, 11]], [[12, 7], [12, 9], [16, 9], [16, 11]], [[9, 11], [9, 13]], [[16, 11], [16, 12]], [[16, 12], [16, 15]]]
}));
net.rebuild();
for (const P of net.doc.parts) console.log(P.id, JSON.stringify(net.netInfo.pinNet[P.id]));
