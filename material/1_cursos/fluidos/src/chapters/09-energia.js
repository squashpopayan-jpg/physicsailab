/* Capítulo 9 — Energía y máquinas hidráulicas */
(function () {
  'use strict';
  const EM = window.EM, FL = EM.fl, g = FL.g, W = FL.water, RW = 998.2;
  const nu20 = W.nu(293.15);
  /* bomba modelo a 1750 rpm: H = 40 − 4000 Q², η máx 0.78 en 45 L/s, NPSHr = 2 + 1500 Q² */
  const pumpH = (Q, r = 1) => r * r * 40 - 4000 * Q * Q;
  const pumpEta = (Q, r = 1) => Math.max(0.05, 0.78 * (1 - Math.pow((Q - 0.045 * r) / (0.045 * r), 2)));
  const npshR = (Q) => 2 + 1500 * Q * Q;

  /* 9.1 Líneas de energía y piezométrica */
  EM.defineSim('egl-hgl', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Q', { label: 'Caudal', min: 5, max: 120, step: 1, value: 40, unit: 'L/s', fmt: (v) => v.toFixed(0) });
    sim.slider('D', { label: 'Diámetro de la tubería', min: 10, max: 40, step: 1, value: 20, unit: 'cm', fmt: (v) => v.toFixed(0) });
    sim.slider('hc', { label: 'Altura de la cima de la colina', min: 50, max: 120, step: 1, value: 95, unit: 'm', fmt: (v) => v.toFixed(0) });
    sim.check('pump', { label: 'Bomba en x = 300 m', value: false });
    sim.slider('hb', { label: 'Carga de la bomba', min: 0, max: 60, step: 1, value: 30, unit: 'm', fmt: (v) => v.toFixed(0) });
    sim.out('hl', 'Pérdida total por fricción', { hl: true });
    sim.out('B', 'Nivel que alcanzaría el depósito de llegada');
    sim.out('pmin', 'Presión mínima en la tubería (manométrica)');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const L = 2000, D = p.D / 100, Q = p.Q / 1000, A = (Math.PI * D * D) / 4, V = Q / A;
      const r = FL.pipeLoss(Q, D, L, 4.5e-5, nu20, 0), J = r.hf / L, hv = (V * V) / (2 * g);
      const zA = 100;
      const zp = (x) => { const t = x / L; return 70 + (p.hc - 70 + 25 * 0.55) * Math.exp(-Math.pow((t - 0.55) / 0.16, 2)) - 25 * t; }; /* cima a la altura hc */
      const Hx = (x) => zA - 0.5 * hv - J * x + (p.pump && x >= 300 ? p.hb : 0);
      const v = EM.flow.view({ x: 40, y: 10, w: Wc - 50, h: H - 40 }, -150, L + 150, 20, 160, false);
      ctx.fillStyle = EM.alpha('--sand', 0.3); ctx.beginPath(); ctx.moveTo(v.X(-150), v.Y(20));
      for (let x = -150; x <= L + 150; x += 20) ctx.lineTo(v.X(x), v.Y(Math.min(zp(Math.max(0, Math.min(L, x))) - 3, 200)));
      ctx.lineTo(v.X(L + 150), v.Y(20)); ctx.closePath(); ctx.fill();
      EM.flow.waterRect(ctx, v.X(-150), v.Y(zA), v.X(0) - v.X(-150), v.Y(60) - v.Y(zA));
      const zB = Hx(L) - hv; /* pérdida de salida: una carga de velocidad */
      EM.flow.waterRect(ctx, v.X(L), v.Y(Math.max(zB, 30)), v.X(L + 150) - v.X(L), v.Y(30) - v.Y(Math.max(zB, 30)));
      /* tubería coloreada por presión */
      let pmin = Infinity, xm = 0;
      for (let x = 0; x < L; x += 10) {
        const pr = Hx(x + 5) - hv - zp(x + 5);
        if (pr < pmin) { pmin = pr; xm = x; }
        ctx.strokeStyle = pr < 0 ? EM.col('--c2') : EM.col('--ink-2'); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(v.X(x), v.Y(zp(x))); ctx.lineTo(v.X(x + 10), v.Y(zp(x + 10))); ctx.stroke();
      }
      const xs = EM.M.linspace(0, L, 201);
      EM.flow.drawPath(ctx, xs.map((x) => [x, Hx(x)]), v.map, { color: '--c2', width: 2, dash: [6, 4] });
      EM.flow.drawPath(ctx, xs.map((x) => [x, Hx(x) - hv]), v.map, { color: '--c1', width: 2 });
      if (p.pump) { ctx.fillStyle = EM.col('--accent'); ctx.beginPath(); ctx.arc(v.X(300), v.Y(zp(300)), 7, 0, 7); ctx.fill(); EM.text(ctx, 'bomba', v.X(300), v.Y(zp(300)) + 20, { size: 11, align: 'center', color: '--accent' }); }
      sim.legend([{ label: 'línea de energía', color: '--c2', kind: 'dash' }, { label: 'línea piezométrica', color: '--c1' }, { label: 'tubería con presión negativa', color: '--c2' }]);
      sim.set('hl', EM.fix(r.hf, 2) + ' m (V = ' + EM.fix(V, 2) + ' m/s, f = ' + EM.fix(r.f, 4) + ')');
      sim.set('B', EM.fix(zB, 2) + ' m (el de salida está a ' + zA + ' m)');
      sim.set('pmin', EM.fix((pmin * RW * g) / 1000, 1) + ' kPa en x = ' + xm + ' m' + (pmin * RW * g < W.psat(293.15) - 81900 ? ' · cavita' : ''));
    });
  });

  /* 9.2 Bomba y sistema */
  EM.defineSim('bomba-sistema', function (sim) {
    const cv = sim.canvas({ aspect: 1.75 });
    sim.slider('N', { label: 'Velocidad de la bomba', min: 900, max: 2100, step: 10, value: 1750, unit: 'rpm', fmt: (v) => v.toFixed(0) });
    sim.slider('dz', { label: 'Altura estática del sistema', min: 0, max: 35, step: 0.5, value: 15, unit: 'm', fmt: (v) => v.toFixed(1) });
    sim.slider('K', { label: 'Pérdidas menores (válvula) Σ<i>K</i>', min: 0, max: 200, step: 1, value: 5, fmt: (v) => v.toFixed(0) });
    sim.seg('comb', { label: 'Bombas', options: [['1', 'Una'], ['s', 'Dos en serie'], ['p', 'Dos en paralelo']], value: '1' });
    sim.out('Q', 'Punto de operación', { hl: true });
    sim.out('eta', 'Eficiencia de la bomba');
    sim.out('P', 'Potencia consumida');
    sim.out('Ns', 'Velocidad específica ω√<i>Q</i>/(<i>gh</i>)³ᐟ⁴');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h, r = p.N / 1750;
      EM.draw.clear(cv);
      const sys = (Q) => p.dz + FL.pipeLoss(Math.max(Q, 1e-7), 0.15, 200, 4.5e-5, nu20, p.K).h;
      const curve = p.comb === 's' ? (Q) => 2 * pumpH(Q, r) : p.comb === 'p' ? (Q) => pumpH(Q / 2, r) : (Q) => pumpH(Q, r);
      const Qmax = p.comb === 'p' ? 0.24 : 0.12;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: Wc, h: H, xmin: 0, xmax: Qmax * 1000, ymin: 0, ymax: p.comb === 's' ? 100 : 60, xlabel: 'Q (L/s)', ylabel: 'carga (m)' });
      pl.frame();
      pl.fn((q) => pumpH(q / 1000, 1), { color: '--ink-3', width: 1.2, dash: [4, 4] });
      pl.fn((q) => curve(q / 1000), { color: '--accent', width: 2.6 });
      pl.fn((q) => sys(q / 1000), { color: '--c2', width: 2.4 });
      const Qo = FL.bisect((q) => curve(q) - sys(q), 1e-7, Qmax, 1e-12), Ho = sys(Qo);
      const ok = curve(Qo) > 0 && Ho > 0;
      if (ok) pl.dot(Qo * 1000, Ho, { color: '--accent', r: 6.5, label: 'operación' });
      pl.legend([{ label: 'bomba (1750 rpm)', color: '--ink-3', dash: [4, 4] }, { label: 'bomba(s) a la velocidad elegida', color: '--accent' }, { label: 'curva del sistema', color: '--c2' }], 'tr');
      const Qp = p.comb === 'p' ? Qo / 2 : Qo, hp = p.comb === 's' ? Ho / 2 : Ho, eta = pumpEta(Qp, r), n = p.comb === '1' ? 1 : 2;
      const P = (n * RW * g * Qp * hp) / eta;
      sim.set('Q', ok ? EM.fix(Qo * 1000, 1) + ' L/s con ' + EM.fix(Ho, 1) + ' m' : 'la bomba no vence la altura');
      sim.set('eta', ok ? EM.fix(eta * 100, 1) + ' %' : '—');
      sim.set('P', ok ? EM.fix(P / 1000, 2) + ' kW' : '—');
      const w = (p.N * 2 * Math.PI) / 60;
      sim.set('Ns', ok ? EM.fix((w * Math.sqrt(Qp)) / Math.pow(g * hp, 0.75), 3) + ' (radial)' : '—');
    });
  });

  /* 9.3 NPSH */
  EM.defineSim('npsh', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('zs', { label: 'Nivel del agua respecto a la bomba <i>z</i><sub>s</sub>', min: -7, max: 3, step: 0.1, value: -3, unit: 'm', fmt: (v) => v.toFixed(1) });
    sim.slider('z', { label: 'Altitud del lugar', min: 0, max: 4000, step: 10, value: 1760, unit: 'm', fmt: (v) => v.toFixed(0) });
    sim.slider('T', { label: 'Temperatura del agua', min: 5, max: 90, step: 1, value: 20, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.slider('Ds', { label: 'Diámetro de la succión', min: 8, max: 25, step: 1, value: 15, unit: 'cm', fmt: (v) => v.toFixed(0) });
    sim.out('Qm', 'Caudal máximo sin cavitación', { hl: true });
    sim.out('na', 'NPSH disponible con caudal nulo');
    sim.out('pv', 'Presión atmosférica · presión de vapor');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h, T = p.T + 273.15, rho = W.rho(T), Pa = FL.atm(p.z).P, pv = W.psat(T);
      EM.draw.clear(cv);
      const hls = (Q) => FL.pipeLoss(Math.max(Q, 1e-7), p.Ds / 100, 8, 4.5e-5, W.nu(T), 2.5).h;
      const na = (Q) => (Pa - pv) / (rho * g) + p.zs - hls(Q);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: Wc, h: H, xmin: 0, xmax: 120, ymin: 0, ymax: 16, xlabel: 'Q (L/s)', ylabel: 'NPSH (m)' });
      pl.frame();
      pl.fn((q) => na(q / 1000), { color: '--c1', width: 2.6 });
      pl.fn((q) => npshR(q / 1000), { color: '--c2', width: 2.4 });
      let Qm = null;
      if (na(1e-6) > npshR(0)) { Qm = FL.bisect((q) => na(q) - npshR(q), 1e-6, 0.5, 1e-12); pl.dot(Qm * 1000, npshR(Qm), { color: '--accent', r: 6 }); pl.band(Qm * 1000, 120, { color: '--c2', alpha: 0.08 }); }
      pl.legend([{ label: 'NPSH disponible', color: '--c1' }, { label: 'NPSH requerido (bomba modelo)', color: '--c2' }], 'tr');
      sim.set('Qm', Qm === null ? '<span class="warnv">cavita aun sin caudal</span>' : EM.fix(Qm * 1000, 1) + ' L/s');
      sim.set('na', EM.fix(na(1e-7), 2) + ' m');
      sim.set('pv', EM.fix(Pa / 1000, 1) + ' kPa · ' + EM.fix(pv / 1000, 2) + ' kPa');
    });
  });

  /* 9.4 Central hidroeléctrica */
  EM.defineSim('hidroelectrica', function (sim) {
    const cv = sim.canvas({ aspect: 1.8 });
    sim.slider('Hg', { label: 'Salto bruto', min: 20, max: 600, step: 5, value: 200, unit: 'm', fmt: (v) => v.toFixed(0) });
    sim.slider('L', { label: 'Longitud de la tubería de presión', min: 100, max: 5000, step: 50, value: 1000, unit: 'm', fmt: (v) => v.toFixed(0) });
    sim.slider('D', { label: 'Diámetro de la tubería', min: 0.3, max: 3, step: 0.05, value: 1, unit: 'm', fmt: (v) => v.toFixed(2) });
    sim.slider('Q', { label: 'Caudal turbinado', min: 0.1, max: 30, step: 0.05, value: 3, unit: 'm³/s', fmt: (v) => v.toFixed(2) });
    sim.out('P', 'Potencia eléctrica', { hl: true });
    sim.out('Hn', 'Salto neto · pérdida');
    sim.out('opt', 'Máximo: caudal · potencia');
    sim.out('tipo', 'Turbina sugerida');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, Wc = cv.w, H = cv.h, eta = 0.9 * 0.97;
      EM.draw.clear(cv);
      const Hn = (q) => p.Hg - FL.pipeLoss(q, p.D, p.L, 4.5e-5, nu20, 1.5).h, Pw = (q) => eta * RW * g * q * Hn(q);
      let best = 0, qb = 0;
      const qmax = Math.min(60, 1.2 * Math.sqrt(p.Hg / Math.max(1e-9, FL.pipeLoss(1, p.D, p.L, 4.5e-5, nu20, 1.5).h)));
      for (let i = 1; i <= 600; i++) { const q = (qmax * i) / 600, P = Pw(q); if (P > best) { best = P; qb = q; } }
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: Wc, h: H, xmin: 0, xmax: qmax, ymin: 0, ymax: (best / 1e6) * 1.15, xlabel: 'Q (m³/s)', ylabel: 'P (MW)' });
      pl.frame();
      pl.fn((q) => Math.max(0, Pw(q)) / 1e6, { color: '--accent', width: 2.6 });
      pl.fn((q) => (eta * RW * g * q * p.Hg) / 1e6, { color: '--ink-3', width: 1.2, dash: [4, 4] });
      pl.dot(qb, best / 1e6, { color: '--c2', r: 5, label: 'máximo' });
      if (p.Q <= qmax) pl.dot(p.Q, Math.max(0, Pw(p.Q)) / 1e6, { color: '--accent', r: 6 });
      const hn = Hn(p.Q);
      sim.set('P', EM.fix(Math.max(0, Pw(p.Q)) / 1e6, 3) + ' MW');
      sim.set('Hn', EM.fix(hn, 1) + ' m · ' + EM.fix((100 * (p.Hg - hn)) / p.Hg, 1) + ' %');
      sim.set('opt', EM.fix(qb, 2) + ' m³/s · ' + EM.fix(best / 1e6, 2) + ' MW');
      sim.set('tipo', hn > 300 ? 'Pelton (salto grande)' : hn > 30 ? 'Francis' : 'Kaplan o de hélice (salto bajo)');
    });
  });
})();
