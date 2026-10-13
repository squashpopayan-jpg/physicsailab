/* ===================================================================
   00-base.js — espacio de nombres CC, formato, colores y utilidades
   =================================================================== */
(function () {
  'use strict';
  const CC = (window.CC = window.CC || {});
  CC.sims = {};
  CC.defineSim = function (name, factory) { CC.sims[name] = factory; };

  /* ---------- Matemática escalar ---------- */
  const M = (CC.M = {
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
  });

  /* ---------- Vectores 3D (arrays [x,y,z]) ---------- */
  CC.V = {
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
      const c = Math.cos(a), s = Math.sin(a), d = CC.V.dot(k, v), x = CC.V.cross(k, v);
      return [v[0] * c + x[0] * s + k[0] * d * (1 - c), v[1] * c + x[1] * s + k[1] * d * (1 - c), v[2] * c + x[2] * s + k[2] * d * (1 - c)];
    }
  };

  /* ---------- Formato numérico ---------- */
  const SUP = { '-': '⁻', '+': '⁺', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  const minus = (s) => String(s).replace(/-/g, '−');
  CC.minus = minus;
  CC.sup = (n) => String(n).split('').map((ch) => SUP[ch] || ch).join('');
  function fixedSig(x, d) {
    if (x === 0) return '0';
    const e = Math.floor(Math.log10(Math.abs(x)));
    const dec = M.clamp(d - 1 - e, 0, 8);
    let s = x.toFixed(dec);
    if (/^-0(\.0+)?$/.test(s)) s = s.slice(1);
    return minus(s).replace('.', ',');
  }
  /* Número con d cifras significativas; notación científica fuera de [1e-3, 1e4) */
  CC.sci = function (x, d = 3) {
    if (x === null || x === undefined || Number.isNaN(x)) return '—';
    if (!isFinite(x)) return x > 0 ? '∞' : '−∞';
    if (x === 0) return '0';
    const ax = Math.abs(x);
    if (ax >= 1e-3 && ax < 1e4) return fixedSig(x, d);
    let e = Math.floor(Math.log10(ax));
    let m = +(x / Math.pow(10, e)).toFixed(d - 1);
    if (Math.abs(m) >= 10) { m /= 10; e += 1; }
    return minus(m.toFixed(d - 1)).replace('.', ',') + '×10' + CC.sup(e);
  };
  /* Decimales fijos con signo menos tipográfico */
  CC.fix = function (x, n = 2) {
    if (x === null || x === undefined || Number.isNaN(x)) return '—';
    if (!isFinite(x)) return x > 0 ? '∞' : '−∞';
    let s = x.toFixed(n);
    if (/^-0(\.0+)?$/.test(s)) s = s.slice(1);
    return minus(s).replace('.', ',');
  };
  /* Prefijos SI */
  const PREF = [[-18, 'a'], [-15, 'f'], [-12, 'p'], [-9, 'n'], [-6, 'µ'], [-3, 'm'], [0, ''], [3, 'k'], [6, 'M'], [9, 'G'], [12, 'T'], [15, 'P']];
  CC.si = function (x, unit = '', d = 3) {
    if (x === null || x === undefined || Number.isNaN(x)) return '—';
    if (!isFinite(x)) return (x > 0 ? '∞' : '−∞') + (unit ? ' ' + unit : '');
    if (x === 0) return '0' + (unit ? ' ' + unit : '');
    let e3 = Math.floor(Math.log10(Math.abs(x)) / 3) * 3;
    e3 = M.clamp(e3, -18, 15);
    let m = x / Math.pow(10, e3);
    /* Evita 1000 k por redondeo */
    if (Math.abs(+fixedSig(m, d).replace('−', '-').replace(',', '.')) >= 1000 && e3 < 15) { e3 += 3; m = x / Math.pow(10, e3); }
    const p = PREF.find((q) => q[0] === e3)[1];
    return fixedSig(m, d) + (unit || p ? ' ' + p + unit : '');
  };
  CC.deg = (rad, n = 1) => CC.fix(M.deg(rad), n) + '°';

  /* ---------- Tema y colores ---------- */
  const colCache = new Map();
  CC.col = function (name) {
    if (!colCache.has(name)) {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      colCache.set(name, v || '#888888');
    }
    return colCache.get(name);
  };
  CC.onTheme = [];
  CC.themeChanged = function () {
    colCache.clear();
    rgbCache.clear();
    CC.onTheme.forEach((f) => { try { f(); } catch (e) { console.error(e); } });
  };
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', CC.themeChanged);
  } catch (e) { /* navegadores antiguos */ }
  new MutationObserver(CC.themeChanged).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  CC.isDark = function () {
    const t = document.documentElement.getAttribute('data-theme');
    if (t === 'dark') return true;
    if (t === 'light') return false;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const rgbCache = new Map();
  CC.rgb = function (c) {
    if (c.startsWith('--')) c = CC.col(c);
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
  CC.alpha = function (c, a) {
    const [r, g, b] = CC.rgb(c);
    return `rgba(${r},${g},${b},${a})`;
  };
  CC.mix = function (c1, c2, t) {
    const a = CC.rgb(c1), b = CC.rgb(c2);
    return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
  };
  /* Sombrea un color: f<1 oscurece, f>1 aclara (hacia blanco) */
  CC.shade = function (c, f, a = 1) {
    const [r, g, b] = CC.rgb(c);
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
  CC.cmap = {
    viridis: (t) => lut(VIRIDIS, t),
    inferno: (t) => lut(INFERNO, t),
    /* Divergente: t ∈ [-1, 1]; negativo → azul, positivo → rojo, 0 → fondo del lienzo */
    diverging(t) {
      const mid = CC.rgb('--canvas');
      const pos = CC.rgb('--pos'), neg = CC.rgb('--neg');
      const s = M.clamp(Math.abs(t), 0, 1);
      const e = t >= 0 ? pos : neg;
      const k = Math.pow(s, 0.85);
      return [mid[0] + (e[0] - mid[0]) * k, mid[1] + (e[1] - mid[1]) * k, mid[2] + (e[2] - mid[2]) * k];
    },
    /* Secuencial desde el fondo hacia un color dado */
    seq(t, colorVar = '--c1') {
      const mid = CC.rgb('--canvas'), e = CC.rgb(colorVar);
      const k = M.clamp(t, 0, 1);
      return [mid[0] + (e[0] - mid[0]) * k, mid[1] + (e[1] - mid[1]) * k, mid[2] + (e[2] - mid[2]) * k];
    }
  };
  CC.rgbStr = (a, al = 1) => `rgba(${Math.round(a[0])},${Math.round(a[1])},${Math.round(a[2])},${al})`;

  /* ---------- DOM ---------- */
  CC.el = function (tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html !== undefined && html !== null) e.innerHTML = html;
    return e;
  };
  CC.reducedMotion = function () {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };
  CC.store = {
    get(k, d) { try { const v = localStorage.getItem('cuentasClaras:' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('cuentasClaras:' + k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } }
  };
})();
