/* Capítulo 1 — Del cuerpo negro al átomo de Bohr */
(function () {
  'use strict';
  const EM = window.EM, O = EM.qm.orig, K = EM.qm.K;
  const HC = K.hc_eVnm; /* eV·nm */

  /* 1.1 Radiación del cuerpo negro: Planck, Rayleigh–Jeans y Wien */
  EM.defineSim('planck', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('T', { label: 'Temperatura T', min: 200, max: 12000, step: 1, value: 5772, log: true, unit: 'K', fmt: (v) => EM.sci(v, 3) });
    sim.check('log', { label: 'Ejes logarítmicos (ver la caída de Rayleigh–Jeans y la de Wien)', value: false });
    sim.out('pk', 'Máximo λ<sub>máx</sub> = <i>b</i>/<i>T</i> (ley de Wien) · energía del fotón en el máximo', { hl: true });
    sim.out('M', 'Emitancia total σ<i>T</i>⁴ (Stefan–Boltzmann)');
    sim.out('vis', 'Fracción de la emitancia en el visible (380–780 nm)');
    sim.out('rj', 'Rayleigh–Jeans / Planck a 400 nm · a 4 µm (la «catástrofe ultravioleta»)');
    sim.onDraw(() => {
      const p = sim.p, T = p.T, ctx = cv.ctx;
      EM.draw.clear(cv);
      const M = (l) => O.exitance(l * 1e-6, T) * 1e-6; /* W/(m²·µm) */
      const lpk = O.wienPeak(T) * 1e6, Mpk = M(lpk), lg = p.log;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.1, xmax: 30, xlog: true, ylog: lg, ymin: lg ? Mpk * 1e-9 : 0, ymax: lg ? Mpk * 6 : Mpk * 1.25, xlabel: 'longitud de onda λ (µm)', ylabel: 'emitancia espectral M_λ (W·m⁻²·µm⁻¹)', ml: 84 });
      pl.frame();
      const vis = [0.38, 0.78];
      for (let l = vis[0]; l < vis[1]; l += 0.01) { const [r, g, b] = EM.wavelengthRGB(l * 1000); pl.band(l, l + 0.0101, { color: `rgb(${r},${g},${b})`, alpha: 0.28 }); }
      pl.fn((l) => O.rayleighJeans(l * 1e-6, T) * Math.PI * 1e-6, { color: '--c2', width: 1.8, dash: [6, 4], n: 400 });
      pl.fn((l) => O.wienLaw(l * 1e-6, T) * Math.PI * 1e-6, { color: '--c3', width: 1.8, dash: [2, 4], n: 400 });
      pl.fn(M, { color: '--accent', width: 3, n: 500 });
      pl.vline(lpk, { color: '--accent', label: 'λmáx', dash: [3, 3] });
      pl.legend([{ label: 'Planck', color: '--accent' }, { label: 'Rayleigh–Jeans (clásica)', color: '--c2', dash: [6, 4] }, { label: 'Wien (frecuencias altas)', color: '--c3', dash: [2, 4] }], 'tr');
      const lpkNm = lpk * 1000, Ep = HC / lpkNm;
      sim.set('pk', `${lpk < 1 ? EM.fix(lpkNm, 0) + ' nm' : EM.fix(lpk, 2) + ' µm'} · ${EM.fix(Ep, 3)} eV`);
      sim.set('M', `${EM.sci(O.stefanBoltzmann(T), 3)} W/m²`);
      sim.set('vis', `${EM.fix(100 * O.bandFraction(380e-9, 780e-9, T), 2)} %`);
      const r = (l) => O.rayleighJeans(l * 1e-6, T) / O.planckLambda(l * 1e-6, T);
      sim.set('rj', `${EM.sci(r(0.4), 3)} · ${EM.sci(r(4), 3)}`);
    });
  });

  /* 1.2 Efecto fotoeléctrico: la recta de Millikan y las curvas corriente–voltaje */
  EM.defineSim('fotoelectrico', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('metal', { label: 'Metal del cátodo', options: Object.entries(O.METALS).map(([k, v]) => [k, `${v[0]} (φ = ${v[1].toFixed(2)} eV)`]), value: 'Na' });
    sim.slider('lam', { label: 'Longitud de onda de la luz λ', min: 150, max: 700, step: 1, value: 300, unit: 'nm', fmt: (v) => v.toFixed(0) });
    sim.slider('I', { label: 'Intensidad relativa', min: 0.1, max: 4, step: 0.05, value: 1, fmt: (v) => EM.fix(v, 2) + '×' });
    sim.out('E', 'Energía del fotón <i>hν</i> = <i>hc</i>/λ · frecuencia', { hl: true });
    sim.out('K', 'Energía cinética máxima <i>K</i><sub>máx</sub> = <i>hν</i> − φ · potencial de frenado <i>V</i><sub>0</sub>');
    sim.out('thr', 'Umbral: λ<sub>0</sub> = <i>hc</i>/φ · ν<sub>0</sub>');
    sim.out('Isat', 'Corriente de saturación (∝ intensidad, no depende de <i>V</i><sub>0</sub>)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, phi = O.METALS[p.metal][1], E = HC / p.lam, KE = Math.max(0, E - phi), f = (E * K.e) / K.h;
      EM.draw.clear(cv);
      /* Izquierda: K_máx frente a la frecuencia (recta de Millikan) */
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 2.1, ymin: -1.5, ymax: 5, xlabel: 'frecuencia ν (10¹⁵ Hz)', ylabel: 'K_máx (eV)', ml: 52, mr: 10, title: 'Recta de Millikan' });
      pl.frame();
      const slope = K.h / K.e * 1e15;
      pl.fn((x) => slope * x - phi, { color: '--c1', width: 2.4, from: O.thresholdHz(phi) / 1e15, n: 100 });
      pl.fn((x) => slope * x - phi, { color: '--c1', width: 1.4, dash: [4, 4], to: O.thresholdHz(phi) / 1e15 });
      pl.hline(0, { color: '--ink-3', dash: [] });
      pl.dot(f / 1e15, E - phi, { color: E >= phi ? '--accent' : '--c2', label: E >= phi ? 'K = ' + EM.fix(KE, 2) + ' eV' : 'sin emisión' });
      pl.dot(O.thresholdHz(phi) / 1e15, 0, { color: '--c3', label: 'ν₀', dy: 16 });
      /* Derecha: corriente frente al potencial retardador */
      const pr = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: -2, xmax: 5, ymin: 0, ymax: 4.4, xlabel: 'potencial retardador V (V)', ylabel: 'corriente I (u. arb.)', ml: 50, mr: 8, title: 'Corriente–voltaje' });
      pr.frame();
      const cur = (Isat, Vs) => (V) => (V <= 0 ? Isat : V >= Vs ? 0 : Isat * (1 - V / Vs));
      if (KE > 0) {
        pr.fn(cur(p.I, KE), { color: '--accent', width: 2.6, n: 300 });
        pr.fn(cur(0.5 * p.I, KE), { color: '--c4', width: 1.8, dash: [5, 3], n: 300 });
        pr.vline(KE, { color: '--accent', label: 'V₀' });
        pr.legend([{ label: 'intensidad elegida', color: '--accent' }, { label: 'la mitad de intensidad', color: '--c4', dash: [5, 3] }], 'tr');
      } else pr.label(0.5, 2.2, 'Con esta λ no hay fotoelectrones: no importa la intensidad.', { size: 12.5, color: '--c2' });
      sim.set('E', `${EM.fix(E, 3)} eV · ${EM.sci(f, 3)} Hz`);
      sim.set('K', KE > 0 ? `${EM.fix(KE, 3)} eV · ${EM.fix(KE, 3)} V` : 'cero (hν < φ)');
      sim.set('thr', `${EM.fix(O.thresholdNm(phi), 1)} nm · ${EM.sci(O.thresholdHz(phi), 3)} Hz`);
      sim.set('Isat', KE > 0 ? EM.fix(p.I, 2) + ' (u. arb.)' : '0');
    });
  });

  /* 1.3 Efecto Compton */
  EM.defineSim('compton', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('Eph', { label: 'Energía del fotón incidente', min: 1, max: 2000, step: 1, value: 17.445, log: true, unit: 'keV', fmt: (v) => EM.sci(v, 3) });
    sim.slider('th', { label: 'Ángulo de dispersión θ', min: 0, max: 180, step: 1, value: 90, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.out('dl', 'Desplazamiento Δλ = λ<sub>C</sub>(1 − cos θ) con λ<sub>C</sub> = <i>h</i>/<i>m</i><sub>e</sub><i>c</i> = 2.4263 pm', { hl: true });
    sim.out('lam', 'λ incidente → λ′ dispersada');
    sim.out('KE', 'Energía cinética del electrón · ángulo de retroceso φ');
    sim.out('fr', 'Fracción de la energía cedida al electrón');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, th = EM.M.rad(p.th), lam = (HC / (p.Eph * 1000)) * 1e-9, lam2 = O.comptonLam(lam, th), KE = O.comptonKE(lam, th), phi = O.comptonRecoil(lam, th);
      EM.draw.clear(cv);
      /* Diagrama de la colisión */
      const cx = W * 0.25, cy = H * 0.5, R = Math.min(W * 0.2, H * 0.4);
      EM.text(ctx, 'Colisión (el electrón está inicialmente en reposo)', cx, 18, { size: 12, align: 'center', color: '--ink-2' });
      EM.draw.arrow(ctx, cx - R * 1.15, cy, cx, cy, { color: '--c1', width: 2.6, head: 12 });
      EM.text(ctx, 'γ (λ)', cx - R * 0.7, cy - 12, { size: 12, color: '--c1', align: 'center' });
      ctx.save(); ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.arc(cx, cy, 6, 0, 7); ctx.fill(); ctx.restore();
      const pw = EM.M.clamp(lam2 / lam, 0.4, 3);
      EM.draw.arrow(ctx, cx, cy, cx + R * Math.cos(th) * 1.05, cy - R * Math.sin(th) * 1.05, { color: '--c2', width: 2.6, head: 12 });
      EM.text(ctx, "γ′ (λ′)", cx + R * Math.cos(th) * 1.05 + 8, cy - R * Math.sin(th) * 1.05, { size: 12, color: '--c2' });
      if (KE > 0 && p.th > 0) { EM.draw.arrow(ctx, cx, cy, cx + R * 0.8 * Math.cos(phi), cy + R * 0.8 * Math.sin(phi), { color: '--c3', width: 2.6, head: 12 }); EM.text(ctx, 'e⁻', cx + R * 0.8 * Math.cos(phi) + 8, cy + R * 0.8 * Math.sin(phi) + 4, { size: 12, color: '--c3' }); }
      ctx.save(); ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(cx, cy, R * 0.35, -th, 0); ctx.stroke(); ctx.restore();
      EM.text(ctx, 'θ', cx + R * 0.42, cy - 6, { size: 12, color: '--ink-2' });
      /* Gráfica Δλ(θ) */
      const pl = new EM.Plot(ctx, { x: W * 0.5, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 180, ymin: 0, ymax: 5.2, xlabel: 'ángulo de dispersión θ (°)', ylabel: 'Δλ (pm)', ml: 46, mr: 10, title: 'Desplazamiento Compton' });
      pl.frame();
      pl.fn((t) => (O.comptonWavelength() * (1 - Math.cos(EM.M.rad(t)))) * 1e12, { color: '--c1', width: 2.6 });
      pl.dot(p.th, O.comptonShift(th) * 1e12, { color: '--accent', label: EM.fix(O.comptonShift(th) * 1e12, 3) + ' pm' });
      pl.hline(2 * O.comptonWavelength() * 1e12, { color: '--ink-3', label: '2λ_C (máximo, retrodispersión)', labelRight: true });
      sim.set('dl', `${EM.fix(O.comptonShift(th) * 1e12, 4)} pm`);
      sim.set('lam', `${EM.fix(lam * 1e12, 3)} pm → ${EM.fix(lam2 * 1e12, 3)} pm`);
      sim.set('KE', `${EM.sci(KE, 4)} eV · ${p.th > 0 ? EM.fix(EM.M.deg(phi), 2) + '°' : '—'}`);
      sim.set('fr', `${EM.fix(100 * KE / (p.Eph * 1000), 3)} %`);
    });
  });

  /* 1.4 Átomo de Bohr: niveles, series y desplazamiento isotópico */
  const SER = { 1: 'Lyman', 2: 'Balmer', 3: 'Paschen', 4: 'Brackett' };
  const NUC = { H: ['Hidrógeno (¹H)', 1, K.mp], D: ['Deuterio (²H)', 1, K.md], He: ['He⁺ (⁴He)', 2, 6.6446573357e-27], Li: ['Li²⁺ (⁷Li)', 3, 7.0160034 * K.u - 3 * K.me] };
  EM.defineSim('bohr', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('ion', { label: 'Ion hidrogenoide', options: Object.entries(NUC).map(([k, v]) => [k, v[0]]), value: 'H' });
    sim.slider('nf', { label: 'Nivel final n_f (serie)', min: 1, max: 4, step: 1, value: 2, fmt: (v) => v.toFixed(0) + ' · ' + SER[Math.round(v)] });
    sim.slider('ni', { label: 'Nivel inicial n_i', min: 2, max: 8, step: 1, value: 3, fmt: (v) => v.toFixed(0) });
    sim.out('lam', 'Línea n<sub>i</sub> → n<sub>f</sub>: longitud de onda en el vacío · energía del fotón', { hl: true });
    sim.out('lim', 'Límite de la serie (n<sub>i</sub> → ∞) · primera línea de la serie');
    sim.out('orb', 'Radio y velocidad de la órbita de Bohr n<sub>i</sub> · <i>v</i>/<i>c</i>');
    sim.out('iso', 'Constante de Rydberg de este átomo (con masa reducida) · cociente con <i>R</i><sub>∞</sub>');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, [nm, Z, M] = NUC[p.ion], nf = Math.round(p.nf), ni = Math.max(nf + 1, Math.round(p.ni)), Emin = O.bohrE(1, Z, M);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.42, h: H, xmin: 0, xmax: 1, ymin: Emin * 1.05, ymax: -Emin * 0.12, xlabel: '', ylabel: 'energía (eV)', ml: 56, mr: 8, title: 'Niveles de energía' });
      pl.frame(); pl.hline(0, { color: '--ink-2' });
      for (let n = 1; n <= 8; n++) { const En = O.bohrE(n, Z, M); pl.path([[0.1, En], [0.7, En]], { color: n === ni || n === nf ? '--accent' : '--ink-3', width: n === ni || n === nf ? 2.6 : 1.3 }); if (n <= 4 || n === ni) pl.label(0.72, En, 'n = ' + n, { size: 11, dy: 4, color: '--ink-2' }); }
      pl.arrow(0.4, O.bohrE(ni, Z, M), 0.4, O.bohrE(nf, Z, M), { color: '--c2', width: 2.4 });
      for (let n = nf + 1; n <= 8; n++) if (n !== ni) pl.arrow(0.1 + 0.05 * (n - nf), O.bohrE(n, Z, M), 0.1 + 0.05 * (n - nf), O.bohrE(nf, Z, M), { color: '--c1', width: 1.1, alpha: 0.45, head: 6 });
      /* Espectro: líneas de todas las series con colores en el visible */
      const px = new EM.Plot(ctx, { x: W * 0.45, y: 0, w: W * 0.55, h: H, xmin: 40, xmax: 8000, xlog: true, ymin: 0, ymax: 1.1, xlabel: 'longitud de onda en el vacío (nm)', ylabel: '', ml: 14, mr: 8, title: 'Líneas espectrales' });
      px.frame();
      px.band(380, 780, { color: '--c4', alpha: 0.1 });
      for (let f = 1; f <= 4; f++) for (let n = f + 1; n <= 12; n++) {
        const l = O.bohrLambdaNm(n, f, Z, M), sel = f === nf, vis = l >= 380 && l <= 780, rgb = vis ? EM.wavelengthRGB(l) : null, col = rgb ? `rgb(${rgb[0]},${rgb[1]},${rgb[2]})` : (sel ? '--accent' : '--ink-3');
        px.path([[l, 0], [l, (sel ? 1 : 0.55) / Math.pow(n - f, 0.7)]], { color: col, width: sel ? 3 : 1.6, alpha: sel ? 1 : 0.6 });
      }
      const lsel = O.bohrLambdaNm(ni, nf, Z, M); px.vline(lsel, { color: '--c2', label: EM.fix(lsel, 2) + ' nm', dash: [] });
      const lim = O.bohrLambdaNm(1e9, nf, Z, M), first = O.bohrLambdaNm(nf + 1, nf, Z, M);
      sim.set('lam', `${EM.fix(lsel, 3)} nm · ${EM.fix(HC / lsel, 4)} eV`);
      sim.set('lim', `${EM.fix(lim, 2)} nm · ${EM.fix(first, 2)} nm`);
      sim.set('orb', `${EM.fix(O.bohrRadius(ni, Z, M) * 1e10, 3)} Å · ${EM.sci(O.bohrSpeed(ni, Z) / K.c, 3)}`);
      sim.set('iso', `${EM.fix(O.rydberg(M), 1)} m⁻¹ · ${EM.sci(O.rydberg(M) / K.Rinf, 8)}`);
    });
  });

  /* 1.5 Ondas de materia y difracción de electrones (Davisson–Germer) */
  const PART = { e: ['Electrón', K.me], n: ['Neutrón', K.mn], p: ['Protón', K.mp], He: ['Átomo de He', 6.6464731e-27], C60: ['Molécula de C₆₀', 720.642 * K.u] };
  EM.defineSim('broglie', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('V', { label: 'Voltaje acelerador del electrón V', min: 10, max: 400, step: 1, value: 54, unit: 'V', fmt: (v) => v.toFixed(0) });
    sim.slider('d', { label: 'Espaciado de la fila de átomos del cristal (Ni)', min: 0.1, max: 0.4, step: 0.001, value: 0.215, unit: 'nm', fmt: (v) => EM.fix(v, 3) });
    sim.out('lam', 'λ = <i>h</i>/<i>p</i> del electrón · aproximación no relativista 1.2264 nm/√<i>V</i>', { hl: true });
    sim.out('ang', 'Primer máximo de difracción φ (sin φ = λ/<i>d</i>) · segundo orden');
    sim.out('cmp', 'Otras partículas con la misma energía cinética: neutrón · átomo de He · C₆₀');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, E = p.V * K.e, lam = O.electronLambda(p.V), d = p.d * 1e-9;
      EM.draw.clear(cv);
      /* Izquierda: λ frente a la energía cinética */
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.46, h: H, xmin: 1e-3, xmax: 1e4, xlog: true, ylog: true, ymin: 1e-5, ymax: 1e2, xlabel: 'energía cinética (eV)', ylabel: 'λ de de Broglie (nm)', ml: 54, mr: 8, title: 'λ(E) según la masa' });
      pl.frame();
      const cols = ['--c1', '--c2', '--c3', '--c4', '--c5'];
      Object.values(PART).forEach(([n, m], i) => pl.fn((eV) => O.deBroglie(eV * K.e, m) * 1e9, { color: cols[i], width: 2, n: 200 }));
      pl.legend(Object.values(PART).map(([n], i) => ({ label: n, color: cols[i] })), 'tr');
      pl.dot(p.V, lam * 1e9, { color: '--accent', label: 'electrón' });
      /* Derecha: intensidad difractada por una fila de N átomos */
      const N = 6, pd = new EM.Plot(ctx, { x: W * 0.49, y: 0, w: W * 0.51, h: H, xmin: 0, xmax: 90, ymin: 0, ymax: 1.1, xlabel: 'ángulo de dispersión φ (°)', ylabel: 'intensidad (norm.)', ml: 56, mr: 8, title: 'Difracción por la red cristalina' });
      pd.frame();
      pd.fn((ph) => { const dl = (2 * Math.PI * d * Math.sin(EM.M.rad(ph))) / lam; const s = Math.sin(dl / 2); return Math.abs(s) < 1e-9 ? 1 : Math.pow(Math.sin((N * dl) / 2) / (N * s), 2); }, { color: '--accent', width: 2.4, n: 900, fill: '--accent', fillAlpha: 0.12 });
      const a1 = O.braggAngle(lam, d, 1), a2 = O.braggAngle(lam, d, 2);
      if (isFinite(a1)) pd.vline(EM.M.deg(a1), { color: '--c2', label: 'n = 1' });
      sim.set('lam', `${EM.fix(lam * 1e9, 4)} nm (${EM.fix(lam * 1e10, 3)} Å) · ${EM.fix(O.deBroglieNR(E, K.me) * 1e9, 4)} nm`);
      sim.set('ang', `${isFinite(a1) ? EM.fix(EM.M.deg(a1), 2) + '°' : 'no existe (λ > d)'} · ${isFinite(a2) ? EM.fix(EM.M.deg(a2), 2) + '°' : 'no existe'}`);
      sim.set('cmp', `${EM.sci(O.deBroglie(E, K.mn) * 1e9, 3)} nm · ${EM.sci(O.deBroglie(E, PART.He[1]) * 1e9, 3)} nm · ${EM.sci(O.deBroglie(E, PART.C60[1]) * 1e9, 3)} nm`);
    });
  });
})();
