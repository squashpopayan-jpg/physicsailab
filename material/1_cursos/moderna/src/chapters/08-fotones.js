/* Capítulo 8 — Fotoeléctrico, Compton, rayos X y pares */
(function () {
  'use strict';
  const EM = window.EM, O = EM.qm.orig, P = EM.fm.ph, K = EM.qm.K, c = K.c, HC = K.hc_eVnm;

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


  /* 8.3 Dispersión Compton: sección de Klein–Nishina */
  EM.defineSim('klein', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('E', { label: 'Energía del fotón E', min: 1, max: 1e4, step: 0.01, value: 661.657, log: true, unit: 'keV', fmt: (v) => EM.sci(v, 4) });
    sim.out('s', 'Sección total por electrón σ_KN · cociente con Thomson σ_T = 0.6652 b', { hl: true });
    sim.out('mu', 'Coeficiente másico de atenuación Compton: agua (Z/A = 0.5551) · carbono (Z/A = 0.4995)');
    sim.out('f', 'Fracción media de la energía que se lleva el electrón · hacia delante (θ < 90°)');
    sim.out('ed', 'Borde Compton (energía cinética máxima del electrón) · fotón retrodispersado');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, eps = p.E / P.mc2keV, re2 = P.re * P.re;
      EM.draw.clear(cv);
      /* Polar: dσ/dΩ en unidades de r_e² */
      const cx = W * 0.26, cy = H * 0.5, Rr = Math.min(W * 0.22, H * 0.42);
      EM.text(ctx, 'Distribución angular dσ/dΩ (en unidades de r_e²)', cx, 16, { size: 12, align: 'center', color: '--ink-2' });
      ctx.save(); ctx.strokeStyle = EM.col('--rule'); ctx.setLineDash([3, 3]); for (const f of [0.25, 0.5, 0.75, 1]) { ctx.beginPath(); ctx.arc(cx, cy, Rr * f, 0, 7); ctx.stroke(); } ctx.restore();
      const m = 1; /* máximo de la sección de Thomson: r_e² (hacia delante y atrás) */
      const curve = (fn, col, w, dash) => { ctx.save(); ctx.strokeStyle = EM.col(col); ctx.lineWidth = w; ctx.setLineDash(dash || []); ctx.beginPath(); for (let k = 0; k <= 360; k++) { const t = (k * Math.PI) / 180, r = (Rr * fn(t)) / m, x = cx + r * Math.cos(t), y = cy - r * Math.sin(t); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.restore(); };
      curve((t) => (1 + Math.cos(t) ** 2) / 2, '--c2', 1.8, [6, 4]);
      curve((t) => P.kn(eps, t) / re2, '--accent', 3);
      EM.draw.arrow(ctx, cx - Rr * 1.05, cy + Rr * 1.0, cx - Rr * 0.55, cy + Rr * 1.0, { color: '--c1', width: 2, head: 7 }); EM.text(ctx, 'fotón incidente', cx - Rr * 1.05, cy + Rr * 1.0 - 8, { size: 11, color: '--c1' });
      /* Total frente a la energía */
      const pr = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H, xmin: 1, xmax: 1e5, xlog: true, ymin: 1e-3, ymax: 1.5, ylog: true, xlabel: 'energía del fotón (keV)', ylabel: 'σ_KN / σ_T', ml: 50, mr: 8, title: 'Sección eficaz de Klein–Nishina' });
      pr.frame(); pr.hline(1, { color: '--c2', label: 'Thomson', dash: [5, 3] });
      pr.fn((E) => P.knTotal(E / P.mc2keV) / P.thomson(), { color: '--accent', width: 3, n: 300 });
      pr.vline(P.mc2keV, { color: '--ink-3', label: 'mc²', dash: [3, 3] });
      pr.dot(p.E, P.knTotal(eps) / P.thomson(), { color: '--accent', r: 5.5 });
      /* fracción media de energía transferida: ∫ dσ (1 − k′/k) / σ */
      const N = 2000; let num = 0, den = 0, fw = 0;
      for (let i = 0; i < N; i++) { const t = ((i + 0.5) * Math.PI) / N, w = P.kn(eps, t) * 2 * Math.PI * Math.sin(t) * (Math.PI / N); num += w * (1 - P.ratio(eps, t)); den += w; if (t < Math.PI / 2) fw += w; }
      const sk = P.knTotal(eps);
      sim.set('s', `${EM.sci(sk * 1e28, 4)} b = ${EM.sci(sk * 1e4, 4)} cm² · ${EM.fix(sk / P.thomson(), 4)}`);
      sim.set('mu', `${EM.sci(P.massAtt(eps, 0.5551), 4)} cm²/g · ${EM.sci(P.massAtt(eps, 0.4995), 4)} cm²/g`);
      sim.set('f', `${EM.fix((100 * num) / den, 2)} % · ${EM.fix((100 * fw) / den, 2)} % de los fotones`);
      sim.set('ed', `${EM.fix(P.comptonEdge(p.E), 3)} keV · ${EM.fix(P.backscatter(p.E), 3)} keV`);
    });
  });

  /* 8.4 Tubo de rayos X: espectro continuo y líneas características */
  EM.defineSim('rayosx', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('tg', { label: 'Material del blanco', options: [['Cu', 'Cobre (Z = 29)'], ['Mo', 'Molibdeno (Z = 42)'], ['Ag', 'Plata (Z = 47)'], ['W', 'Wolframio (Z = 74)']], value: 'Mo' });
    sim.slider('V', { label: 'Voltaje acelerador V', min: 10, max: 150, step: 0.5, value: 35, unit: 'kV', fmt: (v) => EM.fix(v, 1) });
    sim.out('lm', 'Longitud de onda mínima (Duane–Hunt) λ_min = hc/eV · energía máxima del fotón', { hl: true });
    sim.out('pk', 'Máximo del espectro continuo (Kramers): 2λ_min');
    sim.out('ex', 'Borde K del blanco · ¿se excitan las líneas K?');
    sim.out('ka', 'Líneas Kα1 y Kβ1 del blanco · predicción de Moseley ¾Ry(Z − 1)²');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, V = p.V * 1e3, lmin = P.lambdaMin(V), [Z, ka, kb, ed] = P.KLINES[p.tg];
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.62, h: H, xmin: 0, xmax: 0.12, ymin: 0, ymax: 1.1, xlabel: 'longitud de onda λ (nm)', ylabel: 'intensidad (u. arb.)', ml: 50, mr: 8, title: 'Espectro del tubo (esquemático: intensidades relativas)' });
      pl.frame();
      const lmn = lmin * 1e9, peak = P.kramers(2 * lmn, lmn), I = (l) => P.kramers(l, lmn) / peak;
      pl.fn(I, { color: '--accent', width: 2.8, n: 600, from: lmn, fill: '--accent', fillAlpha: 0.14 });
      pl.vline(lmn, { color: '--c3', label: 'λ_min', dash: [4, 3] });
      const lines = [[ka, 'Kα1', 0.9], [kb, 'Kβ1', 0.28]], on = V * 1 >= ed; /* eV: e·V ≥ E_K */
      if (on) for (const [E, nm, hgt] of lines) { const lam = HC / E; const top = Math.min(1.04, I(lam) + 0.35 * hgt); pl.path([[lam, 0], [lam, top]], { color: '--c2', width: 2.6 }); pl.label(lam, top, nm, { color: '--c2', dy: -4, dx: nm === 'Kα1' ? -14 : 14, align: 'center' }); }
      /* Derecha: Moseley */
      const pr = new EM.Plot(ctx, { x: W * 0.65, y: 0, w: W * 0.35, h: H, xmin: 20, xmax: 80, ymin: 0, ymax: 70, xlabel: 'número atómico Z', ylabel: '√(Kα1/Ry)', ml: 44, mr: 8, title: 'Ley de Moseley' });
      pr.frame();
      pr.fn((z) => Math.sqrt(P.moseleyKa(z) / K.Ry_eV) , { color: '--c2', width: 1.8, dash: [5, 3], n: 100 });
      for (const [s, d] of Object.entries(P.KLINES)) pr.dot(d[0], Math.sqrt(d[1] / K.Ry_eV), { color: s === p.tg ? '--accent' : '--ink-3', r: s === p.tg ? 5.5 : 3.5, label: s, dx: 5, dy: 12 });
      sim.set('lm', `${EM.fix(lmin * 1e9, 5)} nm (${EM.fix(lmin * 1e12, 2)} pm) · ${EM.fix(V / 1e3, 2)} keV`);
      sim.set('pk', `${EM.fix(2 * lmin * 1e9, 5)} nm`);
      sim.set('ex', `${EM.fix(ed / 1e3, 3)} keV · ${V >= ed ? 'sí (eV ≥ E_K)' : 'no (V < ' + EM.fix(ed / 1e3, 2) + ' kV)'}`);
      sim.set('ka', `${EM.fix(ka / 1e3, 3)} keV · ${EM.fix(kb / 1e3, 3)} keV · ${EM.fix(P.moseleyKa(Z) / 1e3, 3)} keV`);
    });
  });
})();
