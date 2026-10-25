// Geometría de la medición: orientación del celular, rayos de la cámara y altura con un solo observador.
//
// Marcos de referencia
//   dispositivo: x a la derecha, y hacia el borde superior (celular en vertical), z saliendo de la pantalla;
//   pantalla:    como el dispositivo, pero girado según screen.orientation.angle (la imagen sigue a la pantalla);
//   mundo:       x ≈ este, y ≈ norte, z arriba. El rumbo es relativo: solo se usan diferencias de azimut.
// Las matrices son 3×3 guardadas por filas en arreglos de 9 números y llevan vectores del marco local al mundo.

export const DEG = Math.PI / 180;

/** Matriz mundo←dispositivo a partir de los ángulos W3C (grados): R = Rz(α)·Rx(β)·Ry(γ). */
export function eulerToR(alpha, beta, gamma) {
  const a = alpha * DEG, b = beta * DEG, g = gamma * DEG;
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cg = Math.cos(g), sg = Math.sin(g);
  return [
    ca * cg - sa * sb * sg, -sa * cb, ca * sg + sa * sb * cg,
    sa * cg + ca * sb * sg, ca * cb, sa * sg - ca * sb * cg,
    -cb * sg, sb, cb * cg,
  ];
}

/** Inversa de eulerToR con los rangos W3C: α∈[0,360), β∈[-180,180), γ∈[-90,90). */
export function rToEuler(R) {
  const sgn = R[8] >= 0 ? 1 : -1;
  const cb = sgn * Math.hypot(R[6], R[8]);
  const beta = Math.atan2(R[7], cb) / DEG;
  const gamma = Math.atan2(-R[6] * sgn, R[8] * sgn) / DEG;
  let alpha = Math.atan2(-R[1] * sgn, R[4] * sgn) / DEG;
  alpha = ((alpha % 360) + 360) % 360;
  return { alpha, beta, gamma };
}

/** Matriz mundo←pantalla: compensa la rotación de la pantalla (ángulo en grados, antihorario). */
export function screenR(R, angleDeg) {
  if (!angleDeg) return R;
  const t = -angleDeg * DEG, c = Math.cos(t), s = Math.sin(t);
  return [
    R[0] * c + R[1] * s, -R[0] * s + R[1] * c, R[2],
    R[3] * c + R[4] * s, -R[3] * s + R[4] * c, R[5],
    R[6] * c + R[7] * s, -R[6] * s + R[7] * c, R[8],
  ];
}

/** Re-ortonormaliza (Gram–Schmidt por columnas) una matriz que se promedió o interpoló. */
export function orthonormalize(R) {
  let x = [R[0], R[3], R[6]], y = [R[1], R[4], R[7]];
  x = unit(x);
  const p = dot(x, y);
  y = unit([y[0] - p * x[0], y[1] - p * x[1], y[2] - p * x[2]]);
  const z = cross(x, y);
  return [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]];
}

/** Orientación (mundo←dispositivo) de un celular cuya cámara trasera mira en la dirección `axis`. */
export function lookR(axis, roll = 0) {
  const zd = unit([-axis[0], -axis[1], -axis[2]]);
  const a = unit(axis);
  let y = [-a[2] * a[0], -a[2] * a[1], 1 - a[2] * a[2]];
  if (Math.hypot(y[0], y[1], y[2]) < 1e-6) y = [0, 1, 0];
  y = unit(y);
  let x = cross(y, zd);
  if (roll) {
    const c = Math.cos(roll), s = Math.sin(roll);
    const x2 = [c * x[0] + s * y[0], c * x[1] + s * y[1], c * x[2] + s * y[2]];
    const y2 = [-s * x[0] + c * y[0], -s * x[1] + c * y[1], -s * x[2] + c * y[2]];
    x = x2; y = y2;
  }
  return [x[0], y[0], zd[0], x[1], y[1], zd[1], x[2], y[2], zd[2]];
}

export function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
export function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
export function unit(v) { const n = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / n, v[1] / n, v[2] / n]; }
export function wrap(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }
export function angleBetween(a, b) { return Math.atan2(Math.hypot(...cross(a, b)), dot(a, b)); }

/** Modelo estenopeico. fNorm = distancia focal dividida por el lado largo de la imagen. */
export function camFor(W, H, fNorm) { return { W, H, f: fNorm * Math.max(W, H) }; }
/** Campo de visión (grados) del lado largo para una focal normalizada. */
export function fovDeg(fNorm) { return (2 * Math.atan(0.5 / fNorm)) / DEG; }
export function fNormFromFov(fovLongDeg) { return 0.5 / Math.tan((fovLongDeg * DEG) / 2); }

/** Dirección unitaria (mundo) del rayo que pasa por el píxel (u, v) de la imagen. */
export function pixelToWorld(Rs, cam, u, v) {
  const x = (u - cam.W / 2) / cam.f, y = -(v - cam.H / 2) / cam.f, z = -1;
  return unit([
    Rs[0] * x + Rs[1] * y + Rs[2] * z,
    Rs[3] * x + Rs[4] * y + Rs[5] * z,
    Rs[6] * x + Rs[7] * y + Rs[8] * z,
  ]);
}

