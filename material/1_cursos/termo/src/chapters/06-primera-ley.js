/* Capítulo 6 — Primera ley en sistemas cerrados */
(function () {
  'use strict';
  const EM = window.EM, TH = EM.th, D = EM.diag;

  /* 6.1 Ciclo rectangular */
  EM.defineSim('ciclo-primera-ley', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('PL', { label: 'Presión baja', min: 50, max: 400, step: 5, value: 100, unit: 'kPa', fmt: (v) => v.toFixed(0) });
    sim.slider('PH', { label: 'Presión alta', min: 100, max: 1000, step: 5, value: 400, unit: 'kPa', fmt: (v) => v.toFixed(0) });
    sim.slider('V1', { label: 'Volumen menor', min: 0.05, max: 0.5, step: 0.01, value: 0.1, unit: 'm³', fmt: (v) => v.toFixed(2) });
    sim.slider('V2', { label: 'Volumen mayor', min: 0.1, max: 1, step: 0.01, value: 0.4, unit: 'm³', fmt: (v) => v.toFixed(2) });
    sim.seg('dir', { label: 'Sentido', options: [['cw', 'Horario (motor)'], ['ccw', 'Antihorario (refrigerador)']], value: 'cw' });
    sim.out('W', 'Trabajo neto', { hl: true });
    sim.out('Qin', 'Calor recibido · calor cedido');
    sim.out('eta', 'Fracción del calor recibido convertida en trabajo');
    let s = 0;
    sim.animate((dt) => { s = (s + dt * 0.15) % 1; });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const PL = Math.min(p.PL, p.PH - 5), PH = p.PH, V1 = Math.min(p.V1, p.V2 - 0.01), V2 = p.V2, f = 2.5; /* c_v/R diatómico */
      let corners = [[V1, PL], [V1, PH], [V2, PH], [V2, PL]];
      if (p.dir === 'ccw') corners = [[V1, PL], [V2, PL], [V2, PH], [V1, PH]];
      const legs = [];
      for (let i = 0; i < 4; i++) {
        const [Va, Pa] = corners[i], [Vb, Pb] = corners[(i + 1) % 4];
        const W = Pa === Pb ? Pa * (Vb - Va) : 0, dU = f * (Pb * Vb - Pa * Va);
        legs.push({ W, dU, Q: dU + W, name: (Va === Vb ? 'isocórico' : 'isobárico') + (Va === Vb ? (Pb > Pa ? ' ↑' : ' ↓') : Vb > Va ? ' →' : ' ←') });
      }
      const pw = Wc * 0.55;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: pw, h: H, xmin: 0, xmax: 1.05, ymin: 0, ymax: 1050, xlabel: 'V (m³)', ylabel: 'P (kPa)' });
      pl.frame();
      ctx.fillStyle = EM.alpha(p.dir === 'cw' ? '--accent' : '--c1', 0.15);
      ctx.fillRect(pl.X(V1), pl.Y(PH), pl.X(V2) - pl.X(V1), pl.Y(PL) - pl.Y(PH));
      const path = corners.concat([corners[0]]);
      pl.path(path, { color: p.dir === 'cw' ? '--accent' : '--c1', width: 2.6 });
      corners.forEach(([V, P], i) => pl.dot(V, P, { color: '--ink', r: 3.5, label: String(i + 1) }));
      /* punto móvil */
      const k = Math.floor(s * 4), t = s * 4 - k, [Va, Pa] = corners[k], [Vb, Pb] = corners[(k + 1) % 4];
      pl.dot(Va + (Vb - Va) * t, Pa + (Pb - Pa) * t, { color: '--c3', r: 6 });
      /* tabla */
      const x0 = pw + 10, cols = [x0, x0 + 96, x0 + 150, x0 + 204];
      const y0 = 30;
      ['tramo', 'Q (kJ)', 'W (kJ)', 'ΔU (kJ)'].forEach((h, i) => EM.text(ctx, h, cols[i] + (i ? 48 : 0), y0, { size: 11.5, color: '--ink-2', align: i ? 'right' : 'left' }));
      let sQ = 0, sW = 0, sU = 0, Qin = 0, Qout = 0;
      legs.forEach((L, i) => {
        const y = y0 + 24 * (i + 1);
        EM.text(ctx, i + 1 + '→' + (((i + 1) % 4) + 1) + ' ' + L.name, cols[0], y, { size: 10.5, color: '--ink' });
        [L.Q, L.W, L.dU].forEach((v, j) => EM.text(ctx, EM.fix(v, 1), cols[j + 1] + 48, y, { size: 10.5, mono: true, align: 'right', color: v > 0 ? '--c2' : v < 0 ? '--c1' : '--ink-3' }));
        sQ += L.Q; sW += L.W; sU += L.dU; if (L.Q > 0) Qin += L.Q; else Qout -= L.Q;
      });
      const y = y0 + 24 * 5 + 4;
      ctx.fillStyle = EM.col('--rule'); ctx.fillRect(cols[0], y - 16, 252, 1);
      EM.text(ctx, 'ciclo', cols[0], y, { size: 11.5, color: '--ink' });
      [sQ, sW, sU].forEach((v, j) => EM.text(ctx, EM.fix(Math.abs(v) < 1e-9 ? 0 : v, 1), cols[j + 1] + 48, y, { size: 11.5, mono: true, align: 'right', color: '--ink' }));
      EM.text(ctx, 'gas ideal diatómico, c_v = 5R/2', cols[0], y + 28, { size: 10.5, color: '--ink-3' });
      sim.set('W', EM.fix(sW, 2) + ' kJ' + (sW > 0 ? ' entregado' : ' recibido'));
      sim.set('Qin', EM.fix(Qin, 1) + ' kJ · ' + EM.fix(Qout, 1) + ' kJ');
      sim.set('eta', p.dir === 'cw' ? EM.fix((100 * sW) / Qin, 1) + ' %' : 'COP de refrigeración = ' + EM.fix(legs.filter((L) => L.Q > 0).reduce((a, L) => a + L.Q, 0) / -sW, 2));
    });
  });

  /* 6.2 Calor específico variable */
  const GAS = { aire: ['Aire', (T) => TH.cpAire(T), (T) => TH.dhAire(T)], N2: ['Nitrógeno', (T) => (TH.cpMol('N2', T) / 28.0134) * 1e3, (T) => (TH.dhMol('N2', T) / 28.0134) * 1e3], CO2: ['Dióxido de carbono', (T) => (TH.cpMol('CO2', T) / 44.0095) * 1e3, (T) => (TH.dhMol('CO2', T) / 44.0095) * 1e3], H2O: ['Vapor de agua (gas ideal)', (T) => (TH.cpMol('H2O', T) / 18.0153) * 1e3, (T) => (TH.dhMol('H2O', T) / 18.0153) * 1e3] };
  EM.defineSim('cp-variable', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('g', { label: 'Gas', options: Object.entries(GAS).map(([k, v]) => [k, v[0]]), value: 'aire' });
    sim.slider('T1', { label: 'Temperatura inicial', min: 250, max: 2500, step: 5, value: 300, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.slider('T2', { label: 'Temperatura final', min: 250, max: 2500, step: 5, value: 1000, unit: 'K', fmt: (v) => v.toFixed(0) });
    sim.out('dh', 'Δ<i>h</i> con <i>c<sub>p</sub></i>(<i>T</i>)', { hl: true });
    sim.out('c1', 'Con <i>c<sub>p</sub></i> a 300 K (error)');
    sim.out('cm', 'Con <i>c<sub>p</sub></i> a la temperatura media (error)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, [, cp, dh] = GAS[p.g];
      EM.draw.clear(cv);
      const lo = Math.min(p.T1, p.T2), hi = Math.max(p.T1, p.T2);
      const ymax = cp(2500) * 1.1 / 1e3;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 250, xmax: 2500, ymin: 0, ymax, xlabel: 'T (K)', ylabel: 'c_p (kJ/kg·K)' });
      pl.frame();
      pl.fn((T) => cp(T) / 1e3, { color: '--accent', width: 2.6 });
      pl.fn((T) => (T >= lo && T <= hi ? cp(T) / 1e3 : NaN), { color: '--accent', width: 0, fill: '--accent', fillAlpha: 0.2, base: 0 });
      pl.hline(cp(300) / 1e3, { color: '--c1', label: 'c_p(300 K)' });
      const ex = dh(p.T2) - dh(p.T1), c300 = cp(300) * (p.T2 - p.T1), cm = cp((p.T1 + p.T2) / 2) * (p.T2 - p.T1);
      const err = (v) => (Math.abs(ex) < 1e-9 ? '' : ' (' + EM.fix((100 * (v - ex)) / ex, 2) + ' %)');
      sim.set('dh', EM.fix(ex / 1e3, 2) + ' kJ/kg (área sombreada)');
      sim.set('c1', EM.fix(c300 / 1e3, 2) + ' kJ/kg' + err(c300));
      sim.set('cm', EM.fix(cm / 1e3, 2) + ' kJ/kg' + err(cm));
    });
  });

  /* 6.3 Pistón con agua a presión constante */
  EM.defineSim('piston-agua', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('P', { label: 'Presión (peso del pistón + atmósfera)', min: 50, max: 5000, step: 5, value: 200, unit: 'kPa', log: true, fmt: (v) => v.toFixed(0) });
    sim.slider('m', { label: 'Masa de agua', min: 0.1, max: 5, step: 0.1, value: 2, unit: 'kg', fmt: (v) => v.toFixed(1) });
    sim.slider('T2', { label: 'Temperatura final', min: 26, max: 600, step: 1, value: 300, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.out('st', 'Estado final', { hl: true });
    sim.out('Q', 'Calor <i>Q</i> = <i>m</i>Δ<i>h</i>');
    sim.out('W', 'Trabajo de frontera <i>P</i>Δ<i>V</i>');
    sim.out('U', 'Δ<i>U</i>');
    sim.out('V', 'Volumen inicial → final');
    const W = TH.agua;
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const P = p.P * 1e3, s1 = W.state(P, { T: 298.15 }), s2 = W.state(P, { T: p.T2 + 273.15 });
      const Q = p.m * (s2.h - s1.h), Wb = p.m * P * (s2.v - s1.v), dU = p.m * (s2.u - s1.u);
      /* curva T vs Q a lo largo de la isóbara */
      const Ts = W.Tsat(P), pts = [];
      for (let i = 0; i <= 60; i++) { const T = 298.15 + (Math.min(Ts, p.T2 + 273.15) - 298.15) * (i / 60); pts.push([(p.m * (W.state(P, { T: Math.min(T, Ts - 1e-6) }).h - s1.h)) / 1e3, T - 273.15]); }
      if (p.T2 + 273.15 > Ts) {
        const g = W.state(P, { x: 1 }); pts.push([(p.m * (g.h - s1.h)) / 1e3, Ts - 273.15]);
        for (let i = 1; i <= 40; i++) { const T = Ts + (p.T2 + 273.15 - Ts) * (i / 40); pts.push([(p.m * (W.sup(P, T).h - s1.h)) / 1e3, T - 273.15]); }
      }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: Wc * 0.7, h: H, xmin: 0, xmax: Math.max(10, (p.m * (W.sup(P, 873.15).h - s1.h)) / 1e3), ymin: 0, ymax: 620, xlabel: 'calor añadido Q (kJ)', ylabel: 'T (°C)' });
      pl.frame();
      pl.path(pts, { color: '--accent', width: 2.6 });
      pl.hline(Ts - 273.15, { color: '--c1', label: 'T_{sat} = ' + EM.fix(Ts - 273.15, 1) + ' °C' });
      pl.dot(Q / 1e3, p.T2, { color: '--accent', r: 6 });
      /* cilindro */
      const cx = Wc * 0.72 + 30, cw = Wc * 0.2, top = 20, bot = H - 20;
      const frac = Math.min(1, Math.log10(s2.v / s1.v + 1) / Math.log10(W.sup(50e3, 873.15).v / 0.001 + 1));
      const yP = bot - 20 - (bot - top - 40) * frac;
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx, bot); ctx.lineTo(cx + cw, bot); ctx.lineTo(cx + cw, top); ctx.stroke();
      const liq = s2.x === null ? (s2.fase.startsWith('líquido') ? 1 : 0) : ((1 - s2.x) * W.satP(P).vf) / s2.v;
      ctx.fillStyle = EM.alpha('--c1', 0.15); ctx.fillRect(cx + 2, yP + 10, cw - 4, bot - yP - 10);
      ctx.fillStyle = EM.alpha('--c1', 0.55); ctx.fillRect(cx + 2, bot - Math.max(2, (bot - yP - 10) * liq), cw - 4, Math.max(2, (bot - yP - 10) * liq));
      ctx.fillStyle = EM.col('--ink-3'); ctx.fillRect(cx + 1, yP, cw - 2, 10);
      EM.text(ctx, 'altura ∝ log V', cx + cw / 2, bot + 14, { size: 10, align: 'center', color: '--ink-3' });
      sim.set('st', s2.fase + (s2.x !== null && s2.x !== undefined ? ' (x = ' + EM.fix(s2.x, 3) + ')' : ''));
      sim.set('Q', EM.fix(Q / 1e3, 1) + ' kJ');
      sim.set('W', EM.fix(Wb / 1e3, 1) + ' kJ');
      sim.set('U', EM.fix(dU / 1e3, 1) + ' kJ');
      sim.set('V', EM.sci(p.m * s1.v, 3) + ' → ' + EM.sci(p.m * s2.v, 3) + ' m³');
    });
  });

  /* 6.4 Expansión libre */
  const VG = { He: ['Helio', 0.00346, 12.47], N2: ['Nitrógeno', 0.137, 20.8], CH4: ['Metano', 0.2303, 27.4], CO2: ['Dióxido de carbono', 0.3657, 28.9] };
  EM.defineSim('expansion-libre', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('g', { label: 'Gas real (van der Waals)', options: Object.entries(VG).map(([k, v]) => [k, v[0]]), value: 'CO2' });
    sim.slider('v1', { label: 'Volumen molar inicial', min: 0.2, max: 25, step: 0.1, value: 1, unit: 'L/mol', log: true, fmt: (v) => v.toFixed(1) });
    sim.button('Abrir la válvula', () => { open = true; }, { primary: true });
    sim.resetButton(() => reset());
    sim.out('T', 'Temperatura cinética de la simulación', { hl: true });
    sim.out('dT', 'Δ<i>T</i> del gas real al duplicar el volumen');
    sim.out('S', 'Entropía generada (gas ideal)');
    let g, open = false;
    const reset = () => { g = new EM.GasBox({ N: 160, r: 0.008, W: 0.5, H: 1, T: 1 }); open = false; };
    reset();
    sim.animate((dt) => { if (!(dt > 0)) return; if (open && g.W < 1) g.W = 1; for (let k = 0; k < 6; k++) g.step(Math.min(dt, 0.03) / 6 * 0.5); });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const side = H - 24, bx = 12, by = 12, bw = side * 1.6;
      ctx.strokeStyle = EM.col('--ink-2'); ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, side);
      if (!open) { ctx.fillStyle = EM.col('--ink-3'); ctx.fillRect(bx + bw / 2 - 2, by, 4, side); }
      else { ctx.strokeStyle = EM.alpha('--ink-3', 0.4); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(bx + bw / 2, by); ctx.lineTo(bx + bw / 2, by + side); ctx.stroke(); ctx.setLineDash([]); }
      g.draw(ctx, bx, by, bw * g.W, side, { speedColor: true, Tref: 1 });
      if (!open) EM.text(ctx, 'vacío', bx + bw * 0.75, by + side / 2, { size: 13, align: 'center', color: '--ink-3' });
      let nl = 0; for (let i = 0; i < g.N; i++) if (g.x[i] < 0.5) nl++;
      EM.text(ctx, 'izquierda ' + nl + ' · derecha ' + (g.N - nl), bx + bw / 2, by + side + 10, { size: 11, align: 'center', color: '--ink-2', baseline: 'top' });
      const [, a, cvm] = VG[p.g], v1 = p.v1 * 1e-3, dT = -(a / cvm) * (1 / v1 - 1 / (2 * v1));
      EM.text(ctx, VG[p.g][0] + ': ΔT = ' + EM.fix(dT, 2) + ' K', bx + bw + 20, by + 30, { size: 13, color: '--accent' });
      EM.text(ctx, 'gas ideal: ΔT = 0', bx + bw + 20, by + 54, { size: 13, color: '--c3' });
      sim.set('T', EM.fix(g.Tkin(), 3) + ' (unidades reducidas)');
      sim.set('dT', EM.fix(dT, 3) + ' K (a = ' + a + ' Pa·m⁶/mol², c̄_v = ' + cvm + ' J/mol·K)');
      sim.set('S', 'ΔS = nR ln 2 = ' + EM.fix(TH.R * Math.log(2), 3) + ' J/K por mol');
    });
  });
})();
