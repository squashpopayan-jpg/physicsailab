/* ===================================================================
   lib/85-nn.js — Perceptrón y red neuronal multicapa (MLP) con
   retropropagación explícita: activaciones ReLU/tanh/sigmoide,
   salidas sigmoide/softmax/lineal, inicialización He/Xavier,
   regularización L2 y dropout, comprobación numérica del gradiente.
   Los parámetros viven en un vector plano para usar L.opt.
   =================================================================== */
(function (root) {
  'use strict';
  const ML = (root.ML = root.ML || {});
  const L = (ML.L = ML.L || {});
  const U = L.util;
  const NN = (L.nn = {});

  NN.ACT = {
    relu: { f: (z) => (z > 0 ? z : 0), d: (z, a) => (z > 0 ? 1 : 0) },
    leaky: { f: (z) => (z > 0 ? z : 0.01 * z), d: (z) => (z > 0 ? 1 : 0.01) },
    tanh: { f: (z) => Math.tanh(z), d: (z, a) => 1 - a * a },
    sigmoid: { f: (z) => U.sigmoid(z), d: (z, a) => a * (1 - a) },
    linear: { f: (z) => z, d: () => 1 }
  };

  /* Perceptrón de Rosenblatt: una época de la regla w ← w + η (y − ŷ) x (y en {0,1}) */
  NN.perceptronEpoch = function (X, y, w, eta = 1, order) {
    let errors = 0;
    for (const i of order || U.range(X.length)) {
      const z = w[0] + w[1] * X[i][0] + w[2] * X[i][1];
      const yh = z >= 0 ? 1 : 0;
      if (yh !== y[i]) { errors++; const d = eta * (y[i] - yh); w[0] += d; w[1] += d * X[i][0]; w[2] += d * X[i][1]; }
    }
    return errors;
  };

  /* o = {sizes, act, out, init, rng, initScale} */
  NN.mlp = function (o) {
    const sizes = o.sizes, nl = sizes.length - 1;
    const act = NN.ACT[o.act || 'relu'];
    const outK = o.out || (sizes[nl] === 1 ? 'sigmoid' : 'softmax');
    const rng = o.rng || L.rng(1);
    const off = [];
    let P = 0;
    for (let l = 0; l < nl; l++) { off.push({ W: P, b: P + sizes[l] * sizes[l + 1] }); P += sizes[l] * sizes[l + 1] + sizes[l + 1]; }
    const params = new Float64Array(P);
    const init = (kind = o.init || 'he', scale = o.initScale) => {
      for (let l = 0; l < nl; l++) {
        const nin = sizes[l], nout = sizes[l + 1];
        const sd = scale !== undefined ? scale : kind === 'xavier' ? Math.sqrt(2 / (nin + nout)) : kind === 'zeros' ? 0 : Math.sqrt(2 / nin);
        for (let q = 0; q < nin * nout; q++) params[off[l].W + q] = sd * rng.gauss();
        for (let q = 0; q < nout; q++) params[off[l].b + q] = 0;
      }
    };
    init();
    const W = (l, j, i) => params[off[l].W + j * sizes[l] + i];
    /* Propagación hacia delante: devuelve {z, a} por capa (a[0] = entrada) */
    const forward = (x, mask) => {
      const a = [Float64Array.from(x)], z = [null];
      for (let l = 0; l < nl; l++) {
        const nin = sizes[l], nout = sizes[l + 1], zl = new Float64Array(nout), al = new Float64Array(nout);
        const prev = a[l];
        for (let j = 0; j < nout; j++) {
          let s = params[off[l].b + j];
          const base = off[l].W + j * nin;
          for (let i = 0; i < nin; i++) s += params[base + i] * prev[i];
          zl[j] = s;
        }
        if (l < nl - 1) {
          for (let j = 0; j < nout; j++) { al[j] = act.f(zl[j]); if (mask && mask[l]) al[j] *= mask[l][j]; }
        } else if (outK === 'sigmoid') for (let j = 0; j < nout; j++) al[j] = U.sigmoid(zl[j]);
        else if (outK === 'softmax') { const sm = U.softmax(Array.from(zl)); for (let j = 0; j < nout; j++) al[j] = sm[j]; }
        else for (let j = 0; j < nout; j++) al[j] = zl[j];
        z.push(zl); a.push(al);
      }
      return { z, a };
    };
    /* Pérdida de un ejemplo: target es clase (sigmoide/softmax) o vector (lineal) */
    const lossOf = (out, t) => {
      if (outK === 'sigmoid') { const p = U.clamp(out[0], 1e-12, 1 - 1e-12); return -(t * Math.log(p) + (1 - t) * Math.log(1 - p)); }
      if (outK === 'softmax') return -Math.log(Math.max(out[t], 1e-12));
      let s = 0; const tv = Array.isArray(t) ? t : [t];
      for (let j = 0; j < out.length; j++) s += 0.5 * (out[j] - tv[j]) ** 2;
      return s;
    };
    /* Retropropagación de un ejemplo, acumula en grad; devuelve pérdida y deltas */
    const backprop = (x, t, grad, mask) => {
      const { z, a } = forward(x, mask);
      const out = a[nl];
      const loss = lossOf(out, t);
      let delta = new Float64Array(sizes[nl]);
      if (outK === 'sigmoid') delta[0] = out[0] - t;
      else if (outK === 'softmax') for (let j = 0; j < out.length; j++) delta[j] = out[j] - (j === t ? 1 : 0);
      else { const tv = Array.isArray(t) ? t : [t]; for (let j = 0; j < out.length; j++) delta[j] = out[j] - tv[j]; }
      const deltas = [];
      for (let l = nl - 1; l >= 0; l--) {
        deltas[l] = delta;
        const nin = sizes[l], nout = sizes[l + 1], prev = a[l];
        for (let j = 0; j < nout; j++) {
          const base = off[l].W + j * nin;
          for (let i = 0; i < nin; i++) grad[base + i] += delta[j] * prev[i];
          grad[off[l].b + j] += delta[j];
        }
        if (l > 0) {
          const nd = new Float64Array(nin);
          for (let i = 0; i < nin; i++) {
            let s = 0;
            for (let j = 0; j < nout; j++) s += params[off[l].W + j * nin + i] * delta[j];
            let dv = s * act.d(z[l][i], a[l][i]);
            if (mask && mask[l - 1]) dv *= mask[l - 1][i];
            nd[i] = dv;
          }
          delta = nd;
        }
      }
      return { loss, deltas, a, z };
    };
    const net = {
      sizes, params, off, outK, nl, P, act: o.act || 'relu', init,
      W, forward,
      predict1: (x) => forward(x).a[nl],
      /* Pérdida media (sin regularización) */
      loss: (X, Y) => { let s = 0; for (let i = 0; i < X.length; i++) s += lossOf(forward(X[i]).a[nl], Y[i]); return s / X.length; },
      lossOf,
      /* Gradiente medio sobre los índices idx; o = {l2, dropout, rng} */
      grad(X, Y, idx, oo = {}) {
        const g = new Float64Array(P);
        let loss = 0;
        const keep = 1 - (oo.dropout || 0);
        for (const i of idx) {
          let mask = null;
          if (oo.dropout) { mask = []; for (let l = 0; l < nl - 1; l++) mask.push(Float64Array.from({ length: sizes[l + 1] }, () => ((oo.rng || rng)() < keep ? 1 / keep : 0))); }
          loss += backprop(X[i], Y[i], g, mask).loss;
        }
        for (let q = 0; q < P; q++) g[q] /= idx.length;
        loss /= idx.length;
        if (oo.l2) {
          for (let l = 0; l < nl; l++) for (let q = 0; q < sizes[l] * sizes[l + 1]; q++) { const k = off[l].W + q; g[k] += oo.l2 * params[k]; loss += 0.5 * oo.l2 * params[k] * params[k]; }
        }
        return { g, loss };
      },
      backprop,
      /* Una época de mini-lotes; devuelve la pérdida media de entrenamiento */
      epoch(X, Y, opt, oo = {}) {
        const n = X.length, bs = Math.min(n, oo.batch || 32);
        const order = (oo.rng || rng).perm(n);
        let tot = 0, nb = 0;
        for (let s = 0; s < n; s += bs) {
          const idx = order.slice(s, s + bs);
          const r = net.grad(X, Y, idx, oo);
          if (oo.clip) { let nrm = 0; for (const v of r.g) nrm += v * v; nrm = Math.sqrt(nrm); if (nrm > oo.clip) for (let q = 0; q < P; q++) r.g[q] *= oo.clip / nrm; }
          opt.step(params, r.g);
          tot += r.loss; nb++;
        }
        return tot / nb;
      },
      /* Normas del gradiente de los pesos de cada capa (para ver desvanecimiento) */
      layerGradNorms(X, Y, idx) {
        const r = net.grad(X, Y, idx);
        return U.range(nl).map((l) => { let s = 0; for (let q = 0; q < sizes[l] * sizes[l + 1]; q++) s += r.g[off[l].W + q] ** 2; return Math.sqrt(s / (sizes[l] * sizes[l + 1])); });
      },
      /* Comprobación numérica del gradiente: máximo error relativo */
      gradCheck(X, Y, idx, h = 1e-6) {
        const r = net.grad(X, Y, idx);
        let worst = 0;
        for (let q = 0; q < P; q++) {
          const v = params[q];
          params[q] = v + h; const lp = net.grad(X, Y, idx).loss;
          params[q] = v - h; const lm = net.grad(X, Y, idx).loss;
          params[q] = v;
          const num = (lp - lm) / (2 * h);
          const rel = Math.abs(num - r.g[q]) / Math.max(1e-8, Math.abs(num) + Math.abs(r.g[q]));
          worst = Math.max(worst, rel);
        }
        return worst;
      }
    };
    return net;
  };
  NN.nParams = (sizes) => { let s = 0; for (let l = 0; l < sizes.length - 1; l++) s += sizes[l] * sizes[l + 1] + sizes[l + 1]; return s; };

  /* ---------- Convolución 2D (para el capítulo de CNN) ---------- */
  NN.conv2d = function (img, H, Wd, k, o = {}) {
    const kh = k.length, kw = k[0].length, s = o.stride || 1, pad = o.pad || 0;
    const oh = Math.floor((H + 2 * pad - kh) / s) + 1, ow = Math.floor((Wd + 2 * pad - kw) / s) + 1;
    const out = new Float64Array(oh * ow);
    for (let i = 0; i < oh; i++) for (let j = 0; j < ow; j++) {
      let acc = o.bias || 0;
      for (let a = 0; a < kh; a++) for (let b = 0; b < kw; b++) {
        const r = i * s + a - pad, c = j * s + b - pad;
        if (r >= 0 && r < H && c >= 0 && c < Wd) acc += img[r * Wd + c] * k[a][b];
      }
      out[i * ow + j] = acc;
    }
    return { out, h: oh, w: ow };
  };
  NN.pool = function (img, H, Wd, size = 2, kind = 'max') {
    const oh = Math.floor(H / size), ow = Math.floor(Wd / size), out = new Float64Array(oh * ow);
    for (let i = 0; i < oh; i++) for (let j = 0; j < ow; j++) {
      let v = kind === 'max' ? -Infinity : 0;
      for (let a = 0; a < size; a++) for (let b = 0; b < size; b++) { const x = img[(i * size + a) * Wd + j * size + b]; v = kind === 'max' ? Math.max(v, x) : v + x / (size * size); }
      out[i * ow + j] = v;
    }
    return { out, h: oh, w: ow };
  };

  /* ---------- Atención de producto escalar ---------- */
  NN.attention = function (Q, K, V, o = {}) {
    const d = Q[0].length, sc = o.scale === false ? 1 : 1 / Math.sqrt(d);
    const S = Q.map((q, i) => K.map((k, j) => (o.causal && j > i ? -Infinity : sc * U.range(d).reduce((s, t) => s + q[t] * k[t], 0))));
    const A = S.map((r) => U.softmax(r, o.T || 1));
    const out = A.map((r) => V[0].map((_, t) => U.sum(r.map((w, j) => w * V[j][t]))));
    return { S, A, out };
  };
})(typeof window !== 'undefined' ? window : globalThis);
