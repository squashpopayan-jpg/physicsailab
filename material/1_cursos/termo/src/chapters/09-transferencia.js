/* Capítulo 9 — Mecanismos de transferencia de calor */
(function () {
  'use strict';
  const EM = window.EM, TH = EM.th;
  /* materiales de construcción: k (W/m·K), ρ (kg/m³), c (J/kg·K) — ISO 10456 y CIBSE Guide A */
  const MATS = {
    ladrillo: ['Ladrillo macizo', 0.72, 1920, 835], adobe: ['Adobe', 0.6, 1600, 900], bahareque: ['Bahareque (tierra y guadua)', 0.5, 1400, 1000],
    concreto: ['Concreto', 1.4, 2300, 880], revoque: ['Revoque de cemento', 0.87, 1800, 840], yeso: ['Panel de yeso', 0.17, 800, 1090],
    madera: ['Madera de pino', 0.12, 500, 1700], eps: ['Poliestireno expandido', 0.035, 20, 1300], lana: ['Lana mineral', 0.04, 30, 840], vidrio: ['Vidrio', 0.96, 2500, 840]
  };

  /* 9.1 Pared compuesta */
  EM.defineSim('pared-compuesta', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    const opts = Object.entries(MATS).map(([k, v]) => [k, v[0] + ' (k = ' + v[1] + ')']);
    sim.group('Capas (de afuera hacia adentro)');
    sim.select('m1', { label: 'Capa 1', options: [['none', '— ninguna —']].concat(opts), value: 'revoque' });
    sim.slider('e1', { label: 'Espesor 1', min: 0.5, max: 30, step: 0.5, value: 1.5, unit: 'cm', fmt: (v) => v.toFixed(1) });
    sim.select('m2', { label: 'Capa 2', options: [['none', '— ninguna —']].concat(opts), value: 'ladrillo' });
    sim.slider('e2', { label: 'Espesor 2', min: 0.5, max: 30, step: 0.5, value: 12, unit: 'cm', fmt: (v) => v.toFixed(1) });
    sim.select('m3', { label: 'Capa 3', options: [['none', '— ninguna —']].concat(opts), value: 'none' });
    sim.slider('e3', { label: 'Espesor 3', min: 0.5, max: 30, step: 0.5, value: 5, unit: 'cm', fmt: (v) => v.toFixed(1) });
    sim.select('m4', { label: 'Capa 4', options: [['none', '— ninguna —']].concat(opts), value: 'revoque' });
    sim.slider('e4', { label: 'Espesor 4', min: 0.5, max: 30, step: 0.5, value: 1.5, unit: 'cm', fmt: (v) => v.toFixed(1) });
    sim.group('Condiciones');
    sim.slider('To', { label: 'Temperatura exterior', min: -10, max: 40, step: 0.5, value: 8, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('Ti', { label: 'Temperatura interior', min: 10, max: 30, step: 0.5, value: 20, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.out('U', 'Transmitancia <i>U</i>', { hl: true });
    sim.out('q', 'Flujo de calor');
    sim.out('Ts', 'Temperatura de la cara interior');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const layers = [1, 2, 3, 4].filter((i) => p['m' + i] !== 'none').map((i) => ({ m: MATS[p['m' + i]], L: p['e' + i] / 100 }));
      const Rse = 0.04, Rsi = 0.13, Rs = layers.map((l) => l.L / l.m[1]);
      const R = Rse + Rsi + Rs.reduce((a, b) => a + b, 0), q = (p.Ti - p.To) / R;
      const Lt = layers.reduce((a, l) => a + l.L, 0);
      const pad = Lt * 0.18;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: -pad, xmax: Lt + pad, ymin: Math.min(p.To, p.Ti) - 3, ymax: Math.max(p.To, p.Ti) + 3, xlabel: 'posición (m), exterior → interior', ylabel: 'T (°C)' });
      pl.frame();
      const cols = ['--c4', '--c2', '--c3', '--c5', '--c1'];
      let x = 0, T = p.To + q * Rse; const pts = [[-pad, p.To], [0, T]];
      layers.forEach((l, i) => {
        ctx.fillStyle = EM.alpha(cols[i % 5], 0.16); ctx.fillRect(pl.X(x), pl.iy, pl.X(x + l.L) - pl.X(x), pl.ih);
        pl.label(x + l.L / 2, pl.o.ymax - 1, l.m[0].split(' ')[0], { size: 10.5, align: 'center', color: '--ink-2' });
        x += l.L; T += q * Rs[i]; pts.push([x, T]);
      });
      pts.push([Lt + pad, p.Ti]);
      pl.path(pts, { color: '--accent', width: 2.6 });
      pts.forEach((pt) => pl.dot(pt[0], pt[1], { color: '--accent', r: 3 }));
      sim.set('U', EM.fix(1 / R, 3) + ' W/m²·K (R = ' + EM.fix(R, 3) + ' m²·K/W)');
      sim.set('q', EM.fix(q, 2) + ' W/m²');
      sim.set('Ts', EM.fix(p.Ti - q * Rsi, 2) + ' °C');
    });
  });

  /* 9.2 Café que se enfría */
  const coffeeModel = (o) => {
    const { T0, Ta, phi, P, lid, milkAt, tend } = o;
    const D = 0.08, H = 0.09, At = (Math.PI * D * D) / 4, As = Math.PI * D * H, eps = 0.95;
    let mC = 0.25, T = T0, t = 0; const Cm = 0.3 * 850, out = [];
    const losses = (T) => {
      const Tf = (T + Ta) / 2 + 273.15, ap = TH.airProps(Tf), rho = (P / 101325) * ap.rho, nu = ap.mu / rho, al = ap.k / (rho * ap.cp);
      const dT = Math.max(0.01, T - Ta), beta = 1 / Tf;
      const RaT = (TH.g * beta * dT * Math.pow(D / 4, 3)) / (nu * al), hT = (ap.k / (D / 4)) * 0.54 * Math.pow(RaT, 0.25);
      const RaS = (TH.g * beta * dT * Math.pow(H, 3)) / (nu * al), hS = (ap.k / H) * TH.nuVertical(RaS, ap.Pr);
      const rad = (A) => eps * TH.sigma * A * (Math.pow(T + 273.15, 4) - Math.pow(Ta + 273.15, 4));
      const qconv = hT * At * dT + hS * As * dT, qrad = rad(At) + rad(As);
      let qev = 0;
      if (!lid) {
        const Dab = 2.6e-5 * Math.pow(Tf / 298, 1.75) * (101325 / P), Le = al / Dab, hm = hT / (rho * ap.cp * Math.pow(Le, 2 / 3));
        const rvs = TH.psatW(T + 273.15) / (461.5 * (T + 273.15)), rva = (phi * TH.psatW(Ta + 273.15)) / (461.5 * (Ta + 273.15));
        qev = hm * At * Math.max(0, rvs - rva) * (2501e3 - 2380 * T);
      }
      if (lid) return { qconv: qconv * 0.9, qrad, qev: 0 };
      return { qconv, qrad, qev };
    };
    const dt = 2;
    let milked = false;
    while (t <= tend) {
      if (milkAt !== null && !milked && t >= milkAt) { T = (mC * 4186 * T + Cm * T + 0.03 * 3900 * 6) / (mC * 4186 + Cm + 0.03 * 3900); mC += 0.03; milked = true; }
      const L = losses(T);
      if (t % 20 === 0) out.push([t / 60, T, L.qconv, L.qrad, L.qev]);
      T -= ((L.qconv + L.qrad + L.qev) * dt) / (mC * 4186 + Cm);
      t += dt;
    }
    return out;
  };
  EM.defineSim('cafe', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('T0', { label: 'Temperatura inicial del café', min: 60, max: 94, step: 1, value: 85, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.slider('Ta', { label: 'Temperatura del ambiente', min: 5, max: 35, step: 0.5, value: 20, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.slider('phi', { label: 'Humedad relativa', min: 0.1, max: 1, step: 0.01, value: 0.7, fmt: (v) => (v * 100).toFixed(0) + ' %' });
    sim.slider('z', { label: 'Altitud', min: 0, max: 4000, step: 10, value: 1760, unit: 'm', fmt: (v) => v.toFixed(0) });
    sim.check('lid', { label: 'Taza con tapa', value: false });
    sim.seg('milk', { label: 'Leche fría (30 mL a 6 °C)', options: [['no', 'Sin leche'], ['ini', 'Al principio'], ['fin', 'A los 20 min']], value: 'no' });
    sim.out('t60', 'Tiempo hasta 60 °C', { hl: true });
    sim.out('T20', 'Temperatura a los 20 min');
    sim.out('q', 'Pérdidas iniciales: convección · radiación · evaporación');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const P = TH.isa(p.z).P;
      const run = (lid, milk) => coffeeModel({ T0: p.T0, Ta: p.Ta, phi: p.phi, P, lid, milkAt: milk === 'ini' ? 0 : milk === 'fin' ? 1200 : null, tend: 3600 });
      const a = run(p.lid, p.milk), other = run(!p.lid, p.milk);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w * 0.6, h: cv.h, xmin: 0, xmax: 60, ymin: p.Ta - 2, ymax: p.T0 + 3, xlabel: 't (min)', ylabel: 'T (°C)' });
      pl.frame();
      pl.path(other.map((o) => [o[0], o[1]]), { color: '--grid-2', width: 1.6 });
      pl.path(a.map((o) => [o[0], o[1]]), { color: '--accent', width: 2.6 });
      const k0 = (a[0][2] + a[0][3] + a[0][4]) / (0.25 * 4186 + 255);
      pl.fn((t) => p.Ta + (p.T0 - p.Ta) * Math.exp((-k0 * t * 60) / (p.T0 - p.Ta)), { color: '--c1', width: 1.2, dash: [5, 4] });
      pl.hline(60, { color: '--c3', label: '60 °C' });
      pl.legend([{ label: p.lid ? 'con tapa' : 'sin tapa', color: '--accent' }, { label: p.lid ? 'sin tapa' : 'con tapa', color: '--grid-2' }, { label: 'Newton con la tasa inicial', color: '--c1', dash: [5, 4] }], 'tr');
      /* barras de pérdidas */
      const p2 = new EM.Plot(ctx, { x: cv.w * 0.6, y: 0, w: cv.w * 0.4, h: cv.h, xmin: p.Ta, xmax: p.T0, ymin: 0, ymax: Math.max(40, (a[0][2] + a[0][3] + a[0][4]) * 1.1), xlabel: 'T del café (°C)', ylabel: 'pérdida (W)' });
      p2.frame();
      p2.path(a.map((o) => [o[1], o[2]]), { color: '--c1', width: 2 });
      p2.path(a.map((o) => [o[1], o[3]]), { color: '--c4', width: 2 });
      p2.path(a.map((o) => [o[1], o[4]]), { color: '--c3', width: 2 });
      p2.legend([{ label: 'convección', color: '--c1' }, { label: 'radiación', color: '--c4' }, { label: 'evaporación', color: '--c3' }], 'tl');
      const t60 = a.find((o) => o[1] <= 60), at20 = a.find((o) => o[0] >= 20);
      sim.set('t60', t60 ? EM.fix(t60[0], 1) + ' min' : '&gt; 60 min');
      sim.set('T20', at20 ? EM.fix(at20[1], 1) + ' °C' : '—');
      sim.set('q', a[0].slice(2).map((v) => EM.fix(v, 1)).join(' · ') + ' W');
    });
  });

  /* 9.3 Aleta */
  const FINM = { cu: ['Cobre', 400], al: ['Aluminio', 205], br: ['Latón', 110], st: ['Acero al carbono', 50], ss: ['Acero inoxidable', 16], pl: ['Plástico (ABS)', 0.2] };
  EM.defineSim('aleta', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Material', options: Object.entries(FINM).map(([k, v]) => [k, v[0] + ' (k = ' + v[1] + ')']), value: 'al' });
    sim.slider('D', { label: 'Diámetro', min: 1, max: 20, step: 0.5, value: 5, unit: 'mm', fmt: (v) => v.toFixed(1) });
    sim.slider('L', { label: 'Longitud', min: 1, max: 30, step: 0.5, value: 5, unit: 'cm', fmt: (v) => v.toFixed(1) });
    sim.slider('h', { label: 'Coeficiente de convección', min: 5, max: 300, step: 1, value: 15, unit: 'W/m²·K', log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('Tb', { label: 'Temperatura de la base', min: 30, max: 200, step: 1, value: 80, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.out('eta', 'Eficiencia de la aleta', { hl: true });
    sim.out('Q', 'Calor disipado');
    sim.out('Tt', 'Temperatura de la punta');
    sim.out('ef', 'Efectividad (calor con aleta / sin aleta)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Ta = 25;
      EM.draw.clear(cv);
      const k = FINM[p.m][1], D = p.D / 1000, L = p.L / 100, f = TH.fin(p.h, k, D, L), th = p.Tb - Ta;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: p.L, ymin: Ta - 3, ymax: p.Tb + 5, xlabel: 'x (cm)', ylabel: 'T (°C)' });
      pl.frame();
      for (const kk of Object.keys(FINM)) if (kk !== p.m) { const m = TH.fin(p.h, FINM[kk][1], D, L).m; pl.fn((x) => Ta + (th * Math.cosh(m * (L - x / 100))) / Math.cosh(m * L), { color: '--grid-2', width: 1 }); }
      const n = 60;
      for (let i = 0; i < n; i++) {
        const x = (i / n) * p.L, T = Ta + (th * Math.cosh(f.m * (L - x / 100))) / Math.cosh(f.m * L);
        ctx.fillStyle = EM.mix('--c1', '--c2', (T - Ta) / Math.max(1, th));
        ctx.fillRect(pl.X(x), pl.Y(Ta) - 16, pl.X(p.L / n) - pl.X(0) + 1, 12);
      }
      pl.fn((x) => Ta + (th * Math.cosh(f.m * (L - x / 100))) / Math.cosh(f.m * L), { color: '--accent', width: 2.6 });
      pl.hline(Ta, { label: 'aire 25 °C' });
      const Ac = (Math.PI * D * D) / 4;
      sim.set('eta', EM.fix(f.eta, 3) + ' (mL = ' + EM.fix(f.m * L, 2) + ')');
      sim.set('Q', EM.fix(f.q1 * th, 3) + ' W');
      sim.set('Tt', EM.fix(Ta + th / Math.cosh(f.m * L), 2) + ' °C');
      sim.set('ef', EM.fix((f.q1 * th) / (p.h * Ac * th), 1));
    });
  });

  /* 9.4 Radiación de cuerpo negro */
  const SRC = [[310, 'cuerpo humano'], [1273, 'horno'], [2800, 'bombillo'], [5772, 'Sol']];
  EM.defineSim('radiacion', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('T', { label: 'Temperatura del cuerpo negro', min: 200, max: 8000, step: 1, value: 5772, unit: 'K', log: true, fmt: (v) => v.toFixed(0) });
    sim.out('l', 'Máximo de emisión (Wien)', { hl: true });
    sim.out('E', 'Potencia emitida σT⁴');
    sim.out('v', 'Fracción en el visible (0.4–0.7 µm)');
    sim.out('ir', 'Fracción en el infrarrojo (&gt; 0.7 µm)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0.1, xmax: 100, xlog: true, ymin: 1e-2, ymax: 1e9, ylog: true, xlabel: 'λ (µm)', ylabel: 'E_{bλ} (W/m²·µm)' });
      pl.frame();
      /* banda visible con colores */
      for (let nm = 400; nm < 700; nm += 5) { const c = EM.wavelengthRGB(nm); ctx.fillStyle = 'rgba(' + c.map((x) => Math.round(x * 255)).join(',') + ',0.35)'; ctx.fillRect(pl.X(nm / 1000), pl.iy, pl.X((nm + 5) / 1000) - pl.X(nm / 1000) + 0.5, pl.ih); }
      const E = (lum, T) => Math.PI * TH.planck(lum * 1e-6, T) * 1e-6;
      for (const [T] of SRC) pl.fn((l) => E(l, T), { color: '--grid-2', width: 1.2 });
      for (const [T, n] of SRC) { const lm = (TH.wienB / T) * 1e6; pl.label(lm, E(lm, T), n, { dy: -8, size: 10.5, align: 'center', color: '--ink-3' }); }
      pl.fn((l) => E(l, p.T), { color: '--accent', width: 2.6 });
      const lm = (TH.wienB / p.T) * 1e6;
      /* lugar de Wien */
      pl.fn((l) => E(l, TH.wienB / (l * 1e-6)), { color: '--c1', width: 1, dash: [4, 4] });
      pl.dot(lm, E(lm, p.T), { color: '--accent', r: 5 });
      const fv = TH.bbFrac(0.7e-6, p.T) - TH.bbFrac(0.4e-6, p.T);
      sim.set('l', EM.fix(lm, 4) + ' µm');
      sim.set('E', EM.si(TH.sigma * Math.pow(p.T, 4), 'W/m²'));
      sim.set('v', EM.fix(100 * fv, 2) + ' %');
      sim.set('ir', EM.fix(100 * (1 - TH.bbFrac(0.7e-6, p.T)), 2) + ' %');
    });
  });

  /* 9.5 Muro con ciclo diario (Euler implícito) */
  EM.defineSim('muro-diario', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Material del muro', options: ['adobe', 'bahareque', 'ladrillo', 'concreto', 'yeso', 'madera'].map((k) => [k, MATS[k][0]]), value: 'adobe' });
    sim.slider('e', { label: 'Espesor', min: 2, max: 50, step: 0.5, value: 30, unit: 'cm', fmt: (v) => v.toFixed(1) });
    sim.slider('ins', { label: 'Aislamiento exterior (poliestireno)', min: 0, max: 10, step: 0.5, value: 0, unit: 'cm', fmt: (v) => v.toFixed(1) });
    sim.slider('amp', { label: 'Amplitud de la temperatura exterior', min: 2, max: 15, step: 0.5, value: 8, unit: '°C', fmt: (v) => v.toFixed(1) });
    sim.out('dec', 'Amplitud en la cara interior', { hl: true });
    sim.out('lag', 'Retraso del máximo');
    sim.out('U', 'Transmitancia <i>U</i>');
    const run = (p) => {
      const mat = MATS[p.m], L = p.e / 100, Li = p.ins / 100;
      const nodes = []; const nW = 30, nI = Li > 0 ? 8 : 0;
      for (let i = 0; i < nI; i++) nodes.push({ k: MATS.eps[1], rc: MATS.eps[2] * MATS.eps[3], dx: Li / nI });
      for (let i = 0; i < nW; i++) nodes.push({ k: mat[1], rc: mat[2] * mat[3], dx: L / nW });
      const N = nodes.length, he = 25, hi = 7.7, Tin = 20, dt = 600;
      let T = new Float64Array(N).fill(Tin - 2);
      const surf = [], outT = [];
      const steps = (6 * 86400) / dt;
      const a = new Float64Array(N), b = new Float64Array(N), c = new Float64Array(N), d = new Float64Array(N);
      for (let s = 0; s < steps; s++) {
        const t = (s + 1) * dt, To = 18 + p.amp * Math.sin((2 * Math.PI * (t / 3600 - 9)) / 24);
        for (let i = 0; i < N; i++) {
          const C = (nodes[i].rc * nodes[i].dx) / dt;
          const gl = i === 0 ? 1 / (1 / he + nodes[0].dx / (2 * nodes[0].k)) : 1 / (nodes[i - 1].dx / (2 * nodes[i - 1].k) + nodes[i].dx / (2 * nodes[i].k));
          const gr = i === N - 1 ? 1 / (1 / hi + nodes[i].dx / (2 * nodes[i].k)) : 1 / (nodes[i].dx / (2 * nodes[i].k) + nodes[i + 1].dx / (2 * nodes[i + 1].k));
          a[i] = i === 0 ? 0 : -gl; c[i] = i === N - 1 ? 0 : -gr; b[i] = C + gl + gr;
          d[i] = C * T[i] + (i === 0 ? gl * To : 0) + (i === N - 1 ? gr * Tin : 0);
        }
        for (let i = 1; i < N; i++) { const w = a[i] / b[i - 1]; b[i] -= w * c[i - 1]; d[i] -= w * d[i - 1]; }
        T[N - 1] = d[N - 1] / b[N - 1];
        for (let i = N - 2; i >= 0; i--) T[i] = (d[i] - c[i] * T[i + 1]) / b[i];
        const gN = 1 / (1 / hi + nodes[N - 1].dx / (2 * nodes[N - 1].k));
        const Ts = Tin + (gN * (T[N - 1] - Tin)) / hi;
        if (t > 3 * 86400) { surf.push([(t - 3 * 86400) / 3600, Ts]); outT.push([(t - 3 * 86400) / 3600, To]); }
      }
      const R = 1 / he + 1 / hi + nodes.reduce((a2, n) => a2 + n.dx / n.k, 0);
      return { surf, outT, U: 1 / R };
    };
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const r = run(p);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 0, xmax: 72, ymin: 18 - p.amp - 2, ymax: 18 + p.amp + 2, xlabel: 't (h), tres días', ylabel: 'T (°C)', xticks: [0, 12, 24, 36, 48, 60, 72] });
      pl.frame();
      pl.path(r.outT, { color: '--c2', width: 1.8 });
      pl.path(r.surf, { color: '--accent', width: 2.6 });
      pl.hline(20, { label: 'aire interior 20 °C' });
      pl.legend([{ label: 'aire exterior', color: '--c2' }, { label: 'cara interior del muro', color: '--accent' }], 'tr');
      const last = r.surf.filter((s) => s[0] >= 48), mx = last.reduce((a, s) => (s[1] > a[1] ? s : a), last[0]), mn = last.reduce((a, s) => (s[1] < a[1] ? s : a), last[0]);
      const tmaxOut = 9 + 6 + 48; /* el seno exterior tiene máximo a las 15 h */
      let lag = mx[0] - tmaxOut; while (lag < 0) lag += 24;
      sim.set('dec', '±' + EM.fix((mx[1] - mn[1]) / 2, 2) + ' °C (exterior ±' + p.amp + ' °C)');
      sim.set('lag', EM.fix(lag, 1) + ' h');
      sim.set('U', EM.fix(r.U, 3) + ' W/m²·K');
    });
  });
})();
