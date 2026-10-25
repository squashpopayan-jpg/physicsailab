// Seguimiento del cohete cuadro a cuadro y medición de su altura.
//
// Estados: 'idle' (sin grabar) → 'armed' (esperando el despegue) → 'flight' (siguiendo) ⇄ 'lost' → 'done'.
// La posición del cohete se guarda como dirección en el mundo (elevación, azimut), no como píxel: así la
// predicción sigue valiendo aunque el celular se mueva (modo en la mano), porque se re-proyecta con la
// orientación actual de cada cuadro.

import * as G from './geom.js';
import { Background, clipRoi, motionScores, contrastScores, robustThreshold, labelBlobs, leadingPoint } from './detect.js';

const LOST_AFTER = 0.7; // s sin detecciones (trípode) para declarar "perdido"
const AIM_ERR_DEG = 1.0; // error típico al apuntar la cruz con la mano

function median3(a, b, c) { return Math.max(Math.min(a, b), Math.min(Math.max(a, b), c)); }

// Mínimos cuadrados de grado 1 o 2 y evaluación en x.
function fitEval(pts, key, x) {
  const n = pts.length;
  if (n === 1) return pts[0][key];
  const span = pts[n - 1].t - pts[0].t;
  const deg = n >= 5 && span >= 0.12 ? 2 : 1;
  const m = deg + 1;
  const A = Array.from({ length: m }, () => new Array(m + 1).fill(0));
  for (const p of pts) {
    const pw = [1, p.t, p.t * p.t];
    for (let i = 0; i < m; i++) {
      A[i][m] += pw[i] * p[key];
      for (let j = 0; j < m; j++) A[i][j] += pw[i] * pw[j];
    }
  }
  for (let c = 0; c < m; c++) {
    let piv = c;
    for (let r = c + 1; r < m; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
    if (Math.abs(A[piv][c]) < 1e-12) return pts[n - 1][key];
    [A[c], A[piv]] = [A[piv], A[c]];
    for (let r = 0; r < m; r++) {
      if (r === c) continue;
      const f = A[r][c] / A[c][c];
      for (let k = c; k <= m; k++) A[r][k] -= f * A[c][k];
    }
  }
  let y = 0;
  for (let i = 0; i < m; i++) y += (A[i][m] / A[i][i]) * x ** i;
  return y;
}

/**
 * Elige la mancha del cohete. Con cámara fija solo aparecen cosas que se mueven: si el cohete va rápido se toma
 * la más adelantada en la dirección del movimiento (va delante de su chorro de agua o su humo). Con la cámara en
 * la mano también aparecen nubes y bordes quietos, así que se toma la más cercana a la predicción.
 */
function pickBlob(blobs, pa, vx, vy, r, maxN, preferAhead) {
  const sp = Math.hypot(vx, vy);
  const fast = preferAhead && sp > 1.5;
  const ux = fast ? vx / sp : 0, uy = fast ? vy / sp : 0;
  let best = null, bs = Infinity;
  for (const b of blobs) {
    if (b.n > maxN) continue;
    const lp = leadingPoint(b, vx, vy);
    const rx = lp.x - pa.x, ry = lp.y - pa.y;
    let sc;
    if (fast) {
      const along = rx * ux + ry * uy, perp = Math.abs(rx * uy - ry * ux);
      if (perp > 0.6 * r + 2) continue;
      sc = -along / r + (0.5 * perp) / r;
    } else {
      const dd = Math.hypot(rx, ry);
      if (dd > r * 1.1) continue;
      sc = dd / r - 0.05 * Math.log1p(b.n);
    }
    if (sc < bs) { bs = sc; best = lp; }
  }
  return best;
}

/** Ventana de búsqueda: un cuadrado de lado 2r alrededor de la predicción, alargado hacia adelante. */
function searchBox(pa, vx, vy, r, aw, ah) {
  const fx = pa.x + 1.5 * vx, fy = pa.y + 1.5 * vy;
  return clipRoi(Math.min(pa.x, fx) - r, Math.min(pa.y, fy) - r, Math.max(pa.x, fx) + r, Math.max(pa.y, fy) + r, aw, ah);
}

export class Pipeline {
  constructor(cfg = {}) {
    this.cfg = { mode: 'tripod', d: 40, sigD: 0.5, lateralFix: true, fNorm: 0.8, sigSensorDeg: 0.3, ...cfg };
    this.base = null;
    this.W = 0;
    this.cam = null;
    this.resetFlight();
  }

  configure(c) {
    Object.assign(this.cfg, c);
    if (this.W) this.cam = G.camFor(this.W, this.H, this.cfg.fNorm);
  }

  setSizes(W, H, aw, ah) {
    if (W === this.W && H === this.H && aw === this.aw && ah === this.ah) return;
    Object.assign(this, { W, H, aw, ah, k: aw / W });
    this.cam = G.camFor(W, H, this.cfg.fNorm);
    this.bg = new Background(aw, ah);
  }

  /** Fija la base de la rampa con un píxel de la imagen y la orientación de ese cuadro. */
  setBasePixel(u, v, Rs) {
    const { el, az } = G.elAz(G.pixelToWorld(Rs, this.cam, u, v));
    this.base = { el0: el, az0: az, u, v };
  }

  resetFlight() {
    this.state = 'idle';
    this.samples = [];
    this.hist = [];
    this.pre = [];
    this.cand = [];
    this.tLaunch = null;
    this.lastDetT = -1e9;
    this.misses = 0;
    this.maxH = null;
    this.tMax = null;
    this.apoFlag = false;
    this.pendingTap = null;
    this.armT = null;
    this.landedT = null;
    this.outTop = false; // el cohete salió del cuadro por arriba: el apogeo medido es solo un mínimo
  }

  arm(t) {
    this.resetFlight();
    this.state = 'armed';
    this.armT = t;
    // En trípode la base se vuelve a calcular con la orientación del primer cuadro: así no importa la
    // deriva lenta del rumbo del giroscopio entre el momento en que se tocó la rampa y el lanzamiento.
    this.needRebase = this.cfg.mode === 'tripod' && !!this.base;
    if (this.bg) this.bg.reset();
  }

  disarm() { if (this.state !== 'idle') this.state = 'done'; }

  /** El usuario tocó el cohete en la pantalla (píxel de la imagen completa). */
  tap(u, v) { this.pendingTap = { u, v }; }

  measure(t, u, v, Rs, src, sigPx) {
    const w = G.pixelToWorld(Rs, this.cam, u, v);
    const { el, az } = G.elAz(w);
    const s = { t, el, az, u, v, src, sigPx, w, h: null, lat: null, sig: null };
    if (this.base) {
      const r = G.heightAt(el, az, this.base, this.cfg.d, this.cfg.lateralFix);
      if (r) {
        s.h = r.h;
        s.lat = r.lat;
        const sigEl = Math.hypot(this.cfg.sigSensorDeg * G.DEG, sigPx / this.cam.f);
        s.sig = G.heightSigma(el, az, this.base, this.cfg.d, this.cfg.sigD, sigEl, this.cfg.sigSensorDeg * G.DEG, this.cfg.lateralFix);
      }
    }
    return s;
  }

  startFlight(t0) {
    this.tLaunch = t0;
    this.state = 'flight';
  }

  accept(s) {
    if (s.h == null) return;
    this.samples.push(s);
    this.hist.push({ t: s.t, el: s.el, az: s.az });
    if (this.hist.length > 40) this.hist.shift();
    const S = this.samples, n = S.length;
    const hm = n >= 3 ? median3(S[n - 3].h, S[n - 2].h, S[n - 1].h) : s.h;
    if (this.maxH == null || hm > this.maxH) { this.maxH = hm; this.tMax = s.t; }
    if (!this.apoFlag && this.maxH > 2 && hm < this.maxH - Math.max(1.5, 0.06 * this.maxH) && s.t - this.tMax > 0.25) this.apoFlag = true;
    if (this.apoFlag && s.t - this.tLaunch > 1 && hm < 0.4) { this.state = 'done'; this.landedT = s.t; }
  }

  roiFull(r) { return { x: r.x0 / this.k, y: r.y0 / this.k, w: r.w / this.k, h: r.h / this.k }; }

  /** Predicción (píxel y desplazamiento por cuadro) a partir de las últimas direcciones medidas. */
  predict(t, Rs) {
    const H = this.hist;
    if (!H.length) return null;
    const last = H[H.length - 1];
    const pts = [];
    for (const p of H) if (last.t - p.t <= 0.45) pts.push({ t: p.t - last.t, el: p.el, az: last.az + G.wrap(p.az - last.az) });
    const x = Math.min(t, last.t + 0.5) - last.t, dt = this.dtFrame || 1 / 30;
    const d1 = G.dirFromElAz(fitEval(pts, 'el', x), fitEval(pts, 'az', x));
    const d0 = G.dirFromElAz(fitEval(pts, 'el', x - dt), fitEval(pts, 'az', x - dt));
    const p1 = G.worldToPixel(Rs, this.cam, d1), p0 = G.worldToPixel(Rs, this.cam, d0);
    if (!p1 || !p0) return null;
    return { u: p1.u, v: p1.v, du: p1.u - p0.u, dv: p1.v - p0.v };
  }

  /** Procesa un cuadro: {t (s), img (ImageData reducida), Rs (mundo←pantalla)}. Devuelve el estado para la HUD. */
  process({ t, img, Rs }) {
    const view = { t, state: this.state, sample: null, roi: null, cross: null, sky: null };
    if (!this.cam) return view;
    // Intervalo real entre cuadros (el celular puede ir a menos de 30 cuadros/s).
    if (this.lastFrameT != null) this.dtFrame = Math.min(0.2, Math.max(1 / 120, 0.8 * (this.dtFrame || t - this.lastFrameT) + 0.2 * (t - this.lastFrameT)));
    this.lastFrameT = t;
    if (this.base) view.cross = this.measure(t, this.W / 2, this.H / 2, Rs, 'cruz', 0);
    if (this.state === 'armed' && this.needRebase) { this.setBasePixel(this.base.u, this.base.v, Rs); this.needRebase = false; }
    let out = null;
    if (this.state === 'armed' || this.state === 'flight' || this.state === 'lost') {
      if (this.pendingTap) out = this.onTap(t, img, Rs);
      else out = this.cfg.mode === 'tripod' ? this.stepTripod(t, img, Rs, view) : this.stepFollow(t, img, Rs, view);
    } else this.pendingTap = null;
    if (out) for (const s of out) this.accept(s);
    view.sample = out && out.length ? out[out.length - 1] : null;
    if (this.cfg.mode === 'tripod' && this.state === 'flight' && t - this.lastDetT > LOST_AFTER) this.state = 'lost';
    view.state = this.state;
    return view;
  }

  onTap(t, img, Rs) {
    const tp = this.pendingTap;
    this.pendingTap = null;
    const s = this.measure(t, tp.u, tp.v, Rs, 'toque', 4);
    if (this.state === 'armed') this.startFlight(t);
    else this.state = 'flight';
    this.hist = [];
    this.lastDetT = t;
    this.misses = 0;
    if (this.cfg.mode === 'tripod') this.bg.update(img.data, 0.03, { x: tp.u * this.k, y: tp.v * this.k, r: 12 });
    return [s];
  }

  // ---------- Trípode: cámara fija, diferencia contra el fondo ----------
  stepTripod(t, img, Rs, view) {
    const { aw, ah, k, bg } = this, data = img.data;
    if (this.state === 'armed') {
      const age = t - this.armT;
      bg.update(data, age < 0.6 ? 0.3 : 0.05, null, age < 0.6 ? 1 : 3);
      if (age < 0.4 || !this.base) return null;
      // Ventana de despegue: una franja angosta encima de la rampa.
      const px = this.base.u * k, py = this.base.v * k;
      const hw = Math.max(6, 0.05 * aw), up = Math.max(24, 0.3 * ah);
      const roi = clipRoi(px - hw, py - up, px + hw, py + 3, aw, ah);
      if (!roi) return null;
      view.roi = this.roiFull(roi);
      const D = motionScores(data, aw, bg, roi);
      const { thr } = robustThreshold(D, 6, 14);
      const area = roi.w * roi.h;
      let top = null;
      for (const b of labelBlobs(D, roi, thr)) if (b.n >= 2 && b.n < 0.5 * area && (!top || b.miny < top.miny)) top = b;
      if (!top) { this.cand.length = 0; return null; }
      const lp = leadingPoint(top, 0, -1);
      this.cand.push({ t, x: lp.x, y: lp.y });
      if (this.cand.length > 3) this.cand.shift();
      const [a, b, c] = this.cand;
      // Despegue: la punta sube en tres cuadros seguidos y ya se separó de la rampa.
      if (c && b.y < a.y - 0.7 && c.y < b.y - 0.7 && py - c.y > 2.5 && c.t - a.t < 0.3) {
        this.startFlight(a.t - (b.t - a.t));
        this.lastDetT = t;
        this.misses = 0;
        this.cand.length = 0;
        return [a, b, c].map((p) => this.measure(p.t, p.x / k, p.y / k, Rs, 'auto', 0.8 / k));
      }
      return null;
    }
    const pr = this.predict(t, Rs);
    let s = null, hole = null;
    if (pr && pr.v < 0 && pr.dv < 0 && !this.apoFlag) this.outTop = true;
    if (pr) {
      const pa = { x: pr.u * k, y: pr.v * k }, vx = pr.du * k, vy = pr.dv * k;
      const sp = Math.hypot(vx, vy);
      const r = Math.min(0.3 * aw, 6 + 1.5 * sp + 4 * this.misses);
      hole = { x: pa.x + 0.75 * vx, y: pa.y + 0.75 * vy, r: r + 6 + 0.75 * sp };
      const roi = searchBox(pa, vx, vy, r, aw, ah);
      if (roi) {
        view.roi = this.roiFull(roi);
        const D = motionScores(data, aw, bg, roi);
        const { thr } = robustThreshold(D, 6, 14);
        const best = pickBlob(labelBlobs(D, roi, thr), pa, vx, vy, r, Math.max(60, 0.4 * roi.w * roi.h), true);
        if (best) {
          s = this.measure(t, best.x / k, best.y / k, Rs, 'auto', 0.8 / k);
          this.lastDetT = t;
          this.misses = 0;
          if (this.state === 'lost') this.state = 'flight';
          hole = { x: (best.x + pa.x) / 2, y: (best.y + pa.y) / 2, r: r + 6 + Math.hypot(best.x - pa.x, best.y - pa.y) / 2 };
        } else this.misses++;
      } else this.misses++;
    } else this.misses++;
    bg.update(data, 0.02, hole, 3);
    return s ? [s] : null;
  }

  // ---------- En la mano: la cruz sigue al cohete; el contraste contra el cielo afina la posición ----------
  stepFollow(t, img, Rs, view) {
    const { aw, ah, k } = this, cx = aw / 2, cy = ah / 2;
    const cross = () => this.measure(t, this.W / 2, this.H / 2, Rs, 'cruz', this.cam.f * Math.tan(AIM_ERR_DEG * G.DEG));
    if (this.state === 'armed') {
      const s = cross();
      if (s.h == null) return null;
      const P = this.pre;
      P.push(s);
      if (P.length > 90) P.shift();
      const n = P.length;
      // Despegue: la cruz sube más de 2 m durante tres cuadros seguidos.
      // Nivel de reposo: lo que marca la cruz mientras apuntas al cohete parado (mediana de lo anterior).
      const older = P.slice(0, Math.max(0, n - 6)).map((q) => q.h).sort((a, b) => a - b);
      const rest = older.length ? older[Math.floor(older.length / 2)] : 0;
      if (n >= 3 && P[n - 1].h > rest + 2 && P[n - 1].h > P[n - 2].h && P[n - 2].h > P[n - 3].h && P[n - 3].h > rest + 0.3) {
        let i0 = n - 3;
        while (i0 > 0 && P[i0 - 1].h > rest + 0.35) i0--;
        this.startFlight(i0 > 0 ? P[i0 - 1].t : P[i0].t);
        const out = P.slice(i0);
        this.pre = [];
        return out;
      }
      return null;
    }
    let pa = { x: cx, y: cy }, vx = 0, vy = 0;
    if (t - this.lastDetT < 0.5) {
      const pr = this.predict(t, Rs);
      if (pr) { pa = { x: pr.u * k, y: pr.v * k }; vx = pr.du * k; vy = pr.dv * k; }
    }
    if (Math.hypot(pa.x - cx, pa.y - cy) > 0.32 * aw) { pa = { x: cx, y: cy }; vx = 0; vy = 0; }
    const sp = Math.hypot(vx, vy);
    const r = Math.min(0.25 * aw, 0.06 * aw + 1.5 * sp + 6 * Math.min(this.misses, 12));
    const roi = searchBox(pa, vx, vy, r, aw, ah);
    let s = null;
    if (roi) {
      view.roi = this.roiFull(roi);
      const D = contrastScores(img.data, aw, roi);
      const st = robustThreshold(D, 7, 22);
      view.sky = st.mad;
      if (st.mad <= 5) {
        const best = pickBlob(labelBlobs(D, roi, st.thr), pa, vx, vy, r, Math.max(30, 0.08 * roi.w * roi.h), false);
        if (best) {
          s = this.measure(t, best.x / k, best.y / k, Rs, 'auto', 0.8 / k);
          this.lastDetT = t;
          this.misses = 0;
        }
      }
    }
    if (!s) { s = cross(); this.misses++; }
    return s.h == null ? null : [s];
  }
}
