// Pruebas de la geometría: orientación W3C, proyección de la cámara, fórmula de altura y calibración de la focal.
import * as G from '../js/geom.js';

let fails = 0;
const ok = (cond, msg) => { if (!cond) { fails++; console.log('  FALLA:', msg); } };
const near = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol, `${msg}: ${a} vs ${b}`);
let seed = 12345;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };

console.log('1. Euler W3C ↔ matriz');
for (let i = 0; i < 2000; i++) {
  const a = rnd() * 360, b = -179 + rnd() * 358, g = -89 + rnd() * 178;
  if (Math.abs(Math.cos(b * G.DEG)) < 0.02) continue;
  const R = G.eulerToR(a, b, g);
  const e = G.rToEuler(R);
  const R2 = G.eulerToR(e.alpha, e.beta, e.gamma);
  ok(R.every((v, k) => Math.abs(v - R2[k]) < 1e-9), `ida y vuelta (${a.toFixed(1)}, ${b.toFixed(1)}, ${g.toFixed(1)})`);
  near(e.beta, b, 1e-6, 'beta'); near(e.gamma, g, 1e-6, 'gamma');
}
{
  const ax = G.opticalAxis(G.eulerToR(0, 0, 0));
  ok(Math.abs(ax[2] + 1) < 1e-12, 'acostado boca arriba: la cámara trasera mira al suelo');
  const ax2 = G.opticalAxis(G.eulerToR(0, 90, 0));
  ok(Math.abs(ax2[1] - 1) < 1e-12, 'vertical (β=90): la cámara mira al horizonte, hacia +y');
  const ax3 = G.opticalAxis(G.eulerToR(0, 120, 0));
  near(G.elAz(ax3).el / G.DEG, 30, 1e-9, 'β=120: la cámara mira 30° hacia arriba');
}

console.log('2. Proyección píxel ↔ dirección (con giro de pantalla)');
const cam = G.camFor(720, 1280, 0.8);
for (const ang of [0, 90, 180, 270]) {
  for (let i = 0; i < 300; i++) {
    const R = G.screenR(G.eulerToR(rnd() * 360, 60 + rnd() * 80, -30 + rnd() * 60), ang);
    const u = rnd() * 720, v = rnd() * 1280;
    const w = G.pixelToWorld(R, cam, u, v);
    const p = G.worldToPixel(R, cam, w);
    ok(p && Math.abs(p.u - u) < 1e-6 && Math.abs(p.v - v) < 1e-6, `ida y vuelta con pantalla ${ang}°`);
  }
}
{
  // Un celular vertical (β=90) que mira al horizonte: un píxel más arriba en la imagen tiene más elevación.
  const R = G.eulerToR(0, 90, 0);
  const up = G.elAz(G.pixelToWorld(R, cam, 360, 300)).el, mid = G.elAz(G.pixelToWorld(R, cam, 360, 640)).el;
  ok(up > mid && Math.abs(mid) < 1e-12, 'arriba en la imagen = más elevación');
  const right = G.elAz(G.pixelToWorld(R, cam, 600, 640)).az;
  ok(right > 0, 'a la derecha en la imagen = azimut mayor (hacia el este)');
  // Pantalla girada 90° (horizontal, el borde superior del celular a la izquierda): "arriba" en la imagen
  // es el costado derecho del celular (+x del dispositivo).
  const RL = G.eulerToR(0, 0, -90); // celular de canto: +x del dispositivo apunta hacia arriba
  const Rs = G.screenR(RL, 90);
  const camL = G.camFor(1280, 720, 0.8);
  const top = G.elAz(G.pixelToWorld(Rs, camL, 640, 100)).el, ctr = G.elAz(G.pixelToWorld(Rs, camL, 640, 360)).el;
  ok(top > ctr, 'pantalla horizontal: arriba en la imagen = más elevación');
}

console.log('3. Altura con un solo observador (geometría exacta)');
for (let i = 0; i < 500; i++) {
  const d = 20 + rnd() * 120, Hobs = -2 + rnd() * 15, az0 = (rnd() - 0.5) * 2;
  const ux = Math.sin(az0), uy = Math.cos(az0); // horizontal hacia la rampa
  const pad = [d * ux, d * uy, 0];
  const eye = [0, 0, Hobs];
  const dir = (P) => G.unit([P[0] - eye[0], P[1] - eye[1], P[2] - eye[2]]);
  const b = G.elAz(dir(pad));
  const base = { el0: b.el, az0: b.az };
  const z = rnd() * 150, lat = (rnd() - 0.5) * 40; // cohete en el plano perpendicular a la visual
  const P = [pad[0] + lat * uy, pad[1] - lat * ux, z];
  const r = G.elAz(dir(P));
  const res = G.heightAt(r.el, r.az, base, d, true);
  near(res.h, z, 1e-6, 'altura recuperada');
  near(res.lat, lat, 1e-6, 'deriva lateral recuperada (positiva a la derecha)');
}

console.log('4. Calibración de la focal (objeto lejano visto en dos orientaciones)');
for (const fTrue of [0.6, 0.8, 1.1]) {
  const camT = G.camFor(720, 1280, fTrue);
  const obj = G.dirFromElAz(25 * G.DEG, 10 * G.DEG);
  const R1 = G.lookR(obj, 0.01);
  const R2 = G.lookR(G.dirFromElAz(5 * G.DEG, 13 * G.DEG), -0.02);
  const p1 = G.worldToPixel(R1, camT, obj), p2 = G.worldToPixel(R2, camT, obj);
  const noisy = (p) => ({ u: p.u + (rnd() - 0.5) * 3, v: p.v + (rnd() - 0.5) * 3 });
  const n1 = noisy(p1), n2 = noisy(p2);
  const res = G.solveFocal([{ a: { ...n1, Rs: R1 }, b: { ...n2, Rs: R2 } }], 720, 1280);
  near(res.fNorm / fTrue, 1, 0.02, `focal ${fTrue} (objeto a ${Math.round(p2.v - 640)} px del centro)`);
}

console.log('5. GPS');
near(G.gpsDistance({ lat: 2.444, lon: -76.6 }, { lat: 2.445, lon: -76.6 }), 111.2, 0.3, '0.001° de latitud');

console.log(fails ? `\n${fails} fallas` : '\nTodo bien.');
process.exitCode = fails ? 1 : 0;
