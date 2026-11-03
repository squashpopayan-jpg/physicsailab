/* Capítulo 11 — Función de onda y ecuación de Schrödinger */
(function () {
  'use strict';
  const EM = window.EM, X = EM.fm.box, K = EM.qm.K, hbar = K.hbar, HC = K.hc_eVnm, e = K.e;
  const fmtE = (J) => { const eV = J / e; return Math.abs(eV) >= 1e6 ? `${EM.fix(eV / 1e6, 4)} MeV` : Math.abs(eV) >= 1e3 ? `${EM.fix(eV / 1e3, 4)} keV` : `${EM.fix(eV, 4)} eV`; };

  /* 11.1 El pozo infinito: niveles, funciones de onda y probabilidades */
  EM.defineSim('caja', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('part', { label: 'Partícula', options: [['e', 'Electrón'], ['p', 'Protón']], value: 'e' });
    sim.slider('L', { label: 'Anchura de la caja L', min: 1e-5, max: 10, step: 1e-5, value: 1, log: true, unit: 'nm', fmt: (v) => EM.sci(v, 3) });
    sim.slider('n', { label: 'Estado cuántico n', min: 1, max: 8, step: 1, value: 3, fmt: (v) => v.toFixed(0) });
    sim.slider('a', { label: 'Ventana de detección: inicio a (en unidades de L)', min: 0, max: 0.9, step: 0.01, value: 0.25, fmt: (v) => EM.fix(v, 2) });
    sim.slider('w', { label: 'Ventana de detección: anchura (en unidades de L)', min: 0.02, max: 1, step: 0.01, value: 0.5, fmt: (v) => EM.fix(v, 2) });
    sim.out('E', 'Energía E_n = n²π²ħ²/2mL² · E₁', { hl: true });
    sim.out('ph', 'Fotón emitido en n → n − 1: energía · longitud de onda');
    sim.out('P', 'Probabilidad en la ventana: cuántica · clásica (uniforme)');
    sim.out('dx', 'Δx/L = √(1/12 − 1/2n²π²) · Δp = nπħ/L · ΔxΔp/(ħ/2)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, m = p.part === 'e' ? K.me : K.mp, L = p.L * 1e-9, n = Math.round(p.n), b = Math.min(1, p.a + p.w);
      EM.draw.clear(cv);
      /* Niveles y función de onda del nivel elegido */
      const Emax = X.E(8, L, m), pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.45, h: H, xmin: 0, xmax: 1, ymin: 0, ymax: 1.1 * 64, xlabel: 'posición x/L', ylabel: 'energía E_n/E₁', ml: 46, mr: 8, title: 'Niveles y función de onda' });
      pl.frame(); void Emax;
      for (let k = 1; k <= 8; k++) pl.hline(k * k, { color: k === n ? '--accent' : '--ink-3', width: k === n ? 2.2 : 1, dash: [] });
      const sc = n === 1 ? 6 : 5.5; pl.fn((u) => n * n + sc * X.psi(n, u, 1) / Math.SQRT2 * 1.1, { color: '--accent', width: 2.6, n: 300 });
      pl.band(p.a, b, { color: '--c2', alpha: 0.18 });
      /* |ψ|² */
      const pr = new EM.Plot(ctx, { x: W * 0.48, y: 0, w: W * 0.52, h: H, xmin: 0, xmax: 1, ymin: 0, ymax: 2.2, xlabel: 'posición x/L', ylabel: '|ψ|² L', ml: 46, mr: 8, title: 'Densidad de probabilidad' });
      pr.frame(); pr.hline(1, { color: '--c3', label: 'clásica (uniforme)', dash: [5, 3] });
      pr.fn((u) => 2 * Math.sin(n * Math.PI * u) ** 2, { color: '--accent', width: 3, n: 600, fill: '--accent', fillAlpha: 0.14 });
      pr.band(p.a, b, { color: '--c2', alpha: 0.2 });
      const En = X.E(n, L, m), E1 = X.E(1, L, m), dE = X.E(n, L, m) - X.E(Math.max(1, n - 1), L, m), pq = X.prob(n, p.a, b);
      sim.set('E', `${fmtE(En)} · ${fmtE(E1)}`);
      sim.set('ph', n > 1 ? `${fmtE(dE)} · ${EM.sci(HC / (dE / e), 4)} nm` : '— (n = 1: estado fundamental)');
      sim.set('P', `${EM.fix(100 * pq, 2)} % · ${EM.fix(100 * (b - p.a), 2)} %`);
      sim.set('dx', `${EM.fix(X.dx(n), 4)} · ${EM.sci((n * Math.PI * hbar) / L, 3)} kg·m/s · ${EM.fix(2 * X.uncertainty(n), 4)}`);
    });
  });

  /* 11.2 Dinámica: superposiciones y revivals */
  EM.defineSim('paquete', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('st', { label: 'Estado inicial', options: [['g', 'Paquete gaussiano (σ = 0.05 L, k₀ = 40/L)'], ['12', 'Superposición de n = 1 y n = 2'], ['13', 'Superposición de n = 1 y n = 3'], ['1', 'Estado estacionario n = 2']], value: 'g' });
    sim.slider('L', { label: 'Anchura de la caja (electrón)', min: 0.1, max: 5, step: 0.05, value: 1, unit: 'nm', fmt: (v) => EM.fix(v, 2) });
    sim.slider('v', { label: 'Velocidad de la animación', min: 0.02, max: 1, step: 0.01, value: 0.25, log: true, fmt: (v) => EM.fix(v, 2) });
    sim.out('t', 'Tiempo · fracción del tiempo de revival T_rev = 4mL²/(πħ)', { hl: true });
    sim.out('rev', 'T_rev · periodo de la superposición (1, 2): 2πħ/(E₂ − E₁)');
    sim.out('E', 'Energía media ⟨E⟩ · norma Σ|c_n|²');
    sim.out('ov', 'Solapamiento |⟨ψ(0)|ψ(t)⟩|² (1 en los revivals)');
    let tt = 0, co = null, key = '';
    const mk = () => {
      const s = sim.p.st;
      if (s === 'g') co = X.gaussCoeffs(0.3, 0.05, 40, 80, 3000);
      else { const cr = new Array(80).fill(0), ci = new Array(80).fill(0); if (s === '12') { cr[0] = cr[1] = Math.SQRT1_2; } else if (s === '13') { cr[0] = cr[2] = Math.SQRT1_2; } else { cr[1] = 1; } co = { cr, ci, N: 80 }; }
      tt = 0; key = s;
    };
    mk(); sim.resetButton(() => { tt = 0; }); sim.onChange = (id) => { if (id === 'st') mk(); };
    sim.animate((dt) => { tt += dt * sim.p.v * 2 * Math.PI * 0.2; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, L = p.L * 1e-9, trev = X.revivalTime(L), th = ((tt % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), N = 400;
      EM.draw.clear(cv);
      const xs = [], ys = [], re = [];
      let mx = 0; for (let i = 0; i <= N; i++) { const u = i / N, d = X.density(co, u, th); xs.push(u); ys.push(d); mx = Math.max(mx, d); }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.62, h: H, xmin: 0, xmax: 1, ymin: 0, ymax: Math.max(3, mx * 1.1), xlabel: 'posición x/L', ylabel: '|ψ(x, t)|² L', ml: 46, mr: 8, title: 'Densidad de probabilidad' });
      pl.frame(); pl.xy(xs, ys, { color: '--accent', width: 2.8, fill: '--accent', fillAlpha: 0.16 });
      const pr = new EM.Plot(ctx, { x: W * 0.65, y: 0, w: W * 0.35, h: H, xmin: 0, xmax: 1, ymin: 0, ymax: 1.05, xlabel: 't / T_rev', ylabel: 'solapamiento con ψ(0)', ml: 44, mr: 8, title: 'Revivals' });
      pr.frame();
      const ov = (ttt) => { let a = 0, b = 0; for (let n = 1; n <= co.N; n++) { const c2 = co.cr[n - 1] ** 2 + co.ci[n - 1] ** 2, ph = n * n * ttt; a += c2 * Math.cos(ph); b += c2 * Math.sin(ph); } return a * a + b * b; };
      pr.fn((x) => ov(x * 2 * Math.PI), { color: '--accent', width: 2.4, n: 500 });
      pr.dot((th / (2 * Math.PI)), ov(th), { color: '--c3', r: 5.5 });
      let E = 0, nr = 0; for (let n = 1; n <= co.N; n++) { const c2 = co.cr[n - 1] ** 2 + co.ci[n - 1] ** 2; E += c2 * n * n; nr += c2; }
      const t = (th / (2 * Math.PI)) * trev;
      sim.set('t', `${EM.fix(t * 1e15, 3)} fs · ${EM.fix(th / (2 * Math.PI), 4)}`);
      sim.set('rev', `${EM.fix(trev * 1e15, 3)} fs · ${EM.fix(X.beatPeriod(1, 2, L) * 1e15, 3)} fs`);
      sim.set('E', `${EM.fix(E * X.E(1, L) / e, 4)} eV · ${EM.fix(nr, 5)}`);
      sim.set('ov', EM.fix(ov(th), 5));
    });
  });

  /* 11.3 Puntos cuánticos: el color según el tamaño (modelo de masa efectiva de Brus) */
  const MAT = { CdSe: ['CdSe', { Eg: 1.74, me: 0.13, mh: 0.45, eps: 10.6 }], CdS: ['CdS', { Eg: 2.42, me: 0.21, mh: 0.80, eps: 5.7 }], InP: ['InP', { Eg: 1.34, me: 0.08, mh: 0.60, eps: 12.4 }] };
  EM.defineSim('puntos', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('mat', { label: 'Semiconductor', options: Object.entries(MAT).map(([k, v]) => [k, v[0]]), value: 'CdSe' });
    sim.slider('R', { label: 'Radio del punto cuántico R', min: 1.2, max: 6, step: 0.05, value: 2, unit: 'nm', fmt: (v) => EM.fix(v, 2) });
    sim.out('Eg', 'Energía de la transición E = E_g + ħ²π²/2R²(1/m_e* + 1/m_h*) − 1.786e²/(4πε₀εR)', { hl: true });
    sim.out('parts', 'Confinamiento · atracción de Coulomb · E_g del material macizo');
    sim.out('lam', 'Longitud de onda de absorción del primer pico excitónico · color aproximado');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, pr = MAT[p.mat][1], R = p.R * 1e-9, E = X.brus(R, pr);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.6, h: H, xmin: 1.2, xmax: 6, ymin: 1, ymax: 4, xlabel: 'radio R (nm)', ylabel: 'energía de la transición (eV)', ml: 46, mr: 8, title: 'Efecto del tamaño' });
      pl.frame();
      const cols = ['--c1', '--c2', '--c3'];
      Object.values(MAT).forEach(([nm, q], i) => { pl.fn((r) => X.brus(r * 1e-9, q), { color: cols[i], width: p.mat === nm ? 3 : 1.6, n: 200 }); pl.hline(q.Eg, { color: cols[i], dash: [2, 5], width: 1 }); });
      pl.legend(Object.values(MAT).map(([nm], i) => ({ label: nm, color: cols[i] })), 'tr');
      pl.dot(p.R, E, { color: '--accent', r: 5.5 });
      /* muestra de color */
      const lam = HC / E, rgb = lam >= 380 && lam <= 780 ? EM.wavelengthRGB(lam) : [60, 60, 60];
      const cx = W * 0.8, cy = H * 0.45, rr = 28 + p.R * 12;
      ctx.save(); const g = ctx.createRadialGradient(cx - rr * 0.3, cy - rr * 0.3, rr * 0.1, cx, cy, rr); g.addColorStop(0, `rgb(${Math.min(255, rgb[0] + 70)},${Math.min(255, rgb[1] + 70)},${Math.min(255, rgb[2] + 70)})`); g.addColorStop(1, `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 7); ctx.fill(); ctx.restore();
      EM.text(ctx, `R = ${EM.fix(p.R, 2)} nm → ${EM.fix(lam, 0)} nm`, cx, H * 0.45 + rr + 18, { size: 12, align: 'center', color: '--ink-2' });
      const conf = ((Math.PI * Math.PI * hbar * hbar) / (2 * K.me * R * R)) * (1 / pr.me + 1 / pr.mh) / e, coul = (1.786 * e * e) / (4 * Math.PI * K.eps0 * pr.eps * R) / e;
      sim.set('Eg', `${EM.fix(E, 4)} eV`);
      sim.set('parts', `+${EM.fix(conf, 4)} eV · −${EM.fix(coul, 4)} eV · ${EM.fix(pr.Eg, 2)} eV`);
      sim.set('lam', `${EM.fix(lam, 1)} nm${lam < 380 ? ' (ultravioleta)' : lam > 780 ? ' (infrarrojo)' : ''}`);
    });
  });
})();
