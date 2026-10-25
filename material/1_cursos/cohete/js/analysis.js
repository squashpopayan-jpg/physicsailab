// Análisis del vuelo: alturas a partir de los ángulos guardados, apogeo ajustado, velocidades y exportación.

import * as G from './geom.js';
import { G_LOCAL } from './physics.js';

/**
 * Convierte muestras {t, el, az, src, sigPx, ...} en alturas con los parámetros P:
 * {d, sigD, base:{el0, az0}, lateralFix, sigSensorDeg, f}. Se recalcula cada vez para poder corregir d o la base.
 */
export function computeHeights(samples, P) {
  const out = [];
  const sS = P.sigSensorDeg * G.DEG;
  for (const s of samples) {
    const r = G.heightAt(s.el, s.az, P.base, P.d, P.lateralFix);
    if (!r) continue;
    const sigEl = Math.hypot(sS, (s.sigPx || 1) / P.f);
    // Solo el error aleatorio de cada punto; los sistemáticos (d, base) se suman al resultado final.
    const sig = G.heightSigma(s.el, s.az, P.base, P.d, 0, sigEl, 0, P.lateralFix);
    out.push({ ...s, h: r.h, lat: r.lat, sig });
  }
  return out;
}

function median3(a, b, c) { return Math.max(Math.min(a, b), Math.min(Math.max(a, b), c)); }

function solve3(A, y) {
  // Eliminación de Gauss con pivoteo parcial (3×3).
  const M = A.map((r, i) => [...r, y[i]]);
  for (let c = 0; c < 3; c++) {
    let p = c;
    for (let r = c + 1; r < 3; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) return null;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < 3; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k < 4; k++) M[r][k] -= f * M[c][k];
    }
  }
  return [M[0][3] / M[0][0], M[1][3] / M[1][1], M[2][3] / M[2][2]];
}

function inv3(A) {
  const cols = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((e) => solve3(A, e));
  if (cols.some((c) => !c)) return null;
  return [0, 1, 2].map((r) => [cols[0][r], cols[1][r], cols[2][r]]);
}

/** Ajuste h = a·τ² + b·τ + c (τ = t − tm) por mínimos cuadrados, con covarianza. */
export function quadFit(pts, tm) {
  const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], y = [0, 0, 0];
  for (const p of pts) {
    const x = p.t - tm, v = [x * x, x, 1];
    for (let i = 0; i < 3; i++) { y[i] += v[i] * p.h; for (let j = 0; j < 3; j++) A[i][j] += v[i] * v[j]; }
  }
  const sol = solve3(A, y);
  if (!sol) return null;
  const [a, b, c] = sol;
  let ss = 0;
  for (const p of pts) { const x = p.t - tm; ss += (p.h - (a * x * x + b * x + c)) ** 2; }
  const s2 = pts.length > 3 ? ss / (pts.length - 3) : 0;
  const Ai = inv3(A);
  return { a, b, c, tm, s2, cov: Ai ? Ai.map((r) => r.map((v) => v * s2)) : null };
}

/**
 * Resumen del vuelo a partir de puntos con altura (t en s desde el despegue).
 * Devuelve apogeo ajustado ± incertidumbre (aleatoria y sistemática), tiempo al apogeo, rapidez vertical
 * máxima, deriva lateral en el apogeo y conteos por fuente.
 */
