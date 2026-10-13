/* ===================================================================
   00-base.js — espacio de nombres MC, constantes, utilidades
   =================================================================== */
(function () {
  'use strict';
  const MC = (window.MC = window.MC || {});
  MC.sims = {};
  MC.defineSim = function (name, factory) { MC.sims[name] = factory; };

  /* Constantes físicas y datos (SI) */
  MC.K = {
    g: 9.8,            /* valor de trabajo en el curso */
    g0: 9.80665,       /* gravedad estándar */
    G: 6.674e-11,
    MT: 5.972e24, RT: 6.371e6,
    ML: 7.342e22, RL: 1.7374e6, dTL: 3.844e8,
    MS: 1.989e30, RS: 6.957e8, UA: 1.496e11,
    rhoAgua: 1000, rhoMar: 1025, rhoAire: 1.20,
    P0: 101325, vSon: 343, c: 2.998e8, I0: 1e-12
  };
  /* Gravedad superficial (m/s²) */
  MC.PLANETS = [
    ['tierra', 'Tierra', 9.8], ['luna', 'Luna', 1.62], ['marte', 'Marte', 3.71], ['venus', 'Venus', 8.87],
    ['mercurio', 'Mercurio', 3.70], ['jupiter', 'Júpiter', 24.79], ['saturno', 'Saturno', 10.44],
    ['urano', 'Urano', 8.87], ['neptuno', 'Neptuno', 11.15], ['pluton', 'Plutón', 0.62], ['sol', 'Sol', 274]
  ];
  MC.gOf = (id) => { const p = MC.PLANETS.find((q) => q[0] === id); return p ? p[2] : 9.8; };
  MC.planetOptions = (ids) => MC.PLANETS.filter((p) => !ids || ids.includes(p[0])).map((p) => [p[0], `${p[1]} (${p[2]} m/s²)`]);

  /* ---------- Matemática escalar ---------- */
  const M = (MC.M = {
    PI: Math.PI,
    TAU: 2 * Math.PI,
    clamp: (x, a, b) => Math.min(b, Math.max(a, x)),
    lerp: (a, b, t) => a + (b - a) * t,
    rad: (d) => (d * Math.PI) / 180,
    deg: (r) => (r * 180) / Math.PI,
    sq: (x) => x * x,
    sign: (x) => (x > 0 ? 1 : x < 0 ? -1 : 0),
    hyp: Math.hypot,
    linspace(a, b, n) {
      const out = new Array(n);
      for (let i = 0; i < n; i++) out[i] = n === 1 ? a : a + ((b - a) * i) / (n - 1);
      return out;
    },
    atan2p(y, x) { let a = Math.atan2(y, x); if (a < 0) a += 2 * Math.PI; return a; },
    wrap2pi(a) { a = a % (2 * Math.PI); return a < 0 ? a + 2 * Math.PI : a; },
    wrapPi(a) { a = M.wrap2pi(a); return a > Math.PI ? a - 2 * Math.PI : a; },
    simpson(f, a, b, n = 200) {
      if (n % 2) n++;
      const h = (b - a) / n;
      let s = f(a) + f(b);
      for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
      return (s * h) / 3;
    },
    /* Integrales elípticas completas K(m), E(m), m = k² (media aritmético-geométrica) */
    ellipKE(m) {
      if (m >= 1) return [Infinity, 1];
      let a = 1, b = Math.sqrt(1 - m), c = Math.sqrt(m);
      let sum = 0.5 * c * c, pow = 0.5;
      for (let i = 0; i < 30 && Math.abs(c) > 1e-15; i++) {
        const an = (a + b) / 2, bn = Math.sqrt(a * b);
        c = (a - b) / 2; pow *= 2; sum += pow * c * c; a = an; b = bn;
      }
      const K = Math.PI / (2 * a);
      return [K, K * (1 - sum)];
    },
    bisect(f, a, b, tol = 1e-12, it = 200) {
      let fa = f(a);
      for (let i = 0; i < it; i++) {
        const m = 0.5 * (a + b), fm = f(m);
        if (fa * fm <= 0) b = m; else { a = m; fa = fm; }
        if (Math.abs(b - a) < tol) break;
      }
      return 0.5 * (a + b);
    },
    /* Raíces reales de a t² + b t + c = 0 (ordenadas) */
    quad(a, b, c) {
      if (Math.abs(a) < 1e-14) { if (Math.abs(b) < 1e-14) return []; return [-c / b]; }
      const d = b * b - 4 * a * c;
      if (d < 0) return [];
      const s = Math.sqrt(d);
      const r1 = (-b - s) / (2 * a), r2 = (-b + s) / (2 * a);
      return r1 < r2 ? [r1, r2] : [r2, r1];
    },
    /* Paso de Runge-Kutta 4 para y' = f(t, y) con y arreglo */
    rk4(f, y, t, h) {
      const n = y.length, y2 = new Array(n), y3 = new Array(n), y4 = new Array(n), out = new Array(n);
      const k1 = f(t, y);
      for (let i = 0; i < n; i++) y2[i] = y[i] + 0.5 * h * k1[i];
      const k2 = f(t + 0.5 * h, y2);
      for (let i = 0; i < n; i++) y3[i] = y[i] + 0.5 * h * k2[i];
      const k3 = f(t + 0.5 * h, y3);
      for (let i = 0; i < n; i++) y4[i] = y[i] + h * k3[i];
      const k4 = f(t + h, y4);
      for (let i = 0; i < n; i++) out[i] = y[i] + (h / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]);
      return out;
    },
    /* Número aleatorio normal (Box–Muller) */
    gauss(mu = 0, s = 1) {
      let u = 0, v = 0;
      while (u === 0) u = Math.random();
      while (v === 0) v = Math.random();
      return mu + s * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
    mean(a) { return a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN; },
    std(a) {
      if (a.length < 2) return NaN;
      const m = M.mean(a);
      return Math.sqrt(a.reduce((s, x) => s + (x - m) * (x - m), 0) / (a.length - 1));
    },
    /* Búsqueda binaria: índice i tal que arr[i] <= x < arr[i+1] */
    bsearch(arr, x) {
      let lo = 0, hi = arr.length - 1;
      if (hi < 0) return -1;
      if (x <= arr[0]) return 0;
      if (x >= arr[hi]) return hi;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (arr[m] <= x) lo = m; else hi = m; }
      return lo;
    },
    /* Interpola arreglo ys (con xs crecientes) en x */
    interp(xs, ys, x) {
      const n = xs.length;
      if (!n) return NaN;
      const i = M.bsearch(xs, x);
      if (i >= n - 1) return ys[n - 1];
      const x0 = xs[i], x1 = xs[i + 1];
      if (x1 === x0) return ys[i];
      const t = M.clamp((x - x0) / (x1 - x0), 0, 1);
      return ys[i] + (ys[i + 1] - ys[i]) * t;
    }
  });

  /* ---------- Vectores 2D ---------- */
  MC.V = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1]],
    scale: (a, s) => [a[0] * s, a[1] * s],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1],
    cross: (a, b) => a[0] * b[1] - a[1] * b[0],
    norm: (a) => Math.hypot(a[0], a[1]),
    unit(a) { const n = Math.hypot(a[0], a[1]); return n > 0 ? [a[0] / n, a[1] / n] : [0, 0]; },
    rot(a, t) { const c = Math.cos(t), s = Math.sin(t); return [a[0] * c - a[1] * s, a[0] * s + a[1] * c]; },
    perp: (a) => [-a[1], a[0]],
    ang: (a) => Math.atan2(a[1], a[0]),
    polar: (r, t) => [r * Math.cos(t), r * Math.sin(t)]
  };

  /* ---------- Historial de series temporales ---------- */
  class History {
    constructor(keys, o = {}) {
      this.keys = keys;
      this.max = o.max || 5000;
      this.minDt = o.minDt === undefined ? 1 / 120 : o.minDt;
      this.clear();
    }
    clear() {
      this.d = { t: [] };
      for (const k of this.keys) this.d[k] = [];
      this._lastT = -Infinity;
      return this;
    }
    get n() { return this.d.t.length; }
    push(t, obj, force) {
      if (!force && t - this._lastT < this.minDt) return false;
      this._lastT = t;
      this.d.t.push(t);
      for (const k of this.keys) this.d[k].push(obj[k] === undefined ? NaN : obj[k]);
      if (this.d.t.length > this.max) {
        for (const k in this.d) this.d[k] = this.d[k].filter((_, i) => i % 2 === 0);
        this.minDt *= 2;
      }
      return true;
    }
    last(k) { const a = this.d[k]; return a.length ? a[a.length - 1] : NaN; }
    at(k, t) { return M.interp(this.d.t, this.d[k], t); }
    range(keys) {
      let lo = Infinity, hi = -Infinity;
      for (const k of keys) for (const v of this.d[k]) if (isFinite(v)) { if (v < lo) lo = v; if (v > hi) hi = v; }
      return [lo, hi];
    }
  }
  MC.History = History;

  /* ---------- Formato numérico ---------- */
  const SUP = { '-': '⁻', '+': '⁺', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const minus = (s) => String(s).replace(/-/g, '−');
  MC.minus = minus;
  MC.sup = (n) => String(n).split('').map((ch) => SUP[ch] || ch).join('');
  function fixedSig(x, d) {
    if (x === 0) return '0';
    const e = Math.floor(Math.log10(Math.abs(x)));
    const dec = M.clamp(d - 1 - e, 0, 8);
    let s = x.toFixed(dec);
    if (/^-0(\.0+)?$/.test(s)) s = s.slice(1);
    return minus(s);
  }
  /* d cifras significativas; notación científica fuera de [1e-3, 1e5) */
  MC.sci = function (x, d = 3) {
    if (x === null || x === undefined || Number.isNaN(x)) return '—';
    if (!isFinite(x)) return x > 0 ? '∞' : '−∞';
    if (x === 0) return '0';
    const ax = Math.abs(x);
    if (ax >= 1e-3 && ax < 1e5) return fixedSig(x, d);
    let e = Math.floor(Math.log10(ax));
    let m = +(x / Math.pow(10, e)).toFixed(d - 1);
    if (Math.abs(m) >= 10) { m /= 10; e += 1; }
    return minus(m.toFixed(d - 1)) + '×10' + MC.sup(e);
  };
  /* Decimales fijos con signo menos tipográfico */
  MC.fix = function (x, n = 2) {
    if (x === null || x === undefined || Number.isNaN(x)) return '—';
    if (!isFinite(x)) return x > 0 ? '∞' : '−∞';
    let s = x.toFixed(n);
    if (/^-0(\.0+)?$/.test(s)) s = s.slice(1);
    return minus(s);
  };
  /* Número con unidad: decimales fijos (n) y espacio fino */
  MC.u = (x, unit, n = 2) => MC.fix(x, n) + (unit ? ' ' + unit : '');
  MC.us = (x, unit, d = 3) => MC.sci(x, d) + (unit ? ' ' + unit : '');
  /* Prefijos SI */
  const PREF = [[-18, 'a'], [-15, 'f'], [-12, 'p'], [-9, 'n'], [-6, 'µ'], [-3, 'm'], [0, ''], [3, 'k'], [6, 'M'], [9, 'G'], [12, 'T'], [15, 'P'], [18, 'E']];
  MC.si = function (x, unit = '', d = 3) {
    if (x === null || x === undefined || Number.isNaN(x)) return '—';
    if (!isFinite(x)) return (x > 0 ? '∞' : '−∞') + (unit ? ' ' + unit : '');
    if (x === 0) return '0' + (unit ? ' ' + unit : '');
    let e3 = Math.floor(Math.log10(Math.abs(x)) / 3) * 3;
    e3 = M.clamp(e3, -18, 18);
    let m = x / Math.pow(10, e3);
    if (Math.abs(+fixedSig(m, d).replace('−', '-')) >= 1000 && e3 < 18) { e3 += 3; m = x / Math.pow(10, e3); }
    const p = PREF.find((q) => q[0] === e3)[1];
    return fixedSig(m, d) + (unit || p ? ' ' + p + unit : '');
  };
  MC.deg = (rad, n = 1) => MC.fix(M.deg(rad), n) + '°';
  /* Tiempo en formato legible */
  MC.time = function (s) {
    if (!isFinite(s)) return '—';
    const a = Math.abs(s);
    if (a < 120) return MC.sci(s, 3) + ' s';
    if (a < 7200) return MC.fix(s / 60, 1) + ' min';
    if (a < 172800) return MC.fix(s / 3600, 2) + ' h';
    if (a < 3.156e7 * 2) return MC.fix(s / 86400, 1) + ' días';
    return MC.sci(s / 3.156e7, 3) + ' años';
  };

  /* ---------- Tema y colores ---------- */
  const colCache = new Map();
  MC.col = function (name) {
    if (!name) return '#888888';
    if (name[0] !== '-') return name;
    if (!colCache.has(name)) {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      colCache.set(name, v || '#888888');
    }
    return colCache.get(name);
  };
  MC.onTheme = [];
  MC.themeChanged = function () {
    colCache.clear();
    rgbCache.clear();
    MC.onTheme.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
  };
  try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', MC.themeChanged); } catch (e) { /* navegadores antiguos */ }
  new MutationObserver(MC.themeChanged).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  MC.isDark = function () {
    const t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark') return true;
    if (t === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  };
  const rgbCache = new Map();
  MC.rgb = function (c) {
    if (c.startsWith('--')) c = MC.col(c);
    if (rgbCache.has(c)) return rgbCache.get(c);
    let r = 128, g = 128, b = 128;
    const s = c.trim();
    if (s[0] === '#') {
      let h = s.slice(1);
      if (h.length === 3) h = h.split('').map((x) => x + x).join('');
      r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
    } else {
      const m = s.match(/rgba?\(([^)]+)\)/);
      if (m) { const p = m[1].split(',').map(parseFloat); r = p[0]; g = p[1]; b = p[2]; }
    }
    const out = [r, g, b];
    rgbCache.set(c, out);
    return out;
  };
  MC.alpha = function (c, a) { const [r, g, b] = MC.rgb(c); return `rgba(${r},${g},${b},${a})`; };
  MC.mix = function (c1, c2, t) {
    const a = MC.rgb(c1), b = MC.rgb(c2);
    return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
  };
  /* f<1 oscurece, f>1 aclara */
  MC.shade = function (c, f, a = 1) {
    const [r, g, b] = MC.rgb(c);
    let R, G, B;
    if (f <= 1) { R = r * f; G = g * f; B = b * f; } else { const t = Math.min(1, f - 1); R = r + (255 - r) * t; G = g + (255 - g) * t; B = b + (255 - b) * t; }
    return `rgba(${Math.round(R)},${Math.round(G)},${Math.round(B)},${a})`;
  };
  MC.rgbStr = (a, al = 1) => `rgba(${Math.round(a[0])},${Math.round(a[1])},${Math.round(a[2])},${al})`;
  /* Rampa secuencial entre el fondo del lienzo y un color */
  MC.ramp = function (t, colorVar = '--c1') {
    const a = MC.rgb('--canvas'), e = MC.rgb(colorVar), k = M.clamp(t, 0, 1);
    return MC.rgbStr([a[0] + (e[0] - a[0]) * k, a[1] + (e[1] - a[1]) * k, a[2] + (e[2] - a[2]) * k]);
  };

  /* ---------- DOM ---------- */
  MC.el = function (tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined && html !== null) e.innerHTML = html;
    return e;
  };
  MC.reducedMotion = function () { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; };
  /* Animación breve: fn(p) con p de 0 a 1 durante dur segundos; devuelve función para cancelar */
  MC.tween = function (dur, fn, done) {
    const t0 = performance.now();
    let stop = false;
    const tick = (now) => {
      if (stop) return;
      const p = Math.min(1, (now - t0) / (dur * 1000));
      fn(p);
      if (p < 1) requestAnimationFrame(tick); else if (done) done();
    };
    requestAnimationFrame(tick);
    return () => { stop = true; };
  };
  MC.store = {
    get(k, d) { try { const v = localStorage.getItem('cuadernoMec:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('cuadernoMec:' + k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  };
  /* Redibujo general cuando cargan las fuentes web */
  try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => MC.themeChanged()); } catch (e) { /* */ }
})();
