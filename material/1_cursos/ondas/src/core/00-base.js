/* ===================================================================
   00-base.js — espacio de nombres EM, constantes, utilidades
   =================================================================== */
(function () {
  'use strict';
  const EM = (window.EM = window.EM || {});
  EM.sims = {};
  EM.defineSim = function (name, factory) { EM.sims[name] = factory; };

  /* Constantes físicas (CODATA 2018, SI) */
  EM.K = {
    e: 1.602176634e-19,
    me: 9.1093837015e-31,
    mp: 1.67262192369e-27,
    u: 1.66053906660e-27,
    eps0: 8.8541878128e-12,
    mu0: 1.25663706212e-6,
    c: 299792458,
    k: 8.9875517923e9,
    h: 6.62607015e-34,
    hbar: 1.054571817e-34,
    kB: 1.380649e-23,
    NA: 6.02214076e23,
    eta0: 376.730313668,
    muB: 9.2740100783e-24
  };

  /* ---------- Matemática escalar ---------- */
  const M = (EM.M = {
    PI: Math.PI,
    TAU: 2 * Math.PI,
    clamp: (x, a, b) => Math.min(b, Math.max(a, x)),
    lerp: (a, b, t) => a + (b - a) * t,
    rad: (d) => (d * Math.PI) / 180,
    deg: (r) => (r * 180) / Math.PI,
    sq: (x) => x * x,
    linspace(a, b, n) {
      const out = new Array(n);
      for (let i = 0; i < n; i++) out[i] = n === 1 ? a : a + ((b - a) * i) / (n - 1);
      return out;
    },
    /* atan2 en [0, 2π) */
    atan2p(y, x) {
      let a = Math.atan2(y, x);
      if (a < 0) a += 2 * Math.PI;
      return a;
    },
    wrap2pi(a) {
      a = a % (2 * Math.PI);
      return a < 0 ? a + 2 * Math.PI : a;
    },
    /* Integral de Simpson compuesta de f en [a,b] con n (par) subintervalos */
    simpson(f, a, b, n = 200) {
      if (n % 2) n++;
      const h = (b - a) / n;
      let s = f(a) + f(b);
      for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * f(a + i * h);
      return (s * h) / 3;
    },
    /* Integrales elípticas completas K(m), E(m) con m = k² (media aritmético-geométrica) */
    ellipKE(m) {
      if (m >= 1) return [Infinity, 1];
      let a = 1, b = Math.sqrt(1 - m), c = Math.sqrt(m);
      let sum = 0.5 * c * c, pow = 0.5;
      for (let i = 0; i < 30 && Math.abs(c) > 1e-15; i++) {
        const an = (a + b) / 2, bn = Math.sqrt(a * b);
        c = (a - b) / 2;
        pow *= 2;
        sum += pow * c * c;
        a = an; b = bn;
      }
      const K = Math.PI / (2 * a);
      return [K, K * (1 - sum)];
    },
    /* Raíz por bisección */
    bisect(f, a, b, tol = 1e-12, it = 200) {
      let fa = f(a);
      for (let i = 0; i < it; i++) {
        const m = 0.5 * (a + b), fm = f(m);
        if (fa * fm <= 0) b = m; else { a = m; fa = fm; }
        if (Math.abs(b - a) < tol) break;
      }
      return 0.5 * (a + b);
    },
    /* Funciones de Bessel J0, J1 (series/asintótica, suficientes para gráficas) */
    besselJ(n, x) {
      if (Math.abs(x) < 12) {
        let sum = 0, term = Math.pow(x / 2, n);
        for (let k = 1; k <= n; k++) term /= k;
        for (let k = 0; k < 60; k++) {
          sum += term;
          term *= -(x * x) / 4 / ((k + 1) * (k + 1 + n));
        }
        return sum;
      }
      return Math.sqrt(2 / (Math.PI * x)) * Math.cos(x - (n * Math.PI) / 2 - Math.PI / 4);
    }
  });

  /* ---------- Vectores 3D (arrays [x,y,z]) ---------- */
  EM.V = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    scale: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    norm: (a) => Math.hypot(a[0], a[1], a[2]),
    unit(a) {
      const n = Math.hypot(a[0], a[1], a[2]);
      return n > 0 ? [a[0] / n, a[1] / n, a[2] / n] : [0, 0, 0];
    },
    lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
    neg: (a) => [-a[0], -a[1], -a[2]],
    comb(...args) {
      /* comb(s1, v1, s2, v2, ...) = s1 v1 + s2 v2 + ... */
      const r = [0, 0, 0];
      for (let i = 0; i < args.length; i += 2) {
        r[0] += args[i] * args[i + 1][0];
        r[1] += args[i] * args[i + 1][1];
        r[2] += args[i] * args[i + 1][2];
      }
      return r;
    },
    /* Rota v alrededor del eje unitario k un ángulo a (Rodrigues) */
    rot(v, k, a) {
      const c = Math.cos(a), s = Math.sin(a), d = EM.V.dot(k, v), x = EM.V.cross(k, v);
      return [v[0] * c + x[0] * s + k[0] * d * (1 - c), v[1] * c + x[1] * s + k[1] * d * (1 - c), v[2] * c + x[2] * s + k[2] * d * (1 - c)];
    }
  };

  /* ---------- Sistemas de coordenadas ---------- */
  EM.coords = {
    cyl2cart: (rho, phi, z) => [rho * Math.cos(phi), rho * Math.sin(phi), z],
    sph2cart: (r, th, phi) => [r * Math.sin(th) * Math.cos(phi), r * Math.sin(th) * Math.sin(phi), r * Math.cos(th)],
    cart2cyl: (x, y, z) => [Math.hypot(x, y), M.atan2p(y, x), z],
    cart2sph(x, y, z) {
      const r = Math.hypot(x, y, z);
      return [r, r > 0 ? Math.acos(M.clamp(z / r, -1, 1)) : 0, M.atan2p(y, x)];
    },
    /* Bases locales expresadas en cartesianas */
    cylBasis(phi) {
      const c = Math.cos(phi), s = Math.sin(phi);
      return { rho: [c, s, 0], phi: [-s, c, 0], z: [0, 0, 1] };
    },
    sphBasis(th, phi) {
      const ct = Math.cos(th), st = Math.sin(th), cp = Math.cos(phi), sp = Math.sin(phi);
      return { r: [st * cp, st * sp, ct], th: [ct * cp, ct * sp, -st], phi: [-sp, cp, 0] };
    }
  };

  /* ---------- Formato numérico ---------- */
  const SUP = { '-': '⁻', '+': '⁺', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const minus = (s) => String(s).replace(/-/g, '−');
  EM.minus = minus;
  EM.sup = (n) => String(n).split('').map((ch) => SUP[ch] || ch).join('');
  function fixedSig(x, d) {
    if (x === 0) return '0';
    const e = Math.floor(Math.log10(Math.abs(x)));
    const dec = M.clamp(d - 1 - e, 0, 8);
    let s = x.toFixed(dec);
    if (/^-0(\.0+)?$/.test(s)) s = s.slice(1);
    return minus(s);
  }
  /* Número con d cifras significativas; notación científica fuera de [1e-3, 1e4) */
  EM.sci = function (x, d = 3) {
    if (x === null || x === undefined || Number.isNaN(x)) return '—';
    if (!isFinite(x)) return x > 0 ? '∞' : '−∞';
    if (x === 0) return '0';
    const ax = Math.abs(x);
    if (ax >= 1e-3 && ax < 1e4) return fixedSig(x, d);
    let e = Math.floor(Math.log10(ax));
    let m = +(x / Math.pow(10, e)).toFixed(d - 1);
    if (Math.abs(m) >= 10) { m /= 10; e += 1; }
    return minus(m.toFixed(d - 1)) + '×10' + EM.sup(e);
  };
  /* Decimales fijos con signo menos tipográfico */
  EM.fix = function (x, n = 2) {
    if (x === null || x === undefined || Number.isNaN(x)) return '—';
    if (!isFinite(x)) return x > 0 ? '∞' : '−∞';
    let s = x.toFixed(n);
    if (/^-0(\.0+)?$/.test(s)) s = s.slice(1);
    return minus(s);
  };
  /* Prefijos SI */
  const PREF = [[-18, 'a'], [-15, 'f'], [-12, 'p'], [-9, 'n'], [-6, 'µ'], [-3, 'm'], [0, ''], [3, 'k'], [6, 'M'], [9, 'G'], [12, 'T'], [15, 'P']];
  EM.si = function (x, unit = '', d = 3) {
    if (x === null || x === undefined || Number.isNaN(x)) return '—';
    if (!isFinite(x)) return (x > 0 ? '∞' : '−∞') + (unit ? ' ' + unit : '');
    if (x === 0) return '0' + (unit ? ' ' + unit : '');
    let e3 = Math.floor(Math.log10(Math.abs(x)) / 3) * 3;
    e3 = M.clamp(e3, -18, 15);
    let m = x / Math.pow(10, e3);
    /* Evita 1000 k por redondeo */
    if (Math.abs(+fixedSig(m, d).replace('−', '-')) >= 1000 && e3 < 15) { e3 += 3; m = x / Math.pow(10, e3); }
    const p = PREF.find((q) => q[0] === e3)[1];
    return fixedSig(m, d) + (unit || p ? ' ' + p + unit : '');
  };
  EM.deg = (rad, n = 1) => EM.fix(M.deg(rad), n) + '°';

  /* ---------- Tema y colores ---------- */
  const colCache = new Map();
  EM.col = function (name) {
    if (!colCache.has(name)) {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      colCache.set(name, v || '#888888');
    }
    return colCache.get(name);
  };
  EM.onTheme = [];
  EM.themeChanged = function () {
    colCache.clear();
    rgbCache.clear();
    EM.onTheme.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
  };
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', EM.themeChanged);
  } catch (e) { /* navegadores antiguos */ }
  new MutationObserver(EM.themeChanged).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  EM.isDark = function () {
    const t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark') return true;
    if (t === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const rgbCache = new Map();
  EM.rgb = function (c) {
    if (c.startsWith('--')) c = EM.col(c);
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
  EM.alpha = function (c, a) {
    const [r, g, b] = EM.rgb(c);
    return `rgba(${r},${g},${b},${a})`;
  };
  EM.mix = function (c1, c2, t) {
    const a = EM.rgb(c1), b = EM.rgb(c2);
    return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
  };
  /* Sombrea un color: f<1 oscurece, f>1 aclara (hacia blanco) */
  EM.shade = function (c, f, a = 1) {
    const [r, g, b] = EM.rgb(c);
    let R, G, B;
    if (f <= 1) { R = r * f; G = g * f; B = b * f; } else { const t = Math.min(1, f - 1); R = r + (255 - r) * t; G = g + (255 - g) * t; B = b + (255 - b) * t; }
    return `rgba(${Math.round(R)},${Math.round(G)},${Math.round(B)},${a})`;
  };

  /* Mapas de color */
  const VIRIDIS = [[68, 1, 84], [72, 40, 120], [62, 73, 137], [49, 104, 142], [38, 130, 142], [31, 158, 137], [53, 183, 121], [109, 205, 89], [180, 222, 44], [253, 231, 37]];
  const INFERNO = [[0, 0, 4], [31, 12, 72], [85, 15, 109], [136, 34, 106], [186, 54, 85], [227, 89, 51], [249, 140, 10], [249, 201, 50], [252, 255, 164]];
  function lut(stops, t) {
    t = M.clamp(t, 0, 1) * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(t)), f = t - i;
    const a = stops[i], b = stops[i + 1];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  }
  EM.cmap = {
    viridis: (t) => lut(VIRIDIS, t),
    inferno: (t) => lut(INFERNO, t),
    /* Divergente: t ∈ [-1, 1]; negativo → azul, positivo → rojo, 0 → fondo del lienzo */
    diverging(t) {
      const mid = EM.rgb('--canvas');
      const pos = EM.rgb('--pos'), neg = EM.rgb('--neg');
      const s = M.clamp(Math.abs(t), 0, 1);
      const e = t >= 0 ? pos : neg;
      const k = Math.pow(s, 0.85);
      return [mid[0] + (e[0] - mid[0]) * k, mid[1] + (e[1] - mid[1]) * k, mid[2] + (e[2] - mid[2]) * k];
    },
    /* Secuencial desde el fondo hacia un color dado */
    seq(t, colorVar = '--c1') {
      const mid = EM.rgb('--canvas'), e = EM.rgb(colorVar);
      const k = M.clamp(t, 0, 1);
      return [mid[0] + (e[0] - mid[0]) * k, mid[1] + (e[1] - mid[1]) * k, mid[2] + (e[2] - mid[2]) * k];
    }
  };
  EM.rgbStr = (a, al = 1) => `rgba(${Math.round(a[0])},${Math.round(a[1])},${Math.round(a[2])},${al})`;

  /* Longitud de onda visible (nm) → color RGB aproximado */
  EM.wavelengthRGB = function (nm) {
    let r = 0, g = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; }
    else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
    else if (nm <= 780) { r = 1; }
    let f = 0;
    if (nm >= 380 && nm < 420) f = 0.3 + (0.7 * (nm - 380)) / 40;
    else if (nm >= 420 && nm <= 700) f = 1;
    else if (nm > 700 && nm <= 780) f = 0.3 + (0.7 * (780 - nm)) / 80;
    const g8 = (v) => Math.round(255 * Math.pow(v * f, 0.8));
    return [g8(r), g8(g), g8(b)];
  };

  /* ---------- DOM ---------- */
  EM.el = function (tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined && html !== null) e.innerHTML = html;
    return e;
  };
  EM.reducedMotion = function () {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };
  EM.store = {
    get(k, d) { try { const v = localStorage.getItem('vyo:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('vyo:' + k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  };
})();
