/* ===================================================================
   39-fq-sym.js — Simetría molecular: detección de operaciones y grupo puntual, representación de los desplazamientos cartesianos,
   reducción a representaciones irreducibles y actividad IR/Raman de las vibraciones.
   =================================================================== */
(function () {
  'use strict';
  const root = typeof window !== 'undefined' ? window : globalThis;
  const EM = (root.EM = root.EM || {});
  const FQ = EM.fq || (typeof require !== 'undefined' ? require('./31-fq.js') : null);
  const Y = (FQ.sym = {});
  const tol = 1e-3, dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], norm = (a) => Math.sqrt(dot(a, a)), cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = (a) => { const n = norm(a); return n < 1e-9 ? null : a.map((x) => x / n); };
  const mat = (M, v) => [dot(M[0], v), dot(M[1], v), dot(M[2], v)];
  const det3 = (M) => M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
  const trace = (M) => M[0][0] + M[1][1] + M[2][2];
  const rot = (u, th) => { const c = Math.cos(th), s = Math.sin(th), [x, y, z] = u, t = 1 - c; return [[t * x * x + c, t * x * y - s * z, t * x * z + s * y], [t * x * y + s * z, t * y * y + c, t * y * z - s * x], [t * x * z - s * y, t * y * z + s * x, t * z * z + c]]; };
  const refl = (n) => [[1 - 2 * n[0] * n[0], -2 * n[0] * n[1], -2 * n[0] * n[2]], [-2 * n[1] * n[0], 1 - 2 * n[1] * n[1], -2 * n[1] * n[2]], [-2 * n[2] * n[0], -2 * n[2] * n[1], 1 - 2 * n[2] * n[2]]];
  const neg = (M) => M.map((r) => r.map((x) => -x));
  const eq = (A, B) => A.every((r, i) => r.every((x, j) => Math.abs(x - B[i][j]) < 1e-6));
  const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

  /* Permutación de átomos inducida por una operación; null si no es una simetría */
  Y.perm = (atoms, M) => { const p = []; for (const a of atoms) { const r = mat(M, a.xyz); const j = atoms.findIndex((b) => b.el === a.el && Math.hypot(b.xyz[0] - r[0], b.xyz[1] - r[1], b.xyz[2] - r[2]) < tol); if (j < 0) return null; p.push(j); } return p; };
  /* Operaciones de simetría (con el centro de masas ya en el origen; masas iguales no necesarias para la simetría) */
  Y.operations = function (atoms) {
    const cand = []; const add = (v) => { const u = unit(v); if (!u) return; if (u[0] < -1e-9 || (Math.abs(u[0]) < 1e-9 && (u[1] < -1e-9 || (Math.abs(u[1]) < 1e-9 && u[2] < 0)))) u.forEach((x, i) => { u[i] = -x; }); if (!cand.some((c) => Math.abs(Math.abs(dot(c, u)) - 1) < 1e-6)) cand.push(u); };
    [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach(add); atoms.forEach((a) => add(a.xyz));
    for (let i = 0; i < atoms.length; i++) for (let j = 0; j < i; j++) { add(atoms[i].xyz.map((x, k) => x + atoms[j].xyz[k])); add(atoms[i].xyz.map((x, k) => x - atoms[j].xyz[k])); for (let k = 0; k < j; k++) add(cross(atoms[i].xyz.map((x, q) => x - atoms[j].xyz[q]), atoms[i].xyz.map((x, q) => x - atoms[k].xyz[q]))); add(cross(atoms[i].xyz, atoms[j].xyz)); }
    const ops = [{ M: I3, type: 'E', name: 'E', n: 0 }]; const have = (M) => ops.some((o) => eq(o.M, M)); const push = (o) => { if (Y.perm(atoms, o.M) && !have(o.M)) ops.push(o); };
    push({ M: neg(I3), type: 'i', name: 'i' });
    for (const u of cand) {
      push({ M: refl(u), type: 'σ', name: 'σ', axis: u });
      for (let n = 2; n <= 6; n++) for (let k = 1; k < n; k++) { const th = (2 * Math.PI * k) / n, R = rot(u, th); push({ M: R, type: 'C', name: 'C' + n + (k > 1 ? '^' + k : ''), axis: u, order: n, k }); push({ M: mat3mul(R, refl(u)), type: 'S', name: 'S' + n + (k > 1 ? '^' + k : ''), axis: u, order: n, k }); }
    }
    return ops;
  };
  function mat3mul(A, B) { return A.map((r, i) => B[0].map((_, j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j])); }
  /* Grupo puntual por el esquema habitual (lineales aparte) */
  Y.pointGroup = function (atoms) {
    const ops = Y.operations(atoms), n = atoms.length;
    const lin = atoms.every((a) => { const c = cross(a.xyz, atoms.find((b) => norm(b.xyz) > 1e-6).xyz); return norm(c) < 1e-6; });
    const hasI = ops.some((o) => o.type === 'i');
    if (lin) return { name: hasI ? 'D∞h' : 'C∞v', ops, linear: true };
    const rots = ops.filter((o) => o.type === 'C'), axes = []; rots.forEach((o) => { let a = axes.find((q) => Math.abs(Math.abs(dot(q.axis, o.axis)) - 1) < 1e-6); if (!a) { a = { axis: o.axis, n: 1 }; axes.push(a); } a.n = Math.max(a.n, o.order); });
    const c3 = axes.filter((a) => a.n >= 3).length, nmax = Math.max(1, ...axes.map((a) => a.n));
    if (c3 >= 4) return { name: axes.some((a) => a.n === 5) ? 'Ih' : axes.some((a) => a.n === 4) ? 'Oh' : (hasI ? 'Th' : 'Td'), ops };
    if (c3 >= 3 && axes.some((a) => a.n === 4)) return { name: hasI ? 'Oh' : 'O', ops };
    const nsig = ops.filter((o) => o.type === 'σ').length;
    if (nmax === 1) return { name: nsig ? 'Cs' : hasI ? 'Ci' : 'C1', ops };
    const main = axes.find((a) => a.n === nmax).axis, c2perp = axes.filter((a) => a.n === 2 && Math.abs(dot(a.axis, main)) < 1e-6).length;
    const sh = ops.some((o) => o.type === 'σ' && Math.abs(Math.abs(dot(o.axis, main)) - 1) < 1e-6), sv = ops.some((o) => o.type === 'σ' && Math.abs(dot(o.axis, main)) < 1e-6);
    if (c2perp >= nmax || (nmax === 2 && c2perp >= 2)) return { name: 'D' + nmax + (sh ? 'h' : sv ? 'd' : ''), ops, n: nmax };
    return { name: 'C' + nmax + (sh ? 'h' : sv ? 'v' : ''), ops, n: nmax };
  };

  /* Tablas de caracteres. cls: claves de clase en orden; irreps: [nombre, caracteres, IR, Raman] */
  const T = {
    C2v: { cls: ['E', 'C2', 'σxz', 'σyz'], rows: [['A1', [1, 1, 1, 1], 1, 1], ['A2', [1, 1, -1, -1], 0, 1], ['B1', [1, -1, 1, -1], 1, 1], ['B2', [1, -1, -1, 1], 1, 1]] },
    C3v: { cls: ['E', 'C3', 'σv'], rows: [['A1', [1, 1, 1], 1, 1], ['A2', [1, 1, -1], 0, 0], ['E', [2, -1, 0], 1, 1]], size: [1, 2, 3] },
    D2h: { cls: ['E', 'C2z', 'C2y', 'C2x', 'i', 'σxy', 'σxz', 'σyz'], rows: [['Ag', [1, 1, 1, 1, 1, 1, 1, 1], 0, 1], ['B1g', [1, 1, -1, -1, 1, 1, -1, -1], 0, 1], ['B2g', [1, -1, 1, -1, 1, -1, 1, -1], 0, 1], ['B3g', [1, -1, -1, 1, 1, -1, -1, 1], 0, 1], ['Au', [1, 1, 1, 1, -1, -1, -1, -1], 0, 0], ['B1u', [1, 1, -1, -1, -1, -1, 1, 1], 1, 0], ['B2u', [1, -1, 1, -1, -1, 1, -1, 1], 1, 0], ['B3u', [1, -1, -1, 1, -1, 1, 1, -1], 1, 0]] },
    D3h: { cls: ['E', 'C3', 'C2', 'σh', 'S3', 'σv'], rows: [["A1'", [1, 1, 1, 1, 1, 1], 0, 1], ["A2'", [1, 1, -1, 1, 1, -1], 0, 0], ["E'", [2, -1, 0, 2, -1, 0], 1, 1], ['A1"', [1, 1, 1, -1, -1, -1], 0, 0], ['A2"', [1, 1, -1, -1, -1, 1], 1, 0], ['E"', [2, -1, 0, -2, 1, 0], 0, 1]], size: [1, 2, 3, 1, 2, 3] },
    Td: { cls: ['E', 'C3', 'C2', 'S4', 'σd'], rows: [['A1', [1, 1, 1, 1, 1], 0, 1], ['A2', [1, 1, 1, -1, -1], 0, 0], ['E', [2, -1, 2, 0, 0], 0, 1], ['T1', [3, 0, -1, 1, -1], 0, 0], ['T2', [3, 0, -1, -1, 1], 1, 1]], size: [1, 8, 3, 6, 6] }
  };
  Y.TABLES = T;
  /* Clase de una operación (según el grupo) */
  const classOf = (g, o) => {
    const t = trace(o.M), sgn = Math.round(Math.abs(det3(o.M)) * Math.sign(det3(o.M)));
    if (g === 'C2v' || g === 'D2h') { const d = [0, 1, 2].map((i) => Math.round(o.M[i][i])); if (g === 'C2v' || g === 'D2h') { const key = d.join(','); const map = { '1,1,1': 'E', '-1,-1,1': g === 'C2v' ? 'C2' : 'C2z', '-1,1,-1': 'C2y', '1,-1,-1': 'C2x', '-1,-1,-1': 'i', '1,1,-1': 'σxy', '1,-1,1': 'σxz', '-1,1,1': 'σyz' }; return map[key]; } }
    if (g === 'C3v') return sgn > 0 ? (Math.round(t) === 3 ? 'E' : 'C3') : 'σv';
    if (g === 'Td') { const tt = Math.round(t); return sgn > 0 ? (tt === 3 ? 'E' : tt === 0 ? 'C3' : 'C2') : (tt === -1 ? 'S4' : 'σd'); }
    if (g === 'D3h') { const tt = Math.round(t); if (sgn > 0) return tt === 3 ? 'E' : tt === 0 ? 'C3' : 'C2'; if (tt === -2) return 'S3'; if (tt === 1) return Math.abs(Math.abs(o.axis ? o.axis[2] : 0) - 1) < 1e-6 ? 'σh' : 'σv'; return 'S3'; }
    return null;
  };
  /* Reducción de una representación (caracteres por operación) */
  Y.reduce = function (gname, atoms, ops, linear) {
    const tab = T[gname]; if (!tab) return null;
    if (gname === 'D2h') ops = ops.filter((o) => [0, 1, 2].every((i) => [0, 1, 2].every((j) => i === j || Math.abs(o.M[i][j]) < 1e-9)) && [0, 1, 2].every((i) => Math.abs(Math.abs(o.M[i][i]) - 1) < 1e-9));
    const chi = (f) => { const byCls = {}, count = {}; ops.forEach((o) => { const c = classOf(gname, o); if (!c) return; byCls[c] = f(o); count[c] = (count[c] || 0) + 1; }); return { byCls, count }; };
    const unmoved = (o) => { const p = Y.perm(atoms, o.M); return p.filter((j, i) => j === i).length; };
    const gam = {
      cart: chi((o) => unmoved(o) * trace(o.M)), trans: chi((o) => trace(o.M)), rot: chi((o) => det3(o.M) * (linear ? o.M[0][0] + o.M[1][1] : trace(o.M)))
    };
    const h = ops.length, red = (g) => tab.rows.map(([nm, ch]) => { let s = 0; tab.cls.forEach((c, k) => { s += (g.count[c] || 0) * (g.byCls[c] || 0) * ch[k]; }); return Math.round((s / h) * 1000) / 1000; });
    const nc = red(gam.cart), nt = red(gam.trans), nr = red(gam.rot), nv = nc.map((v, i) => v - nt[i] - nr[i]);
    return { names: tab.rows.map((r) => r[0]), dims: tab.rows.map((r) => r[1][0]), cart: nc, trans: nt, rot: nr, vib: nv, ir: tab.rows.map((r) => r[2]), raman: tab.rows.map((r) => r[3]) };
  };
  Y.formula = (names, n) => names.map((nm, i) => (n[i] > 0 ? (n[i] > 1 ? n[i] : '') + nm : '')).filter(Boolean).join(' + ');

  /* Moléculas de prueba (Å), orientadas en la convención habitual */
  const sph = (r, th, ph) => [r * Math.sin(th) * Math.cos(ph), r * Math.sin(th) * Math.sin(ph), r * Math.cos(th)];
  const nh3 = (() => { const c = Math.sqrt((Math.cos((106.7 * Math.PI) / 180) + 0.5) / 1.5), th = Math.acos(c); return [{ el: 'N', xyz: [0, 0, 0.116] }, ...[0, 1, 2].map((k) => ({ el: 'H', xyz: sph(1.012, Math.PI - th, (2 * Math.PI * k) / 3).map((v, i) => (i === 2 ? v + 0.116 : v)) }))]; })();
  Y.MOLS = {
    H2O: { nm: 'H₂O', atoms: [{ el: 'O', xyz: [0, 0, 0] }, { el: 'H', xyz: [0, 0.757, -0.587] }, { el: 'H', xyz: [0, -0.757, -0.587] }] },
    CH2O: { nm: 'H₂C=O (formaldehído)', atoms: [{ el: 'C', xyz: [0, 0, 0] }, { el: 'O', xyz: [0, 0, 1.205] }, { el: 'H', xyz: [0, 0.943, -0.587] }, { el: 'H', xyz: [0, -0.943, -0.587] }] },
    NH3: { nm: 'NH₃', atoms: nh3 },
    CH4: { nm: 'CH₄', atoms: [{ el: 'C', xyz: [0, 0, 0] }, ...[[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map((v) => ({ el: 'H', xyz: v.map((x) => x * 0.6276) }))] },
    C2H4: { nm: 'C₂H₄ (eteno)', atoms: [{ el: 'C', xyz: [0, 0, 0.667] }, { el: 'C', xyz: [0, 0, -0.667] }, ...[[1, 1], [1, -1], [-1, 1], [-1, -1]].map(([a, b]) => ({ el: 'H', xyz: [0, 0.923 * a, 1.238 * b] }))] },
    BF3: { nm: 'BF₃', atoms: [{ el: 'B', xyz: [0, 0, 0] }, ...[0, 1, 2].map((k) => ({ el: 'F', xyz: [1.313 * Math.cos((2 * Math.PI * k) / 3), 1.313 * Math.sin((2 * Math.PI * k) / 3), 0] }))] },
    CO2: { nm: 'CO₂ (lineal)', atoms: [{ el: 'C', xyz: [0, 0, 0] }, { el: 'O', xyz: [0, 0, 1.16] }, { el: 'O', xyz: [0, 0, -1.16] }], linear: true }
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = FQ;
})();
