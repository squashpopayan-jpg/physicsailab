global.window = global;
require('../src/core/30-spice.js'); require('../src/core/31-spice-ac.js');
const S = EM.spice;
const c = new S.Circuit();
c.add(S.V('V1', 'in', 0, 12, 0)); c.add({ type: 'REG', id: 'U1', a: 'o', b: 'in', c: 0, vref: 5, vdo: 2, ilim: 1.5, iq: 0.005, rout: 0.05, pol: 1 });
c.add(S.R('RL', 'o', 0, 10));
console.log(c.solveDC(), c.error, c.warn, c.vNamed('o'), c.vNamed('in'));
c.compile(); console.log(c.N, c.hasNL);
const x = c._newton(null,'dc',0,'be'); console.log(x);
