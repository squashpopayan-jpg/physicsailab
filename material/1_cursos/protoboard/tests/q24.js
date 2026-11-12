global.window = global; global.EM = {};
['30-spice', '31-spice-ac', '32-models'].forEach((f) => require('../src/core/' + f + '.js'));
const S = EM.spice; const m = S.MOD.OA.LM358;
const build = (opts) => {
  const c = new S.Circuit();
  c.add({ type: 'V', id: 'v', a: 'vcc', b: '0', v: 5, rs: 0.02 });
  c.add({ type: 'R', id: 'ra', a: 'vcc', b: 'in', r: opts.rldr });
  c.add({ type: 'R', id: 'rb', a: 'in', b: '0', r: 10000 });
  c.add({ type: 'R', id: 'rp1', a: 'vcc', b: 'ref', r: 5000 });
  c.add({ type: 'R', id: 'rp2', a: 'ref', b: '0', r: 5000 });
  c.add({ type: 'OA', id: 'u', a: 'out', b: 'ref', c: 'in', d: 'vcc', e: '0', A0: m.A0, rout: m.rout, rin: m.rin, dropH: m.dropH, dropL: m.dropL, sr: 0, vos: 0, iq: 0, tau: 0, y: 0 });
  if (opts.load) c.add({ type: 'R', id: 'rl', a: 'out', b: '0', r: opts.load });
  c.compile(); return c;
};
for (const [rldr, load] of [[2450, 0], [100000, 0], [100000, 470], [100000, 3300], [20000, 470]]) { const c = build({ rldr, load }); const ok = c.solveDC(); console.log('rldr', rldr, 'load', load, 'ok', ok, ok ? 'in=' + c.vNamed('in').toFixed(3) + ' out=' + c.vNamed('out').toFixed(3) : c.error); }
