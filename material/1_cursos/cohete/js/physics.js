// Vuelo de un cohete con empuje, gravedad, arrastre cuadrático y viento. Lo usan la demostración y las pruebas
// para tener una trayectoria con "altura verdadera" conocida contra la cual comparar la medición.

export const G_LOCAL = 9.777; // m/s², Popayán
export const RHO = 0.98; // kg/m³, aire a ≈1760 m s. n. m.

// Curvas de empuje como puntos (t [s], F [N]) unidos por rectas.
export const PRESETS = {
  agua: {
    nombre: 'Cohete de agua (botella de 2 L, 0.7 L de agua, 4 bar)',
    mDry: 0.15, mProp: 0.7, curve: [[0, 0], [0.005, 230], [0.12, 0]],
    cd: 0.5, diam: 0.10, len: 0.62, rail: 0.5, chute: null,
    body: '#2b6f4c', nose: '#d23b2a', dSug: 40,
  },
  modelo: {
    nombre: 'Cohete de modelismo (motor B6-4)',
    mDry: 0.05, mProp: 0.0062, curve: [[0, 0], [0.05, 4], [0.2, 12], [0.3, 5], [0.85, 4.5], [0.9, 0]],
    cd: 0.6, diam: 0.025, len: 0.45, rail: 0.9, chute: { delay: 4.0, cda: 0.1 },
    body: '#e7e2d6', nose: '#d23b2a', dSug: 150,
  },
};

function curveAt(curve, t) {
  if (t <= curve[0][0] || t >= curve[curve.length - 1][0]) return 0;
  for (let i = 1; i < curve.length; i++) {
    if (t <= curve[i][0]) {
      const [t0, f0] = curve[i - 1], [t1, f1] = curve[i];
      return f0 + ((f1 - f0) * (t - t0)) / (t1 - t0);
    }
  }
  return 0;
}

function impulseTo(curve, t) {
  let I = 0;
  for (let i = 1; i < curve.length; i++) {
    const [t0, f0] = curve[i - 1], [t1, f1] = curve[i];
    if (t <= t0) break;
    const te = Math.min(t, t1);
    const fe = f0 + ((f1 - f0) * (te - t0)) / (t1 - t0);
    I += 0.5 * (f0 + fe) * (te - t0);
  }
  return I;
}

/**
 * Trayectoria precalculada. Posiciones relativas a la base de la rampa (x este, y norte, z arriba), del centro
 * del cohete. opts: wind [wx, wy] (m/s, hacia donde sopla), railTiltDeg, railAzDeg.
 */
export class RocketSim {
  constructor(preset, opts = {}) {
    this.p = typeof preset === 'string' ? PRESETS[preset] : preset;
    this.wind = opts.wind || [0, 0];
    const tilt = (opts.railTiltDeg ?? 2) * Math.PI / 180, raz = (opts.railAzDeg ?? 0) * Math.PI / 180;
    this.railDir = [Math.sin(tilt) * Math.sin(raz), Math.sin(tilt) * Math.cos(raz), Math.cos(tilt)];
    this.integrate();
  }

  integrate() {
    const p = this.p, wind = this.wind, u = this.railDir;
    const area = Math.PI * (p.diam / 2) ** 2;
    const tBurn = p.curve[p.curve.length - 1][0];
    const Itot = impulseTo(p.curve, tBurn);
    const z0 = p.len / 2 + 0.05;
    const pos = [0, 0, z0], vel = [0, 0, 0];
    let axis = u.slice();
    let t = 0;
    const rec = [];
    let nextRec = 0;
    this.apo = z0; this.tApo = 0; this.tLand = null;
    while (t < 90) {
      const dt = t < tBurn + 0.05 ? 0.0005 : 0.002;
      const m = p.mDry + p.mProp * (1 - impulseTo(p.curve, Math.min(t, tBurn)) / Itot);
      const T = curveAt(p.curve, t);
      const vr = [vel[0] - wind[0], vel[1] - wind[1], vel[2]];
      const sp = Math.hypot(vr[0], vr[1], vr[2]);
      const travel = Math.hypot(pos[0], pos[1], pos[2] - z0);
      const onRail = travel < p.rail;
      if (!onRail && sp > 0.5) axis = [vr[0] / sp, vr[1] / sp, vr[2] / sp];
      let cda = p.cd * area;
      if (p.chute && t > tBurn + p.chute.delay) cda += p.chute.cda;
      const k = 0.5 * RHO * cda * sp;
      const F = [T * axis[0] - k * vr[0], T * axis[1] - k * vr[1], T * axis[2] - k * vr[2] - m * G_LOCAL];
      if (onRail) {
        const along = F[0] * u[0] + F[1] * u[1] + F[2] * u[2];
        const vAlong = vel[0] * u[0] + vel[1] * u[1] + vel[2] * u[2];
        const a = vAlong <= 0 && along <= 0 ? 0 : along / m;
        for (let i = 0; i < 3; i++) { vel[i] = (vAlong + a * dt) * u[i]; pos[i] += vel[i] * dt; }
      } else {
        for (let i = 0; i < 3; i++) { vel[i] += (F[i] / m) * dt; pos[i] += vel[i] * dt; }
      }
      t += dt;
      if (pos[2] > this.apo) { this.apo = pos[2]; this.tApo = t; }
      if (t >= nextRec) { rec.push([t, pos[0], pos[1], pos[2], vel[0], vel[1], vel[2], axis[0], axis[1], axis[2]]); nextRec += 0.01; }
      if (t > 0.3 && pos[2] < 0.05) { this.tLand = t; break; }
    }
    rec.push([t, pos[0], pos[1], Math.max(0, pos[2]), 0, 0, 0, axis[0], axis[1], axis[2]]);
    this.rec = rec;
    this.tBurn = tBurn;
    this.tEnd = t;
  }

  /** Estado interpolado a los t segundos del despegue: {p, v, axis, phase}. */
  at(t) {
    const r = this.rec;
    if (t <= 0) return { p: [0, 0, r[0][3]], v: [0, 0, 0], axis: this.railDir, phase: 'rampa' };
    if (t >= this.tEnd) { const e = r[r.length - 1]; return { p: [e[1], e[2], e[3]], v: [0, 0, 0], axis: [e[7], e[8], e[9]], phase: 'suelo' }; }
    let i = Math.min(r.length - 2, Math.floor(t / 0.01));
    while (i > 0 && r[i][0] > t) i--;
    while (i < r.length - 2 && r[i + 1][0] < t) i++;
    const a = r[i], b = r[i + 1];
    const s = (t - a[0]) / Math.max(1e-9, b[0] - a[0]);
    const L = (k) => a[k] + (b[k] - a[k]) * s;
    const phase = t < this.tBurn ? 'empuje' : t < this.tApo ? 'subida' : 'bajada';
    return { p: [L(1), L(2), L(3)], v: [L(4), L(5), L(6)], axis: [L(7), L(8), L(9)], phase };
  }
}
