/* Compila rutinas de ejemplo y revisa coherencia básica. */
const MS = require('./load')(['00', '10', '15', '20', '25', '30', '32', '35', '38', '55']);
const { Compile, U } = MS;
const rts = MS.Routines ? MS.Routines.LIB : [];
const sample = {
  nombre: 'Boast–Drive', jugadores: [{ id: 'A', nombre: 'Ana', mano: 'D', base: [3.0, 6.2] }, { id: 'B', nombre: 'Beto', mano: 'D', base: [3.4, 6.2] }],
  secuencia: [{ j: 'A', golpe: 'boast' }, { j: 'B', golpe: 'drive' }], inicio: { x: 0.9, y: 8.5, z: 0.6 }, ciclos: 4,
};
const list = rts.length ? rts : [sample];
let bad = 0;
for (const rt of list) {
  const tl = Compile.compile(rt);
  const nan = tl.players.some((p) => p.keys.some((k) => !Number.isFinite(k.x + k.y + k.h + k.yaw)));
  const st = tl.players.map((p) => `${p.id}: ${U.num(p.stats.dist, 1)} m, ${p.stats.steps} pasos, estocadas I/D ${p.stats.lungI}/${p.stats.lungD}, vmax ${U.num(p.stats.vmax, 1)}, tarde ${p.stats.late}, rodilla min ${p.stats.kneeMin ? p.stats.kneeMin.toFixed(0) : '-'}°`).join(' | ');
  console.log(`${(rt.id || rt.nombre).padEnd(24)} ${tl.shots.length} golpes, ${U.num(tl.duration, 1)} s, ${tl.ms.toFixed(0)} ms ${nan ? 'NaN!' : ''}`);
  console.log('   ', st);
  const w = tl.warnings.slice(0, 4); if (w.length) console.log('    avisos:', w.join(' / '), tl.warnings.length > 4 ? `(+${tl.warnings.length - 4})` : '');
  const cls = {}; for (const s of tl.shots) cls[s.cls] = (cls[s.cls] || 0) + 1; console.log('    impactos:', JSON.stringify(cls));
  if (nan) bad++;
}
process.exitCode = bad ? 1 : 0;
