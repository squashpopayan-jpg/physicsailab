/* Capítulo 10 — Átomo de Bohr, espectros, Franck–Hertz y Moseley */
(function () {
  'use strict';
  const EM = window.EM, O = EM.qm.orig, A = EM.fm.atom, K = EM.qm.K, c = K.c, HC = K.hc_eVnm, deg = (r) => (r * 180) / Math.PI;

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


  /* 10.2 Dispersión de Rutherford */
  const TG = { Au: ['Oro (Z = 79, A = 197)', 79, 197, 5.90e28], Pt: ['Platino (Z = 78, A = 195)', 78, 195, 6.62e28], Al: ['Aluminio (Z = 13, A = 27)', 13, 27, 6.03e28], Ag: ['Plata (Z = 47, A = 108)', 47, 108, 5.86e28] };
  EM.defineSim('rutherford', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('tg', { label: 'Blanco (lámina delgada)', options: Object.entries(TG).map(([k, v]) => [k, v[0]]), value: 'Au' });
    sim.slider('K', { label: 'Energía de las partículas α', min: 1, max: 20, step: 0.05, value: 7.69, unit: 'MeV', fmt: (v) => EM.fix(v, 2) });
    sim.slider('b', { label: 'Parámetro de impacto de la trayectoria resaltada b (en unidades de d₀)', min: 0.03, max: 4, step: 0.01, value: 0.5, fmt: (v) => EM.fix(v, 2) });
    sim.out('d0', 'Máximo acercamiento frontal d₀ = 2Ze²/(4πε₀K) · radio de contacto R(1.2A^{1/3}) + R_α(1.7 fm)', { hl: true });
    sim.out('th', 'Trayectoria resaltada: ángulo de dispersión θ · distancia mínima');
    sim.out('f', 'Fracción de las α dispersada más de 90° por una lámina de 0.4 µm: nπ(d₀/2)²t');
    sim.out('r', 'Cociente de la sección a 10° y a 150° (∝ sen⁻⁴(θ/2)): ¡ley de Rutherford!');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, [nm, Z, Am, n] = TG[p.tg], d0 = A.d0(2, Z, p.K), R = (1.2 * Math.pow(Am, 1 / 3) + 1.7) * 1e-15;
      EM.draw.clear(cv);
      const cx = W * 0.3, cy = H * 0.5, sc = Math.min(W * 0.27, H * 0.46) / 4;     /* píxeles por d₀ (4 d₀ de semialtura) */
      EM.text(ctx, 'Trayectorias de partículas α en el campo del núcleo (unidades d₀)', cx, 16, { size: 12, align: 'center', color: '--ink-2' });
      const orbit = (b) => {
        const pts = []; let x = -9, y = b, vx = 1, vy = 0; const k = 0.5, dtFor = (r) => 0.02 * Math.min(1, Math.max(0.01, r / 3));
        for (let i = 0; i < 20000; i++) {
          const r = Math.hypot(x, y); pts.push([x, y]); if ((x > 9 || Math.abs(y) > 9) && x > 0) break; if (x > 9 && vx > 0) break;
          const dt = dtFor(r), acc = (xx, yy) => { const rr = Math.hypot(xx, yy), r3 = rr * rr * rr; return [k * xx / r3, k * yy / r3]; };
          const a1 = acc(x, y), x2 = x + 0.5 * dt * vx, y2 = y + 0.5 * dt * vy, v2x = vx + 0.5 * dt * a1[0], v2y = vy + 0.5 * dt * a1[1], a2 = acc(x2, y2);
          x += dt * v2x; y += dt * v2y; vx += dt * a2[0]; vy += dt * a2[1]; if (Math.abs(x) > 9 && x > 0) break; if (Math.abs(y) > 12) break;
        }
        return pts;
      };
      ctx.save(); ctx.beginPath(); ctx.rect(cx - W * 0.27, 24, W * 0.54, H - 30); ctx.clip();
      for (const b of [0.15, 0.3, 0.6, 1, 1.5, 2.2, 3, 3.8]) { const pts = orbit(b); ctx.strokeStyle = EM.alpha('--c1', 0.5); ctx.lineWidth = 1.2; ctx.beginPath(); pts.forEach((q, i) => { const X = cx + q[0] * sc, Y = cy - q[1] * sc; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke(); }
      const pts = orbit(p.b); ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 3; ctx.beginPath(); pts.forEach((q, i) => { const X = cx + q[0] * sc, Y = cy - q[1] * sc; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.stroke();
      ctx.fillStyle = EM.col('--c3'); ctx.beginPath(); ctx.arc(cx, cy, Math.max(3, (R / d0) * sc), 0, 7); ctx.fill(); ctx.restore();
      EM.text(ctx, `radio de contacto / d₀ = ${EM.fix(R / d0, 3)}`, cx, H - 6, { size: 11, align: 'center', color: '--c3' });
      /* Sección eficaz */
      const pr = new EM.Plot(ctx, { x: W * 0.58, y: 0, w: W * 0.42, h: H, xmin: 5, xmax: 175, ymin: 1e-1, ymax: 1e8, ylog: true, xlabel: 'ángulo de dispersión θ (°)', ylabel: '(dσ/dΩ)/(d₀/4)²', ml: 52, mr: 8, title: 'Ley de Rutherford: 1/sen⁴(θ/2)' });
      pr.frame(); pr.fn((t) => 1 / Math.pow(Math.sin(((t * Math.PI) / 180) / 2), 4), { color: '--accent', width: 3, n: 300 });
      const thb = A.scatterAngle(p.b, 1); pr.dot(deg(thb), 1 / Math.pow(Math.sin(thb / 2), 4), { color: '--c3', r: 5.5 });
      const rmin = A.closestApproach(p.b, 1), fr = n * A.sigmaAbove(Math.PI / 2, d0) * 0.4e-6;
      sim.set('d0', `${EM.fix(d0 * 1e15, 2)} fm · ${EM.fix(R * 1e15, 2)} fm${d0 > R ? ' (la α no llega al núcleo)' : ' (¡la α alcanza el núcleo!)'}`);
      sim.set('th', `${EM.fix(deg(thb), 3)}° · ${EM.fix(rmin * d0 * 1e15, 2)} fm`);
      sim.set('f', `${EM.sci(fr, 3)} (una de cada ${EM.sci(1 / fr, 2)})`);
      sim.set('r', `${EM.sci(Math.pow(Math.sin((150 * Math.PI) / 360) / Math.sin((10 * Math.PI) / 360), 4), 4)}`);
    });
  });

  /* 10.3 Experimento de Franck y Hertz */
  EM.defineSim('franck', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.select('gas', { label: 'Gas del tubo', options: [['Hg', 'Mercurio (primer nivel excitado a 4.887 eV)'], ['Ne', 'Neón (excitación a unos 18.7 eV)']], value: 'Hg' });
    sim.slider('Vr', { label: 'Potencial retardador antes del ánodo', min: 0.5, max: 3.5, step: 0.05, value: 1.5, unit: 'V', fmt: (v) => EM.fix(v, 2) });
    sim.slider('mfp', { label: 'Camino libre medio (fracción de la longitud del tubo)', min: 0.01, max: 0.12, step: 0.005, value: 0.03, fmt: (v) => EM.fix(v, 3) });
    sim.out('E', 'Energía de excitación E_ex y longitud de onda emitida hc/E_ex', { hl: true });
    sim.out('mn', 'Mínimos de la corriente (espaciado ≈ E_ex/e)');
    sim.out('sp', 'Espaciado medio entre mínimos consecutivos');
    let curve = null, key = '';
    const compute = () => {
      const p = sim.p, Eex = p.gas === 'Hg' ? 4.887 : 18.7, Vmax = p.gas === 'Hg' ? 30 : 60, N = p.gas === 'Hg' ? 160 : 240; let st = 987654321;
      const rng = () => { st = (st * 1664525 + 1013904223) % 4294967296; return st / 4294967296; };
      const xs = [], ys = [];
      for (let i = 1; i <= N; i++) { const V = (Vmax * i) / N; xs.push(V); ys.push(A.franckHertz(V, { Eex, mfp: p.mfp, Vr: p.Vr, n: 500 }, rng).frac); }
      /* suavizado de 3 puntos y localización de mínimos locales */
      const sm = ys.map((y, i) => (ys[Math.max(0, i - 1)] + y + ys[Math.min(N - 1, i + 1)]) / 3), mins = [];
      for (let i = 2; i < N - 2; i++) if (sm[i] < sm[i - 1] && sm[i] <= sm[i + 1] && sm[i] < 0.6 && sm[i] < sm[i - 2] + 0.3) { if (!mins.length || xs[i] - mins[mins.length - 1] > Eex * 0.6) mins.push(xs[i]); }
      curve = { xs, ys: sm, mins, Eex, Vmax }; key = p.gas + p.Vr + p.mfp;
    };
    sim.onChange = () => { curve = null; };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      if (!curve || key !== p.gas + p.Vr + p.mfp) compute();
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.66, h: H, xmin: 0, xmax: curve.Vmax, ymin: 0, ymax: 1.1, xlabel: 'voltaje acelerador V (V)', ylabel: 'corriente en el ánodo (fracción)', ml: 52, mr: 8, title: 'Corriente frente al voltaje (Monte Carlo)' });
      pl.frame();
      for (let k = 1; k * curve.Eex < curve.Vmax; k++) pl.vline(k * curve.Eex, { color: '--ink-3', dash: [2, 4] });
      pl.xy(curve.xs, curve.ys, { color: '--accent', width: 2.8 });
      for (const m of curve.mins) pl.dot(m, 0.05, { color: '--c3', r: 4 });
      /* Derecha: niveles */
      const px = W * 0.7, py = H * 0.12, ph = H * 0.72, scl = ph / (curve.Eex * 1.35);
      EM.text(ctx, 'Niveles del átomo', W * 0.83, 16, { size: 12, align: 'center', color: '--ink-2' });
      ctx.save(); ctx.strokeStyle = EM.col('--ink'); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px + 20, py + ph); ctx.lineTo(px + 110, py + ph); ctx.moveTo(px + 20, py + ph - curve.Eex * scl); ctx.lineTo(px + 110, py + ph - curve.Eex * scl); ctx.stroke(); ctx.restore();
      EM.text(ctx, 'estado fundamental', px + 115, py + ph, { size: 11, color: '--ink-2' }); EM.text(ctx, `E_ex = ${EM.fix(curve.Eex, 3)} eV`, px + 115, py + ph - curve.Eex * scl, { size: 11, color: '--ink-2' });
      EM.draw.arrow(ctx, px + 65, py + ph - curve.Eex * scl + 4, px + 65, py + ph - 4, { color: '--c2', width: 2.4, head: 7 }); EM.text(ctx, `${EM.fix(HC / curve.Eex, 1)} nm`, px + 72, py + ph - (curve.Eex * scl) / 2, { size: 12, color: '--c2' });
      const sp = curve.mins.length > 1 ? (curve.mins[curve.mins.length - 1] - curve.mins[0]) / (curve.mins.length - 1) : NaN;
      sim.set('E', `${EM.fix(curve.Eex, 3)} eV · ${EM.fix(HC / curve.Eex, 1)} nm`);
      sim.set('mn', curve.mins.length ? curve.mins.map((m) => EM.fix(m, 1)).join(' · ') + ' V' : '—');
      sim.set('sp', isFinite(sp) ? `${EM.fix(sp, 2)} V (E_ex = ${EM.fix(curve.Eex, 3)} eV)` : '—');
    });
  });

  /* 10.4 Ley de Moseley */
  EM.defineSim('moseley', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('zmax', { label: 'Elementos incluidos en el ajuste: hasta Z =', min: 20, max: 79, step: 1, value: 30, fmt: (v) => v.toFixed(0) });
    sim.slider('E', { label: 'Energía Kα de un elemento desconocido', min: 1, max: 70, step: 0.01, value: 8.05, unit: 'keV', fmt: (v) => EM.fix(v, 2) });
    sim.out('fit', 'Ajuste √E = a(Z − σ): pendiente a · constante de apantallamiento σ', { hl: true });
    sim.out('th', 'Teoría de Bohr: a = √(¾Ry) = 3.194 eV^½ · σ = 1');
    sim.out('Z', 'Elemento desconocido: Z = 1 + √(E/¾Ry) · elemento más próximo');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, ents = Object.entries(A.KALPHA).sort((a, b) => a[1][0] - b[1][0]), sel = ents.filter(([s, v]) => v[0] <= p.zmax);
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.62, h: H, xmin: 8, xmax: 82, ymin: 0, ymax: 80, xlabel: 'número atómico Z', ylabel: '√E(Kα) (eV^½)', ml: 50, mr: 8, title: 'Ley de Moseley' });
      pl.frame();
      pl.fn((z) => Math.sqrt(0.75 * K.Ry_eV) * (z - 1), { color: '--c2', width: 2, dash: [6, 4], n: 100 });
      for (const [s, v] of ents) pl.dot(v[0], Math.sqrt(v[1]), { color: v[0] <= p.zmax ? '--accent' : '--ink-3', r: 4.5, label: s, dx: 5, dy: 13 });
      const fit = sel.length > 1 ? A.moseleyFit(sel.map((e) => e[1][0]), sel.map((e) => e[1][1])) : { a: NaN, sigma: NaN };
      if (isFinite(fit.a)) pl.fn((z) => fit.a * (z - fit.sigma), { color: '--accent', width: 2.6, n: 100 });
      const Zs = 1 + Math.sqrt((p.E * 1000) / (0.75 * K.Ry_eV)); pl.vline(Zs, { color: '--c3', label: 'Z = ' + EM.fix(Zs, 1), dash: [3, 3] });
      pl.legend([{ label: 'Bohr: √(¾Ry)(Z − 1)', color: '--c2', dash: [6, 4] }, { label: 'ajuste a los datos', color: '--accent' }], 'tl');
      let near = null, dm = 1e9; for (const [s, v] of ents) { const dz = Math.abs(v[0] - Zs); if (dz < dm) { dm = dz; near = [s, v]; } }
      /* tabla lateral */
      EM.text(ctx, 'Kα1 medido (keV)', W * 0.81, 18, { size: 12, align: 'center', color: '--ink-2' });
      ents.forEach(([s, v], i) => EM.text(ctx, `${s} (${v[0]}):  ${EM.fix(v[1] / 1e3, 3)}   Bohr ${EM.fix((0.75 * K.Ry_eV * (v[0] - 1) ** 2) / 1e3, 3)}`, W * 0.66, 38 + i * Math.min(20, (H - 50) / ents.length), { size: 10.5, color: v[0] <= p.zmax ? '--ink' : '--ink-3' }));
      sim.set('fit', isFinite(fit.a) ? `${EM.fix(fit.a, 4)} eV^½ · ${EM.fix(fit.sigma, 3)}` : '—');
      sim.set('th', `${EM.fix(Math.sqrt(0.75 * K.Ry_eV), 4)} eV^½ · 1`);
      sim.set('Z', `${EM.fix(Zs, 2)} · ${near[0]} (Z = ${near[1][0]}, Kα1 = ${EM.fix(near[1][1] / 1e3, 3)} keV)`);
    });
  });
})();
