// Prueba de extremo a extremo sin navegador: vuelos simulados → seguimiento → apogeo medido vs. verdadero.
import { runScenario } from './scenario.js';

const base = { d: 40, Hobs: 1.5, ana: 640, fTrue: 0.78, fUsed: 0.78 * 1.01, biasDeg: 0.2, noiseDeg: 0.05, wind: [3, 0], seed: 3 };
const cases = [
  { name: 'agua · trípode · viento cruzado 3 m/s', preset: 'agua', mode: 'tripod' },
  { name: 'agua · trípode · viento a lo largo de la visual', preset: 'agua', mode: 'tripod', wind: [0, 3] },
  { name: 'agua · trípode · desde un 3.er piso (H=8 m, d=60)', preset: 'agua', mode: 'tripod', Hobs: 8, d: 60 },
  { name: 'agua · en la mano', preset: 'agua', mode: 'follow' },
  { name: 'modelismo · trípode · d=150', preset: 'modelo', mode: 'tripod', d: 150, fTrue: 0.7, fUsed: 0.7 },
  { name: 'modelismo · trípode · d=150 · análisis 960', preset: 'modelo', mode: 'tripod', d: 150, fTrue: 0.7, fUsed: 0.7, ana: 960 },
  { name: 'modelismo · en la mano · d=150', preset: 'modelo', mode: 'follow', d: 150 },
];
let bad = 0;
console.log('caso | apogeo real | aparente* | medido ± σ (deriva) | error vs aparente | error vs real | t_apo real/medido | despegue | RMS ángulo (todo / apogeo) | puntos (auto)');
for (const c of cases) {
  const o = { ...base, ...c };
  const t0 = Date.now();
  const r = runScenario(o);
  const m = r.res;
  const eApp = m ? m.apogee - r.apparent : NaN, eTrue = m ? m.apogee - r.truth : NaN;
  // El rastreador debe acertar el apogeo aparente; la diferencia con el real la explica la deriva hacia/desde
  // el observador, que se informa aparte.
  const pass = m && Math.abs(eApp) < 2.5 * m.sig + 0.5 && r.angTop < 0.6;
  if (!pass) bad++;
  console.log(`${pass ? 'OK ' : 'MAL'} ${c.name} | ${r.truth.toFixed(1)} m | ${r.apparent.toFixed(1)} m | ${m ? m.apogee.toFixed(1) + ' ± ' + m.sig.toFixed(1) + ' (±' + m.sigDrift.toFixed(1) + ')' : '—'} m | ${eApp.toFixed(2)} m | ${(100 * eTrue / r.truth).toFixed(1)} % | ${r.tApoTrue.toFixed(2)}/${m ? m.tApo.toFixed(2) : '—'} s | ${r.tLaunchErr == null ? '—' : (r.tLaunchErr * 1000).toFixed(0) + ' ms'} | ${r.angRms.toFixed(2)}° / ${r.angTop.toFixed(2)}° | ${r.n} (${r.nAuto}) | ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
console.log('* aparente: lo que mediría un instrumento perfecto desde un solo punto (incluye la deriva hacia o desde el observador).');
console.log(bad ? `\n${bad} casos fuera de tolerancia` : '\nTodos los casos dentro de tolerancia.');
process.exitCode = bad ? 1 : 0;
