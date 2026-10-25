/* Capítulo 17 — Electrones en campo magnético */
(function () {
  'use strict';
  const EM = window.EM, SS = EM.ss, D = EM.sd, L = EM.lin;
  const PI = Math.PI;

  /* 17.1 Órbitas */
  EM.defineSim('orbitas', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('EF', { label: 'Energía de la órbita (t)', min: -3.8, max: 3.8, step: 0.02, value: -2.5, fmt: (v) => v.toFixed(2) });
    sim.out('t', 'Tipo de órbita', { hl: true });
    sim.out('A', 'Área encerrada (unidades de (π/a)²)');
    const E = (kx, ky) => -2 * (Math.cos(kx) + Math.cos(ky));
    let s = 0;
    sim.animate((dt) => { s += dt; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const hole = p.EF > 0, c = hole ? [PI, PI] : [0, 0];
      /* contorno por rayos desde el centro (Γ o M) */
      const n = 240, pts = [];
      for (let i = 0; i < n; i++) {
        const ph = (2 * PI * i) / n, f = (r) => E(c[0] + r * Math.cos(ph), c[1] + r * Math.sin(ph)) - p.EF;
        const r = L.brent(f, 1e-9, PI * 1.0001);
        pts.push(isFinite(r) ? [c[0] + r * Math.cos(ph), c[1] + r * Math.sin(ph)] : null);
      }
      const ok = pts.every(Boolean);
      const size = Math.min(W / 2 - 20, H - 20), r1 = { x: 10, y: (H - size) / 2, w: size, h: size };
      const v1 = D.view(r1, -PI, PI, -PI, PI);
      D.polygon(ctx, v1, [[-PI, -PI], [PI, -PI], [PI, PI], [-PI, PI]], { fill: '--c3', alpha: 0.08, stroke: '--ink-3', width: 1 });
      const fold = (q) => [((q[0] + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI, ((q[1] + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI];
      if (ok) {
        ctx.fillStyle = EM.alpha('--c1', 0.8);
        for (const q of pts) { const f = fold(q); ctx.fillRect(v1.X(f[0]) - 1, v1.Y(f[1]) - 1, 2.2, 2.2); }
        /* punto que recorre la órbita con velocidad ∝ |v| (dk/dt ⟂ v) */
        const vel = pts.map((q) => Math.hypot(2 * Math.sin(q[0]), 2 * Math.sin(q[1])));
        const cum = [0];
        for (let i = 1; i <= n; i++) { const a = pts[i - 1], b = pts[i % n]; cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]) / Math.max(0.05, vel[i - 1])); }
        const T = cum[n], tt = ((s * 0.25 * T) % T) * (hole ? -1 : 1);
        const tm = ((tt % T) + T) % T;
        let j = 0; while (j < n && cum[j + 1] < tm) j++;
        const q = fold(pts[j]);
        ctx.fillStyle = EM.col('--c2'); ctx.beginPath(); ctx.arc(v1.X(q[0]), v1.Y(q[1]), 6, 0, 7); ctx.fill();
        /* espacio real: rotación de 90° de (k − c) */
        const r2 = { x: W / 2 + 10, y: (H - size) / 2, w: size, h: size };
        const v2 = D.view(r2, -PI, PI, -PI, PI);
        const real = pts.map((k) => [(k[1] - c[1]) * (hole ? -1 : 1), -(k[0] - c[0]) * (hole ? -1 : 1)]);
        D.polygon(ctx, v2, real, { stroke: '--c1', width: 2 });
        const rq = real[j];
        ctx.fillStyle = EM.col('--c2'); ctx.beginPath(); ctx.arc(v2.X(rq[0]), v2.Y(rq[1]), 6, 0, 7); ctx.fill();
        EM.text(ctx, 'espacio real (unidades de ħ/(eBa))', r2.x, r2.y + 14, { size: 11.5, color: '--ink-3' });
        let A = 0; for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; A += (a[0] - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (a[1] - c[1]); }
        sim.set('A', EM.fix(Math.abs(A) / 2 / (PI * PI), 4));
      } else sim.set('A', 'órbita abierta');
      EM.text(ctx, 'espacio k (zona de Brillouin)', r1.x, r1.y + 14, { size: 11.5, color: '--ink-3' });
      EM.draw.current(ctx, W - 24, 24, 1, { r: 10 });
      EM.text(ctx, 'B', W - 46, 28, { size: 13, italic: true, color: '--cur', weight: 700 });
      sim.set('t', Math.abs(p.EF) < 0.05 ? 'separatriz (singularidad de van Hove)' : hole ? 'de huecos, alrededor de M (sentido horario)' : 'electrónica, alrededor de Γ (antihorario)');
    });
  });

  /* Utilidades del gas bidimensional con niveles de Landau ensanchados */
  const twoDEG = (n, B, mr, G) => {
    const hw = (SS.hbar * SS.e * B) / (mr * SS.me) / SS.e * 1000; /* meV */
    const deg = 2 * (SS.e * B) / SS.h; /* estados por m² por nivel (dos espines) */
    const N = (E) => { let s = 0; for (let k = 0; k < 400; k++) { const En = hw * (k + 0.5); if (En - E > 6 * G) break; s += 0.5 * (1 + L.erf((E - En) / (Math.SQRT2 * G))); } return deg * s; };
    const EF = L.brent((E) => N(E) - n, -10 * G, hw * (n / deg + 2) + 10 * G, 1e-10);
    return { hw, deg, EF, nu: n / (deg / 2) };
  };

  /* 17.2 Niveles de Landau */
  EM.defineSim('landau', function (sim) {
    const cv = sim.canvas({ aspect: 1.7 });
    sim.slider('B', { label: 'Campo B', min: 0.3, max: 10, step: 0.01, value: 3, unit: 'T', fmt: (v) => v.toFixed(2) });
    sim.slider('G', { label: 'Ensanchamiento Γ', min: 0.05, max: 1.5, step: 0.01, value: 0.3, unit: 'meV', fmt: (v) => v.toFixed(2) });
    sim.out('hw', 'ħω_c (GaAs, m* = 0.067)', { hl: true });
    sim.out('nu', 'Factor de llenado ν (n = 3×10¹¹ cm⁻²)');
    sim.out('ef', 'Nivel de Fermi');
    const n = 3e15, mr = 0.067;
    let key = '', curve = null;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const r = twoDEG(n, p.B, mr, p.G), g0 = (mr * SS.me) / (PI * SS.hbar * SS.hbar) * SS.e / 1000; /* por m² por meV, dos espines */
      const h1 = H * 0.5;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: h1, xmin: 0, xmax: 25, ymin: 0, ymax: 4.5, xlabel: 'E (meV)', ylabel: 'g(E)/g₀' });
      pl.frame();
      const dos = (E) => { let s = 0; for (let k = 0; k < 200; k++) { const En = r.hw * (k + 0.5); if (En > E + 8 * p.G) break; s += Math.exp(-Math.pow((E - En) / p.G, 2) / 2) / (Math.sqrt(2 * PI) * p.G); } return (r.deg * s) / g0; };
      pl.fn(dos, { color: '--c1', width: 1.8, n: 900, fill: '--c1', fillAlpha: 0.15, to: r.EF });
      pl.fn(dos, { color: '--c1', width: 1.8, n: 900 });
      pl.hline(1, { color: '--ink-3', label: 'B = 0', labelRight: true });
      pl.vline(r.EF, { color: '--c2', label: 'E_F' });
      if (key !== String(p.G)) { key = String(p.G); curve = []; for (let B = 0.4; B <= 10; B += 0.02) curve.push([B, twoDEG(n, B, mr, p.G).EF]); }
      const p2 = new EM.Plot(ctx, { x: 0, y: h1, w: W, h: H - h1, xmin: 0, xmax: 10, ymin: 0, ymax: 25, xlabel: 'B (T)', ylabel: 'E_F (meV)' });
      p2.frame();
      for (let k = 0; k < 12; k++) p2.fn((B) => (SS.hbar * SS.e * B) / (mr * SS.me) / SS.e * 1000 * (k + 0.5), { color: '--grid-2', width: 1 });
      p2.xy(curve.map((q) => q[0]), curve.map((q) => q[1]), { color: '--c2', width: 2.2 });
      p2.vline(p.B, { color: '--accent' });
      sim.set('hw', EM.fix(r.hw, 3) + ' meV');
      sim.set('nu', EM.fix(r.nu, 3));
      sim.set('ef', EM.fix(r.EF, 3) + ' meV (sin campo: ' + EM.fix(n / g0, 3) + ' meV)');
    });
  });

  /* 17.3 de Haas–van Alphen (Lifshitz–Kosevich, gas 2D) */
  EM.defineSim('dhva', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('n', { label: 'Densidad n', min: 1, max: 10, step: 0.1, value: 3, unit: '×10¹¹ cm⁻²', fmt: (v) => v.toFixed(1) });
    sim.slider('T', { label: 'Temperatura', min: 0, max: 10, step: 0.1, value: 1, unit: 'K', fmt: (v) => v.toFixed(1) });
    sim.slider('TD', { label: 'Temperatura de Dingle (desorden)', min: 0, max: 5, step: 0.1, value: 0.5, unit: 'K', fmt: (v) => v.toFixed(1) });
    sim.check('inv', { label: 'Eje horizontal en 1/B', value: false });
    sim.out('F', 'Frecuencia F = nπħ/e', { hl: true });
    sim.out('per', 'Período Δ(1/B)');
    const mr = 0.067;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const n = p.n * 1e15, F = (n * PI * SS.hbar) / SS.e;
      const M = (B) => {
        const wc = (SS.e * B) / (mr * SS.me);
        let s = 0;
        for (let k = 1; k <= 60; k++) {
          const X = (2 * PI * PI * k * SS.kB * p.T) / (SS.hbar * wc), RT = X < 1e-9 ? 1 : X / Math.sinh(X);
          const RD = Math.exp((-2 * PI * PI * k * SS.kB * p.TD) / (SS.hbar * wc));
          s += (Math.pow(-1, k + 1) * Math.sin((2 * PI * k * F) / B) * RT * RD) / k;
        }
        return s;
      };
      const pl = p.inv
        ? new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0.1, xmax: 1.5, ymin: -1.8, ymax: 1.8, xlabel: '1/B (T⁻¹)', ylabel: 'M (u. arb.)' })
        : new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0.7, xmax: 10, ymin: -1.8, ymax: 1.8, xlabel: 'B (T)', ylabel: 'M (u. arb.)' });
      pl.frame();
      pl.fn((x) => M(p.inv ? 1 / x : x), { color: '--c1', width: 1.8, n: 1500 });
      sim.set('F', EM.fix(F, 2) + ' T');
      sim.set('per', EM.fix(1 / F, 4) + ' T⁻¹');
    });
  });

  /* 17.4 Hall cuántico */
  EM.defineSim('hall-cuantico', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('G', { label: 'Ensanchamiento de los niveles Γ', min: 0.1, max: 1.5, step: 0.01, value: 0.5, unit: 'meV', fmt: (v) => v.toFixed(2) });
    sim.slider('xe', { label: 'Fracción de estados extendidos', min: 0.05, max: 1, step: 0.01, value: 0.3, fmt: (v) => v.toFixed(2) });
    sim.out('pl', 'Mesetas visibles (h/νe²)', { hl: true });
    sim.out('rk', 'R_K = h/e²');
    const n = 3e15, mr = 0.067;
    let key = '', data = null;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const k = p.G + '|' + p.xe;
      if (key !== k) {
        key = k; data = [];
        const xe = 3 * p.xe; /* semiancho de la banda extendida en unidades de Γ (hasta ±3Γ) */
        for (let B = 0.3; B <= 12; B += 0.01) {
          const r = twoDEG(n, B, mr, p.G);
          let sxy = 0, sxx = 0;
          for (let q = 0; q < 300; q++) {
            const En = r.hw * (q + 0.5), x = (r.EF - En) / p.G;
            if (x < -10) break;
            sxy += 2 * Math.max(0, Math.min(1, (x + xe) / (2 * xe)));
            if (Math.abs(x) < xe) sxx += 2 * 0.3 * Math.exp(-x * x / Math.max(0.2, xe * xe / 4));
          }
          const d = sxx * sxx + sxy * sxy;
          data.push([B, sxy / d, sxx / d]); /* en unidades de h/e² */
        }
      }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 12, ymin: 0, ymax: 0.65, xlabel: 'B (T)', ylabel: 'ρ (h/e²)' });
      pl.frame();
      for (const nu of [2, 4, 6, 8]) pl.hline(1 / nu, { color: '--grid-2', label: 'ν = ' + nu, dash: [3, 3] });
      pl.fn((B) => B / (n * SS.e) / SS.RK, { color: '--ink-3', width: 1.2, dash: [6, 4] });
      pl.xy(data.map((q) => q[0]), data.map((q) => q[1]), { color: '--c1', width: 2.4 });
      pl.xy(data.map((q) => q[0]), data.map((q) => q[2]), { color: '--c2', width: 1.8 });
      pl.legend([{ label: 'ρ_{xy}', color: '--c1' }, { label: 'ρ_{xx}', color: '--c2' }, { label: 'clásico B/(ne)', color: '--ink-3', dash: [6, 4] }], 'tl');
      sim.set('pl', 'ν = 2, 4, 6… (espín degenerado): ' + [2, 4, 6].map((nu) => EM.fix(SS.RK / nu, 1) + ' Ω').join(', '));
      sim.set('rk', EM.fix(SS.RK, 3) + ' Ω');
    });
  });

  /* 17.5 Mariposa de Hofstadter */
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  EM.defineSim('hofstadter', function (sim) {
    const cv = sim.canvas({ aspect: 1.25 });
    sim.slider('Q', { label: 'Denominador máximo q', min: 5, max: 45, step: 1, value: 30, fmt: (v) => v.toFixed(0) });
    sim.out('n', 'Flujos racionales calculados', { hl: true });
    let key = -1, segs = null, count = 0;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, Q = Math.round(p.Q);
      EM.draw.clear(cv);
      if (key !== Q) {
        key = Q; segs = []; count = 0;
        for (let q = 1; q <= Q; q++) for (let pp = 0; pp <= q; pp++) {
          if (gcd(pp, q) !== 1) continue;
          count++;
          const e0 = SS.harper(pp, q, 0, 0), e1 = SS.harper(pp, q, PI / q, PI / q);
          for (let i = 0; i < e0.length; i++) segs.push([pp / q, Math.min(e0[i], e1[i]), Math.max(e0[i], e1[i])]);
        }
      }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W, h: H, xmin: 0, xmax: 1, ymin: -4.2, ymax: 4.2, xlabel: 'flujo por celda Φ/Φ₀', ylabel: 'E/t' });
      pl.frame();
      ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (const [a, e0, e1] of segs) { const x = pl.X(a); ctx.moveTo(x, pl.Y(e0)); ctx.lineTo(x, pl.Y(e1) - 0.8); }
      ctx.stroke();
      sim.set('n', count + ' fracciones p/q');
    });
  });
})();
