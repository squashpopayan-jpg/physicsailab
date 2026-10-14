/* Capítulo 21 — Dieléctricos, ferroeléctricos y piezoeléctricos */
(function () {
  'use strict';
  const EM = window.EM, MAT = EM.mat, M = EM.M;
  const e0 = 8.8541878128e-12;

  /* ======================================================================
     21.1 Condensador
     ====================================================================== */
  const DI = { vac: ['Vacío', 1, Infinity], pe: ['Polietileno', 2.3, 19], ptfe: ['PTFE', 2.1, 18], ps: ['Poliestireno', 2.6, 20], nylon: ['Nailon 6,6', 3.6, 16], silica: ['Sílice fundida', 3.8, 10], mica: ['Mica', 6, 60], glass: ['Vidrio sílice-sosa-cal', 6.9, 10], al2o3: ['Alúmina', 9.8, 15], bto: ['Titanato de bario', 1700, 5] };
  EM.defineSim('capacitor', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.select('m', { label: 'Dieléctrico', options: Object.entries(DI).map(([k, v]) => [k, v[0] + ' (ε_r = ' + v[1] + ')']), value: 'glass' });
    sim.slider('A', { label: 'Área <i>A</i>', min: 1, max: 100, step: 0.05, value: 6.45, unit: 'cm²', fmt: (v) => EM.fix(v, 2) });
    sim.slider('l', { label: 'Separación <i>l</i>', min: 0.05, max: 5, step: 0.05, value: 2, unit: 'mm', fmt: (v) => EM.fix(v, 2) });
    sim.slider('V', { label: 'Voltaje <i>V</i>', min: 0, max: 60000, step: 10, value: 10, unit: 'V', log: false, fmt: (v) => v.toFixed(0) });
    sim.out('C', 'Capacitancia', { hl: true });
    sim.out('Q', 'Carga libre en las placas');
    sim.out('P', 'Polarización <i>P</i> y desplazamiento <i>D</i>');
    sim.out('br', 'Campo frente a la rigidez dieléctrica');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const [, er, ds] = DI[p.m];
      const A = p.A * 1e-4, l = p.l * 1e-3, C = (er * e0 * A) / l, Q = C * p.V, E = p.V / l, P = e0 * (er - 1) * E, D = er * e0 * E;
      const broken = E / 1e6 > ds;
      /* dibujo */
      const x0 = W * 0.1, x1 = W * 0.6, yt = H * 0.2, yb = H * 0.8;
      ctx.fillStyle = EM.col('--ink-2'); ctx.fillRect(x0, yt - 8, x1 - x0, 8); ctx.fillRect(x0, yb, x1 - x0, 8);
      ctx.fillStyle = EM.alpha(er > 1 ? '--c4' : '--canvas', er > 1 ? 0.18 : 0); ctx.fillRect(x0 + 6, yt + 6, x1 - x0 - 12, yb - yt - 12);
      const nfree = Math.min(30, Math.round(4 + 26 * Math.min(1, (Q / Math.max(1e-30, (DI.bto[1] * e0 * A) / l / 1)) * 1e3)));
      for (let k = 0; k < 12; k++) { const x = x0 + 12 + (k * (x1 - x0 - 24)) / 11; EM.text(ctx, '+', x, yt - 12, { size: 13, color: '--c2', align: 'center', weight: 700 }); EM.text(ctx, '−', x, yb + 24, { size: 13, color: '--c1', align: 'center', weight: 700 }); }
      void nfree;
      if (er > 1) {
        const amp = Math.min(1, Math.log10(er) / 3.3);
        for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) {
          const cx = x0 + 30 + (i * (x1 - x0 - 60)) / 5, cy = yt + 30 + (j * (yb - yt - 60)) / 3;
          ctx.save(); ctx.translate(cx, cy);
          ctx.fillStyle = EM.alpha('--c1', 0.6); ctx.beginPath(); ctx.ellipse(0, 4 * amp, 7, 7, 0, 0, 7); ctx.fill();
          ctx.fillStyle = EM.alpha('--c2', 0.6); ctx.beginPath(); ctx.ellipse(0, -4 * amp, 7, 7, 0, 0, 7); ctx.fill();
          ctx.restore();
        }
      }
      if (broken) EM.text(ctx, '¡RUPTURA DIELÉCTRICA!', (x0 + x1) / 2, (yt + yb) / 2, { size: 16, weight: 800, color: '--c2', align: 'center', halo: true });
      EM.text(ctx, 'dipolos inducidos (exagerados)', (x0 + x1) / 2, H - 4, { size: 10.5, color: '--ink-3', align: 'center' });
      /* barra campo vs rigidez */
      const bx = W * 0.7, bw = W * 0.25;
      const frac = isFinite(ds) ? Math.min(1.2, E / 1e6 / ds) : 0;
      ctx.fillStyle = EM.alpha('--grid-2', 0.6); ctx.fillRect(bx, H * 0.3, bw, 22);
      ctx.fillStyle = EM.col(frac > 1 ? '--c2' : '--c3'); ctx.fillRect(bx, H * 0.3, Math.min(1, frac) * bw, 22);
      EM.text(ctx, 'campo / rigidez', bx, H * 0.3 - 8, { size: 11, color: '--ink-2' });
      sim.set('C', EM.si(C, 'F'));
      sim.set('Q', EM.si(Q, 'C') + ' (vacío: ' + EM.si(Q / er, 'C') + ')');
      sim.set('P', EM.sci(P, 3) + ' C/m² · ' + EM.sci(D, 3) + ' C/m²');
      sim.set('br', EM.fix(E / 1e6, 3) + ' kV/mm' + (isFinite(ds) ? ' de ' + ds + ' kV/mm' : ''));
    });
  });

  /* ======================================================================
     21.2 Dispersión dieléctrica
     ====================================================================== */
  EM.defineSim('dielectric-dispersion', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('Do', { label: 'Aporte de orientación Δε<sub>or</sub>', min: 0, max: 80, step: 1, value: 40, fmt: (v) => v.toFixed(0) });
    sim.slider('lt', { label: 'log₁₀ τ de orientación (s)', min: -12, max: -3, step: 0.1, value: -9, fmt: (v) => EM.fix(v, 1) });
    sim.slider('Di', { label: 'Aporte iónico Δε<sub>ion</sub>', min: 0, max: 10, step: 0.1, value: 3, fmt: (v) => EM.fix(v, 1) });
    sim.slider('ninf', { label: 'Índice de refracción óptico <i>n</i>', min: 1, max: 2.6, step: 0.01, value: 1.5, fmt: (v) => EM.fix(v, 2) });
    sim.out('st', 'ε<sub>r</sub> estática', { hl: true });
    sim.out('opt', 'ε<sub>r</sub> óptica = n²');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx;
      EM.draw.clear(cv);
      const tau = Math.pow(10, p.lt), wi = 2 * Math.PI * 1e13, we = 2 * Math.PI * 2e15, gi = 0.08 * wi, ge = 0.08 * we;
      const einf = 1, De = p.ninf * p.ninf - 1;
      const eps = (w) => {
        let re = einf, im = 0;
        const d = MAT.debyeRelax(p.Do, 0, w, tau); re += d.er1; im += d.er2;
        for (const [D, w0, g] of [[p.Di, wi, gi], [De, we, ge]]) { const a = w0 * w0 - w * w, b = g * w, den = a * a + b * b; re += (D * w0 * w0 * a) / den; im += (D * w0 * w0 * b) / den; }
        return [re, im];
      };
      const fs = M.linspace(0, 17, 900).map((q) => Math.pow(10, q));
      const vals = fs.map((f) => eps(2 * Math.PI * f));
      const ymax = Math.max(8, 1 + p.Do + p.Di + De) * 1.2;
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: cv.w, h: cv.h, xmin: 1, xmax: 1e17, ymin: 0, ymax, xlog: true, xlabel: 'frecuencia (Hz)', ylabel: "ε_r', ε_r''", ml: 46 });
      pl.frame();
      pl.xy(fs, vals.map((v) => M.clamp(v[0], -2, ymax)), { color: '--accent', width: 2.4 });
      pl.xy(fs, vals.map((v) => Math.min(ymax, v[1])), { color: '--c1', width: 1.6 });
      for (const [f, t] of [[1e3, 'audio'], [2.45e9, 'microondas'], [3e13, 'infrarrojo'], [5.5e14, 'visible'], [3e16, 'UV']]) pl.vline(f, { color: '--grid-2', label: t, labelY: 14 });
      pl.legend([{ label: "ε_r' (real)", color: '--accent' }, { label: "ε_r'' (pérdidas)", color: '--c1' }], 'tr');
      sim.set('st', EM.fix(1 + p.Do + p.Di + De, 2));
      sim.set('opt', EM.fix(p.ninf * p.ninf, 3));
    });
  });

  /* ======================================================================
     21.3 Ferroeléctrico (Landau)
     ====================================================================== */
  EM.defineSim('ferroelectric', function (sim) {
    const cv = sim.canvas({ aspect: 2.0 });
    sim.slider('T', { label: 'Temperatura', min: 20, max: 200, step: 1, value: 60, unit: '°C', fmt: (v) => v.toFixed(0) });
    sim.slider('E', { label: 'Campo aplicado (relativo)', min: -1.5, max: 1.5, step: 0.01, value: 0, fmt: (v) => EM.fix(v, 2) });
    sim.check('auto', { label: 'Barrer el campo automáticamente', value: true });
    sim.out('Ps', 'Polarización espontánea <i>P<sub>s</sub></i> (relativa)', { hl: true });
    sim.out('Ec', 'Campo coercitivo de Landau (relativo)');
    sim.out('chi', 'Susceptibilidad χ = 1/G″ (unidades relativas)');
    const Tc = 120, a0 = 1 / 100, b = 1;
    let P = 0.8, Edyn = 0, ph = 0, trail = [];
    sim.onChange = (id) => { if (id === 'T') trail = []; };
    sim.animate((dt) => {
      if (sim.p.auto) { ph += dt * 0.5; Edyn = 1.2 * Math.sin(ph); } else Edyn = sim.p.E * 1;
      const al = a0 * (sim.p.T - Tc);
      const Escale = Math.max(1e-6, (2 / (3 * Math.sqrt(3))) * Math.abs(Math.min(-0.05, al)) * Math.sqrt(Math.abs(Math.min(-0.05, al)) / b)) * 1.0;
      const Ee = Edyn * Escale;
      for (let k = 0; k < 40; k++) P -= 0.05 * (al * P + b * P * P * P - Ee);
      trail.push([Edyn, P]); if (trail.length > 400) trail.shift();
    });
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const al = a0 * (p.T - Tc);
      const Ps = al < 0 ? Math.sqrt(-al / b) : 0;
      const Escale = Math.max(1e-6, (2 / (3 * Math.sqrt(3))) * Math.abs(Math.min(-0.05, al)) * Math.sqrt(Math.abs(Math.min(-0.05, al)) / b));
      const Ee = Edyn * Escale;
      const G = (x) => 0.5 * al * x * x + 0.25 * b * x ** 4 - Ee * x;
      const Pm = 1.4;
      const gv = M.linspace(-Pm, Pm, 200).map(G);
      const pl = new EM.Plot(ctx, { x: 0, y: 0, w: W * 0.48, h: H, xmin: -Pm, xmax: Pm, ymin: Math.min(...gv) - 0.02, ymax: Math.max(0.15, Math.min(...gv) + 0.4), xlabel: 'P (relativa)', ylabel: 'G(P)', ml: 46, yticks: [] });
      pl.frame();
      pl.fn(G, { color: '--accent', width: 2.4 });
      pl.dot(P, G(P), { color: '--c2', r: 7 });
      const ph2 = new EM.Plot(ctx, { x: W * 0.5, y: 0, w: W * 0.5, h: H, xmin: -1.5, xmax: 1.5, ymin: -1.4, ymax: 1.4, xlabel: 'campo (relativo a E_c)', ylabel: 'P', ml: 40 });
      ph2.frame();
      if (trail.length > 1) ph2.xy(trail.map((q) => q[0]), trail.map((q) => q[1]), { color: '--c1', width: 2 });
      ph2.dot(Edyn, P, { color: '--c2' });
      const chi = al > 0 ? 1 / al : 1 / (2 * -al);
      sim.set('Ps', EM.fix(Ps, 3) + (p.T >= Tc ? ' (fase paraeléctrica, T > T_c = 120 °C)' : ''));
      sim.set('Ec', al < 0 ? EM.fix((2 / (3 * Math.sqrt(3))) * -al * Ps, 4) : '—');
      sim.set('chi', EM.fix(chi, 1) + ' (diverge en T_c)');
    });
  });

  /* ======================================================================
     21.4 Piezoeléctrico
     ====================================================================== */
  const PZ = { quartz: ['Cuarzo', 2.3, 4.5], bto: ['Titanato de bario', 190, 1700], pzt: ['PZT', 400, 1800], pvdf: ['PVDF (polímero)', 30, 12] };
  EM.defineSim('piezo', function (sim) {
    const cv = sim.canvas({ aspect: 2.2 });
    sim.select('m', { label: 'Material', options: Object.entries(PZ).map(([k, v]) => [k, v[0] + ' (d = ' + v[1] + ' pC/N)']), value: 'pzt' });
    sim.slider('F', { label: 'Fuerza aplicada', min: 0, max: 3000, step: 10, value: 1000, unit: 'N', fmt: (v) => v.toFixed(0) });
    sim.slider('D', { label: 'Diámetro del disco', min: 1, max: 30, step: 0.5, value: 5, unit: 'mm', fmt: (v) => EM.fix(v, 1) });
    sim.slider('t', { label: 'Espesor', min: 0.2, max: 20, step: 0.1, value: 5, unit: 'mm', fmt: (v) => EM.fix(v, 1) });
    sim.slider('V', { label: 'Voltaje aplicado (efecto inverso)', min: 0, max: 2000, step: 10, value: 1000, unit: 'V', fmt: (v) => v.toFixed(0) });
    sim.out('Q', 'Carga generada <i>Q</i> = <i>dF</i>', { hl: true });
    sim.out('Vo', 'Voltaje en circuito abierto <i>Q</i>/<i>C</i>');
    sim.out('dl', 'Alargamiento por el voltaje aplicado <i>d V</i>');
    sim.onDraw(() => {
      const p = sim.p, ctx = cv.ctx, W = cv.w, H = cv.h;
      EM.draw.clear(cv);
      const [, d, er] = PZ[p.m];
      const A = Math.PI * Math.pow((p.D * 1e-3) / 2, 2), C = (er * e0 * A) / (p.t * 1e-3);
      const Q = d * 1e-12 * p.F, Vo = Q / C, dl = d * 1e-12 * p.V;
      const cx = W * 0.25, cy = H * 0.55, w = Math.min(W * 0.3, p.D * 8 + 40), h = Math.min(H * 0.5, p.t * 8 + 20);
      ctx.fillStyle = EM.alpha('--c4', 0.4); ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
      ctx.fillStyle = EM.col('--ink-2'); ctx.fillRect(cx - w / 2, cy - h / 2 - 5, w, 5); ctx.fillRect(cx - w / 2, cy + h / 2, w, 5);
      EM.draw.arrow(ctx, cx, cy - h / 2 - 50, cx, cy - h / 2 - 8, { color: '--c1', width: 3 });
      EM.text(ctx, 'F', cx + 8, cy - h / 2 - 34, { size: 14, italic: true, color: '--c1' });
      for (let k = 0; k < 6; k++) { EM.text(ctx, '+', cx - w / 2 + 8 + k * (w - 16) / 5, cy - h / 2 + 14, { size: 12, color: '--c2', align: 'center', weight: 700 }); EM.text(ctx, '−', cx - w / 2 + 8 + k * (w - 16) / 5, cy + h / 2 - 4, { size: 12, color: '--c1', align: 'center', weight: 700 }); }
      /* barras comparativas */
      const pl = new EM.Plot(ctx, { x: W * 0.5, y: 0, w: W * 0.5, h: H, xmin: 0, xmax: 4, ymin: 0, ymax: 1.15, xlabel: '', ylabel: 'relativo al máximo', yticks: [], xticks: [], ml: 20, mb: 30 });
      pl.frame();
      const vs = Object.entries(PZ).map(([k, [, dd, e]]) => { const Cc = (e * e0 * A) / (p.t * 1e-3); return [k, dd * 1e-12 * p.F, (dd * 1e-12 * p.F) / Cc]; });
      const mq = Math.max(...vs.map((v) => v[1])), mv = Math.max(...vs.map((v) => v[2]));
      vs.forEach(([k, q, v], i) => {
        ctx.fillStyle = EM.alpha('--c1', k === p.m ? 0.9 : 0.4); ctx.fillRect(pl.X(i + 0.15), pl.Y(q / mq), pl.X(i + 0.48) - pl.X(i + 0.15), pl.Y(0) - pl.Y(q / mq));
        ctx.fillStyle = EM.alpha('--c2', k === p.m ? 0.9 : 0.4); ctx.fillRect(pl.X(i + 0.52), pl.Y(v / mv), pl.X(i + 0.85) - pl.X(i + 0.52), pl.Y(0) - pl.Y(v / mv));
        EM.text(ctx, PZ[k][0].split(' ')[0], pl.X(i + 0.5), pl.Y(0) + 16, { size: 10.5, align: 'center', color: '--ink-2' });
      });
      pl.legend([{ label: 'carga', color: '--c1', kind: 'sq' }, { label: 'voltaje', color: '--c2', kind: 'sq' }], 'tr');
      sim.set('Q', EM.si(Q, 'C'));
      sim.set('Vo', EM.si(Vo, 'V') + ' (C = ' + EM.si(C, 'F') + ')');
      sim.set('dl', EM.si(dl, 'm'));
    });
  });
})();
