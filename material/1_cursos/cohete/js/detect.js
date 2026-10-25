// Detección del cohete en la imagen reducida de análisis (RGBA, como ImageData).
//
// Dos pistas, según el modo:
//   · trípode (cámara fija): diferencia contra un modelo de fondo que se aprende antes del despegue;
//   · en la mano (cámara moviéndose): contraste contra el color típico del cielo dentro de una ventana pequeña.
// En ambos casos se arma un mapa de "diferencia" dentro de una ventana, se umbraliza de forma robusta
// (mediana + desviación absoluta mediana) y se agrupan los píxeles en manchas conectadas.

export class Background {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.m = new Float32Array(w * h * 3);
    this.ready = false;
  }
  reset() { this.ready = false; }
  /**
   * Promedio exponencial; `hole` = {x, y, r} es una zona que no se actualiza (donde está el cohete).
   * Con `every` > 1 cada llamada actualiza solo una de cada `every` filas (intercaladas) con un alfa mayor:
   * el mismo efecto a una fracción del costo.
   */
  update(data, alpha, hole = null, every = 1) {
    const { w, h, m } = this;
    if (!this.ready) {
      for (let i = 0, j = 0; i < w * h * 4; i += 4, j += 3) { m[j] = data[i]; m[j + 1] = data[i + 1]; m[j + 2] = data[i + 2]; }
      this.ready = true;
      this.phase = 0;
      return;
    }
    const a = Math.min(1, alpha * every);
    const y0 = every > 1 ? (this.phase = ((this.phase || 0) + 1) % every) : 0;
    const hr = hole ? hole.r : -1;
    for (let y = y0; y < h; y += every) {
      let xs = w, xe = w; // tramo [xs, xe) que no se toca en esta fila
      if (hole) {
        const dy = y - hole.y;
        if (dy * dy < hr * hr) {
          const dx = Math.sqrt(hr * hr - dy * dy);
          xs = Math.max(0, Math.floor(hole.x - dx));
          xe = Math.min(w, Math.ceil(hole.x + dx));
        }
      }
      let i = y * w * 4, j = y * w * 3;
      for (let x = 0; x < w; x++, i += 4, j += 3) {
        if (x === xs && xe > xs) { const sk = xe - xs; x += sk - 1; i += 4 * (sk - 1); j += 3 * (sk - 1); continue; }
        m[j] += a * (data[i] - m[j]);
        m[j + 1] += a * (data[i + 1] - m[j + 1]);
        m[j + 2] += a * (data[i + 2] - m[j + 2]);
      }
    }
  }
}

/** Rectángulo entero recortado a la imagen, o null si queda vacío. */
export function clipRoi(x0, y0, x1, y1, w, h) {
  x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0));
  x1 = Math.min(w, Math.ceil(x1)); y1 = Math.min(h, Math.ceil(y1));
  if (x1 - x0 < 2 || y1 - y0 < 2) return null;
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

/** Diferencia media por canal entre el cuadro y el fondo dentro de la ventana. */
export function motionScores(data, w, bg, roi) {
  const D = new Float32Array(roi.w * roi.h);
  const m = bg.m;
  let k = 0;
  for (let y = roi.y0; y < roi.y1; y++) {
    let i = (y * w + roi.x0) * 4, j = (y * w + roi.x0) * 3;
    for (let x = roi.x0; x < roi.x1; x++, i += 4, j += 3) {
      D[k++] = (Math.abs(data[i] - m[j]) + Math.abs(data[i + 1] - m[j + 1]) + Math.abs(data[i + 2] - m[j + 2])) / 3;
    }
  }
  return D;
}

/** Diferencia media por canal contra el color mediano de la ventana (el "cielo"). */
export function contrastScores(data, w, roi) {
  const hr = new Uint32Array(256), hg = new Uint32Array(256), hb = new Uint32Array(256);
  for (let y = roi.y0; y < roi.y1; y++) {
    for (let x = roi.x0, i = (y * w + roi.x0) * 4; x < roi.x1; x++, i += 4) { hr[data[i]]++; hg[data[i + 1]]++; hb[data[i + 2]]++; }
  }
  const n = roi.w * roi.h;
  const mr = histMedian(hr, n), mg = histMedian(hg, n), mb = histMedian(hb, n);
  const D = new Float32Array(n);
  let k = 0;
  for (let y = roi.y0; y < roi.y1; y++) {
    for (let x = roi.x0, i = (y * w + roi.x0) * 4; x < roi.x1; x++, i += 4) {
      D[k++] = (Math.abs(data[i] - mr) + Math.abs(data[i + 1] - mg) + Math.abs(data[i + 2] - mb)) / 3;
    }
  }
  return D;
}

