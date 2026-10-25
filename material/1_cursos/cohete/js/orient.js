// Orientación del celular. Guarda las lecturas recientes del sensor (evento deviceorientation: giroscopio +
// acelerómetro fusionados por Android) con su hora, para pedir la orientación del instante exacto en que se
// tomó cada cuadro de video. Sin esto, al mover el celular la imagen y el ángulo quedarían desfasados.

import * as G from './geom.js';

export class Orientation {
  constructor() {
    this.buf = [];
    this.count = 0;
    this.hasAlpha = true;
    this.onEvent = (e) => this.handle(e);
  }

  async start() {
    const DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') {
      try { await DOE.requestPermission(); } catch { /* sin permiso: se avisará por falta de datos */ }
    }
    window.addEventListener('deviceorientation', this.onEvent);
  }

  stop() { window.removeEventListener('deviceorientation', this.onEvent); }

  handle(e) {
    if (e.beta == null || e.gamma == null) return;
    if (e.alpha == null) this.hasAlpha = false;
    const now = performance.now();
    const t = e.timeStamp && Math.abs(e.timeStamp - now) < 2000 ? e.timeStamp : now;
    this.push(t, G.eulerToR(e.alpha || 0, e.beta, e.gamma));
  }

  /** Agrega una lectura (t en ms, misma base que performance.now()). La demostración también la usa. */
  push(t, R) {
    this.buf.push({ t, R });
    this.count++;
    if (this.buf.length > 300) this.buf.splice(0, this.buf.length - 300);
  }

  get live() {
    const b = this.buf;
    return b.length > 0 && performance.now() - b[b.length - 1].t < 1000;
  }

  /**
   * Orientación (mundo←dispositivo) en el instante t (ms). Con avgMs > 0 promedia las lecturas de esa ventana
   * (útil en trípode: baja el ruido del sensor).
   */
  at(t, avgMs = 0) {
    const b = this.buf;
    if (!b.length) return null;
    if (avgMs > 0) {
      const acc = new Array(9).fill(0);
      let n = 0;
      for (let i = b.length - 1; i >= 0 && b[i].t >= t - avgMs; i--) {
        if (b[i].t > t + 20) continue;
        for (let k = 0; k < 9; k++) acc[k] += b[i].R[k];
        n++;
      }
      if (n > 0) return G.orthonormalize(acc.map((v) => v / n));
    }
    if (t >= b[b.length - 1].t) return b[b.length - 1].R;
    if (t <= b[0].t) return b[0].R;
    let lo = 0, hi = b.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (b[m].t <= t) lo = m; else hi = m; }
    const a = b[lo], c = b[hi];
    const s = (t - a.t) / Math.max(1e-6, c.t - a.t);
    return G.orthonormalize(a.R.map((v, k) => v + (c.R[k] - v) * s));
  }
}

/** Ángulo de la pantalla (0, 90, 180, 270) respecto de su posición natural. */
export function screenAngle() {
  const so = screen.orientation;
  if (so && typeof so.angle === 'number') return so.angle;
  return typeof window.orientation === 'number' ? (window.orientation + 360) % 360 : 0;
}
