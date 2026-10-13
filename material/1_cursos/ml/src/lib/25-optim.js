/* ===================================================================
   lib/25-optim.js — Optimizadores de primer orden (descenso de
   gradiente, momento, Nesterov, AdaGrad, RMSProp, Adam) y funciones
   de prueba en 2D para visualizarlos.
   =================================================================== */
(function (root) {
  'use strict';
  const ML = (root.ML = root.ML || {});
  const L = (ML.L = ML.L || {});
  const O = (L.opt = {});

  /* Crea un optimizador con estado. o = {lr, beta, beta1, beta2, eps}
     step(w, g) modifica w en el lugar usando el gradiente g. */
  O.make = function (kind, o = {}) {
    const lr = o.lr === undefined ? 0.01 : o.lr;
    const st = { t: 0, m: null, v: null };
    const ensure = (n) => { if (!st.m || st.m.length !== n) { st.m = new Float64Array(n); st.v = new Float64Array(n); } };
    const opt = {
      kind, lr, o,
      reset() { st.t = 0; st.m = null; st.v = null; },
      /* Para Nesterov: punto donde evaluar el gradiente */
      lookahead(w) {
        if (kind !== 'nesterov' || !st.m) return w;
        const b = o.beta === undefined ? 0.9 : o.beta;
        return w.map((x, i) => x - b * st.m[i]);
      },
      step(w, g) {
        const n = w.length;
        ensure(n);
        st.t++;
        const eta = opt.lr;
        if (kind === 'sgd' || kind === 'gd') { for (let i = 0; i < n; i++) w[i] -= eta * g[i]; return; }
        if (kind === 'momentum' || kind === 'nesterov') {
          const b = o.beta === undefined ? 0.9 : o.beta;
          for (let i = 0; i < n; i++) { st.m[i] = b * st.m[i] + eta * g[i]; w[i] -= st.m[i]; }
          return;
        }
        if (kind === 'adagrad') {
          const e = o.eps || 1e-8;
          for (let i = 0; i < n; i++) { st.v[i] += g[i] * g[i]; w[i] -= (eta * g[i]) / (Math.sqrt(st.v[i]) + e); }
          return;
        }
        if (kind === 'rmsprop') {
          const r = o.rho === undefined ? 0.9 : o.rho, e = o.eps || 1e-8;
          for (let i = 0; i < n; i++) { st.v[i] = r * st.v[i] + (1 - r) * g[i] * g[i]; w[i] -= (eta * g[i]) / (Math.sqrt(st.v[i]) + e); }
          return;
        }
        if (kind === 'adam' || kind === 'adamw') {
          const b1 = o.beta1 === undefined ? 0.9 : o.beta1, b2 = o.beta2 === undefined ? 0.999 : o.beta2, e = o.eps || 1e-8;
          const c1 = 1 - Math.pow(b1, st.t), c2 = 1 - Math.pow(b2, st.t);
          for (let i = 0; i < n; i++) {
            st.m[i] = b1 * st.m[i] + (1 - b1) * g[i];
            st.v[i] = b2 * st.v[i] + (1 - b2) * g[i] * g[i];
            w[i] -= (eta * (st.m[i] / c1)) / (Math.sqrt(st.v[i] / c2) + e);
            if (kind === 'adamw' && o.wd) w[i] -= eta * o.wd * w[i];
          }
          return;
        }
        throw new Error('optimizador desconocido: ' + kind);
      }
    };
    return opt;
  };
  O.KINDS = [['gd', 'Descenso de gradiente'], ['momentum', 'Momento'], ['nesterov', 'Nesterov'], ['adagrad', 'AdaGrad'], ['rmsprop', 'RMSProp'], ['adam', 'Adam']];

  /* Funciones de prueba en 2D: f(x, y), gradiente, mínimo y ventana de dibujo */
  O.SURF = {
    bowl: {
      n: 'Cuenco alargado (mal condicionado)', f: (x, y) => 0.5 * (x * x + 12 * y * y), g: (x, y) => [x, 12 * y],
      min: [0, 0], box: [-4, 4, -2.4, 2.4], start: [-3.6, 1.8], levels: (k) => 0.5 * Math.pow(1.6, k)
    },
    round: {
      n: 'Cuenco redondo (bien condicionado)', f: (x, y) => 0.5 * (x * x + y * y), g: (x, y) => [x, y],
      min: [0, 0], box: [-4, 4, -2.4, 2.4], start: [-3.6, 1.8], levels: (k) => 0.5 * Math.pow(1.6, k)
    },
    rosen: {
      n: 'Valle de Rosenbrock', f: (x, y) => (1 - x) ** 2 + 10 * (y - x * x) ** 2, g: (x, y) => [-2 * (1 - x) - 40 * x * (y - x * x), 20 * (y - x * x)],
      min: [1, 1], box: [-2, 2, -1, 3], start: [-1.5, 2.5], levels: (k) => 0.05 * Math.pow(1.9, k)
    },
    saddle: {
      n: 'Punto de silla', f: (x, y) => 0.5 * x * x - 0.5 * y * y + 0.05 * y ** 4, g: (x, y) => [x, -y + 0.2 * y ** 3],
      min: [0, Math.sqrt(5)], box: [-3, 3, -3.4, 3.4], start: [-2.6, 0.02], levels: (k) => -1.2 + 0.35 * k
    },
    multi: {
      n: 'Varios mínimos locales', f: (x, y) => 0.12 * (x * x + y * y) - Math.cos(1.6 * x) * Math.cos(1.6 * y),
      g: (x, y) => [0.24 * x + 1.6 * Math.sin(1.6 * x) * Math.cos(1.6 * y), 0.24 * y + 1.6 * Math.cos(1.6 * x) * Math.sin(1.6 * y)],
      min: [0, 0], box: [-4.5, 4.5, -2.8, 2.8], start: [-3.6, 2.2], levels: (k) => -0.9 + 0.22 * k
    }
  };
  /* Recorre una trayectoria de n pasos */
  O.path = function (surf, kind, o, n) {
    const opt = O.make(kind, o);
    const w = Float64Array.from(o.start || surf.start);
    const pts = [[w[0], w[1]]];
    for (let i = 0; i < n; i++) {
      const p = opt.lookahead(w);
      const g = surf.g(p[0], p[1]);
      opt.step(w, g);
      if (!isFinite(w[0]) || !isFinite(w[1]) || Math.abs(w[0]) > 1e6) break;
      pts.push([w[0], w[1]]);
    }
    return pts;
  };
})(typeof window !== 'undefined' ? window : globalThis);
