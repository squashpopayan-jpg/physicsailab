/* node test/engine.test.js — el motor contra las fórmulas del libro. */
const R = require('../src/engine.js');
const { C } = R;
let ok = 0, mal = 0;
function t(nombre, cond, extra) { if (cond) ok++; else { mal++; console.log('FALLA:', nombre, extra === undefined ? '' : extra); } }
function cerca(nombre, a, b, tol) { const e = Math.abs(a - b), r = Math.abs(b) > 1e-9 ? e / Math.abs(b) : e; t(nombre, r <= tol, `obtenido ${a}, esperado ${b} (error rel. ${(r * 100).toFixed(3)} %)`); }
function ideal(id, P) { const s = R.crear(id, P, { ideal: true }); R.soltar(s); return s; }
function ajusteA(s, t0, t1, i) { // regresión cuadrática x = x0 + v0 t + ½ a t² sobre el registro
  const T = [], X = [];
  s.log.t.forEach((tt, k) => { if (tt >= t0 && tt <= t1) { T.push(tt); X.push(s.log.x[i || 0][k]); } });
  const n = T.length; let S = [0, 0, 0, 0, 0], B = [0, 0, 0];
  for (let k = 0; k < n; k++) { const u = T[k], x = X[k]; S[0] += 1; S[1] += u; S[2] += u * u; S[3] += u ** 3; S[4] += u ** 4; B[0] += x; B[1] += x * u; B[2] += x * u * u; }
  const m = [[S[0], S[1], S[2]], [S[1], S[2], S[3]], [S[2], S[3], S[4]]];
  const det = (a) => a[0][0] * (a[1][1] * a[2][2] - a[1][2] * a[2][1]) - a[0][1] * (a[1][0] * a[2][2] - a[1][2] * a[2][0]) + a[0][2] * (a[1][0] * a[2][1] - a[1][1] * a[2][0]);
  const d = det(m), m3 = m.map((r, i) => r.map((v, j) => (j === 2 ? B[i] : v)));
  return 2 * det(m3) / d;
}

