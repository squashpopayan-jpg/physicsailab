/* Motor físico del banco de transformadores.
   Resuelve el circuito completo (fuente, devanados acoplados por un núcleo saturable, cargas e
   instrumentos) por análisis nodal modificado con fasores. El núcleo entra como una ecuación de
   fuerza magnetomotriz con incógnita e = dΦ/dt (voltios por espira); la saturación se resuelve con
   la permeancia de función descriptiva y los armónicos 3, 5 y 7 se inyectan como fuentes de FMM. */
(function (root) {
  'use strict';
  const MU0 = 4e-7 * Math.PI, TAU = 2 * Math.PI, SQ2 = Math.SQRT2;
  const HARM = [3, 5, 7];

  /* ---------- Equipo del laboratorio (ajustable por el docente) ---------- */
  const KIT = {
    f: 60,
    supply: { vmax: 24, r: 0.25, l: 0.4e-3, rOff: 0.6, fuseA: 3.15, tau: 3, rated: 3,
      // distorsión típica de la red (fasores relativos a la fundamental, referencia coseno)
      harm: { 3: [-0.008, 0], 5: [-0.018, 0], 7: [0.005, 0] } },
    core: { A: 4.0e-4, l: 0.24, mass: 0.73, mur: 4000, Bk: 1.35, Hk: 400, m: 12, cFe: 3.0, beta: 1.8,
      gap: { apretado: 0.10e-3, flojo: 1.0e-3, retirado: 6.6e-3 },
      leak: { apretado: 1.5e-8, flojo: 2.0e-8, retirado: 5.0e-8 } },
    coils: [
      { id: 'c100', N: 100, R: 0.10, Imax: 10, body: '#3d4147', label: '100' },
      { id: 'c250', N: 250, R: 0.60, Imax: 4, body: '#2f7a4f', label: '250' },
      { id: 'c500', N: 500, R: 2.40, Imax: 2, body: '#2d5fa8', label: '500' },
      { id: 'c1000', N: 1000, R: 9.60, Imax: 1, body: '#b23a32', label: '1000' },
      { id: 'cX', N: null, R: null, Imax: null, body: '#e9e4d8', label: 'X' }
    ],
    loads: [4.7, 10, 22, 33, 47, 68, 100, 220, 470, 1000],
    loadW: 10, loadRth: 20, loadTau: 25, loadTc: 2e-4,
    shunt: { R: 1.0, W: 5, Rth: 30, tau: 20 },
    coilTau: 90, alphaCu: 0.00393, Tamb: 22,
    dmm: {
      zin: 10e6, rMa: 1.2, rA: 0.012, fuseMa: 0.63, fuseA: 10, tauMa: 0.4, tauA: 2, itest: 1e-3, lead: 0.2,
      modes: {
        'V~': { acc: [1.0, 3], ranges: [[6, 0.001, 'V'], [60, 0.01, 'V'], [600, 0.1, 'V'], [750, 1, 'V']] },
        'V⎓': { acc: [0.5, 2], ranges: [[0.6, 0.0001, 'mV'], [6, 0.001, 'V'], [60, 0.01, 'V'], [600, 0.1, 'V']] },
        'mA~': { acc: [1.5, 3], ranges: [[0.06, 0.00001, 'mA'], [0.6, 0.0001, 'mA']] },
        'mA⎓': { acc: [1.0, 2], ranges: [[0.06, 0.00001, 'mA'], [0.6, 0.0001, 'mA']] },
        'A~': { acc: [2.0, 5], ranges: [[6, 0.001, 'A'], [10, 0.01, 'A']] },
        'A⎓': { acc: [1.5, 3], ranges: [[6, 0.001, 'A'], [10, 0.01, 'A']] },
        'Ω': { acc: [0.8, 3], ranges: [[600, 0.1, 'Ω'], [6e3, 1, 'kΩ'], [6e4, 10, 'kΩ'], [6e5, 100, 'kΩ'], [6e6, 1e3, 'MΩ'], [6e7, 1e4, 'MΩ']] }
      }
    },
    wm: { ri: 0.02, zv: 2e6, accV: [1.0, 2], accI: [1.0, 3], accP: [1.5, 3], imax: 5 },
    scope: { zin: 1e6, gnd: 0.02 },
    gmin: 1e-9,
    selv: 50
  };

  /* ---------- Generador pseudoaleatorio con semilla (variación por banco) ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  /* Cada banco tiene un equipo ligeramente distinto, como en un laboratorio real:
     tolerancias de fabricación, juntas del núcleo, calibración de instrumentos y una bobina sin rótulo. */
  function benchVariant(bench) {
    const rnd = mulberry32(9173 + 7919 * (bench | 0));
    const u = (a) => (2 * rnd() - 1) * a;
    const nxList = [300, 350, 400, 450, 600, 700, 750, 800];
    const Nx = nxList[Math.floor(rnd() * nxList.length)];
    const v = {
      bench, Nx,
      coilR: {}, murF: 1 + u(0.10), gapF: 1 + u(0.20), leakF: 1 + u(0.10),
      dialErr: u(0.03), panelErr: u(0.02), shuntErr: u(0.008),
      loadErr: KIT.loads.map(() => u(0.02)),
      dmm: [0, 1, 2].map(() => ({ gain: {}, off: Math.round(u(1.4)) })),
      wm: { gV: u(0.005), gI: u(0.005), gP: u(0.007) }
    };
    for (const c of KIT.coils) v.coilR[c.id] = 1 + u(0.03);
    for (const d of v.dmm) for (const m of Object.keys(KIT.dmm.modes)) d.gain[m] = u(KIT.dmm.modes[m].acc[0] / 100 * 0.5);
    return v;
  }
  function coilSpec(id, variant) {
    const c = KIT.coils.find(x => x.id === id);
    if (!c) return null;
    const f = variant ? variant.coilR[id] : 1;
    if (id === 'cX') {
      const N = variant ? variant.Nx : 600;
      return { ...c, N, R: 0.6 * (N / 250) ** 2 * f, Imax: Math.round(1000 / N * 100) / 100 };
    }
    return { ...c, R: c.R * f };
  }
  function coreParams(yoke, variant) {
    const k = KIT.core, v = variant || { murF: 1, gapF: 1, leakF: 1 };
    return { A: k.A, l: k.l, mass: k.mass, mur: k.mur * v.murF, Bk: k.Bk, Hk: k.Hk, m: k.m, cFe: k.cFe, beta: k.beta,
      gap: k.gap[yoke] * (yoke === 'retirado' ? 1 : v.gapF), leak: k.leak[yoke] * v.leakF, yoke };
  }

  /* ---------- Magnetismo del núcleo ---------- */
  function permeanceLin(core) { return 1 / (core.l / (MU0 * core.mur * core.A) + core.gap / (MU0 * core.A)); }
  function Hfe(core, B) { const s = Math.sign(B), b = Math.abs(B); return B / (MU0 * core.mur) + s * core.Hk * Math.pow(b / core.Bk, core.m); }
  const NS = 64, COS = [], COSH = {};
  for (let k = 0; k < NS; k++) COS.push(Math.cos(TAU * k / NS));
  for (const h of HARM) { COSH[h] = []; for (let k = 0; k < NS; k++) COSH[h].push(Math.cos(TAU * h * k / NS)); }
  /* Permeancia de la componente fundamental y amplitudes armónicas de la FMM (A·vuelta, pico)
     cuando el flujo es sinusoidal con densidad pico Bpk. */
  function describe(core, Bpk) {
    const Plin = permeanceLin(core);
    if (Bpk < 1e-6) return { P: Plin, a: { 3: 0, 5: 0, 7: 0 } };
    let a1 = 0; const a = { 3: 0, 5: 0, 7: 0 };
    for (let k = 0; k < NS; k++) {
      const B = Bpk * COS[k];
      const F = Hfe(core, B) * core.l + B * core.gap / MU0;
      a1 += F * COS[k];
      for (const h of HARM) a[h] += F * COSH[h][k];
    }
    a1 *= 2 / NS; for (const h of HARM) a[h] *= 2 / NS;
    return { P: Bpk * core.A / a1, a };
  }
  function coreLoss(core, Bpk, f) { return core.mass * core.cFe * Math.pow(f / 60, 1.3) * Math.pow(Math.max(Bpk, 0.005), core.beta); }
  function gcOf(core, Bpk, f) { const B = Math.max(Bpk, 0.005), w = TAU * f, erms = B * w * core.A / SQ2; return coreLoss(core, B, f) / (erms * erms); }

  /* ---------- Álgebra compleja mínima ---------- */
  const cabs = a => Math.hypot(a[0], a[1]);
  const carg = a => Math.atan2(a[1], a[0]);
  const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  const csub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const cadd = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const cconj = a => [a[0], -a[1]];
  const cpolar = (r, t) => [r * Math.cos(t), r * Math.sin(t)];

  /* Eliminación gaussiana compleja con pivoteo parcial (matrices densas pequeñas). */
  function gauss(n, Ar, Ai, br, bi) {
    for (let k = 0; k < n; k++) {
      let p = k, best = -1;
      for (let i = k; i < n; i++) { const v = Ar[i * n + k] ** 2 + Ai[i * n + k] ** 2; if (v > best) { best = v; p = i; } }
      if (!(best > 1e-280)) throw new Error('Sistema singular');
      if (p !== k) {
        for (let j = 0; j < n; j++) {
          let t = Ar[k * n + j]; Ar[k * n + j] = Ar[p * n + j]; Ar[p * n + j] = t;
          t = Ai[k * n + j]; Ai[k * n + j] = Ai[p * n + j]; Ai[p * n + j] = t;
        }
        let t = br[k]; br[k] = br[p]; br[p] = t; t = bi[k]; bi[k] = bi[p]; bi[p] = t;
      }
      const pr = Ar[k * n + k], pi = Ai[k * n + k], pd = pr * pr + pi * pi;
      for (let i = k + 1; i < n; i++) {
        const xr = Ar[i * n + k], xi = Ai[i * n + k];
        if (xr === 0 && xi === 0) continue;
        const fr = (xr * pr + xi * pi) / pd, fi = (xi * pr - xr * pi) / pd;
        for (let j = k; j < n; j++) {
          const ar = Ar[k * n + j], ai = Ai[k * n + j];
          if (ar === 0 && ai === 0) continue;
          Ar[i * n + j] -= fr * ar - fi * ai; Ai[i * n + j] -= fr * ai + fi * ar;
        }
        br[i] -= fr * br[k] - fi * bi[k]; bi[i] -= fr * bi[k] + fi * br[k];
      }
    }
    const xr = new Float64Array(n), xi = new Float64Array(n);
    for (let i = n - 1; i >= 0; i--) {
      let sr = br[i], si = bi[i];
      for (let j = i + 1; j < n; j++) { const ar = Ar[i * n + j], ai = Ai[i * n + j]; sr -= ar * xr[j] - ai * xi[j]; si -= ar * xi[j] + ai * xr[j]; }
      const dr = Ar[i * n + i], di = Ai[i * n + i], d = dr * dr + di * di;
      xr[i] = (sr * dr + si * di) / d; xi[i] = (si * dr - sr * di) / d;
    }
    return [xr, xi];
  }

  /* ---------- Ensamblado del sistema nodal modificado ----------
     circuito = { nNets, f, elems:[{k:'R',a,b,R} | {k:'V',a,b,E,r,l,harm} | {k:'I',a,b,I}],
                  windings:[{a,b,N,R,Ls}], core }   (red 0 = tierra) */
  function assemble(c, h) {
    const w = TAU * c.f * h, nN = c.nNets - 1, nW = c.windings.length, hasCore = !!(c.core && nW);
    const n = nN + nW + (hasCore ? 1 : 0), ie = n - 1;
    const Ar = new Float64Array(n * n), Ai = new Float64Array(n * n), br = new Float64Array(n), bi = new Float64Array(n);
    const addY = (a, b, yr, yi) => {
      const p = a - 1, q = b - 1;
      if (p >= 0) { Ar[p * n + p] += yr; Ai[p * n + p] += yi; }
      if (q >= 0) { Ar[q * n + q] += yr; Ai[q * n + q] += yi; }
      if (p >= 0 && q >= 0) { Ar[p * n + q] -= yr; Ai[p * n + q] -= yi; Ar[q * n + p] -= yr; Ai[q * n + p] -= yi; }
    };
    const inject = (a, b, J) => { if (a > 0) { br[a - 1] += J[0]; bi[a - 1] += J[1]; } if (b > 0) { br[b - 1] -= J[0]; bi[b - 1] -= J[1]; } };
    for (let i = 0; i < nN; i++) Ar[i * n + i] += KIT.gmin;
    for (const e of c.elems) {
      if (e.a === e.b) continue;
      if (e.k === 'R') addY(e.a, e.b, 1 / Math.max(e.R, 1e-6), 0);
      else if (e.k === 'V') {
        const y = cdiv([1, 0], [Math.max(e.r, 1e-6), w * (e.l || 0)]);
        addY(e.a, e.b, y[0], y[1]);
        let E = [0, 0];
        if (h === 1) E = e.E; else if (h > 1 && e.harm && e.harm[h]) E = cmul(e.E, e.harm[h]);
        if (E[0] || E[1]) inject(e.a, e.b, cmul(E, y));
      } else if (e.k === 'I' && h === 0) inject(e.a, e.b, [e.I, 0]);
    }
    c.windings.forEach((wd, k) => {
      const iw = nN + k, a = wd.a - 1, b = wd.b - 1;
      if (a >= 0) { Ar[a * n + iw] += 1; Ar[iw * n + a] += 1; }
      if (b >= 0) { Ar[b * n + iw] -= 1; Ar[iw * n + b] -= 1; }
      Ar[iw * n + iw] -= wd.R; Ai[iw * n + iw] -= w * wd.Ls;
      if (hasCore) { Ar[iw * n + ie] -= wd.N; if (h !== 0) Ar[ie * n + iw] += wd.N; }
    });
    if (hasCore && h === 0) Ar[ie * n + ie] = 1;
    return { n, nN, nW, ie, hasCore, w, Ar, Ai, br, bi };
  }
  function run(sys, Ym, M) {
    const Ar = sys.Ar.slice(), Ai = sys.Ai.slice(), br = sys.br.slice(), bi = sys.bi.slice();
    if (sys.hasCore && Ym) { Ar[sys.ie * sys.n + sys.ie] -= Ym[0]; Ai[sys.ie * sys.n + sys.ie] -= Ym[1]; if (M) { br[sys.ie] += M[0]; bi[sys.ie] += M[1]; } }
    const [xr, xi] = gauss(sys.n, Ar, Ai, br, bi);
    const V = [[0, 0]];
    for (let i = 0; i < sys.nN; i++) V.push([xr[i], xi[i]]);
    const Iw = [];
    for (let k = 0; k < sys.nW; k++) Iw.push([xr[sys.nN + k], xi[sys.nN + k]]);
    return { V, Iw, e: sys.hasCore ? [xr[sys.ie], xi[sys.ie]] : [0, 0] };
  }

  /* Solución completa: fundamental con saturación + armónicos 3, 5 y 7. */
  function solve(c) {
    const out = { f: c.f, sol: {}, B: 0, P: null, Gc: 0, Pfe: 0, sat: 0 };
    const s1 = assemble(c, 1);
    if (!s1.hasCore) {
      out.sol[1] = run(s1);
      for (const h of HARM) out.sol[h] = run(assemble(c, h));
      return out;
    }
    const core = c.core, Plin = permeanceLin(core), w = s1.w, A = core.A;
    const Bof = x => SQ2 * cabs(x.e) / (w * A);
    const at = (P, Gc) => run(s1, [Gc, -1 / (w * P)]);
    let Gc = gcOf(core, 0.3, c.f), P = Plin, x, B;
    for (let outer = 0; outer < 4; outer++) {
      x = at(Plin, Gc); B = Bof(x);
      if (describe(core, B).P >= 0.9995 * Plin) P = Plin;
      else {
        let lo = Math.log(Plin * 1e-5), hi = Math.log(Plin);
        for (let it = 0; it < 48 && hi - lo > 2e-6; it++) {
          const mid = 0.5 * (lo + hi), xm = at(Math.exp(mid), Gc);
          if (mid > Math.log(describe(core, Bof(xm)).P)) hi = mid; else lo = mid;
        }
        P = Math.exp(0.5 * (lo + hi)); x = at(P, Gc); B = Bof(x);
      }
      const g = gcOf(core, B, c.f);
      const done = Math.abs(g - Gc) < 1e-4 * Gc; Gc = g;
      if (done) break;
    }
    x = at(P, Gc); B = Bof(x);
    out.sol[1] = x; out.B = B; out.P = P; out.Plin = Plin; out.Gc = Gc; out.Pfe = coreLoss(core, B, c.f); out.sat = 1 - P / Plin;
    const d = describe(core, B), argPhi = carg(x.e) - Math.PI / 2;
    for (const h of HARM) {
      const sh = assemble(c, h), M = cpolar(d.a[h] / SQ2, h * argPhi);
      out.sol[h] = run(sh, [Gc, -1 / (h * w * P)], M);
    }
    return out;
  }
  function solveDC(c) { return run(assemble(c, 0)); }

  /* ---------- Lectura de magnitudes de una solución ---------- */
  const HS = [1, 3, 5, 7];
  function vph(res, a, b, h) { const s = res.sol[h]; return csub(s.V[a] || [0, 0], s.V[b] || [0, 0]); }
  function rmsOf(phs) { let s = 0; for (const p of phs) s += p[0] * p[0] + p[1] * p[1]; return Math.sqrt(s); }
  function vrms(res, a, b) { return rmsOf(HS.map(h => vph(res, a, b, h))); }
  /* corriente de a hacia b por un elemento resistivo */
  function iR(res, e, h) { const v = vph(res, e.a, e.b, h); return [v[0] / e.R, v[1] / e.R]; }
  function irmsR(res, e) { return rmsOf(HS.map(h => iR(res, e, h))); }
  /* corriente que sale por el borne a de una fuente de Thévenin */
  function iV(res, e, f, h) {
    const w = TAU * f * h, z = [Math.max(e.r, 1e-6), w * (e.l || 0)];
    let E = [0, 0];
    if (h === 1) E = e.E; else if (e.harm && e.harm[h]) E = cmul(e.E, e.harm[h]);
    return cdiv(csub(E, vph(res, e.a, e.b, h)), z);
  }
  function irmsV(res, e, f) { return rmsOf(HS.map(h => iV(res, e, f, h))); }
  function iW(res, k, h) { return res.sol[h].Iw[k]; }
  function irmsW(res, k) { return rmsOf(HS.map(h => iW(res, k, h))); }
  function power(vs, is) { let p = 0; for (let i = 0; i < vs.length; i++) p += vs[i][0] * is[i][0] + vs[i][1] * is[i][1]; return p; }
  function waveAt(phs, f, t) { let s = 0; HS.forEach((h, i) => { const p = phs[i]; const th = TAU * f * h * t; s += SQ2 * (p[0] * Math.cos(th) - p[1] * Math.sin(th)); }); return s; }

  /* ---------- Instrumentos ---------- */
  function gauss01(rnd) { let u = 0, v = 0; while (u === 0) u = rnd(); v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); }
  function pickRange(ranges, x) {
    const ax = Math.abs(x);
    for (const r of ranges) if (ax < r[0] * 0.99985) return r;
    return null;
  }
  /* Valor mostrado por un multímetro: autorrango, ganancia y offset de calibración, ruido del último dígito. */
  function dmmRead(mode, x, cal, rnd) {
    const spec = KIT.dmm.modes[mode];
    if (!spec) return null;
    let val = x * (1 + (cal ? cal.gain[mode] || 0 : 0));
    let r = pickRange(spec.ranges, val);
    if (!r) return { ol: true, mode, range: spec.ranges[spec.ranges.length - 1] };
    val += ((cal ? cal.off : 0) + 0.55 * gauss01(rnd)) * r[1];
    r = pickRange(spec.ranges, val) || r;
    let q = Math.round(val / r[1]) * r[1];
    if (mode.endsWith('~') || mode === 'Ω') q = Math.abs(q);
    const a = spec.acc[0] / 100 * Math.abs(q) + spec.acc[1] * r[1];
    return { ol: false, mode, range: r, value: q, u: a / Math.sqrt(3), limit: a };
  }
  function dmmText(rd) {
    if (!rd) return { txt: '', unit: '' };
    const r = rd.range, unit = r[2];
    if (rd.ol) return { txt: ' OL ', unit };
    let k = 1;
    if (unit === 'mV' || unit === 'mA') k = 1000; else if (unit === 'kΩ') k = 1e-3; else if (unit === 'MΩ') k = 1e-6;
    const dec = Math.max(0, Math.round(-Math.log10(r[1] * k)));
    return { txt: (rd.value * k).toFixed(dec), unit };
  }

  const api = { KIT, MU0, TAU, HS, mulberry32, benchVariant, coilSpec, coreParams, permeanceLin, Hfe, describe, coreLoss,
    solve, solveDC, vph, vrms, rmsOf, iR, irmsR, iV, irmsV, iW, irmsW, power, waveAt, dmmRead, dmmText, gauss01,
    c: { cabs, carg, cmul, cdiv, csub, cadd, cconj, cpolar } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.TLEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
