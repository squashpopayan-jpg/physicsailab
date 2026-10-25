/* Capítulo 30 — Defectos y desorden */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, D = EM.sd, L = EM.lin, DATA = EM.data;
  const PI = Math.PI;

  /* 30.1 Vacancias */
  const TM = { Cu: 1358, Ag: 1235, Au: 1337, Al: 933, Ni: 1728, Pt: 2041, Pb: 601, Mo: 2896, W: 3695 };
  EM.defineSim('vacancias', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('S', { label: 'Entropía de formación S_v/k_B', min: 0, max: 3, step: 0.1, value: 0, fmt: (v) => v.toFixed(1) });
    sim.out('al', 'Al en la fusión (933 K)', { hl: true });
    sim.out('cu', 'Cu en la fusión (1358 K)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0.2, xmax: 3, ymin: 1e-20, ymax: 1e-2, ylog: true, xlabel: '1000/T (K⁻¹)', ylabel: 'n/N' });
      pl.frame();
      const cols = ['--c1', '--c2', '--c3', '--c4', '--c5', '--c6', '--accent', '--ink-3', '--c1'];
      Object.entries(DATA.vacancy).forEach(([m, E], i) => {
        pl.fn((x) => SS.vacancyFrac(E, 1000 / x, p.S), { color: cols[i], width: 1.8 });
        const xm = 1000 / TM[m];
        pl.dot(xm, SS.vacancyFrac(E, TM[m], p.S), { color: cols[i], r: 4.5, label: m + ' (' + E + ' eV)', dx: 6, dy: -4 });
      });
      sim.set('al', EM.sci(SS.vacancyFrac(0.67, 933, p.S), 3) + ' (medido por Simmons y Balluffi: 9.4×10⁻⁴)');
      sim.set('cu', EM.sci(SS.vacancyFrac(1.28, 1358, p.S), 3));
    });
  });

  /* 30.2 Difusión */
  EM.defineSim('difusion', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.seg('bc', { label: 'Curva teórica', options: [['fix', 'Cantidad fija: gaussiana (simulada)'], ['cs', 'Concentración superficial fija: erfc']], value: 'fix' });
    sim.out('t', 'Pasos (tiempo)', { hl: true });
    sim.out('r', '√⟨x²⟩ medido y √(2Dt)');
    const N = 3000, rng = L.rng(8);
    let X, Y, steps = 0;
    const init = () => { X = new Float32Array(N); Y = new Float32Array(N); for (let i = 0; i < N; i++) { X[i] = 0; Y[i] = rng() * 100; } steps = 0; };
    init();
    sim.onChange = init;
    sim.resetButton(init);
    sim.animate(() => {
      for (let s = 0; s < 3; s++) {
        steps++;
        for (let i = 0; i < N; i++) {
          const r = rng();
          if (r < 0.25) X[i] += 1; else if (r < 0.5) X[i] -= 1; else if (r < 0.75) Y[i] += 1; else Y[i] -= 1;
          if (X[i] < 0) X[i] = -X[i]; /* superficie reflectora */
        }
      }
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const wl = W * 0.45, Dd = 0.25; /* D = Γa²/2 en 1D con probabilidad 1/2 de moverse en x */
      const xr = Math.max(30, 4 * Math.sqrt(2 * Dd * Math.max(1, steps)));
      ctx.fillStyle = EM.alpha('--c1', 0.5);
      for (let i = 0; i < N; i++) { const x = 10 + (X[i] / xr) * (wl - 20), y = 10 + ((((Y[i] % 100) + 100) % 100) / 100) * (H - 20); if (x < wl - 10) ctx.fillRect(x, y, 1.6, 1.6); }
      ctx.fillStyle = EM.col('--ink-3'); ctx.fillRect(8, 10, 2, H - 20);
      EM.text(ctx, 'superficie', 14, 22, { size: 11, color: '--ink-3' });
      const nb = 30, h = new Float64Array(nb);
      for (let i = 0; i < N; i++) { const b = Math.floor((X[i] / xr) * nb); if (b < nb) h[b]++; }
      const dx = xr / nb;
      const pl = new EM.Plot(ctx, { x: wl, y: 0, w: W - wl, h: H, xmin: 0, xmax: xr, ymin: 0, ymax: 1.1, xlabel: 'profundidad x (pasos de red)', ylabel: 'concentración relativa' });
      pl.frame();
      const t = Math.max(1, steps), sig = Math.sqrt(2 * Dd * t);
      if (p.bc === 'fix') {
        const norm = h[0] || 1;
        for (let b = 0; b < nb; b++) { ctx.fillStyle = EM.alpha('--c1', 0.55); ctx.fillRect(pl.X(b * dx), pl.Y(h[b] / norm), pl.X(dx) - pl.X(0) - 1, pl.Y(0) - pl.Y(h[b] / norm)); }
        pl.fn((x) => Math.exp((-x * x) / (2 * sig * sig)), { color: '--c2', width: 2.4 });
      } else {
        pl.fn((x) => L.erfc(x / (2 * Math.sqrt(Dd * t))), { color: '--c2', width: 2.4 });
        pl.label(xr * 0.4, 0.9, 'C = C_s erfc(x/2√(Dt))', { size: 11.5, color: '--c2' });
      }
      let s2 = 0; for (let i = 0; i < N; i++) s2 += X[i] * X[i];
      sim.set('t', String(steps));
      sim.set('r', EM.fix(Math.sqrt(s2 / N), 2) + ' y ' + EM.fix(sig, 2));
    });
  });

  /* 30.3 Mollwo–Ivey */
  const AH = { LiCl: 5.13, NaCl: 5.64, KCl: 6.29, RbCl: 6.58, LiBr: 5.50, NaBr: 5.97, KBr: 6.60, RbBr: 6.85, LiF: 4.03, NaF: 4.63, KF: 5.35 };
  EM.defineSim('centros-f', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.out('fit', 'Ajuste E = C·a⁻ⁿ', { hl: true });
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const pts = Object.entries(DATA.fCenter).map(([k, E]) => [AH[k], E, k]);
      let sx = 0, sy = 0, sxx = 0, sxy = 0;
      for (const [a, E] of pts) { const x = Math.log(a), y = Math.log(E); sx += x; sy += y; sxx += x * x; sxy += x * y; }
      const n = pts.length, m = (n * sxy - sx * sy) / (n * sxx - sx * sx), b = (sy - m * sx) / n;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 3.8, xmax: 7.2, xlog: true, ymin: 1.5, ymax: 6, ylog: true, xlabel: 'constante de red a (Å)', ylabel: 'E del centro F (eV)', xticks: [4, 5, 6, 7], yticks: [2, 3, 4, 5] });
      pl.frame();
      pl.fn((a) => Math.exp(b) * Math.pow(a, m), { color: '--ink-3', width: 1.6, dash: [5, 4] });
      for (const [a, E, k] of pts) { const l = 1239.84 / E; const col = l >= 380 && l <= 780 ? `rgb(${EM.wavelengthRGB(l).join(',')})` : '#7A44C9'; pl.dot(a, E, { color: col, r: 6, label: k, dx: 8, dy: 4 }); }
      sim.set('fit', 'n = ' + EM.fix(-m, 3) + ', C = ' + EM.fix(Math.exp(b), 1) + ' eV·Åⁿ');
    });
  });

  /* 30.4 Dislocación de borde */
  EM.defineSim('dislocacion', function (sim) {
    const cv = sim.canvas({ aspect: 1.6 });
    sim.slider('x0', { label: 'Posición de la dislocación', min: -16, max: 16, step: 0.25, value: 0, fmt: (v) => v.toFixed(2) });
    sim.check('circ', { label: 'Circuito de Burgers', value: true });
    sim.out('b', 'Vector de Burgers', { hl: true });
    const nu = 0.33, b = 1;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const v = D.view({ x: 10, y: 10, w: W - 20, h: H - 20 }, -12, 12, -7, 7);
      const disp = (x, y) => {
        const dx = x - p.x0, dy = y, r2 = dx * dx + dy * dy + 1e-9, th = Math.atan2(dy, dx);
        const ux = (b / (2 * PI)) * (th + Math.sin(2 * th) / (4 * (1 - nu)));
        const uy = -(b / (2 * PI)) * (((1 - 2 * nu) / (4 * (1 - nu))) * Math.log(r2) + Math.cos(2 * th) / (4 * (1 - nu)));
        return [ux, uy];
      };
      const pos = [];
      for (let j = -7; j <= 6; j++) for (let i = -14; i <= 14; i++) {
        const y = j + 0.5;
        const [ux, uy] = disp(i, y);
        pos.push([i + ux, y + uy, i, j]);
      }
      ctx.save(); ctx.beginPath(); ctx.rect(10, 10, W - 20, H - 20); ctx.clip();
      for (const [x, y] of pos) { ctx.fillStyle = EM.col('--c1'); ctx.beginPath(); ctx.arc(v.X(x), v.Y(y), 4.2, 0, 7); ctx.fill(); }
      ctx.restore();
      /* símbolo ⊥ en el núcleo */
      const cx = v.X(p.x0), cy = v.Y(0);
      ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx - 10, cy); ctx.lineTo(cx + 10, cy); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - 14); ctx.stroke();
      ctx.setLineDash([4, 4]); ctx.strokeStyle = EM.alpha('--ink-3', 0.7); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(v.X(-12), cy); ctx.lineTo(v.X(12), cy); ctx.stroke(); ctx.setLineDash([]);
      EM.text(ctx, 'plano de deslizamiento', v.X(-11.8), cy - 6, { size: 11, color: '--ink-3', halo: true });
      if (p.circ) {
        /* circuito de 8×6 pasos de red alrededor del núcleo, siguiendo los átomos */
        const at = (i, j) => pos.find((q) => q[2] === i && q[3] === j);
        const i0 = Math.round(p.x0) - 4, i1 = i0 + 8, j0 = -3, j1 = 2;
        const path = [];
        for (let i = i0; i <= i1; i++) path.push(at(i, j0));
        for (let j = j0 + 1; j <= j1; j++) path.push(at(i1, j));
        for (let i = i1 - 1; i >= i0; i--) path.push(at(i, j1));
        for (let j = j1 - 1; j >= j0; j--) path.push(at(i0, j));
        const ok = path.filter(Boolean);
        ctx.strokeStyle = EM.col('--c2'); ctx.lineWidth = 2; ctx.beginPath();
        ok.forEach((q, k) => (k ? ctx.lineTo(v.X(q[0]), v.Y(q[1])) : ctx.moveTo(v.X(q[0]), v.Y(q[1]))));
        ctx.stroke();
      }
      sim.set('b', 'b = a (perpendicular a la línea: dislocación de borde)');
    });
  });

  /* 30.5 Anderson */
  EM.defineSim('anderson', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.slider('W', { label: 'Desorden W/t', min: 0, max: 6, step: 0.05, value: 1.5, fmt: (v) => v.toFixed(2) });
    sim.slider('E', { label: 'Energía del estado E/t', min: -1.8, max: 1.8, step: 0.05, value: 0, fmt: (v) => v.toFixed(2) });
    sim.check('log', { label: 'Escala logarítmica', value: false });
    sim.out('xi', 'Longitud de localización (matriz de transferencia)', { hl: true });
    sim.out('th', 'Perturbativa 24(4 − E²)/W²');
    sim.out('ipr', 'Participación 1/Σ|ψ|⁴ del estado');
    const N = 300;
    let key = '', r = null, xiNum = NaN;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const k = p.W + '|' + p.E;
      if (k !== key) {
        key = k;
        if (key.split('|')[0] !== (r && r.W)) { r = SS.andersonStates(N, p.W, L.rng(11)); r.W = String(p.W); }
        xiNum = p.W > 0.05 ? 1 / SS.andersonLyap(p.E, p.W, 400000, L.rng(5)) : Infinity;
      }
      let im = 0; r.val.forEach((e, i) => { if (Math.abs(e - p.E) < Math.abs(r.val[im] - p.E)) im = i; });
      const v = r.vec[im];
      let s4 = 0; for (const x of v) s4 += x * x * x * x;
      const h1 = H * 0.55;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: h1, xmin: 0, xmax: N - 1, ymin: p.log ? 1e-12 : 0, ymax: p.log ? 1 : Math.max(...Array.from(v, (x) => x * x)) * 1.1, ylog: p.log, xlabel: 'sitio', ylabel: '|ψ|²' });
      pl.frame();
      pl.xy(Array.from({ length: N }, (_, i) => i), Array.from(v, (x) => x * x), { color: '--c1', width: 1.6, fill: p.log ? null : '--c1', fillAlpha: 0.2 });
      const p2 = new EM.Plot(ctx, { x: 0, y: h1, w: W, h: H - h1, xmin: 0.3, xmax: 6, xlog: true, ymin: 1, ymax: 2000, ylog: true, xlabel: 'W/t', ylabel: 'ξ (sitios)' });
      p2.frame();
      p2.fn((w) => SS.thoulessXi(p.E, w), { color: '--c2', width: 2, dash: [5, 4] });
      if (isFinite(xiNum)) p2.dot(p.W, xiNum, { color: '--accent', r: 6 });
      sim.set('xi', isFinite(xiNum) ? EM.fix(xiNum, 1) + ' sitios' : '∞ (sin desorden)');
      sim.set('th', p.W > 0 ? EM.fix(SS.thoulessXi(p.E, p.W), 1) + ' sitios' + (Math.abs(p.E) < 0.05 ? ' (en E = 0 la anomalía da 105/W²)' : '') : '∞');
      sim.set('ipr', EM.fix(1 / s4, 1) + ' sitios (E = ' + EM.fix(r.val[im], 3) + ' t)');
    });
  });

  /* 30.6 Fibonacci */
  EM.defineSim('fibonacci', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('tb', { label: 't_B/t_A', min: 0.1, max: 1, step: 0.01, value: 0.5, fmt: (v) => v.toFixed(2) });
    sim.out('n', 'Sitios por generación', { hl: true });
    let key = '', rows = null;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      if (key !== String(p.tb)) {
        key = String(p.tb); rows = [];
        for (let g = 2; g <= 11; g++) { const seq = SS.fibonacci(g); rows.push([g, seq.length + 1, SS.fibSpectrum(seq, 1, p.tb)]); }
      }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: -2.2, xmax: 2.2, ymin: 1.5, ymax: 11.5, xlabel: 'E/t_A', ylabel: 'generación', yticks: [2, 4, 6, 8, 10] });
      pl.frame();
      for (const [g, , es] of rows) { ctx.fillStyle = EM.col('--c1'); for (const e of es) ctx.fillRect(pl.X(e) - 0.6, pl.Y(g) - 6, 1.4, 12); }
      sim.set('n', rows.map((q) => q[1]).join(', '));
    });
  });
})();
