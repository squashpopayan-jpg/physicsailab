/* ===================================================================
   phys/50-tb.js — Redes y modelo de enlace fuerte (energías en eV, distancias en Å).
   Convención del panal: distancia de enlace d; vecinos de un sitio A (B en h-BN):
     δ1 = d(0, 1), δ2 = d(√3/2, −1/2), δ3 = d(−√3/2, −1/2)
   vectores primitivos a1 = δ2 − δ3 = √3 d (1, 0)  (dirección zigzag, eje x)
                       a2 = δ1 − δ3 = √3 d (1/2, √3/2)
   El eje y es la dirección armchair.
   =================================================================== */
(function (root) {
  'use strict';
  const CQ = (root.CQ = root.CQ || {});
  const P = (CQ.P = CQ.P || {});
  const LA = P.la;
  const TB = (P.tb = {});
  const s3 = Math.sqrt(3);

  /* Parámetros representativos (banda π) */
  TB.PAR = {
    dBN: 1.446, dCC: 1.42,
    tCC: 2.7, tBN: 2.3, tCB: 2.5, tCN: 2.5,
    /* energías de sitio π: gap de h-BN en K = εB − εN */
    eB: 2.3, eN: -2.3, eC: 0
  };

  TB.honeycomb = function (d = 1) {
    const deltas = [[0, d], [(s3 / 2) * d, -d / 2], [(-s3 / 2) * d, -d / 2]];
    const a1 = [s3 * d, 0], a2 = [(s3 / 2) * d, 1.5 * d];
    const det = a1[0] * a2[1] - a1[1] * a2[0];
    const b1 = [(2 * Math.PI * a2[1]) / det, (-2 * Math.PI * a2[0]) / det];
    const b2 = [(-2 * Math.PI * a1[1]) / det, (2 * Math.PI * a1[0]) / det];
    const K = [(4 * Math.PI) / (3 * s3 * d), 0];
    const Kp = [-(4 * Math.PI) / (3 * s3 * d), 0];
    const M = [Math.PI / (s3 * d), Math.PI / (3 * d)];
    return { d, a: s3 * d, deltas, a1, a2, b1, b2, G: [0, 0], K, Kp, M, area: Math.abs(det) };
  };
  /* f(k) = Σ_j e^{ik·δj} */
  TB.fk = function (kx, ky, lat) {
    let re = 0, im = 0;
    for (const [dx, dy] of lat.deltas) { const p = kx * dx + ky * dy; re += Math.cos(p); im += Math.sin(p); }
    return [re, im];
  };
  /* Bandas del panal con dos sitios distintos: E± = ε̄ ± √((Δ/2)² + t²|f|²) */
  TB.bands2 = function (kx, ky, lat, eA, eB, t) {
    const [re, im] = TB.fk(kx, ky, lat);
    const f2 = re * re + im * im;
    const m = (eA + eB) / 2, dd = (eA - eB) / 2;
    const w = Math.sqrt(dd * dd + t * t * f2);
    return [m - w, m + w, Math.sqrt(f2)];
  };
  /* Camino Γ–K–M–Γ con n puntos por tramo: devuelve {k:[[kx,ky]], s:[distancia acumulada], ticks} */
  TB.path = function (lat, n = 80, pts = ['G', 'K', 'M', 'G']) {
    const P0 = { G: lat.G, K: lat.K, M: lat.M, Kp: lat.Kp };
    const k = [], s = [], ticks = [{ s: 0, label: pts[0] }];
    let acc = 0;
    for (let q = 0; q < pts.length - 1; q++) {
      const A = P0[pts[q]], B = P0[pts[q + 1]];
      const L = Math.hypot(B[0] - A[0], B[1] - A[1]);
      for (let i = q === 0 ? 0 : 1; i <= n; i++) {
        const t = i / n;
        k.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]);
        s.push(acc + L * t);
      }
      acc += L;
      ticks.push({ s: acc, label: pts[q + 1] });
    }
    return { k, s, ticks };
  };
  /* Densidad de estados por muestreo de la zona de Brillouin (paralelogramo b1, b2) con ensanchamiento gaussiano */
  TB.dos = function (bandFn, lat, o = {}) {
    const nk = o.nk || 240, ne = o.ne || 400, sig = o.sigma || 0.05;
    const emin = o.emin, emax = o.emax;
    const hist = new Float64Array(ne);
    const de = (emax - emin) / ne;
    let nb = 0;
    for (let i = 0; i < nk; i++) for (let j = 0; j < nk; j++) {
      const u = (i + 0.5) / nk, v = (j + 0.5) / nk;
      const kx = u * lat.b1[0] + v * lat.b2[0], ky = u * lat.b1[1] + v * lat.b2[1];
      const E = bandFn(kx, ky);
      nb = E.length;
      for (const e of E) { const b = Math.floor((e - emin) / de); if (b >= 0 && b < ne) hist[b]++; }
    }
    /* normalización: estados por eV por celda (∫ DOS dE = número de bandas) */
    const norm = 1 / (nk * nk * de);
    const raw = hist.map((c) => c * norm);
    /* suavizado gaussiano */
    const out = new Float64Array(ne);
    const w = Math.max(1, Math.round((3 * sig) / de));
    for (let b = 0; b < ne; b++) {
      let s = 0, ws = 0;
      for (let q = -w; q <= w; q++) { const bb = b + q; if (bb < 0 || bb >= ne) continue; const g = Math.exp(-0.5 * ((q * de) / sig) ** 2); s += g * raw[bb]; ws += g; }
      out[b] = s / ws;
    }
    const E = new Float64Array(ne);
    for (let b = 0; b < ne; b++) E[b] = emin + (b + 0.5) * de;
    return { E, dos: out, nbands: nb };
  };

  /* ---------- Cadena 1D ---------- */
  /* Monoatómica: E(k) = ε − 2t cos(ka) */
  TB.chain1 = (k, a, eps, t) => eps - 2 * t * Math.cos(k * a);
  /* Diatómica (base de dos sitios, saltos t1 dentro de la celda y t2 entre celdas) */
  TB.chain2 = function (k, a, eA, eB, t1, t2) {
    const re = t1 + t2 * Math.cos(k * a), im = t2 * Math.sin(k * a);
    const f2 = re * re + im * im;
    const m = (eA + eB) / 2, d = (eA - eB) / 2, w = Math.sqrt(d * d + f2);
    return [m - w, m + w];
  };
  /* Anillo de N sitios con energías de sitio eps[i] y salto t (periódico): autovalores y autovectores */
  TB.ringTB = function (eps, t, open = false) {
    const n = eps.length, H = LA.zeros(n);
    for (let i = 0; i < n; i++) { H[i][i] = eps[i]; if (i < n - 1 || !open) { const j = (i + 1) % n; if (j !== i) { H[i][j] += -t; H[j][i] += -t; } } }
    return LA.eigh(H);
  };

  /* ---------- Sistemas periódicos generales en 1D (nanocintas) ----------
     cell: {atoms:[{x,y,s}], T:[Tx,Ty]}; hop(si,sj) → t (eV, positivo = −t en H); onsite(s) → ε */
  TB.bondsPeriodic = function (cell, dcut) {
    const bonds = [];
    const n = cell.atoms.length;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let m = -1; m <= 1; m++) {
      if (m === 0 && j <= i) continue;
      if (m < 0) continue; /* cada enlace entre celdas se cuenta una vez (m = +1) */
      const a = cell.atoms[i], b = cell.atoms[j];
      const dx = b.x + m * cell.T[0] - a.x, dy = b.y + m * cell.T[1] - a.y;
      if (Math.hypot(dx, dy) < dcut) bonds.push({ i, j, m });
    }
    return bonds;
  };
  TB.ribbonBands = function (cell, onsite, hop, nk = 120, dcut) {
    const n = cell.atoms.length;
    const bonds = TB.bondsPeriodic(cell, dcut || 1.2 * (cell.d || 1));
    const L = Math.hypot(cell.T[0], cell.T[1]);
    const ks = [], E = [];
    for (let q = 0; q <= nk; q++) {
      const k = -Math.PI / L + (2 * Math.PI * q) / (L * nk);
      const Re = LA.zeros(n), Im = LA.zeros(n);
      for (let i = 0; i < n; i++) Re[i][i] = onsite(cell.atoms[i].s);
      for (const b of bonds) {
        const t = -hop(cell.atoms[b.i].s, cell.atoms[b.j].s);
        const ph = k * b.m * L;
        const c = t * Math.cos(ph), s = t * Math.sin(ph);
        Re[b.i][b.j] += c; Im[b.i][b.j] += s;
        Re[b.j][b.i] += c; Im[b.j][b.i] -= s;
      }
      const r = LA.eighC(Re, Im, { vectors: false });
      ks.push(k * L);
      E.push(Array.from(r.values));
    }
    return { k: ks, E, bonds };
  };
  /* Nanocinta zigzag de W cadenas zigzag (2W átomos por celda), periodicidad a lo largo de x (T = √3 d).
     Cadena w: sitio A en (x_w, 1.5 d w) y sitio B en (x_w + √3d/2, 1.5 d w − d/2), x_w = 0 o √3d/2.
     El borde inferior queda en la subred B y el superior en la A (cada átomo de borde con 2 vecinos). */
  TB.zigzagRibbon = function (W, d, spA = 'C', spB = 'C') {
    const atoms = [];
    for (let w = 0; w < W; w++) {
      const xA = w % 2 ? (s3 / 2) * d : 0, yA = 1.5 * d * w;
      atoms.push({ x: xA, y: yA, s: spA, sub: 'A', w });
      atoms.push({ x: xA + (s3 / 2) * d, y: yA - d / 2, s: spB, sub: 'B', w });
    }
    return { atoms, T: [s3 * d, 0], d, kind: 'zigzag', W };
  };
  /* Nanocinta armchair de W líneas de dímeros, periodicidad a lo largo de y (T = 3d).
     Línea w en x = w·√3d/2 con un dímero vertical A (abajo) – B (arriba), desplazado 1.5 d en las líneas impares. */
  TB.armchairRibbon = function (W, d, spA = 'C', spB = 'C') {
    const atoms = [];
    for (let w = 0; w < W; w++) {
      const x = w * (s3 / 2) * d, y0 = w % 2 ? 1.5 * d : 0;
      atoms.push({ x, y: y0, s: spA, sub: 'A', w });
      atoms.push({ x, y: y0 + d, s: spB, sub: 'B', w });
    }
    return { atoms, T: [0, 3 * d], d, kind: 'armchair', W };
  };

  /* ---------- Copos finitos (clusters) ---------- */
  /* Copo de panal como unión de hexágonos. Los centros de hexágono forman una red triangular
     c = c0 + i a1 + j a2; cada hexágono aporta sus 6 vértices (subred A en 90°, 210°, 330°).
     'hex' de orden n: centros con distancia hexagonal ≤ n − 1 → 6n² átomos (n = 2: coroneno, 24).
     'tri' de orden n: i, j ≥ 0, i + j ≤ n − 1 → n² + 4n + 1 átomos, bordes zigzag de una sola subred. */
  TB.flake = function (shape, n, d = 1.42) {
    const lat = TB.honeycomb(d);
    const centers = [];
    const R = n + 2;
    for (let i = -R; i <= R; i++) for (let j = -R; j <= R; j++) {
      const ok = shape === 'hex' ? (Math.abs(i) + Math.abs(j) + Math.abs(i + j)) / 2 <= n - 1 : i >= 0 && j >= 0 && i + j <= n - 1;
      if (ok) centers.push([(s3 / 2) * d + i * lat.a1[0] + j * lat.a2[0], d / 2 + i * lat.a1[1] + j * lat.a2[1]]);
    }
    const map = new Map();
    for (const [cx, cy] of centers) for (let k = 0; k < 6; k++) {
      const ang = Math.PI / 6 + (k * Math.PI) / 3;
      const x = cx + d * Math.cos(ang), y = cy + d * Math.sin(ang);
      const key = Math.round(x * 1e4) + ',' + Math.round(y * 1e4);
      if (!map.has(key)) map.set(key, { x, y, sub: k % 2 ? 'A' : 'B' });
    }
    let sites = Array.from(map.values());
    /* centra el copo en el origen */
    const mx = sites.reduce((s, a) => s + a.x, 0) / sites.length, my = sites.reduce((s, a) => s + a.y, 0) / sites.length;
    sites = sites.map((a) => ({ x: a.x - mx, y: a.y - my, sub: a.sub }));
    return { sites, d, hexagons: centers.length };
  };
  TB.flakeHamiltonian = function (fl, onsite, hop) {
    const n = fl.sites.length, H = LA.zeros(n);
    const d = fl.d;
    for (let i = 0; i < n; i++) {
      H[i][i] = onsite(fl.sites[i].s);
      for (let j = i + 1; j < n; j++) {
        const a = fl.sites[i], b = fl.sites[j];
        if (Math.hypot(a.x - b.x, a.y - b.y) < 1.2 * d) { const t = -hop(a.s, b.s); H[i][j] = H[j][i] = t; }
      }
    }
    return H;
  };
})(typeof window !== 'undefined' ? window : globalThis);
