const { loadChapter, labOf } = require('./harness');
const sims = loadChapter('08-inductores.js');
const c = sims['c8-rele'].cfgs[0]; const l = labOf(c);
const net = l.bench.net;
const st = () => { const r = net.rt.K1; const na = net.cir.els.find((e) => e.id === 'K1:na'); return JSON.stringify({ relay: r.relay, refrelay: r.ref.relay, naClosed: na && na.closed, iL: l.i('K1'), led: l.i('D2') }); };
l.run(0.2); console.log('reposo', st());
l.press('S1', true); l.run(0.5); console.log('pulsado', st());
l.press('S1', false); for (let k = 0; k < 5; k++) { l.run(0.1); console.log('suelto', k, st()); }
