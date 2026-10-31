/* Capítulo 27 — Partículas idénticas y el helio */
(function () {
  'use strict';
  const EM = window.EM, ID = EM.qm.id, M = EM.M, PI = Math.PI, EHEV = 27.211386246;

  /* 27.1 Dos partículas idénticas en una caja: simetrización y correlación de intercambio */
  EM.defineSim('idem-caja', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('a', { label: 'Estado de la partícula A (n_A)', min: 1, max: 4, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.slider('b', { label: 'Estado de la partícula B (n_B)', min: 1, max: 4, step: 1, value: 2, fmt: (v) => v.toFixed(0) });
    sim.seg('s', { label: 'Tipo de partículas', options: [['0', 'Distinguibles'], ['1', 'Bosones (simétrica)'], ['-1', 'Fermiones (antisimétrica)']], value: '1' });
    sim.out('d', 'Separación cuadrática media ⟨(<i>x</i>₁ − <i>x</i>₂)²⟩ (en <i>L</i>²) · distinguibles · efecto del intercambio ∓2|⟨x⟩<sub>AB</sub>|²', { hl: true });
    sim.out('c', 'Energía de primer orden de una interacción de contacto <i>g</i>δ(<i>x</i>₁ − <i>x</i>₂): Δ<i>E</i>/(<i>g</i>/<i>L</i>) · bosones · fermiones · distinguibles');
    sim.out('p', 'Probabilidad de encontrar a las dos partículas en la misma mitad de la caja · en el mismo punto (densidad en la diagonal)');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, a = Math.round(sim.p.a), b = Math.round(sim.p.b), s = +sim.p.s, N = 90;
      EM.draw.clear(cv);
      let vm = 0; const dens = []; for (let iy = 0; iy < N; iy++) for (let ix = 0; ix < N; ix++) { const x1 = (ix + 0.5) / N, x2 = 1 - (iy + 0.5) / N, v = ID.psi2(a, b, x1, x2, a === b && s !== 0 ? (s === -1 ? 0 : 1) : s) ** 2; dens.push(v); vm = Math.max(vm, v); }
      const bw = Math.min(W * 0.46, H * 0.82), x0 = W * 0.06, y0 = H * 0.08;
      EM.heat(ctx, { x: x0, y: y0, w: bw, h: bw }, N, N, (ix, iy) => Math.pow(dens[iy * N + ix] / (vm || 1), 0.6), { cmap: 'inferno' });
      ctx.save(); ctx.strokeStyle = EM.alpha('--ink-2', 0.7); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(x0, y0 + bw); ctx.lineTo(x0 + bw, y0); ctx.stroke(); ctx.restore();
      EM.text(ctx, 'x₁ →', x0 + bw / 2, y0 + bw + 16, { size: 12, align: 'center', color: '--ink-2' }); EM.text(ctx, 'x₂', x0 - 14, y0 + bw / 2, { size: 12, color: '--ink-2' });
      EM.text(ctx, '|Ψ(x₁, x₂)|²: la diagonal punteada es x₁ = x₂', x0 + bw / 2, y0 - 8, { size: 11, align: 'center', color: '--ink-3' });
      /* marginal sobre la separación relativa: ρ(r) con r = x₁ − x₂ */
      const pl = new EM.Plot(ctx, { x: W * 0.56, y: 0, w: W * 0.44, h: H, xmin: -1, xmax: 1, ymin: 0, ymax: 3, xlabel: 'x₁ − x₂ (en L)', ylabel: 'densidad de la separación', ml: 48, mr: 8, title: 'Distribución de la separación relativa' });
      pl.frame(); const rs = Array.from({ length: 161 }, (_, i) => -1 + (2 * i) / 160), M2 = 200;
      const rho = (r) => { let t = 0; const lo = Math.max(0, r), hi = Math.min(1, 1 + r); for (let i = 0; i < M2; i++) { const x1 = lo + ((hi - lo) * (i + 0.5)) / M2; t += ID.psi2(a, b, x1, x1 - r, a === b && s !== 0 ? (s === -1 ? 0 : 1) : s) ** 2 * ((hi - lo) / M2); } return t; };
      pl.xy(rs, rs.map(rho), { color: '--accent', width: 2.4 }); pl.xy(rs, rs.map((r) => { let t = 0; const lo = Math.max(0, r), hi = Math.min(1, 1 + r); for (let i = 0; i < M2; i++) { const x1 = lo + ((hi - lo) * (i + 0.5)) / M2; t += ID.psi2(a, b, x1, x1 - r, 0) ** 2 * ((hi - lo) / M2); } return t; }), { color: '--ink-3', width: 1.5, dash: [5, 4] });
      pl.legend([{ label: s === 0 ? 'distinguibles' : s === 1 ? 'simétrica' : 'antisimétrica', color: '--accent' }, { label: 'distinguibles', color: '--ink-3', dash: [5, 4] }], 'tr');
      const sp = s, ss = a === b ? (s === -1 ? 0 : 1) : s, ex = a === b ? 0 : -2 * ID.xab(a, b) ** 2 * 1;
      let mh = 0, dg = 0; const NN = 120; for (let i = 0; i < NN; i++) for (let j = 0; j < NN; j++) { const x1 = (i + 0.5) / NN, x2 = (j + 0.5) / NN, v = ID.psi2(a, b, x1, x2, ss) ** 2 / (NN * NN); if ((x1 < 0.5) === (x2 < 0.5)) mh += v; } for (let i = 0; i < NN; i++) { const x = (i + 0.5) / NN; dg += ID.psi2(a, b, x, x, ss) ** 2 / NN; }
      sim.set('d', `${EM.fix(a === b ? ID.sep2(a, b, 0) : ID.sep2(a, b, ss), 5)} · ${EM.fix(ID.sep2(a, b, 0), 5)} · ${a === b ? 'n_A = n_B: sin efecto' : EM.fix(Math.abs(ex), 5) + (ss === 1 ? ' (menos separadas)' : ss === -1 ? ' (más separadas)' : ' (ninguno)')}`);
      sim.set('c', `${EM.fix(ID.contact(a, b, a === b ? 0 : 1), 4)} · ${a === b ? '0 (Pauli: no existe)' : EM.fix(ID.contact(a, b, -1), 4)} · ${EM.fix(ID.contact(a, b, 0), 4)}`);
      sim.set('p', `${EM.fix(mh, 4)} · ${EM.fix(dg, 4)}`);
    });
  });

  /* 27.2 Helio excitado 1s2s: orto y paraelio */
  EM.defineSim('helio-orto', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('Z1', { label: 'Carga efectiva del orbital 1s (Z₁)', min: 1.2, max: 2.2, step: 0.01, value: 2, fmt: (v) => EM.fix(v, 2) });
    sim.slider('Z2', { label: 'Carga efectiva del orbital 2s (Z₂; el valor real está cerca de 1 pero más difuso)', min: 0.4, max: 2.2, step: 0.01, value: 1, fmt: (v) => EM.fix(v, 2) });
    sim.out('j', 'Integral de Coulomb <i>J</i> e integral de intercambio <i>K</i> (hartree) · solo para Z₁ = Z₂ = Z: <i>J</i> = 17Z/81, <i>K</i> = 16Z/729', { hl: true });
    sim.out('e', 'Energías de la configuración 1s2s (hartree) sin interacción · triplete (ortohelio) = E₀ + J − K · singlete (parahelio) = E₀ + J + K');
    sim.out('s', 'Desdoblamiento singlete–triplete 2<i>K</i> (eV) frente al experimental del He: 0.796 eV (2¹S − 2³S = 20.616 − 19.820 eV)');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, Z1 = sim.p.Z1, Z2 = sim.p.Z2, { J, K } = ID.JK(Z1, Z2, 60, 6000), E0 = -(Z1 * Z1) / 2 - (Z2 * Z2) / 8, Et = E0 + J - K, Es = E0 + J + K;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 3, ymin: Math.min(E0, Et) - 0.3, ymax: Math.max(Es, E0 + J) + 0.3, xlabel: '', ylabel: 'E (hartree)', ml: 56, mr: 8, title: 'Niveles de la configuración 1s2s' });
      pl.frame(); [[0.3, E0, 'sin interacción', '--ink-3'], [1.2, Et, '³S (triplete, orto)', '--accent'], [1.2, Es, '¹S (singlete, para)', '--c2']].forEach(([x, e, t, c]) => { pl.path([[x, e], [x + 0.8, e]], { color: c, width: 3.2 }); pl.label(x + 0.85, e, t, { size: 11, dy: 4, color: '--ink-2' }); });
      pl.path([[2.2, E0 + J], [2.9, E0 + J]], { color: '--ink-3', width: 2, dash: [4, 3] }); pl.label(2.35, E0 + J, 'E₀ + J', { size: 11, dy: -9, color: '--ink-2' });
      const Zs = Array.from({ length: 40 }, (_, i) => 0.5 + (1.7 * i) / 39), q = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 0.5, xmax: 2.2, ymin: 0, ymax: 4, xlabel: 'Z₂ (con Z₁ = 2)', ylabel: 'desdoblamiento 2K (eV)', ml: 48, mr: 8, title: 'El desdoblamiento crece al comprimir el orbital 2s' });
      q.frame(); q.xy(Zs, Zs.map((z) => 2 * ID.JK(Z1, z, 60, 3000).K * EHEV), { color: '--accent', width: 2.2 }); q.hline(0.796, { color: '--c2', dash: [5, 3], label: 'experimento 0.796 eV', labelRight: true }); q.dot(Z2, 2 * K * EHEV, { color: '--c3', r: 5.5 });
      sim.set('j', `${EM.fix(J, 5)} · ${EM.fix(K, 5)}${Math.abs(Z1 - Z2) < 1e-9 ? ' (fórmula: ' + EM.fix(17 * Z1 / 81, 5) + ', ' + EM.fix(16 * Z1 / 729, 5) + ')' : ''}`);
      sim.set('e', `${EM.fix(E0, 5)} · ${EM.fix(Et, 5)} · ${EM.fix(Es, 5)}`);
      sim.set('s', `${EM.fix(2 * K * EHEV, 4)} eV (${EM.fix((2 * K * EHEV) / 0.796, 3)} veces el valor experimental)`);
    });
  });

  /* 27.3 Estadísticas cuánticas: conteo de estados y ocupación */
  EM.defineSim('estadisticas', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('N', { label: 'Número de partículas N', min: 2, max: 6, step: 1, value: 2, fmt: (v) => v.toFixed(0) });
    sim.slider('Mn', { label: 'Número de niveles M (sin degeneración)', min: 2, max: 8, step: 1, value: 3, fmt: (v) => v.toFixed(0) });
    sim.out('c', 'Microestados: distinguibles <i>M</i><sup>N</sup> · bosones C(<i>M</i> + <i>N</i> − 1, <i>N</i>) · fermiones C(<i>M</i>, <i>N</i>)', { hl: true });
    sim.out('p', 'N = 2: probabilidad de que las dos partículas estén en el mismo nivel: 1/M (clásica) · 2/(M + 1) (bosones: «agrupamiento») · 0 (fermiones)');
    sim.out('o', 'Ocupación media por nivel con (ε − μ)/kT = 1: Fermi–Dirac · Bose–Einstein · Maxwell–Boltzmann');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, N = Math.round(sim.p.N), Mn = Math.round(sim.p.Mn), cd = ID.count(N, Mn, 'dist'), cb = ID.count(N, Mn, 'bos'), cf = ID.count(N, Mn, 'fer');
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: -3, xmax: 4, ymin: 0, ymax: 3, xlabel: '(ε − μ)/kT', ylabel: 'ocupación media n(ε)', ml: 50, mr: 8, title: 'Distribuciones de Fermi–Dirac, Bose–Einstein y Boltzmann' });
      pl.frame(); const xs = Array.from({ length: 200 }, (_, i) => -3 + (7 * i) / 199); pl.xy(xs, xs.map(ID.fd), { color: '--accent', width: 2.4 }); pl.xy(xs.filter((x) => x > 0.15), xs.filter((x) => x > 0.15).map((x) => Math.min(3, ID.be(x))), { color: '--c2', width: 2.4 }); pl.xy(xs, xs.map((x) => Math.min(3, ID.mb(x))), { color: '--ink-3', width: 1.6, dash: [5, 4] });
      pl.legend([{ label: 'Fermi–Dirac', color: '--accent' }, { label: 'Bose–Einstein (μ < ε)', color: '--c2' }, { label: 'Boltzmann', color: '--ink-3', dash: [5, 4] }], 'tr');
      const q = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: -0.5, xmax: 2.5, ymin: 0, ymax: Math.log10(cd) * 1.2 + 0.5, xlabel: '', ylabel: 'log₁₀ (nº de microestados)', ml: 48, mr: 8, title: `${N} partículas en ${Mn} niveles` });
      q.frame(); [['dist', cd, '--ink-3', 0], ['bos', cb, '--c2', 1], ['fer', cf, '--accent', 2]].forEach(([k, v, c, i]) => { q.path([[i, 0], [i, v > 0 ? Math.log10(v) : 0]], { color: c, width: 26 }); q.label(i, v > 0 ? Math.log10(v) : 0, String(v), { size: 12, dy: -8, align: 'center', color: '--ink' }); q.label(i, 0, ['distinguibles', 'bosones', 'fermiones'][i], { size: 10.5, dy: 14, align: 'center', color: '--ink-2' }); });
      sim.set('c', `${cd} · ${cb} · ${cf}`);
      sim.set('p', `${EM.fix(1 / Mn, 4)} · ${EM.fix(2 / (Mn + 1), 4)} · 0`);
      sim.set('o', `${EM.fix(ID.fd(1), 4)} · ${EM.fix(ID.be(1), 4)} · ${EM.fix(ID.mb(1), 4)}`);
    });
  });
})();