function histMedian(hist, n) {
  let acc = 0;
  for (let v = 0; v < hist.length; v++) { acc += hist[v]; if (acc * 2 >= n) return v; }
  return hist.length - 1;
}

/** Umbral robusto: mediana + k·(1.4826·MAD), nunca por debajo de tmin. Devuelve también la textura (MAD). */
export function robustThreshold(D, k = 6, tmin = 14) {
  const h = new Uint32Array(256);
  for (let i = 0; i < D.length; i++) h[Math.min(255, D[i] | 0)]++;
  const med = histMedian(h, D.length);
  const h2 = new Uint32Array(256);
  for (let i = 0; i < D.length; i++) h2[Math.min(255, Math.abs((D[i] | 0) - med))]++;
  const mad = histMedian(h2, D.length);
  return { thr: Math.max(tmin, med + k * 1.4826 * Math.max(mad, 0.7)), med, mad };
}

/**
 * Manchas conectadas (8 vecinos) de píxeles con D > thr. Coordenadas devueltas en la imagen completa.
 * Cada mancha: {n, x, y (centroide ponderado), minx, maxx, miny, maxy, pts:[x, y, peso, ...]}.
 */
export function labelBlobs(D, roi, thr, maxBlobs = 24) {
  const { w: rw, h: rh, x0, y0 } = roi;
  const lab = new Int32Array(rw * rh);
  const blobs = [];
  const stack = [];
  for (let s = 0; s < D.length; s++) {
    if (lab[s] || D[s] <= thr) continue;
    const id = blobs.length + 1;
    const b = { n: 0, sw: 0, sx: 0, sy: 0, minx: 1e9, maxx: -1e9, miny: 1e9, maxy: -1e9, pts: [] };
    lab[s] = id;
    stack.push(s);
    while (stack.length) {
      const p = stack.pop();
      const px = p % rw, py = (p - px) / rw;
      const wgt = D[p] - thr + 1;
      const X = px + x0, Y = py + y0;
      b.n++; b.sw += wgt; b.sx += wgt * (X + 0.5); b.sy += wgt * (Y + 0.5);
      if (X < b.minx) b.minx = X; if (X > b.maxx) b.maxx = X;
      if (Y < b.miny) b.miny = Y; if (Y > b.maxy) b.maxy = Y;
      if (b.pts.length < 3000) b.pts.push(X + 0.5, Y + 0.5, wgt);
      for (let dy = -1; dy <= 1; dy++) {
        const qy = py + dy;
        if (qy < 0 || qy >= rh) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const qx = px + dx;
          if (qx < 0 || qx >= rw) continue;
          const q = qy * rw + qx;
          if (!lab[q] && D[q] > thr) { lab[q] = id; stack.push(q); }
        }
      }
    }
    b.x = b.sx / b.sw;
    b.y = b.sy / b.sw;
    blobs.push(b);
    if (blobs.length >= maxBlobs) break;
  }
  return blobs;
}

/**
 * Punto delantero de una mancha en la dirección de avance (vx, vy): la punta del cohete y no su estela
 * de agua o humo. Con velocidad casi nula devuelve el centroide.
 */
export function leadingPoint(b, vx, vy) {
  const sp = Math.hypot(vx, vy);
  if (sp < 1e-6 || b.n < 3) return { x: b.x, y: b.y };
  const ux = vx / sp, uy = vy / sp;
  let pmax = -Infinity;
  for (let i = 0; i < b.pts.length; i += 3) pmax = Math.max(pmax, b.pts[i] * ux + b.pts[i + 1] * uy);
  let sw = 0, sx = 0, sy = 0;
  for (let i = 0; i < b.pts.length; i += 3) {
    const p = b.pts[i] * ux + b.pts[i + 1] * uy;
    if (p >= pmax - 1.6) { const wg = b.pts[i + 2]; sw += wg; sx += wg * b.pts[i]; sy += wg * b.pts[i + 1]; }
  }
  return { x: sx / sw, y: sy / sw };
}
