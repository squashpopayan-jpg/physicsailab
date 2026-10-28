/* Capítulo 32 — Superficies e interfases */
(function () {
  'use strict';
  const EM = window.EM, FQ = EM.fq, S = FQ.surf, R = 8.314462618;
  const LQ = Object.entries(S.LIQ);

  /* 32.1 Laplace y capilaridad */
  EM.defineSim('capilar', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('l', { label: 'Líquido (25 °C)', options: LQ.map(([k, v]) => [k, `${v.nm} (γ = ${(v.gamma * 1e3).toFixed(1)} mN/m)`]), value: 'agua' });
    sim.slider('r', { label: 'Radio del capilar o de la gota', min: 0.01, max: 5, step: 0.01, value: 0.5, log: true, unit: 'mm', fmt: (v) => EM.sci(v, 2) });
    sim.slider('th', { label: 'Ángulo de contacto con la pared', min: 0, max: 180, step: 1, value: 0, unit: '°', fmt: (v) => v.toFixed(0) });
    sim.out('dP', 'Presión de Laplace de una gota esférica 2γ/<i>r</i> · de una burbuja de jabón (dos caras) 4γ/<i>r</i>', { hl: true });
    sim.out('h', 'Ascenso capilar de Jurin <i>h</i> = 2γcos θ/(ρ<i>gr</i>) · con la corrección de Rayleigh <i>h</i> − <i>r</i>/3');
    sim.out('lc', 'Longitud capilar <i>l</i><sub>c</sub> = √(γ/ρ<i>g</i>) · número de Bond Bo = (<i>r</i>/<i>l</i><sub>c</sub>)²');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, L = S.LIQ[p.l], r = p.r * 1e-3, th = p.th, rs = Array.from({ length: 120 }, (_, i) => 0.01 * Math.pow(500, i / 119));
      EM.draw.clear(cv);
      const hOf = (rr) => S.jurin(L.gamma, th, L.rho, rr * 1e-3) * 1e3;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.6, h: H, xmin: 0.01, xmax: 5, ymin: 1e-1, ymax: 1e4, xlog: true, ylog: true, xlabel: 'radio (mm)', ylabel: '|h| (mm)', ml: 52, title: 'Ascenso o descenso capilar (valor absoluto)' });
      pl.frame(); pl.xy(rs, rs.map((x) => Math.max(Math.abs(hOf(x)), 1e-3)), { color: '--c1', width: 2.6 }); pl.xy(rs, rs.map((x) => Math.max(Math.abs(hOf(x) - (th < 90 ? x / 3 : -x / 3)), 1e-3)), { color: '--c2', width: 1.8, dash: [5, 4] }); pl.dot(p.r, Math.max(Math.abs(hOf(p.r)), 1e-3), { color: '--accent' }); pl.vline(S.lc(L.gamma, L.rho) * 1e3, { color: '--ink-3', dash: [3, 3], label: 'l_c' });
      pl.legend([{ label: 'Jurin', color: '--c1' }, { label: 'con corrección de Rayleigh', color: '--c2', dash: [5, 4] }], 'tr');
      /* tubo con el menisco */
      const bx = W * 0.66, bw = W * 0.3, by = 30, bh = H - 60, hh = Math.max(-0.45, Math.min(0.45, hOf(p.r) / 40)) * bh * 0.5, w0 = Math.max(10, Math.min(60, 40 * Math.sqrt(p.r))), cx = bx + bw / 2, lvl = by + bh * 0.62;
      ctx.fillStyle = EM.alpha('--c1', 0.25); ctx.fillRect(bx, lvl, bw, by + bh - lvl); ctx.strokeStyle = EM.col('--ink-3'); ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
      ctx.fillStyle = EM.alpha('--c1', 0.35); ctx.fillRect(cx - w0 / 2, lvl - hh, w0, by + bh - (lvl - hh)); ctx.strokeRect(cx - w0 / 2 - 4, by + 10, 4, bh - 10); ctx.strokeRect(cx + w0 / 2, by + 10, 4, bh - 10);
      const yc = lvl - hh, sag = th < 90 ? 8 : -8; ctx.strokeStyle = EM.col('--accent'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - w0 / 2, yc); ctx.quadraticCurveTo(cx, yc + (th < 90 ? 1 : -1) * Math.abs(sag) * 1.6, cx + w0 / 2, yc); ctx.stroke();
      EM.text(ctx, hOf(p.r) >= 0 ? 'sube ' + EM.fix(hOf(p.r), 1) + ' mm' : 'baja ' + EM.fix(-hOf(p.r), 1) + ' mm', cx, by + bh + 16, { size: 11, align: 'center', color: '--ink-2' });
      sim.set('dP', EM.fix(S.laplace(L.gamma, r) / 1e3, 3) + ' kPa · ' + EM.fix(S.laplace(L.gamma, r, 2) / 1e3, 3) + ' kPa');
      sim.set('h', EM.fix(hOf(p.r), 2) + ' mm · ' + EM.fix(hOf(p.r) - (th < 90 ? p.r / 3 : -p.r / 3), 2) + ' mm');
      sim.set('lc', EM.fix(S.lc(L.gamma, L.rho) * 1e3, 2) + ' mm · ' + EM.sci(Math.pow(r / S.lc(L.gamma, L.rho), 2), 2) + (r > S.lc(L.gamma, L.rho) ? ' (la gravedad domina: Jurin ya no vale)' : ''));
    });
  });

  /* 32.2 Kelvin */
  EM.defineSim('kelvin', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('T', { label: 'Temperatura', min: 273.15, max: 373.15, step: 0.5, value: 298.15, unit: 'K', fmt: (v) => v.toFixed(1) });
    sim.slider('r', { label: 'Radio de la gota o del poro', min: 0.5, max: 1000, step: 0.1, value: 10, log: true, unit: 'nm', fmt: (v) => EM.sci(v, 2) });
    sim.out('p', 'Gota de agua de este radio: <i>P</i>/<i>P</i>₀ = exp(2γ<i>V</i><sub>m</sub>/<i>rRT</i>) · tensión superficial (IAPWS)', { hl: true });
    sim.out('c', 'Condensación capilar en un poro cilíndrico (mojado total) del mismo radio: humedad relativa de condensación');
    sim.out('r', 'Radio de Kelvin de una gota en equilibrio con humedad relativa 101 % · 110 % · 300 %: (nm)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, gam = S.gammaWater(p.T), Vm = 0.018015 / 997, K = (r) => Math.exp((2 * gam * Vm) / (r * 1e-9 * R * p.T));
      EM.draw.clear(cv);
      const rs = Array.from({ length: 200 }, (_, i) => 0.5 * Math.pow(2000, i / 199)), pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.5, xmax: 1000, ymin: 0.4, ymax: 4, ylog: true, xlog: true, xlabel: 'radio r (nm)', ylabel: 'P/P₀ (humedad relativa de equilibrio)', ml: 52 });
      pl.frame(); pl.hline(1, { color: '--ink-3' }); pl.xy(rs, rs.map((r) => Math.min(K(r), 4)), { color: '--c1', width: 2.8 }); pl.xy(rs, rs.map((r) => 1 / K(r)), { color: '--c2', width: 2.8 }); pl.vline(p.r, { color: '--accent', dash: [3, 3] });
      pl.legend([{ label: 'gota (superficie convexa): P/P₀ > 1', color: '--c1' }, { label: 'poro mojante (menisco cóncavo): P/P₀ < 1', color: '--c2' }], 'tr');
      const rk = (RH) => (2 * gam * Vm) / (R * p.T * Math.log(RH)) * 1e9;
      sim.set('p', EM.fix(K(p.r), 4) + ' · ' + EM.fix(gam * 1e3, 2) + ' mN/m');
      sim.set('c', EM.fix(100 / K(p.r), 2) + ' %');
      sim.set('r', [1.01, 1.1, 3].map((x) => EM.fix(rk(x), 1)).join(' · '));
    });
  });

  /* 32.3 Tensioactivo: Szyszkowski y Gibbs */
  EM.defineSim('tensioactivo', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('G', { label: 'Exceso superficial máximo Γ∞', min: 1, max: 8, step: 0.05, value: 3.2, unit: 'µmol/m²', fmt: (v) => v.toFixed(2) });
    sim.slider('a', { label: 'Constante de adsorción a (concentración de media saturación)', min: 0.01, max: 10, step: 0.01, value: 0.11, log: true, unit: 'mM', fmt: (v) => EM.sci(v, 2) });
    sim.slider('cmc', { label: 'Concentración micelar crítica (CMC)', min: 0.1, max: 50, step: 0.1, value: 8.2, log: true, unit: 'mM', fmt: (v) => EM.sci(v, 2) });
    sim.slider('c', { label: 'Concentración marcada', min: 0.001, max: 100, step: 0.001, value: 1, log: true, unit: 'mM', fmt: (v) => EM.sci(v, 2) });
    sim.out('g', 'Tensión superficial γ a la concentración marcada · Γ (Gibbs) · cobertura Γ/Γ∞', { hl: true });
    sim.out('a', 'Área por molécula en saturación 1/(Γ∞<i>N</i><sub>A</sub>) · γ en la CMC · presión superficial Π = γ₀ − γ');
    sim.out('b', 'Comprobación de Gibbs: −(1/<i>RT</i>) dγ/d ln <i>c</i> (derivada numérica) · Γ de Langmuir');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, T = 298.15, g0 = 0.07197, G = p.G * 1e-6, a = p.a * 1e-3, cm = p.cmc * 1e-3, gam = (c) => S.szyszkowski(g0, G, a, Math.min(c, cm), T), gcmc = gam(cm);
      EM.draw.clear(cv);
      const cs = Array.from({ length: 200 }, (_, i) => 1e-6 * Math.pow(1e5, i / 199)), pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1e-6, xmax: 1e-1, ymin: Math.min(0.02, gcmc * 0.9), ymax: 0.075, xlog: true, xlabel: 'concentración (mol/L)', ylabel: 'tensión superficial (N/m)', ml: 52 });
      pl.frame(); pl.xy(cs, cs.map(gam), { color: '--c1', width: 2.8 }); pl.vline(cm, { color: '--c2', dash: [4, 3], label: 'CMC' }); const cc = p.c * 1e-3; pl.dot(cc, gam(cc), { color: '--accent' });
      const d = 1e-4, num = -(gam(cc * Math.exp(d)) - gam(cc * Math.exp(-d))) / (2 * d) / (R * T), Gam = S.gibbsGamma(G, a, Math.min(cc, cm));
      sim.set('g', EM.fix(gam(cc) * 1e3, 2) + ' mN/m · ' + EM.fix(Gam * 1e6, 3) + ' µmol/m² · ' + EM.fix(Gam / G, 3));
      sim.set('a', EM.fix(S.areaPerMol(G), 1) + ' Å² · ' + EM.fix(gcmc * 1e3, 1) + ' mN/m · ' + EM.fix((g0 - gam(cc)) * 1e3, 1) + ' mN/m');
      sim.set('b', EM.fix(num * 1e6, 3) + ' · ' + EM.fix(Gam * 1e6, 3) + ' µmol/m²' + (cc > cm ? ' (por encima de la CMC γ y Γ no cambian: el tensioactivo extra forma micelas)' : ''));
    });
  });

  /* 32.4 Young, Wenzel y Cassie */
  EM.defineSim('young', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('lv', { label: 'γ líquido–vapor', min: 15, max: 75, step: 0.5, value: 72, unit: 'mN/m', fmt: (v) => v.toFixed(1) });
    sim.slider('sv', { label: 'γ sólido–vapor', min: 10, max: 120, step: 0.5, value: 40, unit: 'mN/m', fmt: (v) => v.toFixed(1) });
    sim.slider('sl', { label: 'γ sólido–líquido', min: 0, max: 100, step: 0.5, value: 30, unit: 'mN/m', fmt: (v) => v.toFixed(1) });
    sim.slider('rr', { label: 'Factor de rugosidad de Wenzel r (área real/aparente)', min: 1, max: 3, step: 0.05, value: 1, fmt: (v) => v.toFixed(2) });
    sim.out('th', 'Ángulo de contacto de Young θ, cos θ = (γ<sub>sv</sub> − γ<sub>sl</sub>)/γ<sub>lv</sub> · con rugosidad (Wenzel) cos θ* = <i>r</i> cos θ', { hl: true });
    sim.out('w', 'Trabajo de adhesión <i>W</i><sub>a</sub> = γ<sub>lv</sub>(1 + cos θ) · coeficiente de esparcimiento <i>S</i> = γ<sub>sv</sub> − γ<sub>sl</sub> − γ<sub>lv</sub>');
    sim.out('reg', 'Régimen');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h, y = S.young(p.sv, p.sl, p.lv), cw = S.wenzel(y.cos, p.rr), th = (Math.acos(cw) * 180) / Math.PI;
      EM.draw.clear(cv);
      const dr = (cx, thd, label, col) => { const t = (thd * Math.PI) / 180, base = H * 0.72; ctx.fillStyle = EM.alpha('--ink-3', 0.25); ctx.fillRect(cx - W * 0.22, base, W * 0.44, 14); const Rr = 90 / Math.max(Math.sin(Math.max(t, 0.12)), 0.12) * 0.55, a = Rr * Math.sin(t); ctx.fillStyle = EM.alpha(col, 0.35); ctx.strokeStyle = EM.col(col); ctx.lineWidth = 2; ctx.beginPath(); if (thd <= 1) { ctx.rect(cx - 90, base - 2, 180, 2); } else { const cy = base + Rr * Math.cos(t); ctx.arc(cx, cy, Rr, -Math.PI / 2 - t, -Math.PI / 2 + t); ctx.closePath(); } ctx.fill(); ctx.stroke(); EM.text(ctx, label, cx, base + 34, { size: 12, align: 'center' }); };
      dr(W * 0.27, th0(y), 'superficie lisa: θ = ' + EM.fix(th0(y), 0) + '°', '--c1'); dr(W * 0.73, th, 'con rugosidad: θ* = ' + EM.fix(th, 0) + '°', '--c2');
      function th0(o) { return o.th; }
      sim.set('th', EM.fix(y.th, 1) + '° (cos = ' + EM.fix(y.cos, 3) + ') · ' + EM.fix(th, 1) + '°');
      sim.set('w', EM.fix(y.W, 1) + ' mN/m · ' + EM.fix(y.S, 1) + ' mN/m');
      sim.set('reg', y.S >= 0 ? 'esparcimiento total (S ≥ 0): θ = 0, el líquido moja y cubre la superficie' : th < 90 ? 'mojante parcial (θ < 90°): la rugosidad mejora el mojado (Wenzel)' : 'no mojante (θ > 90°): la rugosidad lo empeora; con aire atrapado (Cassie) se llega a la superhidrofobia (> 150°)');
    });
  });
})();
