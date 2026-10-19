/* 37-diag.js — Diagramas de propiedades de fluidos reales (domo, isóbaras, isotermas)
   Claves de ejes: 'v' (m³/kg), 'P' (kPa), 'T' (°C), 'h' (kJ/kg), 's' (kJ/kg·K), 'u' (kJ/kg) */
(function () {
  'use strict';
  const EM = window.EM;
  const D = (EM.diag = {});
  const cache = new Map();
  /* valor de un estado (objeto con T K, P Pa, v, h J/kg, s J/kg·K) en las unidades del eje */
  D.val = function (st, k) {
    switch (k) {
      case 'v': return st.v;
      case 'P': return st.P / 1e3;
      case 'T': return st.T - 273.15;
      case 'h': return st.h / 1e3;
      case 's': return st.s / 1e3;
      case 'u': return st.u / 1e3;
    }
    return NaN;
  };
  D.dome = function (F) {
    if (cache.has(F)) return cache.get(F);
    const raw = F.domo(140);
    const f = raw.map((s) => ({ T: s.T, P: s.P, v: s.vf, h: s.hf, s: s.sf, u: s.uf }));
    const g = raw.map((s) => ({ T: s.T, P: s.P, v: s.vg, h: s.hg, s: s.sg, u: s.ug }));
    const out = { f, g, all: f.concat(g.slice().reverse()) };
    cache.set(F, out);
    return out;
  };
  /* dibuja el domo en un Plot */
  D.drawDome = function (pl, F, xk, yk, o = {}) {
    const d = D.dome(F);
    pl.path(d.all.map((s) => [D.val(s, xk), D.val(s, yk)]), { color: o.color || '--ink-2', width: o.width || 2, fill: o.fill ? '--c1' : null, fillAlpha: 0.06, base: o.base });
    const c = d.f[d.f.length - 1];
    if (o.crit !== false) pl.dot(D.val(c, xk), D.val(c, yk), { color: '--ink-2', r: 3.5, label: o.critLabel === undefined ? 'punto crítico' : o.critLabel });
  };
  /* estados a lo largo de una isóbara P (Pa), de Tmin a Tmax (K) */
  D.isobar = function (F, P, Tmin, Tmax, n = 60) {
    const out = [];
    if (P < F.Pc) {
      const Ts = F.Tsat(P);
      for (let i = 0; i <= n / 3; i++) { const T = Tmin + ((Ts - Tmin) * i) / (n / 3); if (T < Ts) out.push(F.state(P, { T })); }
      for (let i = 0; i <= 12; i++) out.push(F.state(P, { x: i / 12 }));
      for (let i = 1; i <= n; i++) { const T = Ts + (Tmax - Ts) * Math.pow(i / n, 1.5); out.push(F.sup(P, T)); }
    } else {
      for (let i = 0; i <= n; i++) { const T = Tmin + ((Tmax - Tmin) * i) / n; out.push(F.sup(Math.min(P, F.Pmax), Math.max(T, F.Tsat(Math.min(P, F.Pmax)) + 0.01))); }
    }
    return out;
  };
  /* estados a lo largo de una isoterma T (K), de Pmin a Pmax (Pa) */
  D.isotherm = function (F, T, Pmin, Pmax, n = 60) {
    const out = [];
    const lp = (i, a, b) => Math.exp(Math.log(a) + ((Math.log(b) - Math.log(a)) * i) / n);
    if (T < F.Tc) {
      const Ps = F.Psat(T);
      for (let i = 0; i <= n; i++) { const P = lp(i, Pmin, Ps); if (P < Ps * 0.9999) out.push(F.sup(P, T)); }
      const s = F.sat(T);
      for (let i = 12; i >= 0; i--) { const x = i / 12; out.push({ T, P: s.P, v: s.vf + x * (s.vg - s.vf), h: s.hf + x * s.hfg, s: s.sf + x * s.sfg }); }
      for (let i = 1; i <= 10; i++) { const P = Ps + ((Math.min(Pmax, F.Pmax) - Ps) * i) / 10; out.push(F.state(P, { T })); }
    } else {
      for (let i = 0; i <= n; i++) out.push(F.sup(lp(i, Pmin, Math.min(Pmax, F.Pmax)), T));
    }
    return out;
  };
  D.line = (pl, sts, xk, yk, st) => pl.path(sts.map((s) => [D.val(s, xk), D.val(s, yk)]), st);
})();