// 1. Segunda ley, modelo ideal: a = m g / (M + m)
for (const [m, M] of [[20, 200], [50, 200], [100, 300], [200, 150]]) {
  const P = { m, M1: M, D: 55 };
  const s = ideal('newton', P);
  const a = m / 1000 * C.g / ((M + m) / 1000);
  const tL = Math.sqrt(2 * 0.55 / a);
  R.avanzar(s, Math.min(tL * 0.95, 4));
  cerca(`newton ideal a (m=${m},M=${M})`, ajusteA(s, 0.05, Math.min(tL * 0.95, 4)), a, 0.002);
  cerca(`newton ideal tensión`, s.T_h, M / 1000 * a, 0.002);
}
// 2. Con polea real y roce: aceleración algo menor que la ideal, pero cercana
{
  const P = { m: 50, M1: 200, D: 55, level: 0, blower: true };
  const s = R.crear('newton', P, { seed: 3 }); R.soltar(s);
  const aPol = R.teoria('newton', P).aPolea, aId = R.teoria('newton', P).aIdeal;
  R.avanzar(s, 0.8);
  const a = ajusteA(s, 0.05, 0.8);
  t('newton real menor que ideal', a < aId, `${a} vs ${aId}`);
  t('newton real cerca de la teoría con polea', Math.abs(a - aPol) / aPol < 0.06, `${a} vs ${aPol}`);
}
// 3. La masa aterriza: a partir de ahí v constante
{
  const s = ideal('newton', { m: 100, M1: 200, D: 40 });
  while (s.hang.mode === 'taut' && s.t < 3) R.paso(s, C.dt);
  t('aterrizó', s.hang.mode === 'landed' && s.hang.tLand > 0);
  const v1 = s.g[0].v; R.avanzar(s, 0.05); cerca('v constante tras aterrizar', s.g[0].v, v1, 1e-9);
  const a = 0.1 * C.g / 0.3, v = Math.sqrt(2 * a * 0.40);
  cerca('v al aterrizar', v1, v, 0.003);
}
// 4. Plano inclinado: a = g sen θ, independiente de la masa
for (const th of [1, 2.5, 5]) for (const M of [150, 400]) {
  const s = ideal('inclinado', { th, M1: M });
  R.avanzar(s, 0.9);
  cerca(`inclinado θ=${th} M=${M}`, ajusteA(s, 0.02, 0.9), C.g * Math.sin(th * Math.PI / 180), 0.002);
}
// 5. Choque elástico: ímpetu y energía se conservan; masas iguales intercambian velocidades
{
  const s = ideal('choque_el', { M1: 200, M2: 200, v0: 80 });
  R.avanzar(s, 2.0);
  t('hubo choque', !!s.col);
  const c = s.col;
  cerca('p conservado', c.ma * c.va2 + c.mb * c.vb2, c.ma * c.va + c.mb * c.vb, 1e-9);
  cerca('K conservada', 0.5 * c.ma * c.va2 ** 2 + 0.5 * c.mb * c.vb2 ** 2, 0.5 * c.ma * c.va ** 2, 1e-9);
  t('masas iguales: se detiene el 1', Math.abs(c.va2) < 1e-9 && Math.abs(c.vb2 - 0.8) < 1e-9);
}
{
  const s = ideal('choque_el', { M1: 400, M2: 150, v0: 60 });
  R.avanzar(s, 1.5);
  const c = s.col, vf1 = (400 - 150) / 550 * 0.6, vf2 = 2 * 400 / 550 * 0.6;
  cerca('v1 final masas distintas', c.va2, vf1, 1e-9); cerca('v2 final', c.vb2, vf2, 1e-9);
}
// 6. Choque inelástico: quedan pegados con v = m1 v0 /(m1+m2), pierden la energía esperada
{
  const s = ideal('choque_in', { M1: 200, M2: 300, v0: 100 });
  R.avanzar(s, 2.0);
  const c = s.col, vf = 0.2 * 1.0 / 0.5;
  cerca('vf pegados', c.va2, vf, 1e-9); cerca('vf igual en ambos', c.vb2, vf, 1e-9);
  const dK = 0.5 * 0.2 - 0.5 * 0.5 * vf * vf;
  cerca('energía perdida', 0.5 * c.ma * c.va ** 2 - 0.5 * (c.ma + c.mb) * c.va2 ** 2, dK, 1e-9);
  t('siguen unidos', s.links[0].type === 'stuck' && Math.abs(s.g[0].v - s.g[1].v) < 1e-9);
}
// 7. Retroceso: ímpetu total cero y energía = E
{
  const s = ideal('explosion', { M1: 200, M2: 350, E: 80 });
  const m1 = 0.2, m2 = 0.35;
  R.avanzar(s, 0.01);
  cerca('p = 0', m1 * s.g[0].v + m2 * s.g[1].v, 0, 1e-9);
  cerca('K = E', 0.5 * m1 * s.g[0].v ** 2 + 0.5 * m2 * s.g[1].v ** 2, 0.080, 1e-9);
}
// 8. Oscilador: período 2π√(M/2k) (sin amortiguamiento)
for (const [k, M, A] of [[6, 200, 20], [10, 350, 15], [3, 150, 30]]) {
  const s = ideal('oscilador', { k, M1: M, A });
  R.avanzar(s, 6);
  const x = s.log.x[0], tt = s.log.t, c = 1.0, cruces = [];
  for (let i = 1; i < x.length; i++) if (x[i - 1] < c && x[i] >= c) cruces.push(tt[i - 1] + (c - x[i - 1]) / (x[i] - x[i - 1]) * C.ts);
  const T = (cruces[cruces.length - 1] - cruces[0]) / (cruces.length - 1);
  cerca(`período k=${k} M=${M}`, T, 2 * Math.PI * Math.sqrt(M / 1000 / (2 * k)), 0.002);
  cerca('vmax', Math.max(...s.log.v[0]), R.teoria('oscilador', { k, M1: M, A }).vmax, 0.003);
}
// 9. Dos carritos unidos: a = m g / (MA+MB+m), T = MA a
{
  const s = ideal('acoplados', { m: 60, MA: 200, MB: 300, D: 60 });
  R.avanzar(s, 0.5);
  const a = 0.06 * C.g / 0.56;
  cerca('acoplados a', ajusteA(s, 0.02, 0.5, 1), a, 0.003);
  cerca('acoplados T', s.Tlink[0], 0.2 * a, 0.01);
}
// 10. Fotocompuerta: v = ancho / tiempo bloqueado ≈ velocidad real
{
  const s = R.crear('inclinado', { th: 2, M1: 200, flag: 5, g1: 50, g2: 120, blower: true, level: 0 }, { seed: 1 }); R.soltar(s);
  R.avanzar(s, 3);
  t('2 eventos', s.eventos.length >= 2, s.eventos.length);
  const e = s.eventos[0];
  const vReal = Math.sqrt(2 * C.g * Math.sin(2 * Math.PI / 180) * (0.5 - 0.16)); // al centro de la compuerta
  cerca('v por bandera ≈ v', e.v, vReal, 0.03);
  t('Δt cuantizado a 0,1 ms', Math.abs(e.dt * 1e4 - Math.round(e.dt * 1e4)) < 1e-6);
}
// 11. Sin aire el carrito se arrastra y se detiene; con aire sigue deslizando
{
  const base = { th: 0.4, M1: 200, level: 0 };
  const a = R.crear('inclinado', Object.assign({ blower: false }, base), { seed: 2 }); R.soltar(a);
  R.avanzar(a, 1.5);
  t('sin aire no se mueve a 0,4°', Math.abs(a.g[0].v) < 1e-9, a.g[0].v);
  const b = R.crear('inclinado', Object.assign({ blower: true }, base), { seed: 2 }); R.soltar(b);
  R.avanzar(b, 1.5);
  t('con aire sí', b.g[0].v > 0.02, b.g[0].v);
}
// 12. Rebote en el tope y regreso: el hilo se vuelve a tensar
{
  const s = R.crear('newton', { m: 100, M1: 200, D: 40, level: 0, blower: true }, { seed: 4 }); R.soltar(s);
  R.avanzar(s, 6);
  const tope = Math.max(...s.log.x[0]) + C.len / 2 + C.bump;
  t('llegó al tope', tope > C.L - 0.03, tope);
  t('rebotó', s.log.v[0].some((v) => v < -0.1));
  t('la posición se mantiene dentro del riel', Math.min(...s.log.x[0]) > C.len / 2 && Math.max(...s.log.x[0]) < C.L - C.len / 2 + 1e-9);
}
// 13. Tmax
{ const s = R.crear('oscilador', {}); R.soltar(s); R.avanzar(s, 21); t('fin a los 20 s', s.estado === 'fin' && s.t <= 20.001); }

console.log(`${ok} pruebas correctas, ${mal} con fallas`);
process.exit(mal ? 1 : 0);