/** Píxel donde se ve la dirección w (mundo), o null si queda detrás de la cámara. */
export function worldToPixel(Rs, cam, w) {
  const sx = Rs[0] * w[0] + Rs[3] * w[1] + Rs[6] * w[2];
  const sy = Rs[1] * w[0] + Rs[4] * w[1] + Rs[7] * w[2];
  const sz = Rs[2] * w[0] + Rs[5] * w[1] + Rs[8] * w[2];
  if (sz > -1e-6) return null;
  return { u: cam.W / 2 + (cam.f * sx) / -sz, v: cam.H / 2 - (cam.f * sy) / -sz };
}

/** Elevación y azimut (radianes) de una dirección del mundo. */
export function elAz(w) {
  return { el: Math.asin(Math.max(-1, Math.min(1, w[2]))), az: Math.atan2(w[0], w[1]) };
}
export function dirFromElAz(el, az) {
  return [Math.cos(el) * Math.sin(az), Math.cos(el) * Math.cos(az), Math.sin(el)];
}
/** Dirección hacia donde mira la cámara trasera (centro de la imagen). */
export function opticalAxis(Rs) { return [-Rs[2], -Rs[5], -Rs[8]]; }

/**
 * Altura sobre la base de la rampa vista con elevación `el` y azimut `az`.
 * base = {el0, az0}: dirección a la base de la rampa; d: distancia horizontal observador→rampa (m).
 * Supone el cohete en el plano vertical que pasa por la rampa, perpendicular a la visual (corrige la deriva
 * lateral); con lateralFix=false supone el cohete justo encima de la rampa.
 *   h = d·( tan(el)/cos(Δaz) − tan(el0) )        deriva lateral = d·tan(Δaz)
 * El término −d·tan(el0) es la altura del celular sobre la base, así que no hace falta medirla.
 */
export function heightAt(el, az, base, d, lateralFix = true) {
  const D = lateralFix ? wrap(az - base.az0) : 0;
  const c = Math.cos(D);
  if (c < 0.3 || Math.abs(el) > 88 * DEG) return null;
  return { h: d * (Math.tan(el) / c - Math.tan(base.el0)), lat: d * Math.tan(D) };
}

/** Incertidumbre (1σ, m) de la altura por errores de ángulo (rad) y de distancia (m). */
export function heightSigma(el, az, base, d, sigD, sigEl, sigEl0, lateralFix = true) {
  const D = lateralFix ? wrap(az - base.az0) : 0;
  const c = Math.cos(D);
  const h = d * (Math.tan(el) / c - Math.tan(base.el0));
  const a = (d / (c * Math.cos(el) ** 2)) * sigEl;
  const b = (d / Math.cos(base.el0) ** 2) * sigEl0;
  const e = (h / d) * sigD;
  return Math.sqrt(a * a + b * b + e * e);
}

/**
 * Calibración de la focal: cada par es el mismo objeto lejano visto en dos orientaciones, {a:{u,v,Rs}, b:{u,v,Rs}}.
 * Busca la focal que hace coincidir ambas direcciones. Devuelve {fNorm, residualDeg}.
 */
export function solveFocal(pairs, W, H) {
  const cost = (fn) => {
    const cam = camFor(W, H, fn);
    let s = 0;
    for (const p of pairs) {
      const a = pixelToWorld(p.a.Rs, cam, p.a.u, p.a.v);
      const b = pixelToWorld(p.b.Rs, cam, p.b.u, p.b.v);
      s += angleBetween(a, b) ** 2;
    }
    return s;
  };
  let lo = Math.log(0.25), hi = Math.log(4);
  let best = lo, bc = Infinity;
  for (let i = 0; i <= 120; i++) {
    const x = lo + ((hi - lo) * i) / 120;
    const c = cost(Math.exp(x));
    if (c < bc) { bc = c; best = x; }
  }
  const step = (hi - lo) / 120;
  let a = best - step, b = best + step;
  const gr = (Math.sqrt(5) - 1) / 2;
  for (let i = 0; i < 60; i++) {
    const x1 = b - gr * (b - a), x2 = a + gr * (b - a);
    if (cost(Math.exp(x1)) < cost(Math.exp(x2))) b = x2; else a = x1;
  }
  const fNorm = Math.exp((a + b) / 2);
  return { fNorm, residualDeg: Math.sqrt(cost(fNorm) / pairs.length) / DEG };
}

/** Distancia horizontal (m) entre dos posiciones GPS {lat, lon} en grados. */
export function gpsDistance(p, q) {
  const R = 6371008.8;
  const f1 = p.lat * DEG, f2 = q.lat * DEG, df = (q.lat - p.lat) * DEG, dl = (q.lon - p.lon) * DEG;
  const a = Math.sin(df / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}
