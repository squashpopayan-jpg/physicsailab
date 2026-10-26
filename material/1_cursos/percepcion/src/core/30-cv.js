/* ===================================================================
   30-cv.js — Biblioteca de Visión por Computadora & Algoritmos de Señal
   Percepción Computacional — Ing. Luis Fernando Barajas Ardila
   =================================================================== */
(function () {
  'use strict';
  const P = window.PERCEPCION;
  const CV = P.CV = {};

  /* ---------- 1. Kernels de Convolución Canónicos ---------- */
  CV.KERNELS = {
    box3: [
      [1/9, 1/9, 1/9],
      [1/9, 1/9, 1/9],
      [1/9, 1/9, 1/9]
    ],
    gauss3: [
      [1/16, 2/16, 1/16],
      [2/16, 4/16, 2/16],
      [1/16, 2/16, 1/16]
    ],
    sobelX: [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1]
    ],
    sobelY: [
      [-1, -2, -1],
      [ 0,  0,  0],
      [ 1,  2,  1]
    ],
    laplacian: [
      [ 0,  1,  0],
      [ 1, -4,  1],
      [ 0,  1,  0]
    ],
    sharpen: [
      [ 0, -1,  0],
      [-1,  5, -1],
      [ 0, -1,  0]
    ]
  };

  /* Convolución 2D espacial sobre grilla 2D numérica */
  CV.convolve2D = function (img, w, h, kernel) {
    const kw = kernel[0].length;
    const kh = kernel.length;
    const halfW = Math.floor(kw / 2);
    const halfH = Math.floor(kh / 2);
    const out = new Float32Array(w * h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0;
        for (let ky = 0; ky < kh; ky++) {
          for (let kx = 0; kx < kw; kx++) {
            const px = Math.min(Math.max(x + kx - halfW, 0), w - 1);
            const py = Math.min(Math.max(y + ky - halfH, 0), h - 1);
            sum += img[py * w + px] * kernel[ky][kx];
          }
        }
        out[y * w + x] = sum;
      }
    }
    return out;
  };

  /* Detección de Bordes Canny Simplificada */
  CV.canny = function (img, w, h, lowThresh = 30, highThresh = 70) {
    // 1. Suavizado gaussiano
    const smoothed = CV.convolve2D(img, w, h, CV.KERNELS.gauss3);
    // 2. Gradientes Sobel
    const gx = CV.convolve2D(smoothed, w, h, CV.KERNELS.sobelX);
    const gy = CV.convolve2D(smoothed, w, h, CV.KERNELS.sobelY);
    const mag = new Float32Array(w * h);
    const dir = new Float32Array(w * h);

    for (let i = 0; i < w * h; i++) {
      mag[i] = Math.hypot(gx[i], gy[i]);
      dir[i] = Math.atan2(gy[i], gx[i]);
    }

    // 3. Supresión de No-Máximos & Umbralización con Histéresis
    const edges = new Uint8Array(w * h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        const m = mag[idx];
        if (m < lowThresh) continue;

        let angle = (dir[idx] * 180 / Math.PI + 180) % 180;
        let q = 0, r = 0;

        if ((angle >= 0 && angle < 22.5) || (angle >= 157.5 && angle <= 180)) {
          q = mag[idx + 1];
          r = mag[idx - 1];
        } else if (angle >= 22.5 && angle < 67.5) {
          q = mag[(y + 1) * w + (x - 1)];
          r = mag[(y - 1) * w + (x + 1)];
        } else if (angle >= 67.5 && angle < 112.5) {
          q = mag[(y + 1) * w + x];
          r = mag[(y - 1) * w + x];
        } else {
          q = mag[(y - 1) * w + (x - 1)];
          r = mag[(y + 1) * w + (x + 1)];
        }

        if (m >= q && m >= r) {
          edges[idx] = m >= highThresh ? 255 : (m >= lowThresh ? 128 : 0);
        }
      }
    }
    return edges;
  };

  /* ---------- 2. Morfología Matemática ---------- */
  CV.SE_CROSS = [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0]
  ];
  CV.SE_SQUARE = [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1]
  ];

  CV.erode = function (bin, w, h, se = CV.SE_CROSS) {
    const kw = se[0].length, kh = se.length;
    const hw = Math.floor(kw / 2), hh = Math.floor(kh / 2);
    const out = new Uint8Array(w * h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let fits = 1;
        for (let ky = 0; ky < kh; ky++) {
          for (let kx = 0; kx < kw; kx++) {
            if (se[ky][kx]) {
              const px = x + kx - hw;
              const py = y + ky - hh;
              if (px < 0 || px >= w || py < 0 || py >= h || !bin[py * w + px]) {
                fits = 0;
                break;
              }
            }
          }
          if (!fits) break;
        }
        out[y * w + x] = fits ? 255 : 0;
      }
    }
    return out;
  };

  CV.dilate = function (bin, w, h, se = CV.SE_CROSS) {
    const kw = se[0].length, kh = se.length;
    const hw = Math.floor(kw / 2), hh = Math.floor(kh / 2);
    const out = new Uint8Array(w * h);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!bin[y * w + x]) continue;
        for (let ky = 0; ky < kh; ky++) {
          for (let kx = 0; kx < kw; kx++) {
            if (se[ky][kx]) {
              const px = x + kx - hw;
              const py = y + ky - hh;
              if (px >= 0 && px < w && py >= 0 && py < h) {
                out[py * w + px] = 255;
              }
            }
          }
        }
      }
    }
    return out;
  };

  CV.opening = function (bin, w, h, se = CV.SE_CROSS) {
    return CV.dilate(CV.erode(bin, w, h, se), w, h, se);
  };

  CV.closing = function (bin, w, h, se = CV.SE_CROSS) {
    return CV.erode(CV.dilate(bin, w, h, se), w, h, se);
  };

  CV.morphGradient = function (bin, w, h, se = CV.SE_CROSS) {
    const d = CV.dilate(bin, w, h, se);
    const e = CV.erode(bin, w, h, se);
    const out = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      out[i] = Math.max(0, d[i] - e[i]);
    }
    return out;
  };

  /* ---------- 3. Umbralización de Otsu ---------- */
  CV.calcHistogram = function (img, w, h) {
    const hist = new Int32Array(256);
    for (let i = 0; i < w * h; i++) {
      const val = Math.min(255, Math.max(0, Math.round(img[i])));
      hist[val]++;
    }
    return hist;
  };

  CV.otsuThreshold = function (hist, totalPixels) {
    let sumTotal = 0;
    for (let i = 0; i < 256; i++) sumTotal += i * hist[i];

    let sumB = 0;
    let wB = 0;
    let maxVariance = 0;
    let threshold = 0;

    for (let t = 0; t < 256; t++) {
      wB += hist[t];
      if (wB === 0) continue;
      const wF = totalPixels - wB;
      if (wF === 0) break;

      sumB += t * hist[t];
      const mB = sumB / wB;
      const mF = (sumTotal - sumB) / wF;
      const varianceBetween = wB * wF * Math.pow(mB - mF, 2);

      if (varianceBetween > maxVariance) {
        maxVariance = varianceBetween;
        threshold = t;
      }
    }
    return { threshold, maxVariance };
  };

  /* ---------- 4. Crecimiento de Regiones (Seeded Region Growing) ---------- */
  CV.regionGrowing = function (img, w, h, seedX, seedY, tolerance = 25) {
    const seg = new Uint8Array(w * h);
    const visited = new Uint8Array(w * h);
    const seedVal = img[seedY * w + seedX];
    const queue = [[seedX, seedY]];
    visited[seedY * w + seedX] = 1;

    let count = 0;
    while (queue.length > 0) {
      const [cx, cy] = queue.pop();
      seg[cy * w + cx] = 255;
      count++;

      const neighbors = [
        [cx + 1, cy], [cx - 1, cy],
        [cx, cy + 1], [cx, cy - 1]
      ];

      for (let i = 0; i < neighbors.length; i++) {
        const [nx, ny] = neighbors[i];
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const idx = ny * w + nx;
          if (!visited[idx]) {
            visited[idx] = 1;
            if (Math.abs(img[idx] - seedVal) <= tolerance) {
              queue.push([nx, ny]);
            }
          }
        }
      }
    }
    return { mask: seg, count };
  };

  /* ---------- 5. Matriz GLCM y Descriptores Haralick ---------- */
  CV.calcGLCM = function (img, w, h, levels = 8, dx = 1, dy = 0) {
    const glcm = [];
    for (let i = 0; i < levels; i++) glcm.push(new Float32Array(levels));

    const scale = levels / 256;
    let count = 0;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const v1 = Math.min(levels - 1, Math.floor(img[y * w + x] * scale));
          const v2 = Math.min(levels - 1, Math.floor(img[ny * w + nx] * scale));
          glcm[v1][v2]++;
          count++;
        }
      }
    }

    if (count > 0) {
      for (let i = 0; i < levels; i++) {
        for (let j = 0; j < levels; j++) glcm[i][j] /= count;
      }
    }

    // Haralick Features
    let contrast = 0;
    let energy = 0;
    let homogeneity = 0;
    let entropy = 0;

    for (let i = 0; i < levels; i++) {
      for (let j = 0; j < levels; j++) {
        const p = glcm[i][j];
        if (p > 0) {
          contrast += Math.pow(i - j, 2) * p;
          energy += p * p;
          homogeneity += p / (1 + Math.abs(i - j));
          entropy -= p * Math.log2(p);
        }
      }
    }

    return { glcm, contrast, energy, homogeneity, entropy };
  };

  /* ---------- 6. Filtro de Gabor 2D ---------- */
  CV.gabor2D = function (size = 31, lambda = 8, theta = 0, psi = 0, sigma = 4, gamma = 0.5) {
    const half = Math.floor(size / 2);
    const kernel = [];
    const rad = theta * Math.PI / 180;

    for (let y = -half; y <= half; y++) {
      const row = [];
      for (let x = -half; x <= half; x++) {
        const x_prime = x * Math.cos(rad) + y * Math.sin(rad);
        const y_prime = -x * Math.sin(rad) + y * Math.cos(rad);
        const env = Math.exp(-(Math.pow(x_prime, 2) + Math.pow(gamma * y_prime, 2)) / (2 * Math.pow(sigma, 2)));
        const carrier = Math.cos(2 * Math.PI * (x_prime / lambda) + psi);
        row.push(env * carrier);
      }
      kernel.push(row);
    }
    return kernel;
  };

  /* ---------- 7. Métricas de Clasificación ---------- */
  CV.calcMetrics = function (tp, fp, tn, fn) {
    const total = tp + fp + tn + fn;
    const accuracy = total > 0 ? (tp + tn) / total : 0;
    const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
    const recall = (tp + fn) > 0 ? tp / (tp + fn) : 0;
    const specificity = (tn + fp) > 0 ? tn / (tn + fp) : 0;
    const f1 = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0;

    return { accuracy, precision, recall, specificity, f1 };
  };
})();