export function analyze(pts, P) {
  if (!pts || pts.length < 2) return null;
  const n = pts.length;
  const hs = pts.map((p, i) => median3(pts[Math.max(0, i - 1)].h, p.h, pts[Math.min(n - 1, i + 1)].h));
  let im = 0;
  for (let i = 1; i < n; i++) if (hs[i] > hs[im]) im = i;
  const hm = hs[im], tm = pts[im].t;
  const hmaxRaw = Math.max(...pts.map((p) => p.h));
  let apo = hm, tApo = tm, fit = null, sigStat = pts[im].sig || 0, fitted = false;
  const band = Math.max(1.5, 0.15 * hm);
  const win = Math.max(0.6, 0.35 * Math.max(tm, 0.5));
  const sel = pts.filter((p) => p.h >= hm - band && Math.abs(p.t - tm) <= win);
  if (sel.length >= 5) {
    fit = quadFit(sel, tm);
    if (fit && fit.a < 0) {
      const tv = -fit.b / (2 * fit.a);
      if (tv >= sel[0].t - tm - 0.15 && tv <= sel[sel.length - 1].t - tm + 0.15) {
        apo = fit.c - (fit.b * fit.b) / (4 * fit.a);
        tApo = tm + tv;
        fitted = true;
        if (fit.cov) {
          const g = [(fit.b * fit.b) / (4 * fit.a * fit.a), -fit.b / (2 * fit.a), 1];
          let v = 0;
          for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) v += g[i] * fit.cov[i][j] * g[j];
          sigStat = Math.sqrt(Math.max(0, v));
        }
      }
    }
  }
  // Sistemáticos: distancia, sesgo del sensor en el cohete y en la base.
  const sS = P.sigSensorDeg * G.DEG;
  const elApo = Math.atan(apo / P.d + Math.tan(P.base.el0));
  const sigSys = Math.hypot((apo / P.d) * P.sigD, (P.d / Math.cos(elApo) ** 2) * sS, (P.d / Math.cos(P.base.el0) ** 2) * sS);
  // Rapidez vertical: pendiente de rectas locales (±3 puntos, tramos ≤ 0.4 s).
  let vmax = null, tv = null;
  for (let i = 0; i < n; i++) {
    const a = Math.max(0, i - 3), b = Math.min(n - 1, i + 3);
    if (b - a < 4 || pts[b].t - pts[a].t > 0.4) continue;
    let st = 0, sh = 0, stt = 0, sth = 0, k = 0;
    for (let j = a; j <= b; j++) { const x = pts[j].t; st += x; sh += pts[j].h; stt += x * x; sth += x * pts[j].h; k++; }
    const den = k * stt - st * st;
    if (den <= 0) continue;
    const v = (k * sth - st * sh) / den;
    if (vmax == null || v > vmax) { vmax = v; tv = pts[i].t; }
  }
  let latApo = null, best = Infinity;
  for (const p of pts) if (Math.abs(p.t - tApo) < best) { best = Math.abs(p.t - tApo); latApo = p.lat; }
  // Deriva hacia o desde el observador: un solo celular no la ve, y cada metro que el cohete se acerca sube la
  // altura aparente en h/d. Si el observador está de lado al viento, esa deriva es una fracción de la lateral
  // (desvío del viento ±20° → ≈0.35×) más la inclinación de la rampa (≈3 % del apogeo). Se informa aparte.
  const along = Math.max(0.35 * Math.abs(latApo || 0), 0.03 * apo);
  const sigDrift = (apo * along) / P.d;
  // ¿El punto más alto quedó pegado al borde de la imagen? Entonces el cohete pudo seguir subiendo fuera del cuadro.
  const edge = P.H ? 0.04 * P.H : 0;
  const top = pts[im];
  // Si se vio al cohete dar la vuelta (parábola con vértice dentro de los datos), no hay recorte.
  const clipped = !fitted && !!(P.H && top.v != null && (top.v < edge || top.u < edge || top.u > P.W - edge));
  const count = (src) => pts.filter((p) => p.src === src).length;
  return {
    clipped,
    apogee: apo, sig: Math.hypot(sigStat, sigSys), sigTotal: Math.hypot(sigStat, sigSys, sigDrift), sigStat, sigSys, sigDrift, along,
    tApo, hmaxRaw, fitted, fit,
    vmax, tVmax: tv, latApo, v0Ideal: Math.sqrt(2 * G_LOCAL * Math.max(0, apo)),
    n, nAuto: count('auto'), nCross: count('cruz'), nManual: count('manual') + count('toque'),
    tFirst: pts[0].t, tLast: pts[n - 1].t,
  };
}

const f = (x, d = 2) => (x == null || !isFinite(x) ? '' : x.toFixed(d));

/** Texto CSV (coma como separador, punto decimal) con encabezado de parámetros. */
export function toCSV(meta, pts, res) {
  const L = [
    '# Apogeo: registro de altura de un cohete medido con un solo celular',
    `# fecha,${meta.date}`,
    `# etiqueta,${(meta.label || '').replace(/,/g, ' ')}`,
    `# modo,${meta.mode === 'tripod' ? 'tripode' : 'en la mano'}`,
    `# distancia_horizontal_m,${f(meta.d, 2)}`,
    `# sigma_distancia_m,${f(meta.sigD, 2)}`,
    `# elevacion_base_deg,${f(meta.base.el0 / G.DEG, 3)}`,
    `# altura_celular_sobre_base_m,${f(-meta.d * Math.tan(meta.base.el0), 2)}`,
    `# focal_normalizada,${f(meta.fNorm, 4)}`,
    `# correccion_lateral,${meta.lateralFix ? 'si' : 'no'}`,
    `# apogeo_m,${res ? f(res.apogee, 2) : ''}`,
    `# sigma_apogeo_m,${res ? f(res.sig, 2) : ''}`,
    `# t_apogeo_s,${res ? f(res.tApo, 3) : ''}`,
    'cuadro,t_s,elevacion_deg,azimut_rel_deg,altura_m,sigma_m,deriva_lateral_m,fuente,u_px,v_px',
  ];
  for (const p of pts) {
    L.push([p.i ?? '', f(p.t, 3), f(p.el / G.DEG, 3), f(G.wrap(p.az - meta.base.az0) / G.DEG, 3), f(p.h, 2), f(p.sig, 2), f(p.lat, 2), p.src, f(p.u, 1), f(p.v, 1)].join(','));
  }
  return L.join('\n') + '\n';
}

/** Marcas "redondas" para un eje. */
export function niceTicks(lo, hi, target = 5) {
  const span = Math.max(1e-9, hi - lo);
  const raw = span / target;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) || 10 * mag;
  const out = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10));
  return { ticks: out, step };
}
