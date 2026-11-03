/* Capítulo 12 — Pozos finitos, barreras y efecto túnel */
(function () {
  'use strict';
  const EM = window.EM, U = EM.fm.tun, K = EM.qm.K;

  /* 12.1 Barrera rectangular */
  EM.defineSim('barrera', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('E', { label: 'Energía de la partícula E', min: 0.05, max: 10, step: 0.01, value: 1, unit: 'eV', fmt: (v) => EM.fix(v, 2) });
    sim.slider('V0', { label: 'Altura de la barrera V₀', min: 0.5, max: 10, step: 0.05, value: 5, unit: 'eV', fmt: (v) => EM.fix(v, 2) });
    sim.slider('a', { label: 'Espesor de la barrera a', min: 0.05, max: 2, step: 0.01, value: 0.3, unit: 'nm', fmt: (v) => EM.fix(v, 2) });
    sim.out('T', 'Coeficiente de transmisión T · reflexión R = 1 − T', { hl: true });
    sim.out('k', 'κ = √(2m(V₀ − E))/ħ · profundidad de penetración 1/κ');
    sim.out('th', 'Aproximación de barrera gruesa 16E(V₀ − E)/V₀² e^{−2κa} · cociente con la exacta');
    sim.out('cl', 'Clásicamente: T = 0 si E < V₀ y T = 1 si E > V₀');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, sc = U.scatter(p.E, p.V0, p.a), xs = [], ys = [], x0 = -1.2, x1 = p.a + 1.2;
      EM.draw.clear(cv);
      const N = 700; let mx = 0; for (let i = 0; i <= N; i++) { const x = x0 + ((x1 - x0) * i) / N, v = sc.psi(x), d = v[0] * v[0] + v[1] * v[1]; xs.push(x); ys.push(d); mx = Math.max(mx, d); }
      const top = Math.max(1.5 * mx, 0.5), pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.58, h: H, xmin: x0, xmax: x1, ymin: 0, ymax: top, xlabel: 'posición x (nm)', ylabel: '|ψ|² (incidente = 1)', ml: 52, mr: 8, title: 'Onda estacionaria de dispersión' });
      pl.frame(); pl.band(0, p.a, { color: '--c3', alpha: 0.18 });
      pl.xy(xs, ys, { color: '--accent', width: 2.6 });
      pl.hline(1, { color: '--ink-3', dash: [3, 3] });
      pl.label(p.a / 2, top * 0.93, `V₀ = ${EM.fix(p.V0, 2)} eV`, { align: 'center', color: '--c3' });
      /* T(E) */
      const pr = new EM.Plot(ctx, { x: W * 0.62, y: 0, w: W * 0.38, h: H, xmin: 0, xmax: 2 * p.V0, ymin: 0, ymax: 1.05, xlabel: 'energía E (eV)', ylabel: 'T', ml: 44, mr: 8, title: 'T(E)' });
      pr.frame(); pr.vline(p.V0, { color: '--c3', label: 'V₀', dash: [3, 3] });
      pr.fn((E) => U.T(Math.max(E, 1e-4), p.V0, p.a), { color: '--accent', width: 2.8, n: 600 });
      pr.dot(p.E, sc.T, { color: '--c2', r: 5.5 });
      const tun = p.E < p.V0, kap = U.kappa(p.E, p.V0), th = tun ? U.Tthick(p.E, p.V0, p.a) : NaN;
      sim.set('T', `${EM.sci(sc.T, 4)} · ${EM.sci(1 - sc.T, 6)}`);
      sim.set('k', tun ? `${EM.fix(kap, 3)} nm⁻¹ · ${EM.fix(1 / kap, 4)} nm` : 'E > V₀: no hay decaimiento exponencial (k₂ = ' + EM.fix(Math.sqrt((p.E - p.V0) / U.hb2m()), 3) + ' nm⁻¹)');
      sim.set('th', tun ? `${EM.sci(th, 4)} · ${EM.fix(th / sc.T, 4)}` : '—');
      sim.set('cl', tun ? 'T clásico = 0: la partícula debería rebotar' : 'T clásico = 1; la mecánica cuántica da reflexión R = ' + EM.sci(1 - sc.T, 3));
    });
  });

  /* 12.2 Pozo finito */
  EM.defineSim('pozo', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('V0', { label: 'Profundidad del pozo V₀', min: 0.5, max: 1000, step: 0.01, value: 10, log: true, unit: 'eV', fmt: (v) => EM.sci(v, 3) });
    sim.slider('w', { label: 'Anchura del pozo 2a', min: 0.1, max: 3, step: 0.01, value: 1, unit: 'nm', fmt: (v) => EM.fix(v, 2) });
    sim.slider('n', { label: 'Estado ligado n que se dibuja', min: 1, max: 12, step: 1, value: 1, fmt: (v) => v.toFixed(0) });
    sim.out('N', 'Número de estados ligados ⌈2z₀/π⌉ con z₀ = (a/ħ)√(2mV₀)', { hl: true });
    sim.out('E', 'Energía E_n (desde el fondo) · pozo infinito de igual anchura · cociente');
    sim.out('P', 'Probabilidad de estar fuera del pozo (región clásicamente prohibida) · profundidad de penetración 1/κ');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, a = p.w / 2, lv = U.wellLevels(p.V0, a), N = lv.length, n = Math.min(Math.round(p.n), N), s = lv[n - 1], z0 = U.z0(p.V0, a);
      EM.draw.clear(cv);
      const xr = a + Math.max(0.6, 2.5 / Math.sqrt(p.V0 / U.hb2m() - (s ? s.E / U.hb2m() : 0)) || 0.6), Ymax = p.V0 * 1.12;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.66, h: H, xmin: -xr, xmax: xr, ymin: 0, ymax: Ymax, xlabel: 'posición x (nm)', ylabel: 'energía (eV, desde el fondo del pozo)', ml: 56, mr: 8, title: 'Pozo de potencial finito' });
      pl.frame();
      pl.path([[-xr, p.V0], [-a, p.V0], [-a, 0], [a, 0], [a, p.V0], [xr, p.V0]], { color: '--ink', width: 2.6 });
      lv.forEach((q) => pl.path([[-a, q.E], [a, q.E]], { color: q.n === n ? '--accent' : '--c2', width: q.n === n ? 2.6 : 1.4 }));
      if (s) {
        const k = Math.sqrt(s.E / U.hb2m()), kap = Math.sqrt((p.V0 - s.E) / U.hb2m()), even = s.parity === 'par', A = 1;
        const f = (x) => { const ax = Math.abs(x); if (ax <= a) return even ? Math.cos(k * x) : Math.sin(k * x); const val = (even ? Math.cos(k * a) : Math.sin(k * a)) * Math.exp(-kap * (ax - a)); return even ? val : Math.sign(x) * val; };
        const sc = (Ymax * 0.1) / A; pl.fn((x) => s.E + sc * f(x) * 2.2, { color: '--accent', width: 2.8, n: 500 });
      }
      /* Derecha: E_n frente a n y comparación con el pozo infinito */
      const pr = new EM.Plot(ctx, { x: W * 0.69, y: 0, w: W * 0.31, h: H, xmin: 0, xmax: 13, ymin: 0, ymax: p.V0 * 1.05, xlabel: 'n', ylabel: 'E_n (eV)', ml: 46, mr: 8, title: 'Niveles frente a n' });
      pr.frame(); pr.hline(p.V0, { color: '--ink-3', dash: [3, 3], label: 'V₀', labelRight: true });
      pr.fn((x) => (x * x * Math.PI * Math.PI * U.hb2m()) / (p.w * p.w), { color: '--c2', width: 1.8, dash: [5, 3], n: 200 });
      pr.xy(lv.map((q) => q.n), lv.map((q) => q.E), { color: '--accent', width: 0 }); lv.forEach((q) => pr.dot(q.n, q.E, { color: '--accent', r: 4 }));
      if (s) {
        const k = Math.sqrt(s.E / U.hb2m()), kap = Math.sqrt((p.V0 - s.E) / U.hb2m()), even = s.parity === 'par', ca = Math.cos(k * a) ** 2, sa = Math.sin(k * a) ** 2, s2 = Math.sin(2 * k * a) / (2 * k);
        const inn = even ? a + s2 : a - s2, out = (even ? ca : sa) / kap, Pout = out / (inn + out), Einf = (n * n * Math.PI * Math.PI * U.hb2m()) / (p.w * p.w);
        sim.set('N', `${N} (z₀ = ${EM.fix(z0, 3)})`);
        sim.set('E', `${EM.fix(s.E, 5)} eV (${s.parity}) · ${EM.fix(Einf, 5)} eV · ${EM.fix(s.E / Einf, 4)}`);
        sim.set('P', `${EM.fix(100 * Pout, 3)} % · ${EM.fix(1 / kap, 4)} nm`);
      } else { sim.set('N', `${N}`); sim.set('E', '—'); sim.set('P', '—'); }
    });
  });

  /* 12.3 Microscopio de efecto túnel */
  EM.defineSim('stm', function (sim) {
    const cv = sim.canvas({ aspect: 2.1 });
    sim.slider('phi', { label: 'Función de trabajo promedio φ', min: 2.5, max: 6, step: 0.05, value: 4.5, unit: 'eV', fmt: (v) => EM.fix(v, 2) });
    sim.slider('d', { label: 'Distancia punta–muestra d', min: 0.3, max: 1, step: 0.005, value: 0.5, unit: 'nm', fmt: (v) => EM.fix(v, 3) });
    sim.slider('A', { label: 'Amplitud de la corrugación atómica de la superficie', min: 1, max: 40, step: 0.5, value: 10, unit: 'pm', fmt: (v) => EM.fix(v, 1) });
    sim.out('k', 'Constante de decaimiento κ = √(2mφ)/ħ · una década de corriente cada ln10/2κ', { hl: true });
    sim.out('r', 'Cociente de corrientes entre d y d + 0.1 nm (1 Å)');
    sim.out('c', 'Modulación de la corriente al recorrer la corrugación (pico a valle)');
    sim.out('p', 'Sensibilidad vertical: cambio de corriente por 1 pm de altura');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, kap = U.kappaStm(p.phi), A = p.A / 1000, lat = 0.25;
      EM.draw.clear(cv);
      /* Esquema: superficie con corrugación y punta */
      const cx = W * 0.27, cy = H * 0.62, sx = (W * 0.42) / 1.5, sy = H * 0.5;
      const h = (x) => A * Math.cos((2 * Math.PI * x) / lat);
      EM.text(ctx, 'Punta sobre la superficie (escala vertical exagerada ×6)', cx, 16, { size: 12, align: 'center', color: '--ink-2' });
      ctx.save(); ctx.fillStyle = EM.alpha('--c1', 0.35); ctx.strokeStyle = EM.col('--c1'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 0.75 * sx, H);
      for (let i = -150; i <= 150; i++) { const x = (i / 150) * 0.75; ctx.lineTo(cx + x * sx, cy - h(x) * 6 * sy); } ctx.lineTo(cx + 0.75 * sx, H); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.fillStyle = EM.col('--ink'); ctx.beginPath(); ctx.moveTo(cx - 8, cy - p.d * sy * 0.3 - 70); ctx.lineTo(cx + 8, cy - p.d * sy * 0.3 - 70); ctx.lineTo(cx + 1, cy - p.d * sy * 0.3 - 8); ctx.lineTo(cx - 1, cy - p.d * sy * 0.3 - 8); ctx.closePath(); ctx.fill(); ctx.restore();
      EM.text(ctx, `d = ${EM.fix(p.d, 3)} nm`, cx + 22, cy - p.d * sy * 0.15 - 40, { size: 11.5, color: '--c3' });
      /* Corriente al barrer */
      const pl = new EM.Plot(ctx, { x: W * 0.52, y: 0, w: W * 0.48, h: H * 0.5, xmin: 0, xmax: 1, ymin: 0, ymax: 3, xlabel: 'posición lateral (nm)', ylabel: 'corriente relativa', ml: 48, mr: 8, mb: 34, title: 'Barrido a altura constante' });
      pl.frame(); const Ic = (x) => Math.exp(2 * kap * h(x)); pl.fn(Ic, { color: '--accent', width: 2.8, n: 400 });
      const py = new EM.Plot(ctx, { x: W * 0.52, y: H * 0.5, w: W * 0.48, h: H * 0.5, xmin: 0.3, xmax: 1, ymin: 1e-7, ymax: 10, ylog: true, xlabel: 'distancia d (nm)', ylabel: 'I(d)/I(0.3 nm)', ml: 48, mr: 8, mb: 34, title: 'Dependencia exponencial' });
      py.frame(); py.fn((dd) => Math.exp(-2 * kap * (dd - 0.3)), { color: '--c2', width: 2.6, n: 200 }); py.dot(p.d, Math.exp(-2 * kap * (p.d - 0.3)), { color: '--accent' });
      sim.set('k', `${EM.fix(kap, 3)} nm⁻¹ (${EM.fix(kap / 10, 3)} Å⁻¹) · ${EM.fix(Math.log(10) / (2 * kap), 4)} nm`);
      sim.set('r', `${EM.fix(U.stmRatio(p.phi, 0.1), 3)} (×${EM.fix(U.stmRatio(p.phi, 0.1), 1)} por Å)`);
      sim.set('c', `×${EM.fix(Math.exp(4 * kap * A), 3)} (${EM.fix((Math.exp(4 * kap * A) - 1) * 100, 1)} %)`);
      sim.set('p', `${EM.fix((Math.exp(2 * kap * 0.001) - 1) * 100, 2)} % por pm`);
    });
  });
})();
