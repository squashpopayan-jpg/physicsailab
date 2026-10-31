/* Capítulo 33 — Sistemas cuánticos abiertos y la ecuación de Lindblad */
(function () {
  'use strict';
  const EM = window.EM, Q = EM.qm.qi, M = EM.M, PI = Math.PI;
  const rhoB = (r, th, ph) => { const x = r * Math.sin(th) * Math.cos(ph), y = r * Math.sin(th) * Math.sin(ph), z = r * Math.cos(th); return Q.from([[(1 + z) / 2, x / 2], [x / 2, (1 - z) / 2]], [[0, -y / 2], [y / 2, 0]]); };

  /* 33.1 Relajación T1 y T2 de un qubit */
  EM.defineSim('relajacion', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('T1', { label: 'Tiempo de relajación T₁ (1/γ)', min: 0.3, max: 20, step: 0.1, value: 5, log: true, fmt: (v) => EM.fix(v, 1) });
    sim.slider('Tp', { label: 'Tiempo de desfase puro T_φ (∞ = sin desfase puro)', min: 0.3, max: 40, step: 0.1, value: 20, log: true, fmt: (v) => EM.fix(v, 1) });
    sim.slider('w', { label: 'Frecuencia de Larmor ω (H = ωσ_z/2: gira x, y)', min: 0, max: 6, step: 0.05, value: 2, fmt: (v) => EM.fix(v, 2) });
    sim.slider('th', { label: 'Ángulo inicial del vector de Bloch con z (estado puro)', min: 5, max: 175, step: 1, value: 70, fmt: (v) => v.toFixed(0) + '°' });
    sim.out('t', 'Tiempos: 1/<i>T</i><sub>2</sub> = 1/(2<i>T</i><sub>1</sub>) + 1/<i>T</i><sub>φ</sub> · <i>T</i><sub>2</sub> (siempre ≤ 2<i>T</i><sub>1</sub>) · estado estacionario: |0⟩ (z = +1), el de menor energía', { hl: true });
    sim.out('b', 'Vector de Bloch en el instante final t = 5T₁: (x, y, z) · pureza Tr ρ² · entropía (bits)');
    sim.out('e', 'Entropía máxima alcanzada durante la relajación (el estado pasa de puro a mezclado y vuelve a puro en |0⟩)');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, T1 = sim.p.T1, Tp = sim.p.Tp, w = sim.p.w, th = M.rad(sim.p.th), g1 = 1 / T1, gp = 1 / Tp, T2 = 1 / (0.5 * g1 + gp);
      EM.draw.clear(cv);
      const Tmax = 5 * T1, steps = 300, rho0 = rhoB(1, th, 0), Ls = [{ L: Q.sm, g: g1 }, { L: Q.Zp, g: gp / 2 }], ev = Q.lindblad(rho0, Q.scale(Q.Zp, w / 2), Ls, Tmax, steps * 20, 20);
      const ts = ev.map((e) => e.t), bl = ev.map((e) => Q.bloch(e.rho)), S = ev.map((e) => Q.entropy(e.rho)), pur = ev.map((e) => Q.purity(e.rho));
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.58, h: H, xmin: 0, xmax: Tmax, ymin: -1.05, ymax: 1.05, xlabel: 't', ylabel: 'componentes del vector de Bloch', ml: 50, mr: 8, title: 'Relajación del vector de Bloch' });
      pl.frame(); pl.hline(0, { color: '--axis' }); pl.xy(ts, bl.map((b) => b[0]), { color: '--c1', width: 1.8 }); pl.xy(ts, bl.map((b) => b[1]), { color: '--c3', width: 1.8 }); pl.xy(ts, bl.map((b) => b[2]), { color: '--accent', width: 2.4 });
      pl.fn((t) => Math.sin(th) * Math.exp(-t / T2), { color: '--ink-3', width: 1, dash: [3, 3] }); pl.fn((t) => -Math.sin(th) * Math.exp(-t / T2), { color: '--ink-3', width: 1, dash: [3, 3] });
      pl.legend([{ label: 'x', color: '--c1' }, { label: 'y', color: '--c3' }, { label: 'z → +1 (T₁)', color: '--accent' }, { label: '±sen θ e^{−t/T₂}', color: '--ink-3', dash: [3, 3] }], 'tr');
      const q = new EM.Plot(ctx, { x: W * 0.6, y: 0, w: W * 0.4, h: H, xmin: 0, xmax: Tmax, ymin: 0, ymax: 1.05, xlabel: 't', ylabel: 'S (bits) · Tr ρ²', ml: 52, mr: 8, title: 'Entropía y pureza' });
      q.frame(); q.xy(ts, S, { color: '--c2', width: 2.2 }); q.xy(ts, pur, { color: '--ink-3', width: 1.6, dash: [4, 3] }); q.legend([{ label: 'S', color: '--c2' }, { label: 'Tr ρ²', color: '--ink-3', dash: [4, 3] }], 'tr');
      const b = bl[bl.length - 1], e = ev[ev.length - 1].rho;
      sim.set('t', `T₂ = ${EM.fix(T2, 4)} · 2T₁ = ${EM.fix(2 * T1, 3)} · T₂/T₁ = ${EM.fix(T2 / T1, 4)} (≤ 2)`);
      sim.set('b', `(${EM.fix(b[0], 4)}, ${EM.fix(b[1], 4)}, ${EM.fix(b[2], 4)}) · Tr ρ² = ${EM.fix(Q.purity(e), 5)} · S = ${EM.fix(Q.entropy(e), 5)}`);
      sim.set('e', `${EM.fix(Math.max(...S), 4)} bits`);
    });
  });

  /* 33.2 Átomo de dos niveles con láser: ecuaciones ópticas de Bloch */
  EM.defineSim('bloch-optico', function (sim) {
    const cv = sim.canvas({ aspect: 1.9 });
    sim.slider('Om', { label: 'Frecuencia de Rabi Ω (en unidades de γ)', min: 0.05, max: 12, step: 0.05, value: 2, log: true, fmt: (v) => EM.fix(v, 2) });
    sim.slider('De', { label: 'Desintonía Δ (en unidades de γ)', min: -8, max: 8, step: 0.05, value: 0, fmt: (v) => EM.fix(v, 2) });
    sim.out('s', 'Población estacionaria del nivel excitado ρ<sub>ee</sub> = (Ω²/4)/(Δ² + γ²/4 + Ω²/2) · parámetro de saturación en resonancia s = 2Ω²/γ²', { hl: true });
    sim.out('a', 'Anchura de línea (FWHM) γ√(1 + 2Ω²/γ²) (ensanchamiento por potencia) · máximo ρ<sub>ee</sub> = 1/2 cuando Ω → ∞');
    sim.out('t', 'En resonancia: oscilaciones de Rabi amortiguadas con frecuencia Ω′ = √(Ω² − γ²/16) y decaimiento 3γ/4 · valor numérico de ρ<sub>ee</sub> a t = 8/γ frente al estacionario');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, Om = sim.p.Om, De = sim.p.De, g = 1, ree = (D, O) => (O * O / 4) / (D * D + g * g / 4 + O * O / 2);
      EM.draw.clear(cv);
      const Hh = Q.add(Q.scale(Q.X, Om / 2), Q.scale(Q.Zp, De / 2)), Tm = 12, ev = Q.lindblad(Q.proj(Q.vec([1, 0])), Hh, [{ L: Q.sm, g }], Tm, 6000, 25), ts = ev.map((e) => e.t), pe = ev.map((e) => e.rho.re[1][1]);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.52, h: H, xmin: 0, xmax: Tm, ymin: 0, ymax: 1.0, xlabel: 'γt', ylabel: 'ρ_ee(t)', ml: 50, mr: 8, title: 'Oscilaciones de Rabi amortiguadas' });
      pl.frame(); pl.xy(ts, pe, { color: '--accent', width: 2.4 }); pl.hline(ree(De, Om), { color: '--c2', dash: [5, 3], label: 'estacionario', labelRight: true });
      const Ds = Array.from({ length: 300 }, (_, i) => -8 + (16 * i) / 299), q = new EM.Plot(ctx, { x: W * 0.54, y: 0, w: W * 0.46, h: H, xmin: -8, xmax: 8, ymin: 0, ymax: 0.52, xlabel: 'Δ/γ', ylabel: 'ρ_ee estacionario', ml: 56, mr: 8, title: 'Perfil de absorción' });
      q.frame(); [0.3, 1, 3, 10].forEach((o, i) => q.xy(Ds, Ds.map((d) => ree(d, o)), { color: ['--c1', '--c2', '--c3', '--c4'][i], width: 1.2, dash: [4, 3] })); q.xy(Ds, Ds.map((d) => ree(d, Om)), { color: '--accent', width: 2.4 }); q.vline(De, { color: '--ink-3', dash: [3, 3] }); q.legend([{ label: 'Ω = 0.3', color: '--c1' }, { label: 'Ω = 1', color: '--c2' }, { label: 'Ω = 3', color: '--c3' }, { label: 'Ω = 10', color: '--c4' }, { label: 'Ω actual', color: '--accent' }], 'tr');
      const s = (2 * Om * Om) / (g * g), fw = g * Math.sqrt(1 + s), num = pe[pe.length - 1];
      sim.set('s', `${EM.fix(ree(De, Om), 5)} · s(Δ = 0) = ${EM.fix(s, 4)} → ρ_ee(Δ = 0) = ${EM.fix(s / (2 * (1 + s)), 5)}`);
      sim.set('a', `FWHM = ${EM.fix(fw, 4)} γ (sin saturación: 1 γ) · límite ½`);
      sim.set('t', `Ω′ (resonancia) = ${Om > 0.25 ? EM.fix(Math.sqrt(Om * Om - 1 / 16), 4) : 'sobreamortiguado'} · ρ_ee(8/γ) = ${EM.fix(pe[Math.round((8 / Tm) * (pe.length - 1))], 5)} · estacionario ${EM.fix(ree(De, Om), 5)}`);
    });
  });

  /* 33.3 Canales cuánticos de un qubit: elipsoides de Bloch */
  EM.defineSim('canales', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('c', { label: 'Canal', options: [['amp', 'Amortiguamiento de amplitud (decaimiento a |1⟩)'], ['fase', 'Amortiguamiento de fase (desfase puro)'], ['dep', 'Despolarizante (ruido blanco)']], value: 'amp' });
    sim.slider('p', { label: 'Intensidad del canal p (amortiguamiento de fase: factor 1 − 2p, p ≤ ½)', min: 0, max: 1, step: 0.01, value: 0.4, fmt: (v) => EM.fix(v, 2) });
    sim.out('e', 'La esfera de Bloch se transforma en un elipsoide: semiejes (a<sub>x</sub>, a<sub>y</sub>, a<sub>z</sub>) y desplazamiento del centro · volumen relativo', { hl: true });
    sim.out('k', 'Operadores de Kraus: ΣK†K = 1 (conservación de la traza) · menor autovalor de la matriz de Choi (≥ 0: completamente positivo)');
    sim.out('m', 'Estado ejemplo |+⟩ (ejes x): pureza y entropía antes y después del canal');
    sim.onDraw(() => {
      const ctx = cv.ctx, W = cv.w, H = cv.h, p = sim.p.p, kind = sim.p.c, Ks = kind === 'amp' ? Q.ampDamp(p) : kind === 'fase' ? Q.phaseDamp(p) : Q.depolar(p);
      EM.draw.clear(cv);
      const tf = (b) => { const rho = Q.from([[(1 + b[2]) / 2, b[0] / 2], [b[0] / 2, (1 - b[2]) / 2]], [[0, -b[1] / 2], [b[1] / 2, 0]]); return Q.bloch(Q.kraus(rho, Ks)); };
      /* contorno de la imagen de la esfera en el plano xz y yz */
      const pts = (plane) => Array.from({ length: 121 }, (_, i) => { const a = (2 * PI * i) / 120, v = plane === 'xz' ? [Math.sin(a), 0, Math.cos(a)] : [0, Math.sin(a), Math.cos(a)]; return tf(v); });
      const mk = (x, y, w, h, title, plane) => { const r = (h - 64) / (w - 48), xl = 1.15 * Math.max(1, 1 / r), yl = 1.15 * Math.max(1, r), pl = new EM.Plot(ctx, { x, y, w, h, xmin: -xl, xmax: xl, ymin: -yl, ymax: yl, xlabel: plane === 'xz' ? 'x' : 'y', ylabel: 'z', ml: 40, mr: 8, title }); pl.frame(); pl.path(Array.from({ length: 121 }, (_, i) => [Math.sin((2 * PI * i) / 120), Math.cos((2 * PI * i) / 120)]), { color: '--ink-3', width: 1.2, dash: [4, 3] }); pl.path(pts(plane).map((b) => [plane === 'xz' ? b[0] : b[1], b[2]]), { color: '--accent', width: 2.6 }); return pl; };
      mk(0, 0, W * 0.5, H, 'Corte xz (azul: imagen de la esfera)', 'xz'); mk(W * 0.5, 0, W * 0.5, H, 'Corte yz (línea punteada: esfera original)', 'yz');
      const bx = tf([1, 0, 0]), by = tf([0, 1, 0]), bz1 = tf([0, 0, 1]), bz2 = tf([0, 0, -1]), c0 = tf([0, 0, 0]), ax = Math.abs(bx[0] - c0[0]), ay = Math.abs(by[1] - c0[1]), az = Math.abs(bz1[2] - bz2[2]) / 2;
      let kk = Q.zeros(2); for (const K of Ks) kk = Q.add(kk, Q.mul(Q.dag(K), K)); const choi = Q.eigh(Q.choi(Ks)).values, plus = Q.proj(Q.vec([Math.SQRT1_2, Math.SQRT1_2])), out = Q.kraus(plus, Ks);
      sim.set('e', `(${EM.fix(ax, 4)}, ${EM.fix(ay, 4)}, ${EM.fix(az, 4)}) · centro (${EM.fix(c0[0], 3)}, ${EM.fix(c0[1], 3)}, ${EM.fix(c0[2], 3)}) · vol. = ${EM.fix(ax * ay * az, 4)}`);
      sim.set('k', `ΣK†K = (${EM.fix(kk.re[0][0], 5)}, ${EM.fix(kk.re[1][1], 5)}) · mín. autovalor de Choi = ${EM.fix(Math.min(...choi), 6)}`);
      sim.set('m', `Tr ρ²: 1 → ${EM.fix(Q.purity(out), 5)} · S: 0 → ${EM.fix(Q.entropy(out), 5)} bits`);
    });
  });
})();
